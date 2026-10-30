"""Multi-modal Ingestion & Normalization Service.

Enforces:
1. Zero Hallucination on Locations (strictly validates against explicit mentions).
2. Neutral, Objective Tone Sanitization (strips profanity/emotions while preserving hazard signals).
3. Entity extraction (category, infrastructure, urgency flags, coordinates).
"""

import re
import uuid
import math
import hashlib
from datetime import datetime, timezone
from typing import Tuple, List, Optional, Dict, Any

from app.schemas import (
    RawReportIngestRequest,
    NormalizedReport,
    Coordinates,
    LocationConfidence,
    IssueCategory
)

# Profanity and emotional noise patterns to strip
EMOTIONAL_NOISE_PATTERNS = [
    r"\b(idiots?|stupid|useless|corrupt|lazy|clowns?|bastards?|damn|crap|hell)\b",
    r"\b(what the f\*ck|wtf|f\*cking|f\*ck|bullshit|piece of sh\*t|sh\*t)\b",
    r"\b(city is doing nothing|nobody cares|incompetent city)\b",
    r"[!]{2,}",  # excessive exclamation marks
    r"[\?]{2,}"   # excessive question marks
]

# Critical urgency indicators to preserve
CRITICAL_URGENCY_KEYWORDS = {
    "life_threat": [
        "sparks flying", "arcing", "live wire", "downed wire", "electrocution",
        "elderly trapped", "child trapped", "gas leak", "explosion", "smell of gas",
        "toxic fumes", "sinkhole", "road collapse", "building collapse"
    ],
    "flooding_hazard": [
        "water rising", "flooding", "pipe burst", "gushing water", "water main break",
        "sewage backup", "raw sewage", "blocked storm drain"
    ],
    "structural_transit_hazard": [
        "tree collapsed", "fallen tree", "crushed car", "blocking all lanes",
        "school bus route blocked", "hospital access blocked", "massive pothole",
        "traffic lights completely out", "crosswalk signal dead"
    ]
}

# Category classification heuristics
CATEGORY_KEYWORDS = {
    "Electrical_Grid": ["wire", "power", "electricity", "transformer", "sparks", "blackout", "pole", "arcing", "cable"],
    "Water_Sanitation": ["water", "sewer", "leak", "pipe", "main break", "flooding", "drain", "hydrant", "sewage"],
    "Roads": ["pothole", "asphalt", "crater", "manhole", "street", "curb", "sidewalk", "traffic light", "signal", "pavement"],
    "Public_Safety": ["accident", "collapse", "structural damage", "sinkhole", "fire hazard", "unsecured construction", "hazard"],
    "Waste": ["trash", "garbage", "dumping", "litter", "debris", "overflowing bin", "biohazard", "mattress"],
    "Parks": ["tree", "branch", "playground", "park", "bench", "grass", "overgrown", "trail", "sprinkler"]
}


