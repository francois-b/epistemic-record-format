/**
 * The ERF app: the viewer's pages, shown inside the MCP host.
 *
 * The host opens this resource when a tool carrying `_meta.ui.resourceUri`
 * returns, and feeds the tool result in through `ontoolresult`. The result's
 * `structuredContent.html` is one of the reference viewer's pages, body
 * only; this script places it and turns the page's own links (claim-x.html,
 * atom-y.html, index.html …) into calls back to `erf_view`, so browsing the
 * corpus never leaves the conversation. Anything else is handed to the host
 * to open as a link. Read-only by construction: the app calls one tool.
 */
import { App } from "@modelcontextprotocol/ext-apps";

interface Page { page: string; title: string; html: string; corpus?: string }

const app = new App({ name: "ERF", version: "0.1.0" });
const main = document.getElementById("main")!;
const crumb = document.getElementById("crumb")!;
const status = document.getElementById("status")!;
let current: Page | null = null;

/** The viewer's file names map onto erf_view pages one for one. */
function pageFromHref(href: string): string | null {
  const h = href.split("#")[0] ?? "";
  if (h === "index.html" || h === "") return "index";
  if (h === "sources.html") return "sources";
  if (h === "health.html") return "health";
  const m = /^(claim|atom|survey|capture|narrative)-(.+)\.html$/.exec(h);
  return m ? `${m[1]}:${decodeURIComponent(m[2]!)}` : null;
}

function show(p: Page): void {
  current = p;
  main.innerHTML = p.html;
  crumb.textContent = p.title;
  status.textContent = "";
  main.scrollTop = 0;
}

function fromResult(r: unknown): Page | null {
  const x = r as { structuredContent?: Page; result?: { structuredContent?: Page }; isError?: boolean; content?: { type: string; text?: string }[] };
  const sc = x?.structuredContent ?? x?.result?.structuredContent;
  if (sc && typeof sc.html === "string") return sc;
  const t = x?.content?.find((c) => c.type === "text")?.text;
  if (t) return { page: "error", title: "erf", html: `<p class="gap">${escapeHtml(t)}</p>` };
  return null;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

async function open(page: string): Promise<void> {
  status.textContent = "…";
  try {
    const r = await app.callServerTool({ name: "erf_view", arguments: { page, ...(current?.corpus ? { corpus: current.corpus } : {}) } });
    const p = fromResult(r);
    if (p) show(p); else status.textContent = "no page in the result";
  } catch (e) {
    status.textContent = `could not open ${page}: ${String(e)}`;
  }
}

document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute("href") ?? "";
  e.preventDefault();
  const page = pageFromHref(href);
  if (page) { void open(page); return; }
  if (/^https?:\/\//.test(href)) void app.openLink({ url: href });
});

app.ontoolresult = (params) => {
  const p = fromResult(params);
  if (p) show(p);
};

app.onhostcontextchanged = (ctx) => {
  const theme = (ctx as { theme?: string }).theme;
  if (theme) document.documentElement.dataset["theme"] = theme;
};

await app.connect();
