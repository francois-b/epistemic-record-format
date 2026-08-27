/**
 * The ERF app: the viewer's pages inside the MCP host, and an editor under the
 * narrative.
 *
 * The host opens this resource when a tool carrying `_meta.ui.resourceUri`
 * returns, and feeds the tool result in through `ontoolresult`. The result's
 * `structuredContent.html` is one of the reference viewer's pages, body only;
 * this script places it and turns the page's own links (claim-x.html,
 * atom-y.html, index.html …) into calls back to `erf_view`, so browsing the
 * corpus never leaves the conversation.
 *
 * A narrative opened fullscreen is different: it is not a page to read but a
 * file to work on, so the app mounts the editor (`tools/editor/`) over the
 * markdown source it gets from `erf_narrative_read`, saves through
 * `erf_narrative_write`, and draws what the record says on top of the prose.
 *
 * The app still writes exactly one kind of file, the narrative. Every record
 * is written by a tool the LLM calls, with the person ruling in chat. A
 * selection becomes a flag and, when the flag asks for more than a
 * proposal, one message into the conversation; from there the app only
 * watches, by polling `erf_narrative_status`, which is local and read-only.
 */
import { App } from "@modelcontextprotocol/ext-apps";
import { createEditor, type EditorHandle, type FlagMark, type BindingMark } from "../../editor/src/index.ts";

interface Page { page: string; title: string; html: string; corpus?: string; flags?: { id: number; anchor: string; note?: string }[] }
interface NarrativeRead { narrative: string; path: string; title: string; text: string; digest: string; bindings: BindingMark[]; flags: FlagMark[] }
interface NarrativeWritten { written: string; digest: string; check: string; bindings: BindingMark[]; flags: FlagMark[] }
interface NarrativeStatus { digest: string; bindings: BindingMark[]; flags: FlagMark[] }
interface FlagWritten { id: number; narrative: string; anchor: string; research: string; note?: string }

type Research = "mint" | "survey" | "back" | "opposite";

// autoResize: the app reports its content height to the host, so inline the card fits
// its page and the host's scrollbar is the only one.
const app = new App({ name: "ERF", version: "0.2.0" }, undefined, { autoResize: true });
const main = document.getElementById("main") as HTMLElement;
const editorEl = document.getElementById("editor") as HTMLElement;
const banner = document.getElementById("banner") as HTMLElement;
const bannerText = document.getElementById("banner-text") as HTMLElement;
const crumbs = [document.getElementById("crumb-inline")!];
const statusEl = document.getElementById("status-inline") as HTMLElement;
const toggleBtn = document.getElementById("mode-toggle") as HTMLButtonElement;

let current: Page | null = null;
let mode: "inline" | "fullscreen" | "pip" = "inline";

/** The narrative the editor holds, and the digest the next write will be checked against. */
let doc: { narrative: string; title: string; digest: string } | null = null;
let ed: EditorHandle | null = null;
/** Bumped on every write, so a poll result from before it is discarded rather than acted on. */
let epoch = 0;

// ---- the status line -------------------------------------------------------
// One line, three registers: what the app is doing now, what the corpus is
// doing for us (a request in flight), and a notice that fades.

let steady = "";
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

function paint(text: string, tone: "" | "working" | "settled"): void {
  statusEl.textContent = text;
  statusEl.className = tone;
}
function setStatus(text: string, tone: "" | "working" | "settled" = ""): void {
  steady = text;
  if (!noticeTimer) paint(text, tone);
}
/** Something just happened; say so for a few seconds, then fall back to the steady line. */
function notice(text: string, seconds = 6): void {
  if (noticeTimer) clearTimeout(noticeTimer);
  paint(text, "settled");
  noticeTimer = setTimeout(() => { noticeTimer = null; paint(steady, steady ? "working" : ""); }, seconds * 1000);
}

// ---- calling the server ----------------------------------------------------

