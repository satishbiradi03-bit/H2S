"""Automated Test Suite for CivicPulse AI Triage Pipeline.

Covers:
1. P0 Critical Emergency: Live electrical wire with sparks near school.
2. Deduplication & Clustering: 3 noisy multi-channel reports merging into 1 cluster.
3. Zero-Hallucination Location Guardrails: Flagging vague addresses.
4. Low-Hazard P3: Non-urgent cosmetic park maintenance.
"""

from datetime import datetime, timezone
from app.schemas import RawReportIngestRequest, Coordinates
from app.services.normalizer import normalizer_service
from app.services.deduplicator import deduplicator_service
from app.services.prioritizer import prioritizer_service
from app.services.router import router_service


def test_p0_critical_electrical_hazard():
    """Validates that a live power line near a school scores as P0_Critical."""
    req = RawReportIngestRequest(
        channel="Citizen_Mobile_App",
        source_identifier="usr_88219",
        raw_text="Emergency!! There is a downed power line with sparks flying everywhere right in front of Lincoln Elementary School!! Idiots at the city need to fix this NOW!!",
        address_or_landmark="Lincoln Elementary School, 400 Elm St",
        coordinates=Coordinates(lat=37.774929, lng=-122.419416),
        media_urls=["https://storage.civicpulse.org/media/sparks_elm.jpg"]
    )

    # 1. Normalization
    norm = normalizer_service.normalize(req)
    assert "sparks flying" in norm.urgency_indicators
    assert "idiots" not in norm.cleaned_text.lower()  # Toxic noise stripped
    assert norm.category == "Electrical_Grid"
    assert norm.location_confidence == "High"

    # 2. Deduplication & Clustering
    cluster, is_new = deduplicator_service.cluster_report(norm)
    assert is_new is True

    # 3. Prioritization
    priority = prioritizer_service.score_cluster(cluster)
    assert priority.tier == "P0_Critical"
    assert priority.score_breakdown.safety_score == 40.0
    assert priority.score_breakdown.impact_score >= 20.0  # School proximity
    assert priority.score_breakdown.urgency_decay_score == 15.0
    assert priority.total_score >= 80.0
    assert "sparks flying" in priority.key_evidence_quotes

    # 4. Routing & Action Plan
    output = router_service.route_and_generate_output(cluster, priority)
    assert output.assigned_department == "Municipal Power & Utilities Authority"
    assert output.action_plan.target_sla_hours == 2.0
    assert "Bucket Truck" in output.action_plan.required_equipment_or_crew[0]
    print("[PASS] test_p0_critical_electrical_hazard passed.")


def test_multi_channel_deduplication():
    """Validates that 3 noisy reports for the same incident merge into 1 cluster."""
    # Report 1: Citizen Mobile App
    r1 = RawReportIngestRequest(
        channel="Citizen_Mobile_App",
        raw_text="Huge water pipe burst at 5th and Pine, water rising fast over sidewalk!",
        address_or_landmark="5th Ave & Pine St",
        coordinates=Coordinates(lat=37.780100, lng=-122.410100),
        media_urls=["https://storage.civicpulse.org/media/water1.jpg"]
    )
    # Report 2: Social Media (Twitter/X) 15 minutes later, 20 meters away
    r2 = RawReportIngestRequest(
        channel="Social_Media_Twitter_X",
        raw_text="@CityHelp 5th and Pine is totally flooded, water main break flooding the street!",
        address_or_landmark="Corner of 5th and Pine",
        coordinates=Coordinates(lat=37.780220, lng=-122.410180)
    )
    # Report 3: 311 Voice Transcript
    r3 = RawReportIngestRequest(
        channel="Voice_Call_Transcript",
        raw_text="Caller reports gushing water on 5th Ave near Pine St corner, dangerous flooding.",
        address_or_landmark="5th Ave and Pine St",
        coordinates=Coordinates(lat=37.780150, lng=-122.410120)
    )

    # Ingest Report 1
    norm1 = normalizer_service.normalize(r1)
    c1, is_new1 = deduplicator_service.cluster_report(norm1)
    assert is_new1 is True

    # Ingest Report 2 -> Must merge into c1
    norm2 = normalizer_service.normalize(r2)
    c2, is_new2 = deduplicator_service.cluster_report(norm2)
    assert is_new2 is False
    assert c2.cluster_id == c1.cluster_id

    # Ingest Report 3 -> Must merge into c1
    norm3 = normalizer_service.normalize(r3)
    c3, is_new3 = deduplicator_service.cluster_report(norm3)
    assert is_new3 is False
    assert c3.cluster_id == c1.cluster_id

    assert len(c1.reports) == 3

    # Prioritize cluster with 3 corroborations
    priority = prioritizer_service.score_cluster(c1)
    # 3 reports + 1 media = min(20, 3*4 + 1*3) = 15.0
    assert priority.score_breakdown.corroboration_score >= 15.0
    print("[PASS] test_multi_channel_deduplication passed.")


def test_zero_hallucination_vague_location():
    """Validates that ambiguous locations are marked Low Confidence and never assigned fake coordinates."""
    req = RawReportIngestRequest(
        channel="SMS_Text",
        raw_text="There is some weird broken equipment around here in the grass somewhere",
        address_or_landmark="in the grass somewhere",
        coordinates=None
    )

    norm = normalizer_service.normalize(req)
    assert norm.location_confidence == "Low"
    assert norm.coordinates.lat is None
    assert norm.coordinates.lng is None
    print("[PASS] test_zero_hallucination_vague_location passed.")


def test_p3_cosmetic_park_issue():
    """Validates that non-hazardous issues receive P3_Low rating."""
    req = RawReportIngestRequest(
        channel="Citizen_Mobile_App",
        raw_text="Someone sprayed minor graffiti spray paint on the wooden park bench in Green Meadows Park.",
        address_or_landmark="Green Meadows Park",
        coordinates=Coordinates(lat=37.760000, lng=-122.430000)
    )

    norm = normalizer_service.normalize(req)
    cluster, is_new = deduplicator_service.cluster_report(norm)
    priority = prioritizer_service.score_cluster(cluster)

    assert priority.tier == "P3_Low"
    assert priority.score_breakdown.safety_score == 0.0
    assert priority.total_score < 35.0
    print("[PASS] test_p3_cosmetic_park_issue passed.")


if __name__ == "__main__":
    print("Running CivicPulse AI Triage Pipeline Test Suite...\n")
    test_p0_critical_electrical_hazard()
    test_multi_channel_deduplication()
    test_zero_hallucination_vague_location()
    test_p3_cosmetic_park_issue()
    print("\nAll 4 test scenarios passed successfully!")

