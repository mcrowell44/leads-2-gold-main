#!/usr/bin/env node
/**
 * Automatically registers the Leads2Gold MCP server in Antigravity's global configuration:
 * ~/.gemini/config/mcp_config.json
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverScript = resolve(__dirname, "index.js");

const antigravityConfigPath = join(homedir(), ".gemini", "config", "mcp_config.json");

if (!existsSync(antigravityConfigPath)) {
  console.error(`Antigravity config not found at: ${antigravityConfigPath}`);
  process.exit(1);
}

let config = { mcpServers: {} };
try {
  const content = readFileSync(antigravityConfigPath, "utf-8").trim();
  if (content) {
    config = JSON.parse(content);
  }
} catch (e) {
  console.error(`Failed to parse Antigravity config: ${e.message}`);
  process.exit(1);
}

if (!config.mcpServers) {
  config.mcpServers = {};
}

// Preserve existing env if already registered, else pull from env or template
const existing = config.mcpServers.leads2gold;
const env = existing?.env || {
  SUPABASE_URL: process.env.SUPABASE_URL || "https://gbkczpjywixipmlaflgy.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_ROLE_KEY",
  MCP_OWNER_USER_ID: process.env.MCP_OWNER_USER_ID || "YOUR_SUPABASE_AUTH_USER_UUID",
};

config.mcpServers.leads2gold = {
  command: "node",
  args: [serverScript],
  env,
};

writeFileSync(antigravityConfigPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
console.log(`[OK] Successfully registered 'leads2gold' in Antigravity config:`);
console.log(`     ${antigravityConfigPath}`);
console.log(`     Target script: ${serverScript}`);

