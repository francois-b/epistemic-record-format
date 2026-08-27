/**
 * @erf/validator: the reference implementation of the Epistemic Record
 * Format for the YAML/Markdown serialization, as a library.
 *
 *   import { loadCorpus, disposition, quoteCheck } from "@erf/validator";
 *
 * `loadCorpus(dir)` reads a corpus folder into the model, validating every
 * document against the schema; the functions in `compute` derive every
 * reading the specification defines, from the records alone. The command
 * line `erf-check` is the same code. The schema this build was generated
 * against ships with the package (`@erf/validator/schema`).
 */
export const SPEC_VERSION = "0.9.0";

export {
  loadCorpus, splitDocument, bindingRe, bindingCandidates, unescapeAnchor, shipsWithCorpus, KNOWN_FIELDS,
} from "./corpus.ts";
export type {
  Atom, Claim, Survey, Source, CorpusDeclaration, ConformanceFinding, Narrative, LoadedCorpus, BindingCandidate,
} from "./corpus.ts";

export {
  admissible, currentStances, standingTies, disposition, resolvable, backing, normalizeForCheck, quoteCheck,
  findWholeWords, staleAgainst, staleAudits, staleEvidenceAudit, bindingStaleness, conflictsFor, premiseClosure,
  argumentLeaves, brokenAnchors, undatedRetrievals, retiredPremises, unbacked, stoodOn, danglingRefs,
  evidenceRefsFlagged, claimsUsingAtom,
} from "./compute.ts";
export type { Disposition, DispositionReading, BackingReading, QuoteCheck, BindingStaleness } from "./compute.ts";

export type * as Model from "../../../schema/erf.generated.ts";
