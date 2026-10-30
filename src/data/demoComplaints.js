// ============================================================================
// CivicPulse AI - 24 Realistic Demo Complaints for Kalyanpur Smart City
// High-Fidelity Dataset: 4 Critical, 6 High, 8 Medium, 6 Low with Clustered Duplicates
// ============================================================================

const initialComplaints = [
  {
    id: "CP-101",
    title: "Major 18-inch water main burst flooding MG Road commercial market",
    description: "A high-pressure underground water trunk main has ruptured near Metro Pillar 142. Potable drinking water is gushing out rapidly, flooding both road lanes and entering basement storefronts. Massive water wastage and traffic standstill.",
    category: "Water Supply Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB)",
    location: {
      address: "Metro Pillar 142, MG Road Commercial Boulevard",
      ward: "Ward 12 - Central Business District",
      lat: 12.9754,
      lng: 77.6067
    },
    status: "In Progress",
    priority: {
      score: 94,
      tier: "Critical",
      breakdown: { safety: 38, impact: 24, corroboration: 18, decay: 14 },
      rationale: "Assigned Critical (94/100) due to severe drinking water trunk line rupture causing active flooding in a major commercial and transit artery. Significant infrastructure damage and secondary electrical hazard risk.",
      evidence: ["18-inch water trunk rupture", "flooding basement shops", "Metro corridor transit standstill"]
    },
    action_plan: {
      first_response: "Deploy emergency valve isolation crew to shut off feeder sector 4B within 20 mins. Mobilize high-capacity dewatering pumps.",
      required_equipment: ["Ductile Iron Clamp Sleeves", "100HP Dewatering Pumps", "Heavy Trench Excavator", "Trench Shoring Shields"],
      sla_hours: 2,
      estimated_budget: "₹1,85,000"
    },
    is_duplicate: false,
    duplicate_count: 2,
    related_ids: ["CP-102", "CP-103"],
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T07:15:00.000Z",
    citizen_name: "Vikram Malhotra",
    action_notes: [
      { timestamp: "2026-10-30T07:22:00.000Z", author: "AI Triage Engine", note: "Auto-classified as Water Supply Critical. Triggered emergency SMS alert to KWSSB Rapid Response Unit." },
      { timestamp: "2026-10-30T07:45:00.000Z", author: "Superintending Engineer R. Sharma", note: "Field Crew #4 on site. Sector valve 4B isolated. Pressure dropped by 80%. Dewatering initiated." }
    ]
  },
  {
    id: "CP-102",
    title: "Massive water flooding street near Metro Station Gate 2, MG Road",
    description: "Huge volume of clean water gushing from road cracks opposite Metro Gate 2. Commuters unable to exit station without wading through knee-deep water.",
    category: "Water Supply Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB)",
    location: {
      address: "Opposite Metro Gate 2, MG Road",
      ward: "Ward 12 - Central Business District",
      lat: 12.9757,
      lng: 77.6071
    },
    status: "AI Analyzed",
    priority: {
      score: 92,
      tier: "Critical",
      breakdown: { safety: 37, impact: 23, corroboration: 18, decay: 14 },
      rationale: "Identified as duplicate of high-velocity pipeline rupture CP-101. Proximity < 60 meters and matching water main event.",
      evidence: ["knee-deep water", "Metro Gate 2 flooding", "water gushing from cracked road"]
    },
    action_plan: {
      first_response: "Corroborated with CP-101 incident. Crew dispatched under parent ticket.",
      required_equipment: ["Linked with primary work order CP-101"],
      sla_hours: 2,
      estimated_budget: "Included in CP-101"
    },
    is_duplicate: true,
    parent_id: "CP-101",
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T07:35:00.000Z",
    citizen_name: "Pooja Hegde",
    action_notes: [
      { timestamp: "2026-10-30T07:36:00.000Z", author: "AI Triage Engine", note: "Semantic & spatial match: Linked as duplicate of parent incident CP-101." }
    ]
  },
  {
    id: "CP-103",
    title: "Clean drinking water flowing onto road like a river at MG Road junction",
    description: "Water pipe has cracked completely. Clean drinking water wasting in thousands of liters since morning. Traffic jam reaching Trinity Circle.",
    category: "Water Supply Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB)",
    location: {
      address: "MG Road & Residency Rd Junction",
      ward: "Ward 12 - Central Business District",
      lat: 12.9751,
      lng: 77.6062
    },
    status: "Submitted",
    priority: {
      score: 90,
      tier: "Critical",
      breakdown: { safety: 36, impact: 22, corroboration: 18, decay: 14 },
      rationale: "Corroborates ongoing water main failure CP-101. High impact on urban mobility and drinking water conservation.",
      evidence: ["thousands of liters wasting", "water like river", "Trinity Circle traffic jam"]
    },
    action_plan: {
      first_response: "Attached to master dispatch order CP-101.",
      required_equipment: ["Linked with primary work order CP-101"],
      sla_hours: 2,
      estimated_budget: "Included in CP-101"
    },
    is_duplicate: true,
    parent_id: "CP-101",
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-30T07:50:00.000Z",
    citizen_name: "Anand Rangan",
    action_notes: [
      { timestamp: "2026-10-30T07:51:00.000Z", author: "AI Triage Engine", note: "Linked to active parent incident CP-101. Citizen notified of existing crew dispatch." }
    ]
  },
  {
    id: "CP-104",
    title: "Live 11kV electrical wire snapped and sparking on pavement near City Hospital",
    description: "An overhead 11kV distribution line broke during gusty winds and is hanging 2 feet above the pedestrian walkway directly outside the Emergency OPD entrance. Visible electrical arcing and sparks flying.",
    category: "Public Safety",
    department: "Kalyanpur Electricity Supply Corporation (KESCO)",
    location: {
      address: "Outside Emergency OPD, District Civil Hospital, Hospital Road",
      ward: "Ward 3 - Civil Lines & Health District",
      lat: 12.9812,
      lng: 77.5891
    },
    status: "In Progress",
    priority: {
      score: 98,
      tier: "Critical",
      breakdown: { safety: 40, impact: 25, corroboration: 19, decay: 14 },
      rationale: "Immediate threat to human life. Active high-voltage 11kV arcing directly outside regional hospital emergency bay. Extreme risk of electrocution and hospital access blockage.",
      evidence: ["11kV live distribution line", "sparks flying and arcing", "outside Hospital Emergency OPD"]
    },
    action_plan: {
      first_response: "Remote substation breaker trip confirmed on Feeder H-09. Police cordoned 50m radius. Rapid line restoration team dispatched.",
      required_equipment: ["Insulated High-Voltage Bucket Truck", "Arc-Flash 40 cal/cm² PPE", "Dielectric Grounding Clamps", "Aerial Tension Winch"],
      sla_hours: 1,
      estimated_budget: "₹85,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T08:05:00.000Z",
    citizen_name: "Dr. Sunita Kulkarni",
    action_notes: [
      { timestamp: "2026-10-30T08:06:00.000Z", author: "AI Triage Engine", note: "P0 Critical Flagged. Substation Feeder H-09 signaled for immediate breaker trip." },
      { timestamp: "2026-10-30T08:20:00.000Z", author: "KESCO Dispatcher G. Nair", note: "Breaker tripped. Line de-energized. Emergency lineman team on site replacing tension insulator." }
    ]
  },
  {
    id: "CP-105",
    title: "Deep open manhole uncovered on school walking route outside DAV Public School",
    description: "Cast-iron manhole cover is missing or was stolen overnight. A 10-foot deep stormwater shaft is completely uncovered right on the pedestrian footpath where hundreds of elementary students walk at 8:00 AM.",
    category: "Drainage Problems",
    department: "Municipal Public Works Department (PWD - Drainage)",
    location: {
      address: "Pedestrian Walkway, 50m before DAV Public School Gate, Vidyapeetha Road",
      ward: "Ward 9 - Vidyapeetha Institutional Zone",
      lat: 12.9348,
      lng: 77.5683
    },
    status: "Assigned",
    priority: {
      score: 93,
      tier: "Critical",
      breakdown: { safety: 39, impact: 24, corroboration: 17, decay: 13 },
      rationale: "Severe life hazard for school children. 10-foot vertical fall risk directly along primary student footpath. High probability of fatal drowning or blunt force trauma.",
      evidence: ["uncovered 10-foot deep shaft", "school walking route", "DAV Public School hundreds of kids"]
    },
    action_plan: {
      first_response: "Place fluorescent barricade and flashing caution hazard strobe immediately. Install heavy-duty reinforced SFRC manhole cover with internal safety fall-prevention mesh.",
      required_equipment: ["Reinforced SFRC 25-ton Rated Cover", "Internal Fall-Arrest Mesh Grating", "Warning Barricades & LED Strobe", "Hydraulic Crane Truck"],
      sla_hours: 2,
      estimated_budget: "₹24,500"
    },
    is_duplicate: false,
    duplicate_count: 1,
    related_ids: ["CP-106"],
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T06:50:00.000Z",
    citizen_name: "Sunil Verma",
    action_notes: [
      { timestamp: "2026-10-30T06:55:00.000Z", author: "AI Triage Engine", note: "High Vulnerability Zone detected (School perimeter). Priority elevated to Critical." },
      { timestamp: "2026-10-30T07:10:00.000Z", author: "Assistant Executive Engineer Joshi", note: "Work order #DR-4402 issued. Guard assigned to stand watch until replacement slab arrives." }
    ]
  },
  {
    id: "CP-106",
    title: "Open stormwater drain without slab near DAV School bus stop",
    description: "Dangerous hole in footpath where drain slab is broken. Small children getting down from school buses could fall inside.",
    category: "Drainage Problems",
    department: "Municipal Public Works Department (PWD - Drainage)",
    location: {
      address: "Near DAV School Bus Stand, Vidyapeetha Road",
      ward: "Ward 9 - Vidyapeetha Institutional Zone",
      lat: 12.9351,
      lng: 77.5687
    },
    status: "AI Analyzed",
    priority: {
      score: 91,
      tier: "Critical",
      breakdown: { safety: 38, impact: 23, corroboration: 17, decay: 13 },
      rationale: "Duplicate confirmation of open drain hazard CP-105 outside DAV School. Reinforces urgent school transit threat.",
      evidence: ["hole in footpath", "DAV school bus stand", "small children falling danger"]
    },
    action_plan: {
      first_response: "Linked to primary repair ticket CP-105.",
      required_equipment: ["Linked with primary work order CP-105"],
      sla_hours: 2,
      estimated_budget: "Included in CP-105"
    },
    is_duplicate: true,
    parent_id: "CP-105",
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-30T07:20:00.000Z",
    citizen_name: "Meenakshi Iyer",
    action_notes: [
      { timestamp: "2026-10-30T07:21:00.000Z", author: "AI Triage Engine", note: "Corroborates open drain shaft at school route. Joined to cluster CP-105." }
    ]
  },
  {
    id: "CP-107",
    title: "Massive 2-foot deep crater pothole on Outer Ring Road Flyover causing bike skids",
    description: "An expanding crater-like pothole has formed on the downhill ramp of Outer Ring Road Flyover towards Koramangala. Two motorcyclists have already slipped this morning during peak traffic.",
    category: "Roads and potholes",
    department: "Public Works Department (PWD - Roads Division)",
    location: {
      address: "Downhill Ramp, Outer Ring Road Flyover, near Silk Board Exit",
      ward: "Ward 21 - Outer Ring Road Corridor",
      lat: 12.9175,
      lng: 77.6234
    },
    status: "In Progress",
    priority: {
      score: 77,
      tier: "High",
      breakdown: { safety: 32, impact: 21, corroboration: 14, decay: 10 },
      rationale: "Assigned High (77/100) due to acute accident risk on high-speed flyover descent. Verified reports of two-wheeler skids on heavily trafficked commuter corridor.",
      evidence: ["2-foot deep crater", "motorcyclists slipping and skidding", "high-speed flyover ramp"]
    },
    action_plan: {
      first_response: "Place rubber traffic cones and reflective warning board immediately. Deploy asphalt cold-mix rapid patch repair team.",
      required_equipment: ["Bituminous Cold-Mix Compactor", "Tack Coat Bitumen Emulsion Spray", "Vibratory Roller (1.5 Ton)", "Traffic Diverter Cones"],
      sla_hours: 8,
      estimated_budget: "₹42,000"
    },
    is_duplicate: false,
    duplicate_count: 1,
    related_ids: ["CP-108"],
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T08:15:00.000Z",
    citizen_name: "Karan Singhal",
    action_notes: [
      { timestamp: "2026-10-30T08:25:00.000Z", author: "AI Triage Engine", note: "Accident keyword 'motorcyclists slipped' detected. Priority elevated to High tier." },
      { timestamp: "2026-10-30T08:50:00.000Z", author: "PWD Road Inspector Tiwari", note: "Cones placed to cordon inner lane. Rapid asphalt compaction unit dispatched from Central Yard." }
    ]
  },
  {
    id: "CP-108",
    title: "Sunken road surface and severe asphalt potholes at Outer Ring Road",
    description: "Deep pothole opening up on flyover descent. Vehicles swerving dangerously to avoid it causing near-miss collisions.",
    category: "Roads and potholes",
    department: "Public Works Department (PWD - Roads Division)",
    location: {
      address: "Outer Ring Road Flyover down-ramp",
      ward: "Ward 21 - Outer Ring Road Corridor",
      lat: 12.9179,
      lng: 77.6238
    },
    status: "AI Analyzed",
    priority: {
      score: 75,
      tier: "High",
      breakdown: { safety: 31, impact: 21, corroboration: 13, decay: 10 },
      rationale: "Duplicate confirmation of dangerous pothole crater on Outer Ring Road ramp (CP-107). Corroborates vehicle collision hazards.",
      evidence: ["vehicles swerving dangerously", "deep pothole on flyover descent"]
    },
    action_plan: {
      first_response: "Merged with active rapid road repair work order CP-107.",
      required_equipment: ["Linked with primary work order CP-107"],
      sla_hours: 8,
      estimated_budget: "Included in CP-107"
    },
    is_duplicate: true,
    parent_id: "CP-107",
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-30T08:40:00.000Z",
    citizen_name: "Rahul Nambiar",
    action_notes: [
      { timestamp: "2026-10-30T08:41:00.000Z", author: "AI Triage Engine", note: "Linked to parent road emergency CP-107." }
    ]
  },
  {
    id: "CP-109",
    title: "Black sewage overflow submerging ground floor residences on 4th Cross Shanti Nagar",
    description: "Main underground sewer line is choked with construction debris. Thick, toxic black sewage is bubbling out of inspection chambers and backflowing into residential toilets and ground-floor living rooms.",
    category: "Drainage Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB - Sewerage)",
    location: {
      address: "Lane 4, 4th Cross, Shanti Nagar Residential Area",
      ward: "Ward 8 - Shanti Nagar Residential",
      lat: 12.9567,
      lng: 77.5982
    },
    status: "In Progress",
    priority: {
      score: 79,
      tier: "High",
      breakdown: { safety: 33, impact: 22, corroboration: 14, decay: 10 },
      rationale: "Assigned High (79/100). Severe biohazard and cholera/gastroenteritis health hazard. Direct residential intrusion with waterborne pathogen exposure for 35 households.",
      evidence: ["black sewage entering residential homes", "backflowing into toilets", "choked main sewer line"]
    },
    action_plan: {
      first_response: "Deploy high-pressure hydraulic jetting suction super-sucker truck to clear blockage. Spray chemical disinfectant lime powder across lane.",
      required_equipment: ["High-Capacity Super-Sucker Vacuum Jetting Vehicle", "Root-Cutter & Mechanical Rodding Rig", "Sodium Hypochlorite Spray Tank", "Gas Detection Meters"],
      sla_hours: 6,
      estimated_budget: "₹58,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T06:30:00.000Z",
    citizen_name: "Farhana Begum",
    action_notes: [
      { timestamp: "2026-10-30T06:35:00.000Z", author: "AI Triage Engine", note: "Health threat identified ('pathogen', 'homes flooded with sewage'). Priority High." },
      { timestamp: "2026-10-30T07:15:00.000Z", author: "KWSSB Sanitary Inspector Murthy", note: "Jetting truck #09 on location. Main conduit silt obstruction localized at junction 4C." }
    ]
  },
  {
    id: "CP-110",
    title: "Continuous 2 km stretch of dark streetlights on 80ft Road, safety hazard for commuters",
    description: "All 45 LED streetlights along the 80ft Road stretch between 12th Main and Sony World Signal are pitch black for the third night in a row. Female pedestrians and evening runners feel completely unsafe.",
    category: "Streetlight Failures",
    department: "Municipal Streetlight & Energy Cell",
    location: {
      address: "80ft Road, between 12th Main and Sony World Junction",
      ward: "Ward 5 - Indiranagar Hub",
      lat: 12.9719,
      lng: 77.6412
    },
    status: "Assigned",
    priority: {
      score: 72,
      tier: "High",
      breakdown: { safety: 28, impact: 22, corroboration: 12, decay: 10 },
      rationale: "Assigned High (72/100). Extensive public safety risk over a major 2 km pedestrian and transit corridor. High vulnerability for women commuters and pedestrian-vehicle accidents.",
      evidence: ["45 LED streetlights pitch black", "third night in a row", "female pedestrians feel unsafe"]
    },
    action_plan: {
      first_response: "Inspect central Feeder Pillar Box FP-12. Test for burnt MCB contactor and underground cable fault using pulse echo tester.",
      required_equipment: ["Mobile Elevating Work Platform (Cherry Picker)", "Underground Cable Fault Locator (TDR)", "Triple Pole 63A Contactor & Timer Relay", "Thermal Imaging Multimeter"],
      sla_hours: 12,
      estimated_budget: "₹36,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-29T21:45:00.000Z",
    citizen_name: "Deepa Krishnan",
    action_notes: [
      { timestamp: "2026-10-29T21:50:00.000Z", author: "AI Triage Engine", note: "Identified multi-pole black corridor. Flagged safety risk on commercial arterial road." },
      { timestamp: "2026-10-30T08:00:00.000Z", author: "Energy Division AE Rajesh", note: "Feeder pillar FP-12 inspection assigned to Shift Crew B." }
    ]
  },
  {
    id: "CP-111",
    title: "Contaminated brownish muddy tap water supplied to Sector 4 residents for 2 days",
    description: "Drinking water flowing from municipal pipes has a foul stench and brown muddy discoloration. Multiple residents in Sector 4 report stomach infections. Suspected cross-contamination with nearby storm drain.",
    category: "Water Supply Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB - Quality)",
    location: {
      address: "Cross 2 to 7, Sector 4 Housing Board Colony",
      ward: "Ward 8 - Shanti Nagar Residential",
      lat: 12.9542,
      lng: 77.5954
    },
    status: "Assigned",
    priority: {
      score: 76,
      tier: "High",
      breakdown: { safety: 32, impact: 22, corroboration: 12, decay: 10 },
      rationale: "Assigned High (76/100). Contaminated municipal drinking water posing public health risk. Multiple reported illness symptoms indicate cross-contamination.",
      evidence: ["foul stench and brown muddy water", "stomach infections reported", "cross-contamination with drain"]
    },
    action_plan: {
      first_response: "Isolate local supply valve. Dispatch water testing mobile lab to test residual chlorine, turbidity, and E. coli. Provide emergency potable water tankers.",
      required_equipment: ["Mobile Spectrophotometric Water Test Kit", "Chlorine Dosing Rig", "3x 6000L Emergency Drinking Water Tankers", "Pipe Acoustic Leak Correlator"],
      sla_hours: 8,
      estimated_budget: "₹65,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T05:50:00.000Z",
    citizen_name: "Amitabh Banerjee",
    action_notes: [
      { timestamp: "2026-10-30T06:00:00.000Z", author: "AI Triage Engine", note: "Public health alert: Water contamination with reported illness symptoms." }
    ]
  },
  {
    id: "CP-112",
    title: "Dangerously leaning old banyan tree ready to collapse on overhead electric cables on 10th Main",
    description: "Heavy rains loosened the root bed of a 40-year-old banyan tree. It is leaning at a 45-degree angle resting against low-tension electrical cables directly above parked cars and pedestrians.",
    category: "Public Safety",
    department: "Public Safety & Disaster Management Directorate",
    location: {
      address: "Corner of 10th Main & 4th Cross, Koramangala 4th Block",
      ward: "Ward 19 - Koramangala Tech Corridor",
      lat: 12.9328,
      lng: 77.6321
    },
    status: "AI Analyzed",
    priority: {
      score: 69,
      tier: "High",
      breakdown: { safety: 30, impact: 19, corroboration: 11, decay: 9 },
      rationale: "Assigned High (69/100). Structural instability of heavy tree leaning on energized electric wires. High potential of power outage and physical damage in storm conditions.",
      evidence: ["45-degree leaning banyan tree", "resting on electric cables", "loosened root bed"]
    },
    action_plan: {
      first_response: "Coordinate with KESCO to temporarily isolate power while tree pruners crane-stabilize heavy branches. Systematic scientific trimming of leaning crown.",
      required_equipment: ["25-ton Hydraulic Mobile Crane", "Heavy Duty Chainsaws (Petrol)", "Power Cable Insulating Blankets", "Wood Chipper / Debris Hauler"],
      sla_hours: 12,
      estimated_budget: "₹38,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T07:10:00.000Z",
    citizen_name: "Ramesh Chandran",
    action_notes: [
      { timestamp: "2026-10-30T07:12:00.000Z", author: "AI Triage Engine", note: "Multi-department handoff: Tree Hazard + Electrical Grid proximity detected." }
    ]
  },
  {
    id: "CP-113",
    title: "2-ton open garbage pile rotting outside Gandhi Chowk Sabzi Mandi attracting stray cattle",
    description: "Municipal compactor truck has skipped collection for 5 straight days. An enormous mound of decaying vegetables, fruit skins, and plastic has spilled onto half the roadway, creating a foul stench and attracting pigs and cows.",
    category: "Garbage collection",
    department: "Solid Waste Management Division (SWM - Swachhata)",
    location: {
      address: "Gate 3, Gandhi Chowk Wholesale Vegetable Market",
      ward: "Ward 14 - Gandhi Chowk Market District",
      lat: 12.9682,
      lng: 77.5765
    },
    status: "In Progress",
    priority: {
      score: 56,
      tier: "Medium",
      breakdown: { safety: 22, impact: 18, corroboration: 9, decay: 7 },
      rationale: "Assigned Medium (56/100). Unsanitary commercial vegetable waste accumulation. Odor nuisance, stray animal traffic hazards, and hygiene decay.",
      evidence: ["rotting outside vegetable market for 5 days", "2-ton waste mound spilling onto road", "stray cattle obstruction"]
    },
    action_plan: {
      first_response: "Deploy mechanical backhoe loader and 2 compactor tipper trucks. Follow up with bleaching powder and citronella eco-sanitization spray.",
      required_equipment: ["10-Cubic-Meter Hydraulic Compactor Truck", "Bobcat Skid-Steer Loader", "Disinfectant Spraying Unit", "Sanitation Crew (6 personnel)"],
      sla_hours: 24,
      estimated_budget: "₹22,000"
    },
    is_duplicate: false,
    duplicate_count: 1,
    related_ids: ["CP-114"],
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-29T16:20:00.000Z",
    citizen_name: "Santosh Yadav",
    action_notes: [
      { timestamp: "2026-10-29T16:25:00.000Z", author: "AI Triage Engine", note: "Solid Waste threshold breached (>3 days uncollected). Assigned to Ward 14 SWM Unit." },
      { timestamp: "2026-10-30T09:00:00.000Z", author: "SWM Inspector Qureshi", note: "Tipper vehicle #KA-04-G-8820 en route to Gandhi Chowk Gate 3." }
    ]
  },
  {
    id: "CP-114",
    title: "Commercial vegetable waste dumped on footpath at Gandhi Chowk market corner",
    description: "Vegetable vendors have dumped rotten cabbages and potatoes on footpath. Pedestrians forced to walk on road with heavy traffic.",
    category: "Garbage collection",
    department: "Solid Waste Management Division (SWM - Swachhata)",
    location: {
      address: "Gandhi Chowk market perimeter",
      ward: "Ward 14 - Gandhi Chowk Market District",
      lat: 12.9685,
      lng: 77.5768
    },
    status: "Submitted",
    priority: {
      score: 54,
      tier: "Medium",
      breakdown: { safety: 21, impact: 18, corroboration: 8, decay: 7 },
      rationale: "Duplicate confirmation of market garbage pile CP-113. Highlights pedestrian displacement onto road.",
      evidence: ["vegetable waste on footpath", "forced to walk on road"]
    },
    action_plan: {
      first_response: "Linked to active cleanup work order CP-113.",
      required_equipment: ["Linked with primary work order CP-113"],
      sla_hours: 24,
      estimated_budget: "Included in CP-113"
    },
    is_duplicate: true,
    parent_id: "CP-113",
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-30T08:10:00.000Z",
    citizen_name: "Gopal Krishna",
    action_notes: [
      { timestamp: "2026-10-30T08:11:00.000Z", author: "AI Triage Engine", note: "Duplicate of active cleanup ticket CP-113." }
    ]
  },
  {
    id: "CP-115",
    title: "Broken curb stones and loose gravel spreading across lane 3, Koramangala",
    description: "Recent fiber-optic trenching left broken curb stones and loose sharp gravel across the road bend. Causes slight skidding for cycles and two-wheelers.",
    category: "Roads and potholes",
    department: "Public Works Department (PWD - Roads Division)",
    location: {
      address: "Lane 3, 5th Block, Koramangala",
      ward: "Ward 19 - Koramangala Tech Corridor",
      lat: 12.9354,
      lng: 77.6251
    },
    status: "AI Analyzed",
    priority: {
      score: 48,
      tier: "Medium",
      breakdown: { safety: 18, impact: 16, corroboration: 8, decay: 6 },
      rationale: "Assigned Medium (48/100). Moderate road surface hazard on residential collector road. Utility contractor failed to properly restore curb boundary.",
      evidence: ["broken curb stones", "loose sharp gravel on road bend"]
    },
    action_plan: {
      first_response: "Issue violation notice to telecom contractor. Sweep gravel and reinstall precast concrete curb edgings.",
      required_equipment: ["Mechanical Road Sweeper", "Precast Concrete Curb Stones (M25 grade)", "Cement Mortar Mix (1:3)", "Hand Tamper"],
      sla_hours: 48,
      estimated_budget: "₹18,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-29T14:10:00.000Z",
    citizen_name: "Sneha Nair",
    action_notes: [
      { timestamp: "2026-10-29T14:15:00.000Z", author: "AI Triage Engine", note: "Categorized as Road Hazard - Contractor Restoration Defect." }
    ]
  },
  {
    id: "CP-116",
    title: "3 sodium lamps flickering intermittently near Community Hall, Shanti Nagar",
    description: "Three streetlights outside the community center keep turning on and off constantly like a disco light. It creates unsettling shadows at night.",
    category: "Streetlight Failures",
    department: "Municipal Streetlight & Energy Cell",
    location: {
      address: "Opposite Shanti Nagar Community Hall, 2nd Main",
      ward: "Ward 8 - Shanti Nagar Residential",
      lat: 12.9550,
      lng: 77.5970
    },
    status: "Resolved",
    priority: {
      score: 42,
      tier: "Medium",
      breakdown: { safety: 16, impact: 14, corroboration: 7, decay: 5 },
      rationale: "Assigned Medium (42/100). Nuisance lighting defect with minor night illumination deficit.",
      evidence: ["flickering sodium lamps", "opposite community hall"]
    },
    action_plan: {
      first_response: "Replace old electromagnetic ignitors with 70W energy-efficient LED luminaires.",
      required_equipment: ["70W IP66 LED Streetlight Fixtures", "Aluminum Extension Ladder", "Insulated Toolkit"],
      sla_hours: 48,
      estimated_budget: "₹9,500"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-28T19:30:00.000Z",
    citizen_name: "Mohan Lal",
    action_notes: [
      { timestamp: "2026-10-28T19:35:00.000Z", author: "AI Triage Engine", note: "Triage complete. Priority Medium." },
      { timestamp: "2026-10-29T11:20:00.000Z", author: "Lineman S. Gowda", note: "3x 70W LED fixtures installed. Circuit tested OK. Ticket marked Resolved." }
    ],
    citizen_feedback: {
      rating: 5,
      comment: "Prompt repair! Very bright new LED lights installed. Thank you CityPulse!",
      submitted_at: "2026-10-29T15:00:00.000Z"
    }
  },
  {
    id: "CP-117",
    title: "Silted rainwater drain clogging whenever it drizzles, causing waterlogging outside Post Office",
    description: "The roadside storm culvert is choked with plastic wrappers and leaf silt. Even 10 minutes of drizzle leads to 6 inches of water accumulation blocking the Post Office entry.",
    category: "Drainage Problems",
    department: "Municipal Public Works Department (PWD - Drainage)",
    location: {
      address: "Outside Head Post Office, Gandhi Chowk Road",
      ward: "Ward 14 - Gandhi Chowk Market District",
      lat: 12.9691,
      lng: 77.5752
    },
    status: "Assigned",
    priority: {
      score: 51,
      tier: "Medium",
      breakdown: { safety: 19, impact: 18, corroboration: 8, decay: 6 },
      rationale: "Assigned Medium (51/100). Recurrent nuisance waterlogging outside public civic facility due to drain sediment clogging.",
      evidence: ["silted drain choking", "waterlogging outside Post Office"]
    },
    action_plan: {
      first_response: "Manual desilting of culvert catch-pit and installation of trash-screen grate.",
      required_equipment: ["Silt Scoops & Wheelbarrows", "Cast-Iron Trash Grating", "Dewatering Sump Pump (5HP)"],
      sla_hours: 48,
      estimated_budget: "₹14,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-29T11:45:00.000Z",
    citizen_name: "Radhika Shenoy",
    action_notes: [
      { timestamp: "2026-10-29T11:50:00.000Z", author: "AI Triage Engine", note: "Categorized as Stormwater Drainage Maintenance." }
    ]
  },
  {
    id: "CP-118",
    title: "Low water pressure on upper floors in Civil Lines Colony for 3 consecutive days",
    description: "Municipal supply pressure is barely reaching ground level sumps, and overhead tanks on 1st/2nd floors are dry. Colony residents having to purchase private tankers.",
    category: "Water Supply Problems",
    department: "Kalyanpur Water Supply & Sewerage Board (KWSSB)",
    location: {
      address: "Block B, Civil Lines Officers Colony",
      ward: "Ward 3 - Civil Lines & Health District",
      lat: 12.9830,
      lng: 77.5910
    },
    status: "Resolved",
    priority: {
      score: 39,
      tier: "Medium",
      breakdown: { safety: 12, impact: 15, corroboration: 7, decay: 5 },
      rationale: "Assigned Medium (39/100). Service delivery deficiency without immediate contamination or structural damage.",
      evidence: ["low water pressure", "dry overhead tanks for 3 days"]
    },
    action_plan: {
      first_response: "Check Booster Station #2 pressure transducers. Clear inline strainer valve.",
      required_equipment: ["Pressure Gauge Calibrator", "Valve Key Rods", "Ultrasonic Flow Meter"],
      sla_hours: 48,
      estimated_budget: "₹8,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-28T09:15:00.000Z",
    citizen_name: "Col. Pradeep Sen",
    action_notes: [
      { timestamp: "2026-10-28T09:20:00.000Z", author: "AI Triage Engine", note: "Assigned to Water Supply Sub-division 3." },
      { timestamp: "2026-10-29T14:00:00.000Z", author: "KWSSB AE Venkat", note: "Air-lock cleared in booster feeder 2. Pressure restored to 2.4 bar. Verified with residents." }
    ],
    citizen_feedback: {
      rating: 4,
      comment: "Pressure is back to normal now. Thank you for fixing the air-lock.",
      submitted_at: "2026-10-29T18:00:00.000Z"
    }
  },
  {
    id: "CP-119",
    title: "Broken digital traffic timer causing traffic confusion at Indiranagar 100ft Road junction",
    description: "The countdown timer for the green signal is stuck at 88 seconds while the actual light switches to red, confusing motorists and causing abrupt braking.",
    category: "Other Civic Issues",
    department: "Municipal Civic Operations Cell",
    location: {
      address: "100ft Road & 12th Main Signal, Indiranagar",
      ward: "Ward 5 - Indiranagar Hub",
      lat: 12.9730,
      lng: 77.6425
    },
    status: "Submitted",
    priority: {
      score: 47,
      tier: "Medium",
      breakdown: { safety: 20, impact: 15, corroboration: 7, decay: 5 },
      rationale: "Assigned Medium (47/100). Signal telemetry malfunction creating driver misjudgment at a busy commercial intersection.",
      evidence: ["countdown timer stuck at 88s", "confusing motorists and abrupt braking"]
    },
    action_plan: {
      first_response: "Reset traffic controller logic board and recalibrate 7-segment LED countdown display.",
      required_equipment: ["Traffic Controller Programmer Console", "Replacement 7-Segment LED PCB", "Field Multimeter"],
      sla_hours: 24,
      estimated_budget: "₹11,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T09:10:00.000Z",
    citizen_name: "Naveen Prasad",
    action_notes: [
      { timestamp: "2026-10-30T09:12:00.000Z", author: "AI Triage Engine", note: "Traffic Control Automation Alert routed to Traffic Engineering Cell." }
    ]
  },
  {
    id: "CP-120",
    title: "Unsegregated dry waste bins overflowing near Rajaji Lake walking track",
    description: "Twin bins installed along the lake promenade are overflowing with empty coconut shells, juice bottles, and plastic bags onto the lawn.",
    category: "Garbage collection",
    department: "Solid Waste Management Division (SWM - Swachhata)",
    location: {
      address: "North Shore Promenade, Rajaji Lake Park",
      ward: "Ward 7 - Rajaji Nagar Lake Belt",
      lat: 12.9892,
      lng: 77.5541
    },
    status: "Submitted",
    priority: {
      score: 44,
      tier: "Medium",
      breakdown: { safety: 14, impact: 16, corroboration: 8, decay: 6 },
      rationale: "Assigned Medium (44/100). Public park litter accumulation affecting recreational ecosystem.",
      evidence: ["bins overflowing with coconut shells and plastic", "lake promenade lawn"]
    },
    action_plan: {
      first_response: "Empty bins, install higher capacity 240L wheelie bins, and increase weekend pickup frequency.",
      required_equipment: ["240L Heavy Duty HDPE Wheelie Bins", "Battery Operated Litter Evaporator Cart"],
      sla_hours: 24,
      estimated_budget: "₹12,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: true,
    photo_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    submitted_at: "2026-10-30T08:50:00.000Z",
    citizen_name: "Kavita Rao",
    action_notes: [
      { timestamp: "2026-10-30T08:52:00.000Z", author: "AI Triage Engine", note: "Park & Recreation Waste Dispatch logged." }
    ]
  },
  {
    id: "CP-121",
    title: "Faded pedestrian zebra crossing paint near Govt Senior Secondary School",
    description: "The white retro-reflective thermoplastic stripes of the pedestrian crossing have faded due to tyre wear. Vehicles do not slow down for crossing students.",
    category: "Other Civic Issues",
    department: "Municipal Civic Operations Cell",
    location: {
      address: "Opposite Govt Boys Senior Secondary School Gate, Vidyapeetha",
      ward: "Ward 9 - Vidyapeetha Institutional Zone",
      lat: 12.9360,
      lng: 77.5695
    },
    status: "Resolved",
    priority: {
      score: 24,
      tier: "Low",
      breakdown: { safety: 10, impact: 8, corroboration: 4, decay: 2 },
      rationale: "Assigned Low (24/100). Preventive traffic marking maintenance without immediate structural breakdown.",
      evidence: ["faded thermoplastic stripes", "school pedestrian crossing"]
    },
    action_plan: {
      first_response: "Repaint with hot-applied retro-reflective thermoplastic paint and glass beads during night hours.",
      required_equipment: ["Thermoplastic Road Marking Applicator", "Glass Bead Dispenser", "Traffic Safety Stencils"],
      sla_hours: 168,
      estimated_budget: "₹15,000"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-25T11:00:00.000Z",
    citizen_name: "Principal S. Murthy",
    action_notes: [
      { timestamp: "2026-10-25T11:05:00.000Z", author: "AI Triage Engine", note: "Classified as Road Marking Non-Emergency." },
      { timestamp: "2026-10-27T03:30:00.000Z", author: "Road Markings Crew", note: "High-index glass bead thermoplastic zebra lines applied. Marked Resolved." }
    ],
    citizen_feedback: {
      rating: 5,
      comment: "Very neat, reflective zebra crossing painted! Students can cross much safer now.",
      submitted_at: "2026-10-27T10:00:00.000Z"
    }
  },
  {
    id: "CP-122",
    title: "Damaged wooden seating bench in Shanti Nagar Public Park",
    description: "Two middle wooden planks on one park bench are splintered and broken. Elderly walkers cannot sit there.",
    category: "Other Civic Issues",
    department: "Municipal Civic Operations Cell",
    location: {
      address: "Rose Garden Section, Shanti Nagar Community Park",
      ward: "Ward 8 - Shanti Nagar Residential",
      lat: 12.9560,
      lng: 77.5965
    },
    status: "Resolved",
    priority: {
      score: 18,
      tier: "Low",
      breakdown: { safety: 6, impact: 6, corroboration: 4, decay: 2 },
      rationale: "Assigned Low (18/100). Amenity repair with no public safety threat.",
      evidence: ["broken wooden planks on park bench"]
    },
    action_plan: {
      first_response: "Replace broken timber slats with weather-resistant FRP composite planks.",
      required_equipment: ["Composite FRP Bench Slats", "Stainless Steel Hex Bolts", "Battery Drill"],
      sla_hours: 168,
      estimated_budget: "₹4,200"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-24T16:00:00.000Z",
    citizen_name: "G. V. Narayanan",
    action_notes: [
      { timestamp: "2026-10-24T16:05:00.000Z", author: "AI Triage Engine", note: "Classified as Park Furniture Maintenance." },
      { timestamp: "2026-10-26T15:00:00.000Z", author: "Horticulture Carpenter Raju", note: "New composite planks fitted and varnished. Completed." }
    ],
    citizen_feedback: {
      rating: 5,
      comment: "Bench repaired very quickly. Good service.",
      submitted_at: "2026-10-26T17:00:00.000Z"
    }
  },
  {
    id: "CP-123",
    title: "Decorative garden bollard light broken in Central Plaza",
    description: "The glass globe of one 3-foot garden bollard light has cracked. The bulb still works but needs replacement cover.",
    category: "Streetlight Failures",
    department: "Municipal Streetlight & Energy Cell",
    location: {
      address: "North Fountain Walkway, Central Plaza",
      ward: "Ward 12 - Central Business District",
      lat: 12.9745,
      lng: 77.6055
    },
    status: "Resolved",
    priority: {
      score: 22,
      tier: "Low",
      breakdown: { safety: 8, impact: 7, corroboration: 4, decay: 3 },
      rationale: "Assigned Low (22/100). Cosmetic fixture repair without electrical danger.",
      evidence: ["cracked glass globe on garden bollard"]
    },
    action_plan: {
      first_response: "Install impact-resistant polycarbonate globe diffuser.",
      required_equipment: ["Polycarbonate Bollard Globe", "Silicone Gasket Seal"],
      sla_hours: 168,
      estimated_budget: "₹2,500"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-26T10:00:00.000Z",
    citizen_name: "Shyam Sundar",
    action_notes: [
      { timestamp: "2026-10-26T10:05:00.000Z", author: "AI Triage Engine", note: "Classified as Aesthetic Lighting Repair." },
      { timestamp: "2026-10-27T16:00:00.000Z", author: "Plaza Maintenance", note: "Diffuser replaced. Completed." }
    ]
  },
  {
    id: "CP-124",
    title: "Unauthorized political banner tied tightly to municipal directional signage on MG Road",
    description: "A large plastic flex banner advertising a local event is tied over the overhead highway direction signboard, partially obscuring the arrow for the Airport Expressway.",
    category: "Other Civic Issues",
    department: "Municipal Civic Operations Cell",
    location: {
      address: "Overhead Gantry Sign, MG Road near Trinity Junction",
      ward: "Ward 12 - Central Business District",
      lat: 12.9740,
      lng: 77.6080
    },
    status: "Resolved",
    priority: {
      score: 15,
      tier: "Low",
      breakdown: { safety: 5, impact: 5, corroboration: 3, decay: 2 },
      rationale: "Assigned Low (15/100). Code violation and directional sign obstruction. No physical hazard.",
      evidence: ["plastic banner tied to directional sign", "obscuring airport exit arrow"]
    },
    action_plan: {
      first_response: "Dispatch encroachment squad to dismantle illegal banner and issue penalty fine to advertiser.",
      required_equipment: ["Utility Utility Cutter", "Ladder Truck", "Encroachment Seizure Bag"],
      sla_hours: 72,
      estimated_budget: "₹1,500"
    },
    is_duplicate: false,
    duplicate_count: 0,
    has_photo: false,
    submitted_at: "2026-10-27T14:00:00.000Z",
    citizen_name: "Kunal Kashyap",
    action_notes: [
      { timestamp: "2026-10-27T14:05:00.000Z", author: "AI Triage Engine", note: "Flagged as Illegal Banner / Sign Obstruction." },
      { timestamp: "2026-10-28T09:30:00.000Z", author: "Encroachment Officer D'Souza", note: "Banner confiscated. Sign visibility 100% restored. Penalty notice dispatched." }
    ],
    citizen_feedback: {
      rating: 5,
      comment: "Glad to see sign cleared so quickly! Airport commuters were missing the turn.",
      submitted_at: "2026-10-28T12:00:00.000Z"
    }
  }
];

function getDemoComplaints() {
  return JSON.parse(JSON.stringify(initialComplaints));
}

module.exports = {
  initialComplaints,
  getDemoComplaints
};
