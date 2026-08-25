/**
 * HTML rendering. Self-contained output: one shared stylesheet carrying its
 * own embedded faces, no external requests, no scripts. The visual language
 * follows the author's published documents (Literata for prose, Inter for
 * apparatus, DejaVu Sans Mono for identifiers and the epistemic apparatus).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Atom, Claim, Survey } from "../types/erf.ts";
import type { LoadedCorpus, Narrative } from "./corpus.ts";
import { bindingCandidateRe, bindingRe, shipsWithCorpus } from "./corpus.ts";
import {
  backing, bindingStaleness, claimsUsingAtom, conflictsFor, danglingRefs,
  evidenceRefsFlagged, retiredPremises,
  disposition, normalizeForCheck, quoteCheck, resolvable, staleAudits,
  staleEvidenceAudit, unbacked,
} from "./compute.ts";

export const CSS = `
:root { --ink:#1a1a1a; --muted:#5a5550; --mutedlt:#a5a09a; --rule:#d8d3cc;
  --rulelt:#eae6e0; --accent:#1a3a6e; --highlight:#fcf6ec; --codebg:#fefcf8;
  --paper:#ffffff; --warn:#8a4b1e; --good:#1f5c3d;
  --serif:Literata, Georgia, 'Iowan Old Style', serif;
  --sans:Inter, -apple-system, 'Helvetica Neue', sans-serif;
  --mono:'DejaVu Sans Mono', Menlo, ui-monospace, monospace;
  /* The column in absolute terms. An em max-width resolves against the
     element's OWN font-size, so main and footer cannot share one em value:
     the 12px footer would compute narrower than the 16.5px main and sit
     visibly inset. */
  --base:16.5px; --measure:calc(39 * var(--base)); --gutter:calc(1.4 * var(--base)); }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font-size:var(--base);
  font-family:var(--serif); line-height:1.5; -webkit-font-smoothing:antialiased; }
.topbar { font-family:var(--sans); font-size:11.5px; color:var(--muted);
  border-bottom:1px solid var(--rule); padding:7px 20px; background:var(--paper);
  position:sticky; top:0; z-index:2; }
.topbar a { color:var(--muted); margin-right:1.1em; }
.topbar a:hover { color:var(--accent); }
main { max-width:var(--measure); margin:0 auto; padding:2.6em var(--gutter) 4em; }
footer { max-width:var(--measure); margin:0 auto; padding:1.1em var(--gutter) 2.5em;
  color:var(--muted); font-size:12px; border-top:1px solid var(--rulelt);
  font-family:var(--sans); }
a { color:var(--accent); text-decoration:none; }
a:hover { text-decoration:underline; }
h1 { font-size:1.65em; font-weight:700; margin:0 0 .3em; line-height:1.2;
  letter-spacing:-0.01em; }
h2 { font-size:1.34em; font-weight:700; color:var(--accent); margin:2.9em 0 1em;
  padding-top:1.1em; border-top:1px solid var(--rule); letter-spacing:-0.01em; }
h3 { font-family:var(--sans); font-size:.95em; font-weight:700;
  text-transform:uppercase; letter-spacing:.085em; color:var(--ink); margin:2.5em 0 1em; }
.sub { font-family:var(--sans); font-size:.82em; color:var(--muted); margin:0 0 1.8em; }
.id { font-family:var(--mono); font-size:.78em; color:var(--muted); }

/* The epistemic apparatus is set as small mono text, never as bordered
   boxes: a box reads as a control the reader could press, and it competes
   with the claim for the eye. The apparatus should recede and the claim
   should lead, so a disposition and a kind sit on one quiet line under the
   title, colored only where the reading is not the neutral one. */
.tags { font-family:var(--mono); font-size:.735em; color:var(--muted);
  margin:.3em 0 0; line-height:1.55; }
.tags.head { margin:.5em 0 1.7em; }
.sep { color:var(--mutedlt); padding:0 .42em; }
.t { font-family:var(--mono); font-size:.735em; color:var(--muted); }
.t.d-active { color:var(--good); }
.t.d-contested, .t.d-rejected, .t.gap { color:var(--warn); }
.t.d-proposal, .t.d-retired { color:var(--mutedlt); }

