-- ============================================================================
-- CivicPulse: AI-Powered Civic Issue Triage & Action-Tracking Platform
-- PostgreSQL 16 + PostGIS + pgvector Database Schema DDL
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enum Types
CREATE TYPE issue_category_enum AS ENUM (
    'Roads',
    'Water_Sanitation',
    'Electrical_Grid',
    'Public_Safety',
    'Waste',
    'Parks',
    'Other'
);

CREATE TYPE priority_tier_enum AS ENUM (
    'P0_Critical',
    'P1_High',
    'P2_Medium',
    'P3_Low'
);

CREATE TYPE location_confidence_enum AS ENUM (
    'High',
    'Medium',
    'Low'
);

CREATE TYPE incident_status_enum AS ENUM (
    'Received',
    'Triaged',
    'Dispatched',
    'In_Progress',
    'Resolved',
    'Closed_Duplicate',
    'Flagged_Review'
);

CREATE TYPE report_channel_enum AS ENUM (
    'Citizen_Mobile_App',
    'SMS_Text',
    'Voice_Call_Transcript',
    'Social_Media_Twitter_X',
    'Social_Media_Nextdoor',
    '311_Legacy_Feed',
    'City_Worker_Field_App'
);

-- ----------------------------------------------------------------------------
-- 1. Table: RawReports
-- Stores raw, unstructured citizen reports from all multi-modal channels
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel report_channel_enum NOT NULL,
    source_identifier VARCHAR(255), -- e.g. phone hash, Twitter handle, 311 ticket id
    raw_content TEXT NOT NULL,
    cleaned_content TEXT,
    language_code VARCHAR(10) DEFAULT 'en',
    
    -- Extracted Entities
    extracted_category issue_category_enum,
    affected_infrastructure VARCHAR(255),
    urgency_indicators JSONB DEFAULT '[]'::jsonb, -- e.g. ["sparks flying", "flooding"]
    
    -- Geospatial Evidence (Zero Hallucination: only populated if verified)
    address_or_landmark TEXT,
    location_confidence location_confidence_enum NOT NULL DEFAULT 'Low',
    location_geom GEOGRAPHY(Point, 4326), -- PostGIS WGS84 Point (lon, lat)
    
    -- Media Evidence
    media_urls JSONB DEFAULT '[]'::jsonb, -- Array of image/video/audio URLs
    media_analysis JSONB DEFAULT '{}'::jsonb, -- Vision model verification results
    
    -- Semantic Vector Embedding (1536 dims for text-embedding-3-large/small or MiniLM)
    embedding vector(1536),
    
    -- Association to Incident Cluster (nullable until clustered)
    cluster_id UUID,
    
    -- Audit & Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Table: IncidentClusters
-- Deduplicated, clustered physical incidents grouping multiple raw reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_number VARCHAR(64) UNIQUE NOT NULL, -- e.g. INC-2026-08912
    normalized_title VARCHAR(200) NOT NULL,
    category issue_category_enum NOT NULL,
    assigned_department VARCHAR(100) NOT NULL,
    
    -- Physical Location (Calculated spatial centroid / verified landmark)
    address_or_landmark TEXT NOT NULL,
    centroid_geom GEOGRAPHY(Point, 4326) NOT NULL,
    location_confidence location_confidence_enum NOT NULL DEFAULT 'High',
    
    -- Cluster Statistics
    report_count INTEGER NOT NULL DEFAULT 1,
    verified_media_count INTEGER NOT NULL DEFAULT 0,
    velocity_reports_per_hour NUMERIC(6, 2) DEFAULT 1.0,
    
    -- Priority Scoring (0-100 Scale)
    priority_tier priority_tier_enum NOT NULL DEFAULT 'P2_Medium',
    total_priority_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    safety_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,       -- (0 - 40)
    impact_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,       -- (0 - 25)
    corroboration_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,-- (0 - 20)
    urgency_decay_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,-- (0 - 15)
    
    -- Explainable Rationale
    explainable_rationale TEXT NOT NULL,
    key_evidence_quotes JSONB DEFAULT '[]'::jsonb,
    
    -- Citizen Public Status
    citizen_status_message TEXT NOT NULL,
    status incident_status_enum NOT NULL DEFAULT 'Received',
    
    -- Mean Vector Embedding for semantic searches
    centroid_embedding vector(1536),
    
    -- Temporal Boundaries
    first_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key linking RawReports to IncidentClusters
ALTER TABLE raw_reports
    ADD CONSTRAINT fk_raw_reports_cluster
    FOREIGN KEY (cluster_id)
    REFERENCES incident_clusters(id)
    ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. Table: PriorityAuditLogs
