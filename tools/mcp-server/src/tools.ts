/**
 * The tools, as plain functions over a Corpus. `index.ts` wraps them for
 * MCP; the tests call them directly. Every derived reading comes from the
 * reference validator; this file decides only what to write and what to
 * refuse.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import {
  Refusal, type Corpus, readDeclaration, readSourceList, load, writeRecord, writeYamlDocument,
  readRecordFile, recordFiles, nextAtomId, idInUse, today, now, appendLog, readLog,
  declarationPath, sourceListPath, commit, frontmatter, readFlags, writeFlags, flagsPath, type Flag, type LogEntry,
  RESEARCH, type Research, TAKE_MINUTES, readProposalSets, writeProposalSets, proposalsPath,
} from "./corpus.ts";
import { RULINGS, counts as proposalCounts, allRuled, acceptedClaims, finishLine, type Proposal, type ProposalSet, type ProposalSetView, type ProposalView, type ResolvedAtom, type Ruling } from "./proposals.ts";
import { captureUrl, capturePath, pageOfQuote } from "./capture.ts";
import { readTrail, trailBetween, type Trail } from "../../viewer/trail.ts";
import { renderSite } from "../../viewer/erf-view.ts";
import { renderIndex, renderSources, renderHealth, renderNarrative, renderClaim, renderAtom, renderCapture, renderSurvey, setSiteLinks } from "../../viewer/render.ts";
import { splitDocument } from "@epistemic-record-format/yaml-markdown";
import {
  quoteCheck, normalizeForCheck, disposition, unbacked, stoodOn, danglingRefs, brokenAnchors,
  bindingStaleness, findWholeWords, claimsUsingAtom,
} from "@epistemic-record-format/yaml-markdown";
import type { Atom, Claim, LoadedCorpus, Narrative } from "@epistemic-record-format/yaml-markdown";
import type { Source } from "../../../schema/erf.generated.ts";

/**
 * `data` is the machine-readable half of a result, handed to the host as
 * `structuredContent`. The editor in the app reads it; a host that shows only
 * text still gets `text`. Tools that write nothing structured leave it unset.
 */
export interface Result { text: string; wrote?: string[]; data?: Record<string, unknown> }

/**
 * PROBE (2026-08-27): what the host shows of a server's progress and logs.
 * `Progress` is called by the long tools at their steps; `index.ts` turns it
 * into notifications/progress when the call carried a progressToken and
 * into nothing otherwise. `onWrote` is called after every write with the
 * relative paths, and `index.ts` sends them as logging messages. Both can
 * be removed without touching any tool if the host shows nothing.
 */
export type Progress = (progress: number, total: number | undefined, message: string) => void;
export let onWrote: ((paths: string[]) => void) | null = null;
export function setOnWrote(fn: ((paths: string[]) => void) | null): void { onWrote = fn; }

const KINDS = ["observation", "argument", "bet", "commitment"] as const;
const STANCES = ["for", "against", "withdrawn"] as const;
const RELATIONS = ["supports", "assumes", "decomposes-into", "conflicts-with"] as const;
const QUALITIES = ["high", "medium", "low"] as const;

