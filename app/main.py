"""FastAPI Application for CivicPulse AI Triage & Action-Tracking Platform."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import (
    RawReportIngestRequest,
    TriageOutput,
    ClusterSummary,
    PriorityAuditLogResponse,
    CitizenTrackingPortalResponse,
    WorkOrderResponse,
    IncidentStatus
)
from app.services.normalizer import normalizer_service
from app.services.deduplicator import deduplicator_service
from app.services.prioritizer import prioritizer_service
from app.services.router import router_service

app = FastAPI(
    title=settings.app_name,
    description="AI-powered civic issue triage, multi-channel clustering, explainable prioritization, and work order dispatch engine.",
    version="1.0.0"
)

# Enable CORS for web portals and dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint confirming API status and active cluster count."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "environment": settings.environment,
        "active_incident_clusters": len(deduplicator_service.active_clusters),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post(
    "/api/v1/reports/ingest",
    response_model=TriageOutput,
    status_code=status.HTTP_201_CREATED,
    tags=["Ingestion & Triage"],
    summary="Ingest raw citizen report and execute end-to-end triage"
)
async def ingest_report(report_in: RawReportIngestRequest) -> TriageOutput:
    """
    Ingests unstructured citizen input (text, coordinates, media, channel),
    performs zero-hallucination normalization, clusters by spatial geofence & vector embeddings,
    computes explainable 0-100 priority score, routes to municipal department,
    and returns production TriageOutput.
    """
    # 1. Normalization & Zero-Hallucination Entity Extraction
    normalized = normalizer_service.normalize(report_in)

    # 2. Geospatial + Semantic Deduplication & Clustering
    cluster, is_new = deduplicator_service.cluster_report(normalized)

    # 3. Explainable Prioritization Scoring (0-100 scale)
    priority = prioritizer_service.score_cluster(cluster)

    # 4. Routing, Action Plan & Citizen Transparency Messaging
    triage_result = router_service.route_and_generate_output(cluster, priority)

    return triage_result


@app.get(
    "/api/v1/clusters",
    response_model=List[ClusterSummary],
    tags=["Municipal Dashboard"],
    summary="List all clustered incidents with prioritization filters"
)
async def list_clusters(
    category: Optional[str] = Query(None, description="Filter by issue category"),
    priority_tier: Optional[str] = Query(None, description="Filter by tier e.g. P0_Critical"),
    status: Optional[str] = Query(None, description="Filter by status e.g. Received, Dispatched")
):
    """Returns municipal dispatch queue of all deduplicated incident clusters."""
    summaries = []
    for c in deduplicator_service.active_clusters.values():
        if category and c.category != category:
            continue
        if priority_tier and c.priority_tier != priority_tier:
            continue
        if status and c.status != status:
            continue

        summaries.append(
            ClusterSummary(
                cluster_id=c.cluster_id,
                cluster_number=c.cluster_number,
                normalized_title=c.normalized_title,
                category=c.category,  # type: ignore
                assigned_department=c.assigned_department,
                location={
                    "address_or_landmark": c.address_or_landmark,
                    "coordinates": c.coordinates,
                    "location_confidence": c.location_confidence
                },  # type: ignore
                report_count=len(c.reports),
                verified_media_count=c.verified_media_count,
                priority_tier=c.priority_tier,
                total_priority_score=c.total_priority_score,
                status=c.status,
                first_reported_at=c.first_reported_at,
                last_reported_at=c.last_reported_at
            )
        )
    # Sort by total priority score descending
    summaries.sort(key=lambda s: s.total_priority_score, reverse=True)
    return summaries


@app.get(
    "/api/v1/clusters/{cluster_id}",
    response_model=TriageOutput,
    tags=["Municipal Dashboard"],
    summary="Get full cluster triage details"
)
async def get_cluster_details(cluster_id: str):
    """Retrieves full triage output for a specific cluster."""
    cluster = deduplicator_service.active_clusters.get(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Incident cluster not found")

    priority = prioritizer_service.score_cluster(cluster)
    return router_service.route_and_generate_output(cluster, priority)


@app.get(
    "/api/v1/clusters/{cluster_id}/explainability",
    response_model=PriorityAuditLogResponse,
    tags=["Explainability & Audit"],
    summary="Retrieve granular explainability audit trail for a priority score"
)
async def get_cluster_explainability(cluster_id: str):
    """Surfaces transparent mathematical weights and citations behind the priority assignment."""
    cluster = deduplicator_service.active_clusters.get(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Incident cluster not found")

    return PriorityAuditLogResponse(
        id=f"AUD-{cluster.cluster_number}",
        cluster_id=cluster.cluster_id,
        evaluation_trigger="Multi_Channel_Aggregated_Triage",
        previous_total_score=None,
        new_total_score=cluster.total_priority_score,
        previous_tier=None,
        new_tier=cluster.priority_tier,
        safety_score=cluster.safety_score,
        impact_score=cluster.impact_score,
        corroboration_score=cluster.corroboration_score,
        urgency_decay_score=cluster.urgency_decay_score,
        audit_rationale=cluster.explainable_rationale,
        evidence_citations=cluster.key_evidence_quotes,
        model_name=settings.triage_model_name,
        created_at=cluster.last_reported_at
    )


@app.get(
    "/api/v1/tracking/{tracking_id}",
    response_model=CitizenTrackingPortalResponse,
    tags=["Public Transparency Portal"],
    summary="Citizen tracking portal: track resolution progress and accountability"
)
async def citizen_tracking_portal(tracking_id: str):
    """
    Public bi-directional tracking view for citizens.
    Translates municipal telemetry into transparent, accessible citizen updates.
    """
    # Find cluster by cluster_id or cluster_number
    matched_cluster = None
    for c in deduplicator_service.active_clusters.values():
        if c.cluster_id == tracking_id or c.cluster_number.lower() == tracking_id.lower():
            matched_cluster = c
            break

    if not matched_cluster:
        raise HTTPException(status_code=404, detail="Tracking number or incident not found")

    # Build public status timeline
    timeline = [
        {
            "stage": "Received",
            "completed": True,
            "timestamp": matched_cluster.first_reported_at.isoformat(),
            "description": f"Initial report logged via {len(matched_cluster.reports)} citizen submission(s)."
        },
        {
            "stage": "Triaged",
            "completed": True,
            "timestamp": matched_cluster.first_reported_at.isoformat(),
            "description": f"Assigned to {matched_cluster.assigned_department} with priority {matched_cluster.priority_tier}."
        },
        {
            "stage": "Dispatched",
            "completed": matched_cluster.status in ["Dispatched", "In_Progress", "Resolved"],
            "timestamp": matched_cluster.last_reported_at.isoformat() if matched_cluster.status in ["Dispatched", "In_Progress", "Resolved"] else None,
            "description": "Field response team assigned with specialized repair equipment."
        },
        {
            "stage": "In_Progress",
            "completed": matched_cluster.status in ["In_Progress", "Resolved"],
            "timestamp": None,
            "description": "Crews are actively working on-site to resolve the issue."
        },
        {
            "stage": "Resolved",
            "completed": matched_cluster.status == "Resolved",
            "timestamp": None,
            "description": "Work completed and verified with photographic proof."
        }
    ]

    return CitizenTrackingPortalResponse(
        tracking_number=matched_cluster.cluster_number,
        cluster_title=matched_cluster.normalized_title,
        category=matched_cluster.category,  # type: ignore
        current_status=matched_cluster.status,
        status_timeline=timeline,
        location_description=matched_cluster.address_or_landmark,
        public_status_message=matched_cluster.citizen_status_message,
        last_updated=matched_cluster.last_reported_at,
        transparency_notes={
            "priority_tier": matched_cluster.priority_tier,
            "target_sla_hours": matched_cluster.action_plan.get("target_sla_hours", 48),
            "citizen_reports_combined": len(matched_cluster.reports),
            "public_safety_explanation": matched_cluster.explainable_rationale
        }
    )

