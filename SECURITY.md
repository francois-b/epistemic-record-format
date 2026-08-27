# Security

Two different things live in this repository, and only one of them has
vulnerabilities in the ordinary sense.

## The reference implementation and the tooling

`implementations/`, `tools/`, `schema/erf.generated.ts`, and the runner and suites under `conformance/`
are code that reads files a stranger may have written: YAML frontmatter,
markdown bodies, normalized texts, digests, narrative bindings. If you find a
way to make any of it execute something, read outside the corpus directory it
was given, hang on a crafted input, or report a quote check as passing when it
did not, report it.

**Report privately, to f.bouet@gmail.com.** Include the input that does it, the
command you ran, and what happened. Expect an acknowledgement within a week.
There is no bounty and there is no embargo policy beyond the obvious one:
nothing is published until there is a fix or a stated decision not to fix.

None of this is production software. It is a reference consumer and a set of
checks, at version 0.9, maintained by one person. Judge the risk accordingly,
and do not run it on input you would not open in an editor.

## The format itself

A defect in what the specification *says* is not a vulnerability report; it is
a finding. `SPEC.md` has its own **Security and privacy considerations**
section covering what the format does and does not defend: confidentiality
between corpora is deliberately a deployment policy, normalized texts travel
only where their licences permit, standings are personal data by design, and
the honest scope of re-checkability is that whoever holds the corpus and its
normalized texts can re-run a check while a recipient of the records alone
holds citations rather than proof.

Two cases sit on the line, and both belong here rather than in an issue,
because a public report is itself the harm:

- A way to make a quotation pass the check that its source never contained.
  This is the mechanism the rest of the format rests on, and every known
  instance is pinned in `conformance/cases/quote-check.tsv` under `F-016`. A
  new one is worth reporting privately first; it will end up in that file
  either way.
- Anything that lets a record misattribute a standing, an audit verdict, or an
  actor id, since those are claims about what a named person did.

Everything else about the specification goes through the ordinary route: an
issue, then `docs/findings/`, then the three gates. `CONTRIBUTING.md` has the
map.
