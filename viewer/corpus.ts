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
import type { Atom, Claim, Question, Survey } from "../types/erf.ts";

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
  /** `ERF-4.25` bindings: claims plus the anchor words. */
  bindings: { claims: string[]; anchor: string; index: number }[];
}

export interface CorpusManifest {
  id: string;
  title: string;
  spec_version: string;
  classification: string;
  owner?: string;
  policy?: Record<string, string>;
}

export interface LoadedCorpus {
  manifest: CorpusManifest;
  atoms: Map<string, Atom>;
  claims: Map<string, Claim>;
  questions: Map<string, Question>;
  surveys: Map<string, Survey>;
  narratives: Narrative[];
  captures: Map<string, CaptureEntry>;
  findings: ConformanceFinding[];
}

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const m = FM.exec(text);
  if (!m) throw new Error("no YAML frontmatter");
  const data = (yaml.load(m[1] ?? "") ?? {}) as Record<string, unknown>;
  return { data, body: (m[2] ?? "").trim() };
}

function listDir(dir: string, ext = ".md"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

/**
 * `ERF-7.4` requires empty lists to be omitted on the wire, while the model
 * types them as total. Every loader therefore has to materialize them, and
 * this is the one place that happens.
 */
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Fields whose absence is a genuine defect.
 *
 * List-typed fields are deliberately NOT checked here. `ERF-7.4` omits an
 * empty list from the file and `ERF-7.4a` has the reader materialize it, so
 * an omitted list is a complete record rather than a partial one. Checking
 * them here was this viewer applying the file rule to the in-memory type,
 * which is what produced 28 spurious divergences and, in the reporting, the
 * question the specification then answered.
 */
function requireFields(
  data: Record<string, unknown>,
  id: string,
  fields: string[],
  findings: ConformanceFinding[],
): void {
  for (const f of fields) {
    if (data[f] === undefined || data[f] === null || data[f] === "") {
      findings.push({
        record: id,
        field: f,
        detail: "required by the data model, absent in the record",
      });
    }
  }
}

export function loadCorpus(dir: string): LoadedCorpus {
  const findings: ConformanceFinding[] = [];

  const manifest = yaml.load(readFileSync(join(dir, "corpus.yaml"), "utf8")) as CorpusManifest;

  // ---- atoms -------------------------------------------------------------
  const atoms = new Map<string, Atom>();
  for (const f of listDir(join(dir, "atoms"))) {
    const { data } = splitFrontmatter(readFileSync(join(dir, "atoms", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "finding", "quote", "citation_text", "source_quality", "created"], findings);
    atoms.set(id, {
      ...(data as unknown as Atom),
      id,
      finding_audit: arr(data["finding_audit"]),
    });
  }

  // ---- claims ------------------------------------------------------------
  const claims = new Map<string, Claim>();
  for (const f of listDir(join(dir, "claims"))) {
    const { data, body } = splitFrontmatter(readFileSync(join(dir, "claims", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "epistemic_kind", "created"], findings);
    claims.set(id, {
      ...(data as unknown as Claim),
      id,
      families: arr(data["families"]),
      atoms_for: arr(data["atoms_for"]),
      atoms_against: arr(data["atoms_against"]),
      bears_on: arr(data["bears_on"]),
      edges: arr(data["edges"]),
      standings: arr(data["standings"]),
      evidence_audit: arr(data["evidence_audit"]),
      body,
    });
  }

  // ---- questions ---------------------------------------------------------
  const questions = new Map<string, Question>();
  for (const f of listDir(join(dir, "questions"))) {
    const { data, body } = splitFrontmatter(readFileSync(join(dir, "questions", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "status", "created"], findings);
    questions.set(id, {
      ...(data as unknown as Question),
      id,
      families: arr(data["families"]),
      sub_questions: arr(data["sub_questions"]),
      answered_by: arr(data["answered_by"]),
      body,
    });
  }

  // ---- surveys -----------------------------------------------------------
  const surveys = new Map<string, Survey>();
  for (const f of listDir(join(dir, "surveys"))) {
    const { data, body } = splitFrontmatter(readFileSync(join(dir, "surveys", f), "utf8"));
    const id = String(data["id"] ?? basename(f, ".md"));
    requireFields(data, id, ["id", "type", "corpus", "title", "conducted"], findings);
    surveys.set(id, {
      ...(data as unknown as Survey),
      id,
      searches: arr(data["searches"]),
      notable_results: arr(data["notable_results"]),
      body,
    });
  }

  // ---- narratives --------------------------------------------------------
  const narratives: Narrative[] = [];
  for (const f of listDir(join(dir, "narratives"))) {
    const raw = readFileSync(join(dir, "narratives", f), "utf8");
    const { data, body } = splitFrontmatter(raw);
    const bindings: Narrative["bindings"] = [];
    const re = /<!--\s*claims:\s*([^"]+?)\s*"([^"]*)"\s*-->/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      bindings.push({
        claims: (m[1] ?? "").trim().split(/\s+/).filter(Boolean),
        anchor: m[2] ?? "",
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
    const doc = yaml.load(readFileSync(capPath, "utf8")) as { captures?: Record<string, CaptureEntry> };
    for (const [k, v] of Object.entries(doc?.captures ?? {})) captures.set(k, v);
  }

  return { manifest, atoms, claims, questions, surveys, narratives, captures, findings };
}
