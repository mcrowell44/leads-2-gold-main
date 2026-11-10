// MCP server endpoint (JSON-RPC over HTTP) exposing leads + CRM tools.
// Deploy manually:  supabase functions deploy mcp --no-verify-jwt
// Antigravity connector URL: https://gbkczpjywixipmlaflgy.supabase.co/functions/v1/mcp?key=<MCP_ACCESS_TOKEN>
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ACCESS_TOKEN = Deno.env.get("MCP_ACCESS_TOKEN") ?? "";
const OWNER_USER_ID = Deno.env.get("MCP_OWNER_USER_ID") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STAGES = [
  "new_lead",
  "first_contact",
  "callback_scheduled",
  "qualified",
  "proposal",
  "won",
  "lost",
];

const TOOLS = [
  {
    name: "search_leads",
    description:
      "Search saved business leads by company name, industry or location. Returns company, contact, rating and score.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text matched against company name" },
        industry: { type: "string" },
        location: { type: "string", description: "City, state or region" },
        limit: { type: "number", description: "Default 25, max 100" },
      },
    },
  },
  {
    name: "get_lead",
    description:
      "Get one enriched lead in full: insights, pain points, suggested products, best call times.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_prospects",
    description: "List CRM prospects, optionally filtered by pipeline stage or company name.",
    inputSchema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: STAGES },
        query: { type: "string" },
        limit: { type: "number", description: "Default 25, max 100" },
      },
    },
  },
  {
    name: "create_prospect",
    description: "Add a new prospect to the CRM pipeline.",
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
        stage: { type: "string", enum: STAGES },
      },
      required: ["company_name"],
    },
  },
  {
    name: "update_prospect_stage",
    description: "Move a prospect to another pipeline stage, optionally with a note.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        stage: { type: "string", enum: STAGES },
        notes: { type: "string" },
      },
      required: ["id", "stage"],
    },
  },
  {
    name: "schedule_callback",
    description: "Schedule a callback and move the prospect to the callback_scheduled stage.",
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
    description: "Prospect counts per pipeline stage plus upcoming scheduled callbacks.",
    inputSchema: { type: "object", properties: {} },
  },
];

const clamp = (n: unknown, def = 25, max = 100) =>
  Math.min(Math.max(Number(n) || def, 1), max);

const text = (data: unknown) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const errText = (message: string) => ({
  content: [{ type: "text", text: `Error: ${message}` }],
  isError: true,
});

async function runTool(name: string, args: Record<string, any>) {
  switch (name) {
    case "search_leads": {
      let q = supabase
        .from("enriched_leads")
        .select(
          "id, company_name, industry_name, location, phone, email, website, google_rating, google_reviews_count, lead_score, status, created_at",
        )
        .eq("user_id", OWNER_USER_ID)
        .order("created_at", { ascending: false })
        .limit(clamp(args.limit));
      if (args.query) q = q.ilike("company_name", `%${args.query}%`);
      if (args.industry) q = q.ilike("industry_name", `%${args.industry}%`);
      if (args.location) q = q.ilike("location", `%${args.location}%`);
      const { data, error } = await q;
      if (error) return errText(error.message);
      return text({ count: data.length, leads: data });
    }
    case "get_lead": {
      const { data, error } = await supabase
        .from("enriched_leads")
        .select("*")
        .eq("user_id", OWNER_USER_ID)
        .eq("id", args.id)
        .maybeSingle();
      if (error) return errText(error.message);
      if (!data) return errText("Lead not found.");
      return text(data);
    }
    case "list_prospects": {
      let q = supabase
        .from("crm_prospects")
        .select(
          "id, company_name, contact_name, email, phone, website, industry_name, city, state, stage, lead_score, last_contacted_at, next_callback_at, notes",
        )
        .eq("user_id", OWNER_USER_ID)
        .order("updated_at", { ascending: false })
        .limit(clamp(args.limit));
      if (args.stage) q = q.eq("stage", args.stage);
      if (args.query) q = q.ilike("company_name", `%${args.query}%`);
      const { data, error } = await q;
      if (error) return errText(error.message);
      return text({ count: data.length, prospects: data });
    }
    case "create_prospect": {
      const { stage, ...rest } = args;
      const { data, error } = await supabase
        .from("crm_prospects")
        .insert({ ...rest, stage: stage || "new_lead", user_id: OWNER_USER_ID })
        .select()
        .single();
      if (error) return errText(error.message);
      return text(data);
    }
    case "update_prospect_stage": {
      const patch: Record<string, unknown> = { stage: args.stage };
      if (args.notes) patch.notes = args.notes;
      const { data, error } = await supabase
        .from("crm_prospects")
        .update(patch)
        .eq("id", args.id)
        .eq("user_id", OWNER_USER_ID)
        .select()
        .maybeSingle();
      if (error) return errText(error.message);
      if (!data) return errText("Prospect not found.");
      return text(data);
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
      if (error) return errText(error.message);
      if (!data) return errText("Prospect not found.");
      return text(data);
    }
    case "pipeline_summary": {
      const { data, error } = await supabase
        .from("crm_prospects")
        .select("stage, company_name, next_callback_at")
        .eq("user_id", OWNER_USER_ID)
        .limit(2000);
      if (error) return errText(error.message);
      const byStage: Record<string, number> = {};
      for (const s of STAGES) byStage[s] = 0;
      for (const row of data) byStage[row.stage] = (byStage[row.stage] || 0) + 1;
      const upcoming = data
        .filter((r) => r.next_callback_at && new Date(r.next_callback_at) >= new Date())
        .sort(
          (a, b) =>
            new Date(a.next_callback_at).getTime() - new Date(b.next_callback_at).getTime(),
        )
        .slice(0, 20);
      return text({ total: data.length, by_stage: byStage, upcoming_callbacks: upcoming });
    }
    default:
      return errText(`Unknown tool: ${name}`);
  }
}

const rpc = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const provided =
    url.searchParams.get("key") ??
    (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");

  if (!ACCESS_TOKEN || !OWNER_USER_ID) {
    return new Response(
      JSON.stringify({ error: "Server not configured: set MCP_ACCESS_TOKEN and MCP_OWNER_USER_ID" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (provided !== ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ name: "leads2gold-mcp", version: "1.0.0", tools: TOOLS.map((t) => t.name) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, "Parse error")), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const handle = async (msg: any) => {
    const { id, method, params } = msg ?? {};
    switch (method) {
      case "initialize":
        return rpc(id, {
          protocolVersion: params?.protocolVersion ?? "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "leads2gold-mcp", version: "1.0.0" },
        });
      case "notifications/initialized":
        return null;
      case "ping":
        return rpc(id, {});
      case "tools/list":
        return rpc(id, { tools: TOOLS });
      case "tools/call": {
        try {
          const result = await runTool(params?.name, params?.arguments ?? {});
          return rpc(id, result);
        } catch (e) {
          return rpc(id, errText(e instanceof Error ? e.message : String(e)));
        }
      }
      case "resources/list":
        return rpc(id, { resources: [] });
      case "prompts/list":
        return rpc(id, { prompts: [] });
      default:
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  };

  if (Array.isArray(body)) {
    const results = (await Promise.all(body.map(handle))).filter(Boolean);
    return results.length ? json(results) : new Response(null, { status: 202, headers: corsHeaders });
  }

  const result = await handle(body);
  if (!result) return new Response(null, { status: 202, headers: corsHeaders });
  return json(result);
});
