"""Configuration and domain constants for CivicPulse AI Triage Engine."""

from typing import Dict, List
from pydantic import BaseModel

class AppSettings(BaseModel):
    app_name: str = "CivicPulse AI Civic Triage Platform"
    environment: str = "production"
    log_level: str = "INFO"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/civicpulse"
    
    # Embedding Configuration
    embedding_model_name: str = "text-embedding-3-large"
    embedding_dimension: int = 1536
    
    # LLM Triage Configuration
    triage_model_name: str = "gemini-1.5-pro-civic-triage"
    llm_temperature: float = 0.1  # Low temperature for deterministic, factual outputs
    
    # Geospatial & Semantic Deduplication Thresholds
    cluster_radius_meters: float = 100.0        # Max physical distance for same physical incident
    cluster_time_window_hours: float = 48.0     # Reports beyond 48 hours form new recurring issues
    semantic_similarity_threshold: float = 0.80 # Cosine similarity cutoff for text embeddings
    
    # Priority Scoring Rubric Weights (0 - 100 scale)
    weight_safety: float = 40.0         # 40%
    weight_impact: float = 25.0         # 25%
    weight_corroboration: float = 20.0   # 20%
    weight_urgency_decay: float = 15.0  # 15%

settings = AppSettings()

# Municipal Department Mapping
DEPARTMENT_ROUTING: Dict[str, Dict[str, str]] = {
    "Roads": {
        "department": "Department of Transportation (DOT)",
        "division": "Street Maintenance & Traffic Engineering",
        "emergency_dispatch": "DOT Urgent Operations"
    },
    "Water_Sanitation": {
        "department": "Department of Water Management & Sanitation",
        "division": "Water Main & Sewer Emergency Division",
        "emergency_dispatch": "Water Rapid Response Unit"
    },
    "Electrical_Grid": {
        "department": "Municipal Power & Utilities Authority",
        "division": "High-Voltage Distribution & Grid Safety",
        "emergency_dispatch": "Grid Emergency Lineworker Unit"
    },
    "Public_Safety": {
        "department": "Office of Emergency Management & Public Safety",
        "division": "First Responder Dispatch (Police / Fire / EMS)",
        "emergency_dispatch": "911 / EMS Unified Command"
    },
    "Waste": {
        "department": "Department of Sanitation & Waste Management",
        "division": "Municipal Solid Waste & Hazardous Cleanup",
        "emergency_dispatch": "Hazmat & Sanitation Fly-Crew"
    },
    "Parks": {
        "department": "Parks & Recreation Department",
        "division": "Urban Forestry & Grounds Maintenance",
        "emergency_dispatch": "Emergency Tree Clearing Crew"
    },
    "Other": {
        "department": "Department of General Municipal Services",
        "division": "Civic Infrastructure & Maintenance",
        "emergency_dispatch": "Rapid Civic Response"
    }
}

# SLA Target Deadlines by Priority Tier (Hours)
SLA_TARGET_HOURS: Dict[str, int] = {
    "P0_Critical": 2,      # 2 hours max response
    "P1_High": 12,         # 12 hours response
    "P2_Medium": 48,       # 48 hours response
    "P3_Low": 168          # 7 days response
}

# Priority Tier Score Boundaries
PRIORITY_TIER_THRESHOLDS = [
    (80.0, "P0_Critical"),
    (60.0, "P1_High"),
    (35.0, "P2_Medium"),
    (0.0,  "P3_Low")
]

