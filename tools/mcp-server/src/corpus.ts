/**
 * The corpus the server owns: layout, reading, writing, ids, the research
 * log, git. Every write in the server goes through `writeRecord` or
 * `writeYamlDocument`, which is where the serialization rules are enforced
 * (ERF-65, ERF-67, YAMLB-2, YAMLB-3). Reading and every derived reading are
 * the reference validator's (`loadCorpus`, `compute.ts`): this file never
 * re-implements a rule it can call.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join, relative, resolve } from "node:path";
import yaml from "js-yaml";
import { loadCorpus, splitDocument, type LoadedCorpus } from "../../../validator/yaml-markdown/typescript/corpus.ts";
import type { CorpusDeclaration, Source } from "../../../schema/erf.generated.ts";

export class Refusal extends Error {
  constructor(message: string) { super(message); this.name = "Refusal"; }
}

export interface CorpusOptions {
  dir: string;
  /** `created.by` for records the server writes. */
  agent: string;
  fetchEnabled: boolean;
  commit: boolean;
}

export type Layout = "brain" | "plain";

export interface Corpus {
  dir: string;
  layout: Layout;
  options: CorpusOptions;
  /** Where records of each type are written. */
  recordDir: (type: "atom" | "claim" | "survey") => string;
  heldDir: (kind: "raw" | "normalized") => string;
}

/** YAML 1.2 JSON-schema profile on read (ERF-65). */
export const YAML_LOAD = { schema: yaml.JSON_SCHEMA, json: false } as const;

export function openCorpus(options: CorpusOptions): Corpus {
  const dir = resolve(options.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Refusal(`${dir} is not a directory`);
  const layout: Layout = existsSync(join(dir, "wiki")) ? "brain" : "plain";
  const base = layout === "brain" ? join(dir, "wiki") : dir;
  const held = layout === "brain" ? join(dir, "source") : dir;
  return {
    dir, layout, options,
    recordDir: (type) => join(base, `${type}s`),
    heldDir: (kind) => join(held, kind),
  };
}

export function declarationPath(c: Corpus): string { return join(c.dir, "corpus.yaml"); }
export function sourceListPath(c: Corpus): string { return join(c.dir, "sources.yaml"); }

export function readDeclaration(c: Corpus): CorpusDeclaration {
  const p = declarationPath(c);
  if (!existsSync(p)) throw new Refusal(`no corpus declaration at ${relative(c.dir, p) || "corpus.yaml"}; create one with erf_corpus_init (ERF-54)`);
  return yaml.load(readFileSync(p, "utf8"), YAML_LOAD) as CorpusDeclaration;
}

export function readSourceList(c: Corpus): Record<string, Source> {
  const p = sourceListPath(c);
  if (!existsSync(p)) return {};
  const doc = yaml.load(readFileSync(p, "utf8"), YAML_LOAD) as { type?: string; sources?: Record<string, Source> } | null;
  return doc?.sources ?? {};
}

export function load(c: Corpus): LoadedCorpus { return loadCorpus(c.dir); }

// ---------- serialization (the write path) ----------

/**
 * Frontmatter under YAMLB-2 and ERF-65: keys in the order given, every
 * string scalar quoted, empty lists omitted, `null`/`undefined` omitted,
 * empty mappings kept as `{}` (presence asserts existence).
 */
export function frontmatter(record: Record<string, unknown>): string {
  const clean = prune(record) as Record<string, unknown>;
  return yaml.dump(clean, { quotingType: '"', forceQuotes: true, lineWidth: -1, noRefs: true, sortKeys: false, noCompatMode: true });
}

function prune(v: unknown): unknown {
  if (Array.isArray(v)) {
    const items = v.map(prune).filter((x) => x !== undefined);
    return items.length ? items : undefined;
  }
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined || val === null) continue;
      const p = prune(val);
      if (p === undefined && !(val && typeof val === "object" && !Array.isArray(val))) continue;
      out[k] = p === undefined ? {} : p;
    }
    return out;
  }
  return v;
}