function structuredOf<T>(r: unknown): T | null {
  const x = r as { structuredContent?: T; result?: { structuredContent?: T } };
  return x?.structuredContent ?? x?.result?.structuredContent ?? null;
}
function textOf(r: unknown): string {
  return (r as { content?: { text?: string }[] }).content?.[0]?.text ?? "";
}
async function call<T>(name: string, args: Record<string, unknown>): Promise<{ data: T | null; text: string }> {
  const r = await app.callServerTool({ name, arguments: { ...args, ...(current?.corpus ? { corpus: current.corpus } : {}) } });
  return { data: structuredOf<T>(r), text: textOf(r) };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

// ---- modes -----------------------------------------------------------------

let modeTimer: number | undefined;
function applyMode(m: typeof mode, settled = false): void {
  const changed = m !== mode;
  const leavingFullscreen = changed && mode === "fullscreen" && m !== "fullscreen";
  window.clearTimeout(modeTimer);
  // Leaving fullscreen, the host animates the view back into its inline slot. Swapping the editor for the
  // outline at that moment changes the content height mid-flight and the card jumps; so the content is
  // left as it is until the animation has settled, and only then laid out inline (a try, 2026-08-27).
  if (leavingFullscreen && !settled) {
    if (ed?.isDirty()) void saveNow(ed.getText()); // an editor left with unsaved work saves before the view goes away
    modeTimer = window.setTimeout(() => applyMode(m, true), 400);
    return;
  }
  mode = m;
  document.body.classList.toggle("mode-fullscreen", m === "fullscreen");
  document.body.classList.toggle("mode-inline", m !== "fullscreen");
  toggleBtn.textContent = m === "fullscreen" ? "inline" : "open";
  if (leavingFullscreen && ed?.isDirty()) void saveNow(ed.getText());
  if (changed && current) render();
}

const isNarrative = (p: Page | null): boolean => !!p && p.page.startsWith("narrative");
/** The slug in a narrative page id. Empty for the bare `narrative` page, which the server reads as "the only one". */
const slugIn = (p: Page | null): string => (p ? p.page.replace(/^narrative:?/, "") : "");
/** What to ask the server for: what the page names, else what the editor already holds. */
const narrativeSlug = (p: Page | null): string => slugIn(p) || doc?.narrative || "";

/** What the card shows for the current page in the current mode. A narrative is a document,
 *  not an answer: inline it would scroll inside a card the host caps in height, so inline it
 *  is its outline; fullscreen it is the editor. Records fit either way. */
/** Try, 2026-08-27: the narrative is the editor inline as well as fullscreen, so nothing swaps while the host
 *  animates the view between the two and the card has no reason to jump. Inline the editor gets a fixed
 *  height (template.html) and scrolls inside the card. Set false to return to the outline inline. */
const INLINE_EDITOR = true;
function render(): void {
  const p = current; if (!p) return;
  const slug = narrativeSlug(p);
  if (isNarrative(p) && (mode === "fullscreen" || INLINE_EDITOR)) {
    main.hidden = true;
    editorEl.hidden = false;
    void mountEditor(slug);
    return;
  }
  editorEl.hidden = true;
  main.hidden = false;
  hideSelection();
  if (isNarrative(p)) {
    const probe = document.createElement("div"); probe.innerHTML = p.html;
    const headings = [...probe.querySelectorAll("h2, h3")].map((h) => h.textContent ?? "");
    const bound = probe.querySelectorAll(".bind").length;
    const flagged = p.flags?.length ?? 0;
    const items = headings.map((t) => `<li>${escapeHtml(t)}</li>`).join("") || "<li>(no sections)</li>";
    main.innerHTML = `<main><h1>${escapeHtml(p.title)}</h1><p class="sub">Narrative · ${bound} bound passage${bound === 1 ? "" : "s"} · ${flagged} flagged · the outline; press <b>open</b> to edit it fullscreen</p><ul class="outline">${items}</ul></main>`;
  } else {
    main.innerHTML = (mode === "fullscreen" ? null : compactRecord(p)) ?? p.html;
  }
  main.scrollTop = 0;
}

/**
 * A record inline: the card is an answer in a conversation, not a page, and
 * the host caps its height. So a claim, atom or survey shows its title, the
 * line that says what it is, and how much sits under each heading of the
 * full page; the page itself is one press of open away. The counts are read
 * off the rendered page rather than the record, so they cannot disagree with
 * it. Index, sources and health are lists meant for browsing, and stay whole.
 */
function compactRecord(p: Page): string | null {
  const kind = p.page.split(":")[0] ?? "";
  if (!["claim", "atom", "survey", "capture"].includes(kind)) return null;
  const probe = document.createElement("div"); probe.innerHTML = p.html;
  const h1 = probe.querySelector("h1")?.innerHTML ?? escapeHtml(p.title);
  const sub = probe.querySelector("p.sub")?.innerHTML ?? "";
  const tags = probe.querySelector(".tags.head")?.innerHTML ?? "";
  const counts: string[] = [];
  let finding = "";
  for (const h of probe.querySelectorAll("h3")) {
    const label = (h.textContent ?? "").trim();
    let n = 0;
    for (let el = h.nextElementSibling; el && !/^H[23]$/.test(el.tagName); el = el.nextElementSibling) {
      if (el.tagName === "TABLE") n += Math.max(0, el.querySelectorAll("tr").length - 1);
      else if (el.tagName === "UL" || el.tagName === "OL") n += el.children.length;
      else if (el.classList.contains("ledger")) n += el.querySelectorAll(".row").length;
      else if (kind === "atom" && label === "Finding" && el.tagName === "P") finding = el.innerHTML;
    }
    if (n || /^(Evidence|Coverage|Relations|Standings|Search acts|Notable results|Audit)/.test(label)) counts.push(`${escapeHtml(label.toLowerCase())} ${n}`);
  }
  return `<main class="compact"><h1>${h1}</h1><p class="sub">${sub}${tags ? ` <span class="tags head">${tags}</span>` : ""}</p>`
    + (finding ? `<p class="finding">${finding}</p>` : "")
    + (counts.length ? `<p class="sub counts">${counts.join(" &middot; ")}</p>` : "")
    + `<p class="sub hint">press <b>open</b> for the full record</p></main>`;
}

function show(p: Page): void {
  current = p;
  for (const c of crumbs) c.textContent = p.title;
  setStatus("");
  render();
  // opening a narrative asks for the editor straight away; the host may decline, and the outline stands
  if (isNarrative(p) && mode !== "fullscreen") {
    app.requestDisplayMode({ mode: "fullscreen" }).then((r) => { const got = (r as { mode?: typeof mode }).mode; if (got) applyMode(got); }).catch(() => {});
  }
}

// ---- the editor ------------------------------------------------------------

/** Load the narrative into the editor. Called whenever the fullscreen view of a narrative is entered. */
async function mountEditor(slug: string): Promise<void> {
  if (doc?.narrative === slug && ed) { refreshMarks(); return; }
  setStatus("reading…", "working");
  try {
    const { data, text } = await call<NarrativeRead>("erf_narrative_read", { narrative: slug });
    if (!data) { setStatus(text.slice(0, 140)); return; }
    doc = { narrative: data.narrative, title: data.title, digest: data.digest };
    if (!ed) { ed = createEditor(editorEl, data.text, { autosaveMs: 2000 }); wireEditor(ed); }
    else ed.setText(data.text);
    reportMissing(ed.setMarks({ flags: data.flags, bindings: data.bindings }));
    setStatus("");
    ed.focus();
    offerUnwrap();
    schedulePolling(data.flags);
  } catch (e) {
    setStatus(`could not open the editor: ${String(e)}`);
  }
}

// ---- a hand-wrapped file ----------------------------------------------------
// The display already reads a wrapping newline as a space; the file keeps it
// until the person says otherwise. The offer is made once per file: taken, it
// is one undoable edit and one ordinary save; declined, it is not made again.

const noticeEl = document.getElementById("notice") as HTMLElement;
const noticeText = document.getElementById("notice-text") as HTMLElement;
const declined = new Set<string>();
const declinedKey = (slug: string): string => `erf.unwrap.declined:${current?.corpus ?? ""}:${slug}`;
function wasDeclined(slug: string): boolean {
  if (declined.has(slug)) return true;
  try { return localStorage.getItem(declinedKey(slug)) === "1"; } catch { return false; }
}
function offerUnwrap(): void {
  if (!doc || !ed || wasDeclined(doc.narrative) || !ed.looksHardWrapped()) { noticeEl.hidden = true; return; }
  noticeText.textContent = "This narrative is hard-wrapped. Unwrap it to one line per paragraph, as CommonMark reads it? One edit, one save; the display already reads it this way.";
  noticeEl.hidden = false;
}
document.getElementById("notice-dismiss")!.addEventListener("click", () => {
  noticeEl.hidden = true;
  if (!doc) return;
  declined.add(doc.narrative);
  try { localStorage.setItem(declinedKey(doc.narrative), "1"); } catch { /* no storage: the session remembers */ }
});
document.getElementById("notice-go")!.addEventListener("click", () => {
  noticeEl.hidden = true;
  if (!ed) return;
  const n = ed.unwrap();
  notice(`${n} wrapping newline${n === 1 ? "" : "s"} became spaces; saving`, 5);
  void saveNow(ed.getText());
});

function reportMissing(r: { missing: string[] }): void {
  if (r.missing.length) notice(`${r.missing.length} anchor${r.missing.length === 1 ? "" : "s"} no longer in the prose`, 8);
}

function wireEditor(handle: EditorHandle): void {
  handle.onSave((text) => { void saveNow(text); });
  handle.onSelectionChange((sel) => {
    if (!sel) { hideSelection(); return; }
    pending = { anchor: sel.anchor, text: sel.text };
    placeAt(document.getElementById("selbar") as HTMLElement, sel.rect);
  });
}

/**
 * One write at a time. A save asked for while one is in flight is remembered,
 * not sent: a second write would carry the digest the first is about to
 * invalidate, and the person would be told their own typing had changed the
 * file underneath them. When the write returns, the document is saved again if
 * it moved on. The returned promise settles when the whole chain has.
 */
let writing: Promise<void> | null = null;
let pendingSave = false, pendingForce = false;

function saveNow(text: string, force = false): Promise<void> {
  if (writing) { pendingSave = true; pendingForce = pendingForce || force; return writing; }
  const run = (async () => {
    await writeNarrative(text, force);
    while (pendingSave && ed) {
      pendingSave = false;
      const f = pendingForce; pendingForce = false;
      if (!f && !ed.isDirty()) break;
      await writeNarrative(ed.getText(), f);
    }
  })();
  writing = run.finally(() => { writing = null; });
  return writing;
}

/** Write the narrative, with the digest of the version this edit was made against. */
async function writeNarrative(text: string, force = false): Promise<void> {
  if (!doc || !ed) return;
  setStatus("saving…", "working");
  const mine = ++epoch;
  try {
    const { data, text: said } = await call<NarrativeWritten>("erf_narrative_write", {
      narrative: doc.narrative, text, ...(force ? { force: true } : { expected_digest: doc.digest }),
    });
    if (!data) {
      // reconcile writes for itself: it must not queue behind the write it is answering
      if (/changed on disk/.test(said)) await reconcile();
      else setStatus(said.replace(/^\[[^\]]*\]\s*/, "").slice(0, 160));
      return;
    }
    if (mine !== epoch) return;
    doc.digest = data.digest;
    ed.markSaved();
    hideBanner();
    reportMissing(ed.setMarks({ flags: data.flags, bindings: data.bindings }));
    // the steady line is cleared before the notice, or "saving…" returns when the notice fades
    setStatus("");
    const line = data.check.split("\n").find((l) => l.includes("binding(s)")) ?? "";
    notice(`saved${line ? ` · ${line.replace(/^\S+:\s*/, "")}` : ""}`, 5);
    schedulePolling(data.flags);
  } catch (e) {
    setStatus(`could not save: ${String(e)}`);
  }
}

