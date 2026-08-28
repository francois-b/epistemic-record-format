/**
 * Render an app view locally, from a real corpus, through a real host bridge:
 * what Claude Desktop would show for erf_view or erf_proposals, minus the
 * host's chrome. For looking at a card or the editor without a screenshot
 * from the operator.
 *
 *     npx tsx scripts/preview-app.ts <corpus-dir> <page> [--mode inline|fullscreen] [--theme dark|light] [--out <dir>] [--serve <port>]
 *
 * page: index · sources · health · claim:<id> · atom:<id> · capture:<id> · survey:<id> · narrative:<slug> · proposals[:<flag>]
 *
 * Without --serve the page is written to <out>/index.html (default: a folder
 * under the system temp dir) and the app's tool calls are refused with a
 * notice. With --serve the page is served on localhost and the app's
 * read-only tool calls are answered from the corpus; writes are refused.
 */
import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_HTML } from "../src/app-bundle.generated.ts";
import { callPreviewTool, openPreviewCorpus, previewContent } from "../src/preview.ts";

const here = dirname(fileURLToPath(import.meta.url));

function args(): { dir: string; page: string; mode: "inline" | "fullscreen"; theme: "dark" | "light"; out: string | null; serve: number | null } {
  const a = process.argv.slice(2);
  const pos: string[] = []; let mode: "inline" | "fullscreen" = "inline"; let theme: "dark" | "light" = "dark"; let out: string | null = null; let serve: number | null = null;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    if (x === "--mode") { const v = a[++i]; mode = v === "fullscreen" ? "fullscreen" : "inline"; continue; }
    if (x === "--theme") { const v = a[++i]; theme = v === "light" ? "light" : "dark"; continue; }
    if (x === "--out") { out = a[++i] ?? null; continue; }
    if (x === "--serve") { serve = Number(a[++i] ?? 0) || 0; continue; }
    pos.push(x);
  }
  if (pos.length < 2) { console.error("usage: preview-app.ts <corpus-dir> <page> [--mode inline|fullscreen] [--theme dark|light] [--out <dir>] [--serve <port>]"); process.exit(2); }
  return { dir: resolve(pos[0]!), page: pos[1]!, mode, theme, out, serve };
}

const FRAME_CSS = `
html, body { margin: 0; background: var(--color-background-primary); color: var(--color-text-primary); font: 14px/1.4 -apple-system, "Anthropic Sans", sans-serif; }
#frame { max-width: 820px; margin: 24px auto; }
#app { display: block; width: 100%; border: 1px solid var(--color-border-tertiary); border-radius: 12px; background: var(--color-background-primary); min-height: 120px; }
body.fullscreen #frame { max-width: none; margin: 0; }
body.fullscreen #app { height: 100vh; border: 0; border-radius: 0; }
#log { max-width: 820px; margin: 12px auto; padding: 8px 12px; font: 12px/1.5 ui-monospace, monospace; color: var(--color-text-tertiary); border-top: 1px solid var(--color-border-tertiary); }
body.fullscreen #log { display: none; }
`;

async function hostBundle(): Promise<string> {
  const r = await build({ entryPoints: [join(here, "preview-host.ts")], bundle: true, format: "esm", platform: "browser", target: "es2022", minify: false, write: false, legalComments: "none" });
  return r.outputFiles[0]!.text;
}

const script = (s: string): string => s.replace(/<\/script/gi, "<\\/script");

async function page(o: ReturnType<typeof args>): Promise<string> {
  const c = openPreviewCorpus(o.dir);
  const content = previewContent(c, o.page);
  const preview = { app: APP_HTML, page: o.page, mode: o.mode, theme: o.theme, serve: o.serve !== null, content: { content: content.content, structuredContent: content.structuredContent } };
  const host = await hostBundle();
  return `<!doctype html>
<html lang="en" data-theme="${o.theme}">
<head><meta charset="utf-8"><title>ERF preview · ${o.page}</title><style>${FRAME_CSS}</style></head>
<body>
<div id="frame"><iframe id="app" title="ERF app"></iframe></div>
<pre id="log"></pre>
<script>window.__ERF_PREVIEW__ = ${script(JSON.stringify(preview))};</script>
<script type="module">${script(host)}</script>
</body>
</html>
`;
}

const o = args();
const html = await page(o);
if (o.serve === null) {
  const slug = o.page.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "index";
  const dir = o.out ? resolve(o.out) : join(tmpdir(), "erf-preview", slug);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "index.html");
  writeFileSync(file, html, "utf8");
  console.log(file);
} else {
  const c = openPreviewCorpus(o.dir);
  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/tool") {
      let body = "";
      req.on("data", (d) => { body += d; });
      req.on("end", () => {
        let out;
        try { const p = JSON.parse(body) as { name: string; arguments?: Record<string, unknown> }; out = callPreviewTool(c, p.name, p.arguments ?? {}); }
        catch (e) { out = { isError: true, content: [{ type: "text", text: `preview: ${e instanceof Error ? e.message : String(e)}` }] }; }
        res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(out));
      });
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html);
  });
  server.listen(o.serve, "127.0.0.1", () => {
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : o.serve;
    console.log(`http://127.0.0.1:${port}/  (${o.page}, ${o.mode}, ${o.theme}; read-only tools answered, writes refused; Ctrl-C to stop)`);
  });
}
