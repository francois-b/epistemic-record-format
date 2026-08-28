/**
 * The version id of a render: the first five hex characters of a SHA-256
 * over the canonical bytes of every record file the render reads, sorted
 * by path. Two renders of the same records give the same id, at any path
 * and on any day; any change to any record changes it. A content hash is
 * the version id of a built artifact, which is how the author's published
 * documents are versioned, and a reader holding two copies can tell which
 * is which by reading the corner of the page.
 *
 * What is hashed: the atoms, claims, surveys and narratives (found by
 * their `type`, as the loader finds them), the source list, and the cuts.
 * What is not: the corpus declaration (not a record: nobody asserts it),
 * the normalized texts (a capture's bytes are already pinned by the digest
 * the source list carries), the research trail, and anything the loader
 * does not recognize. Canonical bytes means the file's text with a byte
 * order mark dropped and line endings folded to LF, so a checkout that
 * rewrote line endings still renders the same id.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileType, walkFiles } from "@epistemic-record-format/yaml-markdown";

const RECORD_TYPES = new Set(["atom", "claim", "survey", "narrative", "sources"]);

/** Every record file a render reads, as paths relative to the corpus with `/` separators, sorted. */
export function recordFiles(corpusDir: string): string[] {
  const files = walkFiles(corpusDir).filter((f) => RECORD_TYPES.has(fileType(f) ?? ""));
  const cuts = join(corpusDir, "cuts");
  if (existsSync(cuts)) for (const f of readdirSync(cuts)) if (/\.ya?ml$/.test(f)) files.push(join(cuts, f));
  return [...new Set(files.map((f) => relative(corpusDir, f).split(sep).join("/")))].sort();
}

/** A file's canonical bytes: byte order mark dropped, line endings LF. */
export function canonicalBytes(raw: Buffer): Buffer {
  let text = raw.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
}

/** The version id of a corpus as it would render now. */
export function versionId(corpusDir: string): string {
  const h = createHash("sha256");
  for (const rel of recordFiles(corpusDir)) {
    h.update(rel); h.update("\0");
    h.update(canonicalBytes(readFileSync(join(corpusDir, rel)))); h.update("\0");
  }
  return h.digest("hex").slice(0, 5);
}
