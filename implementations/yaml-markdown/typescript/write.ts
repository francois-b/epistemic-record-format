/**
 * Writing the YAML/Markdown serialization: frontmatter under ERF-65 and
 * YAMLB-2 (every string scalar quoted, empty lists omitted, a present-and-
 * empty mapping written as `{}`), and the record file under YAMLB-3 (fence,
 * frontmatter, fence, body). The one serializer any TypeScript producer
 * should use; the conformance suite checks it by round trip through
 * validate.ts. Where a record goes is the producer's business, so this file
 * takes text and returns text.
 */
import yaml from "js-yaml";

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


/** A YAML document with no body (the declaration, the source list). */
export function yamlDocument(doc: Record<string, unknown>): string {
  return frontmatter(doc);
}
