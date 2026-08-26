/**
 * Capture: a source's raw bytes, its extracted text, its normalized text,
 * and the digests and tool names a reader needs to re-run the pipeline
 * (ERF-70, ERF-71). HTML is extracted with Readability over a DOM; markdown
 * and plain text are taken as they are. The normalizer is this module's own,
 * named and versioned, and deterministic by construction.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { Refusal, type Corpus } from "./corpus.ts";

export const NORMALIZER = "erf-normalize-ts 0.1.0";
export const EXTRACTOR = "@mozilla/readability 0.6.0 over linkedom 0.18.13, article textContent";

export function sha256(bytes: Buffer | string): string {
  return "sha256:" + createHash("sha256").update(bytes).digest("hex");
}

/** `erf-normalize-ts 0.1.0`: the ordered, deterministic sequence the source entry names. */
export function normalizeText(s: string): string {
  let t = s.normalize("NFC");
  t = t.replace(/\r\n?/g, "\n");
  t = t.replace(/\t/g, " ");
  t = t.replace(/ {2,}/g, " ");
  t = t.replace(/ +$/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/^\n+/, "");
  return t.replace(/\n*$/, "\n");
}

export function extractHtml(html: string, url?: string): { title: string | null; text: string } {
  const { document } = parseHTML(html);
  const article = new Readability(document as unknown as Document).parse();
  if (article && article.textContent && article.textContent.trim()) {
    return { title: article.title ?? null, text: article.textContent };
  }
  // Readability found no article: fall back to the body text, so a plain page still captures.
  const body = document.body?.textContent ?? document.documentElement?.textContent ?? "";
  if (!body.trim()) throw new Refusal(`no text could be extracted from ${url ?? "the page"}`);
  return { title: document.title || null, text: body };
}

export interface Captured {
  rawPath: string;          // corpus-relative
  rawDigest: string;
  normalizedPath: string;   // corpus-relative
  normalizedDigest: string;
  extraction: string | null;
  normalization: string;
  title: string | null;
  bytes: number;
}

function heldPaths(c: Corpus, id: string, ext: string): { raw: string; normalized: string } {
  const rawDir = c.heldDir("raw"), normDir = c.heldDir("normalized");
  mkdirSync(rawDir, { recursive: true }); mkdirSync(normDir, { recursive: true });
  return { raw: join(rawDir, `${id}${ext}`), normalized: join(normDir, `${id}.md`) };
}

export async function captureUrl(c: Corpus, id: string, url: string): Promise<Captured> {
  if (!c.options.fetchEnabled) throw new Refusal("fetching is off for this corpus; give a path to a file you hold, or start the server with --fetch");
  let res: Response;
  try { res = await fetch(url, { headers: { "user-agent": "erf-mcp/0.1 (+https://github.com/francois-b/epistemic-record-format)" }, redirect: "follow" }); }
  catch (e) { throw new Refusal(`fetch failed for ${url}: ${String(e)}`); }
  if (!res.ok) throw new Refusal(`fetch of ${url} returned ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const ctype = res.headers.get("content-type") ?? "";
  const isHtml = /html/i.test(ctype) || /^\s*<!doctype html|^\s*<html/i.test(bytes.subarray(0, 512).toString("utf8"));
  const ext = isHtml ? ".html" : /markdown/i.test(ctype) ? ".md" : /text\/plain/i.test(ctype) ? ".txt" : extname(new URL(url).pathname) || ".bin";
  if (!isHtml && ext === ".bin") throw new Refusal(`${url} is ${ctype || "an unknown type"}; v0 captures HTML, markdown and plain text only`);
  return finish(c, id, ext, bytes, isHtml, url);
}

export function capturePath(c: Corpus, id: string, path: string): Captured {
  const abs = resolve(c.dir, path);
  if (!abs.startsWith(c.dir)) throw new Refusal(`${path} is outside the corpus folder; copy the file into it first`);
  if (!existsSync(abs)) throw new Refusal(`${path} does not exist`);
  const bytes = readFileSync(abs);
  const ext = extname(abs).toLowerCase();
  const isHtml = ext === ".html" || ext === ".htm";
  if (!isHtml && ![".md", ".txt", ".markdown"].includes(ext)) throw new Refusal(`${basename(abs)}: v0 captures HTML, markdown and plain text only`);
  return finish(c, id, isHtml ? ".html" : ext, bytes, isHtml, undefined, abs);
}

function finish(c: Corpus, id: string, ext: string, bytes: Buffer, isHtml: boolean, url?: string, existingRaw?: string): Captured {
  const paths = heldPaths(c, id, ext);
  let rawAbs = paths.raw;
  if (existingRaw && existingRaw.startsWith(c.heldDir("raw"))) rawAbs = existingRaw; // already held: don't duplicate
  else writeFileSync(rawAbs, bytes);
  const asText = bytes.toString("utf8");
  const extracted = isHtml ? extractHtml(asText, url) : { title: null, text: asText };
  const normalized = normalizeText(extracted.text);
  writeFileSync(paths.normalized, normalized, "utf8");
  return {
    rawPath: relative(c.dir, rawAbs),
    rawDigest: sha256(bytes),
    normalizedPath: relative(c.dir, paths.normalized),
    normalizedDigest: sha256(normalized),
    extraction: isHtml ? EXTRACTOR : null,
    normalization: NORMALIZER,
    title: extracted.title,
    bytes: bytes.length,
  };
}