/* A claim row is a hit target and a link anchor, so it says so on hover and
   announces itself when a fragment link lands on it. The left border is
   transparent until then, which keeps the resting page free of rules the
   reader has to look past. */
ul.claims { list-style:none; padding-left:0; margin:1.2em 0 0; }
li.claim { padding:.5em .6em .55em .7em; margin-left:-.75em;
  border-left:3px solid transparent; border-radius:2px;
  border-bottom:1px solid var(--rulelt); }
li.claim:hover { background:var(--codebg); }
li.claim:target { background:var(--highlight); border-left-color:var(--rule); }
/* inline-block makes the title atomic for line breaking, so a trailing tag
   cluster wraps as a unit instead of pushing the title's last word down. */
li.claim a.head { color:var(--ink); font-weight:700; display:inline-block;
  max-width:100%; vertical-align:top; }
li.claim a.head:hover { color:var(--accent); }

.because { background:var(--highlight); border-left:2px solid var(--rule);
  padding:.7em 1em; margin:.2em 0 1.6em; font-size:.9em; }
.because b { font-family:var(--sans); font-size:.85em; text-transform:uppercase;
  letter-spacing:.05em; color:var(--muted); display:block; margin-bottom:.3em; }
.warnbox { border-left:2px solid var(--warn); background:#fdf7f2; padding:.7em 1em;
  margin:1.2em 0; font-size:.9em; color:var(--warn); }
.okbox { border-left:2px solid var(--good); background:#f4f9f6; padding:.7em 1em;
  margin:1.2em 0; font-size:.9em; color:var(--good); }
blockquote.q { margin:.6em 0 1.2em; padding:.7em 1em; background:var(--codebg);
  border-left:2px solid var(--accent); font-size:.95em; }
table { border-collapse:collapse; width:100%; font-size:.86em;
  font-family:var(--sans); margin:.6em 0 1.6em; }
th, td { text-align:left; padding:.42em .6em; border-bottom:1px solid var(--rulelt);
  vertical-align:top; }
th { font-weight:700; color:var(--muted); border-bottom:1px solid var(--rule); }
ul.plain { list-style:none; padding-left:0; }
ul.plain li { padding:.4em 0; border-bottom:1px solid var(--rulelt); }
.ledger { font-size:.9em; }
.ledger .row { border-left:2px solid var(--rule); padding:.5em .9em; margin:.5em 0;
  background:var(--codebg); }
.ledger .meta { font-family:var(--mono); font-size:.78em; color:var(--muted); }
.bind { background:var(--highlight); border-bottom:1px dotted var(--accent);
  padding:0 .12em; }
.bindnote { font-family:var(--sans); font-size:.72em; color:var(--muted);
  display:block; margin:.2em 0 1.1em; }
