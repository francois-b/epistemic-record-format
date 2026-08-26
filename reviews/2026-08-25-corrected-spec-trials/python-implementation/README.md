# `erf_validate.py`

A validator for the Epistemic Record Format v0.9 (draft) in the YAML/Markdown
binding version 1, written cold from `SPEC-as-tried.md` and
`BINDING-as-tried.md` and nothing else. No reference implementation, no
conformance fixtures, no example corpus was consulted — see `friction-log.md`
§1 for the places that was hard.

## Running it

```
python3 erf_validate.py <corpus-directory> [options]
```

Requires Python 3 and PyYAML (`pip install pyyaml`). Nothing else.

| Option | Effect |
|:--|:--|
| `--dispositions` | print each claim's computed disposition (`ERF-41`) |
| `--json` | machine-readable output, including all dispositions |
| `--quiet` | violations only |
| `--show-unperformed` | list the checks this tool does *not* perform, and why |

Exit code is `1` if any **violation** was found and `0` otherwise. Flags and
notices do not fail the run, per §1: "a corpus carrying flags and no
violations conforms".

Examples:

```
python3 erf_validate.py tests/conforming-baseline --dispositions
python3 erf_validate.py tests/fabrication-succeeded
sh tests/run.sh
```

## What it reports

Three severities, following §1's distinction:

- **violation** — the corpus does not conform.
- **flag** — "something here is worth a person's attention", arising from an
  act the format permits elsewhere: a stale narrative binding (`ERF-32`), a
  broken anchor (`ERF-31`), a retired premise (`ERF-43`), an unbacked claim
  someone stands on (`ERF-49`), a past-state reference that no longer resolves
  (`ERF-35`).
- **notice** — a check that could not run, an ignored file, an extension
  field.

## What it covers

Enough record loading to exercise the seven requirements under re-test, and
not much beyond. Corpus discovery is by content (`ERF-54`): the tool walks the
directory, reads each file's `type`, and dispatches on it.

Checked: `ERF-1`, `ERF-3`, `ERF-4`, `ERF-5`, `ERF-6`, `ERF-7`, `ERF-9`,
`ERF-11`, `ERF-12`, `ERF-13`, `ERF-15`, `ERF-17`, `ERF-18`, `ERF-19`,
`ERF-21`, `ERF-24`, `ERF-26`, `ERF-27`, `ERF-28`, `ERF-31`, `ERF-32`,
`ERF-33`, `ERF-34`, `ERF-35`, `ERF-38`, `ERF-39`, `ERF-41`, `ERF-43`,
`ERF-44`, `ERF-47`, `ERF-48`, `ERF-49`, `ERF-50`, `ERF-51`, `ERF-52`,
`ERF-54`, `ERF-55`, `ERF-56`, `ERF-58`, `ERF-59`, `ERF-61`, `ERF-65`,
`ERF-66`, `ERF-67`, `ERF-69` (presence only), `ERF-72`.

Not checked, and the tool says so under `--show-unperformed`: `ERF-2`,
`ERF-8`, `ERF-36` (deployment scope), `ERF-40`, `ERF-69` (fidelity),
`ERF-70`, `ERF-71`. `ambiguities.md` §7 argues that a tool may skip all of
these and still claim the Validator conformance class, which is a defect in
the class definition rather than a licence I wanted.

## How it reads YAML

`ERF-65` requires YAML 1.2's JSON schema. PyYAML implements YAML 1.1 and
offers no schema selector, so `JsonSchemaLoader` replaces the resolver table
wholesale. Every divergence between the two, with exact inputs and returns, is
in `yaml-behaviour.md`.

Consequence worth knowing before reading the output: a field that arrives
retyped **under the JSON schema** is a violation; a field that stays a string
under the JSON schema but would be retyped by a reader on a library default is
a **flag**. That split is not in the text; `ambiguities.md` §5.1 explains why
it was needed.

## The other documents here

| File | What it holds |
|:--|:--|
| `ambiguities.md` | every place two careful implementers could still build different things, in the seven requirements; readings enumerated, choice named, consequence stated |
| `yaml-behaviour.md` | the PyYAML register: 40 inputs through both resolvers, plus the structural divergences (merge keys, duplicate keys, `=` and `<<`) |
| `friction-log.md` | every re-read, guess and inference, and where the temptation to peek came from |
| `tests/README.md` | what each corpus exercises and what it should report |

## Layout

```
erf_validate.py       one file, ~1440 lines, stdlib + PyYAML
  §1  JsonSchemaLoader        YAML 1.2 JSON schema on top of PyYAML
  §3  erf51_fold, quote_check ERF-51 / ERF-52
  §4  recognize_bindings      ERF-31
  §5  Stamp, strictly_later   ERF-19 / ERF-47 / ERF-48
  §6  the string-typed map    ERF-65
  §9  Corpus                  loading, references, graph, narratives
tests/                eight corpora, one per concern
```
