# CivicPulse: Explainability & Citizen Transparency Specification

## 1. The Imperative for Civic Explainability

Municipal AI systems face unique scrutiny from citizens, city councils, and regulatory bodies. Traditional "black-box" prioritization models create three existential civic risks:
1. **Algorithmic Redlining & Spatial Inequity:** Wealthier neighborhoods typically submit higher volumes of 311 requests. Without population/vulnerability calibration, automated systems inadvertently prioritize affluent cosmetic complaints over critical infrastructure failures in underserved communities.
2. **Citizen Distrust & "Black Hole" Frustration:** When residents submit reports and receive generic automated acknowledgments without insight into why another street was repaired first, civic participation declines.
3. **Dispatcher Skepticism:** Municipal dispatchers will bypass AI recommendations unless the system shows *deterministic math*, *cited evidence*, and *safety factor verification*.

To resolve this, CivicPulse implements **Glass-Box Triage**: every prioritization score is mathematically decomposed into 4 transparent pillars with direct evidence citations.

---

## 2. Prioritization Rubric Deconstruction (0–100 Scale)

$$\text{Total Priority Score} = S_{\text{safety}} (40\%) + I_{\text{impact}} (25\%) + C_{\text{corroboration}} (20\%) + U_{\text{decay}} (15\%)$$

| Component | Weight | Max Score | Evaluation Criteria | Triggered Evidence Signals |
| :--- | :--- | :--- | :--- | :--- |
| **Public Safety & Hazard Severity** | **40%** | **40** | **40 pts:** Acute threat to human life/limb<br>**25 pts:** Active structural/infrastructure property damage<br>**10 pts:** Minor physical hazard<br>**0 pts:** Cosmetic or non-hazardous condition | Direct quotes: *"sparks flying"*, *"live wire"*, *"gas leak"*, *"elderly trapped"*, *"water rising"*, *"pipe burst"* |
| **Population Impact & Vulnerability** | **25%** | **25** | Proximity to critical social infrastructure (schools, hospitals, transit hubs, elder care facilities) and high-density corridors. | Geospatial lookup: Within 100m of elementary school, hospital arterial road, or high-density transit artery. |
| **Report Volume & Velocity** | **20%** | **20** | $\min(20, \text{Reports} \times 4.0 + \text{Verified Photos} \times 3.0)$<br>Corroboration from distinct citizens across multi-modal channels. | Multi-channel cross-validation: Mobile app GPS + 311 voice transcript + Twitter tag. |
| **Time Unresolved & Urgency Decay** | **15%** | **15** | Rate of physical worsening if unaddressed for 24 hours. Evaluates erosion, electrical surge risk, or public health escalation. | Category risk: Live electrical in rain (15), water main undermining asphalt (12), trash accumulation (7). |

---

## 3. Citizen Public Tracking Portal UI Design

### 3.1 Status Timeline Stepper
Citizens track their issue using a transparent 5-stage progress indicator:
```
[ Received ]  --->  [ Triaged ]  --->  [ Dispatched ]  --->  [ In Progress ]  --->  [ Resolved ]
     |                   |                    |                      |                    |
Channel Ingest     Priority: P0         Crew Assigned        Field Tech On-site    Photo Verified
(App/SMS/Voice)    Score: 96/100        SLA: 2 Hours         Isolating Feeder      Work Order Closed
```

### 3.2 "Why is this Prioritized?" Interactive Transparency Widget
When a citizen clicks *"How was this prioritized?"*, the UI renders an explainable breakdown modal:

```
+---------------------------------------------------------------------------------------+
|  PRIORITY EXPLANATION: TICKET #INC-2026-01001                                         |
|  Current Status: DISPATCHED | Tier: P0_Critical | Target SLA: 2 Hours                 |
+---------------------------------------------------------------------------------------+
|  Transparent Scoring Breakdown (Total: 96.0 / 100)                                   |
|                                                                                       |
|  [████████████████████████████████████████] 40.0 / 40.0  Public Safety Hazard         |
|  Evidence Cited: "sparks flying everywhere right next to Lincoln Elementary"           |
|                                                                                       |
|  [███████████████████████                 ] 23.0 / 25.0  Vulnerable Population Impact |
|  Evidence Cited: Location is adjacent to Elementary School Crosswalk                  |
|                                                                                       |
|  [██████████████████                      ] 18.0 / 20.0  Citizen Corroboration        |
|  Evidence Cited: 3 independent citizen reports and 2 verified photo attachments       |
|                                                                                       |
|  [███████████████                         ] 15.0 / 15.0  24-Hour Escalation Risk      |
|  Evidence Cited: Active arcing risks electrical fire and line snap in wet weather      |
+---------------------------------------------------------------------------------------+
|  MUNICIPAL ACTION PLAN:                                                               |
|  Assigned Department: Municipal Power & Utilities Authority                           |
|  Field Crew: Emergency Lineworker Rapid Response                                      |
|  Required Equipment: High-Voltage Bucket Truck, Arc-Flash Safety Gear, Cones          |
|  Public Note: "Our crew has been dispatched. Please maintain 50ft distance."          |
+---------------------------------------------------------------------------------------+
```

---

## 4. Municipal Dispatcher & Field Commander Console

### 4.1 Real-Time Deduplication Map
- **Geospatial Clusters:** Visualized on MapLibre / PostGIS vector tiles. Single circles expand with pulse rings as citizen reports corroborate the same incident.
- **Centroid Calculation:** Automatically recalculates GPS coordinates as multiple reports arrive with slight GPS deviations (e.g., cell tower drift).
- **Zero-Hallucination Warning Pill:** Incidents with `location_confidence: Low` glow amber with an explicit banner: `Ambiguous Address: Needs Dispatcher Manual Geocode`.

### 4.2 Field Work Order Generation
The dispatcher can review the AI-synthesized Action Plan and issue a formal work order with one click:
- Auto-attaches required specialized tools (e.g. `De-watering pumps`, `Hot-mix asphalt patcher`).
- Pre-calculates legal SLA deadlines with automated paging triggers if 50% of the SLA window elapses without crew acknowledgment.
- Mandates photographic evidence submission by field crew before marking an incident as `Resolved`.

---

## 5. Anti-Hallucination & Civic Trust Guardrails

1. **Strict Spatial Grounding:** The system will never fabricate coordinates. If a resident submits "near the park somewhere", the coordinates remain `null`, and `location_confidence` is tagged `Low`.
2. **Emotional De-Escalation:** Raw profanity and vitriol are removed to protect dispatchers from burnout, but all urgency keywords (*"sparks"*, *"water rising"*, *"elderly trapped"*) are strictly preserved as immutable audit evidence.
3. **Immutable Priority Audit Ledger (`priority_audit_logs`):** Every recalculation triggered by new reports, time decay, or manual dispatcher override creates a permanent cryptographic record for municipal oversight.

