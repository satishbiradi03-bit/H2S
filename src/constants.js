// ============================================================================
// CivicPulse AI - System Constants, Enums & Configuration Rubrics
// Enforcing Single Source of Truth, Strict Typing & Immutability
// ============================================================================

/**
 * Civic Issue Category Enum
 * @readonly
 * @enum {string}
 */
const CIVIC_CATEGORIES = Object.freeze({
  ROADS: "Roads and potholes",
  WATER: "Water Supply Problems",
  GARBAGE: "Garbage collection",
  STREETLIGHTS: "Streetlight Failures",
  DRAINAGE: "Drainage Problems",
  PUBLIC_SAFETY: "Public Safety",
  OTHER: "Other Civic Issues"
});

/**
 * Priority Tier Enum
 * @readonly
 * @enum {string}
 */
const PRIORITY_TIERS = Object.freeze({
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low"
});

/**
 * Priority Tier Score Thresholds (0–100 Rubric)
 * @readonly
 */
const PRIORITY_THRESHOLDS = Object.freeze({
  CRITICAL_MIN: 80,
  HIGH_MIN: 60,
  MEDIUM_MIN: 30,
  LOW_MIN: 0
});

/**
 * SLA Turnaround Targets in Hours
 * @readonly
 */
const SLA_HOURS = Object.freeze({
  [PRIORITY_TIERS.CRITICAL]: 2,
  [PRIORITY_TIERS.HIGH]: 12,
  [PRIORITY_TIERS.MEDIUM]: 48,
  [PRIORITY_TIERS.LOW]: 168 // 7 Days
});

/**
 * Maximum Weight Allocations for 0–100 Explainable Rubric
 * @readonly
 */
const RUBRIC_WEIGHTS = Object.freeze({
  MAX_SAFETY: 40,
  MAX_IMPACT: 25,
  MAX_CORROBORATION: 20,
  MAX_TIME_DECAY: 15
});

/**
 * Lifecycle Status Enum
 * @readonly
 * @enum {string}
 */
const WORK_ORDER_STATUSES = Object.freeze({
  SUBMITTED: "Submitted",
  AI_ANALYZED: "AI Analyzed",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved"
});

/**
 * Department Routing Matrix
 * @readonly
 */
const DEPARTMENT_ROUTING = Object.freeze({
  [CIVIC_CATEGORIES.ROADS]: "Public Works Department (PWD - Roads Division)",
  [CIVIC_CATEGORIES.WATER]: "Kalyanpur Water Supply & Sewerage Board (KWSSB)",
  [CIVIC_CATEGORIES.GARBAGE]: "Solid Waste Management Division (SWM - Swachhata)",
  [CIVIC_CATEGORIES.STREETLIGHTS]: "Municipal Streetlight & Energy Cell",
  [CIVIC_CATEGORIES.DRAINAGE]: "Municipal Public Works Department (PWD - Drainage)",
  [CIVIC_CATEGORIES.PUBLIC_SAFETY]: "Public Safety & Disaster Management Directorate",
  [CIVIC_CATEGORIES.OTHER]: "Municipal Civic Operations Cell"
});

/**
 * Security & Rate Limit Configuration
 * @readonly
 */
const SECURITY_CONFIG = Object.freeze({
  MAX_PAYLOAD_BYTES: 1024 * 1024, // 1 MB
  MAX_TITLE_LENGTH: 160,
  MAX_DESCRIPTION_LENGTH: 5000,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 120
});

module.exports = {
  CIVIC_CATEGORIES,
  PRIORITY_TIERS,
  PRIORITY_THRESHOLDS,
  SLA_HOURS,
  RUBRIC_WEIGHTS,
  WORK_ORDER_STATUSES,
  DEPARTMENT_ROUTING,
  SECURITY_CONFIG
};
