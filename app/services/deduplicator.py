"""Geospatial Proximity + Vector Semantic Deduplication & Clustering Service.

Matches reports based on:
1. Spatial Geofence: Haversine distance <= 100m (or PostGIS ST_DWithin)
2. Semantic Similarity: Cosine similarity >= 0.80 on text embeddings
3. Temporal Horizon: Within 48 hours of original report
"""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from app.config import settings
from app.schemas import NormalizedReport, Coordinates, LocationSpec, LocationConfidence, PriorityTier, IncidentStatus

# In-memory storage structures for standalone / test execution
class InMemoryCluster:
    def __init__(
        self,
        cluster_id: str,
        cluster_number: str,
        normalized_title: str,
        category: str,
        address_or_landmark: str,
        coordinates: Coordinates,
        location_confidence: LocationConfidence,
        embedding: List[float],
        first_reported_at: datetime
    ):
        self.cluster_id = cluster_id
        self.cluster_number = cluster_number
        self.normalized_title = normalized_title
        self.category = category
        self.address_or_landmark = address_or_landmark
        self.coordinates = coordinates
        self.location_confidence = location_confidence
        self.embedding = embedding
        self.first_reported_at = first_reported_at
        self.last_reported_at = first_reported_at
        self.reports: List[NormalizedReport] = []
        self.verified_media_count = 0
        self.status: IncidentStatus = "Received"
        
        # Priority attributes
        self.priority_tier: PriorityTier = "P2_Medium"
        self.total_priority_score = 0.0
        self.safety_score = 0.0
        self.impact_score = 0.0
        self.corroboration_score = 0.0
        self.urgency_decay_score = 0.0
        self.explainable_rationale = ""
        self.key_evidence_quotes: List[str] = []
        self.assigned_department = ""
        self.citizen_status_message = ""
        self.action_plan = {}


class DeduplicatorService:
    """Clustering engine combining PostGIS spatial distance and vector cosine similarity."""

    def __init__(self):
        # In-memory registry of active clusters
        self.active_clusters: Dict[str, InMemoryCluster] = {}
        self.cluster_counter = 1000

    @staticmethod
    def haversine_distance_meters(coord1: Coordinates, coord2: Coordinates) -> float:
        """Calculates great-circle distance between two GPS points in meters."""
        if coord1.lat is None or coord1.lng is None or coord2.lat is None or coord2.lng is None:
            return float("inf")

        r = 6371000.0  # Earth radius in meters
        phi1 = math.radians(coord1.lat)
        phi2 = math.radians(coord2.lat)
        delta_phi = math.radians(coord2.lat - coord1.lat)
        delta_lambda = math.radians(coord2.lng - coord1.lng)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Computes cosine similarity between two unit vectors."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        return max(-1.0, min(1.0, dot_product))

    def find_matching_cluster(self, report: NormalizedReport) -> Optional[InMemoryCluster]:
        """
        Evaluates candidate clusters within spatial radius and checks semantic similarity.
        SQL / PostGIS Equivalent:
        SELECT id, ST_Distance(centroid_geom, :geom) as dist,
               (1 - (centroid_embedding <=> :embedding)) as sim
        FROM incident_clusters
        WHERE ST_DWithin(centroid_geom, :geom, 100.0)
          AND category = :category
          AND status NOT IN ('Resolved', 'Closed_Duplicate')
          AND last_reported_at >= NOW() - INTERVAL '48 hours'
        ORDER BY sim DESC LIMIT 1;
        """
        best_match: Optional[InMemoryCluster] = None
        highest_sim = 0.0

        for cluster in self.active_clusters.values():
            if cluster.status in ["Resolved", "Closed_Duplicate"]:
                continue

            # Category match check
            if cluster.category != report.category:
                continue

            # Temporal window check (e.g., within 48h)
            time_diff = abs((report.reported_at - cluster.last_reported_at).total_seconds()) / 3600.0
            if time_diff > settings.cluster_time_window_hours:
                continue

            # Spatial distance check
            dist_meters = self.haversine_distance_meters(report.coordinates, cluster.coordinates)
            has_matching_landmark = (
                report.address_or_landmark.lower() in cluster.address_or_landmark.lower() or
                cluster.address_or_landmark.lower() in report.address_or_landmark.lower()
            )

            is_spatially_close = dist_meters <= settings.cluster_radius_meters or has_matching_landmark

            if is_spatially_close:
                # Semantic vector check
                if report.embedding and cluster.embedding:
                    sim = self.cosine_similarity(report.embedding, cluster.embedding)
                    if sim >= settings.semantic_similarity_threshold and sim > highest_sim:
                        highest_sim = sim
                        best_match = cluster
                elif has_matching_landmark:
                    # Fallback to landmark match when embeddings are unavailable
                    return cluster

        return best_match

    def cluster_report(self, report: NormalizedReport) -> Tuple[InMemoryCluster, bool]:
        """
        Associates report with existing cluster or spawns a new incident cluster.
        Returns (cluster, is_new_cluster).
        """
        existing = self.find_matching_cluster(report)

        if existing:
            # Update existing cluster
            report.cluster_id = existing.cluster_id
            existing.reports.append(report)
            existing.last_reported_at = max(existing.last_reported_at, report.reported_at)
            if report.media_urls:
                existing.verified_media_count += len(report.media_urls)

            # Recompute weighted centroid if new GPS coordinates are provided
            if report.coordinates.lat is not None and report.coordinates.lng is not None:
                all_coords = [
                    (r.coordinates.lat, r.coordinates.lng)
                    for r in existing.reports
                    if r.coordinates.lat is not None and r.coordinates.lng is not None
                ]
                if all_coords:
                    avg_lat = sum(c[0] for c in all_coords) / len(all_coords)
                    avg_lng = sum(c[1] for c in all_coords) / len(all_coords)
                    existing.coordinates = Coordinates(lat=round(avg_lat, 6), lng=round(avg_lng, 6))

            return existing, False

        # Create new cluster
        self.cluster_counter += 1
        year = datetime.now().year
        cluster_num = f"INC-{year}-{self.cluster_counter:05d}"
        cluster_id = str(uuid.uuid4())

        # Generate normalized concise title
        words = report.cleaned_text.split()
        summary_title = " ".join(words[:7]) + ("..." if len(words) > 7 else "")
        normalized_title = f"{report.category}: {summary_title}"

        new_cluster = InMemoryCluster(
            cluster_id=cluster_id,
            cluster_number=cluster_num,
            normalized_title=normalized_title,
            category=report.category,
            address_or_landmark=report.address_or_landmark,
            coordinates=report.coordinates,
            location_confidence=report.location_confidence,
            embedding=report.embedding or [],
            first_reported_at=report.reported_at
        )

        report.cluster_id = cluster_id
        new_cluster.reports.append(report)
        if report.media_urls:
            new_cluster.verified_media_count += len(report.media_urls)

        self.active_clusters[cluster_id] = new_cluster
        return new_cluster, True


deduplicator_service = DeduplicatorService()

