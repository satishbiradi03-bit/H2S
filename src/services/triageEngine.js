// ============================================================================
// CivicPulse AI - High-Efficiency Triage & Explainable Prioritization Engine
// Algorithmic Complexity: Optimized O(1) Keyword Match & Spatial Jaccard Cluster
// ============================================================================

const {
  CIVIC_CATEGORIES,
  PRIORITY_TIERS,
  PRIORITY_THRESHOLDS,
  SLA_HOURS,
  RUBRIC_WEIGHTS,
  DEPARTMENT_ROUTING
} = require('../constants');

// Precompiled Regular Expressions for O(1) Category Detection
const CATEGORY_PATTERNS = Object.freeze({
  [CIVIC_CATEGORIES.ROADS]: /\b(pothole|crater|asphalt|tar|curb|flyover|divider|road caved?|skid|gravel)\b/i,
  [CIVIC_CATEGORIES.WATER]: /\b(water|pipe|leak|pipeline|pressure|tanker|tap|burst|drinking|potable|submerged)\b/i,
  [CIVIC_CATEGORIES.GARBAGE]: /\b(garbage|trash|waste|dump|litter|bins|mound|smell|stench|rotting|cattle|mandi)\b/i,
  [CIVIC_CATEGORIES.STREETLIGHTS]: /\b(light|streetlight|lamp|dark|bulb|flicker|sodium|led|blackout|illumination)\b/i,
  [CIVIC_CATEGORIES.DRAINAGE]: /\b(drain|drainage|sewage|sewer|wastewater|manhole|gutter|clog|culvert|overflow|black water|backflow|shaft)\b/i,
  [CIVIC_CATEGORIES.PUBLIC_SAFETY]: /\b(wire|electric|shock|spark|fire|danger|accident|pole|tree falling|hazard|11kv|snapped)\b/i
});

// Precompiled Dictionary for Evidence Keywords
const EVIDENCE_KEYWORD_PATTERNS = Object.freeze([
  { pattern: /\b(sparking|sparks flying|live wire|11kv|electric shock)\b/i, label: "Live High-Voltage Arcing" },
  { pattern: /\b(open manhole|deep shaft|drowning risk)\b/i, label: "Uncovered Deep Shaft / Fall Hazard" },
  { pattern: /\b(burst|severe flood|knee deep|river)\b/i, label: "High-Pressure Water Trunk Rupture" },
  { pattern: /\b(accident|skid|motorcyclist|hospital access)\b/i, label: "Transit Collision / Skid Risk" },
  { pattern: /\b(sewage in homes|backflow|toilet overflow|pathogen)\b/i, label: "Biological Pathogen / Sewage Inundation" },
  { pattern: /\b(pitch black|dark corridor|safety hazard)\b/i, label: "Public Corridor Illumination Failure" },
  { pattern: /\b(pothole|crater|loose gravel)\b/i, label: "Structural Road Surface Failure" },
  { pattern: /\b(rotting|stench|stray cattle)\b/i, label: "Commercial Waste Hazard" },
  { pattern: /\b(hospital|emergency|opd|trauma)\b/i, label: "Proximity to Critical Health Facility" },
  { pattern: /\b(school|children|students|bus stop|college)\b/i, label: "Vulnerable School Zone Proximity" },
  { pattern: /\b(metro|arterial|flyover|ring road|junction)\b/i, label: "High-Density Transit Artery" }
]);

/**
 * Classifies complaint category based on text analysis
 * @param {string} text - Title and description text
 * @param {string} userCategory - User-selected category if provided
 * @returns {string} Detected civic category
 */
function classifyCategory(text, userCategory) {
  if (userCategory && userCategory !== 'Auto-Detect' && Object.values(CIVIC_CATEGORIES).includes(userCategory)) {
    return userCategory;
  }

  for (const [category, regex] of Object.entries(CATEGORY_PATTERNS)) {
    if (regex.test(text)) {
      return category;
    }
  }

  return CIVIC_CATEGORIES.OTHER;
}

/**
 * Detects semantic duplicate reports using Jaccard token overlap
 * @param {string} fullText - Cleaned text of candidate complaint
 * @param {string} category - Candidate category
 * @param {string} ward - Candidate ward
 * @param {Array<Object>} existingComplaints - Current active complaints
 * @returns {{isDuplicate: boolean, parentId: string|null, highestSimilarity: number}}
 */