function finish(c: Corpus, text: string, wrote: string[], message: string): Result {
  const sha = commit(c, wrote, message);
  const rel = wrote.map((p) => relative(c.dir, p));
  try { onWrote?.(rel); } catch { /* a probe never fails a write */ }
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

/** The search act that led to a page, logged in the same call that captures it. */
export interface FoundBy { tool: string; query: string; hits_reported: string; scope?: string; for: string }

/** How much of a held text comes back when no phrase was asked for. */
const OPENING = 1200;

/**
 * Windows of a held text around every occurrence of `find`, at most five,
 * read the way the quote check reads it (`ERF-51`'s fold). `at` is the offset
 * in the folded text, so a caller can tell two windows apart. Both
 * `erf_source_read` and the passage `erf_source_add` returns come from here,
 * so the two can never show a phrase differently.
 */
function windowsAround(text: string, find: string, window?: number): { at: number; text: string }[] {
  const w = Math.min(Math.max(window ?? 600, 100), 4000);
  const h = normalizeForCheck(text), q = normalizeForCheck(find);
  const out: { at: number; text: string }[] = [];
  let from = 0;
  while (out.length < 5) {
    const at = findWholeWords(h, q, from);
    if (at < 0) break;
    out.push({ at, text: h.slice(Math.max(0, at - w / 2), Math.min(h.length, at + q.length + w / 2)).replace(/\s+/g, " ").trim() });
    from = at + q.length;
  }
  return out;
}

/** The windows as a reader sees them, numbered and elided at both ends. */
function windowLines(windows: { at: number; text: string }[]): string {
  return windows.map((x, i) => `[${i + 1}] …${x.text}…`).join("\n\n");
}

export async function sourceAdd(c: Corpus, a: { id: string; citation_text: string; url?: string; path?: string; licence?: string; licence_name?: string; not_redistributable?: boolean; find?: string; window?: number; found_by?: FoundBy }, progress: Progress = () => {}): Promise<Result> {
  readDeclaration(c);
  progress(0, 4, a.url ? `fetching ${a.url}` : `reading ${a.path}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id)) throw new Refusal("source id must be a lowercase slug");
  const sources = readSourceList(c);
  if (sources[a.id]) throw new Refusal(`source ${a.id} is already registered`);
  if (!a.url && !a.path) throw new Refusal("give a url (with fetching on) or a path to a file inside the corpus");
  if (/https?:\/\//.test(a.citation_text)) throw new Refusal("citation_text names the work and never carries a URL; the URL goes in received.url (ERF-7)");
  // the act that led here goes in the log before the page is held, which is the order
  // the survey gate assumes: log, then capture, then quote.
  const found = a.found_by ? logSearchAct(c, a.found_by) : null;
  const how = a.url ? "erf_source_add(url)" : "erf_source_add(path)";
  let cap;
  try { cap = a.url ? await captureUrl(c, a.id, a.url) : await capturePath(c, a.id, a.path!); progress(2, 4, "extracted and normalized"); }
  catch (e) {
    // a refused capture is part of the trail: the research log says what was tried and why nothing is held
    if (e instanceof Refusal) appendLog(c, { kind: "fetch", tool: how, url: a.url, path: a.path, source: a.id, refused: e.message });
    throw e;
  }
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
  progress(3, 4, "registering");
  writeYamlDocument(sourceListPath(c), { type: "sources", sources });
  appendLog(c, { kind: "fetch", tool: how, url: a.url, path: a.path, source: a.id });
  const wrote = [sourceListPath(c), join(c.dir, cap.rawPath), join(c.dir, cap.normalizedPath)];
  // the held text comes back with the capture, so a quote can be chosen without reading the source again
  const normAbs = join(c.dir, cap.normalizedPath);
  const held = existsSync(normAbs);
  const heldText = held ? readFileSync(normAbs, "utf8") : "";
  const windows = a.find ? windowsAround(heldText, a.find, a.window) : [];
  const passage = !held ? "(no held text; quotes from this source cannot be checked)"
    : a.find && windows.length ? `${windows.length} match(es) for "${a.find}" (text shown folded, as the quote check reads it):\n\n${windowLines(windows)}`
    : a.find ? `no match for "${a.find}" under the fold; the opening of the held text instead:\n\n${heldText.slice(0, OPENING)}`
    : `${heldText.length} chars held${heldText.length > OPENING ? `; first ${OPENING} shown, use find or erf_source_read to see more` : ""}:\n\n${heldText.slice(0, OPENING)}`;
  const head = `${found ? `${actLine(found)}\n` : ""}source ${a.id} registered: ${cap.bytes} bytes held (${cap.rawDigest.slice(0, 19)}…), normalized ${cap.normalizedPath}${cap.title ? `, title "${cap.title}"` : ""}; status ${status}`;
  const r = finish(c, head, wrote, `register source ${a.id}`);
  progress(4, 4, `registered ${a.id}`);
  return { ...r, text: `${r.text}\n\n${passage}`, data: { id: a.id, held, chars: heldText.length, windows } };
}

/**
 * One search act into the log, checked. `erf_search_log` and the `found_by`
 * of a capture both come through here, so a search logged beside its page is
 * logged exactly as a search logged on its own.
 */
function logSearchAct(c: Corpus, a: { tool: string; query: string; hits_reported: string; scope?: string; for?: string }): LogEntry {
  if (!a.query.trim()) throw new Refusal("a search act needs its query");
  if (!a.hits_reported.trim()) throw new Refusal("record the hits as the instrument reported them, even if that is \"not recorded\" (ERF-27)");
  if (!a.for?.trim()) throw new Refusal("say what the search was for: a claim id or a short topic. A survey compiles only the acts that were looking for its question; an act with no `for` can back nothing");
  return appendLog(c, { kind: "search", tool: a.tool, query: a.query, hits_reported: a.hits_reported, scope: a.scope, for: a.for.trim() });
}

/** How one logged act reads back to the caller. */
function actLine(e: LogEntry): string {
  return `logged search at ${e.ts} for ${e.for}: ${e.tool} · "${e.query}" · ${e.hits_reported}`;
}

export function searchLog(c: Corpus, a: { tool: string; query: string; hits_reported: string; scope?: string; for?: string }): Result {
  return { text: actLine(logSearchAct(c, a)) };
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

/** One atom as it is asked for: the same fields whether it comes alone or in a list. */
export interface AtomSpec { source: string; quote: string; finding: string; source_quality: string; as_of_date?: string; limitations?: string }

/** What one atom came to: an id, or a reason and (for a failed quote check) the passage nearest to it. */
type Minted = { ok: true; id: string; path: string; source: string; page: number | null } | { ok: false; reason: string; nearest?: string };

/**
 * Write one atom, or say why not. Never throws: the caller decides whether a
 * refusal ends the call (one atom) or is reported beside the others (a list).
 * The id is taken immediately before the file is written, so ids inside one
 * call run consecutively and a call landing between two of them cannot take
 * one of ours.
 */
function mintOneAtom(c: Corpus, decl: ReturnType<typeof readDeclaration>, sources: Record<string, Source>, a: AtomSpec): Minted {
  const src = sources[a.source];
  if (!src) return { ok: false, reason: `source ${a.source} is not registered; capture it with erf_source_add first (ERF-35)` };
  if (!src.normalized || !existsSync(join(c.dir, src.normalized))) return { ok: false, reason: `source ${a.source} has no held normalized text, so a quote cannot be checked at mint (ERF-50)` };
  if (!(QUALITIES as readonly string[]).includes(a.source_quality)) return { ok: false, reason: `source_quality is one of ${QUALITIES.join(", ")}` };
  if (a.as_of_date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(a.as_of_date)) return { ok: false, reason: "as_of_date is a date at the source's own precision: YYYY, YYYY-MM or YYYY-MM-DD (ERF-14)" };
  if (!a.quote?.trim() || !a.finding?.trim()) return { ok: false, reason: "an atom needs a verbatim quote and a finding" };
  const text = readFileSync(join(c.dir, src.normalized), "utf8");
  const id = nextAtomId(c, decl);
  const atom: Atom = { id, type: "atom", corpus: String(decl.id), finding: a.finding, quote: a.quote, source: a.source, source_quality: a.source_quality as Atom["source_quality"], created: { timestamp: today(), by: c.options.agent }, finding_audit: [] };
  const q = quoteCheck(atom, text);
  if (q.state !== "pass") return { ok: false, reason: `quote not found in the normalized text of ${a.source} (ERF-50): ${q.detail}`, nearest: nearestPassage(text, a.quote) };
  const fm = { id, type: "atom", corpus: decl.id, finding: a.finding, quote: a.quote, source: a.source, source_quality: a.source_quality, as_of_date: a.as_of_date, limitations: a.limitations, created: { timestamp: today(), by: c.options.agent } };
  // a held PDF carries page markers; the page the quote starts on goes in the body, since the format has no
  // locator field on an atom (a spec question, filed as B-70) and the body is free prose the validator keeps
  const page = pageOfQuote(text, a.quote);
  const body = page ? `Page ${page} of the held PDF, read from the page markers in its normalized text.` : null;
  return { ok: true, id, path: writeRecord(c, "atom", id, fm, body), source: a.source, page };
}

/** Where a source can be read as it was received, for the line under a mint. */
function whereFrom(src: Source | undefined): string {
  return src?.received?.url ? `\nsource page: ${src.received.url}` : src?.received?.path ? `\nsource file: ${src.received.path}` : "";
}

/**
 * Mint one atom, or every atom for a source in one call. The single shape is
 * unchanged: a refusal ends the call and names the requirement. With `atoms`,
 * each is checked and written in turn, one refusal does not stop the rest, and
 * the result lists every outcome in order.
 */
export function atomMint(c: Corpus, a: Partial<AtomSpec> & { atoms?: AtomSpec[] }): Result {
  const decl = readDeclaration(c);
  const sources = readSourceList(c);

  if (!a.atoms) {
    if (!a.source || !a.quote || !a.finding || !a.source_quality) throw new Refusal("give one atom (source, quote, finding, source_quality) or a list of them in atoms");
    const r = mintOneAtom(c, decl, sources, a as AtomSpec);
    if (!r.ok) throw new Refusal(r.reason + (r.nearest ? `\nnearest passage: "${r.nearest}"` : ""));
    const src = sources[r.source];
    return finish(c, `atom ${r.id} minted; quote check: present${r.page ? ` · page ${r.page}` : ""}\ncites ${r.source}: ${src?.citation_text ?? "(unregistered)"}${whereFrom(src)}\nsee the quote in the held text: erf_view page=capture:${r.id}`, [r.path], `mint atom ${r.id}`);
  }

  if (!a.atoms.length) throw new Refusal("atoms is an empty list; give at least one atom");
  const lines: string[] = [];
  const minted: string[] = [], paths: string[] = [], refused: { index: number; reason: string; nearest?: string }[] = [];
  const cited = new Set<string>();
  a.atoms.forEach((spec, i) => {
    const r = mintOneAtom(c, decl, sources, spec);
    if (r.ok) {
      minted.push(r.id); paths.push(r.path); cited.add(r.source);
      lines.push(`[${i + 1}] ok ${r.id} (${r.source}${r.page ? `, page ${r.page}` : ""}): ${spec.finding}`);
    } else {
      refused.push({ index: i + 1, reason: r.reason, ...(r.nearest ? { nearest: r.nearest } : {}) });
      lines.push(`[${i + 1}] refused: ${r.reason}${r.nearest ? `\n    nearest passage: "${r.nearest}"` : ""}`);
    }
  });
  for (const id of cited) lines.push(`cites ${id}: ${sources[id]?.citation_text ?? "(unregistered)"}${whereFrom(sources[id])}`);
  if (minted.length) lines.push(`see a quote in the held text: erf_view page=capture:${minted[0]}`);
  const head = `${minted.length} of ${a.atoms.length} atom(s) minted; quote check: present on each`;
  const body = `${head}\n${lines.join("\n")}`;
  const r = paths.length ? finish(c, body, paths, `mint ${minted.length} atom(s): ${minted.join(", ")}`) : { text: body };
  return { ...r, data: { minted, refused } };
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

/** A source the survey went looking for by name, and what became of it. Producer machinery in the body (the format has no field: B-71). */
export interface Target { name: string; status: "held" | "unreachable" | "not-found" | "not-searched"; note?: string; source?: string }
const TARGET_STATUS = ["held", "unreachable", "not-found", "not-searched"] as const;

/** The "Sources sought" section of a survey body, and the one-line count for its coverage text. */
export function targetsSection(targets: Target[]): { section: string; count: string } {
  const n = (s: Target["status"]) => targets.filter((t) => t.status === s).length;
  const count = `${targets.length} named: ${n("held")} held, ${n("unreachable")} unreachable, ${n("not-found")} not found, ${n("not-searched")} not searched`;
  const section = `## Sources sought\n\n${targets.map((t) => `- **${t.name}** · ${t.status}${t.source ? ` (${t.source})` : ""}${t.note ? ` · ${t.note}` : ""}`).join("\n")}`;
  return { section, count };
}

export function surveyRecord(c: Corpus, a: { id: string; title: string; coverage_bounds: string; summary?: string; from_log?: string; for?: string | string[]; searches?: { tool: string; query: string; hits_reported: string; scope?: string }[]; notable_results?: { what: string; note: string; atoms?: string[] }[]; prior_survey?: string; targets?: Target[] }): Result {
  const decl = readDeclaration(c);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(a.id)) throw new Refusal("survey id must be a lowercase slug; end it with the conducted date (ERF-28)");
  if (idInUse(c, a.id)) throw new Refusal(`id ${a.id} is already used by a record (ERF-36)`);
  let searches = a.searches ?? [];
  // `for` is one question or several: a survey's acts may have been logged under a claim id and a topic
  // (the 2026-08-27 survey on the 1990s missed the search logged under its second question)
  const fors = (Array.isArray(a.for) ? a.for : a.for ? [a.for] : []).map((x) => x.trim()).filter(Boolean);
  if (a.from_log) {
    const day = readLog(c).filter((e) => e.kind === "search" && e.ts.startsWith(a.from_log!));
    const tags = [...new Set(day.map((e) => e.for ?? "(untagged)"))];
    if (!fors.length) throw new Refusal(`say what this survey is for (\`for\`, one question or a list); the log for ${a.from_log} holds acts for: ${tags.join(", ") || "nothing"}. A survey compiles only the acts that were looking for its own question`);
    const acts = day.filter((e) => e.for && fors.includes(e.for));
    if (!acts.length) throw new Refusal(`no search act on ${a.from_log} was logged for ${fors.join(" or ")}; acts that day were for: ${tags.join(", ") || "nothing"}. Run and log the searches, then record the survey (ERF-26)`);
    searches = [...searches, ...acts.map((e) => ({ tool: e.tool, query: e.query ?? "", hits_reported: e.hits_reported ?? "not recorded", scope: e.scope, timestamp: e.ts }))];
  }
  if (!searches.length) throw new Refusal("a survey records at least one search act; nothing is in the log for that day and none was given (ERF-26)");
  for (const s of searches) if (!s.tool || !s.query || !s.hits_reported) throw new Refusal("each act needs tool, query and hits_reported as the instrument reported them (ERF-26, ERF-27)");
  const atoms = recordFiles(c, "atom");
  for (const r of a.notable_results ?? []) for (const id of r.atoms ?? []) if (!atoms.has(id)) throw new Refusal(`atom ${id} does not exist (ERF-35)`);
  if (a.prior_survey && !recordFiles(c, "survey").has(a.prior_survey)) throw new Refusal(`prior survey ${a.prior_survey} does not exist`);
  const targets = a.targets ?? [];
  const sources = targets.length ? readSourceList(c) : {};
  for (const t of targets) {
    if (!t.name?.trim()) throw new Refusal("each target names the source sought");
    if (!(TARGET_STATUS as readonly string[]).includes(t.status)) throw new Refusal(`a target's status is one of ${TARGET_STATUS.join(", ")}`);
    if (t.source && !sources[t.source]) throw new Refusal(`target "${t.name}" names source ${t.source}, which is not registered`);
    if (t.status === "held" && !t.source) throw new Refusal(`target "${t.name}" is held: say which registered source holds it`);
  }
  const fm = { id: a.id, type: "survey", corpus: decl.id, title: a.title, conducted: { timestamp: today(), by: c.options.agent }, searches, notable_results: a.notable_results, prior_survey: a.prior_survey };
  const sought = targets.length ? targetsSection(targets) : null;
  const body = `${a.title}${a.summary ? `: ${a.summary.trim()}` : "."}\n\nCoverage bounds: ${a.coverage_bounds.trim()}${sought ? ` Sources sought by name, ${sought.count}.\n\n${sought.section}` : ""}`;
  const path = writeRecord(c, "survey", a.id, fm, body);
  return finish(c, `survey ${a.id} recorded with ${searches.length} act(s)${targets.length ? ` and ${targets.length} source(s) sought (${sought!.count})` : ""}`, [path], `record survey ${a.id}`);
}

// ---------- flags ----------

function proseOf(c: Corpus, narrative: string): { path: string; slug: string; body: string; prose: string } {
  const { path, slug } = narrativeFile(c, narrative);
  const split = splitDocument(readFileSync(path, "utf8"));
  if (split === null || typeof split === "string") throw new Refusal(`${narrative}: ${split ?? "no frontmatter"} (YAMLB-3)`);
  const prose = split.body.replace(/<!--\s*claims:[\s\S]*?-->/g, (m) => " ".repeat(m.length));
  return { path, slug, body: split.body, prose };
}

/** The passage an anchor sits in: from the previous blank line to the next. */
function passageAround(prose: string, at: number): string {
  const start = prose.lastIndexOf("\n\n", at) + 2;
  const end = prose.indexOf("\n\n", at);
  return prose.slice(Math.max(0, start), end < 0 ? prose.length : end).replace(/\s+/g, " ").trim();
}

export function flag(c: Corpus, a: { narrative: string; anchor: string; span?: string; note?: string; research?: string }): Result {
  readDeclaration(c);
  const anchor = a.anchor.replace(/\s+/g, " ").trim();
  if (anchor.length < 8) throw new Refusal("an anchor is a few exact words of the passage; give at least a phrase");
  // the span is the scope: the whole selection, folded like an anchor; the anchor is a few of its words that locate it
  const spanGiven = (a.span ?? "").replace(/\s+/g, " ").trim();
  const span = spanGiven && spanGiven !== anchor ? spanGiven : undefined;
  if (span && !span.includes(anchor)) throw new Refusal(`the span must contain the anchor: "${anchor}" is not in the span given`);
  if (a.research !== undefined && !(RESEARCH as readonly string[]).includes(a.research)) throw new Refusal(`research is one of ${RESEARCH.join(", ")}`);
  const research = (a.research ?? "mint") as Research;
  const { slug, prose } = proseOf(c, a.narrative);
  const [first, second] = anchorOccurrences(prose, anchor);
  if (first === undefined) throw new Refusal(`"${anchor}" does not occur in ${slug}; the anchor must be exact words from the passage`);
  if (second !== undefined) throw new Refusal(`"${anchor}" occurs more than once in ${slug}; choose words unique to the passage`);
  if (span && anchorOccurrences(prose, span, 1).length === 0) throw new Refusal(`the span does not occur in ${slug} as one run of text; a span is the selection itself, whitespace folded`);
  const flags = readFlags(c);
  if (flags.some((f) => f.status === "open" && f.narrative === slug && f.anchor === anchor)) throw new Refusal("that passage is already flagged");
  const f: Flag = { id: (flags.at(-1)?.id ?? 0) + 1, ts: now(), narrative: slug, anchor, ...(span ? { span } : {}), ...(a.note ? { note: a.note } : {}), research, by: c.options.agent, status: "open" };
  flags.push(f); writeFlags(c, flags);
  const open = flags.filter((x) => x.status === "open").length;
  const asked = research === "back" ? "; back it: after the ruling, gather the evidence and bind"
    : research === "opposite" ? "; back it and state the strongest case against before standing"
    : "; propose claims and stop for a ruling";
  const words = span ? span.split(" ").length : 0;
  const r = finish(c, `flag #${f.id} on ${slug} at "${anchor}"${span ? ` · scope ${words} words` : ""}${a.note ? ` (${a.note})` : ""} · research ${research}${asked}; ${open} open flag${open === 1 ? "" : "s"}`, [flagsPath(c)], `flag passage in ${slug}`);
  return { ...r, data: { id: f.id, narrative: slug, anchor, ...(span ? { span } : {}), research, ...(a.note ? { note: a.note } : {}) } };
}

/** Whole minutes since an instant, or null when it cannot be read as one. */
/** Whether a take has aged past `TAKE_MINUTES` (or carries no instant): held, but not by anyone working now. */
function takeStale(f: Flag): boolean {
  const m = minutesSince(f.taken_ts);
  return m === null || m >= TAKE_MINUTES;
}
function minutesSince(ts: string | undefined): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 60000);
}

