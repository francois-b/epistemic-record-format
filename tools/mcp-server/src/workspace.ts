/**
 * The workspace: one or more root folders, the corpora found under them by
 * their declarations (ERF-54: discovery by content, never by path), and the
 * corpus the session is working on. Every tool resolves its corpus here.
 */
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve, relative, isAbsolute, dirname } from "node:path";
import { homedir } from "node:os";
import yaml from "js-yaml";
import { openCorpus, Refusal, YAML_LOAD, type Corpus, type CorpusOptions } from "./corpus.ts";
import type { CorpusDeclaration } from "../../../schema/erf.generated.ts";

export interface Found { id: string; dir: string; decl: CorpusDeclaration }

export interface Workspace {
  roots: string[];
  options: Omit<CorpusOptions, "dir">;
  active: string | null;
}

const SKIP = new Set([".git", "node_modules", ".isomorphic", "raw", "normalized", "site", "build", "dist", "target"]);
const MAX_DEPTH = 3;

export function openWorkspace(roots: string[], options: Omit<CorpusOptions, "dir">): Workspace {
  const abs = roots.map((r) => resolve(r));
  for (const r of abs) if (!existsSync(r) || !statSync(r).isDirectory()) throw new Refusal(`${r} is not a directory`);
  const ws: Workspace = { roots: abs, options, active: null };
  const found = discover(ws);
  if (found.size === 1) ws.active = [...found.keys()][0]!;
  else { const kept = readActive(ws); if (kept && found.has(kept)) ws.active = kept; }
  return ws;
}

/** The active corpus is kept on disk, per set of roots, so it holds across server processes: a host may start
 *  one server per turn or per worker (Cowork did, 2026-08-27, and lost the choice between two calls). The file
 *  is the truth; the in-memory field is a cache. ERF_STATE_FILE overrides the location (tests). */
function stateFile(): string { return process.env["ERF_STATE_FILE"] ?? join(homedir(), ".erf", "active.json"); }
function readState(): Record<string, string> {
  try { return JSON.parse(readFileSync(stateFile(), "utf8")) as Record<string, string>; } catch { return {}; }
}
function readActive(ws: Workspace): string | null { return readState()[ws.roots.join("|")] ?? null; }
function writeActive(ws: Workspace, id: string): void {
  const f = stateFile();
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify({ ...readState(), [ws.roots.join("|")]: id }, null, 2) + "\n", "utf8");
}

/** Every folder under the roots (to a small depth) whose corpus.yaml declares `type: corpus`. */
export function discover(ws: Workspace): Map<string, Found> {
  const out = new Map<string, Found>();
  const dupes: string[] = [];
  const visit = (dir: string, depth: number) => {
    const decl = join(dir, "corpus.yaml");
    if (existsSync(decl)) {
      try {
        const d = yaml.load(readFileSync(decl, "utf8"), YAML_LOAD) as CorpusDeclaration | null;
        if (d && d.type === "corpus" && d.id) {
          if (out.has(String(d.id))) dupes.push(`${d.id} (${out.get(String(d.id))!.dir} and ${dir})`);
          else out.set(String(d.id), { id: String(d.id), dir, decl: d });
          return; // a corpus does not nest corpora
        }
      } catch { /* not a declaration; keep walking */ }
    }
    if (depth >= MAX_DEPTH) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith(".") || SKIP.has(e.name)) continue;
      visit(join(dir, e.name), depth + 1);
    }
  };
  for (const r of ws.roots) visit(r, 0);
  if (dupes.length) throw new Refusal(`two corpora declare the same id, which a deployment forbids (ERF-36): ${dupes.join("; ")}`);
  return out;
}

/** The corpus a call addresses: the `corpus` argument, else the active one, else the only one. */
export function resolveCorpus(ws: Workspace, id?: string): Corpus & { id: string } {
  const found = discover(ws);
  if (!id && found.size > 1) { const kept = readActive(ws); if (kept && found.has(kept)) ws.active = kept; }
  const want = id ?? ws.active ?? (found.size === 1 ? [...found.keys()][0]! : null);
  if (!want) {
    throw new Refusal(found.size === 0
      ? `no corpus under ${ws.roots.join(", ")}; create one with erf_corpus_init`
      : `${found.size} corpora here and none active; call erf_corpus_use with one of: ${[...found.keys()].join(", ")}`);
  }
  const f = found.get(want);
  if (!f) throw new Refusal(`no corpus with id ${want}; known: ${[...found.keys()].join(", ") || "none"}`);
  return { ...openCorpus({ dir: f.dir, ...ws.options }), id: f.id };
}

export function useCorpus(ws: Workspace, id: string): Found {
  const f = discover(ws).get(id);
  if (!f) throw new Refusal(`no corpus with id ${id}; known: ${[...discover(ws).keys()].join(", ") || "none"}`);
  ws.active = id;
  writeActive(ws, id);
  return f;
}

/** A folder for a new corpus: relative to the first root, or absolute and inside a root. */
export function newCorpusDir(ws: Workspace, folder: string): string {
  const dir = isAbsolute(folder) ? resolve(folder) : resolve(ws.roots[0]!, folder);
  if (!ws.roots.some((r) => dir === r || dir.startsWith(r + "/"))) throw new Refusal(`${folder} is outside the workspace roots (${ws.roots.join(", ")})`);
  if (existsSync(join(dir, "corpus.yaml"))) throw new Refusal(`${relative(ws.roots[0]!, dir) || basename(dir)} already holds a corpus declaration`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function describe(ws: Workspace): string {
  const found = discover(ws);
  if (!found.size) return `no corpora under ${ws.roots.join(", ")}`;
  return [...found.values()].map((f) => `${f.id === ws.active ? "* " : "  "}${f.id}  "${f.decl.title}"  owner ${String(f.decl.owner ?? "(none)")}  ${f.dir}`).join("\n")
    + (ws.active ? `\n(* active)` : `\n(none active: erf_corpus_use <id>)`);
}
