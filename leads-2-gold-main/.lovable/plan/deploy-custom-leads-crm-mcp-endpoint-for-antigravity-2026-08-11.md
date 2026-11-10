# Deploy Custom Leads/CRM MCP Endpoint for Antigravity

## Goal
Make Antigravity able to access only Leads2Gold leads and CRM data through a controlled MCP endpoint, with a single manual deploy to the project's Supabase instance.

## What this will do
- Deploy `supabase/functions/mcp/index.ts` as an edge function named `mcp`.
- Secure it with two secrets: `MCP_ACCESS_TOKEN` (a password you create) and `MCP_OWNER_USER_ID` (your Supabase auth UUID).
- Expose 7 read/write tools: `search_leads`, `get_lead`, `list_prospects`, `create_prospect`, `update_prospect_stage`, `schedule_callback`, `pipeline_summary`.
- Return the Antigravity connector URL:
  ```
  https://gbkczpjywixipmlaflgy.supabase.co/functions/v1/mcp?key=<MCP_ACCESS_TOKEN>
  ```

## Steps
1. **Collect secrets** — user provides `MCP_ACCESS_TOKEN` and `MCP_OWNER_USER_ID`.
2. **Save secrets** — add both values to the project secret store via `supabase secrets set`.
3. **Deploy edge function** — run `supabase functions deploy mcp --project-ref gbkczpjywixipmlaflgy --no-verify-jwt`.
4. **Verify endpoint** — send a GET request with the access key and confirm it returns the tool list.
5. **Connect Antigravity** — register the endpoint in `~/.gemini/config/mcp_config.json` or connect via stdio MCP server.

## Notes
- This endpoint runs on your own Supabase instance; deploy locally using the Supabase CLI.
- No database changes are required; the function reads/writes existing `enriched_leads` and `crm_prospects` tables scoped to `MCP_OWNER_USER_ID`.