function showBanner(text: string): void { bannerText.textContent = `${text} Reload to take what is on disk, or overwrite it with what is here.`; banner.hidden = false; }

/**
 * The file moved on disk under an editor with unsaved work. A binding is the
 * only thing another worker writes into a narrative, so the two texts are
 * merged rather than one chosen over the other: their markers come in, this
 * text keeps everything it has, and the result is written back. The banner is
 * for what merging cannot settle: an anchor whose words were rewritten here,
 * or a change that is not a binding at all.
 */
async function reconcile(): Promise<void> {
  if (!doc || !ed) return;
  const { data } = await call<NarrativeRead>("erf_narrative_read", { narrative: doc.narrative });
  if (!data) { showBanner("This narrative changed on disk and could not be read back."); return; }
  const r = ed.mergeFrom(data.text);
  if (r.conflicts.length) {
    showBanner(`This narrative changed on disk while you were editing, and ${r.conflicts.length} binding(s) could not be placed here: ${r.conflicts.map((x) => `"${x}"`).join("; ")}.`);
    return;
  }
  if (!r.inserted) { showBanner("This narrative changed on disk while you were editing, and the change was not a binding."); return; }
  doc.digest = data.digest;   // this text now holds theirs as well as mine
  hideBanner();
  await writeNarrative(ed.getText(), true);
  notice(`merged ${r.inserted} binding${r.inserted === 1 ? "" : "s"} from elsewhere`, 6);
}
function hideBanner(): void { banner.hidden = true; }