/** How long ago, in the words a queue reads best. */
function ago(ts: string | undefined): string {
  const m = minutesSince(ts);
  return m === null ? "at an unknown time" : m < 1 ? "just now" : `${m} min ago`;
}

/** Who holds a flag, for a line the next worker reads. Empty when nobody does. */
function takenNote(f: Flag): string {
  return f.taken_by ? ` · taken by ${f.taken_by}, ${ago(f.taken_ts)}` : "";
}

/**
 * Take a flag, so several workers can share one queue: another chat, another
 * session, another agent. A take holds for half an hour and then goes stale,
 * because a worker that stopped must not lock a flag forever; taking a flag
 * you already hold refreshes it. Nothing clears a take: after the flag is
 * resolved it says who did the work.
 */
export function flagTake(c: Corpus, a: { id: number; by?: string }): Result {
  readDeclaration(c);
  const all = readFlags(c);
  const f = all.find((x) => x.id === a.id);
  if (!f) throw new Refusal(`no flag #${a.id}`);
  if (f.status === "done") throw new Refusal(`flag #${a.id} is already resolved${f.taken_by ? ` (worked by ${f.taken_by})` : ""}; there is nothing to take`);
  const by = (a.by ?? c.options.agent).trim() || c.options.agent;
  const held = minutesSince(f.taken_ts);
  if (f.taken_by && f.taken_by !== by && held !== null && held < TAKE_MINUTES) {
    throw new Refusal(`flag #${a.id} was taken by ${f.taken_by} ${ago(f.taken_ts)}; leave it to them and work another flag. A take goes stale after ${TAKE_MINUTES} minutes and can then be taken again.`);
  }
  const expired = f.taken_by && f.taken_by !== by ? f.taken_by : null;
  f.taken_by = by; f.taken_ts = now();
  writeFlags(c, all);
  const text = `flag #${a.id} taken by ${by}${expired ? `; ${expired}'s take had gone stale (older than ${TAKE_MINUTES} minutes)` : ""} · ${f.narrative} at "${f.anchor}" · research ${f.research ?? "mint"}${f.note ? ` · ${f.note}` : ""}`;
  const r = finish(c, text, [flagsPath(c)], `take flag #${a.id}`);
  return { ...r, data: { id: f.id, taken_by: by, taken_ts: f.taken_ts, ...(expired ? { expired_take_by: expired } : {}) } };
}

