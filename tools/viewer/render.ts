/**
 * HTML rendering. Self-contained output: one shared stylesheet carrying its
 * own embedded faces, no external requests, no scripts. The visual language
 * follows the author's published documents (Literata for prose, Inter for
 * apparatus, DejaVu Sans Mono for identifiers and the epistemic apparatus).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Atom, Claim, LoadedCorpus, Narrative, Source, Survey } from "../../validator/yaml-markdown/typescript/corpus.ts";
import { bindingCandidates, bindingRe, shipsWithCorpus } from "../../validator/yaml-markdown/typescript/corpus.ts";
import {
  backing, bindingStaleness, claimsUsingAtom, conflictsFor, danglingRefs,
  brokenAnchors, evidenceRefsFlagged, retiredPremises, standingTies, undatedRetrievals,
  disposition, normalizeForCheck, quoteCheck, resolvable, staleAudits,
  staleEvidenceAudit, stoodOn, unbacked,
} from "../../validator/yaml-markdown/typescript/compute.ts";

export const CSS = `
:root { --ink:#1a1a1a; --muted:#5a5550; --mutedlt:#a5a09a; --rule:#d8d3cc;
  --rulelt:#eae6e0; --accent:#1a3a6e; --highlight:#fcf6ec; --codebg:#fefcf8;
  --paper:#ffffff; --warn:#8a4b1e; --good:#1f5c3d;
  --warnbg:#fdf7f2; --okbg:#f4f9f6; --brokenrule:#c0392b; --brokenbg:#fdf0ee; --brokenink:#7d2b21; --markbg:#fff2b8;
  color-scheme: light;
  --serif:Literata, Georgia, 'Iowan Old Style', serif;
  --sans:Inter, -apple-system, 'Helvetica Neue', sans-serif;
  --mono:'DejaVu Sans Mono', Menlo, ui-monospace, monospace;
  /* The column in absolute terms. An em max-width resolves against the
     element's OWN font-size, so main and footer cannot share one em value:
     the 12px footer would compute narrower than the 16.5px main and sit
     visibly inset. */
  --base:16.5px; --measure:calc(39 * var(--base)); --gutter:calc(1.4 * var(--base)); }
/* Dark: an explicit data-theme wins in both directions; with none set, the system preference decides. */
:root[data-theme="dark"] { --ink:#e6e2dc; --muted:#a9a49d; --mutedlt:#6e6963; --rule:#3b3834;
  --rulelt:#2a2825; --accent:#93b4e6; --highlight:#2b2822; --codebg:#22201e;
  --paper:#161514; --warn:#e3a672; --good:#86cba0;
  --warnbg:#2b2219; --okbg:#1b261f; --brokenrule:#e06b5f; --brokenbg:#2c1c19; --brokenink:#f0a79c; --markbg:#5a4a12;
  color-scheme: dark; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --ink:#e6e2dc; --muted:#a9a49d; --mutedlt:#6e6963; --rule:#3b3834;
    --rulelt:#2a2825; --accent:#93b4e6; --highlight:#2b2822; --codebg:#22201e;
    --paper:#161514; --warn:#e3a672; --good:#86cba0;
    --warnbg:#2b2219; --okbg:#1b261f; --brokenrule:#e06b5f; --brokenbg:#2c1c19; --brokenink:#f0a79c; --markbg:#5a4a12;
    color-scheme: dark; }
}
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
.warnbox { border-left:2px solid var(--warn); background:var(--warnbg); padding:.7em 1em;
  margin:1.2em 0; font-size:.9em; color:var(--warn); }
.okbox { border-left:2px solid var(--good); background:var(--okbg); padding:.7em 1em;
  margin:1.2em 0; font-size:.9em; color:var(--good); }
blockquote.q { margin:.6em 0 1.2em; padding:.7em 1em; background:var(--codebg);
  border-left:2px solid var(--accent); font-size:.95em; }
/* A quote keeps its own paragraph breaks, since ERF-52 makes one part of
   what the quote asserts; the last one needs no trailing space. */
blockquote.q p:last-child { margin-bottom:0; }
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
  margin:.2em 0 1.1em; padding:.4em .6em; border-left:3px solid var(--brokenrule);
  background:var(--brokenbg); color:var(--brokenink); }
mark { background:var(--markbg); color:var(--ink); padding:0 .1em; }
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

