/** Shared locations, so a suite file never guesses at the layout. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const CASES = join(ROOT, "cases");
export const FIXTURES = join(ROOT, "fixtures");
export const REPO = dirname(ROOT);
/** Case files for the fold and the quote check: instruments, not normative. */
export const NORMALIZATION_CASES = join(CASES, "normalization.tsv");
export const QUOTE_CASES = join(CASES, "quote-check.tsv");
export const SPEC = join(REPO, "SPEC.md");
export const SERIALIZATION = join(REPO, "serialization");
export const VALIDATOR = join(REPO, "implementations", "yaml-markdown", "typescript");
export const VIEWER = join(REPO, "tools", "viewer");
