/**
 * The tools, as plain functions over a Corpus. `index.ts` wraps them for
 * MCP; the tests call them directly. Every derived reading comes from the
 * reference validator; this file decides only what to write and what to
 * refuse.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  Refusal, type Corpus, readDeclaration, readSourceList, load, writeRecord, writeYamlDocument,
  readRecordFile, recordFiles, nextAtomId, idInUse, today, now, appendLog, readLog,
  declarationPath, sourceListPath, commit, frontmatter,
} from "./corpus.ts";
import { captureUrl, capturePath } from "./capture.ts";
import { renderSite } from "../../viewer/erf-view.ts";
import { renderIndex, renderSources, renderHealth, renderNarrative, renderClaim, renderAtom, renderCapture, renderSurvey, setSiteLinks } from "../../viewer/render.ts";
import { splitDocument } from "@epistemic-record-format/yaml-markdown";
import {
  quoteCheck, normalizeForCheck, disposition, unbacked, stoodOn, danglingRefs, brokenAnchors,
  bindingStaleness, findWholeWords, claimsUsingAtom,
} from "@epistemic-record-format/yaml-markdown";
import type { Atom, Claim } from "@epistemic-record-format/yaml-markdown";
import type { Source } from "../../../schema/erf.generated.ts";

export interface Result { text: string; wrote?: string[] }

const KINDS = ["observation", "argument", "bet", "commitment"] as const;
const STANCES = ["for", "against", "withdrawn"] as const;
const RELATIONS = ["supports", "assumes", "decomposes-into", "conflicts-with"] as const;
const QUALITIES = ["high", "medium", "low"] as const;

function finish(c: Corpus, text: string, wrote: string[], message: string): Result {
  const sha = commit(c, wrote, message);
  const rel = wrote.map((p) => relative(c.dir, p));
  return { text: `${text}\nwrote: ${rel.join(", ")}${sha ? `\ncommitted ${sha}` : ""}`, wrote: rel };
}

// ---------- corpus ----------

export function corpusInit(c: Corpus, a: { id: string; title: string; owner: string; classification?: string }): Result {
  if (existsSync(declarationPath(c))) throw new Refusal("a corpus declaration already exists here (ERF-54: exactly one)");
  if (!/^human:/.test(a.owner)) throw new Refusal("owner must be a human actor (`human:<name>`); standings are taken by a person");
  writeYamlDocument(declarationPath(c), { type: "corpus", id: a.id, title: a.title, spec_version: "0.9.0", classification: a.classification ?? "internal", owner: a.owner });
  if (!existsSync(sourceListPath(c))) writeFileSync(sourceListPath(c), "type: sources\nsources: {}\n", "utf8");
  return finish(c, `corpus ${a.id} declared; owner ${a.owner}`, [declarationPath(c), sourceListPath(c)], `declare corpus ${a.id}`);
}

export function corpusCheck(c: Corpus): Result {
  readDeclaration(c);
  const l = load(c);
  const findings = [...l.findings, ...danglingRefs(l)];
  const lines: string[] = [];
  const src = readSourceList(c);
  // quote check per atom, against the held normalized text
  let pass = 0, fail = 0, uncheckable = 0;
  const failed: string[] = [];
  for (const a of l.atoms.values()) {
    const s = src[a.source];
    const text = s?.normalized && existsSync(join(c.dir, s.normalized)) ? readFileSync(join(c.dir, s.normalized), "utf8") : null;
    const q = quoteCheck(a, text);
    if (q.state === "pass") pass++; else if (q.state === "fail") { fail++; failed.push(`${a.id}: ${q.detail}`); } else uncheckable++;
  }
  const disp: Record<string, number> = {};
  const unbackedIds: string[] = [], stoodUnbacked: string[] = [];
  for (const cl of l.claims.values()) {
    const d = disposition(cl).disposition; disp[d] = (disp[d] ?? 0) + 1;
    if (unbacked(cl, l)) { unbackedIds.push(cl.id); if (stoodOn(cl)) stoodUnbacked.push(cl.id); }
  }
  const cited = new Set([...l.atoms.values()].map((a) => a.source));
  const uncited = Object.keys(src).filter((k) => !cited.has(k));
  lines.push(`${l.atoms.size} atoms, ${l.claims.size} claims, ${l.surveys.size} surveys, ${Object.keys(src).length} sources, ${l.narratives.length} narratives`);
  lines.push(`violations: ${findings.length}` + (findings.length ? "\n  " + findings.map((f) => `${f.record}.${f.field}: ${f.detail}`).join("\n  ") : ""));
  lines.push(`quote check: ${pass} present, ${fail} absent, ${uncheckable} uncheckable` + (failed.length ? "\n  " + failed.join("\n  ") : ""));
  lines.push(`dispositions: ${Object.entries(disp).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}`);
  if (unbackedIds.length) lines.push(`unbacked claims: ${unbackedIds.join(", ")}`);
  if (stoodUnbacked.length) lines.push(`stood on without backing (flag): ${stoodUnbacked.join(", ")}`);
  if (uncited.length) lines.push(`captured, uncited sources: ${uncited.join(", ")}`);
  const anchors = brokenAnchors(l); if (anchors.length) lines.push(`broken anchors (flag): ${anchors.join("; ")}`);
  if (l.unrecognized.length) lines.push(`unrecognized files: ${l.unrecognized.map((u) => u.path).join(", ")}`);
  return { text: lines.join("\n") };
}

// ---------- sources ----------

export async function sourceAdd(c: Corpus, a: { id: string; citation_text: string; url?: string; path?: string; licence?: string; licence_name?: string; not_redistributable?: boolean }): Promise<Result> {
  readDeclaration(c);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id)) throw new Refusal("source id must be a lowercase slug");
  const sources = readSourceList(c);
  if (sources[a.id]) throw new Refusal(`source ${a.id} is already registered`);
  if (!a.url && !a.path) throw new Refusal("give a url (with fetching on) or a path to a file inside the corpus");
  if (/https?:\/\//.test(a.citation_text)) throw new Refusal("citation_text names the work and never carries a URL; the URL goes in received.url (ERF-7)");
  const cap = a.url ? await captureUrl(c, a.id, a.url) : capturePath(c, a.id, a.path!);
  const status = a.not_redistributable ? "not-redistributable" : a.licence ? "shipped" : "licence-unverified";
  const entry: Source = {
    citation_text: a.citation_text,
    received: { ...(a.url ? { url: a.url } : {}), path: cap.rawPath, digest: cap.rawDigest, timestamp: today() },
    status,
    ...(status === "not-redistributable" ? { reason: "the holder states the work may not be redistributed; the text is held for checking only" } : {}),
    ...(status === "licence-unverified" ? { reason: "no licence was given at capture; the normalized text is held for checking and not shipped" } : {}),
    normalized: cap.normalizedPath,
    normalized_digest: cap.normalizedDigest,
    ...(a.licence ? { licence: a.licence } : {}),
    ...(a.licence_name ? { licence_name: a.licence_name } : {}),
    ...(cap.extraction ? { extraction: cap.extraction } : {}),
    normalization: cap.normalization,
  } as Source;
  sources[a.id] = entry;
  writeYamlDocument(sourceListPath(c), { type: "sources", sources });
  appendLog(c, { kind: "fetch", tool: a.url ? "erf_source_add(url)" : "erf_source_add(path)", url: a.url, path: a.path, source: a.id });
  const wrote = [sourceListPath(c), join(c.dir, cap.rawPath), join(c.dir, cap.normalizedPath)];
  return finish(c, `source ${a.id} registered: ${cap.bytes} bytes held (${cap.rawDigest.slice(0, 19)}…), normalized ${cap.normalizedPath}${cap.title ? `, title "${cap.title}"` : ""}; status ${status}`, wrote, `register source ${a.id}`);
}

export function searchLog(c: Corpus, a: { tool: string; query: string; hits_reported: string; scope?: string; for?: string }): Result {
  if (!a.query.trim()) throw new Refusal("a search act needs its query");
  if (!a.hits_reported.trim()) throw new Refusal("record the hits as the instrument reported them, even if that is \"not recorded\" (ERF-27)");
  if (!a.for?.trim()) throw new Refusal("say what the search was for: a claim id or a short topic. A survey compiles only the acts that were looking for its question; an act with no `for` can back nothing");
  const e = appendLog(c, { kind: "search", tool: a.tool, query: a.query, hits_reported: a.hits_reported, scope: a.scope, for: a.for.trim() });
  return { text: `logged search at ${e.ts} for ${a.for.trim()}: ${a.tool} · "${a.query}" · ${a.hits_reported}` };
}

// ---------- atoms ----------

function nearestPassage(hay: string, quote: string): string {
  const h = normalizeForCheck(hay), q = normalizeForCheck(quote);
  const words = q.split(/\s+/).filter(Boolean);
  for (let n = Math.min(6, words.length); n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const probe = words.slice(i, i + n).join(" ");
      const at = findWholeWords(h, probe, 0);
      if (at >= 0) return h.slice(Math.max(0, at - 80), Math.min(h.length, at + probe.length + 160)).replace(/\s+/g, " ").trim();
    }
  }
  return "(no overlapping run of words found)";
}

export function atomMint(c: Corpus, a: { source: string; quote: string; finding: string; source_quality: string; as_of_date?: string; limitations?: string }): Result {
  const decl = readDeclaration(c);
  const sources = readSourceList(c);
  const src = sources[a.source];
  if (!src) throw new Refusal(`source ${a.source} is not registered; capture it with erf_source_add first (ERF-35)`);
  if (!src.normalized || !existsSync(join(c.dir, src.normalized))) throw new Refusal(`source ${a.source} has no held normalized text, so a quote cannot be checked at mint (ERF-50)`);
  if (!(QUALITIES as readonly string[]).includes(a.source_quality)) throw new Refusal(`source_quality is one of ${QUALITIES.join(", ")}`);
  if (a.as_of_date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(a.as_of_date)) throw new Refusal("as_of_date is a date at the source's own precision: YYYY, YYYY-MM or YYYY-MM-DD (ERF-14)");
  if (!a.quote.trim() || !a.finding.trim()) throw new Refusal("an atom needs a verbatim quote and a finding");
  const text = readFileSync(join(c.dir, src.normalized), "utf8");
  const id = nextAtomId(c, decl);
  const atom: Atom = { id, type: "atom", corpus: String(decl.id), finding: a.finding, quote: a.quote, source: a.source, source_quality: a.source_quality as Atom["source_quality"], created: { timestamp: today(), by: c.options.agent }, finding_audit: [] };
  const q = quoteCheck(atom, text);
  if (q.state !== "pass") throw new Refusal(`quote not found in the normalized text of ${a.source} (ERF-50): ${q.detail}\nnearest passage: "${nearestPassage(text, a.quote)}"`);
  const fm = { id, type: "atom", corpus: decl.id, finding: a.finding, quote: a.quote, source: a.source, source_quality: a.source_quality, as_of_date: a.as_of_date, limitations: a.limitations, created: { timestamp: today(), by: c.options.agent } };
  const path = writeRecord(c, "atom", id, fm, null);
  const where = src.received?.url ? `\nsource page: ${src.received.url}` : src.received?.path ? `\nsource file: ${src.received.path}` : "";
  return finish(c, `atom ${id} minted; quote check: present\ncites ${a.source}: ${src.citation_text}${where}\nsee the quote in the held text: erf_view page=capture:${id}`, [path], `mint atom ${id}`);
}

// ---------- claims ----------

function checkRefs(c: Corpus, a: { atoms_for?: string[]; atoms_against?: string[]; surveys?: string[]; edges?: { to: string; relation: string }[] }, selfId: string): void {
  const atoms = recordFiles(c, "atom"), claims = recordFiles(c, "claim"), surveys = recordFiles(c, "survey");
  for (const id of [...(a.atoms_for ?? []), ...(a.atoms_against ?? [])]) if (!atoms.has(id)) throw new Refusal(`atom ${id} does not exist (ERF-35)`);
  for (const id of a.surveys ?? []) if (!surveys.has(id)) throw new Refusal(`survey ${id} does not exist (ERF-35)`);
  for (const e of a.edges ?? []) {
    if (!(RELATIONS as readonly string[]).includes(e.relation)) throw new Refusal(`relation is one of ${RELATIONS.join(", ")}`);
    if (e.to === selfId) throw new Refusal("a claim cannot have an edge to itself (ERF-43)");
    if (!claims.has(e.to)) throw new Refusal(`claim ${e.to} does not exist (ERF-35)`);
  }
}

function claimBody(title: string, notes?: string): string {
  return `${title}\n\n## Working notes\n\n${(notes ?? "").trim() || "(none yet)"}`;
}

export function claimMint(c: Corpus, a: { id: string; title: string; epistemic_kind: string; atoms_for?: string[]; atoms_against?: string[]; surveys?: string[]; edges?: { to: string; relation: string }[]; families?: string[]; notes?: string; short_name?: string }): Result {
  const decl = readDeclaration(c);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id)) throw new Refusal("claim id must be a lowercase slug");
  if (idInUse(c, a.id)) throw new Refusal(`id ${a.id} is already used by a record (ERF-36)`);
  if (!(KINDS as readonly string[]).includes(a.epistemic_kind)) throw new Refusal(`epistemic_kind is one of ${KINDS.join(", ")}`);
  if (!a.title.trim()) throw new Refusal("a claim needs a title that states the claim");
  checkRefs(c, a, a.id);
  const fm = { id: a.id, type: "claim", corpus: decl.id, title: a.title, epistemic_kind: a.epistemic_kind, short_name: a.short_name, families: a.families, created: { timestamp: today(), by: c.options.agent }, atoms_for: a.atoms_for, atoms_against: a.atoms_against, surveys: a.surveys, edges: a.edges };
  const path = writeRecord(c, "claim", a.id, fm, claimBody(a.title, a.notes));
  const l = load(c); const cl = l.claims.get(a.id)!;
  return finish(c, `claim ${a.id} minted · disposition ${disposition(cl).disposition}${unbacked(cl, l) ? " · unbacked" : ""}`, [path], `mint claim ${a.id}`);
}

export function claimUpdate(c: Corpus, a: { id: string; title?: string; atoms_for?: string[]; atoms_against?: string[]; surveys?: string[]; edges?: { to: string; relation: string }[]; families?: string[]; notes?: string }): Result {
  readDeclaration(c);
  const path = recordFiles(c, "claim").get(a.id);
  if (!path) throw new Refusal(`claim ${a.id} does not exist`);
  checkRefs(c, a, a.id);
  const { fm, body } = readRecordFile(path);
  const title = a.title ?? String(fm["title"]);
  for (const k of ["atoms_for", "atoms_against", "surveys", "edges", "families"] as const) if (a[k] !== undefined) fm[k] = a[k];
  fm["title"] = title;
  fm["last_modified"] = { timestamp: now(), by: c.options.agent };
  const notesMatch = /## Working notes\n\n([\s\S]*)$/.exec(body);
  const newBody = claimBody(title, a.notes ?? notesMatch?.[1] ?? "");
  writeFileSync(path, `---\n${frontmatter(fm)}---\n\n${newBody}\n`, "utf8");
  const l = load(c); const cl = l.claims.get(a.id)!;
  const staleBindings = l.narratives.flatMap((n) => n.bindings.filter((b) => b.claims.includes(a.id)).map((b) => `${n.slug} @ "${b.anchor}"`));
  return finish(c, `claim ${a.id} updated · disposition ${disposition(cl).disposition}${unbacked(cl, l) ? " · unbacked" : ""}${staleBindings.length ? `\nnarrative bindings now stale (rebind when done): ${staleBindings.join("; ")}` : ""}`, [path], `update claim ${a.id}`);
}

export function claimStand(c: Corpus, a: { id: string; stance: string; why: string }): Result {
  const decl = readDeclaration(c);
  const owner = String(decl.owner ?? "");
  if (!owner.startsWith("human:")) throw new Refusal("the declaration's owner must be a human actor to take a stance (ERF-21)");
  if (!(STANCES as readonly string[]).includes(a.stance)) throw new Refusal(`stance is one of ${STANCES.join(", ")}`);
  if (!a.why.trim()) throw new Refusal("a standing carries its why; an empty one is refused");
  const path = recordFiles(c, "claim").get(a.id);
  if (!path) throw new Refusal(`claim ${a.id} does not exist`);
  const { fm, body } = readRecordFile(path);
  const standings = Array.isArray(fm["standings"]) ? (fm["standings"] as unknown[]) : [];
  standings.push({ timestamp: now(), stance: a.stance, by: owner, why: a.why });
  fm["standings"] = standings;
  writeFileSync(path, `---\n${frontmatter(fm)}---\n\n${body}\n`, "utf8");
  const l = load(c); const cl = l.claims.get(a.id)!;
  const d = disposition(cl);
  return finish(c, `standing appended by ${owner} · disposition ${d.disposition}${unbacked(cl, l) ? " · stood on without backing (flag)" : ""}`, [path], `stand ${a.stance} on ${a.id}`);
}

// ---------- surveys ----------

export function surveyRecord(c: Corpus, a: { id: string; title: string; coverage_bounds: string; summary?: string; from_log?: string; for?: string; searches?: { tool: string; query: string; hits_reported: string; scope?: string }[]; notable_results?: { what: string; note: string; atoms?: string[] }[]; prior_survey?: string }): Result {
  const decl = readDeclaration(c);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id)) throw new Refusal("survey id must be a lowercase slug; end it with the conducted date (ERF-28)");
  if (idInUse(c, a.id)) throw new Refusal(`id ${a.id} is already used by a record (ERF-36)`);
  let searches = a.searches ?? [];
  if (a.from_log) {
    const day = readLog(c).filter((e) => e.kind === "search" && e.ts.startsWith(a.from_log!));
    const tags = [...new Set(day.map((e) => e.for ?? "(untagged)"))];
    if (!a.for) throw new Refusal(`say what this survey is for (\`for\`); the log for ${a.from_log} holds acts for: ${tags.join(", ") || "nothing"}. A survey compiles only the acts that were looking for its own question`);
    const acts = day.filter((e) => e.for === a.for);
    if (!acts.length) throw new Refusal(`no search act on ${a.from_log} was logged for ${a.for}; acts that day were for: ${tags.join(", ") || "nothing"}. Run and log the searches, then record the survey (ERF-26)`);
    searches = [...searches, ...acts.map((e) => ({ tool: e.tool, query: e.query ?? "", hits_reported: e.hits_reported ?? "not recorded", scope: e.scope, timestamp: e.ts }))];
  }
  if (!searches.length) throw new Refusal("a survey records at least one search act; nothing is in the log for that day and none was given (ERF-26)");
  for (const s of searches) if (!s.tool || !s.query || !s.hits_reported) throw new Refusal("each act needs tool, query and hits_reported as the instrument reported them (ERF-26, ERF-27)");
  const atoms = recordFiles(c, "atom");
  for (const r of a.notable_results ?? []) for (const id of r.atoms ?? []) if (!atoms.has(id)) throw new Refusal(`atom ${id} does not exist (ERF-35)`);
  if (a.prior_survey && !recordFiles(c, "survey").has(a.prior_survey)) throw new Refusal(`prior survey ${a.prior_survey} does not exist`);
  const fm = { id: a.id, type: "survey", corpus: decl.id, title: a.title, conducted: { timestamp: today(), by: c.options.agent }, searches, notable_results: a.notable_results, prior_survey: a.prior_survey };
  const body = `${a.title}${a.summary ? `: ${a.summary.trim()}` : "."}\n\nCoverage bounds: ${a.coverage_bounds.trim()}`;
  const path = writeRecord(c, "survey", a.id, fm, body);
  return finish(c, `survey ${a.id} recorded with ${searches.length} act(s)`, [path], `record survey ${a.id}`);
}

// ---------- narratives ----------

function narrativeFile(c: Corpus, name: string): { path: string; slug: string } {
  const files = recordFiles(c, "narrative");
  for (const [id, p] of files) if (id === name || p.endsWith(`/${name}.md`) || p.endsWith(`/${name}`)) return { path: p, slug: id };
  if (files.size === 1) { const [id, p] = [...files][0]!; return { path: p, slug: id }; }
  throw new Refusal(`no narrative named ${name}; known: ${[...files.keys()].join(", ") || "none"}`);
}

export function narrativeBind(c: Corpus, a: { narrative: string; anchor: string; claims: string[]; replace?: boolean }): Result {
  readDeclaration(c);
  const { path } = narrativeFile(c, a.narrative);
  const known = recordFiles(c, "claim");
  for (const id of a.claims) if (!known.has(id)) throw new Refusal(`claim ${id} does not exist; mint it first (ERF-31)`);
  if (!a.claims.length) throw new Refusal("a binding names at least one claim");
  const raw = readFileSync(path, "utf8");
  const split = splitDocument(raw);
  if (split === null || typeof split === "string") throw new Refusal(`${a.narrative}: ${split ?? "no frontmatter"} (YAMLB-3)`);
  const headLen = raw.length - raw.slice(raw.indexOf("\n---\n") + 5).length; // bytes through the closing fence
  const bodyStart = raw.indexOf(split.body, headLen);
  if (bodyStart < 0) throw new Refusal("could not locate the body in the file");
  const body = split.body;
  // search the prose only: an existing marker quotes its own anchor, which must not count as a second occurrence
  const prose = body.replace(/<!--\s*claims:[\s\S]*?-->/g, (m) => " ".repeat(m.length));
  const first = prose.indexOf(a.anchor);
  if (first < 0) throw new Refusal(`anchor "${a.anchor}" does not occur in the narrative; it must be a few exact words from the passage (ERF-31)`);
  if (prose.indexOf(a.anchor, first + 1) >= 0) throw new Refusal(`anchor "${a.anchor}" occurs more than once; choose words unique to the passage`);
  // the passage ends at the next blank line (or the end of the body)
  const blank = body.indexOf("\n\n", first);
  let end = blank < 0 ? body.length : blank;
  // an existing marker at the end of this passage
  const tail = body.slice(first, end);
  const existing = /\s*<!--\s*claims:[\s\S]*?-->\s*$/.exec(tail);
  if (existing && !a.replace) throw new Refusal("this passage already ends with a binding; pass replace=true to rewrite it");
  const escaped = a.anchor.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const marker = `  <!-- claims: ${a.claims.join(" ")} "${escaped}" bound-at=${now()} -->`;
  const cut = existing ? first + existing.index : end;
  const newBody = body.slice(0, cut).replace(/\s+$/, "") + marker + body.slice(end);
  writeFileSync(path, raw.slice(0, bodyStart) + newBody + raw.slice(bodyStart + body.length), "utf8");
  return finish(c, `bound ${a.claims.length} claim(s) to "${a.anchor}" (bound-at ${now()})`, [path], `bind narrative passage "${a.anchor.slice(0, 40)}"`);
}

export function narrativeCheck(c: Corpus, a: { narrative?: string }): Result {
  readDeclaration(c);
  const l = load(c);
  const targets = a.narrative ? l.narratives.filter((n) => n.slug === narrativeFile(c, a.narrative!).slug) : l.narratives;
  if (!targets.length) return { text: "no narratives in this corpus" };
  const lines: string[] = [];
  for (const n of targets) {
    const findings = l.findings.filter((f) => f.record === n.slug);
    let current = 0, stale = 0, indeterminate = 0; const unresolved: string[] = [], staleList: string[] = [];
    for (const b of n.bindings) {
      for (const id of b.claims) if (!l.claims.has(id)) unresolved.push(id);
      const s = bindingStaleness(b.boundAt, b.claims, l).state;
      if (s === "current") current++; else if (s === "stale") { stale++; staleList.push(`"${b.anchor}"`); } else indeterminate++;
    }
    lines.push(`${n.slug}: ${n.bindings.length} binding(s) · ${current} current · ${stale} stale · ${indeterminate} indeterminate`);
    if (unresolved.length) lines.push(`  unresolved claim ids (ERF-31/33): ${[...new Set(unresolved)].join(", ")}`);
    if (staleList.length) lines.push(`  stale (claim changed after bound-at, ERF-32): ${staleList.join("; ")}`);
    for (const f of findings) lines.push(`  ${f.field}: ${f.detail}`);
  }
  const anchors = brokenAnchors(l); if (anchors.length) lines.push(`broken anchors (flag, ERF-31): ${anchors.join("; ")}`);
  return { text: lines.join("\n") };
}

// ---------- rendering ----------

/** The viewer, run into a folder inside the corpus: what a reader opens in a browser. Derived output, never committed. */
export function renderSiteTool(c: Corpus, a: { out?: string }): Result {
  readDeclaration(c);
  const rel = (a.out ?? "site").replace(/^\/+/, "");
  if (rel.includes("..")) throw new Refusal("out is a folder inside the corpus");
  const outDir = join(c.dir, rel);
  const r = renderSite(c.dir, outDir);
  // derived output: keep it out of the corpus's history
  const gi = join(c.dir, ".gitignore");
  if (existsSync(join(c.dir, ".git"))) {
    const cur = existsSync(gi) ? readFileSync(gi, "utf8") : "";
    const line = rel.replace(/\/+$/, "") + "/";
    if (!cur.split("\n").some((l) => l.trim() === line)) writeFileSync(gi, cur.replace(/\n*$/, "\n") + `\n# rendered by erf_render_site; derived, rebuilt on demand\n${line}\n`, "utf8");
  }
  return { text: `rendered ${r.pages} pages for ${r.corpus} into ${rel}/ (${r.atoms} atoms, ${r.claims} claims, ${r.surveys} surveys${r.findings ? `; ${r.findings} records diverge, see health.html` : ""})\nopen: ${join(outDir, "index.html")}` };
}

