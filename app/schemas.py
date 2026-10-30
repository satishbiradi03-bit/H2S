"""Pydantic v2 schemas for CivicPulse AI Triage & Tracking Engine."""

from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator


# Enums
IssueCategory = Literal[
    "Roads",
    "Water_Sanitation",
    "Electrical_Grid",
    "Public_Safety",
    "Waste",
    "Parks",
    "Other"
]

PriorityTier = Literal[
    "P0_Critical",
    "P1_High",
    "P2_Medium",
    "P3_Low"
]

LocationConfidence = Literal[
    "High",
    "Medium",
    "Low"
]

ReportChannel = Literal[
    "Citizen_Mobile_App",
    "SMS_Text",
    "Voice_Call_Transcript",
    "Social_Media_Twitter_X",
    "Social_Media_Nextdoor",
    "311_Legacy_Feed",
    "City_Worker_Field_App"
]

IncidentStatus = Literal[
    "Received",
    "Triaged",
    "Dispatched",
    "In_Progress",
    "Resolved",
    "Closed_Duplicate",
    "Flagged_Review"
]


# Location Coordinates Schema
class Coordinates(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None


class LocationSpec(BaseModel):
    address_or_landmark: str
    coordinates: Coordinates
    location_confidence: LocationConfidence


# Priority Scoring Breakdown
class ScoreBreakdown(BaseModel):
    safety_score: float = Field(..., ge=0, le=40, description="0-40: Immediate life/property hazard threat")
    impact_score: float = Field(..., ge=0, le=25, description="0-25: Proximity to critical facilities & population density")
    corroboration_score: float = Field(..., ge=0, le=20, description="0-20: Unique citizen confirmations & media evidence")
    urgency_decay_score: float = Field(..., ge=0, le=15, description="0-15: Rate of worsening if left unaddressed for 24h")


class PrioritySpec(BaseModel):
    tier: PriorityTier
    total_score: float = Field(..., ge=0, le=100)
    score_breakdown: ScoreBreakdown
    explainable_rationale: str = Field(..., description="2-3 sentences explaining score with cited evidence")
    key_evidence_quotes: List[str] = Field(default_factory=list, description="Direct quotes from reports")


class ActionPlanSpec(BaseModel):
    recommended_first_response: str
    required_equipment_or_crew: List[str]
    target_sla_hours: float


# ============================================================================
# Core Triage Output Schema (Strict format requested by municipal engine)
# ============================================================================
class TriageOutput(BaseModel):
    cluster_id: str
    normalized_title: str
    category: IssueCategory
    assigned_department: str
    location: LocationSpec
    priority: PrioritySpec
    action_plan: ActionPlanSpec
    citizen_status_message: str


# ============================================================================
# Ingestion & Operational Schemas
# ============================================================================
class RawReportIngestRequest(BaseModel):
    channel: ReportChannel = "Citizen_Mobile_App"
    source_identifier: Optional[str] = None
    raw_text: str
    language_code: Optional[str] = "en"
    address_or_landmark: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    media_urls: List[str] = Field(default_factory=list)
    media_analysis: Optional[Dict[str, Any]] = None
    reported_at: Optional[datetime] = None


class NormalizedReport(BaseModel):
    report_id: str
    channel: ReportChannel
    cleaned_text: str
    category: IssueCategory
    affected_infrastructure: Optional[str] = None
    urgency_indicators: List[str] = Field(default_factory=list)
    address_or_landmark: str
    coordinates: Coordinates
    location_confidence: LocationConfidence
    media_urls: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
    reported_at: datetime
    cluster_id: Optional[str] = None


class ClusterSummary(BaseModel):
    cluster_id: str
    cluster_number: str
    normalized_title: str
    category: IssueCategory
    assigned_department: str
    location: LocationSpec
    report_count: int
    verified_media_count: int
    priority_tier: PriorityTier
    total_priority_score: float
    status: IncidentStatus
    first_reported_at: datetime
    last_reported_at: datetime


class PriorityAuditLogResponse(BaseModel):
    id: str
    cluster_id: str
    evaluation_trigger: str
    previous_total_score: Optional[float]
    new_total_score: float
    previous_tier: Optional[PriorityTier]
    new_tier: PriorityTier
    safety_score: float
    impact_score: float
    corroboration_score: float
    urgency_decay_score: float
    audit_rationale: str
    evidence_citations: List[str]
    model_name: str
    created_at: datetime


class WorkOrderResponse(BaseModel):
    id: str
    work_order_number: str
    cluster_id: str
    department: str
    assigned_division: Optional[str]
    recommended_first_response: str
    required_equipment: List[str]
    target_sla_hours: float
    sla_deadline: datetime
    status: IncidentStatus
    dispatched_at: Optional[datetime]
    citizen_status_message: str


class CitizenTrackingPortalResponse(BaseModel):
    tracking_number: str
    cluster_title: str
    category: IssueCategory
    current_status: IncidentStatus
    status_timeline: List[Dict[str, Any]]
    location_description: str
    public_status_message: str
    last_updated: datetime
    transparency_notes: Dict[str, Any]