document.getElementById("banner-reload")!.addEventListener("click", () => {
  hideBanner();
  if (doc) { const slug = doc.narrative; doc = null; void mountEditor(slug); }
});
document.getElementById("banner-force")!.addEventListener("click", () => {
  hideBanner();
  if (ed) void saveNow(ed.getText(), true);
});

/** Re-read the flags and bindings without touching the text. */
async function refreshMarks(): Promise<NarrativeStatus | null> {
  if (!doc || !ed) return null;
  const { data } = await call<NarrativeStatus>("erf_narrative_status", { narrative: doc.narrative });
  if (!data) return null;
  reportMissing(ed.setMarks({ flags: data.flags, bindings: data.bindings }));
  return data;
}

// ---- the selection: flag it, and say what to do about it -------------------

const selbar = document.getElementById("selbar") as HTMLElement;
const flagpop = document.getElementById("flagpop") as HTMLElement;
const flagQuote = document.getElementById("flag-quote") as HTMLElement;
const flagNote = document.getElementById("flag-note") as HTMLInputElement;
let pending: { anchor: string; text: string } | null = null;

function placeAt(el: HTMLElement, rect: { top: number; left: number; bottom: number }): void {
  el.hidden = false;
  const above = rect.top - el.offsetHeight - 8;
  el.style.top = `${above > 4 ? above : rect.bottom + 8}px`;
  el.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - el.offsetWidth - 8))}px`;
}
function hideSelection(): void { selbar.hidden = true; flagpop.hidden = true; pending = null; }

// In the rendered narrative (never fullscreen now, but a host may show it) the
// selection is a DOM selection; in the editor it arrives through the handle.
const domSelection = (): string => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return "";
  if (!main.contains(sel.getRangeAt(0).commonAncestorContainer)) return "";
  return sel.toString().replace(/\s+/g, " ").trim();
};
function placeBarFromDom(): void {
  if (!editorEl.hidden) return;
  const text = domSelection();
  if (!isNarrative(current) || text.length < 12) { selbar.hidden = true; return; }
  pending = { anchor: text.split(" ").slice(0, 12).join(" "), text };
  placeAt(selbar, window.getSelection()!.getRangeAt(0).getBoundingClientRect());
}
document.addEventListener("mouseup", () => setTimeout(placeBarFromDom, 0));
document.addEventListener("keyup", (e) => { if (e.shiftKey || e.key === "Shift") placeBarFromDom(); });
document.addEventListener("selectionchange", () => { if (!editorEl.hidden) return; if (!domSelection()) selbar.hidden = true; });
selbar.addEventListener("mousedown", (e) => e.preventDefault()); // keep the selection while clicking a button

document.getElementById("flag-this")!.addEventListener("click", () => {
  if (!pending) return;
  flagQuote.textContent = `“${pending.text.slice(0, 180)}${pending.text.length > 180 ? "…" : ""}”`;
  flagNote.value = "";
  (flagpop.querySelector('input[value="mint"]') as HTMLInputElement).checked = true;
  const r = selbar.getBoundingClientRect();
  selbar.hidden = true;
  placeAt(flagpop, { top: r.top, left: r.left, bottom: r.bottom });
  flagNote.focus();
});
document.getElementById("flag-cancel")!.addEventListener("click", () => hideSelection());
document.getElementById("flag-go")!.addEventListener("click", () => {
  const chosen = (flagpop.querySelector('input[name="research"]:checked') as HTMLInputElement | null)?.value as Research | undefined;
  void submitFlag(chosen ?? "mint", flagNote.value.trim());
});
// Survey and Back are the shortcuts: the same flag, with the verb already chosen; Flag opens the popup for the rest.
document.getElementById("survey-this")!.addEventListener("click", () => { void submitFlag("survey", ""); });
document.getElementById("back-this")!.addEventListener("click", () => { void submitFlag("back", ""); });

/** The one line the app puts in the conversation, so the loop starts in the same chat. */
function requestLine(f: FlagWritten, title: string): string {
  if (f.research === "survey") {
    return `Survey flag #${f.id} in "${title}": "${f.anchor}".`
      + (f.note ? ` My note: ${f.note}.` : "")
      + ` Research the span first: log the searches, capture the sources, record the survey with its coverage bounds and notable results, mint the atoms. Then propose the claims the survey supports, scoped to the span, and stop for my ruling.`;
  }
  const opposite = f.research === "opposite";
  return `Back flag #${f.id} in "${title}"${opposite ? " (opposite requested)" : ""}: "${f.anchor}".`
    + (f.note ? ` My note: ${f.note}.` : "")
    + ` Propose the claims first and stop for my ruling. After I rule, back each accepted observation and bind the passage`
    + (opposite ? `, and state the strongest case against before I stand on anything.` : `.`);
}

