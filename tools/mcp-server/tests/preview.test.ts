/**
 * The preview computes what a tool would hand the app, and answers the app's
 * read-only calls while refusing writes. The page itself is checked by eye.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { callPreviewTool, openPreviewCorpus, previewContent } from "../src/preview.ts";

const MINIMAL = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "corpora", "minimal");

test("preview: a page's content is the tool's, read-only calls are answered, writes are refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "erf-preview-"));
  cpSync(MINIMAL, dir, { recursive: true });
  try {
    const c = openPreviewCorpus(dir);
    const index = previewContent(c, "index");
    assert.equal(index.tool, "erf_view");
    assert.equal(index.structuredContent["page"], "index");
    assert.ok(typeof index.structuredContent["html"] === "string" && typeof index.structuredContent["served_at"] === "string");
    const view = callPreviewTool(c, "erf_view", { page: "sources" });
    assert.ok(!view.isError && view.structuredContent?.["page"] === "sources");
    const write = callPreviewTool(c, "erf_flag", { narrative: "x", anchor: "y" });
    assert.ok(write.isError && /refuses writes/.test(write.content[0]!.text));
    assert.throws(() => previewContent(c, "proposals:9"), /propos|flag/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