export function flags(c: Corpus, a: { narrative?: string; all?: boolean }): Result {
  readDeclaration(c);
  let list = readFlags(c).filter((f) => a.all || f.status === "open");
  if (a.narrative) { const { slug } = narrativeFile(c, a.narrative); list = list.filter((f) => f.narrative === slug); }
  if (!list.length) return { text: a.all ? "no flags" : "no open flags; flag a passage in the viewer or with erf_flag" };
  const cache = new Map<string, string>();
  const lines = list.map((f) => {
    if (!cache.has(f.narrative)) cache.set(f.narrative, proseOf(c, f.narrative).prose);
    const prose = cache.get(f.narrative)!; const at = prose.indexOf(f.anchor);
    // the scope of the flag is its span (the whole selection) or, without one, its anchor: what the person selected is
    // what gets decomposed and backed; the passage around it is context, shown with the scope marked «so» (a flag on
    // one sentence is not a flag on its paragraph, and a flag on a paragraph is not a flag on its first line)
    const scope = f.span ?? f.anchor;
    const passage = at >= 0 ? passageAround(prose, at).replace(scope, `«${scope}»`) : "(anchor no longer occurs; the prose moved)";
    return `#${f.id} [${f.status}] ${f.narrative} · research ${f.research ?? "mint"} · scope "${scope}"${f.note ? ` · ${f.note}` : ""}${takenNote(f)}${f.claims?.length ? ` · bound to ${f.claims.join(", ")}` : ""}\n  passage (context, scope marked «»): ${passage}`;
  });
  return { text: `${list.length} flag(s):\n` + lines.join("\n") };
}

export function flagResolve(c: Corpus, a: { id: number; claims?: string[] }): Result {
  readDeclaration(c);
  const all = readFlags(c); const f = all.find((x) => x.id === a.id);
  if (!f) throw new Refusal(`no flag #${a.id}`);
  if (f.status === "done") throw new Refusal(`flag #${a.id} is already resolved`);
  f.status = "done"; f.done_ts = now(); if (a.claims?.length) f.claims = a.claims;
  writeFlags(c, all);
  return finish(c, `flag #${a.id} resolved${a.claims?.length ? ` (${a.claims.join(", ")})` : ""}`, [flagsPath(c)], `resolve flag #${a.id}`);
}

/** A binding covers a flag when the flag's anchor sits in the passage that was bound. */
function resolveFlagsCoveredBy(c: Corpus, slug: string, passage: string, claims: string[]): number[] {
  const all = readFlags(c); const hit: number[] = [];
  for (const f of all) if (f.status === "open" && f.narrative === slug && passage.includes(f.anchor)) { f.status = "done"; f.done_ts = now(); f.claims = claims; hit.push(f.id); }
  if (hit.length) writeFlags(c, all);
  return hit;
}

// ---------- proposals: the ruling surface ----------
// A worker proposes; the person rules on the card; a claim is written only by
// the ruling. The set lives in proposals.jsonl beside flags.jsonl: producer
// machinery the format never sees. One open set per flag: a new set for a
// flag with an open one supersedes it.

/** The page an atom was quoted from, when it was minted from a held PDF (the body carries it; the format has no locator field, B-70). */
function atomPage(c: Corpus, id: string): number | undefined {
  const p = recordFiles(c, "atom").get(id);
  if (!p) return undefined;
  const m = /Page (\d+) of the held PDF/.exec(readRecordFile(p).body);
  return m ? Number(m[1]) : undefined;
}

