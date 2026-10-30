-- ============================================================================
-- CivicPulse AI - Supabase Production Database Schema
-- Compatible with Supabase PostgreSQL, PostGIS, and Realtime Engine
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Complaints Master Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'AI Analyzed', 'Assigned', 'In Progress', 'Resolved')),
    priority_tier TEXT NOT NULL DEFAULT 'Medium' CHECK (priority_tier IN ('Critical', 'High', 'Medium', 'Low')),
    priority_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    priority_breakdown JSONB NOT NULL DEFAULT '{"safety": 10, "impact": 10, "corroboration": 5, "decay": 5}'::jsonb,
    priority_rationale TEXT,
    priority_evidence TEXT[] DEFAULT ARRAY[]::TEXT[],
    action_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id TEXT REFERENCES public.complaints(id) ON DELETE SET NULL,
    duplicate_count INT NOT NULL DEFAULT 0,
    related_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    location JSONB NOT NULL DEFAULT '{}'::jsonb,
    coordinates GEOMETRY(Point, 4326),
    has_photo BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url TEXT,
    citizen_name TEXT DEFAULT 'Concerned Citizen',
    citizen_feedback JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Action Notes / Dispatch Timeline Table
CREATE TABLE IF NOT EXISTS public.action_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Geospatial and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority_tier ON public.complaints(priority_tier);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_parent_id ON public.complaints(parent_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_coordinates ON public.complaints USING GIST(coordinates);

-- 5. Auto-Update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_notes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all complaints
CREATE POLICY "Public complaints are viewable by everyone" 
    ON public.complaints FOR SELECT 
    USING (true);

-- Allow public insert access so citizens can file complaints
CREATE POLICY "Anyone can register a complaint" 
    ON public.complaints FOR INSERT 
    WITH CHECK (true);

-- Allow updates (for status and action notes by staff or authenticated users)
CREATE POLICY "Anyone can update complaint status in demo/civic portal" 
    ON public.complaints FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Action notes policies
CREATE POLICY "Action notes are viewable by everyone" 
    ON public.action_notes FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert action notes" 
    ON public.action_notes FOR INSERT 
    WITH CHECK (true);

-- 7. Enable Realtime Broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_notes;

-- 8. Seed Sample Data (Top 5 Key Incidents)
INSERT INTO public.complaints (
    id, title, description, category, department, status, priority_tier, priority_score,
    priority_breakdown, priority_rationale, priority_evidence, action_plan,
    is_duplicate, duplicate_count, location, coordinates, has_photo, photo_url, citizen_name
) VALUES 
(
    'CP-101',
    'Major 18-inch water main burst flooding MG Road commercial market',
    'A high-pressure underground water trunk main has ruptured near Metro Pillar 142. Potable drinking water is gushing out rapidly.',
    'Water Supply Problems',
    'Kalyanpur Water Supply & Sewerage Board (KWSSB)',
    'In Progress',
    'Critical',
    94.0,
    '{"safety": 38, "impact": 24, "corroboration": 18, "decay": 14}'::jsonb,
    'Assigned Critical (94/100) due to severe drinking water trunk line rupture causing active flooding in a major commercial and transit artery.',
    ARRAY['18-inch water trunk rupture', 'flooding basement shops', 'Metro corridor transit standstill'],
    '{"sla_hours": 2, "estimated_budget": "₹1,85,000", "first_response": "Deploy emergency valve isolation crew to shut off sector 4B within 20 mins.", "required_equipment": ["Ductile Iron Clamp Sleeves", "100HP Dewatering Pumps", "Heavy Trench Excavator"]}'::jsonb,
    FALSE,
    2,
    '{"ward": "Ward 12 - Central Business District", "address": "Metro Pillar 142, MG Road Commercial Boulevard"}'::jsonb,
    ST_SetSRID(ST_MakePoint(77.6067, 12.9754), 4326),
    TRUE,
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80',
    'Vikram Malhotra'
),
(
    'CP-104',
    'Live 11kV electrical wire snapped and sparking on pavement near City Hospital',
    'An overhead 11kV distribution line broke during gusty winds and is hanging 2 feet above the pedestrian walkway directly outside Emergency OPD.',
    'Public Safety',
    'Kalyanpur Electricity Supply Corporation (KESCO)',
    'In Progress',
    'Critical',
    98.0,
    '{"safety": 40, "impact": 25, "corroboration": 19, "decay": 14}'::jsonb,
    'Immediate threat to human life. Active high-voltage 11kV arcing directly outside regional hospital emergency bay.',
    ARRAY['11kV live distribution line', 'sparks flying and arcing', 'outside Hospital Emergency OPD'],
    '{"sla_hours": 1, "estimated_budget": "₹85,000", "first_response": "Remote substation breaker trip confirmed on Feeder H-09. Police cordoned 50m radius.", "required_equipment": ["Insulated High-Voltage Bucket Truck", "Arc-Flash 40 cal/cm² PPE", "Dielectric Grounding Clamps"]}'::jsonb,
    FALSE,
    0,
    '{"ward": "Ward 3 - Civil Lines & Health District", "address": "Outside Emergency OPD, District Civil Hospital, Hospital Road"}'::jsonb,
    ST_SetSRID(ST_MakePoint(77.5891, 12.9812), 4326),
    TRUE,
    'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80',
    'Dr. Sunita Kulkarni'
),
(
    'CP-105',
    'Deep open manhole uncovered on school walking route outside DAV Public School',
    'Cast-iron manhole cover is missing. A 10-foot deep stormwater shaft is completely uncovered right on pedestrian footpath.',
    'Drainage Problems',
    'Municipal Public Works Department (PWD - Drainage)',
    'Assigned',
    'Critical',
    93.0,
    '{"safety": 39, "impact": 24, "corroboration": 17, "decay": 13}'::jsonb,
    'Severe life hazard for school children. 10-foot vertical fall risk directly along primary student footpath.',
    ARRAY['uncovered 10-foot deep shaft', 'school walking route', 'DAV Public School hundreds of kids'],
    '{"sla_hours": 2, "estimated_budget": "₹24,500", "first_response": "Place fluorescent barricade and flashing caution strobe immediately. Install heavy-duty SFRC cover with internal mesh.", "required_equipment": ["Reinforced SFRC 25-ton Rated Cover", "Internal Fall-Arrest Mesh Grating"]}'::jsonb,
    FALSE,
    1,
    '{"ward": "Ward 9 - Vidyapeetha Institutional Zone", "address": "Pedestrian Walkway, 50m before DAV Public School Gate, Vidyapeetha Road"}'::jsonb,
    ST_SetSRID(ST_MakePoint(77.5683, 12.9348), 4326),
    TRUE,
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    'Sunil Verma'
)
ON CONFLICT (id) DO NOTHING;
