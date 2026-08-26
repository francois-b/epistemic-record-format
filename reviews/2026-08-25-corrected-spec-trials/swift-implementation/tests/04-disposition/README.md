# 04-disposition

Exercises **ERF-41** (computed disposition, per-person newest entry, withdrawal
as exit, a stance outside the vocabulary) and **ERF-19** (a standing's
timestamp is a full RFC 3339 instant).

Run `erfval tests/04-disposition --dispositions` to see the computation trace.

| claim | expected disposition | why |
|:--|:--|:--|
| `d01-no-standings` | `proposal` | no standings at all |
| `d02-one-for` | `active` | |
| `d03-one-against` | `rejected` | |
| `d04-contested` | `contested` | two people, opposed |
| `d05-withdrawn-only` | `retired` | nothing remains after discarding withdrawals |
| `d06-one-left-one-stands` | `active` | |
| `d07-bad-stance-newest` | **reading-dependent** | reported as an ERF-41/ERF-55 violation either way; see ambiguities.md ERF-41 #1 |
| `d08-all-bad-stances` | **reading-dependent** (`proposal` here) | |
| `d09-same-instant-tie` | **undetermined by the spec** (`rejected` here) | ambiguities.md ERF-41 #2 |
| `d10-withdraw-then-other-against` | `rejected` | |
| `d11-bare-date-standing` | `active` | plus an ERF-19 violation for the bare date |