/** An atom as the card shows it: quote, finding, and where it came from, resolved against the corpus. */
function resolveAtom(c: Corpus, l: LoadedCorpus, id: string, side: "for" | "against"): ResolvedAtom {
  const a = l.atoms.get(id);
  if (!a) return { id, side, quote: "", finding: "(no such atom in this corpus)", source: "", missing: true };
  const s = l.sources.get(a.source);
  const x = a as unknown as Record<string, unknown>;
  const page = atomPage(c, id);
  return {
    id, side, quote: a.quote, finding: a.finding, source: a.source,
    ...(s?.citation_text ? { citation: s.citation_text } : {}),
    ...(s?.received?.url ? { url: s.received.url } : {}),
    ...(page ? { page } : {}),
    ...(typeof x["source_quality"] === "string" ? { quality: x["source_quality"] as string } : {}),
    ...(typeof x["as_of_date"] === "string" ? { as_of: x["as_of_date"] as string } : {}),
    ...(typeof x["limitations"] === "string" ? { limitations: x["limitations"] as string } : {}),
  };
}

/** The set as the card reads it. */
function proposalSetView(c: Corpus, set: ProposalSet): ProposalSetView {
  const decl = readDeclaration(c);
  const l = load(c);
  const n = l.narratives.find((x) => x.slug === set.narrative);
  const proposals: ProposalView[] = set.proposals.map((p) => ({
    ...p,
    atoms: [...(p.atoms_for ?? []).map((id) => resolveAtom(c, l, id, "for")), ...(p.atoms_against ?? []).map((id) => resolveAtom(c, l, id, "against"))],
    ...(set.rulings[p.id] ? { ruled: set.rulings[p.id] } : {}),
  }));
  return {
    kind: "proposals", corpus: String(decl.id), flag: set.flag, ts: set.ts, by: set.by, narrative: set.narrative, narrative_title: n?.title ?? set.narrative,
    anchor: set.anchor, ...(set.span ? { span: set.span } : {}), research: set.research, ...(set.survey ? { survey: set.survey } : {}), ...(set.summary ? { summary: set.summary } : {}),
    proposals, counts: proposalCounts(set), all_ruled: allRuled(set), status: set.status, ...(set.bound ? { bound: set.bound } : {}),
  };
}

function openSetFor(c: Corpus, flag: number): { sets: ProposalSet[]; set: ProposalSet } {
  const sets = readProposalSets(c);
  const set = [...sets].reverse().find((x) => x.flag === flag && x.status === "open");
  if (!set) {
    const any = sets.some((x) => x.flag === flag);
    throw new Refusal(any ? `flag #${flag} has no open proposals; its set was ${sets.filter((x) => x.flag === flag).at(-1)!.status}` : `no proposals for flag #${flag}; the worker puts them with erf_propose`);
  }
  return { sets, set };
}

function summaryLine(v: ProposalSetView): string {
  const rows = v.proposals.map((p) => `  ${p.id} · ${p.epistemic_kind} · ${p.atoms.filter((a) => a.side === "for").length} for / ${p.atoms.filter((a) => a.side === "against").length} against${p.ruled ? ` · ${p.ruled.ruling}${p.ruled.claim ? ` as ${p.ruled.claim}` : ""}` : ""}`);
  return rows.join("\n");
}

export function propose(c: Corpus, a: { flag: number; proposals: Proposal[]; survey?: string; summary?: string }): Result {
  readDeclaration(c);
  const f = readFlags(c).find((x) => x.id === a.flag);
  if (!f) throw new Refusal(`no flag #${a.flag}`);
  if (f.status !== "open") throw new Refusal(`flag #${a.flag} is already resolved; there is nothing to propose for it`);
  if (!a.proposals?.length) throw new Refusal("give at least one proposal");
  if (a.survey && !recordFiles(c, "survey").has(a.survey)) throw new Refusal(`survey ${a.survey} does not exist (ERF-35)`);
  const atoms = recordFiles(c, "atom");
  const seen = new Set<string>();
  for (const p of a.proposals) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(p.id)) throw new Refusal(`proposal id ${JSON.stringify(p.id)} must be a lowercase slug: it is the id the claim would take`);
    if (seen.has(p.id)) throw new Refusal(`proposal id ${p.id} is given twice`);
    seen.add(p.id);
    if (idInUse(c, p.id)) throw new Refusal(`id ${p.id} is already used by a record (ERF-36); propose another slug`);
    if (!p.title?.trim()) throw new Refusal(`proposal ${p.id} needs a title that states the claim`);
    if (!(KINDS as readonly string[]).includes(p.epistemic_kind)) throw new Refusal(`proposal ${p.id}: epistemic_kind is one of ${KINDS.join(", ")}`);
    for (const id of [...(p.atoms_for ?? []), ...(p.atoms_against ?? [])]) if (!atoms.has(id)) throw new Refusal(`proposal ${p.id} cites atom ${id}, which does not exist (ERF-35); mint the evidence before proposing`);
  }
  const sets = readProposalSets(c);
  for (const x of sets) if (x.flag === a.flag && x.status === "open") x.status = "superseded";
  const set: ProposalSet = {
    flag: a.flag, ts: now(), by: c.options.agent, narrative: f.narrative, anchor: f.anchor, ...(f.span ? { span: f.span } : {}), research: f.research ?? "mint",
    ...(a.survey ? { survey: a.survey } : {}), ...(a.summary ? { summary: a.summary } : {}),
    proposals: a.proposals.map((p) => ({ id: p.id, title: p.title.trim(), epistemic_kind: p.epistemic_kind, ...(p.atoms_for?.length ? { atoms_for: p.atoms_for } : {}), ...(p.atoms_against?.length ? { atoms_against: p.atoms_against } : {}), ...(p.settles ? { settles: p.settles } : {}), ...(p.note ? { note: p.note } : {}) })),
    rulings: {}, status: "open",
  };
  sets.push(set); writeProposalSets(c, sets);
  const v = proposalSetView(c, set);
  const r = finish(c, `${set.proposals.length} proposal(s) for flag #${a.flag} are on the card, waiting for the ruling; no claim is written until the user accepts or narrows one there. Say so in one line and stop.\n${summaryLine(v)}`, [proposalsPath(c)], `propose ${set.proposals.length} claim(s) for flag #${a.flag}`);
  return { ...r, data: v as unknown as Record<string, unknown> };
}

export function proposals(c: Corpus, a: { flag?: number }): Result {
  readDeclaration(c);
  const sets = readProposalSets(c);
  const open = sets.filter((x) => x.status === "open");
  const set = a.flag !== undefined ? [...sets].reverse().find((x) => x.flag === a.flag) : open.at(-1);
  if (!set) return { text: a.flag !== undefined ? `no proposals for flag #${a.flag}` : "no open proposals" };
  const v = proposalSetView(c, set);
  const others = open.filter((x) => x !== set).map((x) => `#${x.flag} (${x.proposals.length})`);
  return { text: `proposals for flag #${set.flag} · ${set.status} · ${v.counts.ruled}/${v.counts.total} ruled${others.length ? ` · other open sets: ${others.join(", ")}` : ""}\n${summaryLine(v)}`, data: v as unknown as Record<string, unknown> };
}

