"""Municipal Routing, Action Planning & Citizen Transparency Service.

Generates:
1. Department Work Order routing with targeted SLA deadlines.
2. Field crew equipment requirements and first response action plan.
3. Empathetic, transparent citizen status updates for public tracking.
4. Complete TriageOutput object matching the municipal schema.
"""

from typing import Dict, List, Any
from app.config import DEPARTMENT_ROUTING, SLA_TARGET_HOURS
from app.schemas import (
    TriageOutput,
    LocationSpec,
    PrioritySpec,
    ActionPlanSpec,
    IssueCategory,
    PriorityTier
)
from app.services.deduplicator import InMemoryCluster


# Action Plan Templates based on Category & Priority Tier
ACTION_PLAN_TEMPLATES = {
    "Electrical_Grid": {
        "P0_Critical": {
            "first_response": "Deploy high-voltage utility crew to de-energize damaged feeder, establish a 50-foot safety exclusion perimeter, and isolate downed line.",
            "equipment": ["High-Voltage Bucket Truck", "Arc-Flash Safety PPE", "Line Voltage Tester", "Traffic Barrier Cones"],
            "citizen_msg": "URGENT DISPATCH: Our municipal utility emergency crew has been dispatched to isolate and repair the electrical hazard. Field personnel are establishing safety perimeters. Please keep a safe distance of at least 50 feet."
        },
        "P1_High": {
            "first_response": "Dispatch utility technician to inspect damaged transformer casing and verify ground fault protection.",
            "equipment": ["Service Utility Van", "Insulated Hand Tools", "Multimeter", "Warning Signage"],
            "citizen_msg": "Our electrical maintenance crew has prioritized this report and scheduled an immediate technical inspection. We are actively monitoring grid stability in your area."
        },
        "default": {
            "first_response": "Perform scheduled inspection of lighting / secondary electrical infrastructure.",
            "equipment": ["Standard Utility Van", "Ladder Truck"],
            "citizen_msg": "We have logged this electrical infrastructure ticket. A maintenance crew will inspect and repair the line in accordance with standard municipal schedules."
        }
    },
    "Water_Sanitation": {
        "P0_Critical": {
            "first_response": "Immediately isolate upstream distribution gate valve, divert traffic from flooded zone, and mobilize vacuum excavator crew.",
            "equipment": ["Valve Key & Exerciser", "Submersible De-watering Pumps", "Vacuum Excavation Truck", "Road Barricades"],
            "citizen_msg": "EMERGENCY ACTION: Water management field crews are en route to shut off the main valve and contain street flooding. We are working to restore normal water service as quickly and safely as possible."
        },
        "P1_High": {
            "first_response": "Dispatch leak detection specialist with acoustic correlators to pinpoint pipe breach and schedule priority excavation.",
            "equipment": ["Acoustic Leak Detector", "Service Truck", "Excavator Shoring"],
            "citizen_msg": "Our water maintenance division has flagged this leak for expedited repair. A crew is scheduled to assess pipe integrity and prevent localized water loss."
        },
        "default": {
            "first_response": "Inspect reported drainage or minor valve seepage during standard route maintenance.",
            "equipment": ["Inspection Van", "CCTV Sewer Camera"],
            "citizen_msg": "Your water/drainage report has been triaged and placed in our municipal maintenance schedule. Thank you for helping keep our infrastructure sound."
        }
    },
    "Roads": {
        "P0_Critical": {
            "first_response": "Deploy emergency road closure crew with illuminated arrow boards, notify public transit of detour, and prepare rapid hot-mix asphalt patching.",
            "equipment": ["Traffic Attenuator Truck", "Variable Message Sign", "Hot-Mix Asphalt Recycler", "Vibratory Roller"],
            "citizen_msg": "SAFETY ALERT: Transportation crews are placing emergency barricades around the road hazard to protect drivers and pedestrians. Detours are being marked."
        },
        "P1_High": {
            "first_response": "Schedule priority pavement milling and asphalt patching crew within 12 hours.",
            "equipment": ["Asphalt Patch Truck", "Tamping Compactor", "Warning Signs"],
            "citizen_msg": "Our road maintenance team has scheduled rapid asphalt repair for this hazard within the next 12 hours. Please drive cautiously in this sector."
        },
        "default": {
            "first_response": "Log road surface defect in municipal asset management system for routine repaving queue.",
            "equipment": ["Pothole Patching Truck", "Cold-Lay Compound"],
            "citizen_msg": "Your road condition report has been logged and assigned to our district street repair team. Repairs are queued according to pavement priority."
        }
    },
    "Public_Safety": {
        "P0_Critical": {
            "first_response": "Notify Unified First Responder Command (Fire/Police) for immediate site cordon and evacuation assessment.",
            "equipment": ["Emergency Response Vehicles", "Perimeter Incident Tape", "Public Address System"],
            "citizen_msg": "First responders and public safety officials have been alerted and dispatched to secure the location."
        },
        "default": {
            "first_response": "Coordinate with municipal safety inspectors for physical hazard mitigation.",
            "equipment": ["Safety Inspection Vehicle", "Hazard Warning Signs"],
            "citizen_msg": "Public safety inspectors have reviewed this report and scheduled site verification."
        }
    },
    "Parks": {
        "P0_Critical": {
            "first_response": "Deploy forestry aerial lift and crane crew to remove fallen tree limb threatening power lines or thoroughfare.",
            "equipment": ["Aerial Bucket Truck", "Commercial Chainsaws", "Wood Chipper", "Tow Crane"],
            "citizen_msg": "An emergency urban forestry crew is en route with specialized tree-clearing equipment to remove hazardous branches and restore access."
        },
        "default": {
            "first_response": "Dispatch grounds maintenance crew to clear debris and inspect park amenities.",
            "equipment": ["Maintenance Pickup", "Hand Tools"],
            "citizen_msg": "Our parks maintenance crew has scheduled this area for service during regular maintenance rounds."
        }
    },
    "Waste": {
        "P0_Critical": {
            "first_response": "Deploy hazardous materials cleanup unit with protective suits and containment drums.",
            "equipment": ["Hazmat Clean Van", "Neutralizing Agents", "Sealed Waste Drums"],
            "citizen_msg": "Sanitation hazardous response teams have been dispatched to safely collect and dispose of reported substances."
        },
        "default": {
            "first_response": "Add address to daily sweep route for oversized debris collection.",
            "equipment": ["Rear-Loader Waste Truck"],
            "citizen_msg": "Our sanitation department has added this location to the upcoming route for pickup and street cleaning."
        }
    },
    "Other": {
        "default": {
            "first_response": "Assign municipal field technician for physical assessment and task allocation.",
            "equipment": ["Municipal Service Van"],
            "citizen_msg": "Your report has been received by municipal services and routed to the appropriate department for evaluation."
        }
    }
}


