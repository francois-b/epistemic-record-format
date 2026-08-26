#!/usr/bin/env -S npx tsx
/**
 * The reference implementation as a validator on the command line.
 *
 *     npx tsx viewer/erf-check.ts <corpus-dir>
 *
 * VIOLATION lines are conformance findings; FLAG lines are the computed
 * flags the health page shows; QUOTE lines are the quote check per atom.
 * Exit 1 on any violation. Same code as the viewer, no separate logic.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadCorpus } from "./corpus.ts";
import { quoteCheck, brokenAnchors, evidenceRefsFlagged, retiredPremises, standingTies, undatedRetrievals, danglingRefs, unbacked, stoodOn, bindingStaleness, staleAudits, staleEvidenceAudit } from "./compute.ts";

const dir = process.argv[2];
if (!dir) { console.error("usage: erf-check <corpus-dir>"); process.exit(2); }
const c = loadCorpus(dir);
let violations = 0;
for (const f of [...c.findings, ...danglingRefs(c)]) { violations++; console.log(`VIOLATION\t${f.record}\t${f.field}\t${f.detail}`); }
for (const a of c.atoms.values()) {
  const s = c.sources.get(a.source);
  const p = s?.normalized ? join(dir, s.normalized) : null;
  const r = quoteCheck(a, p && existsSync(p) ? readFileSync(p, "utf8") : null);
  if (r.state === "fail") { violations++; console.log(`VIOLATION\t${a.id}\tquote\t${r.detail} (ERF-50, ERF-52)`); }
  else if (r.state === "uncheckable") console.log(`UNCHECKABLE\t${a.id}\tquote\t${r.detail}`);
}
for (const x of brokenAnchors(c)) console.log(`FLAG\tERF-31\t${x}`);
for (const x of evidenceRefsFlagged(c)) console.log(`FLAG\tERF-35\t${x}`);
for (const x of retiredPremises(c)) console.log(`FLAG\tERF-43\t${x}`);
for (const x of standingTies(c)) console.log(`FLAG\tERF-41\t${x}`);
for (const x of undatedRetrievals(c)) console.log(`FLAG\tERF-2\t${x}`);
for (const cl of c.claims.values()) if (unbacked(cl, c)) console.log(`FLAG\tunbacked\t${cl.id}: ${stoodOn(cl) ? "stood on with no evidence" : "unsearched proposal"}`);
// `ERF-47` staleness, all three kinds. Binding staleness was computed by the
// viewer and never printed here until the Bitter Lesson trial (2026-08-26)
// moved a claim under a binding and saw nothing.
for (const a of c.atoms.values()) if (staleAudits(a)) console.log(`FLAG\tERF-47\t${a.id}: a finding_audit is older than last_modified`);
for (const cl of c.claims.values()) if (staleEvidenceAudit(cl, c)) console.log(`FLAG\tERF-47\t${cl.id}: an evidence_audit is older than last_modified`);
for (const n of c.narratives) for (const b of n.bindings) {
  const st = bindingStaleness(b.boundAt, b.claims, c);
  if (st.state === "stale") console.log(`FLAG\tERF-47\t${n.slug} binding "${b.anchor}": ${st.why}`);
  else if (st.state === "indeterminate") console.log(`FLAG\tERF-32\t${n.slug} binding "${b.anchor}": ${st.why}`);
}
for (const u of c.unrecognized) console.log(`UNRECOGNIZED\t${u.path}\t${u.type ?? "no type"}`);
if (c.newerMinor) for (const f of c.newerMinor.fields) console.log(`NEWER-MINOR\t${f.record}\t${f.field}`);
// The Validator class: name what is not checked. Each entry is a requirement
// a validator might be expected to decide and this one does not, with why.
const NOT_CHECKED: [string, string][] = [
  ["ERF-36", "id uniqueness across a deployment; run over one corpus, so partial"],
  ["ERF-40", "standing ledger append-only; needs the substrate's history, which a corpus does not hold"],
  ["ERF-2", "whether a raw file's location is mutable; a judgment, not a property of the record"],
  ["ERF-48", "last_modified later than any prior value; needs history, only later-than-created is checked"],
  ["ERF-69", "whether an excerpt carries enough adjacent text; a judgment"],
  ["ERF-70", "whether the named extraction tool is deterministic; a property of the tool"],
];
for (const [id, why] of NOT_CHECKED) console.log(`NOT-CHECKED\t${id}\t${why}`);
console.log(`\n${c.atoms.size} atoms, ${c.claims.size} claims, ${c.surveys.size} surveys, ${c.sources.size} sources, ${c.narratives.length} narratives: ${violations} violation(s)`);
process.exit(violations ? 1 : 0);