/** One ruling: accept or narrow mints the claim with the atoms as ruled; drop records the drop. */
export function proposalRule(c: Corpus, a: { flag: number; id: string; ruling: string; title?: string; atoms_for?: string[]; atoms_against?: string[] }): Result {
  readDeclaration(c);
  if (!(RULINGS as readonly string[]).includes(a.ruling)) throw new Refusal(`ruling is one of ${RULINGS.join(", ")}`);
  const { sets, set } = openSetFor(c, a.flag);
  const p = set.proposals.find((x) => x.id === a.id);
  if (!p) throw new Refusal(`flag #${a.flag} has no proposal ${a.id}; it has ${set.proposals.map((x) => x.id).join(", ")}`);
  if (set.rulings[p.id]) throw new Refusal(`proposal ${p.id} is already ruled (${set.rulings[p.id]!.ruling}); a ruling is not re-made`);
  const ruling = a.ruling as Ruling;
  const wrote: string[] = [proposalsPath(c)];
  let text: string;
  if (ruling === "dropped") {
    set.rulings[p.id] = { ruling, ts: now() };
    text = `dropped ${p.id}`;
  } else {
    const title = (a.title ?? p.title).trim();
    if (!title) throw new Refusal("a narrowing needs the narrower title");
    if (ruling === "narrowed" && title === p.title) throw new Refusal("a narrowing changes the title; to take it as proposed, accept it");
    if (ruling === "accepted" && a.title !== undefined && title !== p.title) throw new Refusal("accepting keeps the title as proposed; to change it, narrow");
    const notes = [p.settles ? `What would settle it: ${p.settles}` : "", p.note ? `Proposed with the note: ${p.note}` : "", `Proposed by ${set.by} for flag #${set.flag} and ${ruling} by the corpus owner on the card${ruling === "narrowed" ? ` (proposed as: ${p.title})` : ""}.`].filter(Boolean).join("\n\n");
    const minted = claimMint(c, { id: p.id, title, epistemic_kind: p.epistemic_kind, atoms_for: a.atoms_for ?? p.atoms_for, atoms_against: a.atoms_against ?? p.atoms_against, ...(set.survey ? { surveys: [set.survey] } : {}), notes });
    wrote.push(...(minted.wrote ?? []).map((x) => join(c.dir, x)));
    set.rulings[p.id] = { ruling, ts: now(), claim: p.id, ...(ruling === "narrowed" ? { title } : {}) };
    text = `${ruling} ${p.id}: ${minted.text.split("\n")[0]}`;
  }
  writeProposalSets(c, sets);
  const v = proposalSetView(c, set);
  const r = finish(c, `${text} · ${v.counts.ruled}/${v.counts.total} ruled${v.all_ruled ? " · every proposal ruled; bind and finish" : ""}`, wrote, `rule ${p.id} for flag #${a.flag}: ${ruling}`);
  return { ...r, data: v as unknown as Record<string, unknown> };
}

/** Every proposal ruled: bind the passage to the claims the rulings minted (which resolves the flag), or resolve the flag when all were dropped. */
export function proposalFinish(c: Corpus, a: { flag: number }): Result {
  readDeclaration(c);
  const { sets, set } = openSetFor(c, a.flag);
  if (!allRuled(set)) {
    const left = set.proposals.filter((p) => !set.rulings[p.id]).map((p) => p.id);
    throw new Refusal(`flag #${a.flag} still has ${left.length} proposal(s) without a ruling: ${left.join(", ")}`);
  }
  const claims = acceptedClaims(set);
  const wrote: string[] = [proposalsPath(c)];
  let text: string;
  if (claims.length) {
    let bound: Result;
    try { bound = narrativeBind(c, { narrative: set.narrative, anchor: set.anchor, claims }); }
    catch (e) {
      if (!(e instanceof Refusal) || !/already ends with a binding/.test(e.message)) throw e;
      // the passage was bound before (an earlier flag on it): the new claims join the binding rather than replace it
      const l = load(c); const n = l.narratives.find((x) => x.slug === set.narrative);
      const { prose } = proseOf(c, set.narrative);
      const [at] = anchorOccurrences(prose, set.anchor, 1);
      const here = at === undefined ? "" : passageAround(prose, at);
      const prior = n?.bindings.find((b) => { const [i] = anchorOccurrences(prose, b.anchor, 1); return i !== undefined && passageAround(prose, i) === here; });
      const all = [...new Set([...(prior?.claims ?? []), ...claims])];
      bound = narrativeBind(c, { narrative: set.narrative, anchor: set.anchor, claims: all, replace: true });
    }
    wrote.push(...(bound.wrote ?? []).map((x) => join(c.dir, x)));
    text = bound.text.split("\n")[0]!;
  } else {
    const f = readFlags(c).find((x) => x.id === a.flag);
    if (f && f.status === "open") { const r = flagResolve(c, { id: a.flag }); wrote.push(...(r.wrote ?? []).map((x) => join(c.dir, x))); }
    text = `every proposal dropped; flag #${a.flag} resolved without a binding`;
  }
  set.status = "ruled"; set.done_ts = now(); set.bound = claims;
  writeProposalSets(c, sets);
  const v = proposalSetView(c, set);
  const r = finish(c, `${finishLine(set, claims.length > 0)}\n${text}`, [...new Set(wrote)], `finish flag #${a.flag}: ${claims.length} claim(s) bound`);
  return { ...r, data: v as unknown as Record<string, unknown> };
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
  const [first, second] = anchorOccurrences(prose, a.anchor);
  if (first === undefined) throw new Refusal(`anchor "${a.anchor}" does not occur in the narrative; it must be a few exact words from the passage (ERF-31)`);
  if (second !== undefined) throw new Refusal(`anchor "${a.anchor}" occurs more than once; choose words unique to the passage`);
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
  const pStart = prose.lastIndexOf("\n\n", first) + 2;
  const resolved = resolveFlagsCoveredBy(c, narrativeFile(c, a.narrative).slug, prose.slice(Math.max(0, pStart), end), a.claims);
  const wrote = resolved.length ? [path, flagsPath(c)] : [path];
  return finish(c, `bound ${a.claims.length} claim(s) to "${a.anchor}" (bound-at ${now()})${resolved.length ? `; resolved flag${resolved.length === 1 ? "" : "s"} #${resolved.join(", #")}` : ""}`, wrote, `bind narrative passage "${a.anchor.slice(0, 40)}"`);
}

/**
 * How one binding reads, in one word. The order matters: a binding naming a
 * claim that does not exist is `missing-claim` whatever else is true of it
 * (`ERF-31/33`); an anchor no longer in its passage is `broken` (`ERF-31`);
 * otherwise `ERF-32`'s staleness answers, and `indeterminate` is one of its
 * answers, for a legacy binding with no `bound-at` to compare.
 */
export type BindingStatus = "current" | "stale" | "broken" | "missing-claim" | "indeterminate";

export interface BindingItem {
  anchor: string;
  claims: string[];
  bound_at: string | null;
  status: BindingStatus;
  /** 1-based line of the file where the anchor's words sit, or null when they do not occur verbatim (a hand-wrapped anchor spans a line break). */
  line: number | null;
  /** What each named claim is, for the popover on the passage. Absent ids are simply not listed. */
  claimInfo?: Record<string, BoundClaimInfo>;
}

/** One atom as the editor's popover lists it: its side, its finding, and the page it was captured from. */
export interface BoundAtom { id: string; side: "for" | "against"; finding: string; source: string; citation?: string; url?: string }
export interface BoundClaimInfo { title: string; kind: string; disposition: string; evidence: number; atoms?: BoundAtom[] }

/** A flag as the editor reads it. `take_stale` is the 30-minute rule (`TAKE_MINUTES`) applied here, once, so no host re-implements it: a stale take is not research in progress. */
export interface FlagItem { id: number; anchor: string; span?: string; note?: string; research: Research; status: "open" | "done"; claims?: string[]; line: number | null; taken_by?: string; taken_ts?: string; take_stale?: boolean }

/**
 * Where an anchor occurs in a text, at most `limit` times. Runs of whitespace
 * on either side are one (a newline inside a paragraph is a space to
 * CommonMark and to `ERF-31` under `ERF-52`'s fold), so an anchor chosen
 * from a displayed line still finds a passage that was hand-wrapped.
 */
function anchorOccurrences(hay: string, anchor: string, limit = 2): number[] {
  const words = anchor.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"), "g");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while (out.length < limit && (m = re.exec(hay))) { out.push(m.index); if (m[0].length === 0) re.lastIndex++; }
  return out;
}

/** The 1-based line of `text` where `needle` first occurs outside a binding marker, or null. */
function lineOf(text: string, needle: string): number | null {
  if (!needle) return null;
  const masked = text.replace(/<!--\s*claims:[\s\S]*?-->/g, (m) => " ".repeat(m.length));
  const [at] = anchorOccurrences(masked, needle, 1);
  if (at === undefined) return null;
  return text.slice(0, at).split("\n").length;
}

/**
 * Every binding of one narrative with its status. `erf_narrative_check`,
 * `erf_narrative_read` and `erf_narrative_status` all read bindings through
 * here, so the check the LLM is told and the decoration the editor draws can
 * never disagree. The readings themselves are the reference validator's.
 */
function bindingItems(l: LoadedCorpus, n: Narrative, fileText: string | null): BindingItem[] {
  // brokenAnchors is the oracle for ERF-31; it answers for the corpus, and each
  // line opens with the narrative and the anchor it is about.
  const brokenLines = brokenAnchors(l);
  return [...n.bindings].sort((a, b) => a.index - b.index).map((b) => {
    const missing = b.claims.filter((id) => !l.claims.has(id));
    const isBroken = brokenLines.some((s) => s.startsWith(`${n.slug}: anchor "${b.anchor}" does not occur`));
    const status: BindingStatus = missing.length ? "missing-claim" : isBroken ? "broken" : bindingStaleness(b.boundAt, b.claims, l).state;
    const claimInfo: Record<string, BoundClaimInfo> = {};
    const atomLine = (id: string, side: "for" | "against"): BoundAtom => {
      const a = l.atoms.get(id);
      const s = a ? l.sources.get(a.source) : undefined;
      return {
        id, side, finding: a?.finding ?? "(not in this corpus)", source: a?.source ?? "",
        ...(s?.citation_text ? { citation: s.citation_text } : {}),
        ...(s?.received?.url ? { url: s.received.url } : {}),
      };
    };
    for (const id of b.claims) {
      const cl = l.claims.get(id);
      if (!cl) continue;
      const atoms = [...cl.atoms_for.map((a) => atomLine(a, "for")), ...cl.atoms_against.map((a) => atomLine(a, "against"))];
      claimInfo[id] = { title: cl.title, kind: cl.epistemic_kind, disposition: disposition(cl).disposition, evidence: atoms.length, ...(atoms.length ? { atoms } : {}) };
    }
    return {
      anchor: b.anchor, claims: b.claims, bound_at: b.boundAt ?? null, status,
      line: fileText ? lineOf(fileText, b.anchor) : null,
      ...(Object.keys(claimInfo).length ? { claimInfo } : {}),
    };
  });
}

/** Every flag on one narrative, open and done, in the shape the editor decorates from. */
function flagItems(c: Corpus, slug: string, fileText: string | null): FlagItem[] {
  return readFlags(c).filter((f) => f.narrative === slug).map((f) => ({
    id: f.id, anchor: f.anchor, ...(f.span ? { span: f.span } : {}), ...(f.note ? { note: f.note } : {}),
    research: (f.research ?? "mint") as Research, status: f.status,
    ...(f.claims?.length ? { claims: f.claims } : {}),
    ...(f.taken_by ? { taken_by: f.taken_by, ...(f.taken_ts ? { taken_ts: f.taken_ts } : {}), take_stale: takeStale(f) } : {}),
    line: fileText ? lineOf(fileText, f.anchor) : null,
  }));
}

/** The version id of a narrative file: sha256 of its bytes, first 12 hex characters. */
function digestOf(text: string): string { return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12); }

