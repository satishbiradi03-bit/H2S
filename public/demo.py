"""CivicPulse - AI Civic Triage & Prioritization Engine (Standalone Demo Runner).

Demonstrates the entire lifecycle:
1. Ingests 3 disparate, noisy reports across different channels (App, Twitter/X, Voice).
2. Sanitizes language (strips profanity, extracts urgency cues).
3. Clusters by spatial geofence + semantic vector similarity.
4. Calculates transparent 0-100 rubric (Safety 40%, Impact 25%, Corroboration 20%, Urgency Decay 15%).
5. Generates strict JSON Output matching the exact municipal schema.
"""

import json
from app.schemas import RawReportIngestRequest, Coordinates
from app.services.normalizer import normalizer_service
from app.services.deduplicator import deduplicator_service
from app.services.prioritizer import prioritizer_service
from app.services.router import router_service


def run_demo():
    print("=" * 80)
    print("CivicPulse AI Civic Triage & Prioritization Engine")
    print("=" * 80)

    # 1. Simulate incoming multi-channel reports regarding a severe electrical hazard
    reports = [
        RawReportIngestRequest(
            channel="Citizen_Mobile_App",
            source_identifier="usr_app_9912",
            raw_text="A massive storm branch snapped our electrical line! Sparks flying everywhere right next to Lincoln Elementary School crosswalk! Dangerous as hell, send someone!",
            address_or_landmark="Lincoln Elementary School, 400 Elm St",
            coordinates=Coordinates(lat=37.774929, lng=-122.419416),
            media_urls=["https://storage.civicpulse.org/media/sparks_elm_1.jpg"]
        ),
        RawReportIngestRequest(
            channel="Social_Media_Twitter_X",
            source_identifier="@resident_civic",
            raw_text="Downed live wire sparking on Elm St near Lincoln Elementary! Kids are walking home soon, please get dispatch out here ASAP! #CityPowerHazard",
            address_or_landmark="Elm St & 4th Ave, Lincoln Elementary",
            coordinates=Coordinates(lat=37.774980, lng=-122.419390),
            media_urls=["https://storage.civicpulse.org/media/sparks_elm_2.jpg"]
        ),
        RawReportIngestRequest(
            channel="Voice_Call_Transcript",
            source_identifier="311_call_transcript_781",
            raw_text="Caller states: 'Live electrical cable hanging low across sidewalk in front of elementary school, arcing and smoking on wet pavement.'",
            address_or_landmark="400 Elm Street near school gate",
            coordinates=Coordinates(lat=37.774910, lng=-122.419430)
        )
    ]

    print(f"\n[STEP 1] Ingesting {len(reports)} multi-channel citizen reports...")
    primary_cluster = None

    for i, rep in enumerate(reports, start=1):
        norm = normalizer_service.normalize(rep)
        cluster, is_new = deduplicator_service.cluster_report(norm)
        status_action = "Created new cluster" if is_new else "Deduplicated & merged into existing cluster"
        print(f"  -> Report #{i} ({rep.channel}): {status_action} '{cluster.cluster_number}'")
        primary_cluster = cluster

    print(f"\n[STEP 2] Clustered Incident Summary:")
    print(f"  Cluster ID:         {primary_cluster.cluster_id}")
    print(f"  Cluster Number:     {primary_cluster.cluster_number}")
    print(f"  Linked Reports:     {len(primary_cluster.reports)} citizen submissions merged")
    print(f"  Verified Media:     {primary_cluster.verified_media_count} photos attached")
    print(f"  Calculated Centroid: ({primary_cluster.coordinates.lat}, {primary_cluster.coordinates.lng})")

    print("\n[STEP 3] Running Explainable 0-100 Prioritization Engine...")
    priority = prioritizer_service.score_cluster(primary_cluster)
    print(f"  Total Score:        {priority.total_score} / 100")
    print(f"  Assigned Tier:      {priority.tier}")
    print(f"  Score Breakdown:")
    print(f"    - Safety Score:       {priority.score_breakdown.safety_score} / 40 (Immediate life threat)")
    print(f"    - Impact Score:       {priority.score_breakdown.impact_score} / 25 (School proximity)")
    print(f"    - Corroboration:      {priority.score_breakdown.corroboration_score} / 20 (3 reports + 2 media)")
    print(f"    - Urgency Decay:      {priority.score_breakdown.urgency_decay_score} / 15 (24h escalation)")
    print(f"  Citations:          {priority.key_evidence_quotes}")
    print(f"  Audit Rationale:    {priority.explainable_rationale}")

    print("\n[STEP 4] Municipal Routing & Work Order Synthesis...")
    triage_output = router_service.route_and_generate_output(primary_cluster, priority)

    print("\n[STEP 5] Strict JSON Output Payload:")
    print("-" * 80)
    json_payload = triage_output.model_dump_json(indent=2)
    print(json_payload)
    print("-" * 80)

    # Save to disk as reference output
    with open("triage_output_example.json", "w", encoding="utf-8") as f:
        f.write(json_payload)
    print("\nSuccessfully exported JSON to 'triage_output_example.json'.")


if __name__ == "__main__":
    run_demo()

