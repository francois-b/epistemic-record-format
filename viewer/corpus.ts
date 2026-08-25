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
import type { Atom, Claim, Survey, CaptureEntry, CorpusManifest } from "../types/erf.ts";

export type { CaptureEntry, CorpusManifest };

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
 * date-shaped scalar stays a string. Legacy defaults (YAML 1.1's timestamp
 * type, still in many libraries' default schema) resolve it to a date,
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

/**
 * A capture that ships, on either basis: under a licence (`shipped`) or as a
 * short quotation under none (`shipped-as-quotation`). The two are separate
 * statuses because the permission differs and `ERF-68` requires the entry to
 * say which; nothing downstream of the permission cares, so every reader asks
 * this question instead of comparing to a literal.
 */
export const shipsWithCorpus = (cap: { status: string } | undefined): boolean =>
  cap?.status === "shipped" || cap?.status === "shipped-as-quotation";

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
 * The defined field roster per record type (section 3). `ERF-55`: a
 * producer MUST NOT originate a field the declared version does not
 * define, so an unknown key is a producer error, reported here and still
 * preserved in the loaded record (`ERF-57`): strict producers, tolerant
 * consumers, and this loader plays both roles.
 */
export const KNOWN_FIELDS: Record<string, Set<string>> = {
  atom: new Set(["id", "type", "corpus", "finding", "quote", "citation_text",
    "citation", "fetched_url", "source_quality", "as_of_date", "limitations",
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
        + "locator is fetched_url; a web-native work's identity is citation.URL.",
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
  // `ERF-60`: refuse an unsupported major version openly, never by guessing.
  // This loader implements spec_version major 1; the finding is the refusal
  // said out loud, and the records are still preserved rather than dropped.
  const major = String(manifest?.spec_version ?? "").split(".")[0];
  if (manifest?.spec_version && major !== "1") {
    findings.push({
      record: "corpus.yaml",
      field: "spec_version",
      detail: `${manifest.spec_version} has major version ${major}; this consumer `
        + `supports major 1 and refuses openly rather than reading fields whose `
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
  for (const f of listDir(join(dir, "atoms"))) {
    const rec = readRecord(join(dir, "atoms", f), basename(f, ".md"));
    if (!rec) continue;
    const { data } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "finding", "quote", "citation_text", "source_quality", "created"], findings);
    checkKnownFields(data, id, "atom", findings);
    checkCitationText(data, id, findings);
    checkStampOrder(data, id, findings);
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
    const rec = readRecord(join(dir, "claims", f), basename(f, ".md"));
    if (!rec) continue;
    const { data, body } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "epistemic_kind", "created"], findings);
    checkKnownFields(data, id, "claim", findings);
    checkStampOrder(data, id, findings);
    checkBareIds(arr<string>(data["atoms_for"]), id, "atoms_for", findings);
    checkBareIds(arr<string>(data["atoms_against"]), id, "atoms_against", findings);
    checkBareIds(arr<string>(data["surveys"]), id, "surveys", findings);
    checkBareIds(arr<{ to?: string }>(data["edges"]).map((e) => String(e?.to ?? "")), id, "edges", findings);
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
    const rec = readRecord(join(dir, "surveys", f), basename(f, ".md"));
    if (!rec) continue;
    const { data, body } = rec;
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "conducted"], findings);
    checkKnownFields(data, id, "survey", findings);
    checkStampOrder(data, id, findings);
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
  {
    const acyclic = new Set(["assumes", "decomposes-into"]);
    const state = new Map<string, 0 | 1 | 2>(); // 1 = on stack, 2 = done
    const visit = (id: string, path: string[]): void => {
      if (state.get(id) === 2) return;
      if (state.get(id) === 1) {
        const cycle = [...path.slice(path.indexOf(id)), id];
        findings.push({
          record: id,
          field: "edges",
          detail: `cycle through ${cycle.join(" -> ")}; assumes and `
            + `decomposes-into MUST admit no cycles (ERF-43)`,
        });
        return;
      }
      state.set(id, 1);
      for (const e of claims.get(id)?.edges ?? []) {
        if (acyclic.has(e.relation) && claims.has(e.to)) visit(e.to, [...path, id]);
      }
      state.set(id, 2);
    };
    for (const id of claims.keys()) visit(id, []);
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
    } else if (!shipsWithCorpus(cap) && !cap.reason) {
      findings.push({
        record: id,
        field: "captures.yaml",
        detail: `capture status ${cap.status} carries no reason (ERF-5)`,
      });
    }
  }

  return { manifest, atoms, claims, surveys, narratives, captures, findings };
}
