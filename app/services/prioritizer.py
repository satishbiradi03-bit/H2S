"""Explainable Prioritization Engine for Civic Incidents.

Implements the strict 0-100 rubric:
- safety_score (0-40): Immediate life/limb hazard, active damage, minor, or cosmetic
- impact_score (0-25): Proximity to critical facilities (schools, hospitals, transit) and population density
- corroboration_score (0-20): Multi-channel confirmation volume and verified media
- urgency_decay_score (0-15): 24-hour escalation / worsening risk

Generates transparent mathematical breakdowns, evidence citations, and audit logs.
"""

from typing import List, Tuple, Dict, Any
from app.schemas import PrioritySpec, ScoreBreakdown, PriorityTier
from app.services.deduplicator import InMemoryCluster


class PrioritizerService:
    """Calculates explainable priority score and generates audit trail."""

    # Facility impact keywords
    CRITICAL_FACILITY_KEYWORDS = {
        "hospital": 25.0,
        "emergency room": 25.0,
        "school": 23.0,
        "elementary": 23.0,
        "kindergarten": 23.0,
        "transit station": 22.0,
        "subway": 22.0,
        "metro": 22.0,
        "bus terminal": 20.0,
        "highway": 20.0,
        "arterial": 20.0,
        "downtown": 18.0,
        "main street": 16.0,
        "residential": 10.0,
        "park": 6.0,
        "alley": 4.0
    }

    # Severe hazard triggers (Safety = 40)
    LIFE_THREAT_SIGNALS = [
        "sparks flying", "arcing", "live wire", "downed wire", "electrocution",
        "elderly trapped", "child trapped", "gas leak", "explosion", "toxic fumes",
        "sinkhole", "road collapse", "building collapse"
    ]

    # Active infrastructure damage triggers (Safety = 25)
    ACTIVE_DAMAGE_SIGNALS = [
        "water rising", "flooding", "pipe burst", "gushing water", "water main break",
        "sewage backup", "raw sewage", "blocked storm drain", "tree collapsed",
        "crushed car", "blocking all lanes", "traffic lights completely out"
    ]

    # Minor hazard triggers (Safety = 10)
    MINOR_HAZARD_SIGNALS = [
        "pothole", "manhole open", "fallen branch", "exposed cable",
        "crosswalk signal dead", "cracked sidewalk", "slippery surface"
    ]

    def evaluate_safety_score(self, texts: List[str], urgency_indicators: List[str]) -> Tuple[float, List[str], str]:
        """Calculates safety score (0-40) and extracts direct quote citations."""
        combined_text = " ".join(texts).lower()
        quotes: List[str] = []

        # Check life threats (Score 40)
        for signal in self.LIFE_THREAT_SIGNALS:
            if signal in combined_text or signal in urgency_indicators:
                quotes.append(signal)

        if quotes:
            return 40.0, quotes[:3], "Assigned maximum 40/40 safety score due to acute threat to life and active physical hazard."

        # Check active damage (Score 25)
        for signal in self.ACTIVE_DAMAGE_SIGNALS:
            if signal in combined_text or signal in urgency_indicators:
                quotes.append(signal)

        if quotes:
            return 25.0, quotes[:3], "Assigned 25/40 safety score due to active structural and infrastructure damage."

        # Check minor hazards (Score 10)
        for signal in self.MINOR_HAZARD_SIGNALS:
            if signal in combined_text or signal in urgency_indicators:
                quotes.append(signal)

        if quotes:
            return 10.0, quotes[:2], "Assigned 10/40 safety score for minor physical hazard not presenting immediate bodily danger."

        # Cosmetic / non-urgent (Score 0)
        return 0.0, [], "Assigned 0/40 safety score: cosmetic or non-hazardous civic condition."

    def evaluate_impact_score(self, landmark_and_reports: str) -> Tuple[float, str]:
        """Calculates population & critical facility impact (0-25)."""
        lower = landmark_and_reports.lower()
        matched_facility = None
        max_score = 8.0  # default residential baseline

        for keyword, weight in self.CRITICAL_FACILITY_KEYWORDS.items():
            if keyword in lower:
                if weight > max_score:
                    max_score = weight
                    matched_facility = keyword

        if matched_facility:
            return round(max_score, 1), f"Impact score of {max_score}/25 based on proximity to critical facility ({matched_facility})."
        return 8.0, "Impact score of 8/25: standard low-density residential zone."

    def evaluate_corroboration_score(self, report_count: int, media_count: int) -> Tuple[float, str]:
        """
        Calculates corroboration (0-20) based on independent reports and media verification.
        Formula: min(20, (reports * 4.0) + (media * 3.0))
        """
        score = min(20.0, (report_count * 4.0) + (media_count * 3.0))
        rationale = f"Corroboration score of {score:.1f}/20 verified across {report_count} citizen report(s) and {media_count} media attachment(s)."
        return round(score, 1), rationale

    def evaluate_urgency_decay_score(self, category: str, safety_score: float) -> Tuple[float, str]:
        """
        Calculates 24-hour escalation / urgency decay risk (0-15).
        Water main breaks, live electrical, and severe hazards worsen rapidly over 24 hours.
        """
        if safety_score >= 35.0:
            # Active life safety issue deteriorates rapidly
            return 15.0, "Urgency decay score of 15/15: immediate high risk of compounding failure or injury within 24 hours."
        elif category in ["Water_Sanitation", "Electrical_Grid"] or safety_score >= 20.0:
            # Water leaks erode soil/pavements, grid issues risk power surges
            return 12.0, "Urgency decay score of 12/15: high risk of sub-surface erosion or utility cascading failure within 24 hours."
        elif category in ["Roads", "Waste"]:
            return 7.0, "Urgency decay score of 7/15: moderate worsening from traffic load or environmental exposure."
        else:
            return 3.0, "Urgency decay score of 3/15: stable condition with low 24-hour escalation velocity."

    @staticmethod
    def map_score_to_tier(total_score: float) -> PriorityTier:
        """Determines categorical priority tier from total score."""
        if total_score >= 80.0:
            return "P0_Critical"
        elif total_score >= 60.0:
            return "P1_High"
        elif total_score >= 35.0:
            return "P2_Medium"
        return "P3_Low"

    def score_cluster(self, cluster: InMemoryCluster) -> PrioritySpec:
        """Executes full explainable scoring pipeline on an incident cluster."""
        all_texts = [r.cleaned_text for r in cluster.reports]
        all_urgency = [ind for r in cluster.reports for ind in r.urgency_indicators]
        landmark_context = f"{cluster.address_or_landmark} {' '.join(all_texts)}"

        # 1. Safety Score (0-40)
        safety, safety_quotes, safety_rat = self.evaluate_safety_score(all_texts, all_urgency)

        # 2. Impact Score (0-25)
        impact, impact_rat = self.evaluate_impact_score(landmark_context)

        # 3. Corroboration Score (0-20)
        corroboration, corrob_rat = self.evaluate_corroboration_score(
            len(cluster.reports), cluster.verified_media_count
        )

        # 4. Urgency Decay Score (0-15)
        urgency_decay, decay_rat = self.evaluate_urgency_decay_score(cluster.category, safety)

        # Total Calculation
        total = round(safety + impact + corroboration + urgency_decay, 1)
        tier = self.map_score_to_tier(total)

        # Synthesize 2-3 sentence explainable rationale
        primary_quote_str = f" ('{safety_quotes[0]}')" if safety_quotes else ""
        rationale = (
            f"Assigned priority {tier} with an aggregate score of {total:.1f}/100. "
            f"Public safety contributed {safety:.1f}/40 based on detected hazard indicators{primary_quote_str}, "
            f"amplified by {impact:.1f}/25 population/facility impact and {corroboration:.1f}/20 multi-channel verification."
        )

        score_breakdown = ScoreBreakdown(
            safety_score=safety,
            impact_score=impact,
            corroboration_score=corroboration,
            urgency_decay_score=urgency_decay
        )

        # Save to cluster state
        cluster.priority_tier = tier
        cluster.total_priority_score = total
        cluster.safety_score = safety
        cluster.impact_score = impact
        cluster.corroboration_score = corroboration
        cluster.urgency_decay_score = urgency_decay
        cluster.explainable_rationale = rationale
        cluster.key_evidence_quotes = safety_quotes

        return PrioritySpec(
            tier=tier,
            total_score=total,
            score_breakdown=score_breakdown,
            explainable_rationale=rationale,
            key_evidence_quotes=safety_quotes
        )


prioritizer_service = PrioritizerService()