async function submitFlag(research: Research, note: string): Promise<void> {
  const sel = pending;
  const slug = doc?.narrative ?? slugIn(current);
  if (!sel || !isNarrative(current)) { hideSelection(); return; }
  const title = doc?.title ?? current?.title ?? slug;
  hideSelection();
  // the server checks the anchor against the file, so words just typed have to be on disk first
  if (ed && !editorEl.hidden && ed.isDirty()) await saveNow(ed.getText());
  setStatus("flagging…", "working");
  try {
    const { data, text } = await call<FlagWritten>("erf_flag", { narrative: slug, anchor: sel.anchor, research, ...(note ? { note } : {}) });
    if (!data) { setStatus(text.replace(/^\[[^\]]*\]\s*/, "").slice(0, 160)); return; }
    const status = await refreshMarks();
    setStatus("");
    notice(`flagged #${data.id} · ${research}`, 5);
    const asked = research === "mint" ? "propose the claims and stop for a ruling"
      : research === "survey" ? "survey it: research the span first, record the survey, then propose the claims it supports"
      : research === "back" ? "back it: after the ruling, gather the evidence and bind"
      : "back it and state the strongest case against before standing";
    try {
      await app.updateModelContext({ content: [{ type: "text", text: `The user flagged a passage of "${title}" (flag #${data.id} at "${data.anchor}") and asked you to ${asked}.${note ? ` Their note: ${note}.` : ""} They have the narrative open in the editor, so answer in text and do not call erf_view to re-open it.` }] });
    } catch { /* a host without model context: the flag stands, the conversation did not learn of it */ }
    if (research !== "mint") {
      try {
        const r = await app.sendMessage({ role: "user", content: [{ type: "text", text: requestLine(data, title) }] });
        if ((r as { isError?: boolean }).isError) notice("the host declined to send the request; ask in chat", 8);
      } catch { notice("could not send the request; ask in chat", 8); }
      startPolling();
    }
    if (status) schedulePolling(status.flags);
  } catch (e) {
    setStatus(`could not flag: ${String(e)}`);
  }
}

