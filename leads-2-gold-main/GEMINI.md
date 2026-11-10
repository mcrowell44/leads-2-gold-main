# Leads2Gold — Antigravity Workspace Configuration

This workspace hosts the Leads2Gold Lead Generation & CRM platform and its dedicated MCP (Model Context Protocol) server.

## Quick Antigravity Controls & Reference

See [`AGENTS.md`](./AGENTS.md) for full system specifications and execution guidelines.

### Available MCP Tools
- `search_leads`: Search enriched business leads.
- `get_enriched_lead`: Retrieve comprehensive AI-enriched lead details.
- `list_crm_prospects`: Query prospects in the sales pipeline.
- `create_crm_prospect`: Insert a new prospect.
- `update_prospect_stage`: Advance or change prospect status.
- `log_contact`: Record an email, call, or interaction.
- `schedule_callback`: Schedule future callback.
- `pipeline_summary`: Get stage counts and upcoming tasks.
- `list_saved_searches`: Review recent lead searches.

### MCP Configuration
To connect this MCP server to Antigravity, add the entry in `mcp_config.json` (see `mcp-server/mcp_config.json` for ready-to-use template).

