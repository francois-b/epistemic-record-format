# 06-scalar-types

Exercises **BINDING ERF-65** ("A validator MUST report a string-typed field
that arrived as any other type") and **BINDING ERF-66** (no duplicate key,
anchor, alias or explicit tag).

Every scalar here is written bare. Under the YAML 1.2 **JSON schema** that
ERF-65 pins, only `null`, `true`, `false` and JSON's number grammar leave
string-hood.

| field | bare spelling | resolves to | reported? |
|:--|:--|:--|:--|
| `spec_version` | `1.0` | float | yes |
| `as_of_date` | `2018` | integer | yes |
| `hits_reported` | `0` | integer | yes |
| `limitations` | `true` | boolean | yes |
| `families[2]` | `2018` | integer | yes |
| source id | `012` | **string** (leading zero is not JSON number grammar) | **no** |
| source id / family | `no` | **string** (only `true`/`false` are literals) | **no** |
| `excerpt.timestamp` | `2026-08-23` | **string** | **no** |
| duplicate `created` key | — | — | ERF-66 |

The last three rows are the finding: ERF-65's own list of what a producer MUST
quote names `"012"`, `"no"` and a timestamp, and under the schema ERF-65
mandates, none of those three needs quoting. See ambiguities.md ERF-65 #2.
