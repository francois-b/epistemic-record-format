#!/bin/sh
# erf-digest 1.0.0 — sha256:<hex> for a file, in the spelling ERF-71 requires.
set -eu
printf 'sha256:%s\n' "$(shasum -a 256 "$1" | cut -d' ' -f1)"
