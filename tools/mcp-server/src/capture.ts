/**
 * Capture: a source's raw bytes, its extracted text, its normalized text,
 * and the digests and tool names a reader needs to re-run the pipeline
 * (ERF-70, ERF-71). HTML is extracted with Readability over a DOM; a PDF's
 * text layer is read page by page with unpdf and joined with page markers;
 * markdown and plain text are taken as they are. The normalizer is this module's own,
 * named and versioned, and deterministic by construction.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { extractText } from "unpdf";
import { normalizeForCheck, findWholeWords } from "@epistemic-record-format/yaml-markdown";
import { Refusal, type Corpus } from "./corpus.ts";

export const NORMALIZER = "erf-normalize-ts 0.1.0";
export const EXTRACTOR = "@mozilla/readability 0.6.0 over linkedom 0.18.13, article textContent";
export const PDF_EXTRACTOR = "unpdf 1.8.1 (pdfjs serverless build), text per page, page markers";

/**
 * A page marker: one line between the pages of a PDF's extracted text. An HTML
 * comment, because the quote check folds CommonMark to plain text and an HTML
 * block contributes nothing (ERF-51 step 1), so the marker can never match a
 * word of a quote, and a page break separates blocks the way a blank line does.
 */
export const PAGE_MARKER_RE = /^<!-- erf:page (\d+) -->$/m;
export const pageMarker = (n: number): string => `<!-- erf:page ${n} -->`;
export const hasPageMarkers = (normalized: string): boolean => PAGE_MARKER_RE.test(normalized);

/** The pages of a PDF, one string each, joined with markers. Refused when no page has a text layer. */
export async function extractPdf(bytes: Buffer, what: string): Promise<{ text: string; pages: number }> {
  let pages: string[];
  try {
    const r = await extractText(new Uint8Array(bytes), { mergePages: false });
    pages = Array.isArray(r.text) ? r.text : [String(r.text)];
  } catch (e) { throw new Refusal(`${what}: the PDF could not be read (${String(e).slice(0, 120)})`); }
  if (!pages.some((t) => t.trim())) throw new Refusal(`${what}: the PDF has no text layer (a scanned image, or text drawn as outlines); OCR is not done, so no quote could ever check against it`);
  const text = pages.map((t, i) => `${pageMarker(i + 1)}\n\n${t.trim()}`).join("\n\n") + "\n";
  return { text, pages: pages.length };
}

/**
 * The page a quote starts on, read from the markers in a held text: the first
 * page whose folded text holds the quote's first segment as whole words, or
 * null when the text carries no markers or the segment is not found.
 */
export function pageOfQuote(normalized: string, quote: string): number | null {
  if (!hasPageMarkers(normalized)) return null;
  const first = quote.split("[...]")[0]!.trim();
  if (!first) return null;
  const q = normalizeForCheck(first);
  const parts = normalized.split(/^<!-- erf:page (\d+) -->$/m);
  // parts: [before, "1", page1, "2", page2, ...]
  for (let i = 1; i + 1 < parts.length; i += 2) {
    if (findWholeWords(normalizeForCheck(parts[i + 1]!), q, 0) >= 0) return Number(parts[i]);
  }
  return null;
}

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
  const head = bytes.subarray(0, 512).toString("latin1");
  const isPdf = /pdf/i.test(ctype) || head.startsWith("%PDF-");
  const isHtml = !isPdf && (/html/i.test(ctype) || /^\s*<!doctype html|^\s*<html/i.test(head));
  const ext = isPdf ? ".pdf" : isHtml ? ".html" : /markdown/i.test(ctype) ? ".md" : /text\/plain/i.test(ctype) ? ".txt" : null;
  if (!ext) throw new Refusal(`${url} is ${ctype || "an unknown type"}; the capturer takes HTML, markdown, plain text and PDF. For a paper, capture its PDF or its HTML edition`);
  return finish(c, id, ext, bytes, isPdf ? "pdf" : isHtml ? "html" : "text", url);
}

export async function capturePath(c: Corpus, id: string, path: string): Promise<Captured> {
  const abs = resolve(c.dir, path);
  if (!abs.startsWith(c.dir)) throw new Refusal(`${path} is outside the corpus folder; copy the file into it first`);
  if (!existsSync(abs)) throw new Refusal(`${path} does not exist`);
  const bytes = readFileSync(abs);
  const ext = extname(abs).toLowerCase();
  const isPdf = ext === ".pdf" || bytes.subarray(0, 5).toString("latin1") === "%PDF-";
  const isHtml = !isPdf && (ext === ".html" || ext === ".htm");
  if (!isPdf && !isHtml && ![".md", ".txt", ".markdown"].includes(ext)) throw new Refusal(`${basename(abs)}: the capturer takes HTML, markdown, plain text and PDF`);
  return finish(c, id, isPdf ? ".pdf" : isHtml ? ".html" : ext, bytes, isPdf ? "pdf" : isHtml ? "html" : "text", undefined, abs);
}

type Kind = "html" | "pdf" | "text";

async function finish(c: Corpus, id: string, ext: string, bytes: Buffer, kind: Kind, url?: string, existingRaw?: string): Promise<Captured> {
  // extract before anything is written, so a PDF with no text layer leaves nothing behind
  const extracted = kind === "html" ? extractHtml(bytes.toString("utf8"), url)
    : kind === "pdf" ? { title: null, text: (await extractPdf(bytes, url ?? basename(existingRaw ?? id))).text }
    : { title: null, text: bytes.toString("utf8") };
  const paths = heldPaths(c, id, ext);
  let rawAbs = paths.raw;
  if (existingRaw && existingRaw.startsWith(c.heldDir("raw"))) rawAbs = existingRaw; // already held: don't duplicate
  else writeFileSync(rawAbs, bytes);
  const normalized = normalizeText(extracted.text);
  writeFileSync(paths.normalized, normalized, "utf8");
  return {
    rawPath: relative(c.dir, rawAbs),
    rawDigest: sha256(bytes),
    normalizedPath: relative(c.dir, paths.normalized),
    normalizedDigest: sha256(normalized),
    extraction: kind === "html" ? EXTRACTOR : kind === "pdf" ? PDF_EXTRACTOR : null,
    normalization: NORMALIZER,
    title: extracted.title,
    bytes: bytes.length,
  };
}