/** One record file per YAMLB-3: fence, frontmatter, fence, body. */
export function recordText(fm: Record<string, unknown>, body: string | null): string {
  const head = `---\n${frontmatter(fm)}---\n`;
  if (body === null || body === "") return head;
  return `${head}\n${body.replace(/\r\n?/g, "\n").replace(/\n+$/, "")}\n`;
}

export function writeRecord(c: Corpus, type: "atom" | "claim" | "survey", id: string, fm: Record<string, unknown>, body: string | null): string {
  const dir = c.recordDir(type);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.md`);
  writeFileSync(path, recordText(fm, body), "utf8");
  return path;
}

export function writeYamlDocument(path: string, doc: Record<string, unknown>): void {
  writeFileSync(path, frontmatter(doc), "utf8");
}

/** Read one record file back as frontmatter + body (for updates). */
export function readRecordFile(path: string): { fm: Record<string, unknown>; body: string } {
  const split = splitDocument(readFileSync(path, "utf8"));
  if (split === null || typeof split === "string") throw new Refusal(`${basename(path)}: ${split ?? "no frontmatter"} (YAMLB-3)`);
  return { fm: (yaml.load(split.fm, YAML_LOAD) as Record<string, unknown>) ?? {}, body: split.body };
}

/** Every markdown file in the corpus that carries the given `type`, with its path. */
export function recordFiles(c: Corpus, type: string): Map<string, string> {
  const out = new Map<string, string>();
  const visit = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) { visit(p); continue; }
      if (!/\.md$/i.test(e.name)) continue;
      const split = splitDocument(readFileSync(p, "utf8"));
      if (split === null || typeof split === "string") continue;
      const t = /^type:\s*["']?([a-z-]+)["']?\s*$/m.exec(split.fm)?.[1];
      if (t !== type) continue;
      const id = /^id:\s*["']?([^"'\n]+)["']?\s*$/m.exec(split.fm)?.[1] ?? basename(p, ".md");
      out.set(id, p);
    }
  };
  visit(c.dir);
  return out;
}

// ---------- ids ----------

export function atomPrefix(decl: CorpusDeclaration): string {
  const x = (decl as unknown as Record<string, unknown>)["x_atom_prefix"];
  if (typeof x === "string" && x) return x;
  return String(decl.id).split(/[-_]/).map((w) => w[0] ?? "").join("").toLowerCase() || "atom";
}

export function nextAtomId(c: Corpus, decl: CorpusDeclaration): string {
  const prefix = atomPrefix(decl);
  let max = 0;
  for (const id of recordFiles(c, "atom").keys()) {
    const m = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function idInUse(c: Corpus, id: string): boolean {
  for (const t of ["atom", "claim", "survey"]) if (recordFiles(c, t).has(id)) return true;
  return false;
}

// ---------- stamps ----------

export const today = (): string => new Date().toISOString().slice(0, 10);
export const now = (): string => new Date().toISOString();

// ---------- the research log ----------

export interface LogEntry {
  ts: string;
  kind: "search" | "fetch";
  tool: string;
  query?: string;
  hits_reported?: string;
  scope?: string;
  url?: string;
  path?: string;
  source?: string;
}

export function logPath(c: Corpus): string { return join(c.dir, "research-log.jsonl"); }

export function appendLog(c: Corpus, entry: Omit<LogEntry, "ts">): LogEntry {
  const full: LogEntry = { ts: now(), ...entry };
  appendFileSync(logPath(c), JSON.stringify(full) + "\n", "utf8");
  return full;
}

export function readLog(c: Corpus): LogEntry[] {
  const p = logPath(c);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as LogEntry);
}

// ---------- git ----------

export function commit(c: Corpus, paths: string[], message: string): string | null {
  if (!c.options.commit) return null;
  if (!existsSync(join(c.dir, ".git"))) return null;
  try {
    execFileSync("git", ["-C", c.dir, "add", "--", ...paths.map((p) => relative(c.dir, p))], { stdio: "pipe" });
    execFileSync("git", ["-C", c.dir, "commit", "-q", "-m", `erf-mcp: ${message}`], { stdio: "pipe" });
    return execFileSync("git", ["-C", c.dir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch (e) {
    return `commit failed: ${String((e as { stderr?: Buffer }).stderr ?? e).slice(0, 200)}`;
  }
}
