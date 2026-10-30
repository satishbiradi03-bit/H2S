# ⚡ Supabase Setup Guide for CivicPulse AI

This guide explains how to connect **CivicPulse AI** to **Supabase** (PostgreSQL + PostGIS + Realtime).

---

## 1. Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **"New Project"**.
3. Set a project name (e.g. `civicpulse-smartcity`), choose a database password, and select your preferred region (e.g., `South Asia (Mumbai)` or `East US`).
4. Wait 1–2 minutes for the database to spin up.

---

## 2. Run the Database Schema

1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **"New query"**.
3. Open [`supabase_schema.sql`](../supabase_schema.sql) in this repository, copy all the SQL code, paste it into the editor, and click **Run**.
4. This will create:
   - `public.complaints` table with PostGIS geometry support.
   - `public.action_notes` table for dispatch timelines.
   - Automatic triggers for `updated_at`.
   - Row Level Security (RLS) policies allowing public read & citizen submission.
   - Supabase Realtime enabled on both tables.
   - 3 initial seeded critical complaints.

---

## 3. Retrieve Your Project Credentials

1. Go to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click on **API**.
3. Copy the following two values:
   - **Project URL:** `https://xyzcompany.supabase.co`
   - **anon / public key:** `eyJhbGciOi...`

---

## 4. Connect to CivicPulse AI

You can connect in either of two ways:

### Method A: Connect from the Web App (No Restart Needed)
1. Open the CivicPulse web application at [http://localhost:3000](http://localhost:3000).
2. Click on the **"⚡ Supabase Cloud"** button in the top navigation bar or sidebar.
3. Paste your **Project URL** and **Anon Key**.
4. Click **"Save & Connect"**.
5. Click **"Sync 24 Demo Incidents to Supabase"** to upload all realistic sample complaints in one click!

### Method B: Connect via Environment File (`.env`)
1. Create a file named `.env` in the project root:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Restart the server:
   ```powershell
   npm.cmd start
   ```

---

## 5. Realtime Feature Verification

When Supabase is connected:
- Any new complaint submitted in the app is saved to your Supabase PostgreSQL database.
- Any status changes in the Authority Command Center update Supabase in real-time.
- If multiple browser tabs or devices are open, updates broadcast live across all screens without reloading.

