#!/usr/bin/env -S npx tsx
/**
 * erf-view: render an ERF corpus as a static site.
 *
 *     npx tsx erf-view.ts <corpus-dir> -o <out-dir>
 *
 * The reference consumer. It reads only the textual form the specification
 * defines, computes every derived reading at render time, and writes
 * self-contained HTML with no external requests.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadCorpus } from "./corpus.ts";
import { claimsUsingAtom } from "./compute.ts";
import {
  renderAtom, renderCapture, renderClaim, renderHealth, renderIndex,
  renderNarrative, renderQuestion, renderSurvey,
} from "./render.ts";

function main(argv: string[]): number {
  const args = argv.slice(2);
  const oi = args.findIndex((a) => a === "-o" || a === "--out");
  const corpusDir = resolve(args[0] ?? "");
  const outDir = resolve(oi >= 0 ? (args[oi + 1] ?? "site") : "site");

  if (!args[0] || !existsSync(join(corpusDir, "corpus.yaml"))) {
    console.error("usage: erf-view <corpus-dir> -o <out-dir>");
    console.error("  <corpus-dir> must contain corpus.yaml");
    return 2;
  }

  const c = loadCorpus(corpusDir);
  mkdirSync(outDir, { recursive: true });

  const captureText = (atomId: string): string | null => {
    const cap = c.captures.get(atomId);
    if (!cap || cap.status !== "shipped" || !cap.path) return null;
    const p = join(corpusDir, cap.path);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  };

  const write = (name: string, html: string) => writeFileSync(join(outDir, name), html, "utf8");
  const users = claimsUsingAtom(c);

  write("index.html", renderIndex(c));
  write("health.html", renderHealth(c, captureText));
  for (const n of c.narratives) write(`narrative-${n.slug}.html`, renderNarrative(n, c));
  for (const cl of c.claims.values()) write(`claim-${cl.id}.html`, renderClaim(cl, c));
  for (const q of c.questions.values()) write(`question-${q.id}.html`, renderQuestion(q, c));
  for (const s of c.surveys.values()) write(`survey-${s.id}.html`, renderSurvey(s, c));
  for (const a of c.atoms.values()) {
    write(`atom-${a.id}.html`, renderAtom(a, c, users.get(a.id) ?? []));
    write(`capture-${a.id}.html`, renderCapture(a, c, captureText(a.id)));
  }

  const pages = 2 + c.narratives.length + c.claims.size + c.questions.size
    + c.surveys.size + c.atoms.size * 2;
  console.log(`${c.manifest.id}: ${pages} pages -> ${outDir}`);
  console.log(`  ${c.atoms.size} atoms, ${c.claims.size} claims, ${c.questions.size} questions, ${c.surveys.size} surveys`);
  if (c.findings.length) {
    console.log(`  ${c.findings.length} records diverge from the normative model (see health.html)`);
  }
  return 0;
}

process.exit(main(process.argv));