-- Immutable ledger recording every prioritization decision, weights, and triggers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS priority_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES incident_clusters(id) ON DELETE CASCADE,
    evaluation_trigger VARCHAR(50) NOT NULL, -- e.g. 'Initial_Ingest', 'New_Report_Added', 'Time_Decay_Recalc', 'Manual_Override'
    
    previous_total_score NUMERIC(5, 2),
    new_total_score NUMERIC(5, 2) NOT NULL,
    previous_tier priority_tier_enum,
    new_tier priority_tier_enum NOT NULL,
    
    -- Detailed Rubric Weights Snapshot
    safety_score NUMERIC(5, 2) NOT NULL,
    safety_factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"hazard_level": "live_electrical", "sparks": true}
    
    impact_score NUMERIC(5, 2) NOT NULL,
    impact_factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"school_within_100m": true, "transit_corridor": true}
    
    corroboration_score NUMERIC(5, 2) NOT NULL,
    corroboration_factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"unique_citizens": 6, "media_verified": 3}
    
    urgency_decay_score NUMERIC(5, 2) NOT NULL,
    urgency_factors JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"elapsed_hours": 3.5, "worsening_rate": "high"}
    
    audit_rationale TEXT NOT NULL,
    evidence_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    model_name VARCHAR(100) NOT NULL, -- e.g. 'gemini-1.5-pro-civic-triage-v2.1'
    evaluated_by VARCHAR(100) DEFAULT 'system_ai_engine',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Table: WorkOrders
-- Actionable work orders dispatched to municipal field crews
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(64) UNIQUE NOT NULL, -- e.g. WO-PWD-2026-4412
    cluster_id UUID NOT NULL REFERENCES incident_clusters(id) ON DELETE CASCADE,
    
    department VARCHAR(100) NOT NULL,
    assigned_division VARCHAR(100), -- e.g. 'Emergency Electrical Line Crew'
    assigned_crew_lead VARCHAR(100),
    
    -- Action Plan
    recommended_first_response TEXT NOT NULL,
    required_equipment JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["Bucket Truck", "High-Voltage PPE", "Traffic Cones"]
    hazard_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- SLA Guarantees
    target_sla_hours NUMERIC(6, 2) NOT NULL,
    sla_deadline TIMESTAMPTZ NOT NULL,
    is_sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status Lifecycle
    status incident_status_enum NOT NULL DEFAULT 'Dispatched',
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    work_started_at TIMESTAMPTZ,
    work_completed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Table: StatusUpdates
-- Bi-directional timeline visible to citizens and dispatchers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES incident_clusters(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    
    previous_status incident_status_enum,
    new_status incident_status_enum NOT NULL,
    
    -- Public Transparency
    public_status_message TEXT NOT NULL,
    internal_notes TEXT,
    
    -- Verified Resolution Evidence
    resolution_photos JSONB DEFAULT '[]'::jsonb,
    verification_method VARCHAR(50), -- e.g. 'Field_Photo_AI_Confirmed', 'Inspector_Signoff'
    
    updated_by_role VARCHAR(50) NOT NULL, -- e.g. 'Dispatcher', 'Field_Crew', 'Automated_SLA_Monitor'
    author_name VARCHAR(100) DEFAULT 'Municipal Action System',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for High Performance Spatiotemporal & Semantic Search
-- ============================================================================

-- Spatial Indexes (PostGIS GiST)
CREATE INDEX IF NOT EXISTS idx_raw_reports_geom 
    ON raw_reports USING GIST (location_geom);

CREATE INDEX IF NOT EXISTS idx_incident_clusters_geom 
    ON incident_clusters USING GIST (centroid_geom);

-- Vector Indexes (pgvector HNSW with Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_raw_reports_embedding_hnsw 
    ON raw_reports USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_incident_clusters_embedding_hnsw 
    ON incident_clusters USING hnsw (centroid_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_raw_reports_cluster_id ON raw_reports(cluster_id);
CREATE INDEX IF NOT EXISTS idx_raw_reports_created_at ON raw_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_reports_category ON raw_reports(extracted_category);

CREATE INDEX IF NOT EXISTS idx_incident_clusters_status ON incident_clusters(status);
CREATE INDEX IF NOT EXISTS idx_incident_clusters_priority ON incident_clusters(priority_tier, total_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_incident_clusters_dept ON incident_clusters(assigned_department);
CREATE INDEX IF NOT EXISTS idx_incident_clusters_reported ON incident_clusters(last_reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_orders_cluster_id ON work_orders(cluster_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_sla ON work_orders(sla_deadline) WHERE status != 'Resolved';

CREATE INDEX IF NOT EXISTS idx_status_updates_cluster ON status_updates(cluster_id, created_at DESC);

-- ============================================================================
-- Utility Trigger for Automatic updated_at Timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_raw_reports_updated_at
    BEFORE UPDATE ON raw_reports
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_incident_clusters_updated_at
    BEFORE UPDATE ON incident_clusters
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