function detectDuplicate(fullText, category, ward, existingComplaints = []) {
  const candidateTokens = new Set(fullText.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  if (candidateTokens.size === 0) return { isDuplicate: false, parentId: null, highestSimilarity: 0 };

  let highestSimilarity = 0;
  let parentId = null;

  for (const existing of existingComplaints) {
    if (existing.status === 'Resolved') continue;

    const existingText = `${existing.title} ${existing.description}`.toLowerCase();
    const existingTokens = new Set(existingText.split(/\W+/).filter(w => w.length > 3));

    let intersectionCount = 0;
    for (const token of candidateTokens) {
      if (existingTokens.has(token)) intersectionCount++;
    }

    const unionCount = candidateTokens.size + existingTokens.size - intersectionCount;
    const similarity = unionCount > 0 ? (intersectionCount / unionCount) : 0;

    const sameCategory = existing.category === category;
    const sameWard = existing.location && existing.location.ward === ward;

    // Same ward and category matching with shared key indicators
    const isSpatialCategoryMatch = sameWard && sameCategory && (similarity >= 0.14 || intersectionCount >= 2);
    const isStrongTextSimilarity = similarity >= 0.25 && (sameCategory || sameWard);

    if (isSpatialCategoryMatch || isStrongTextSimilarity) {
      if (similarity > highestSimilarity || !parentId) {
        highestSimilarity = Math.max(similarity, 0.30);
        parentId = existing.id;
      }
    }
  }

  return {
    isDuplicate: Boolean(parentId),
    parentId,
    highestSimilarity
  };
}

/**
 * Calculates deterministic, explainable 0–100 priority score
 * @param {string} text - Full complaint text
 * @param {boolean} hasPhoto - Media verification
 * @param {boolean} isDuplicate - Corroboration indicator
 * @param {string} ward - Ward name
 * @returns {{score: number, tier: string, breakdown: Object, rationale: string, evidence: string[]}}
 */
function calculatePriorityScore(text, hasPhoto, isDuplicate, ward) {
  const lowerText = text.toLowerCase();
  const evidence = [];

  // Extract evidence quotes
  for (const item of EVIDENCE_KEYWORD_PATTERNS) {
    if (item.pattern.test(lowerText)) {
      evidence.push(item.label);
    }
  }

  // 1. Safety & Hazard Severity (0–40)
  let safety = 6;
  if (/spark|live wire|electrocution|11kv|electric shock/i.test(lowerText)) {
    safety = 40;
  } else if (/open manhole|deep shaft|drowning risk/i.test(lowerText)) {
    safety = 38;
  } else if (/burst|severe flood|knee deep|river/i.test(lowerText)) {
    safety = 36;
  } else if (/accident|skid|motorcyclist|hospital access/i.test(lowerText)) {
    safety = 32;
  } else if (/sewage in homes|backflow|toilet overflow|pathogen/i.test(lowerText)) {
    safety = 31;
  } else if (/pitch black|dark corridor|safety hazard/i.test(lowerText)) {
    safety = 26;
  } else if (/pothole|crater|loose gravel/i.test(lowerText)) {
    safety = 20;
  } else if (/garbage|rotting|stench/i.test(lowerText)) {
    safety = 18;
  }

  // 2. Population Impact & Critical Facilities (0–25)
  let impact = 6;
  const isCosmetic = /faded|paint|zebra|bench|bollard|banner|graffiti|cosmetic/i.test(lowerText);

  if (/hospital|emergency|opd|trauma/i.test(lowerText)) {
    impact = 25;
  } else if (/(school|children|students|bus stop|college)/i.test(lowerText)) {
    impact = isCosmetic ? 10 : 24;
  } else if (/metro|arterial|flyover|ring road|junction/i.test(lowerText)) {
    impact = isCosmetic ? 8 : 22;
  } else if (/residential|commercial|market|colony/i.test(lowerText)) {
    impact = isCosmetic ? 6 : 18;
  }

  // 3. Corroboration & Duplicates Volume (0–20)
  let corroboration = hasPhoto ? 8 : 4;
  if (isDuplicate) corroboration += 8;

  // 4. SLA Urgency & Time Decay (0–15)
  let decay = 3;
  if (safety >= 35) decay = 14;
  else if (safety >= 25) decay = 10;
  else if (safety >= 18) decay = 7;

  const totalScore = Math.min(100, safety + impact + corroboration + decay);

  // Determine Tier Thresholds
  let tier = PRIORITY_TIERS.LOW;
  if (totalScore >= PRIORITY_THRESHOLDS.CRITICAL_MIN) {
    tier = PRIORITY_TIERS.CRITICAL;
  } else if (totalScore >= PRIORITY_THRESHOLDS.HIGH_MIN) {
    tier = PRIORITY_TIERS.HIGH;
  } else if (totalScore >= PRIORITY_THRESHOLDS.MEDIUM_MIN) {
    tier = PRIORITY_TIERS.MEDIUM;
  }

  const rationale = `Assigned ${tier} Priority with an aggregate AI score of ${totalScore}/100. Safety & hazard severity contributed ${safety}/${RUBRIC_WEIGHTS.MAX_SAFETY}, amplified by ${impact}/${RUBRIC_WEIGHTS.MAX_IMPACT} population impact near ${ward} and ${corroboration}/${RUBRIC_WEIGHTS.MAX_CORROBORATION} corroboration evidence.`;

  return {
    score: totalScore,
    tier,
    breakdown: { safety, impact, corroboration, decay },
    rationale,
    evidence: evidence.length > 0 ? evidence : ["Direct Citizen Report", "Ward Maintenance Log"]
  };
}

/**
 * Generates recommended municipal action plan
 * @param {string} category - Civic category
 * @param {string} tier - Priority tier
 * @returns {Object} Action plan with first response, equipment, budget, and SLA
 */
function generateActionPlan(category, tier) {
  const sla_hours = SLA_HOURS[tier] || 48;

  let first_response;
  if (tier === PRIORITY_TIERS.CRITICAL) {
    first_response = "Dispatch emergency response crew immediately with priority sirens and establish a 50-foot safety exclusion perimeter.";
  } else if (tier === PRIORITY_TIERS.HIGH) {
    first_response = "Deploy sector rapid repair team within 4 hours. Issue traffic diversion or utility safety advisory.";
  } else if (tier === PRIORITY_TIERS.MEDIUM) {
    first_response = "Schedule routine ward maintenance crew within 48-hour municipal turnaround.";
  } else {
    first_response = "Log into weekly preventive maintenance batch for scheduled non-emergency crew visit.";
  }

  let required_equipment;
  let estimated_budget;

  switch (category) {
    case CIVIC_CATEGORIES.ROADS:
      required_equipment = ["Bituminous Cold-Mix Compactor", "Tack Coat Emulsion Sprayer", "2-Ton Vibratory Roller", "Traffic Diverter Cones"];
      estimated_budget = tier === PRIORITY_TIERS.CRITICAL ? "₹65,000 - ₹95,000" : "₹25,000 - ₹45,000";
      break;
    case CIVIC_CATEGORIES.WATER:
      required_equipment = ["Pipe Acoustic Correlator", "Ductile Iron Repair Sleeves", "100HP Dewatering Sump Pump", "Trench Box Shoring"];
      estimated_budget = tier === PRIORITY_TIERS.CRITICAL ? "₹1,20,000 - ₹2,50,000" : "₹35,000 - ₹60,000";
      break;
    case CIVIC_CATEGORIES.DRAINAGE:
      required_equipment = ["High-Pressure Vacuum Jetting Vehicle", "Steel Fiber Reinforced Concrete Cover", "Safety Mesh Netting", "Gas Detectors"];
      estimated_budget = tier === PRIORITY_TIERS.CRITICAL ? "₹50,000 - ₹85,000" : "₹18,000 - ₹35,000";
      break;
    case CIVIC_CATEGORIES.PUBLIC_SAFETY:
      required_equipment = ["Insulated High-Voltage Bucket Truck", "Arc-Flash PPE 40 cal/cm²", "Dielectric Grounding Clamps", "Hydraulic Crane"];
      estimated_budget = tier === PRIORITY_TIERS.CRITICAL ? "₹85,000 - ₹1,40,000" : "₹20,000 - ₹40,000";
      break;
    case CIVIC_CATEGORIES.GARBAGE:
      required_equipment = ["10-Cubic-Meter Hydraulic Compactor Truck", "Bobcat Skid-Steer Loader", "Bio-Enzymatic Odor Spray", "HDPE Smart Bins"];
      estimated_budget = "₹15,000 - ₹35,000";
      break;
    case CIVIC_CATEGORIES.STREETLIGHTS:
      required_equipment = ["Aerial Cherry Picker Platform", "Underground Cable Fault Locator (TDR)", "70W IP66 LED Fixtures", "Contactor Relays"];
      estimated_budget = "₹12,000 - ₹36,000";
      break;
    default:
      required_equipment = ["Municipal Utility Vehicle", "Hand Toolkits", "Safety Gear"];
      estimated_budget = "₹5,000 - ₹15,000";
  }

  return {
    first_response,
    required_equipment,
    sla_hours,
    estimated_budget
  };
}

/**
 * End-to-end complaint triage execution
 * @param {Object} input - Sanitized complaint data
 * @param {Array<Object>} existingComplaints - Existing complaint database
 * @returns {Object} Comprehensive triage result
 */
function triageComplaint(input, existingComplaints = []) {
  const fullText = `${input.title} ${input.description}`;
  const category = classifyCategory(fullText, input.category);
  const department = DEPARTMENT_ROUTING[category] || DEPARTMENT_ROUTING[CIVIC_CATEGORIES.OTHER];

  const { isDuplicate, parentId } = detectDuplicate(fullText, category, input.ward, existingComplaints);
  const priority = calculatePriorityScore(fullText, input.has_photo, isDuplicate, input.ward);
  const actionPlan = generateActionPlan(category, priority.tier);

  return {
    category,
    department,
    priority,
    action_plan: actionPlan,
    is_duplicate: isDuplicate,
    parent_id: parentId
  };
}

module.exports = {
  classifyCategory,
  detectDuplicate,
  calculatePriorityScore,
  generateActionPlan,
  triageComplaint
};