// ---- watching for the answer ----------------------------------------------
// The app never pushes a record. While a flag asking for research is open it
// polls, which is a local read of files this machine owns: every three seconds
// for a quarter of an hour, then every half minute, and it stops the moment no
// such flag is open.

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollSince = 0;
const FAST_MS = 3000, SLOW_MS = 30000, FAST_FOR_MS = 15 * 60 * 1000;
/** Flags seen open last time round, to tell a resolution from a flag that was never open. */
let watching = new Map<number, string>();

const researching = (flags: FlagMark[]): FlagMark[] => flags.filter((f) => f.status === "open" && f.research && f.research !== "mint");
/** The queue is shared, so the line says who is on a flag when someone has taken it. */
const researchingLine = (open: FlagMark[]): string =>
  `researching ${open.map((f) => `#${f.id}${f.taken_by ? ` (taken by ${f.taken_by})` : ""}`).join(", ")}`;

function startPolling(): void {
  if (!pollSince) pollSince = Date.now();
  if (!pollTimer) pollTimer = setTimeout(() => void pollOnce(), FAST_MS);
}
function stopPolling(): void {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null; pollSince = 0; watching = new Map();
  if (steady.startsWith("researching")) setStatus("");
}
/** Start or stop watching, from a set of flags we already have in hand. */
function schedulePolling(flags: FlagMark[]): void {
  const open = researching(flags);
  for (const f of open) if (!watching.has(f.id)) watching.set(f.id, f.research ?? "back");
  if (open.length) { setStatus(researchingLine(open), "working"); startPolling(); }
  else if (!pollTimer) stopPolling();
}