/** One viewer page, body only, for the app: `index`, `sources`, `health`, `claim:<id>`, `atom:<id>`, `capture:<id>`, `survey:<id>`, `narrative:<slug>`. */
export interface ViewPage { page: string; title: string; html: string; corpus: string }

export function viewPage(c: Corpus & { id?: string }, a: { page?: string }): ViewPage {
  const decl = readDeclaration(c);
  const l = load(c);
  const src = readSourceList(c);
  const captureText = (atomId: string): string | null => {
    const s = src[l.atoms.get(atomId)?.source ?? ""];
    return s?.normalized && existsSync(join(c.dir, s.normalized)) ? readFileSync(join(c.dir, s.normalized), "utf8") : null;
  };
  setSiteLinks([]);
  let page = (a.page ?? "index").trim();
  // a path inside the corpus (what Finder and Isomorphic show) names the record it holds
  if (/\.md$/i.test(page) || page.includes("/")) {
    const rel = page.replace(/^\.\//, "");
    const abs = join(c.dir, rel);
    const byPath = [...recordFiles(c, "claim"), ...recordFiles(c, "atom"), ...recordFiles(c, "survey"), ...recordFiles(c, "narrative")].find(([, p]) => p === abs || p.endsWith("/" + rel));
    if (!byPath) throw new Refusal(`no record at ${rel}; give a path inside the corpus such as wiki/narrative/opening.md, or a page like claim:<id>`);
    const { fm } = readRecordFile(byPath[1]);
    const type = String(fm["type"]); const id = type === "narrative" ? byPath[1].split("/").pop()!.replace(/\.md$/, "") : String(fm["id"]);
    page = `${type}:${id}`;
  }
  const [kind, id] = page.includes(":") ? [page.slice(0, page.indexOf(":")), page.slice(page.indexOf(":") + 1)] : [page, ""];
  let full: string, title: string;
  switch (kind) {
    case "index": full = renderIndex(l); title = String(decl.title); break;
    case "sources": full = renderSources(l); title = "sources"; break;
    case "health": full = renderHealth(l, captureText); title = "health"; break;
    case "claim": { const cl = l.claims.get(id); if (!cl) throw new Refusal(`no claim ${id}`); full = renderClaim(cl, l); title = cl.title; break; }
    case "atom": { const at = l.atoms.get(id); if (!at) throw new Refusal(`no atom ${id}`); full = renderAtom(at, l, claimsUsingAtom(l).get(id) ?? [], captureText(id)); title = `atom ${id}`; break; }
    case "capture": { const at = l.atoms.get(id); if (!at) throw new Refusal(`no atom ${id}`); full = renderCapture(at, l, captureText(id)); title = `capture for ${id}`; break; }
    case "survey": { const sv = l.surveys.get(id); if (!sv) throw new Refusal(`no survey ${id}`); full = renderSurvey(sv, l); title = sv.title; break; }
    case "narrative": { const n = l.narratives.find((x) => x.slug === id) ?? (id ? undefined : l.narratives[0]); if (!n) throw new Refusal(`no narrative ${id}`); full = renderNarrative(n, l); title = n.title; break; }
    default: throw new Refusal(`unknown page ${page}; use index, sources, health, claim:<id>, atom:<id>, capture:<id>, survey:<id>, narrative:<slug>`);
  }
  const m = /<main>([\s\S]*)<\/main>/.exec(full);
  return { page, title, html: `<main>${m?.[1] ?? full}</main>`, corpus: String(decl.id) };
}

// ---------- reading ----------

/** A source entry and its held normalized text: the whole text when short, else windows around `find`, else the opening. */
export function sourceRead(c: Corpus, a: { id: string; find?: string; window?: number }): Result {
  readDeclaration(c);
  const src = readSourceList(c)[a.id];
  if (!src) throw new Refusal(`no source ${a.id}; known: ${Object.keys(readSourceList(c)).join(", ") || "none"}`);
  const head = `source ${a.id} [${src.status}] ${src.citation_text}` + (src.received?.url ? `\nurl: ${src.received.url}` : "") + (src.normalized ? `\nnormalized: ${src.normalized}` : "");
  if (!src.normalized || !existsSync(join(c.dir, src.normalized))) return { text: `${head}\n(no held text; quotes from this source cannot be checked)` };
  const text = readFileSync(join(c.dir, src.normalized), "utf8");
  const w = Math.min(Math.max(a.window ?? 600, 100), 4000);
  if (a.find) {
    const h = normalizeForCheck(text), q = normalizeForCheck(a.find);
    const hits: string[] = []; let from = 0;
    while (hits.length < 5) { const at = findWholeWords(h, q, from); if (at < 0) break; hits.push(h.slice(Math.max(0, at - w / 2), Math.min(h.length, at + q.length + w / 2)).replace(/\s+/g, " ").trim()); from = at + q.length; }
    return { text: hits.length ? `${head}\n${hits.length} match(es) for "${a.find}" (text shown folded, as the quote check reads it):\n\n` + hits.map((x, i) => `[${i + 1}] …${x}…`).join("\n\n") : `${head}\nno match for "${a.find}" under the fold` };
  }
  const cap = 6000;
  return { text: `${head}\n${text.length} chars held${text.length > cap ? `; first ${cap} shown, use find to see more` : ""}:\n\n${text.slice(0, cap)}` };
}

export function recordRead(c: Corpus, a: { id: string }): Result {
  for (const t of ["claim", "atom", "survey", "narrative"]) {
    const p = recordFiles(c, t).get(a.id);
    if (!p) continue;
    const text = readFileSync(p, "utf8");
    if (t !== "atom") return { text };
    // an atom names its source by id; resolve it, since the reader wants the page, not the key
    const src = readSourceList(c)[String(readRecordFile(p).fm["source"] ?? "")];
    const where = src ? `\n\n# source, resolved\ncitation: ${src.citation_text}${src.received?.url ? `\npage: ${src.received.url}` : ""}${src.received?.path ? `\nheld as received: ${src.received.path}` : ""}${src.normalized ? `\nnormalized text (what the quote check reads): ${src.normalized}` : ""}\nstatus: ${src.status}\nsee the quote in the held text: erf_view page=capture:${a.id}` : "\n\n# source: not registered";
    return { text: text.replace(/\n*$/, "") + where + "\n" };
  }
  if (readSourceList(c)[a.id]) return sourceRead(c, { id: a.id });
  throw new Refusal(`no record with id ${a.id}`);
}

export function recordList(c: Corpus, a: { type?: string }): Result {
  readDeclaration(c);
  const l = load(c);
  const lines: string[] = [];
  const want = a.type ?? "all";
  if (want === "all" || want === "claim") for (const cl of l.claims.values()) lines.push(`claim ${cl.id} [${cl.epistemic_kind}, ${disposition(cl).disposition}${unbacked(cl, l) ? ", unbacked" : ""}] ${cl.title}`);
  if (want === "all" || want === "atom") { const users = claimsUsingAtom(l); for (const at of l.atoms.values()) lines.push(`atom ${at.id} [${at.source}, ${at.source_quality}, cited by ${(users.get(at.id) ?? []).length}] ${at.finding.slice(0, 100)}`); }
  if (want === "all" || want === "survey") for (const s of l.surveys.values()) lines.push(`survey ${s.id} ${s.title}`);
  if (want === "all" || want === "source") for (const [k, s] of Object.entries(readSourceList(c))) lines.push(`source ${k} [${s.status}] ${s.citation_text}`);
  if (want === "all" || want === "narrative") for (const n of l.narratives) lines.push(`narrative ${n.slug} (${n.bindings.length} bindings) ${n.title}`);
  return { text: lines.join("\n") || "(empty)" };
}

export type { Claim };
