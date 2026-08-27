/**
 * @epistemic-record-format/yaml-markdown: the reference implementation of the Epistemic Record
 * Format for the YAML/Markdown serialization, as a library.
 *
 *   import { loadCorpus, disposition, quoteCheck } from "@epistemic-record-format/yaml-markdown";
 *
 * Four modules: read (bytes to documents), validate (`loadCorpus`: documents
 * to a checked model), compute (the readings the specification defines, from
 * the model alone), write (model to bytes, the one serializer). The command
 * line `erf-check` is built on them. The schema this build was generated
 * against ships with the package (`@epistemic-record-format/yaml-markdown/schema`).
 */
export const SPEC_VERSION = "0.9.0";

// read: bytes to documents
export { splitDocument, splitFrontmatter, walkFiles, fileType, bindingRe, bindingCandidates, unescapeAnchor, YAML_OPTS } from "./read.ts";
// validate: documents to a checked model
export { loadCorpus, shipsWithCorpus, KNOWN_FIELDS } from "./validate.ts";
// write: model to bytes
export { frontmatter, recordText, yamlDocument } from "./write.ts";
export type {
  Atom, Claim, Survey, Source, CorpusDeclaration, ConformanceFinding, Narrative, LoadedCorpus, BindingCandidate,
} from "./validate.ts";

export {
  admissible, currentStances, standingTies, disposition, resolvable, backing, normalizeForCheck, quoteCheck,
  findWholeWords, staleAgainst, staleAudits, staleEvidenceAudit, bindingStaleness, conflictsFor, premiseClosure,
  argumentLeaves, brokenAnchors, undatedRetrievals, retiredPremises, unbacked, stoodOn, danglingRefs,
  evidenceRefsFlagged, claimsUsingAtom,
} from "./compute.ts";
export type { Disposition, DispositionReading, BackingReading, QuoteCheck, BindingStaleness } from "./compute.ts";

export type * as Model from "../../../schema/erf.generated.ts";
