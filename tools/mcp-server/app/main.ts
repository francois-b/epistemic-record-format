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
  const m = /^(claim|atom|survey|capture|narrative)-(.*)\.html$/.exec(h);
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

// ---- mark for backing: select a passage of the narrative, hand it to the conversation ----
// The app never writes here. "Back this" sends the selection as a message, so the LLM proposes
// claims and the user rules, exactly as when the passage was pasted by hand.
const bar = document.getElementById("selbar")!;
const selText = (): string => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return "";
  const range = sel.getRangeAt(0);
  if (!main.contains(range.commonAncestorContainer)) return "";
  return sel.toString().replace(/\s+/g, " ").trim();
};
function placeBar(): void {
  const text = selText();
  if (!current || !current.page.startsWith("narrative") || text.length < 12) { bar.hidden = true; return; }
  const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
  bar.hidden = false;
  // fixed against the viewport: #main scrolls on its own, so document offsets would drift
  bar.style.top = `${Math.max(4, rect.top - bar.offsetHeight - 8)}px`;
  bar.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - bar.offsetWidth - 8))}px`;
}
document.addEventListener("mouseup", () => setTimeout(placeBar, 0));
document.addEventListener("keyup", (e) => { if (e.shiftKey || e.key === "Shift") placeBar(); });
document.addEventListener("selectionchange", () => { if (!selText()) bar.hidden = true; });
bar.addEventListener("mousedown", (e) => e.preventDefault()); // keep the selection while clicking a button
document.getElementById("back-this")!.addEventListener("click", async () => {
  const text = selText(); if (!text) return;
  const passage = text.length > 1200 ? text.slice(0, 1200) + " […]" : text;
  const msg = `Back this passage from the narrative "${current?.title ?? ""}": propose the claims it rests on (decompose it, type each by what would settle it, say what would back it), and wait for my ruling before writing anything.\n\n"${passage}"`;
  const caps = app.getHostCapabilities();
  try {
    if (caps?.sendMessage) { await app.sendMessage({ role: "user", content: [{ type: "text", text: msg }] }); status.textContent = "sent to the conversation"; }
    else { await navigator.clipboard.writeText(msg); status.textContent = "this host cannot send messages; copied to the clipboard, paste it"; }
  } catch (e) { status.textContent = `could not send: ${String(e)}`; }
  bar.hidden = true;
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
