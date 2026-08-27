/**
 * Reading the YAML/Markdown serialization: the fence (YAMLB-3), the
 * frontmatter under YAML 1.2's JSON profile with the features ERF-66
 * declines (anchors, aliases, tags, duplicate keys) refused, the walk over a
 * corpus folder, and the narrative-binding marker (YAMLB-1). Nothing here
 * judges a record; it turns bytes into documents and passages into
 * candidates. Validation is validate.ts; the readings are compute.ts;
 * writing is write.ts.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

/**
 * The narrative-binding grammar of `ERF-31`, in one place.
 *
 * Groups: 1 the ids, 2 the anchor, 3 `bound-at`, a date or an RFC 3339 instant.
 *
 * This is a function rather than a constant because a `/g` regex carries
 * `lastIndex` between uses, so sharing one object across call sites makes
 * matches disappear intermittently. It exists at all because the grammar was
 * implemented twice: the parser here gained `bound-at` and the renderer's copy
 * did not, so every binding in the corpus stopped matching there and six raw
 * comments leaked into the page. One grammar, one definition.
 */
export function bindingRe(): RegExp {
  return /<!--\s*claims:\s*([^"<>]+?)\s*"((?:[^"\\]|\\.)+)"\s+bound-at=(\d{4}-\d{2}-\d{2}(?:T[0-9:.Z+\-]+)?)\s*-->/g;
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
 * `YAMLB-3`: a document is an opening `---` line, YAML lines, and the first
 * later line that is exactly `---`; the body is what follows, with leading
 * and trailing line breaks removed. `...` is not a fence. CRLF is tolerated
 * here and reported under `ERF-67`; a missing final LF at end of file is
 * accepted, as the rule says a reader should. Returns null when the file
 * does not open with a fence (not a document), and a string naming the
 * defect when it opens with one and fails the grammar.
 */
export function splitDocument(text: string): { fm: string; body: string } | null | string {
  const lines = text.split(/(?<=\n)/);
  if (!/^---\r?\n$/.test(lines[0] ?? "") && (lines[0] ?? "") !== "---") return null;
  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] ?? "").replace(/\r?\n$/, "");
    if (line === "---") {
      const body = lines.slice(i + 1).join("").replace(/^(\r?\n)+/, "").replace(/(\r?\n)+$/, "");
      return { fm: lines.slice(1, i).join(""), body };
    }
  }
  const dots = lines.some((l, i) => i > 0 && l.replace(/\r?\n$/, "") === "...");
  return dots
    ? "the frontmatter is closed with `...`, which is not a fence; a document closes at the first line that is exactly `---` (YAMLB-3)"
    : "the frontmatter opens with `---` and no later line is exactly `---`, so the document never closes (YAMLB-3)";
}

/** `ERF-12`: the three verdicts, and nothing else. A tool failure is not one. */
/**
 * `ERF-65`, `ERF-66`. The JSON schema is the narrowest YAML 1.2 defines:
 * only null, true, false, and JSON's number grammar leave string-land, so a
 * date-shaped scalar stays a string. Legacy defaults (YAML 1.1's timestamp
 * type, still in many libraries' default schema) resolve it to a date,
 * which is how an unquoted timestamp once made a claim's disposition depend
 * on how a weekday name sorts. `json: false` keeps js-yaml throwing on a
 * duplicate key rather than taking the last one.
 */
export const YAML_OPTS = { schema: yaml.JSON_SCHEMA, json: false } as const;
const YAML_GRAPH = /(^\s*(?:[\w.-]+:|-)\s+|[\[{,]\s*)(&[A-Za-z0-9_-]+|\*[A-Za-z0-9_-]+|!![A-Za-z]+)(\s|$|[,\]}])/m;

export function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const split = splitDocument(text);
  if (split === null) throw new Error("no YAML frontmatter");
  if (typeof split === "string") throw new Error(split);
  const raw = split.fm;
  if (YAML_GRAPH.test(raw)) {
    throw new Error(
      "frontmatter uses a YAML anchor, alias, or explicit tag; a record is a "
      + "flat structure and declines all three (ERF-66)",
    );
  }
  const data = (yaml.load(raw, YAML_OPTS) ?? {}) as Record<string, unknown>;
  return { data, body: split.body };
}

/**
 * `ERF-54`: discovery is by content, never by filename or directory. Walk
 * everything, read each file's `type`, dispatch on it. A file with no
 * `type` is not part of the corpus: ignored, and reported (`ERF-57`).
 *
 * This is what keeps the format out of a substrate's business. A store
 * arranges its files however it likes; what travels is a set of
 * self-describing documents, and where they sit carries nothing.
 */
export function walkFiles(dir: string): string[] {
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
export function fileType(path: string): string | null {
  try {
    const raw = readFileSync(path, "utf8");
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const split = /\.ya?ml$/i.test(path) ? null : splitDocument(text);
    const fm = /\.ya?ml$/i.test(path) ? text : (typeof split === "object" && split ? split.fm : "");
    const m = /^type:\s*["']?([a-z-]+)["']?\s*$/m.exec(fm);
    return m?.[1] ?? null;
  } catch { return null; }
}


export function listDir(dir: string, ext = ".md"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

