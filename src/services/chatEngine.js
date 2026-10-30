// ============================================================================
// CivicPulse AI - Civic Assistant & Municipal Solution Recommendation Engine
// ============================================================================

const { CIVIC_CATEGORIES, PRIORITY_TIERS, SLA_HOURS } = require('../constants');

/**
 * Standard Municipal Engineering Solution Guides
 */
const SOLUTION_GUIDES = Object.freeze({
  ROADS: {
    problem: "Road Crater & Asphalt Subsidence",
    category: CIVIC_CATEGORIES.ROADS,
    tier: PRIORITY_TIERS.HIGH,
    first_action: "Immediately cordon off crater with high-visibility retro-reflective cones and flashing solar LED blinkers to prevent two-wheeler skids.",
    engineering_solution: "1. Square-cut damaged pothole edges using a diamond-blade road saw to achieve vertical shear walls.\n2. Apply a rapid-curing cationic bitumen tack coat (RS-1 grade).\n3. Fill in layers of hot-mix or cold-mix asphalt (VG-30 grade) not exceeding 50mm per lift.\n4. Compact using a 2-ton vibratory roller to 98% laboratory density.\n5. Seal perimeter seams with liquid rubberized asphalt sealant to prevent water ingress.",
    required_equipment: ["Diamond Road Saw", "Bituminous Tack Coat Sprayer", "2-Ton Vibratory Compactor", "Cold-Mix Polymer Asphalt", "Infrared Joint Heater"],
    budget_estimate: "₹25,000 - ₹45,000 per 10 sq.m",
    sla_hours: SLA_HOURS[PRIORITY_TIERS.HIGH]
  },
  WATER: {
    problem: "Underground Trunk Water Main Rupture",
    category: CIVIC_CATEGORIES.WATER,
    tier: PRIORITY_TIERS.CRITICAL,
    first_action: "Immediately activate SCADA remote telemetry to shut off the sector isolation sluice valve and deploy dewatering pump trucks to drain flooded streets.",
    engineering_solution: "1. Excavate trench using hydro-vacuum or mini excavator with trench box shoring.\n2. Cut out ruptured section of Ductile Iron (DI) pipe cleanly.\n3. Fit a wide-tolerance mechanical pipe coupling sleeve or stainless steel repair clamp (PN-16 rating).\n4. Flush trunk line with chlorinated water (50 mg/L free chlorine) to disinfect before restoring line pressure.\n5. Backfill trench with compacted granular aggregate.",
    required_equipment: ["Dewatering Diesel Pumps (100HP)", "Hydraulic Ductile Iron (DI) Pipe Cutter", "Stainless Steel Repair Clamp", "Turbidity & Chlorine Testing Kit"],
    budget_estimate: "₹1,20,000 - ₹2,50,000",
    sla_hours: SLA_HOURS[PRIORITY_TIERS.CRITICAL]
  },
  GARBAGE: {
    problem: "Open Commercial Waste Pile & Nuisance Accumulation",
    category: CIVIC_CATEGORIES.GARBAGE,
    tier: PRIORITY_TIERS.MEDIUM,
    first_action: "Deploy mechanized backhoe and dual-compartment hydraulic compactor truck to clear the rotting accumulation within 4 hours.",
    engineering_solution: "1. Mechanized clearance using Bobcat loader and wet-waste tipper.\n2. Wash asphalt surface with pressurized water jet mixed with bio-enzymatic odor neutralizer and citronella disinfectant.\n3. Install a semi-underground 5-cubic-meter waste compactor bin to eliminate open sightlines.\n4. Install solar CCTV camera with automated number plate recognition to penalize commercial dumpers.",
    required_equipment: ["Skid-Steer Loader", "10-Cube Hydraulic Compactor Truck", "High-Pressure Bio-Wash Tanker", "5m³ Semi-Underground Smart Bin"],
    budget_estimate: "₹35,000 initial cleanup + ₹1.5L smart bin infrastructure",
    sla_hours: SLA_HOURS[PRIORITY_TIERS.MEDIUM]
  },
  DRAINAGE: {
    problem: "Manhole Hazard & Sewer Blockage",
    category: CIVIC_CATEGORIES.DRAINAGE,
    tier: PRIORITY_TIERS.CRITICAL,
    first_action: "Erect fluorescent hard-barricade around the shaft immediately and assign a safety marshal until replacement slab is seated.",
    engineering_solution: "1. Deploy super-sucker vacuum jetting truck to blast silt and debris blockage in the trunk sewer.\n2. Install heavy-duty Steel Fiber Reinforced Concrete (SFRC) 35-ton rated frame and locking cover.\n3. Install internal stainless steel safety fall-prevention mesh netting beneath the cover to prevent child/pedestrian falling even if cover is tampered with.",
    required_equipment: ["Super-Sucker Jetting Vacuum Vehicle", "SFRC 35-Ton Heavy Duty Cover", "Fall-Prevention Safety Mesh", "H2S & CH4 Gas Detectors"],
    budget_estimate: "₹28,000 - ₹60,000",
    sla_hours: SLA_HOURS[PRIORITY_TIERS.CRITICAL]
  }
});

/**
 * Generates an intelligent, contextual chatbot response
 * @param {string} rawMessage - Citizen or staff prompt
 * @param {Array<Object>} complaints - Active complaints database
 * @returns {Object} Chat response object
 */
