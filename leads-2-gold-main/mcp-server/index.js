#!/usr/bin/env node
/**
 * Leads2Gold MCP Server (self-hosted, stdio transport)
 *
 * Exposes leads + CRM tools from your Supabase project to Antigravity
 * (and any MCP-compliant client). Runs locally on your machine — nothing is deployed
 * to Lovable or Supabase.
 *
 * Required env vars (see .env.example):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MCP_OWNER_USER_ID
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load local .env if available and Node supports loadEnvFile
const __dirname = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  join(process.cwd(), ".env"),
  join(__dirname, ".env"),
];
for (const envPath of envCandidates) {
  if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {}
  }
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_USER_ID = process.env.MCP_OWNER_USER_ID;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
  MCP_OWNER_USER_ID: OWNER_USER_ID,
})) {
  if (!value) {
    console.error(`[leads2gold-mcp] Missing required env var: ${name}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PIPELINE_STAGES = [
  "new_lead",
  "first_contact",
  "callback_scheduled",
  "qualified",
  "proposal",
  "won",
  "lost",
];

const ok = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const fail = (message) => ({
  content: [{ type: "text", text: `Error: ${message}` }],
  isError: true,
});

const tools = [
  {
    name: "search_leads",
    description:
      "Search saved leads by company name, industry, city or state. Returns up to `limit` leads owned by the configured user.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text matched against company name" },
        industry: { type: "string", description: "Filter by industry name" },
        city: { type: "string" },
        state: { type: "string" },
        limit: { type: "number", description: "Max rows (default 25, max 200)" },
      },
    },
  },
  {
    name: "get_enriched_lead",
    description:
      "Get a single enriched lead with AI insights, pain points, suggested products and best call times.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "enriched_leads.id (uuid)" } },
      required: ["id"],
    },
  },
  {
    name: "list_crm_prospects",
    description:
      "List CRM prospects, optionally filtered by pipeline stage or free-text company search.",
    inputSchema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: PIPELINE_STAGES },
        query: { type: "string", description: "Text matched against company name" },
        limit: { type: "number", description: "Max rows (default 25, max 200)" },
      },
    },
  },
  {
    name: "create_crm_prospect",
    description: "Create a new CRM prospect in the pipeline.",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        contact_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        website: { type: "string" },
        industry_name: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        notes: { type: "string" },
        stage: { type: "string", enum: PIPELINE_STAGES, description: "Defaults to new_lead" },
      },
      required: ["company_name"],
    },
  },
  {
    name: "update_prospect_stage",
    description:
      "Move a prospect to a different pipeline stage (new_lead, first_contact, callback_scheduled, qualified, proposal, won, lost).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        stage: { type: "string", enum: PIPELINE_STAGES },
        notes: { type: "string", description: "Optional note appended to the prospect" },
      },
      required: ["id", "stage"],
    },
  },
  {
    name: "log_contact",
    description:
      "Log a contact attempt against a prospect: appends to contact history and sets last_contacted_at.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        channel: { type: "string", description: "call, email, sms, meeting, other" },
        summary: { type: "string" },
      },
      required: ["id", "summary"],
    },
  },
  {
    name: "schedule_callback",
    description:
      "Schedule a callback for a prospect and move them to the callback_scheduled stage.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        callback_at: { type: "string", description: "ISO 8601 timestamp" },
        callback_notes: { type: "string" },
      },
      required: ["id", "callback_at"],
    },
  },
  {
    name: "pipeline_summary",
    description: "Return prospect counts per pipeline stage plus upcoming callbacks.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_saved_searches",
    description: "List recent saved lead searches (industry, location, result count).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Default 20, max 100" } },
    },
  },
];

const clampLimit = (value, fallback = 25, max = 200) =>
  Math.min(Math.max(Number(value) || fallback, 1), max);

async function handleTool(name, args = {}) {
  switch (name) {
    case "search_leads": {
      let q = supabase
        .from("enriched_leads")
        .select(
          "id, company_name, industry_name, location, phone, email, website, google_rating, google_reviews_count, lead_score, status, created_at",
        )
        .eq("user_id", OWNER_USER_ID)
        .order("created_at", { ascending: false })
        .limit(clampLimit(args.limit));

      if (args.query) q = q.ilike("company_name", `%${args.query}%`);
      if (args.industry) q = q.ilike("industry_name", `%${args.industry}%`);
      if (args.city) q = q.ilike("location", `%${args.city}%`);
      if (args.state) q = q.ilike("location", `%${args.state}%`);

      const { data, error } = await q;
      if (error) return fail(error.message);
      return ok({ count: data.length, leads: data });
    }

    case "get_enriched_lead": {
      const { data, error } = await supabase
        .from("enriched_leads")
        .select("*")
        .eq("user_id", OWNER_USER_ID)
        .eq("id", args.id)
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Lead not found for this owner.");
      return ok(data);
    }

    case "list_crm_prospects": {
      let q = supabase
        .from("crm_prospects")
        .select(
          "id, company_name, contact_name, email, phone, website, industry_name, city, state, stage, lead_score, last_contacted_at, next_callback_at, notes, created_at",
        )
        .eq("user_id", OWNER_USER_ID)
        .order("updated_at", { ascending: false })
        .limit(clampLimit(args.limit));

      if (args.stage) q = q.eq("stage", args.stage);
      if (args.query) q = q.ilike("company_name", `%${args.query}%`);

      const { data, error } = await q;
      if (error) return fail(error.message);
      return ok({ count: data.length, prospects: data });
    }

    case "create_crm_prospect": {
      const { stage, ...rest } = args;
      const { data, error } = await supabase
        .from("crm_prospects")
        .insert({ ...rest, stage: stage || "new_lead", user_id: OWNER_USER_ID })
        .select()
        .single();
      if (error) return fail(error.message);
      return ok(data);
    }

    case "update_prospect_stage": {
      const patch = { stage: args.stage };
      if (args.notes) patch.notes = args.notes;
      const { data, error } = await supabase
        .from("crm_prospects")
        .update(patch)
        .eq("id", args.id)
        .eq("user_id", OWNER_USER_ID)
        .select()
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Prospect not found for this owner.");
      return ok(data);
    }

    case "log_contact": {
      const { data: existing, error: readError } = await supabase
        .from("crm_prospects")
        .select("id, contact_history")
        .eq("id", args.id)
        .eq("user_id", OWNER_USER_ID)
        .maybeSingle();
      if (readError) return fail(readError.message);
      if (!existing) return fail("Prospect not found for this owner.");

      const history = Array.isArray(existing.contact_history)
        ? existing.contact_history
        : [];
      history.push({
        at: new Date().toISOString(),
        channel: args.channel || "other",
        summary: args.summary,
        source: "mcp",
      });

      const { data, error } = await supabase
        .from("crm_prospects")
        .update({ contact_history: history, last_contacted_at: new Date().toISOString() })
        .eq("id", args.id)
        .eq("user_id", OWNER_USER_ID)
        .select()
        .single();
      if (error) return fail(error.message);
      return ok(data);
    }

    case "schedule_callback": {
      const { data, error } = await supabase
        .from("crm_prospects")
        .update({
          next_callback_at: args.callback_at,
          callback_notes: args.callback_notes ?? null,
          stage: "callback_scheduled",
        })
        .eq("id", args.id)
        .eq("user_id", OWNER_USER_ID)
        .select()
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("Prospect not found for this owner.");
      return ok(data);
    }

    case "pipeline_summary": {
      const { data, error } = await supabase
        .from("crm_prospects")
        .select("stage, company_name, next_callback_at")
        .eq("user_id", OWNER_USER_ID)
        .limit(2000);
      if (error) return fail(error.message);

      const byStage = {};
      for (const stage of PIPELINE_STAGES) byStage[stage] = 0;
      for (const row of data) byStage[row.stage] = (byStage[row.stage] || 0) + 1;

      const upcoming = data
        .filter((r) => r.next_callback_at && new Date(r.next_callback_at) >= new Date())
        .sort((a, b) => new Date(a.next_callback_at) - new Date(b.next_callback_at))
        .slice(0, 20);

      return ok({ total: data.length, by_stage: byStage, upcoming_callbacks: upcoming });
    }

    case "list_saved_searches": {
      const { data, error } = await supabase
        .from("admin_saved_searches")
        .select("id, search_query, industry_name, location, lead_count, results_saved, created_at")
        .eq("user_id", OWNER_USER_ID)
        .order("created_at", { ascending: false })
        .limit(clampLimit(args.limit, 20, 100));
      if (error) return fail(error.message);
      return ok({ count: data.length, searches: data });
    }

    default:
      return fail(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  { name: "leads2gold-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await handleTool(request.params.name, request.params.arguments || {});
  } catch (err) {
    return fail(err?.message || String(err));
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[leads2gold-mcp] server running on stdio");