export function narrativeCheck(c: Corpus, a: { narrative?: string }): Result {
  readDeclaration(c);
  const l = load(c);
  const targets = a.narrative ? l.narratives.filter((n) => n.slug === narrativeFile(c, a.narrative!).slug) : l.narratives;
  if (!targets.length) return { text: "no narratives in this corpus" };
  const lines: string[] = [];
  for (const n of targets) {
    const findings = l.findings.filter((f) => f.record === n.slug);
    const items = bindingItems(l, n, null);
    const count = (s: BindingStatus) => items.filter((x) => x.status === s).length;
    const unresolved = n.bindings.flatMap((b) => b.claims.filter((id) => !l.claims.has(id)));
    const staleList = items.filter((x) => x.status === "stale").map((x) => `"${x.anchor}"`);
    lines.push(`${n.slug}: ${items.length} binding(s) · ${count("current")} current · ${count("stale")} stale · ${count("broken")} broken · ${count("missing-claim")} missing-claim · ${count("indeterminate")} indeterminate`);
    if (unresolved.length) lines.push(`  unresolved claim ids (ERF-31/33): ${[...new Set(unresolved)].join(", ")}`);
    if (staleList.length) lines.push(`  stale (claim changed after bound-at, ERF-32): ${staleList.join("; ")}`);
    for (const f of findings) lines.push(`  ${f.field}: ${f.detail}`);
  }
  const anchors = brokenAnchors(l); if (anchors.length) lines.push(`broken anchors (flag, ERF-31): ${anchors.join("; ")}`);
  return { text: lines.join("\n") };
}

// ---------- the narrative as a file: read, write, poll ----------

/** The loaded narrative behind a name, with the file as it is on disk. */
function narrativeOf(c: Corpus, name: string): { path: string; slug: string; title: string; text: string; l: LoadedCorpus; n: Narrative } {
  const { path, slug } = narrativeFile(c, name);
  const text = readFileSync(path, "utf8");
  const l = load(c);
  const n = l.narratives.find((x) => x.slug === slug);
  if (!n) throw new Refusal(`${slug} is not loaded as a narrative; check its frontmatter (type: narrative, ERF-73)`);
  return { path, slug, title: n.title, text, l, n };
}

/**
 * The narrative as an editor needs it: the file as on disk, its digest, and
 * where every binding and flag sits. The digest is the version id a write
 * sends back, so two editors cannot silently overwrite each other.
 */
export function narrativeRead(c: Corpus, a: { narrative: string }): Result {
  readDeclaration(c);
  const { path, slug, title, text, l, n } = narrativeOf(c, a.narrative);
  const bindings = bindingItems(l, n, text);
  const flags = flagItems(c, slug, text);
  const digest = digestOf(text);
  const open = flags.filter((f) => f.status === "open").length;
  return {
    text: `narrative ${slug} "${title}" · ${text.length} chars · digest ${digest} · ${bindings.length} binding(s) · ${open} open flag(s)`,
    data: { narrative: slug, path: relative(c.dir, path), title, text, digest, bindings, flags },
  };
}

/**
 * Write the narrative file, whole. `expected_digest` is the digest the writer
 * last read: when it no longer matches the file, the write is refused and the
 * current digest comes back, so the editor can reload or overwrite on purpose.
 * The text is written exactly as sent, frontmatter included; this tool does not
 * parse it. The narrative check runs after the write, since a rewrite is what
 * breaks anchors.
 */