/**
 * Links a host site adds to every page's topbar, so a render dropped under a
 * larger site can point back at it. The viewer knows nothing about where it
 * is published, which is why these arrive from the caller rather than being
 * written here; with none set, a render is exactly what it was before.
 */
export interface SiteLink { label: string; href: string }
let siteLinks: SiteLink[] = [];
export function setSiteLinks(links: SiteLink[]): void { siteLinks = links; }

function page(title: string, bodyHtml: string, manifestTitle: string): string {
  const extra = siteLinks
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="assets/erf.css"></head>
<body>
<nav class="topbar"><a href="index.html">${esc(manifestTitle)}</a><a href="sources.html">sources</a><a href="health.html">health</a>${extra}</nav>
<main>${bodyHtml}</main>
<footer>Rendered by <span class="id">erf-view</span>, the reference consumer for the
Epistemic Record Format. Every reading on these pages is computed from the records at
render time and stored nowhere.</footer>
</body></html>`;
}

/**
 * A quote, with its own paragraph breaks kept.
 *
 * `ERF-52` makes a break part of what the quote asserts: a span may not
 * cross a paragraph boundary of the source unless the quote holds the same
 * one, so a quote spanning two paragraphs is making a claim about the
 * source's structure. HTML collapses newlines, so a render that escapes the
 * string and stops shows that quote as one paragraph and loses the
 * distinction the check turns on.
 */
function quoteHtml(quote: string): string {
  return quote.trim().split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim())}</p>`).join("");
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
  // The declaration, read out in full. It is what makes a received corpus
  // self-describing, so a reader should see every field it carries rather
  // than the two the page happened to need. `classification` is an opaque
  // label the format records and never reads.
  const decl = c.manifest as unknown as Record<string, unknown>;
  const declRow = (k: string, v: unknown) =>
    v === undefined || v === null || v === "" ? ""
      : `<tr><td><span class="id">${esc(k)}</span></td><td>${esc(v)}</td></tr>`;
  const body = `
<h1>${esc(c.manifest.title)}</h1>
<p class="sub">Corpus <span class="id">${esc(c.manifest.id)}</span> &middot;
${c.manifest.classification ? `classification ${esc(c.manifest.classification)} &middot;
` : ""}conforms to ERF ${esc(c.manifest.spec_version)}</p>

<h2>The declaration</h2>
<p class="sub">One document per corpus carries <span class="id">type: corpus</span>
(<span class="id">ERF-54</span>). Everything a reader needs to know about the corpus as a
whole is in it, and nothing here is computed.</p>
<table><tr><th>Field</th><th>Value</th></tr>
${["id", "title", "spec_version", "owner", "classification"].map((k) => declRow(k, decl[k])).join("")}
${Object.keys(decl).filter((k) => !["type", "id", "title", "spec_version", "owner", "classification"].includes(k))
  .map((k) => declRow(k, decl[k])).join("")}</table>

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
<tr><td><a href="sources.html">Sources</a></td><td>${c.sources.size}</td><td>${shipped} ship their normalized text; ${c.sources.size - shipped} record why none is held</td></tr>
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
  const corpus = c;
  for (const cand of [...bindingCandidates(text)].reverse()) {
    const m = cand.terminated ? bindingRe().exec(cand.text) : null;
    let repl: string;
    if (!m) {
      repl = "@@BADNOTE@@" + cand.text.replace(/[@]/g, "") + "@@ENDBADNOTE@@";
    } else {
      const list = (m[1] ?? "").trim().split(/\s+/).filter(Boolean);
      const key = list.join(" ");
      stale.set(key, bindingStaleness(m[3], list, corpus));
      repl = "@@NOTE@@" + key + "@@ENDNOTE@@";
    }
    text = text.slice(0, cand.index) + repl + text.slice(cand.end);
  }

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
  // The page carried no heading at all until 2026-08-26, so a reader
  // arriving from a link had the narrative's title only in the browser tab.
  const body = `<h1>${esc(n.title)}</h1>