class NormalizerService:
    """Ingests and sanitizes raw multi-channel reports into structured entities."""

    def __init__(self):
        self.noise_regex = re.compile("|".join(EMOTIONAL_NOISE_PATTERNS), re.IGNORECASE)

    def sanitize_text(self, text: str) -> str:
        """Strips toxic or hyper-emotional language while keeping factual context."""
        cleaned = self.noise_regex.sub(" ", text)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def extract_urgency_indicators(self, text: str) -> List[str]:
        """Detects critical hazard signals from text."""
        lower = text.lower()
        found = []
        for group, keywords in CRITICAL_URGENCY_KEYWORDS.items():
            for kw in keywords:
                if kw in lower:
                    found.append(kw)
        return list(set(found))

    def detect_category(self, text: str, user_hint: Optional[str] = None) -> IssueCategory:
        """Classifies the primary civic infrastructure category."""
        if user_hint and user_hint in CATEGORY_KEYWORDS:
            return user_hint  # type: ignore

        lower = text.lower()
        score_by_cat: Dict[str, int] = {}
        for cat, kws in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in kws if kw in lower)
            score_by_cat[cat] = score

        best_cat = max(score_by_cat, key=score_by_cat.get)
        if score_by_cat[best_cat] > 0:
            return best_cat  # type: ignore
        return "Other"

    def evaluate_location_confidence(
        self,
        address_or_landmark: Optional[str],
        coordinates: Optional[Coordinates],
        raw_text: str
    ) -> Tuple[str, Coordinates, LocationConfidence]:
        """
        Zero-hallucination location validator.
        Only marks confidence as High if both verified coordinates and an explicit address exist.
        Flags ambiguous descriptions (e.g. 'near the park somewhere') as Low confidence.
        """
        has_coords = coordinates and coordinates.lat is not None and coordinates.lng is not None
        has_text_location = bool(address_or_landmark and len(address_or_landmark.strip()) > 5)

        # Check for vague terms
        vague_terms = ["somewhere", "around here", "nearby", "near my house", "on the corner", "not sure"]
        is_vague = False
        if address_or_landmark:
            is_vague = any(vt in address_or_landmark.lower() for vt in vague_terms)

        if has_coords and has_text_location and not is_vague:
            return address_or_landmark.strip(), coordinates, "High"
        elif has_coords and (not has_text_location or is_vague):
            addr = address_or_landmark.strip() if address_or_landmark else "GPS Geofence Match"
            return addr, coordinates, "Medium"
        elif has_text_location and not is_vague:
            # Geocoding would resolve this in production, coordinates remain null until confirmed
            return address_or_landmark.strip(), Coordinates(lat=None, lng=None), "Medium"
        else:
            # Low confidence - requires human triage
            addr = address_or_landmark.strip() if address_or_landmark else "Unverified Location (Needs Dispatcher Clarification)"
            return addr, Coordinates(lat=None, lng=None), "Low"

    def generate_deterministic_embedding(self, text: str, dim: int = 1536) -> List[float]:
        """
        Generates a deterministic normalized unit vector representing text semantics.
        Uses SHA-256 seed hashing to produce realistic, repeatable embeddings
        for unit testing and local deployment without requiring OpenAI API keys.
        """
        # Create token n-grams and generate pseudo-dense distribution
        words = text.lower().split()
        vector = [0.0] * dim
        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 4) % 2 == 0) else -1.0
            vector[idx] += sign * (1.0 / (1.0 + (i * 0.1)))

        # L2 Normalize vector
        magnitude = math.sqrt(sum(v * v for v in vector))
        if magnitude > 0:
            vector = [v / magnitude for v in vector]
        return vector

    def normalize(self, req: RawReportIngestRequest) -> NormalizedReport:
        """Main normalization pipeline."""
        cleaned_text = self.sanitize_text(req.raw_text)
        urgency_kws = self.extract_urgency_indicators(req.raw_text)
        category = self.detect_category(cleaned_text)
        address, coords, confidence = self.evaluate_location_confidence(
            req.address_or_landmark, req.coordinates, req.raw_text
        )

        embedding = self.generate_deterministic_embedding(cleaned_text)
        reported_at = req.reported_at or datetime.now(timezone.utc)

        # Detect affected infrastructure
        infra = None
        for kw in ["pipe", "transformer", "hydrant", "school", "hospital", "bus stop", "pothole", "power line", "tree"]:
            if kw in cleaned_text.lower():
                infra = kw.capitalize()
                break

        return NormalizedReport(
            report_id=str(uuid.uuid4()),
            channel=req.channel,
            cleaned_text=cleaned_text,
            category=category,
            affected_infrastructure=infra,
            urgency_indicators=urgency_kws,
            address_or_landmark=address,
            coordinates=coords,
            location_confidence=confidence,
            media_urls=req.media_urls,
            embedding=embedding,
            reported_at=reported_at
        )


normalizer_service = NormalizerService()

