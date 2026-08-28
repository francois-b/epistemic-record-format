#!/usr/bin/env -S npx tsx
/**
 * erf-view: render an ERF corpus as a static site.
 *
 *     npx tsx erf-view.ts <corpus-dir> -o <out-dir> [--link "Label=href" ...]
 *
 * The reference consumer. It reads only the textual form the specification
 * defines, computes every derived reading at render time, and writes
 * self-contained HTML with no external requests: the stylesheet it writes
 * beside the pages carries its own font faces as data URIs.
 *
 * `--link` adds one entry to every page's topbar, which is how a render
 * dropped under a larger site points back at it. The viewer is told; it
 * never guesses where it was published.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadCorpus } from "@epistemic-record-format/yaml-markdown";
import { claimsUsingAtom } from "@epistemic-record-format/yaml-markdown";
import {
  renderAtom, renderCapture, renderClaim, renderCut, renderHealth, renderIndex,
  renderNarrative, renderSources, renderSurvey, setSiteLinks, stylesheet,
} from "./render.ts";
import { readTrail } from "./trail.ts";
import { buildCutTree, readCuts } from "./cut.ts";

export interface RenderedSite { corpus: string; pages: number; atoms: number; claims: number; surveys: number; cuts: number; findings: number; outDir: string }

/** Render a corpus to a folder of self-contained pages. The library entry; the CLI below wraps it. */
export function renderSite(corpusDir: string, outDir: string, links: { label: string; href: string }[] = [], onPage?: (n: number, total: number) => void): RenderedSite {
  setSiteLinks(links);
  const c = loadCorpus(corpusDir);
  mkdirSync(outDir, { recursive: true });
  // One stylesheet for the whole render, with the faces inside it: inlining
  // 240KB of embedded fonts into every page would multiply by the page count
  // for no gain, and a shared file is still a same-directory read.
  mkdirSync(join(outDir, "assets"), { recursive: true });
  writeFileSync(join(outDir, "assets", "erf.css"), stylesheet(), "utf8");

  const captureText = (atomId: string): string | null => {
    const src = c.sources.get(c.atoms.get(atomId)?.source ?? "");
    // A held capture is checkable regardless of its shipping status (ERF-50).
    if (!src?.normalized) return null;
    const p = join(corpusDir, src.normalized);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  };

  // Cuts are producer machinery beside the records (`cuts/*.yaml`), read
  // here and nowhere in the validator: a corpus without any renders as before.
  const cuts = readCuts(corpusDir);
  const total = 3 + c.narratives.length + cuts.length + c.claims.size + c.surveys.size + c.atoms.size * 2;
  let done = 0;
  const write = (name: string, html: string) => { writeFileSync(join(outDir, name), html, "utf8"); onPage?.(++done, total); };
  const users = claimsUsingAtom(c);
  const trail = readTrail(corpusDir, (id) => c.sources.get(id)?.citation_text);

  write("index.html", renderIndex(c, cuts));
  write("sources.html", renderSources(c));
  write("health.html", renderHealth(c, captureText));
  for (const n of c.narratives) write(`narrative-${n.slug}.html`, renderNarrative(n, c));
  for (const k of cuts) write(`cut-${k.name}.html`, renderCut(buildCutTree(k, c), c));
  for (const cl of c.claims.values()) write(`claim-${cl.id}.html`, renderClaim(cl, c, trail));
  for (const s of c.surveys.values()) write(`survey-${s.id}.html`, renderSurvey(s, c, trail));
  for (const a of c.atoms.values()) {
    const text = captureText(a.id);
    write(`atom-${a.id}.html`, renderAtom(a, c, users.get(a.id) ?? [], text));
    write(`capture-${a.id}.html`, renderCapture(a, c, text));
  }

  return { corpus: String(c.manifest.id), pages: total, atoms: c.atoms.size, claims: c.claims.size, surveys: c.surveys.size, cuts: cuts.length, findings: c.findings.length, outDir };
}

function main(argv: string[]): number {
  const args = argv.slice(2);
  const oi = args.findIndex((a) => a === "-o" || a === "--out");
  const corpusDir = resolve(args[0] ?? "");
  const outDir = resolve(oi >= 0 ? (args[oi + 1] ?? "site") : "site");

  if (!args[0] || !existsSync(join(corpusDir, "corpus.yaml"))) {
    console.error("usage: erf-view <corpus-dir> -o <out-dir> [--link \"Label=href\"]");
    console.error("  <corpus-dir> must contain corpus.yaml");
    return 2;
  }

  const links: { label: string; href: string }[] = [];
  for (const [i, a] of args.entries()) {
    if (a !== "--link") continue;
    const raw = args[i + 1] ?? "";
    const at = raw.indexOf("=");
    if (at <= 0) { console.error(`--link wants "Label=href", got ${JSON.stringify(raw)}`); return 2; }
    links.push({ label: raw.slice(0, at), href: raw.slice(at + 1) });
  }
  const r = renderSite(corpusDir, outDir, links);
  console.log(`${r.corpus}: ${r.pages} pages -> ${outDir}`);
  console.log(`  ${r.atoms} atoms, ${r.claims} claims, ${r.surveys} surveys${r.cuts ? `, ${r.cuts} cut${r.cuts === 1 ? "" : "s"}` : ""}`);
  if (r.findings) console.log(`  ${r.findings} records diverge from the normative model (see health.html)`);
  return 0;
}

const isMain = process.argv[1] && /erf-view(\.ts)?$/.test(process.argv[1]);
if (isMain) process.exit(main(process.argv));
