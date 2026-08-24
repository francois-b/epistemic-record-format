/**
 * Output assertions: run the reference consumer over a real corpus and read
 * what it produced.
 *
 * This category exists because of a defect every other check passed. The
 * narrative-binding grammar was implemented twice, the parser gained
 * `bound-at` and the renderer's copy did not, and six raw HTML comments
 * leaked into the rendered page with zero binding links. Types compiled,
 * lints passed, the site generated. Only reading the output catches it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bindingRe } from "../../viewer/corpus.ts";
import { REPO, VIEWER } from "../paths.ts";

const CORPUS = join(REPO, "examples", "corpus");

function build(): string {
  const out = mkdtempSync(join(tmpdir(), "erf-conformance-"));
  execFileSync("npx", ["tsx", "erf-view.ts", CORPUS, "-o", out], {
    cwd: VIEWER, stdio: "pipe", encoding: "utf8",
  });
  return out;
}

const site = build();
const page = (f: string) => readFileSync(join(site, f), "utf8");
const pages = () => readdirSync(site).filter((f) => f.endsWith(".html"));

test("ERF-33 no narrative binding survives into the rendered prose", () => {
  // A leaked marker is the visible symptom of a dropped binding: the
  // requirement forbids losing one silently, and a raw comment in the page
  // means the renderer did not recognise it.
  for (const f of pages().filter((f) => f.startsWith("narrative-"))) {
    const html = page(f);
    assert.ok(!html.includes("<!-- claims:"), `raw binding marker survived into ${f}`);
    assert.ok(!html.includes("&lt;!-- claims:"), `escaped binding marker survived into ${f}`);
  }
});

test("ERF-31/33 every binding in the source appears in the output", () => {
  const narratives = join(CORPUS, "narratives");
  if (!existsSync(narratives)) return;
  let expected = 0;
  for (const f of readdirSync(narratives).filter((f) => f.endsWith(".md"))) {
    const body = readFileSync(join(narratives, f), "utf8");
    expected += [...body.matchAll(bindingRe())].length;
  }
  const rendered = pages()
    .filter((f) => f.startsWith("narrative-"))
    .reduce((n, f) => n + (page(f).match(/class="bindnote"/g) ?? []).length, 0);
  assert.equal(rendered, expected, "binding count in the output differs from the source");
});

test("ERF-31 every binding anchor is a verbatim substring of its passage", () => {
  // The anchor is REQUIRED and exists so software can find the spot after the
  // prose moves. An anchor that does not occur in the body cannot do that: it
  // degrades silently to a line number, which edits destroy.
  const narratives = join(CORPUS, "narratives");
  if (!existsSync(narratives)) return;
  const missing: string[] = [];
  for (const f of readdirSync(narratives).filter((f) => f.endsWith(".md"))) {
    const body = readFileSync(join(narratives, f), "utf8");
    const prose = body.replace(bindingRe(), "");
    for (const m of body.matchAll(bindingRe())) {
      const anchor = m[2] ?? "";
      if (!anchor || !prose.includes(anchor)) missing.push(`${f}: "${anchor}"`);
    }
  }
  assert.deepEqual(missing, [], `anchors that do not occur in their passage:\n  ${missing.join("\n  ")}`);
});

test("ERF-41 every claim page states a disposition", () => {
  for (const f of pages().filter((f) => f.startsWith("claim-"))) {
    const html = page(f);
    assert.ok(
      /proposal|active|contested|rejected|retired/.test(html),
      `${f} states no disposition`,
    );
  }
});

test("ERF-42 a rendered disposition is styled rather than falling back", () => {
  // A disposition with no stylesheet rule renders unstyled, which reads to a
  // viewer as a broken page rather than as a claim nobody has ruled on.
  const css = readFileSync(join(VIEWER, "render.ts"), "utf8");
  for (const d of ["proposal", "active", "contested", "rejected", "retired"]) {
    assert.ok(css.includes(`d-${d}`), `no stylesheet rule for the ${d} disposition`);
  }
});

test("ERF-50 a capture page never claims a pass it did not compute", () => {
  // Pairs the verdict with its evidence: a page saying the check passed must
  // show the located quote, or the two halves have diverged.
  for (const f of pages().filter((f) => f.startsWith("capture-"))) {
    const html = page(f);
    if (html.includes("Quote check passes")) {
      assert.ok(html.includes("<mark>"), `${f} reports a pass but highlights nothing`);
    }
  }
});