class RouterService:
    """Assigns departments, calculates SLAs, and builds strict TriageOutput."""

    def route_and_generate_output(self, cluster: InMemoryCluster, priority: PrioritySpec) -> TriageOutput:
        """Constructs production TriageOutput strictly matching municipal schema."""
        category = cluster.category
        tier = priority.tier

        # 1. Assigned Department
        dept_info = DEPARTMENT_ROUTING.get(category, DEPARTMENT_ROUTING["Other"])
        assigned_dept = dept_info["department"]

        # 2. SLA Hours
        sla_hours = float(SLA_TARGET_HOURS.get(tier, 48))

        # 3. Action Plan selection
        cat_templates = ACTION_PLAN_TEMPLATES.get(category, ACTION_PLAN_TEMPLATES["Other"])
        plan_template = cat_templates.get(tier, cat_templates.get("default", ACTION_PLAN_TEMPLATES["Other"]["default"]))

        action_plan = ActionPlanSpec(
            recommended_first_response=plan_template["first_response"],
            required_equipment_or_crew=plan_template["equipment"],
            target_sla_hours=sla_hours
        )

        citizen_msg = plan_template["citizen_msg"]

        # Build location spec
        loc_spec = LocationSpec(
            address_or_landmark=cluster.address_or_landmark,
            coordinates=cluster.coordinates,
            location_confidence=cluster.location_confidence
        )

        # Update in-memory cluster state
        cluster.assigned_department = assigned_dept
        cluster.citizen_status_message = citizen_msg
        cluster.action_plan = {
            "recommended_first_response": action_plan.recommended_first_response,
            "required_equipment_or_crew": action_plan.required_equipment_or_crew,
            "target_sla_hours": sla_hours
        }

        # Build and validate final output matching strict schema
        return TriageOutput(
            cluster_id=cluster.cluster_id,
            normalized_title=cluster.normalized_title,
            category=category,  # type: ignore
            assigned_department=assigned_dept,
            location=loc_spec,
            priority=priority,
            action_plan=action_plan,
            citizen_status_message=citizen_msg
        )


router_service = RouterService()