<p class="sub">Narrative &middot; ${n.bindings.length} narrative binding${n.bindings.length === 1 ? "" : "s"} &middot; highlighted passages carry one</p>${html}`;
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

${unbacked(cl, c) ? (stoodOn(cl)
  ? `<div class="warnbox">Unbacked, and someone stands on it: no evidence of the kind its epistemic kind owes (<span class="id">section 2, unbacked</span>).</div>`
  : `<div class="warnbox">Unbacked and unsearched: neither atoms nor a survey yet (<span class="id">section 2, unbacked</span>).</div>`) : ""}

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
${staleEvidenceAudit(cl, c) ? `<div class="warnbox">A backing verdict on this claim predates its last change (<span class="id">ERF-47</span>).</div>` : ""}

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
export function renderAtom(
  a: Atom, c: LoadedCorpus, users: string[], normalizedText: string | null = null,
): string {
  const r = resolvable(a.id, c);
  const src = c.sources.get(a.source);
  // `ERF-50`: the mechanical check is re-runnable by anyone holding the
  // corpus and its normalized texts, so the atom's own page states its
  // result rather than making a reader open a second page to find out. The
  // three states are distinct and none of them may be shown as another: a
  // check that cannot run is not a check that passed.
  const chk = quoteCheck(a, normalizedText);
  const CHK: Record<string, [string, string]> = {
    pass: ["okbox", "<b>Quote check passes.</b>"],
    fail: ["warnbox", "<b>Quote check fails.</b>"],
    uncheckable: ["warnbox", "<b>The quote check cannot run here.</b>"],
  };
  const [chkClass, chkHead] = CHK[chk.state]!;
  const body = `
<h1><span class="id">${esc(a.id)}</span></h1>
<p class="sub">Atom &middot; source quality ${esc(a.source_quality)}${a.as_of_date ? ` &middot; as of ${esc(a.as_of_date)}` : ""}</p>

<h3>Finding</h3>
<p>${esc(a.finding)}</p>

<h3>Quote</h3>
<blockquote class="q">${quoteHtml(a.quote)}</blockquote>
<p class="sub">${esc(src?.citation_text ?? `(source ${a.source} not in the source list)`)}${src?.received?.url ? ` &middot; <a href="${esc(src.received.url)}">${esc(src.received.url)}</a>` : ""}</p>

<div class="${chkClass}">${chkHead}<br>${esc(chk.detail)}
 &middot; <a href="capture-${esc(a.id)}.html">${chk.state === "uncheckable" ? "What that means" : "See the quote in the source's text"}</a></div>

${r.ok ? "" : `<div class="warnbox"><b>The source's normalized text is not held here.</b><br>${esc(r.why)}<br>Nothing on this page should be read as verified.</div>`}

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

<h3>The source</h3>
${src ? sourceTable(a.source, src) : `<p class="sub">The source list holds no entry for <span class="id">${esc(a.source)}</span>, which is a defect in the corpus (<span class="id">ERF-35</span>).</p>`}`;
  return page(a.id, body, c.manifest.title);
}

/**
 * One source's entry, read out: its identity, its locator, the judgment
 * about whether its text may travel, and the tools that produced that text.
 *
 * `ERF-68` requires a shipped text to name the licence permitting it, and
 * section 5's status vocabulary carries the redistribution judgment either
 * way; a viewer that shows the text and not the basis on which it travels
 * has dropped the half a reader would need to do the same. `ERF-70`'s tool
 * names and `ERF-71`'s digest are what make the excerpt reproducible, so
 * they are shown rather than summarised.
 */
function sourceTable(id: string, s: Source): string {
  const ex = s.excerpt;
  const row = (k: string, v: string) => v ? `<tr><td>${k}</td><td>${v}</td></tr>` : "";
  // `ERF-68`: a shipped text names the licence that permits it, as an SPDX
  // identifier where one exists; a text shipping under no licence at all
  // travels as a short quotation and says so in its status. So an absent
  // licence is a gap on `shipped` and the expected state on
  // `shipped-as-quotation`, and a viewer that showed both the same way
  // would report the format working correctly as a defect.
  const licence = s.licence
    ? `<span class="id">${esc(s.licence)}</span>${s.licence_name ? ` &middot; ${esc(s.licence_name)}` : ""}`
    : s.licence_name
      ? `${esc(s.licence_name)} <span class="t gap">no SPDX identifier named</span>`
      : s.status === "shipped-as-quotation"
        ? `<span class="t">none, and none is expected: the text travels as a short quotation under no licence (ERF-68)</span>`
        : s.status === "shipped"
          ? `<span class="t gap">none named, though the text ships (ERF-68)</span>`
          : "";
  return `<table>
${row("Source id", `<span class="id">${esc(id)}</span>`)}
${row("Citation", esc(s.citation_text))}
${row("Retrieved from", s.received?.url ? `<a href="${esc(s.received.url)}">${esc(s.received.url)}</a>` : "")}
${row("Retrieved on", s.received?.timestamp
    ? esc(s.received.timestamp)
    : s.received?.url ? `<span class="t gap">not recorded (ERF-2)</span>` : "")}
