/**
 * Loading an ERF corpus from the textual form, and checking what was read
 * against the normative data model.
 *
 * The types come from `../types/erf.ts`, which the specification names as
 * normative. That import is the point of writing this in TypeScript: if the
 * model changes, this file stops compiling, so the reference consumer cannot
 * quietly drift from the specification it is supposed to demonstrate.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import type { Atom, Claim, Survey, Source, CorpusDeclaration } from "../types/erf.ts";

export type { Source, CorpusDeclaration };

/** A place where the corpus and the normative model disagree. */
export interface ConformanceFinding {
  record: string;
  field: string;
  detail: string;
}

export interface Narrative {
  slug: string;
  title: string;
  body: string;
  /** `ERF-31` bindings: claims plus the anchor words. */
  bindings: { claims: string[]; anchor: string; boundAt?: string; index: number; end: number }[];
}

/**
 * The narrative-binding grammar of `ERF-31`, in one place.
 *
 * Groups: 1 the ids, 2 the anchor, 3 the optional `bound-at` date.
 *
 * This is a function rather than a constant because a `/g` regex carries
 * `lastIndex` between uses, so sharing one object across call sites makes
 * matches disappear intermittently. It exists at all because the grammar was
 * implemented twice: the parser here gained `bound-at` and the renderer's copy
 * did not, so every binding in the corpus stopped matching there and six raw
 * comments leaked into the page. One grammar, one definition.
 */
