// ============================================================================
// CivicPulse AI - Enterprise Server & API Gateway
// "From Complaints to Action" - Real-time AI Intelligence & Municipal Engine
// Architecture: Clean, Modular, Single-Responsibility & Secure
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  CIVIC_CATEGORIES,
  PRIORITY_TIERS,
  WORK_ORDER_STATUSES,
  SECURITY_CONFIG
} = require('./src/constants');
const { getDemoComplaints } = require('./src/data/demoComplaints');
const { triageComplaint } = require('./src/services/triageEngine');
const { processChatbotMessage } = require('./src/services/chatEngine');
const {
  validateAndSanitizeComplaint,
  applySecurityHeaders,
  checkRateLimit
} = require('./src/utils/security');
const supabase = require('./supabaseClient');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-Memory Store initialized with the 24 demo complaints
let complaints = getDemoComplaints();
let complaintSequence = 125;

// Global Response Helper
function sendJSON(res, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  const etag = crypto.createHash('md5').update(body).digest('hex');

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'ETag': `"${etag}"`,
    'Cache-Control': statusCode === 200 ? 'no-cache, must-revalidate' : 'no-store',
    ...headers
  });
  res.end(body);
}

// Request Body Parser with Payload Size Limit
function parseJsonBody(req, maxBytes = SECURITY_CONFIG.MAX_PAYLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error('Payload exceeds maximum size limit (1MB)'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });

    req.on('error', reject);
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // 1. Apply Defense-in-Depth Security Headers
  applySecurityHeaders(res);

  // 2. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 3. Rate Limiting Check
  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    sendJSON(res, 429, { error: 'Rate limit exceeded. Please wait a moment before sending more requests.' });
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // ------------------------------------------------------------------------
    // API: Health Check
    // ------------------------------------------------------------------------
    if (pathname === '/api/v1/health' && req.method === 'GET') {
      sendJSON(res, 200, {
        status: 'healthy',
        activeComplaints: complaints.length,
        supabaseConnected: supabase.isConfigured(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: Supabase Cloud Endpoints
    // ------------------------------------------------------------------------
    if (pathname === '/api/supabase/status' && req.method === 'GET') {
      sendJSON(res, 200, {
        configured: supabase.isConfigured(),
        url: supabase.url ? supabase.url : null
      });
      return;
    }

    if (pathname === '/api/supabase/config' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      if (payload.url && payload.key) {
        supabase.url = payload.url.replace(/\/+$/, '');
        supabase.key = payload.key;
        sendJSON(res, 200, {
          message: 'Supabase credentials updated successfully',
          configured: supabase.isConfigured()
        });
      } else {
        sendJSON(res, 400, { error: 'Missing required Supabase URL or Key' });
      }
      return;
    }

    if (pathname === '/api/supabase/sync' && req.method === 'POST') {
      const result = await supabase.bulkSyncComplaints(complaints);
      if (result.success) {
        sendJSON(res, 200, { message: 'Successfully synced complaints to Supabase', count: result.count });
      } else {
        sendJSON(res, 500, { error: result.error || 'Sync failed' });
      }
      return;
    }

    // ------------------------------------------------------------------------
    // API: GET /api/complaints - Filtered and Searched Complaints
    // ------------------------------------------------------------------------
    if (pathname === '/api/complaints' && req.method === 'GET') {
      let result = [...complaints];
      const category = parsedUrl.searchParams.get('category');
      const status = parsedUrl.searchParams.get('status');
      const priority = parsedUrl.searchParams.get('priority');
      const search = parsedUrl.searchParams.get('search');
      const ward = parsedUrl.searchParams.get('ward');

      if (category && category !== 'All') {
        result = result.filter(c => c.category === category);
      }
      if (status && status !== 'All') {
        result = result.filter(c => c.status === status);
      }
      if (priority && priority !== 'All') {
        result = result.filter(c => c.priority.tier === priority);
      }
      if (ward && ward !== 'All') {
        result = result.filter(c => c.location && c.location.ward && c.location.ward.includes(ward));
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(c =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.location && c.location.address && c.location.address.toLowerCase().includes(q))
        );
      }

      sendJSON(res, 200, { total: result.length, complaints: result });
      return;
    }

    // ------------------------------------------------------------------------
    // API: GET /api/complaints/:id - Single Work Order
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/api/complaints/') && req.method === 'GET') {
      const id = pathname.split('/')[3];
      const found = complaints.find(c => c.id.toLowerCase() === id.toLowerCase());
      if (found) {
        sendJSON(res, 200, found);
      } else {
        sendJSON(res, 404, { error: `Complaint with ID '${id}' not found` });
      }
      return;
    }

    // ------------------------------------------------------------------------
    // API: POST /api/complaints - Ingest, AI Triage & Cluster Complaint
    // ------------------------------------------------------------------------
    if (pathname === '/api/complaints' && req.method === 'POST') {
      const rawPayload = await parseJsonBody(req);
      const validation = validateAndSanitizeComplaint(rawPayload);

      if (!validation.isValid) {
        sendJSON(res, 400, { error: validation.error });
        return;
      }

      const sanitized = validation.sanitized;
      const triageResult = triageComplaint(sanitized, complaints);

      const newId = `CP-${complaintSequence++}`;
      const newComplaint = {
        id: newId,
        title: sanitized.title,
        description: sanitized.description,
        category: triageResult.category,
        department: triageResult.department,
        location: {
          address: sanitized.address,
          ward: sanitized.ward,
          lat: sanitized.lat,
          lng: sanitized.lng
        },
        status: WORK_ORDER_STATUSES.SUBMITTED,
        priority: triageResult.priority,
        action_plan: triageResult.action_plan,
        is_duplicate: triageResult.is_duplicate,
        parent_id: triageResult.parent_id,
        duplicate_count: 0,
        has_photo: sanitized.has_photo,
        photo_url: sanitized.photo_url,
        submitted_at: new Date().toISOString(),
        citizen_name: sanitized.citizen_name,
        action_notes: [
          {
            timestamp: new Date().toISOString(),
            author: "AI Intelligence Engine",
            note: `Ingested & analyzed. Assigned ${triageResult.priority.tier} priority (${triageResult.priority.score}/100). ${triageResult.is_duplicate ? 'Detected duplicate relation with ' + triageResult.parent_id : 'Unique incident logged.'}`
          }
        ]
      };

      // Increment parent's duplicate counter if clustered
      if (triageResult.is_duplicate && triageResult.parent_id) {
        const parent = complaints.find(c => c.id === triageResult.parent_id);
        if (parent) {
          parent.duplicate_count = (parent.duplicate_count || 0) + 1;
          parent.related_ids = parent.related_ids || [];
          parent.related_ids.push(newId);
        }
      }

      complaints.unshift(newComplaint);

      // Async sync to Supabase if connected
      if (supabase.isConfigured()) {
        supabase.insertComplaint(newComplaint).catch(err => console.error('Supabase async insert error:', err.message));
      }

      sendJSON(res, 201, {
        message: 'Complaint submitted & triaged successfully',
        complaint: newComplaint
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: PATCH /api/complaints/:id - Update Status, Dept or Action Note
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/api/complaints/') && !pathname.endsWith('/feedback') && req.method === 'PATCH') {
      const id = pathname.split('/')[3];
      const payload = await parseJsonBody(req);
      const found = complaints.find(c => c.id.toLowerCase() === id.toLowerCase());

      if (!found) {
        sendJSON(res, 404, { error: `Complaint '${id}' not found` });
        return;
      }

      if (payload.status && Object.values(WORK_ORDER_STATUSES).includes(payload.status)) {
        found.status = payload.status;
      }
      if (payload.department) {
        found.department = String(payload.department).slice(0, 100);
      }
      if (payload.note) {
        found.action_notes = found.action_notes || [];
        found.action_notes.push({
          timestamp: new Date().toISOString(),
          author: payload.author ? String(payload.author).slice(0, 50) : "Authority Dispatcher",
          note: String(payload.note).slice(0, 1000)
        });
      }

      if (supabase.isConfigured()) {
        supabase.updateComplaint(found.id, payload).catch(err => console.error('Supabase async patch error:', err.message));
      }

      sendJSON(res, 200, { message: 'Complaint updated successfully', complaint: found });
      return;
    }

    // ------------------------------------------------------------------------
    // API: POST /api/complaints/:id/feedback - Record Citizen Feedback
    // ------------------------------------------------------------------------
    if (pathname.endsWith('/feedback') && req.method === 'POST') {
      const id = pathname.split('/')[3];
      const payload = await parseJsonBody(req);
      const found = complaints.find(c => c.id.toLowerCase() === id.toLowerCase());

      if (!found) {
        sendJSON(res, 404, { error: `Complaint '${id}' not found` });
        return;
      }

      const rating = Math.max(1, Math.min(5, Number(payload.rating) || 5));
      const comment = String(payload.comment || 'Issue resolved successfully.').slice(0, 500);

      found.citizen_feedback = {
        rating,
        comment,
        submitted_at: new Date().toISOString()
      };

      sendJSON(res, 200, { message: 'Feedback recorded successfully', feedback: found.citizen_feedback });
      return;
    }

    // ------------------------------------------------------------------------
    // API: POST /api/chat - Civic AI Assistant Query & Solutions
    // ------------------------------------------------------------------------
    if (pathname === '/api/chat' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const chatResponse = processChatbotMessage(payload.message || '', complaints);
      sendJSON(res, 200, chatResponse);
      return;
    }

    // ------------------------------------------------------------------------
    // API: GET /api/analytics - Aggregated BI Metrics
    // ------------------------------------------------------------------------
    if (pathname === '/api/analytics' && req.method === 'GET') {
      const total = complaints.length;
      const resolved = complaints.filter(c => c.status === WORK_ORDER_STATUSES.RESOLVED).length;
      const inProgress = complaints.filter(c => c.status === WORK_ORDER_STATUSES.IN_PROGRESS).length;
      const assigned = complaints.filter(c => c.status === WORK_ORDER_STATUSES.ASSIGNED).length;
      const submitted = complaints.filter(c => c.status === WORK_ORDER_STATUSES.SUBMITTED || c.status === WORK_ORDER_STATUSES.AI_ANALYZED).length;
      const critical = complaints.filter(c => c.priority.tier === PRIORITY_TIERS.CRITICAL).length;
      const high = complaints.filter(c => c.priority.tier === PRIORITY_TIERS.HIGH).length;
      const medium = complaints.filter(c => c.priority.tier === PRIORITY_TIERS.MEDIUM).length;
      const low = complaints.filter(c => c.priority.tier === PRIORITY_TIERS.LOW).length;

      const categoryCounts = {};
      complaints.forEach(c => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      });

      const wardCounts = {};
      complaints.forEach(c => {
        const w = (c.location && c.location.ward) ? c.location.ward.split(' - ')[0] : 'Other';
        wardCounts[w] = (wardCounts[w] || 0) + 1;
      });

      sendJSON(res, 200, {
        total,
        resolved,
        inProgress,
        assigned,
        submitted,
        critical,
        resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        priority_breakdown: { critical, high, medium, low },
        category_breakdown: categoryCounts,
        ward_breakdown: wardCounts
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: POST /api/reset-demo - Reset Data
    // ------------------------------------------------------------------------
    if (pathname === '/api/reset-demo' && req.method === 'POST') {
      complaints = getDemoComplaints();
      complaintSequence = 125;
      sendJSON(res, 200, { message: 'Demo data reset successfully', total: complaints.length });
      return;
    }

    // ------------------------------------------------------------------------
    // Static File Serving (SPA Fallback)
    // ------------------------------------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent path traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      sendJSON(res, 403, { error: 'Forbidden' });
      return;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
            if (err2) {
              res.writeHead(500);
              res.end('Internal Server Error: Missing index.html');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content, 'utf-8');
      }
    });

  } catch (err) {
    sendJSON(res, 500, { error: 'Internal server error: ' + err.message });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is in use by an active instance.`);
    console.log(`✅ CivicPulse is accessible at: http://localhost:${PORT}`);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 CivicPulse AI - Enterprise Civic Platform Online!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏛️  Demo City: Kalyanpur Smart City (24 Incidents Loaded)`);
  console.log(`🛡️  Security: Rate Limiter, Helmet Headers & Input Sanitization Active`);
  console.log(`================================================================`);
});
