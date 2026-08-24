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
import { join, basename } from "node:path";
import yaml from "js-yaml";
import type { Atom, Claim, Survey } from "../types/erf.ts";

/** A place where the corpus and the normative model disagree. */
export interface ConformanceFinding {
  record: string;
  field: string;
  detail: string;
}

export interface CaptureEntry {
  status: string;
  path: string | null;
  source?: string;
  reason?: string;
}

export interface Narrative {
  slug: string;
  title: string;
  body: string;
  /** `ERF-31` bindings: claims plus the anchor words. */
  bindings: { claims: string[]; anchor: string; boundAt?: string; index: number }[];
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
  return /<!--\s*claims:\s*([^"]+?)\s*"([^"]*)"(?:\s+bound-at=(\d{4}-\d{2}-\d{2}))?\s*-->/g;
}

export interface CorpusManifest {
  id: string;
  title: string;
  spec_version: string;
  classification: string;
  owner?: string;
}

export interface LoadedCorpus {
  manifest: CorpusManifest;
  atoms: Map<string, Atom>;
  claims: Map<string, Claim>;
  surveys: Map<string, Survey>;
  narratives: Narrative[];
  captures: Map<string, CaptureEntry>;
  findings: ConformanceFinding[];
}

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** `ERF-12`: the three verdicts, and nothing else. A tool failure is not one. */
const VERDICTS = new Set(["SUPPORTED", "PARTIAL", "UNSUPPORTED"]);

/**
 * `ERF-65`, `ERF-66`. The JSON schema is the narrowest YAML 1.2 defines:
 * only null, true, false, and JSON's number grammar leave string-land, so a
 * date-shaped scalar stays a string. The Core schema resolves it to a date,
 * which is how an unquoted timestamp once made a claim's disposition depend
 * on how a weekday name sorts. `json: false` keeps js-yaml throwing on a
 * duplicate key rather than taking the last one.
 */
const YAML_OPTS = { schema: yaml.JSON_SCHEMA, json: false } as const;

/** `ERF-66`: a record is flat and declines anchors, aliases, and tags. */
const YAML_GRAPH = /(^|\s)(&[A-Za-z0-9_-]+|\*[A-Za-z0-9_-]+|!![A-Za-z]+)(\s|$)/;

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

function listDir(dir: string, ext = ".md"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

/**
 * `ERF-55` requires empty lists to be omitted on the wire, while the model
 * types them as total. Every loader therefore has to materialize them, and
 * this is the one place that happens.
 */
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
 * `ERF-36` and `ERF-38`: an id is unique across every record type in the
 * realm, and a duplicate is rejected rather than absorbed.
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
        + `type in a realm (ERF-36); the later record is not loaded.`,
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

  const manifest = yaml.load(readFileSync(join(dir, "corpus.yaml"), "utf8"), YAML_OPTS) as CorpusManifest;
  for (const f of ["id", "title", "spec_version", "classification"]) {
    if (!(manifest as unknown as Record<string, unknown>)[f]) {
      findings.push({
        record: "corpus.yaml",
        field: f,
        detail: "the manifest MUST declare this field (ERF-59)",
      });
    }
  }

  // ---- atoms -------------------------------------------------------------
  const atoms = new Map<string, Atom>();
  for (const f of listDir(join(dir, "atoms"))) {
    const { data } = splitFrontmatter(readFileSync(join(dir, "atoms", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "finding", "quote", "citation_text", "source_quality", "created"], findings);
    const fa = arr<{ verdict?: unknown }>(data["finding_audit"]);
    // `ERF-12`: the verdict union is compile-time only, and YAML is cast
    // straight through, so a non-verdict loads as a verdict unless checked
    // here. The [private-repo alias] corpus carried 32 `PARSE_ERROR` values until they were
    // removed, which is exactly the failure this guards.
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
    setUnique(atoms, id, {
      ...(data as unknown as Atom),
      id,
      finding_audit: fa as Atom["finding_audit"],
    }, seenIds, "atom", findings);
  }

  // ---- claims ------------------------------------------------------------
  const claims = new Map<string, Claim>();
  for (const f of listDir(join(dir, "claims"))) {
    const raw = readFileSync(join(dir, "claims", f), "utf8");
    const { data, body } = splitFrontmatter(raw);
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "epistemic_kind", "created"], findings);
    // `ERF-19`: a standing carries a full RFC 3339 instant, never a bare
    // date, because this is the only ordered ledger in the format. Read from
    // the RAW frontmatter: YAML coerces both forms to a Date, so the parsed
    // value cannot tell a bare date from a full instant.
    const standingsBlock = /^standings:\s*$([\s\S]*?)(?=^\S|\Z)/m.exec(raw)?.[1] ?? "";
    for (const m of standingsBlock.matchAll(/\{\s*timestamp:\s*([^,}]+)/g)) {
      const ts = (m[1] ?? "").trim();
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
  for (const f of listDir(join(dir, "surveys"))) {
    const { data, body } = splitFrontmatter(readFileSync(join(dir, "surveys", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "conducted"], findings);
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
  for (const f of listDir(join(dir, "narratives"))) {
    const raw = readFileSync(join(dir, "narratives", f), "utf8");
    const { data, body } = splitFrontmatter(raw);
    const bindings: Narrative["bindings"] = [];
    const re = bindingRe();
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      bindings.push({
        claims: (m[1] ?? "").trim().split(/\s+/).filter(Boolean),
        anchor: m[2] ?? "",
        boundAt: m[3],
        index: m.index,
      });
    }
    narratives.push({
      slug: basename(f, ".md"),
      title: String(data["title"] ?? basename(f, ".md")),
      body,
      bindings,
    });
  }

  // ---- captures ----------------------------------------------------------
  const captures = new Map<string, CaptureEntry>();
  const capPath = join(dir, "captures.yaml");
  if (existsSync(capPath)) {
    const doc = yaml.load(readFileSync(capPath, "utf8"), YAML_OPTS) as { captures?: Record<string, CaptureEntry> };
    for (const [k, v] of Object.entries(doc?.captures ?? {})) captures.set(k, v);
  }

  // `ERF-4`: every atom has an entry, and an absence is recorded explicitly.
  // The rule exists so a validator can tell a recorded absence from an
  // omission, which is the distinction `resolvable` could not previously make.
  for (const id of atoms.keys()) {
    const cap = captures.get(id);
    if (!cap) {
      findings.push({
        record: id,
        field: "captures.yaml",
        detail: "no entry in the capture mapping. Every atom MUST have one, "
          + "giving a path or an explicit absence with a reason (ERF-4), so "
          + "that an omission is distinguishable from a recorded absence.",
      });
    } else if (cap.status !== "shipped" && !cap.reason) {
      findings.push({
        record: id,
        field: "captures.yaml",
        detail: `capture status ${cap.status} carries no reason (ERF-5)`,
      });
    }
  }

  return { manifest, atoms, claims, surveys, narratives, captures, findings };
}