${row("Digest of what arrived", esc(s.received?.digest ?? ""))}
${row("Status", `<span class="id">${esc(s.status)}</span>`)}
${row("Licence", licence)}
${row("Why no text is held", esc(s.reason ?? ""))}
${row("Normalized text", s.normalized ? `<span class="id">${esc(s.normalized)}</span>` : "")}
${row("Digest of that text", esc(s.normalized_digest ?? ""))}
${row("Passage selected by", ex ? `${esc(ex.by)}, ${esc(ex.timestamp)}` : s.normalized ? `<span class="t">held as the whole work, not an excerpt</span>` : "")}
${row("Extracted with", esc(s.extraction ?? ""))}
${row("Normalized with", esc(s.normalization ?? ""))}
</table>`;
}

// -------------------------------------------------------------- sources
/**
 * The source list, whole. A source is not a record and nobody asserts one,
 * but it carries the citation, the locator, the licence judgment and the
 * normalized text: the entire verifiability chain (`ERF-53`). A consumer
 * that never shows it leaves a reader unable to tell a text withheld on a
 * recorded reason from one nobody looked for.
 */
export function renderSources(c: LoadedCorpus): string {
  const byId = new Map<string, string[]>();
  for (const a of c.atoms.values()) byId.set(a.source, [...(byId.get(a.source) ?? []), a.id]);
  const ships = [...c.sources].filter(([, s]) => shipsWithCorpus(s));
  const withheld = [...c.sources].filter(([, s]) => !shipsWithCorpus(s));
  const entry = ([id, s]: [string, Source]) => {
    const atoms = byId.get(id) ?? [];
    return `<li id="${esc(id)}"><b>${esc(s.citation_text)}</b>
<div class="tags"><span class="t">${esc(id)}</span><span class="sep">&middot;</span><span class="t${shipsWithCorpus(s) ? "" : " gap"}">${esc(s.status)}</span><span class="sep">&middot;</span><span class="t">${atoms.length} atom${atoms.length === 1 ? "" : "s"}</span></div>
${sourceTable(id, s)}
${atoms.length
      ? `<p class="sub">Quoted by ${atoms.map((a) => `<a href="atom-${esc(a)}.html"><span class="id">${esc(a)}</span></a>`).join(", ")}</p>`
      : `<p class="sub">No atom quotes this source. It is listed, which is what lets a reader tell a source that was looked at from one that was never found.</p>`}
</li>`;
  };
  const body = `
<h1>Sources</h1>
<p class="sub">${c.sources.size} works. A source is not a record: nobody asserts one, so it
carries no created stamp, no standings and no disposition. What it carries is the citation, the
locator, the licence judgment, and the normalized text every quote against it is checked
against.</p>

<h2>Texts that travel with this corpus (${ships.length})</h2>
<p class="sub"><span class="id">shipped</span> means a licence permits the text to be
republished; <span class="id">shipped-as-quotation</span> means it travels as a short quotation
under none (<span class="id">ERF-68</span>, <span class="id">ERF-69</span>). The mechanical
quote check runs here for every atom quoting one of these.</p>
<ul class="plain">${ships.map(entry).join("")}</ul>

<h2>Texts that do not travel (${withheld.length})</h2>
<p class="sub">Each records a reason rather than being left out, because a validator can tell a
recorded absence from an omission and cannot tell an omission from an oversight
(<span class="id">ERF-35</span>).</p>
<ul class="plain">${withheld.map(entry).join("")}</ul>`;
  return page("Sources", body, c.manifest.title);
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
          + "not appear literally in the held text, so there is no span to mark. "
          + "The check is the authority here; the highlight is a convenience.";
      }
    }
  }
  const body = `
<h1>The source's text, and <span class="id">${esc(a.id)}</span>'s quote inside it</h1>
<p class="sub">${esc(src?.citation_text ?? `(source ${a.source} not in the source list)`)}</p>

