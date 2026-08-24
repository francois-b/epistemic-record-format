# Reviews

Adversarial review passes over this specification, archived verbatim with
per-finding adjudications. One file per pass.

## Why reviews are committed

This repository has no peer-review venue and no PR process: reviews come
from models and people, on request, and the findings would otherwise live
in a chat scrollback. Committing them does two things. It makes the
adjudications citable, so the next reviewer (human or model) can be handed
the record and told not to re-argue what is already ruled; measured over
passes, the number of new findings per review should fall, and this folder
is where that trend is visible. And it makes the reviewers comparable:
different models, different days, different blind spots, on the record.

The pattern is older than the reviewers. W3C working groups must document
"wide review" in a Disposition of Comments before a spec advances: every
comment received, every resolution, on the record. IETF last calls carry
the same norm. Open peer review (F1000Research, PLOS) publishes review
reports verbatim beside the article, with the author's responses. This
folder is a disposition of comments whose reviewers include LLMs; the
adjudication discipline is the same, and it is the working answer to the
failure mode AI review is known for (unadjudicated machine findings at a
volume no one rules on, which is what collapsed curl's bug-bounty intake).

## The file

`YYYY-MM-DD-{reviewer-slug}.md`, one per pass, containing:

1. **Header**: the reviewer (exact model id for an LLM, name for a
   person), the date, what was reviewed (files and their commit), and how
   the review was obtained (the prompt or its location, the harness, what
   context the reviewer was given — in particular whether it received the
   decision register).
2. **The verbatim output.** Never edited, never summarized in place. A
   review that has been tidied is a different document.
3. **The adjudication table**: one row per finding — `accepted`
   (implemented, with the commit), `rejected` (with the reason, and a
   register row where the reason is durable), `deferred` (with its
   trigger, into `BACKLOG.md`), `duplicate` (of which register row or
   prior finding), or `pending` (not yet ruled; a pending row is a debt,
   not a state to ship in).

Rulings that close a proposal durably also land in the decision register
(`DESIGN-HISTORY.md` Part III), which stays the one place a proposal is
checked against before being re-argued. The review file records what THIS
pass surfaced and what happened to it; the register records what is
settled. A finding can appear in both.

## Ground rules

- The reviewer is always given `SPEC.md` and the current decision register,
  and instructed not to re-raise adjudicated items without challenging the
  recorded reasoning by name. A finding that ignores the register is noise
  and is adjudicated `duplicate`.
- Model verdicts are hypotheses. Every finding is verified against the
  text before it is accepted; a wrong finding is recorded as `rejected`
  with the reason, because the wrongness is data about the reviewer.
- Reviews are not authorship. The commits that implement accepted findings
  carry the trailers of whoever wrote the changes, as every commit here
  does; the *reviewer* is never a co-author of the fix, and this file, not
  a trailer, is the reviewer's attribution.
