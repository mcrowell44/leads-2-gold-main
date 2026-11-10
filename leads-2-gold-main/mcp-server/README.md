# Leads2Gold MCP Server (self-hosted)

A standalone Node MCP server that connects **Antigravity** (and other MCP-compliant clients) to your Supabase project and exposes your leads + CRM data as tools. It runs on **your** machine over stdio — nothing here is built into or deployed by Lovable, and it is not part of the web app bundle.

## Available Tools

| Tool | What it does |
| --- | --- |
| `search_leads` | Search enriched leads by company, industry, city/state |
| `get_enriched_lead` | Full lead record: insights, pain points, suggested products, best call times |
| `list_crm_prospects` | List prospects, filter by pipeline stage or company |
| `create_crm_prospect` | Add a new prospect to the pipeline |
| `update_prospect_stage` | Move a prospect between stages (`new_lead`, `first_contact`, `callback_scheduled`, `qualified`, `proposal`, `won`, `lost`) |
| `log_contact` | Append a contact attempt and stamp `last_contacted_at` |
| `schedule_callback` | Set a callback time and move to `callback_scheduled` |
| `pipeline_summary` | Counts per stage plus upcoming callbacks |
| `list_saved_searches` | Recent saved lead searches |

Pipeline stages: `new_lead`, `first_contact`, `callback_scheduled`, `qualified`, `proposal`, `won`, `lost`.

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env   # fill in your values
```

### Environment variables

- `SUPABASE_URL` — `https://gbkczpjywixipmlaflgy.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Project Settings → API. **Server-side only.** Never commit it or put it in client code.
- `MCP_OWNER_USER_ID` — your `auth.users.id`. Every query is scoped to this user, so even though the service role key bypasses RLS, the server can only access your own rows.

Find your user ID in Supabase Dashboard → Authentication → Users.

---

## Connect to Antigravity

Antigravity natively discovers MCP servers defined in `mcp_config.json`.

### Global Antigravity Configuration
Add the server entry to your global Antigravity config:
- **Windows**: `%USERPROFILE%\.gemini\config\mcp_config.json`
- **macOS / Linux**: `~/.gemini/config/mcp_config.json`

```json
{
  "mcpServers": {
    "leads2gold": {
      "command": "node",
      "args": [
        "C:\\Users\\lenderschoicemarcus\\Downloads\\leads-2-gold-main\\leads-2-gold-main\\mcp-server\\index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://gbkczpjywixipmlaflgy.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-supabase-service-role-key",
        "MCP_OWNER_USER_ID": "your-auth-user-uuid"
      }
    }
  }
}
```

> **Note**: Alternatively, if you place your credentials into `mcp-server/.env`, the server will automatically load them on start, allowing you to omit the `env` block from `mcp_config.json`.

Once saved, Antigravity automatically initializes the server and registers all 9 tools (`search_leads`, `get_enriched_lead`, `list_crm_prospects`, etc.) in the active toolset. You can verify connection status in Antigravity IDE under **Additional Options (...) > MCP Servers**.

---

## Connect to Other MCP Clients (Optional)

Any client supporting the Model Context Protocol stdio transport can connect using this configuration:

```json
{
  "mcpServers": {
    "leads2gold": {
      "command": "node",
      "args": ["<absolute-path-to-mcp-server>/index.js"],
      "env": {
        "SUPABASE_URL": "https://gbkczpjywixipmlaflgy.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "MCP_OWNER_USER_ID": "your-auth-user-uuid"
      }
    }
  }
}
```

---

## Quick Local Test

Run from terminal:

```bash
cd mcp-server
node index.js
```

You should see:
```
[leads2gold-mcp] server running on stdio
```
The process listens for JSON-RPC messages over stdin/stdout.

## Security Controls

- The service role key bypasses Supabase RLS policies. Keep it in a secure `.env` or in your private `mcp_config.json`. Never push it to GitHub or expose it to the browser bundle.
- Every tool handler enforces `user_id = MCP_OWNER_USER_ID` across all select, insert, and update operations.