.bind-broken { font-family:var(--mono); font-size:.72em; display:block;
  margin:.2em 0 1.1em; padding:.4em .6em; border-left:3px solid #c0392b;
  background:#fdf0ee; color:#7d2b21; }
mark { background:#fff2b8; padding:0 .1em; }
pre.capture { white-space:pre-wrap; font-family:var(--mono);
  font-size:.78em; line-height:1.6; background:var(--codebg); padding:1em;
  border:1px solid var(--rulelt); overflow-x:auto; }
p { margin:0 0 1em; }
@media (max-width: 560px) { li.claim { margin-left:0; } }
`;

/**
 * The eight faces the pages actually use, base64'd into the stylesheet.
 *
 * An @font-face family beats a same-named installed font, so every device
 * renders the same page and none of them fetches anything: a rendered
 * corpus is a directory a reader can open offline or hand to someone else.
 * Provenance and licences are in `fonts/README.md`.
 */
const FACES: [string, number, string, string][] = [
  ["Literata", 400, "normal", "literata-400.woff2"],
  ["Literata", 400, "italic", "literata-400-italic.woff2"],
  ["Literata", 700, "normal", "literata-700.woff2"],
  ["Inter", 400, "normal", "inter-400.woff2"],
  ["Inter", 400, "italic", "inter-400-italic.woff2"],
  ["Inter", 700, "normal", "inter-700.woff2"],
  ["DejaVu Sans Mono", 400, "normal", "dejavu-sans-mono-400.woff2"],
  ["DejaVu Sans Mono", 400, "italic", "dejavu-sans-mono-400-italic.woff2"],
];

function fontFaceCss(): string {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "fonts");
  return FACES.map(([fam, weight, style, file]) => {
    const b64 = readFileSync(join(dir, file)).toString("base64");
    return `@font-face { font-family:'${fam}'; font-style:${style};`
      + ` font-weight:${weight}; font-display:block;`
      + ` src:url(data:font/woff2;base64,${b64}) format('woff2'); }`;
  }).join("\n");
}

/** The whole stylesheet: embedded faces, then the rules. */
export const stylesheet = (): string => fontFaceCss() + "\n" + CSS;

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function page(title: string, bodyHtml: string, manifestTitle: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="assets/erf.css"></head>
<body>
<nav class="topbar"><a href="index.html">${esc(manifestTitle)}</a><a href="health.html">health</a></nav>
<main>${bodyHtml}</main>
<footer>Rendered by <span class="id">erf-view</span>, the reference consumer for the
Epistemic Record Format. Every reading on these pages is computed from the records at
render time and stored nowhere.</footer>
</body></html>`;
}

/** Turn the small subset of markdown these records use into HTML. */
function md(text: string): string {
  const blocks = text.split(/\n\n+/);
  return blocks.map((b) => {
    const t = b.trim();
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2>${esc(t.slice(3))}</h2>`;
    if (t.startsWith("# ")) return `<h1>${esc(t.slice(2))}</h1>`;
    const inline = esc(t).replace(/`([^`]+)`/g, '<span class="id">$1</span>');
    return `<p>${inline.replace(/\n/g, " ")}</p>`;
  }).join("\n");
}

// --------------------------------------------------------------- index
export function renderIndex(c: LoadedCorpus): string {
  const dispCounts = new Map<string, number>();
  for (const cl of c.claims.values()) {
    const d = disposition(cl).disposition;
    dispCounts.set(d, (dispCounts.get(d) ?? 0) + 1);
  }
  const shipped = [...c.sources.values()].filter((s) => shipsWithCorpus(s)).length;
  const body = `
<h1>${esc(c.manifest.title)}</h1>
<p class="sub">Corpus <span class="id">${esc(c.manifest.id)}</span> &middot;
${c.manifest.classification ? `classification ${esc(c.manifest.classification)} &middot;
` : ""}conforms to ERF ${esc(c.manifest.spec_version)}</p>

<h2>Narratives</h2>
<ul class="plain">${c.narratives.map((n) =>
  `<li><a href="narrative-${esc(n.slug)}.html">${esc(n.title)}</a>
   <span class="id">${n.bindings.length} bindings</span></li>`).join("")}</ul>

<h2>What the corpus holds</h2>
<table><tr><th>Type</th><th>Count</th><th>Notes</th></tr>
<tr><td>Atoms</td><td>${c.atoms.size}</td><td>${
  [...c.atoms.values()].filter((a) => a.finding_audit.length === 0).length} with no audit verdicts</td></tr>
<tr><td>Claims</td><td>${c.claims.size}</td><td>${
  [...dispCounts].map(([d, n]) => `${n} ${d}`).join(", ") || "none"}</td></tr>
<tr><td>Surveys</td><td>${c.surveys.size}</td><td>absence, density, and closed-corpus readings</td></tr>
<tr><td>Sources</td><td>${c.sources.size}</td><td>captures shipped for ${shipped}</td></tr>
</table>

<h2>Claims</h2>
<ul class="claims">${[...c.claims.values()].map((cl) => {
  const d = disposition(cl);
  const b = backing(cl, c);
  return `<li class="claim" id="${esc(cl.id)}"><a class="head" href="claim-${esc(cl.id)}.html">${esc(cl.title)}</a>
  <div class="tags"><span class="t d-${d.disposition}">${d.disposition}</span><span class="sep">&middot;</span><span class="t">${esc(cl.epistemic_kind)}</span>${
    b.presentableAsBacked ? "" : `<span class="sep">&middot;</span><span class="t gap">backing not resolvable</span>`}</div></li>`;
}).join("")}</ul>

<h2>Surveys</h2>
<ul class="plain">${[...c.surveys.values()].map((s) =>
  `<li><a href="survey-${esc(s.id)}.html">${esc(s.title)}</a><br>
   <span class="id">${s.searches.length} search acts &middot; ${s.notable_results.length} notable results</span></li>`).join("")}</ul>


<h2>Atoms</h2>
<ul class="plain">${[...c.atoms.values()].map((a) =>
  `<li><a href="atom-${esc(a.id)}.html"><span class="id">${esc(a.id)}</span></a>
   ${esc(a.finding.slice(0, 150))}${a.finding.length > 150 ? "&hellip;" : ""}</li>`).join("")}</ul>`;
  return page(c.manifest.title, body, c.manifest.title);
}

// ------------------------------------------------------------ narrative
export function renderNarrative(n: Narrative, c: LoadedCorpus): string {
  // Sentinels survive HTML escaping, so marking is applied before md() and
  // turned into real HTML afterwards.
  const OPEN = "@@BIND@@", CLOSE = "@@ENDBIND@@";
  let text = n.body;
  for (const b of n.bindings) {
    if (b.anchor && text.includes(b.anchor)) {
      text = text.replace(b.anchor, OPEN + b.anchor + CLOSE);
    }
  }
  // One grammar, defined once in corpus.ts. Implementing it twice is what
  // let the parser gain `bound-at` while this copy did not, after which every
  // binding stopped matching here and leaked into the page as raw markup.
  //
  // `ERF-31`: recognize, then validate. Replacing on the strict grammar
  // alone would leave a malformed binding in the page as an HTML comment,
  // which is to say invisible, and the claims it names would vanish from
  // the narrative silently. A candidate that fails the grammar is rendered
  // as a broken binding instead.
  const stale = new Map<string, { state: string; why: string }>();
  text = text.replace(bindingCandidateRe(), (whole: string) => {
    const m = bindingRe().exec(whole);
    if (!m) return "@@BADNOTE@@" + whole.replace(/[@]/g, "") + "@@ENDBADNOTE@@";
    const list = (m[1] ?? "").trim().split(/\s+/).filter(Boolean);
    const key = list.join(" ");
    stale.set(key, bindingStaleness(m[3], list, c));
    return "@@NOTE@@" + key + "@@ENDNOTE@@";
  });

  let html = md(text);
  html = html
    .split(OPEN).join('<span class="bind">')
    .split(CLOSE).join("</span>")
    .replace(/@@BADNOTE@@([\s\S]*?)@@ENDBADNOTE@@/g, (_m, raw: string) =>
      '<span class="bind-broken">binding does not match the grammar of '
      + '<span class="id">ERF-31</span>, so the claims it names are not bound: '
      + esc(raw.trim()) + "</span>")
    .replace(/@@NOTE@@([^@]*)@@ENDNOTE@@/g, (_m, ids: string) => {
      const list = ids.trim().split(/\s+/).filter(Boolean);
      // `ERF-33`: an unresolvable binding is reported, never dropped.
      const links = list.map((id) =>
        c.claims.has(id)
          ? '<a href="claim-' + esc(id) + '.html">' + esc(id) + "</a>"
          : '<span class="id">' + esc(id) + " (does not resolve in this corpus)</span>").join(", ");
      const st = stale.get(list.join(" "));
      const note = st && st.state !== "current"
        ? ` &middot; binding ${esc(st.state)}: ${esc(st.why)}`
        : "";
      return '<span class="bindnote">rests on ' + links + note + "</span>";
    });
  const body = `<p class="sub">Narrative &middot; highlighted passages carry a binding to a claim</p>${html}`;
  return page(n.title, body, c.manifest.title);
}

// ---------------------------------------------------------------- claim
export function renderClaim(cl: Claim, c: LoadedCorpus): string {
  const d = disposition(cl);
  const b = backing(cl, c);
  const atomRow = (id: string) => {
    const a = c.atoms.get(id);
    const r = resolvable(id, c);
    return `<tr><td><a href="atom-${esc(id)}.html"><span class="id">${esc(id)}</span></a></td>
      <td>${esc(a?.finding ?? "(not in this corpus)")}</td>
      <td>${a ? esc(a.source_quality) : "&mdash;"}</td>
      <td>${r.ok ? "resolvable" : `<span style="color:var(--warn)">not resolvable</span>`}</td></tr>`;
  };
  const body = `
<h1>${esc(cl.title)}</h1>
<p class="sub"><span class="id">${esc(cl.id)}</span> &middot; claim &middot; ${esc(cl.epistemic_kind)}</p>
<div class="tags head"><span class="t d-${d.disposition}">${d.disposition}</span>${
  cl.families.map((f) => `<span class="sep">&middot;</span><span class="t">${esc(f)}</span>`).join("")}</div>

<div class="because"><b>Why this disposition</b>${esc(d.because)}</div>

${b.presentableAsBacked
  ? `<div class="okbox">Every atom this claim rests on can be opened here.</div>`
  : `<div class="warnbox"><b>Shown as a position, not as backed evidence.</b><br>${esc(b.note)}. The viewer will not present a claim as backed to a reader who cannot open the backing.</div>`}

${unbacked(cl, c) ? `<div class="warnbox">Someone stands on this claim while it carries no evidence of the kind its epistemic kind owes (<span class="id">ERF-49</span>).</div>` : ""}

${cl.atoms_for.length ? `<h3>Evidence for</h3><table><tr><th>Atom</th><th>Finding</th><th>Quality</th><th>Reader</th></tr>${cl.atoms_for.map(atomRow).join("")}</table>` : ""}
${cl.atoms_against.length ? `<h3>Evidence against</h3><table><tr><th>Atom</th><th>Finding</th><th>Quality</th><th>Reader</th></tr>${cl.atoms_against.map(atomRow).join("")}</table>` : ""}
${(cl.surveys?.length ?? 0) ? `<h3>Coverage</h3><ul class="plain">${(cl.surveys ?? []).map((s) => {
  const sv = c.surveys.get(s);
  return `<li><a href="survey-${esc(s)}.html">${esc(sv?.title ?? s)}</a><br>
    <span class="id">${sv?.searches.length ?? 0} search acts</span></li>`;
}).join("")}</ul>` : ""}
${cl.edges.length ? `<h3>Relations</h3><ul class="plain">${cl.edges.map((e) =>
  `<li><span class="id">${esc(e.relation)}</span> &rarr; <a href="claim-${esc(e.to)}.html">${esc(c.claims.get(e.to)?.title ?? e.to)}</a></li>`).join("")}</ul>` : ""}
${(() => {
  // `ERF-44`: the pair is stored once on either side, so the inbound half
  // belongs here too. Rendering only outbound edges showed an incomplete
  // conflict set, and which half a reader saw depended on which claim the
  // author happened to write it on.
  const inbound = conflictsFor(cl.id, c).filter((id) =>
    !cl.edges.some((e) => e.relation === "conflicts-with" && e.to === id));
  return inbound.length
    ? `<h3>Conflicts declared elsewhere</h3><ul class="plain">${inbound.map((id) =>
        `<li><a href="claim-${esc(id)}.html">${esc(c.claims.get(id)?.title ?? id)}</a>
         <span class="id">stored on that claim</span></li>`).join("")}</ul>`
    : "";
})()}
${staleEvidenceAudit(cl) ? `<div class="warnbox">A backing verdict on this claim predates its last change (<span class="id">ERF-47</span>).</div>` : ""}

<h3>Standings</h3>
${cl.standings.length === 0
  ? `<p class="sub">The ledger is empty. Nobody has stood behind this claim or withdrawn from it, which is why it computes to a proposal.</p>`
  : `<div class="ledger">${cl.standings.map((s) =>
      `<div class="row"><div class="meta">${esc(s.timestamp)} &middot; ${esc(s.by)} &middot; ${esc(s.stance)}</div>${esc(s.why)}</div>`).join("")}</div>`}

<h2>The record</h2>
${md(cl.body)}`;
  return page(cl.title, body, c.manifest.title);
}

// ----------------------------------------------------------------- atom
export function renderAtom(a: Atom, c: LoadedCorpus, users: string[]): string {
  const r = resolvable(a.id, c);
  const src = c.sources.get(a.source);
  const body = `
<h1><span class="id">${esc(a.id)}</span></h1>
<p class="sub">Atom &middot; source quality ${esc(a.source_quality)}${a.as_of_date ? ` &middot; as of ${esc(a.as_of_date)}` : ""}</p>

<h3>Finding</h3>
<p>${esc(a.finding)}</p>

<h3>Quote</h3>
<blockquote class="q">${esc(a.quote.trim())}</blockquote>
<p class="sub">${esc(src?.citation_text ?? `(source ${a.source} not in the source list)`)}${src?.received ? ` &middot; <a href="${esc(src.received.url)}">${esc(src.received.url)}</a>` : ""}</p>

${r.ok
  ? `<div class="okbox">The captured copy travels with this corpus. <a href="capture-${esc(a.id)}.html">See the quote in its capture</a>.</div>`
  : `<div class="warnbox"><b>The captured copy is not here.</b><br>${esc(r.why)}<br>The mechanical check cannot run for this reader, so nothing on this page should be read as verified. <a href="capture-${esc(a.id)}.html">What that means</a>.</div>`}

${a.limitations ? `<h3>Limitations</h3><p>${esc(a.limitations.trim())}</p>` : ""}

<h3>Audit</h3>
${a.finding_audit.length === 0
  ? `<div class="warnbox">No verdict has been recorded on this atom. The finding has never been checked against the quote by any auditor.</div>`
  : `<table><tr><th>Auditor</th><th>Verdict</th><th>When</th><th>Protocol</th></tr>${a.finding_audit.map((v) =>
      `<tr><td>${esc(v.auditor)}</td><td>${esc(v.verdict)}</td><td>${esc(v.timestamp)}</td><td><span class="id">${esc(v.protocol)}</span></td></tr>`).join("")}</table>
     <p class="sub">Verdicts under different protocol versions are not comparable as like for like, which is why the protocol travels with each one.</p>`}
${staleAudits(a) ? `<div class="warnbox">A verdict here predates the last change to the atom (<span class="id">ERF-47</span>).</div>` : ""}

<h3>Claims resting on this atom</h3>
${users.length === 0
  ? `<p class="sub">Nothing cites this atom.</p>`
  : `<ul class="plain">${users.map((id) =>
      `<li><a href="claim-${esc(id)}.html">${esc(c.claims.get(id)?.title ?? id)}</a></li>`).join("")}</ul>`}
${src ? `<p class="sub">Capture status: <span class="id">${esc(src.status)}</span></p>` : ""}`;
  return page(a.id, body, c.manifest.title);
}

/**
 * Find the raw span to highlight, in a way that can never mark the wrong text.
 *
 * Two attempts, both of which yield an exact span in the raw capture. First a
 * literal match, which covers most quotes. Then a whitespace-flexible match,
 * which covers the common case where the capture wraps a line in the middle of
 * the quoted sentence. Nothing else is attempted: mapping a fully normalized
 * offset back through sixteen substitutions was tried and marked the wrong
 * span, since the normalized length of a raw prefix is not monotonic enough at
 * the edges to binary-search. When neither attempt lands, the page says so.
 *
 * The check is the authority on whether the quote is present; this only
 * decides whether the page can point at it.
 */
function locateForHighlight(raw: string, seg: string): [number, number] | null {
  const literal = raw.indexOf(seg);
  if (literal >= 0) return [literal, literal + seg.length];

  const flexible = new RegExp(
    seg.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"),
  );
  const m = flexible.exec(raw);
  return m ? [m.index, m.index + m[0].length] : null;
}

// -------------------------------------------------------------- capture
export function renderCapture(a: Atom, c: LoadedCorpus, captureText: string | null): string {
  const chk = quoteCheck(a, captureText);
  const src = c.sources.get(a.source);
  let shown = "";
  let highlightNote = "";
  if (captureText !== null) {
    // The highlight and the check used to disagree by construction: the check
    // compares normalized text, the highlight searched raw text, so a quote
    // passing only after normalization showed a green box and no highlight
    // with no explanation. The search is still on raw text, because only a raw
    // match can mark a span honestly, but a miss is now stated rather than
    // left as a silent absence.
    const seg = (a.quote.split("[...]")[0] ?? "").trim();
    const span = seg ? locateForHighlight(captureText, seg) : null;
    if (span) {
      shown = esc(captureText.slice(0, span[0])) + "<mark>"
        + esc(captureText.slice(span[0], span[1])) + "</mark>"
        + esc(captureText.slice(span[1]));
    } else {
      shown = esc(captureText);
      if (chk.state === "pass") {
        highlightNote = "The check passes on normalized text, but the quote does "
          + "not appear literally in the raw capture, so there is no span to mark. "
          + "The check is the authority here; the highlight is a convenience.";
      }
    }
  }
  const body = `
<h1>Capture for <span class="id">${esc(a.id)}</span></h1>
<p class="sub">${esc(src?.citation_text ?? `(source ${a.source} not in the source list)`)}</p>

${chk.state === "pass" ? `<div class="okbox"><b>Quote check passes.</b><br>${esc(chk.detail)}</div>` : ""}
${chk.state === "fail" ? `<div class="warnbox"><b>Quote check fails.</b><br>${esc(chk.detail)}</div>` : ""}
${chk.state === "uncheckable" ? `<div class="warnbox"><b>The check cannot run here.</b><br>${esc(chk.detail)}${
  src?.reason ? `<br><br>${esc(src.reason)}` : ""}<br><br>This is not a defect in the record. The atom names its source and its locator, and the check runs wherever the captured copy is held. It cannot run in a published copy that may not carry someone else's text, and saying so is this viewer's choice, in preference to quietly showing the claim as backed.</div>` : ""}

<h3>The quote</h3>
<blockquote class="q">${esc(a.quote.trim())}</blockquote>

${highlightNote ? `<p class="sub">${esc(highlightNote)}</p>` : ""}
${captureText !== null
  ? `<h3>The captured copy</h3><pre class="capture">${shown}</pre>`
  : ""}
<p class="sub"><a href="atom-${esc(a.id)}.html">Back to the atom</a></p>`;
  return page(`capture ${a.id}`, body, c.manifest.title);
}

// --------------------------------------------------------------- survey
export function renderSurvey(s: Survey, c: LoadedCorpus): string {
  const body = `
<h1>${esc(s.title)}</h1>
<p class="sub"><span class="id">${esc(s.id)}</span> &middot; survey &middot; conducted ${esc(s.conducted.timestamp)} by <span class="id">${esc(s.conducted.by)}</span></p>

<h3>Search acts</h3>
<table><tr><th>Instrument</th><th>Query</th><th>Scope</th><th>Yield</th></tr>
${s.searches.map((a) => `<tr><td>${esc(a.tool)}</td><td>${esc(a.query)}</td><td>${esc(a.scope ?? "")}</td><td>${esc(a.hits_reported)}</td></tr>`).join("")}
</table>

<h3>Notable results</h3>
${s.notable_results.length === 0
  ? `<p class="sub">None. The search ran and found nothing, which is the finding.</p>`
  : `<ul class="plain">${s.notable_results.map((n) =>
      `<li><b>${esc(n.what)}</b><br>${esc(n.note)}${
        (n.atoms ?? []).length ? `<br>${(n.atoms ?? []).map((a) => `<a href="atom-${esc(a)}.html"><span class="id">${esc(a)}</span></a>`).join(" ")}` : ""}</li>`).join("")}</ul>`}

<h2>The record</h2>
${md(s.body)}`;
  return page(s.title, body, c.manifest.title);
}

// --------------------------------------------------------------- health
export function renderHealth(c: LoadedCorpus, captureText: (id: string) => string | null): string {
  const users = claimsUsingAtom(c);
  const noBacking = [...c.claims.values()].filter((cl) =>
    cl.atoms_for.length === 0 && (cl.surveys?.length ?? 0) === 0);
  const orphanAtoms = [...c.atoms.values()].filter((a) => (users.get(a.id) ?? []).length === 0);
  const unaudited = [...c.atoms.values()].filter((a) => a.finding_audit.length === 0);
  const checks = [...c.atoms.values()].map((a) => ({ a, chk: quoteCheck(a, captureText(a.id)) }));
  const failed = checks.filter((x) => x.chk.state === "fail");
  const uncheckable = checks.filter((x) => x.chk.state === "uncheckable");
  const dangling = danglingRefs(c);
  const staleEvidence = evidenceRefsFlagged(c);

  const list = (items: string[]) => items.length
    ? `<ul class="plain">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : `<p class="sub">None.</p>`;

  const body = `
<h1>Corpus health</h1>
<p class="sub">Every line below is computed from the records at render time. None of it is stored, and none of it is a judgment: these are the questions a validator can answer mechanically.</p>

<h2>Claims carrying no evidence</h2>
${list(noBacking.map((cl) => `<a href="claim-${esc(cl.id)}.html">${esc(cl.title)}</a> <span class="t">${esc(cl.epistemic_kind)}</span>`))}

<h2>Atoms nothing cites</h2>
${list(orphanAtoms.map((a) => `<a href="atom-${esc(a.id)}.html"><span class="id">${esc(a.id)}</span></a> ${esc(a.finding.slice(0, 110))}&hellip;`))}

<h2>Atoms with no recorded verdict</h2>
${list(unaudited.map((a) => `<a href="atom-${esc(a.id)}.html"><span class="id">${esc(a.id)}</span></a> ${esc(a.finding.slice(0, 110))}&hellip;`))}

<h2>Quote checks that fail</h2>
${list(failed.map((x) => `<a href="capture-${esc(x.a.id)}.html"><span class="id">${esc(x.a.id)}</span></a> ${esc(x.chk.detail)}`))}

<h2>Quote checks that cannot run here</h2>
${list(uncheckable.map((x) => `<a href="capture-${esc(x.a.id)}.html"><span class="id">${esc(x.a.id)}</span></a> ${esc(c.sources.get(x.a.source)?.reason ?? x.chk.detail)}`))}

<h2>References that do not resolve</h2>
${list(dangling.map((d) => `<span class="id">${esc(d.record)}</span> <span class="id">${esc(d.field)}</span> ${esc(d.detail)}`))}

<h2>Arguments resting on a premise its holders have withdrawn</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-43</span>: a withdrawal elsewhere creates this with no edit to the argument.</p>
${list(retiredPremises(c).map(esc))}

<h2>Files this consumer did not recognize</h2>
<p class="sub">Reported, not rejected. A tolerant consumer preserves what it cannot interpret and says so; an unrecognized file is not a violation.</p>
${list(c.unrecognized.map((u) => `<span class="id">${esc(u.path)}</span> ${u.type ? `declares <span class="t">${esc(u.type)}</span>, which this consumer does not implement` : "carries no <span class=\"id\">type</span>"}`))}

<h2>Evidence a standing faced that the corpus no longer holds</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-35</span>: a reference recording a past state cannot be made wrong by a later act the format permits.</p>
${list(staleEvidence.map(esc))}

<h2>Narrative bindings whose freshness cannot be told</h2>
${list(c.narratives.flatMap((n) => n.bindings.map((b) => {
  const st = bindingStaleness(b.boundAt, b.claims, c);
  return st.state === "current" ? null
    : `<a href="narrative-${esc(n.slug)}.html">${esc(n.title)}</a>
       <span class="t gap">${esc(st.state)}</span> ${esc(b.claims.join(" "))} &mdash; ${esc(st.why)}`;
}).filter((x): x is string => x !== null)))}

<h2>Records that do not match the normative model</h2>
${c.findings.length === 0
  ? `<p class="sub">None. Every record carries the fields the data model requires.</p>`
  : `<table><tr><th>Record</th><th>Field</th><th>Detail</th></tr>${c.findings.map((f) =>
      `<tr><td><span class="id">${esc(f.record)}</span></td><td><span class="id">${esc(f.field)}</span></td><td>${esc(f.detail)}</td></tr>`).join("")}</table>
     <p class="sub">Most of these are the serialization rule meeting the type: <span class="id">ERF-55</span> requires empty lists to be omitted, while the model types them as always present. A loader materializes them; a reader should know that is happening.</p>`}`;
  return page("Corpus health", body, c.manifest.title);
}