export function bindingRe(): RegExp {
  return /<!--\s*claims:\s*([^"<>]+?)\s*"((?:[^"\\]|\\.)+)"\s+bound-at=(\d{4}-\d{2}-\d{2})\s*-->/g;
}

export interface BindingCandidate { index: number; end: number; text: string; terminated: boolean }

/**
 * `ERF-31`'s recognition, made precise (F-016). A candidate is `<!--` then
 * `claims:` found OUTSIDE fenced code blocks and inline code spans, since a
 * document explaining bindings mentions `<!--` in a code span and a raw scan
 * then swallows the next real binding as comment text. It is delimited at
 * the first `-->` BEFORE the grammar is applied, so a greedy `ids` can never
 * eat the next binding; an unterminated one runs to the end of its line, so
 * the bindings after it stay visible, and is reported.
 */
export function bindingCandidates(body: string): BindingCandidate[] {
  let masked = body.replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2[^\n]*(?=\n|$)/g, (m) => m.replace(/[^\n]/g, " "));
  masked = masked.replace(/(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g, (m) => m.replace(/[^\n]/g, " "));
  const out: BindingCandidate[] = [];
  const open = /<!--\s*claims:/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(masked)) !== null) {
    const close = masked.indexOf("-->", m.index + m[0].length);
    const reopen = masked.indexOf("<!--", m.index + m[0].length);
    const eol = masked.indexOf("\n", m.index);
    // Terminated only by a `-->` that comes before the next `<!--`: a
    // binding missing its close would otherwise swallow the next one.
    const terminated = close >= 0 && (reopen < 0 || close < reopen);
    const end = terminated ? close + 3 : (eol < 0 ? masked.length : eol);
    out.push({ index: m.index, end, text: body.slice(m.index, end), terminated });
    open.lastIndex = end;
  }
  return out;
}

/**
 * `ERF-31`: the anchor carries two escapes, `\"` and `\\`. Undo them to
 * recover the text the author meant, which is what must occur in the
 * passage.
 */
export function unescapeAnchor(raw: string): string {
  return raw.replace(/\\(["\\])/g, "$1");
}

/**
 * `ERF-31`'s recognition rule: a comment opening `<!--` then `claims:` IS a
 * narrative binding, whatever follows. Recognizing and validating are
 * separate acts and happen in that order.
 *
 * Without this a required part of the grammar does not make a binding
 * invalid, it makes it INVISIBLE: a comment failing the grammar cannot be
 * told from any other HTML comment, so the claims it names silently vanish
 * from the narrative. Ruled 2026-08-25 on making `bound-at` mandatory,
 * which is what exposed that the anchor had had the same hole all along.
 */

export interface LoadedCorpus {
  manifest: CorpusDeclaration;
  atoms: Map<string, Atom>;
  claims: Map<string, Claim>;
  surveys: Map<string, Survey>;
  narratives: Narrative[];
  sources: Map<string, Source>;
  findings: ConformanceFinding[];
  /**
   * Files in the corpus tree this consumer did not recognize: no `type`, or
   * a `type` it does not implement. Section 2 requires a tolerant consumer
   * to preserve what it cannot interpret AND to report it. This is the
   * report. It is deliberately NOT a finding: an unrecognized file is not a
   * violation, and a corpus holding a README still conforms. Silence here
   * was a real defect, found 2026-08-25 when the `ERF-54` widening left two
   * authored corpora's source lists unread and the loader blamed 151 atoms
   * for naming sources it had simply declined to load.
   */
  unrecognized: { path: string; type: string | null }[];
  /**
   * `ERF-60`: content from a MINOR version newer than this consumer knows.
   * Unknown fields under a known record type land here instead of in
   * `findings`, preserved and reported, never a violation. Null when the
   * corpus declares a version this consumer knows.
   */
  newerMinor: { declared: string; fields: ConformanceFinding[] } | null;
}

/** The newest MINOR of major 0 this consumer implements (`ERF-60`). */
const KNOWN_MINOR = 9;

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** `ERF-12`: the three verdicts, and nothing else. A tool failure is not one. */
const VERDICTS = new Set(["SUPPORTED", "PARTIAL", "UNSUPPORTED"]);

/**
 * `ERF-65`, `ERF-66`. The JSON schema is the narrowest YAML 1.2 defines:
 * only null, true, false, and JSON's number grammar leave string-land, so a
 * date-shaped scalar stays a string. Legacy defaults (YAML 1.1's timestamp
 * type, still in many libraries' default schema) resolve it to a date,
 * which is how an unquoted timestamp once made a claim's disposition depend
 * on how a weekday name sorts. `json: false` keeps js-yaml throwing on a
 * duplicate key rather than taking the last one.
 */
const YAML_OPTS = { schema: yaml.JSON_SCHEMA, json: false } as const;

/**
 * The data model, applied at load. Until 2026-08-25 the loader checked a
 * hand-kept field roster and the schema ran only over the conformance
 * fixtures, so a source list carrying a quoted `'on'` key in place of
 * `timestamp` loaded clean in two corpora and was caught by an independent
 * validator. Every file now validates against erf.schema.json as it is
 * read; a schema error is a producer error (ERF-55) reported at the field.
 */
const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "erf.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const validateModel = ajv.compile(JSON.parse(readFileSync(SCHEMA_PATH, "utf8")));

function checkSchema(instance: unknown, record: string, findings: ConformanceFinding[]): void {
  if (validateModel(instance)) return;
  for (const e of validateModel.errors ?? []) {
    // The root is a choice over six types; report the branch's own errors
    // and skip the "must match exactly one schema" wrapper, which says
    // nothing a reader can act on.
    if (e.keyword === "oneOf") continue;
    const field = (e.instancePath || "/").replace(/^\//, "").replace(/\//g, ".") || "(record)";
    const extra = e.params && "additionalProperty" in e.params ? ` (${String(e.params.additionalProperty)})` : "";
    findings.push({ record, field, detail: `${e.message ?? "schema error"}${extra}; the data model is erf.schema.json (ERF-55)` });
  }
}

/** `ERF-66`: a record is flat and declines anchors, aliases, and tags. */
// An anchor, alias or tag can only open a value: after `key:` or `- `, or
// at the start of a flow item. Matching them anywhere took `*decision log*`
// inside a quoted scalar for an alias and rejected an honest atom (found by
// the Rust differential run, which reads the parser's events instead).
const YAML_GRAPH = /(^\s*(?:[\w.-]+:|-)\s+|[\[{,]\s*)(&[A-Za-z0-9_-]+|\*[A-Za-z0-9_-]+|!![A-Za-z]+)(\s|$|[,\]}])/m;

function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const m = FM.exec(text);
  if (!m) throw new Error("no YAML frontmatter");
  const raw = m[1] ?? "";
  if (YAML_GRAPH.test(raw)) {
    throw new Error(
      "frontmatter uses a YAML anchor, alias, or explicit tag; a record is a "
      + "flat structure and declines all three (ERF-66)",
    );
  }
  const data = (yaml.load(raw, YAML_OPTS) ?? {}) as Record<string, unknown>;
  return { data, body: (m[2] ?? "").trim() };
}

/**
 * A source whose capture ships, on either basis: under a licence (`shipped`)
 * or as a short quotation under none (`shipped-as-quotation`). The two are
 * separate statuses because the permission differs and `ERF-68` requires the
 * source to say which; nothing downstream of the permission cares, so every
 * reader asks this question instead of comparing to a literal.
 */
export const shipsWithCorpus = (src: { status: string } | undefined): boolean =>
  src?.status === "shipped" || src?.status === "shipped-as-quotation";

/**
 * `ERF-54`: discovery is by content, never by filename or directory. Walk
 * everything, read each file's `type`, dispatch on it. A file with no
 * `type` is not part of the corpus: ignored, and reported (`ERF-57`).
 *
 * This is what keeps the format out of a substrate's business. A store
 * arranges its files however it likes; what travels is a set of
 * self-describing documents, and where they sit carries nothing.
 */
function walkFiles(dir: string): string[] {
  const out: string[] = [];
  const visit = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) visit(p);
      else if (/\.(md|markdown|ya?ml)$/i.test(e.name)) out.push(p);
    }
  };
  visit(dir);
  return out;
}

/** The `type` a file declares, or null if it declares none. */
function fileType(path: string): string | null {
  try {
    const raw = readFileSync(path, "utf8");
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const fm = /\.ya?ml$/i.test(path) ? text : (FM.exec(text)?.[1] ?? "");
    const m = /^type:\s*["']?([a-z-]+)["']?\s*$/m.exec(fm);
    return m?.[1] ?? null;
  } catch { return null; }
}


function listDir(dir: string, ext = ".md"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

/**
 * `ERF-55` requires empty lists to be omitted on the wire, while the model
 * types them as total. Every loader therefore has to materialize them, and
 * this is the one place that happens.
 */
/**
 * `ERF-65`: where the model types a field as a string and its bare spelling
 * resolves to another type under the JSON schema, the producer MUST quote
 * it. `as_of_date: 2018` arrives as a number and `spec_version: 1.0` loses
 * its minor version (F-007). Reported at the field, never coerced.
 */
function mustBeString(
  record: string, field: string, v: unknown, findings: ConformanceFinding[],
): void {
  if (v === undefined || typeof v === "string") return;
  findings.push({
    record, field,
    detail: `parsed as ${typeof v} (${JSON.stringify(v)}); the model types it as a `
      + `string, so a producer MUST quote it (ERF-65)`,
  });
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Fields whose absence is a genuine defect.
 *
 * List-typed fields are deliberately NOT checked here. `ERF-55` omits an
 * empty list from the file and `ERF-56` has the reader materialize it, so
 * an omitted list is a complete record rather than a partial one. Checking
 * them here was this viewer applying the file rule to the in-memory type,
 * which is what produced 28 spurious divergences and, in the reporting, the
 * ambiguity the specification then resolved.
 */
function requireFields(
  data: Record<string, unknown>,
  id: string,
  fields: string[],
  findings: ConformanceFinding[],
): void {
  for (const f of fields) {
    if (data[f] === undefined || data[f] === null || data[f] === "") {
      // `type` and `corpus` are the only required fields carrying a numbered
      // requirement; the rest are required by the normative data model in
      // section 3, which binds on its own without an ERF id.
      const cite = f === "type" || f === "corpus"
        ? "every record self-describes (ERF-54)"
        : "required by the normative data model (section 3)";
      findings.push({
        record: id,
        field: f,
        detail: `absent in the record; ${cite}`,
      });
    }
  }
}

/**
 * The defined field roster per record type (section 3). `ERF-55`: a
 * producer MUST NOT originate a field the declared version does not
 * define, so an unknown key is a producer error, reported here and still
 * preserved in the loaded record (`ERF-57`): strict producers, tolerant
 * consumers, and this loader plays both roles.
 */
export const KNOWN_FIELDS: Record<string, Set<string>> = {
  atom: new Set(["id", "type", "corpus", "finding", "quote", "source",
    "source_quality", "as_of_date", "limitations",
    "created", "last_modified", "finding_audit"]),
  claim: new Set(["id", "type", "corpus", "title", "epistemic_kind", "created",
    "last_modified", "short_name", "families", "atoms_for", "atoms_against",
    "surveys", "edges", "standings", "evidence_audit", "semantic_query"]),
  survey: new Set(["id", "type", "corpus", "title", "conducted", "searches",
    "notable_results", "prior_survey", "last_modified"]),
};

/** Keys whose presence means a specific prohibited thing, cited with the
 *  rule that prohibits it rather than the generic unknown-key rule. */
const PROHIBITED_KEYS: Record<string, Record<string, string>> = {
  claim: {
    disposition: "a claim MUST NOT store a state field; the disposition is computed (ERF-22)",
    state: "a claim MUST NOT store a state field; the disposition is computed (ERF-22)",
    status: "a claim MUST NOT store a state field; the disposition is computed (ERF-22)",
  },
  atom: {
    quote_check: "the mechanical check is recomputable and MUST NOT be stored (ERF-11)",
    mechanical_check: "the mechanical check is recomputable and MUST NOT be stored (ERF-11)",
  },
};

function checkKnownFields(
  data: Record<string, unknown>,
  id: string,
  kind: string,
  findings: ConformanceFinding[],
): void {
  const known = KNOWN_FIELDS[kind];
  if (!known) return;
  for (const key of Object.keys(data)) {
    if (known.has(key)) continue;
    // ERF-72: the extension namespace. An x_ field is legal on any record,
    // never an unknown-field violation; it is preserved like anything else.
    if (key.startsWith("x_")) continue;
    const special = PROHIBITED_KEYS[kind]?.[key];
    findings.push({
      record: id,
      field: key,
      detail: special
        ? `${special}; also an unknown key under the declared version (ERF-55). `
          + `Preserved as opaque data (ERF-57).`
        : `unknown key: a producer MUST NOT originate a field the declared `
          + `spec_version does not define (ERF-55). Preserved as opaque data `
          + `(ERF-57).`,
    });
  }
}

/** `ERF-7`: a citation identifies a work; a locator retrieves one copy. */
function checkCitationText(data: Record<string, unknown>, id: string, findings: ConformanceFinding[]): void {
  const ct = String(data["citation_text"] ?? "");
  if (/[a-z][a-z0-9+.-]*:\/\//i.test(ct) || /\bwww\./i.test(ct)) {
    findings.push({
      record: id,
      field: "citation_text",
      detail: "contains a URL; citation_text MUST NOT (ERF-7). The retrieved "
        + "locator is fetched.url; a web-native work's identity is citation.URL.",
    });
  }
}

/** `ERF-15`: references are bare ids and MUST NOT encode location. */
function checkBareIds(refs: string[], id: string, field: string, findings: ConformanceFinding[]): void {
  for (const r of refs) {
    if (/[\\/]|\.md$/i.test(r)) {
      findings.push({
        record: id,
        field,
        detail: `"${r}" encodes a location; references MUST be bare ids (ERF-15)`,
      });
    }
  }
}

/** Day-level instant for stamp ordering; NaN-safe. */
function dayOf(v: unknown): string {
  return String(v ?? "").slice(0, 10);
}

/** `ERF-48`, the statically checkable half: last_modified never precedes
 *  created. Same-day is legal at date precision, which a bare date cannot
 *  order within. */
function checkStampOrder(data: Record<string, unknown>, id: string, findings: ConformanceFinding[]): void {
  const created = (data["created"] as { timestamp?: unknown } | undefined)?.timestamp;
  const modified = (data["last_modified"] as { timestamp?: unknown } | undefined)?.timestamp;
  if (!created || !modified) return;
  if (dayOf(modified) < dayOf(created)) {
    findings.push({
      record: id,
      field: "last_modified",
      detail: `${dayOf(modified)} precedes created ${dayOf(created)}; a change `
        + `MUST set last_modified later than created (ERF-48)`,
    });
  }
}

/**
 * `ERF-36` and `ERF-38`: an id is unique across every record type in the
 * deployment, and a duplicate is rejected rather than absorbed.
 *
 * A `Map.set` on an existing key silently discards the first record, so a
 * duplicated atom id would make one atom vanish and every claim citing it
 * resolve to the survivor. This reports instead, and keeps the record that
 * loaded first so the loss is visible rather than arbitrary.
 */
function setUnique<T>(
  m: Map<string, T>,
  id: string,
  value: T,
  seen: Map<string, string>,
  kind: string,
  findings: ConformanceFinding[],
): void {
  const prior = seen.get(id);
  if (prior !== undefined) {
    findings.push({
      record: id,
      field: "id",
      detail: `duplicate id: already used by an existing ${prior} record, `
        + `repeated by a ${kind} record. Ids are unique across every record `
        + `type in a deployment (ERF-36); the later record is not loaded.`,
    });
    return;
  }
  seen.set(id, kind);
  m.set(id, value);
}

export function loadCorpus(dir: string): LoadedCorpus {
  const findings: ConformanceFinding[] = [];
  /** id -> record type, so a collision across types is caught too. */
  const seenIds = new Map<string, string>();

  // `ERF-54`: find the declaration by what it says it is.
  const files = walkFiles(dir);
  const typed = new Map<string, string>();
  for (const f of files) { const t = fileType(f); if (t) typed.set(f, t); }
  const KNOWN = new Set(["atom", "claim", "survey", "corpus", "sources", "narrative"]);
  const unrecognized = files
    .filter((f) => !KNOWN.has(typed.get(f) ?? ""))
    .map((f) => ({ path: relative(dir, f), type: typed.get(f) ?? null }));
  const declarations = [...typed].filter(([, t]) => t === "corpus").map(([f]) => f);
  if (declarations.length > 1) {
    findings.push({
      record: "(corpus)", field: "type",
      detail: `${declarations.length} files declare type: corpus; exactly one MUST (ERF-54)`,
    });
  }
  const declPath = declarations[0] ?? join(dir, "corpus.yaml");
  const manifest = (existsSync(declPath)
    ? yaml.load(readFileSync(declPath, "utf8"), YAML_OPTS)
    : {}) as CorpusDeclaration;
  for (const f of ["id", "title", "spec_version"]) {
    if (!(manifest as unknown as Record<string, unknown>)[f]) {
      findings.push({
        record: "(declaration)",
        field: f,
        detail: "the manifest MUST declare this field (ERF-59)",
      });
    }
  }
  // `ERF-60`: refuse an unsupported major version openly, never by guessing.
  // This loader implements spec_version major 0; the finding is the refusal
  // said out loud, and the records are still preserved rather than dropped.
  mustBeString("(declaration)", "spec_version", manifest?.spec_version, findings);
  const major = String(manifest?.spec_version ?? "").split(".")[0];
  const minor = Number(String(manifest?.spec_version ?? "").split(".")[1] ?? "0");
  // `ERF-60`: strictness follows the declared version. Under a newer minor,
  // unknown fields are expected content, reported rather than counted.
  const newerMinor = major === "0" && minor > KNOWN_MINOR
    ? { declared: String(manifest.spec_version), fields: [] as ConformanceFinding[] }
    : null;
  const fieldSink: ConformanceFinding[] = newerMinor ? newerMinor.fields : findings;
  if (!newerMinor && existsSync(declPath)) checkSchema(manifest, "(declaration)", findings);
  if (manifest?.spec_version && major !== "0") {
    findings.push({
      record: "(declaration)",
      field: "spec_version",
      detail: `${manifest.spec_version} has major version ${major}; this consumer `
        + `supports major 0 and refuses openly rather than reading fields whose `
        + `meaning may have moved (ERF-60)`,
    });
  }

  /** Read one record file: frontmatter split plus the file-level checks a
   *  parse failure or byte defect surfaces (`ERF-66`, `ERF-67`). Returns
   *  null when the file cannot be split, with the finding recorded. */
  function readRecord(path: string, name: string): { data: Record<string, unknown>; body: string } | null {
    const raw = readFileSync(path, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) {
      findings.push({
        record: name,
        field: "(file)",
        detail: "begins with a byte-order mark; a record file is UTF-8 with "
          + "no BOM (ERF-67)",
      });
    }
    try {
      return splitFrontmatter(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      findings.push({
        record: name,
        field: "(frontmatter)",
        // js-yaml under `json: false` throws on a duplicate key; the graph
        // guard above throws on anchors, aliases, and tags. Both are ERF-66.
        detail: /duplicated mapping key/i.test(msg) || /ERF-66/.test(msg)
          ? `${msg} (ERF-66)`
          : msg,
      });
      return null;
    }
  }

  // ---- atoms -------------------------------------------------------------
  const atoms = new Map<string, Atom>();
  for (const [f, t] of typed) {
    if (t !== "atom") continue;
    const rec = readRecord(f, basename(f, ".md"));
    if (!rec) continue;
    const { data } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "finding", "quote", "source", "source_quality", "created"], findings);
    checkKnownFields(data, id, "atom", fieldSink);
    if (!newerMinor) checkSchema(data, id, findings);
    checkStampOrder(data, id, findings);
    const fa = arr<{ verdict?: unknown }>(data["finding_audit"]);
    // `ERF-12`: the verdict union is compile-time only, and YAML is cast
    // straight through, so a non-verdict loads as a verdict unless checked
    // here. The private corpus this format was extracted from carried 32
    // `PARSE_ERROR` values until they were removed, which is exactly the
    // failure this guards.
    for (const v of fa) {
      if (!VERDICTS.has(String(v?.verdict))) {
        findings.push({
          record: id,
          field: "finding_audit.verdict",
          detail: `${String(v?.verdict)} is not one of ${[...VERDICTS].join(", ")}; `
            + `a failed audit is not a verdict (ERF-12)`,
        });
      }
    }
    mustBeString(id, "as_of_date", data["as_of_date"], findings);
    setUnique(atoms, id, {
      ...(data as unknown as Atom),
      id,
      finding_audit: fa as Atom["finding_audit"],
    }, seenIds, "atom", findings);
  }

  // ---- claims ------------------------------------------------------------
  const claims = new Map<string, Claim>();
  for (const [f, t] of typed) {
    if (t !== "claim") continue;
    const raw = readFileSync(f, "utf8");
    const rec = readRecord(f, basename(f, ".md"));
    if (!rec) continue;
    const { data, body } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "epistemic_kind", "created"], findings);
    checkKnownFields(data, id, "claim", fieldSink);
    if (!newerMinor) checkSchema({ ...data, body }, id, findings);
    checkStampOrder(data, id, findings);
    checkBareIds(arr<string>(data["atoms_for"]), id, "atoms_for", findings);
    checkBareIds(arr<string>(data["atoms_against"]), id, "atoms_against", findings);
    checkBareIds(arr<string>(data["surveys"]), id, "surveys", findings);
    checkBareIds(arr<{ to?: string }>(data["edges"]).map((e) => String(e?.to ?? "")), id, "edges", findings);
    // `ERF-19`: a standing carries a full RFC 3339 instant, never a bare
    // date, because this is the only ordered ledger in the format. Checked
    // on the PARSED entries: under ERF-65's JSON schema a timestamp stays a
    // string, so no raw-text reading is needed. (The previous raw-frontmatter
    // regex only matched flow-style entries, so a block-style standing with a
    // bare date passed unexamined; found by an adversarial fixture from the
    // v0.9 stress battery, lane 4.)
    for (const st of arr<{ timestamp?: unknown; stance?: unknown }>(data["standings"])) {
      // `ERF-41`: a stance outside the vocabulary is reported here and left
      // out of the disposition, so the computation stays total (F-011).
      if (!["for", "against", "withdrawn"].includes(String(st?.stance))) {
        findings.push({
          record: id, field: "standings",
          detail: `stance ${JSON.stringify(st?.stance)} is not for, against or withdrawn; `
            + `reported and left out of the disposition (ERF-41, ERF-55)`,
        });
      }
      const ts = String(st?.timestamp ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ts)) {
        findings.push({
          record: id,
          field: "standings[].timestamp",
          detail: `${ts || "(absent)"} is a bare date; a standing MUST carry a `
            + `full RFC 3339 instant with a time and an offset (ERF-19)`,
        });
      }
    }
    setUnique(claims, id, {
      ...(data as unknown as Claim),
      id,
      families: arr(data["families"]),
      atoms_for: arr(data["atoms_for"]),
      atoms_against: arr(data["atoms_against"]),
      edges: arr(data["edges"]),
      standings: arr(data["standings"]),
      evidence_audit: arr(data["evidence_audit"]),
      body,
    }, seenIds, "claim", findings);
  }

  // ---- surveys -----------------------------------------------------------
  const surveys = new Map<string, Survey>();
  for (const [f, t] of typed) {
    if (t !== "survey") continue;
    const rec = readRecord(f, basename(f, ".md"));
    if (!rec) continue;
    const { data, body } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "conducted"], findings);
    checkKnownFields(data, id, "survey", fieldSink);
    if (!newerMinor) checkSchema({ ...data, body }, id, findings);
    checkStampOrder(data, id, findings);
    for (const [i, act] of arr<Record<string, unknown>>(data["searches"]).entries()) {
      for (const k of ["tool", "query", "scope", "hits_reported"]) {
        mustBeString(id, `searches[${i}].${k}`, act?.[k], findings);
      }
    }
    setUnique(surveys, id, {
      ...(data as unknown as Survey),
      id,
      searches: arr(data["searches"]),
      notable_results: arr(data["notable_results"]),
      body,
    }, seenIds, "survey", findings);
  }

  // ---- narratives --------------------------------------------------------
  const narratives: Narrative[] = [];
  for (const [f, t] of typed) {
    if (t !== "narrative") continue;
    const raw = readFileSync(f, "utf8");
    const { data, body } = splitFrontmatter(raw);
    const bindings: Narrative["bindings"] = [];
    const slug = basename(f, ".md");
    // Recognize first (`ERF-31`), then validate. A candidate that fails the
    // grammar is reported, never skipped.
    for (const c of bindingCandidates(body)) {
      if (!c.terminated) {
        findings.push({
          record: slug, field: "bindings",
          detail: `a narrative binding opens and never closes; its extent is the rest of its line, `
            + `so later bindings stay visible: ${c.text.slice(0, 90)} (ERF-31)`,
        });
        continue;
      }
      const m = bindingRe().exec(c.text);
      if (!m) {
        findings.push({
          record: slug,
          field: "bindings",
          detail: `a narrative binding does not match the grammar and names claims that `
            + `would otherwise vanish from the narrative: ${c.text.slice(0, 90)} (ERF-31)`,
        });
        continue;
      }
      bindings.push({
        claims: (m[1] ?? "").trim().split(/\s+/).filter(Boolean),
        anchor: unescapeAnchor(m[2] ?? ""),
        boundAt: m[3],
        index: c.index,
        end: c.end,
      });
    }
    // `ERF-31`: the keyword is `claims:`; an id resolving to a record of
    // another type is a defect in the narrative, reported at the narrative.
    for (const b of bindings) {
      for (const cid of b.claims) {
        if (!claims.has(cid) && (atoms.has(cid) || surveys.has(cid))) {
          findings.push({ record: slug, field: "bindings", detail: `binds ${cid}, which is not a claim (ERF-31)` });
        }
      }
    }
    // `ERF-34`: the three frontmatter fields, typed (B-36).
    for (const k of ["title", "corpus", "created"]) {
      if (data[k] === undefined) {
        findings.push({ record: slug, field: k, detail: `a narrative MUST carry ${k} in its frontmatter (ERF-34)` });
      }
    }
    const cr = data["created"] as { timestamp?: unknown; by?: unknown } | undefined;
    if (data["created"] !== undefined && (typeof cr !== "object" || cr === null || !cr.timestamp || !cr.by)) {
      findings.push({
        record: slug, field: "created",
        detail: `created is the {timestamp, by} stamp every created thing in this `
          + `format carries, not a bare date (ERF-34, ERF-19)`,
      });
    }
    if (!newerMinor) checkSchema({ ...data, body }, slug, findings);
    narratives.push({
      slug,
      title: String(data["title"] ?? basename(f, ".md")),
      body,
      bindings,
    });
  }

  // ---- edge structure ----------------------------------------------------
  // `ERF-43`: no self-edges; `assumes` and `decomposes-into` admit no
  // cycles. `ERF-44`: a conflicts-with pair is stored once, on one side.
  for (const [id, cl] of claims) {
    for (const e of cl.edges) {
      if (e.to === id) {
        findings.push({
          record: id,
          field: "edges",
          detail: `self-edge (${e.relation}); self-edges MUST NOT exist (ERF-43)`,
        });
      }
      if (e.relation === "conflicts-with") {
        const other = claims.get(e.to);
        const reciprocal = other?.edges.some((b) => b.relation === "conflicts-with" && b.to === id);
        // Report once per pair, on the lexicographically later id, so the
        // finding is deterministic and single.
        if (reciprocal && id > e.to) {
          findings.push({
            record: id,
            field: "edges",
            detail: `conflicts-with ${e.to} is stored on both sides; the pair `
              + `is stored once and the reciprocal derived (ERF-44)`,
          });
        }
      }
    }
  }
  // `ERF-43`: the closure MUST terminate in non-argument leaves. The root is
  // not its own leaf (B-30), so a premise-less argument is `ERF-49`'s flag
  // rather than a violation here.
  for (const [id, cl] of claims) {
    if (cl.epistemic_kind !== "argument") continue;
    const reach = new Set<string>();
    const walk = (from: string): void => {
      for (const e of claims.get(from)?.edges ?? []) {
        if (e.relation === "assumes" && claims.has(e.to) && !reach.has(e.to)) {
          reach.add(e.to); walk(e.to);
        }
      }
      for (const [other, ocl] of claims) {
        if (other === from || reach.has(other)) continue;
        if (ocl.edges.some((e) => e.relation === "supports" && e.to === from)) {
          reach.add(other); walk(other);
        }
      }
    };
    walk(id);
    reach.delete(id);
    const leaves = [...reach].filter((r) => {
      const rc = claims.get(r);
      if (rc?.epistemic_kind !== "argument") return false;
      const hasPremise = rc.edges.some((e) => e.relation === "assumes" && claims.has(e.to))
        || [...claims.values()].some((o) => o.edges.some((e) => e.relation === "supports" && e.to === r));
      return !hasPremise;
    });
    if (leaves.length) {
      findings.push({
        record: id,
        field: "edges",
        detail: `its premise closure terminates in argument leaves that ground `
          + `nothing further (${leaves.join(", ")}); a closure MUST terminate in `
          + `non-argument leaves (ERF-43)`,
      });
    }
  }
  {
    // `ERF-43`: the premise relation admits no cycles. Oriented so that
    // `X assumes Y` and `Y supports X` both say "Y is X's premise", because
    // a cycle in the premise relation, not in the raw edge list, is what
    // makes a chain of premises return to its own argument. `supports` was
    // missing from the prohibition while present in the closure, so two
    // mutually supporting arguments made a literal traversal non-terminating
    // (F-009, found by the Haskell trial by writing the function).
    const premises = new Map<string, Set<string>>();
    const addPremise = (of: string, is: string) => {
      if (!premises.has(of)) premises.set(of, new Set());
      premises.get(of)!.add(is);
    };
    for (const [id, cl] of claims) {
      for (const e of cl.edges) {
        if (!claims.has(e.to)) continue;
        if (e.relation === "assumes") addPremise(id, e.to);
        if (e.relation === "supports") addPremise(e.to, id);
      }
    }
    const findCycles = (next: (id: string) => Iterable<string>, label: string) => {
      const state = new Map<string, 0 | 1 | 2>(); // 1 = on stack, 2 = done
      const visit = (id: string, path: string[]): void => {
        if (state.get(id) === 2) return;
        if (state.get(id) === 1) {
          const cycle = [...path.slice(path.indexOf(id)), id];
          findings.push({
            record: id,
            field: "edges",
            detail: `cycle through ${cycle.join(" -> ")}; ${label} MUST admit no cycles (ERF-43)`,
          });
          return;
        }
        state.set(id, 1);
        for (const to of next(id)) visit(to, [...path, id]);
        state.set(id, 2);
      };
      for (const id of claims.keys()) visit(id, []);
    };
    findCycles((id) => premises.get(id) ?? [], "the premise relation (assumes and supports)");
    findCycles(
      (id) => (claims.get(id)?.edges ?? []).filter((e) => e.relation === "decomposes-into" && claims.has(e.to)).map((e) => e.to),
      "decomposes-into",
    );
  }

  // ---- sources ------------------------------------------------------------
  // `ERF-3`: the source list. A source is not a record: identified by its
  // key here, shared by every atom that quotes it, carrying the work's
  // citation, locator, and capture in one place.
  const sources = new Map<string, Source>();
  for (const [f, t] of typed) {
    if (t !== "sources") continue;
    const doc = yaml.load(readFileSync(f, "utf8"), YAML_OPTS) as { sources?: Record<string, Source> };
    if (!newerMinor) checkSchema(doc, "(sources)", findings);
    // `ERF-70`: a raw file in another format needs its extracting tool
    // named. Judged by the raw file's extension, which is what a validator
    // has. Found missing from this loader by the Rust differential run.
    for (const [sid, src] of Object.entries(doc?.sources ?? {})) {
      const raw = String(src?.received?.path ?? src?.received?.url ?? "");
      const nonText = /\.(pdf|epub|docx?|pptx?|xlsx?|odt|rtf)(\?|#|$)/i.test(raw);
      if (nonText && src?.normalized && !src?.extraction) {
        findings.push({ record: sid, field: "extraction",
          detail: `the raw file is not text (${raw.split("/").pop()}), so the normalized text was produced from another format and the extracting tool and its exact version MUST be named (ERF-70)` });
      }
    }
    for (const [k, v] of Object.entries(doc?.sources ?? {})) sources.set(k, v);
  }

  for (const [sid, src] of sources) {
    // `ERF-7`: a citation identifies a work; a locator retrieves one copy.
    checkCitationText(src as unknown as Record<string, unknown>, sid, findings);
    if (!src.status) {
      findings.push({
        record: sid,
        field: "status",
        detail: "source carries no status; every source records a capture "
          + "or an explicit absence with a reason (ERF-4).",
      });
    } else if (!shipsWithCorpus(src) && !src.reason) {
      findings.push({
        record: sid,
        field: "reason",
        detail: `status ${src.status} carries no reason (ERF-5)`,
      });
    }
  }

  // `ERF-4`: every atom names a source that exists. Explicitness is the
  // rule's point: a validator can tell a recorded absence from an omission
  // and cannot tell an omission from an oversight.
  for (const [id, a] of atoms) {
    if (!a.source) continue; // absence already reported by requireFields
    if (!sources.has(a.source)) {
      findings.push({
        record: id,
        field: "source",
        detail: `names source ${a.source}, which the source list does not `
          + "hold (ERF-4).",
      });
    }
  }

  return { manifest, atoms, claims, surveys, narratives, sources, findings, unrecognized, newerMinor };
}
