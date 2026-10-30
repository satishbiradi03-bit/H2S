// ============================================================================
// CivicPulse AI - Security, Sanitization & Defense-in-Depth Layer
// ============================================================================

const { SECURITY_CONFIG } = require('../constants');

/**
 * Escapes HTML characters to prevent Stored & Reflected XSS
 * @param {string} str - Raw input string
 * @returns {string} Sanitized HTML safe string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes plain text input by stripping control chars, trimming whitespace,
 * and neutralizing dangerous script/tag tokens.
 * @param {string} input - Raw string
 * @param {number} maxLength - Maximum allowable length
 * @returns {string} Clean sanitized string
 */
function sanitizeText(input, maxLength = 2000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Strip null & control bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script blocks
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes a complaint ingestion payload
 * @param {Object} payload - Raw complaint object from citizen
 * @returns {{isValid: boolean, error: string|null, sanitized: Object}}
 */
function validateAndSanitizeComplaint(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, error: 'Malformed payload: expected JSON object', sanitized: null };
  }

  // Prototype pollution defense
  if (Object.prototype.hasOwnProperty.call(payload, '__proto__') ||
      Object.prototype.hasOwnProperty.call(payload, 'constructor')) {
    return { isValid: false, error: 'Forbidden prototype pollution key detected', sanitized: null };
  }

  const title = sanitizeText(payload.title, SECURITY_CONFIG.MAX_TITLE_LENGTH);
  const description = sanitizeText(payload.description, SECURITY_CONFIG.MAX_DESCRIPTION_LENGTH);

  if (!title || title.length < 5) {
    return { isValid: false, error: 'Complaint title must be at least 5 characters long', sanitized: null };
  }

  if (!description || description.length < 10) {
    return { isValid: false, error: 'Complaint description must be at least 10 characters long', sanitized: null };
  }

  const sanitized = {
    title,
    description,
    category: sanitizeText(payload.category, 60) || 'Auto-Detect',
    ward: sanitizeText(payload.ward, 100) || 'Ward 12 - Central Business District',
    address: sanitizeText(payload.address, 160) || 'Kalyanpur City',
    lat: typeof payload.lat === 'number' && !isNaN(payload.lat) ? Number(payload.lat.toFixed(6)) : 12.9716,
    lng: typeof payload.lng === 'number' && !isNaN(payload.lng) ? Number(payload.lng.toFixed(6)) : 77.5946,
    has_photo: Boolean(payload.has_photo),
    photo_url: typeof payload.photo_url === 'string' && payload.photo_url.startsWith('http') ? payload.photo_url.slice(0, 500) : null,
    citizen_name: sanitizeText(payload.citizen_name, 80) || 'Concerned Citizen'
  };

  return { isValid: true, error: null, sanitized };
}

/**
 * Standard Security Headers Middleware (Helmet-Grade)
 * @param {http.ServerResponse} res
 */
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;");
}

/**
 * Simple in-memory IP rate limiter
 */
const ipHitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const client = ipHitMap.get(ip) || { count: 0, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS };

  if (now > client.resetTime) {
    client.count = 1;
    client.resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;
  } else {
    client.count++;
  }

  ipHitMap.set(ip, client);
  return client.count <= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW;
}

module.exports = {
  escapeHtml,
  sanitizeText,
  validateAndSanitizeComplaint,
  applySecurityHeaders,
  checkRateLimit
};