async function pollOnce(): Promise<void> {
  pollTimer = null;
  if (!doc || !ed || editorEl.hidden) { stopPolling(); return; }
  const mine = epoch;
  let data: NarrativeStatus | null = null;
  try { data = (await call<NarrativeStatus>("erf_narrative_status", { narrative: doc.narrative })).data; } catch { /* the next tick tries again */ }
  if (!doc || !ed) return;
  if (mine !== epoch) { again(); return; }  // a write landed while this was in flight
  if (!data) { again(); return; }

  // a flag we were watching has been resolved: say what it was bound to
  for (const [id] of watching) {
    const f = data.flags.find((x) => x.id === id);
    if (f && f.status === "done") {
      watching.delete(id);
      notice(`#${id}: bound to ${f.claims?.length ?? 0} claim${f.claims?.length === 1 ? "" : "s"}`);
    }
  }

  if (data.digest !== doc.digest) {
    // a write already in flight will meet the same change and reconcile for itself
    if (ed.isDirty()) { if (!writing) await reconcile(); }
    else { doc.digest = data.digest; const slug = doc.narrative; doc = null; await mountEditor(slug); return; }
  } else {
    reportMissing(ed.setMarks({ flags: data.flags, bindings: data.bindings }));
  }

  const open = researching(data.flags);
  if (!open.length) { stopPolling(); return; }
  setStatus(researchingLine(open), "working");
  again();
}
function again(): void {
  const slow = pollSince > 0 && Date.now() - pollSince > FAST_FOR_MS;
  pollTimer = setTimeout(() => void pollOnce(), slow ? SLOW_MS : FAST_MS);
}

// ---- browsing --------------------------------------------------------------

/** The viewer's file names map onto erf_view pages one for one. */
function pageFromHref(href: string): string | null {
  const h = href.split("#")[0] ?? "";
  if (h === "index.html" || h === "") return "index";
  if (h === "sources.html") return "sources";
  if (h === "health.html") return "health";
  const m = /^(claim|atom|survey|capture|narrative)-(.*)\.html$/.exec(h);
  return m ? `${m[1]}:${decodeURIComponent(m[2]!)}` : null;
}

/** In-card navigation is never silent: the LLM is told what the user is now looking at. */
async function tellModel(p: Page): Promise<void> {
  try {
    await app.updateModelContext({ content: [{ type: "text", text: `The user navigated the ERF viewer to ${p.page} ("${p.title}")${p.corpus ? ` in corpus ${p.corpus}` : ""}. Answer questions about it from erf_record_read; do not re-open it unless asked.` }] });
  } catch { /* a host without model context: the view still changed, the conversation did not learn of it */ }
}

function fromResult(r: unknown): Page | null {
  const x = r as { structuredContent?: Page; result?: { structuredContent?: Page }; isError?: boolean; content?: { type: string; text?: string }[] };
  const sc = x?.structuredContent ?? x?.result?.structuredContent;
  if (sc && typeof sc.html === "string") return sc;
  const t = x?.content?.find((c) => c.type === "text")?.text;
  if (t) return { page: "error", title: "erf", html: `<p class="gap">${escapeHtml(t)}</p>` };
  return null;
}

async function open(page: string): Promise<void> {
  setStatus("…", "working");
  try {
    const r = await app.callServerTool({ name: "erf_view", arguments: { page, ...(current?.corpus ? { corpus: current.corpus } : {}) } });
    const p = fromResult(r);
    if (p) { setStatus(""); show(p); void tellModel(p); } else setStatus("no page in the result");
  } catch (e) {
    setStatus(`could not open ${page}: ${String(e)}`);
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
  const c = ctx as { theme?: string; displayMode?: typeof mode };
  if (c.theme) document.documentElement.dataset["theme"] = c.theme;
  if (c.displayMode) applyMode(c.displayMode);
};

const toggle = async () => {
  const want = mode === "fullscreen" ? "inline" : "fullscreen";
  try { const r = await app.requestDisplayMode({ mode: want }); const got = (r as { mode?: typeof mode }).mode; if (got) applyMode(got); }
  catch (e) { setStatus(`display mode: ${String(e)}`); }
};
toggleBtn.addEventListener("click", () => void toggle());
// the page a chat holds is the server's answer at the time; ↻ asks again
document.getElementById("refresh")!.addEventListener("click", () => {
  if (!current) return;
  if (doc && !editorEl.hidden) { const slug = doc.narrative; doc = null; void mountEditor(slug); return; }
  void open(current.page);
});

applyMode("inline");
await app.connect();
const ctx = app.getHostContext() as { theme?: string; displayMode?: typeof mode } | undefined;
if (ctx?.theme) document.documentElement.dataset["theme"] = ctx.theme;
if (ctx?.displayMode) applyMode(ctx.displayMode);