function processChatbotMessage(rawMessage, complaints = []) {
  const text = (rawMessage || '').trim().toLowerCase();

  // 1. Complaint ID Lookup
  const idMatch = text.match(/cp[- ]?(\d+)/i);
  if (idMatch) {
    const targetId = `CP-${idMatch[1]}`;
    const found = complaints.find(c => c.id.toLowerCase() === targetId.toLowerCase());
    if (found) {
      return {
        reply: `Here are the live municipal records for **${found.id}**:`,
        type: "complaint_status",
        data: found,
        solution_suggestion: {
          problem: found.title,
          category: found.category,
          tier: found.priority.tier,
          score: found.priority.score,
          first_action: found.action_plan.first_response,
          engineering_solution: `Remediation requires specialized deployment under ${found.department}. Target resolution SLA is ${found.action_plan.sla_hours} hours.`,
          required_equipment: found.action_plan.required_equipment,
          budget_estimate: found.action_plan.estimated_budget,
          sla_hours: found.action_plan.sla_hours
        }
      };
    }
  }

  // 2. Municipal Engineering Solution Recommendations
  if (text.includes("solution") || text.includes("suggest") || text.includes("fix") || text.includes("how to solve")) {
    if (text.includes("road") || text.includes("pothole") || text.includes("crater")) {
      return {
        reply: "Here is the recommended Municipal Engineering Solution for **Road Potholes & Surface Failures**:",
        type: "solution_guide",
        solution_suggestion: SOLUTION_GUIDES.ROADS
      };
    }
    if (text.includes("water") || text.includes("pipe") || text.includes("burst")) {
      return {
        reply: "Here is the recommended Municipal Engineering Solution for **High-Pressure Water Main Burst**:",
        type: "solution_guide",
        solution_suggestion: SOLUTION_GUIDES.WATER
      };
    }
    if (text.includes("garbage") || text.includes("trash") || text.includes("waste")) {
      return {
        reply: "Here is the recommended Municipal Engineering Solution for **Commercial Garbage Overflow**:",
        type: "solution_guide",
        solution_suggestion: SOLUTION_GUIDES.GARBAGE
      };
    }
    if (text.includes("drain") || text.includes("manhole") || text.includes("sewage")) {
      return {
        reply: "Here is the recommended Municipal Engineering Solution for **Sewage Overflow & Missing Manholes**:",
        type: "solution_guide",
        solution_suggestion: SOLUTION_GUIDES.DRAINAGE
      };
    }
  }

  // 3. Explainable Prioritization Rubric Questions
  if (text.includes("why") && (text.includes("priority") || text.includes("score") || text.includes("critical") || text.includes("high"))) {
    return {
      reply: "### ⚖️ How the AI Prioritization Rubric Works (0–100 Scale)\n\nEvery citizen complaint is scored transparently across four explainable pillars:\n\n1. **Public Safety & Hazard Severity (40%):** Immediate threats to life, electrical arcing, open deep shafts, or rapid flooding.\n2. **Population Impact & Vulnerability (25%):** Proximity to schools, hospitals, transit hubs, and residential zones.\n3. **Report Volume & Corroboration (20%):** Independent duplicate reports and verified photo evidence.\n4. **Time Decay / Risk Escalation (15%):** How fast deterioration compounds if left unaddressed for 24 hours.\n\n**Priority Tiers:**\n- 🔴 **Critical (80–100):** Response SLA within **2 Hours**.\n- 🟠 **High (60–79):** Response SLA within **12 Hours**.\n- 🟡 **Medium (30–59):** Response SLA within **48 Hours**.\n- 🟢 **Low (0–29):** Response SLA within **7 Days**.",
      type: "explanation"
    };
  }

  // 4. Ward & Locality Summaries
  if (text.includes("ward") || text.includes("area") || text.includes("shanti nagar") || text.includes("mg road") || text.includes("koramangala")) {
    let targetWard = "Ward 12";
    if (text.includes("shanti nagar") || text.includes("ward 8")) targetWard = "Ward 8";
    if (text.includes("koramangala") || text.includes("ward 19")) targetWard = "Ward 19";
    if (text.includes("gandhi chowk") || text.includes("ward 14")) targetWard = "Ward 14";
    if (text.includes("indiranagar") || text.includes("ward 5")) targetWard = "Ward 5";

    const matched = complaints.filter(c => c.location && c.location.ward.toLowerCase().includes(targetWard.toLowerCase()));
    return {
      reply: `Found **${matched.length} active complaints** in **${targetWard}**:`,
      type: "area_summary",
      data: matched.map(m => ({ id: m.id, title: m.title, priority: m.priority.tier, status: m.status }))
    };
  }

  // 5. Analytics Statistics
  if (text.includes("stat") || text.includes("how many") || text.includes("total") || text.includes("resolved") || text.includes("pending")) {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const critical = complaints.filter(c => c.priority.tier === 'Critical').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      reply: `📊 **Live CityPulse Analytics Snapshot:**\n- **Total Registered Complaints:** ${total}\n- **Resolved & Verified:** ${resolved} (${rate}% resolution rate)\n- **In Progress / Field Active:** ${complaints.filter(c => c.status === 'In Progress').length}\n- **Critical Emergencies:** ${critical} active work orders\n- **Average AI Triage Response Time:** < 0.8 seconds`,
      type: "stats"
    };
  }

  // General Guidance
  return {
    reply: "Hello! I am your **Civic AI Assistant**. I can help you with:\n\n1. **Checking Complaint Status:** Type your complaint ID (e.g., `CP-101` or `CP-104`).\n2. **Suggesting Engineering Solutions:** Ask `Suggest a solution for road potholes` or `How to fix water burst`.\n3. **Explaining AI Priorities:** Ask `Why is my complaint high priority?`.\n4. **Area Summaries:** Ask `What are the issues in Ward 12 (MG Road)?`.\n5. **Filing a Complaint:** Click the 'File a Complaint' tab on the left sidebar!",
    type: "general"
  };
}

module.exports = {
  processChatbotMessage,
  SOLUTION_GUIDES
};
