/** Shared locations, so a suite file never guesses at the layout. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const CASES = join(ROOT, "cases");
export const FIXTURES = join(ROOT, "fixtures");
export const REPO = dirname(ROOT);
/** The two normative case files live beside SPEC.md (ERF-51). */
export const NORMALIZATION_CASES = join(REPO, "erf-cases-normalization.txt");
export const QUOTE_CASES = join(REPO, "erf-cases-quote-check.txt");
export const SPEC = join(REPO, "SPEC.md");
export const BINDINGS = join(REPO, "bindings");
export const VIEWER = join(REPO, "viewer");
