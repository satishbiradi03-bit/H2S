// ============================================================================
// CivicPulse AI - Supabase Cloud Database Client
// Native REST & Realtime Integration using PostgREST API (Zero-Dependency)
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

class SupabaseService {
  constructor() {
    this.url = SUPABASE_URL ? SUPABASE_URL.replace(/\/+$/, '') : '';
    this.key = SUPABASE_KEY;
  }

  isConfigured() {
    return Boolean(this.url && this.key && this.url.startsWith('http'));
  }

  getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // Fetch all complaints from Supabase
  async getComplaints(filter = {}) {
    if (!this.isConfigured()) return null;
    try {
      let query = `${this.url}/rest/v1/complaints?select=*&order=created_at.desc`;
      if (filter.status && filter.status !== 'All') {
        query += `&status=eq.${encodeURIComponent(filter.status)}`;
      }
      if (filter.priority && filter.priority !== 'All') {
        query += `&priority_tier=eq.${encodeURIComponent(filter.priority)}`;
      }
      if (filter.category && filter.category !== 'All') {
        query += `&category=eq.${encodeURIComponent(filter.category)}`;
      }

      const res = await fetch(query, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!res.ok) {
        console.error('Supabase fetch error:', res.status, await res.text());
        return null;
      }
      const data = await res.json();
      return data.map(this.mapFromDb);
    } catch (err) {
      console.error('Supabase request failed:', err.message);
      return null;
    }
  }

  // Insert a new complaint into Supabase
  async insertComplaint(c) {
    if (!this.isConfigured()) return null;
    try {
      const dbRow = this.mapToDb(c);
      const res = await fetch(`${this.url}/rest/v1/complaints`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(dbRow)
      });

      if (!res.ok) {
        console.error('Supabase insert error:', res.status, await res.text());
        return null;
      }
      const result = await res.json();
      return result[0] ? this.mapFromDb(result[0]) : c;
    } catch (err) {
      console.error('Supabase insert failed:', err.message);
      return null;
    }
  }

  // Update complaint status or details
  async updateComplaint(id, updates) {
    if (!this.isConfigured()) return null;
    try {
      const payload = {};
      if (updates.status) payload.status = updates.status;
      if (updates.department) payload.department = updates.department;

      const res = await fetch(`${this.url}/rest/v1/complaints?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error('Supabase patch error:', res.status, await res.text());
        return null;
      }
      const result = await res.json();
      return result[0] ? this.mapFromDb(result[0]) : null;
    } catch (err) {
      console.error('Supabase update failed:', err.message);
      return null;
    }
  }

  // Bulk sync demo complaints to Supabase
  async bulkSyncComplaints(complaintList) {
    if (!this.isConfigured()) return { success: false, error: 'Supabase not configured' };
    try {
      const rows = complaintList.map(this.mapToDb);
      const res = await fetch(`${this.url}/rest/v1/complaints`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(rows)
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: text };
      }
      return { success: true, count: rows.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Transform memory object to Supabase row
  mapToDb(c) {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      department: c.department,
      status: c.status || 'Submitted',
      priority_tier: c.priority.tier,
      priority_score: c.priority.score,
      priority_breakdown: c.priority.breakdown,
      priority_rationale: c.priority.rationale,
      priority_evidence: c.priority.evidence || [],
      action_plan: c.action_plan || {},
      is_duplicate: Boolean(c.is_duplicate),
      parent_id: c.parent_id || null,
      duplicate_count: c.duplicate_count || 0,
      related_ids: c.related_ids || [],
      location: c.location || {},
      has_photo: Boolean(c.has_photo),
      photo_url: c.photo_url || null,
      citizen_name: c.citizen_name || 'Concerned Citizen',
      citizen_feedback: c.citizen_feedback || null,
      created_at: c.submitted_at || new Date().toISOString()
    };
  }

  // Transform Supabase row to memory object
  mapFromDb(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      department: row.department,
      status: row.status,
      priority: {
        tier: row.priority_tier,
        score: Number(row.priority_score),
        breakdown: row.priority_breakdown || {},
        rationale: row.priority_rationale || '',
        evidence: row.priority_evidence || []
      },
      action_plan: row.action_plan || {},
      is_duplicate: row.is_duplicate,
      parent_id: row.parent_id,
      duplicate_count: row.duplicate_count,
      related_ids: row.related_ids || [],
      location: row.location || {},
      has_photo: row.has_photo,
      photo_url: row.photo_url,
      submitted_at: row.created_at,
      citizen_name: row.citizen_name,
      citizen_feedback: row.citizen_feedback
    };
  }
}

module.exports = new SupabaseService();

