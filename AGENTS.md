# Leads2Gold — Antigravity Agent Guidelines & Execution Controls

This document defines agent controls, system architecture, tool definitions, and execution runbooks for **Antigravity**.

---

## 1. System Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn-ui (`/src`).
- **Backend & Database**: Supabase (PostgreSQL with tables: `enriched_leads`, `crm_prospects`, `admin_saved_searches`).
- **Edge Functions**: Supabase Deno Edge Functions (`/supabase/functions/`).
  - `/supabase/functions/mcp`: Remote HTTP JSON-RPC endpoint for MCP tools.
- **Local MCP Server**: Node.js stdio MCP server (`/mcp-server`).
  - Connects Antigravity directly to the Supabase database.
  - Automatically loads credentials from `/mcp-server/.env` or Antigravity's `mcp_config.json`.

---

## 2. Antigravity MCP Tools & Capabilities

The `leads2gold` MCP server exposes 9 primary tools to Antigravity:

| Tool Name | Scope | Description |
| --- | --- | --- |
| `search_leads` | Read | Search enriched leads by company name, industry, city, or state. |
| `get_enriched_lead` | Read | Retrieve full details for an enriched lead (AI insights, pain points, pitch hooks, call times). |
| `list_crm_prospects` | Read | List pipeline prospects filtered by stage (`new_lead`, `first_contact`, `callback_scheduled`, `qualified`, `proposal`, `won`, `lost`) or company. |
| `create_crm_prospect` | Write | Add a new prospect directly into the pipeline with contact info and stage. |
| `update_prospect_stage` | Write | Transition a prospect between pipeline stages, with optional progression notes. |
| `log_contact` | Write | Record touchpoints (call, email, sms, meeting) in contact history and stamp `last_contacted_at`. |
| `schedule_callback` | Write | Set a future callback timestamp (ISO 8601), callback notes, and advance stage to `callback_scheduled`. |
| `pipeline_summary` | Read | Aggregate counts across all stages plus next 20 upcoming callbacks. |
| `list_saved_searches` | Read | Retrieve recent search queries and result counts. |

---

## 3. Controls & Execution Guardrails

1. **Owner Scoping**:
   - Every operation executed by Antigravity is strictly scoped to `MCP_OWNER_USER_ID`.
   - Never remove or bypass user-scoping in SQL queries or MCP handlers.
2. **Pipeline State Machine**:
   - Allowed stages: `new_lead` → `first_contact` → `callback_scheduled` → `qualified` → `proposal` → `won` | `lost`.
   - Stage transitions should always include a concise audit note explaining the transition.
3. **Contact Logging**:
   - Whenever Antigravity conducts or drafts an outreach attempt on behalf of the user, log the contact attempt via `log_contact`.
4. **Callback Scheduling**:
   - Callbacks must be valid ISO 8601 strings (e.g., `2026-11-10T15:00:00Z`).
5. **Credential Protection**:
   - `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is strictly server-side / local machine only.
   - Never print or leak secrets in chat or commit them into version control.

---

## 4. Execution Commands

### Run Development App
```bash
cd leads-2-gold-main
npm run dev
```

### Run MCP Server Standalone
```bash
cd leads-2-gold-main/mcp-server
node index.js
```

### Deploy Supabase MCP Edge Function
```bash
cd leads-2-gold-main
supabase functions deploy mcp --no-verify-jwt
```