export function narrativeWrite(c: Corpus, a: { narrative: string; text: string; expected_digest?: string; force?: boolean }): Result {
  readDeclaration(c);
  const { path, slug } = narrativeFile(c, a.narrative);
  const onDisk = digestOf(readFileSync(path, "utf8"));
  if (typeof a.text !== "string" || !a.text.trim()) throw new Refusal("a narrative write carries the whole file, frontmatter included; an empty text is refused");
  if (a.expected_digest && !a.force && a.expected_digest !== onDisk) {
    throw new Refusal(`${slug} changed on disk since you read it: its digest is ${onDisk}, you sent ${a.expected_digest}. Read it again and merge, or pass force=true to overwrite what is there.`);
  }
  writeFileSync(path, a.text, "utf8");
  const digest = digestOf(a.text);
  const check = narrativeCheck(c, { narrative: slug });
  const { l, n, text } = narrativeOf(c, slug);
  const bindings = bindingItems(l, n, text);
  const flags = flagItems(c, slug, text);
  const r = finish(c, `wrote ${slug} · ${a.text.length} chars · digest ${digest}\n${check.text}`, [path], `edit narrative ${slug}`);
  return { ...r, data: { written: relative(c.dir, path), digest, check: check.text, bindings, flags } };
}

/**
 * What an open editor polls: the digest, the flags and the bindings, without
 * the text. Read-only, local, no git and no LLM, so it can be called every few
 * seconds while a request is in flight.
 */
export function narrativeStatus(c: Corpus, a: { narrative: string; since?: string }): Result {
  readDeclaration(c);
  const { slug, text, l, n } = narrativeOf(c, a.narrative);
  const bindings = bindingItems(l, n, text);
  const flags = flagItems(c, slug, text);
  const digest = digestOf(text);
  const open = flags.filter((f) => f.status === "open");
  const trail = flagTrails(c, l, slug, a.since);
  const acts = trail.reduce((s, t) => s + t.searches.length + t.captures.length, 0);
  return {
    text: `${slug} · digest ${digest} · ${bindings.length} binding(s) · ${open.length} open flag(s)${open.length ? ` (${open.map((f) => `#${f.id} ${f.research}`).join(", ")})` : ""}${acts ? ` · ${acts} act(s) in the trail` : ""}`,
    data: { digest, flags, bindings, trail },
  };
}

/** One flag's research as the editor shows it: the log's acts inside the flag's window, and what they produced. */
export interface FlagTrail { flag: number; research: Research; since: string; until?: string; taken_by?: string; searches: Trail["searches"]; captures: Trail["captures"]; atoms: { id: string; source: string }[]; claims: { id: string; title: string }[] }

/** How long a resolved flag keeps showing its trail. */
const TRAIL_AFTER_DONE_MS = 2 * 60 * 60 * 1000;

/**
 * The trail behind each flag of a narrative that asked for research: open
 * ones, and ones resolved in the last two hours so the work that closed them
 * is still readable. The window runs from the take (else the flag) to the
 * resolution; `since` narrows it further, so a poll can ask for what is new.
 */
function flagTrails(c: Corpus, l: LoadedCorpus, slug: string, since?: string): FlagTrail[] {
  const wanted = readFlags(c).filter((f) => f.narrative === slug && (f.research ?? "mint") !== "mint"
    && (f.status === "open" || (f.done_ts && Date.now() - Date.parse(f.done_ts) < TRAIL_AFTER_DONE_MS)));
  if (!wanted.length) return [];
  const sources = readSourceList(c);
  const trail = readTrail(c.dir, (id) => sources[id]?.citation_text);
  return wanted.map((f) => {
    const from = f.taken_ts ?? f.ts;
    const w = trailBetween(trail, l, since && since > from ? since : from, f.done_ts);
    return { flag: f.id, research: (f.research ?? "mint") as Research, since: from, ...(f.done_ts ? { until: f.done_ts } : {}), ...(f.taken_by ? { taken_by: f.taken_by } : {}), ...w };
  });
}

// ---------- rendering ----------

/** The viewer, run into a folder inside the corpus: what a reader opens in a browser. Derived output, never committed. */
export function renderSiteTool(c: Corpus, a: { out?: string }, progress: Progress = () => {}): Result {
  readDeclaration(c);
  const rel = (a.out ?? "site").replace(/^\/+/, "");
  if (rel.includes("..")) throw new Refusal("out is a folder inside the corpus");
  const outDir = join(c.dir, rel);
  // PROBE: a step every ten pages, then done
  const r = renderSite(c.dir, outDir, [], (n, total) => { if (n % 10 === 0 || n === total) progress(n, total, `${n} of ${total} pages`); });
  progress(r.pages, r.pages, `rendered ${r.pages} pages`);
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
export interface ViewPage { page: string; title: string; html: string; corpus: string; flags?: { id: number; anchor: string; note?: string }[] }

export function viewPage(c: Corpus & { id?: string }, a: { page?: string }): ViewPage {
  const decl = readDeclaration(c);
  const l = load(c);
  const src = readSourceList(c);
  const captureText = (atomId: string): string | null => {
    const s = src[l.atoms.get(atomId)?.source ?? ""];
    return s?.normalized && existsSync(join(c.dir, s.normalized)) ? readFileSync(join(c.dir, s.normalized), "utf8") : null;
  };
  const trail = readTrail(c.dir, (id) => src[id]?.citation_text);
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
  let [kind, id] = page.includes(":") ? [page.slice(0, page.indexOf(":")), page.slice(page.indexOf(":") + 1)] : [page, ""];
  let full: string, title: string;
  switch (kind) {
    case "index": full = renderIndex(l); title = String(decl.title); break;
    case "sources": full = renderSources(l); title = "sources"; break;
    case "health": full = renderHealth(l, captureText); title = "health"; break;
    case "claim": { const cl = l.claims.get(id); if (!cl) throw new Refusal(`no claim ${id}`); full = renderClaim(cl, l, trail); title = cl.title; break; }
    case "atom": { const at = l.atoms.get(id); if (!at) throw new Refusal(`no atom ${id}`); full = renderAtom(at, l, claimsUsingAtom(l).get(id) ?? [], captureText(id)); title = `atom ${id}`; break; }
    case "capture": { const at = l.atoms.get(id); if (!at) throw new Refusal(`no atom ${id}`); full = renderCapture(at, l, captureText(id)); title = `capture for ${id}`; break; }
    case "survey": { const sv = l.surveys.get(id); if (!sv) throw new Refusal(`no survey ${id}`); full = renderSurvey(sv, l, trail); title = sv.title; break; }
    case "narrative": { const n = l.narratives.find((x) => x.slug === id) ?? (id ? undefined : l.narratives[0]); if (!n) throw new Refusal(`no narrative ${id}`); full = renderNarrative(n, l); title = n.title; id = n.slug; break; }
    default: throw new Refusal(`unknown page ${page}; use index, sources, health, claim:<id>, atom:<id>, capture:<id>, survey:<id>, narrative:<slug>`);
  }
  const m = /<main>([\s\S]*)<\/main>/.exec(full);
  let html = m?.[1] ?? full;
  let flagged: { id: number; anchor: string; note?: string }[] = [];
  if (kind === "narrative") {
    flagged = readFlags(c).filter((f) => f.status === "open" && f.narrative === id).map((f) => ({ id: f.id, anchor: f.anchor, note: f.note }));
    const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    for (const f of flagged) { const a = esc(f.anchor); const at = html.indexOf(a); if (at >= 0) html = html.slice(0, at) + `<mark class="flag" title="flag #${f.id}${f.note ? `: ${esc(f.note)}` : ""}">${a}</mark>` + html.slice(at + a.length); }
  }
  return { page, title, html: `<main>${html}</main>`, corpus: String(decl.id), ...(kind === "narrative" ? { flags: flagged } : {}) };
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
  if (a.find) {
    const hits = windowsAround(text, a.find, a.window);
    return { text: hits.length ? `${head}\n${hits.length} match(es) for "${a.find}" (text shown folded, as the quote check reads it):\n\n${windowLines(hits)}` : `${head}\nno match for "${a.find}" under the fold` };
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
export type { Proposal, ProposalSetView } from "./proposals.ts";
