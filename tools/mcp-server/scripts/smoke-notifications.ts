/**
 * PROBE (2026-08-27): what erf-mcp sends besides results. Spawns the server
 * over stdio on a temporary copy of the minimal corpus, calls erf_source_add
 * with a progress token and erf_render_site, and prints every notification
 * as it arrives on the wire (progress, logging), so the host's rendering of
 * them can be judged against what was actually sent.
 *
 *     npx tsx scripts/smoke-notifications.ts
 */
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LoggingMessageNotificationSchema, ProgressNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "erf-smoke-"));
cpSync(join(here, "..", "..", "..", "examples", "corpora", "minimal"), dir, { recursive: true });
writeFileSync(join(dir, "memo.md"), "The ledger recorded seventeen units, and the audit agreed.\n");

const transport = new StdioClientTransport({ command: join(here, "..", "node_modules", ".bin", "tsx"), args: ["--tsconfig", join(here, "..", "tsconfig.json"), join(here, "..", "src", "index.ts"), dir, "--no-commit"] });
const client = new Client({ name: "smoke", version: "0" }, { capabilities: {} });
client.setNotificationHandler(ProgressNotificationSchema, (n) => console.log("progress  ", JSON.stringify(n.params)));
client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => console.log("logging   ", JSON.stringify(n.params)));
await client.connect(transport);
// the raw wire, for notifications only
const orig = transport.onmessage;
transport.onmessage = (m, extra) => { if (!("id" in m) && "method" in m) console.log("wire      ", JSON.stringify(m)); orig?.(m, extra); };

console.log("-- erf_source_add with a progress token");
const r1 = await client.callTool({ name: "erf_source_add", arguments: { id: "memo-2026", citation_text: "Internal memo, 2026", path: "memo.md" } }, undefined, { onprogress: (p) => console.log("onprogress", JSON.stringify(p)) });
console.log("result    ", String((r1 as { content: { text?: string }[] }).content[0]?.text).split("\n")[0]);
console.log("-- erf_atom_mint (a write: expect a logging message)");
await client.callTool({ name: "erf_atom_mint", arguments: { source: "memo-2026", quote: "the audit agreed", finding: "The audit agreed.", source_quality: "medium" } });
console.log("-- erf_render_site with a progress token");
const r2 = await client.callTool({ name: "erf_render_site", arguments: {} }, undefined, { onprogress: (p) => console.log("onprogress", JSON.stringify(p)) });
console.log("result    ", String((r2 as { content: { text?: string }[] }).content[0]?.text).split("\n")[0]);
console.log("-- erf_source_add without a token (expect no progress)");
writeFileSync(join(dir, "memo2.md"), "Another memo.\n");
await client.callTool({ name: "erf_source_add", arguments: { id: "memo2-2026", citation_text: "Another memo, 2026", path: "memo2.md" } });
await client.close();