${chk.state === "pass" ? `<div class="okbox"><b>Quote check passes.</b><br>${esc(chk.detail)}</div>` : ""}
${chk.state === "fail" ? `<div class="warnbox"><b>Quote check fails.</b><br>${esc(chk.detail)}</div>` : ""}
${chk.state === "uncheckable" ? `<div class="warnbox"><b>The check cannot run here.</b><br>${esc(chk.detail)}${
  src?.reason ? `<br><br>${esc(src.reason)}` : ""}<br><br>This is not a defect in the record. The atom names its source and its locator, and the check runs wherever the source's normalized text is held. It cannot run in a published copy that may not carry someone else's text, and saying so is this viewer's choice, in preference to quietly showing the claim as backed.</div>` : ""}

<h3>The quote</h3>
<blockquote class="q">${quoteHtml(a.quote)}</blockquote>

${highlightNote ? `<p class="sub">${esc(highlightNote)}</p>` : ""}
${captureText !== null
  ? `<h3>The source's normalized text</h3><pre class="capture">${shown}</pre>`
  : ""}
<p class="sub"><a href="atom-${esc(a.id)}.html">Back to the atom</a></p>`;
  return page(`the text behind ${a.id}`, body, c.manifest.title);
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

<h2>Two standings by one person at one instant</h2>
<p class="sub">Flags. <span class="id">ERF-41</span>: the later in the ledger is current, and a person should say which they meant.</p>
${list(standingTies(c).map(esc))}

<h2>Anchors that no longer occur in their passage</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-31</span>: the anchor is folded under <span class="id">ERF-51</span>, same as the quote check, so a hand-wrapped line is not what broke it. Someone edited the prose.</p>
${list(brokenAnchors(c).map(esc))}

<h2>Arguments resting on a premise its holders have withdrawn</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-43</span>: a withdrawal elsewhere creates this with no edit to the argument.</p>
${list(retiredPremises(c).map(esc))}

${c.newerMinor ? `<h2>Content from a newer minor version, preserved</h2>
<p class="sub">The corpus declares <span class="id">${esc(c.newerMinor.declared)}</span>, newer than this consumer knows. <span class="id">ERF-60</span>: unknown fields are expected, reported, and not violations.</p>
${list(c.newerMinor.fields.map((f) => `<span class="id">${esc(f.record)}</span> <span class="id">${esc(f.field)}</span>`))}` : ""}

<h2>Retrievals with no date</h2>
<p class="sub">Flags. <span class="id">ERF-2</span>: a web page differs between fetches, and without <span class="id">received.timestamp</span> nothing says which version was read.</p>
${list(undatedRetrievals(c).map(esc))}

<h2>Files this consumer did not recognize</h2>
<p class="sub">Reported, not rejected. A tolerant consumer preserves what it cannot interpret and says so; an unrecognized file is not a violation.</p>
${list(c.unrecognized.map((u) => `<span class="id">${esc(u.path)}</span> ${u.type ? `declares <span class="t">${esc(u.type)}</span>, which this consumer does not implement` : "carries no <span class=\"id\">type</span>"}`))}

<h2>Evidence a standing faced that the corpus no longer holds</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-35</span>: a reference recording a past state cannot be made wrong by a later act the format permits.</p>
${list(staleEvidence.map(esc))}

<h2>Verdicts older than what they judged</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-47</span>: staleness is computed and
never stored. A <span class="id">finding_audit</span> judged its atom, an
<span class="id">evidence_audit</span> judged the claim and the atoms attached to it, so an
atom edited or attached after the audit makes it stale. Where two stamps differ in precision and
cannot be ordered, the comparison resolves to stale: a check that cannot tell says look, never
rest.</p>
${list([
  ...[...c.atoms.values()].filter((a) => staleAudits(a)).map((a) =>
    `<a href="atom-${esc(a.id)}.html"><span class="id">${esc(a.id)}</span></a> a finding verdict predates the atom's last change`),
  ...[...c.claims.values()].filter((cl) => staleEvidenceAudit(cl, c)).map((cl) =>
    `<a href="claim-${esc(cl.id)}.html">${esc(cl.title)}</a> a backing verdict predates the claim or one of its atoms`),
])}

<h2>Narrative bindings whose freshness cannot be told</h2>
<p class="sub">Flags, not violations. <span class="id">ERF-32</span>: a binding is stale when the
claim it names moved after the binding was made, and <span class="id">indeterminate</span> where
the comparison cannot be run at all. Neither may be shown as current.</p>
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
     <p class="sub">Each is a producer error the data model catches (<span class="id">ERF-73</span>), reported at the field and never a reason to refuse the corpus: a consumer preserves what it does not recognize and says so (<span class="id">ERF-57</span>).</p>`}`;
  return page("Corpus health", body, c.manifest.title);
}
