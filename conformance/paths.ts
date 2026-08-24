/** Shared locations, so a suite file never guesses at the layout. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const CASES = join(ROOT, "cases");
export const FIXTURES = join(ROOT, "fixtures");
export const REPO = dirname(ROOT);
export const SPEC = join(REPO, "SPEC.md");
export const VIEWER = join(REPO, "viewer");
