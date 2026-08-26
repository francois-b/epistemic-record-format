#!/usr/bin/env bash
# Regenerates the generated corpora and runs erfval over every test corpus.
set -u
cd "$(dirname "$0")/.."
swift build >/dev/null || exit 1
python3 tests/make-02.py >/dev/null
python3 tests/make-rest.py >/dev/null
for d in tests/01-minimal-conforming tests/02-quote-fabrication tests/03-premise-closure \
         tests/04-disposition tests/05-narrative-passages tests/06-scalar-types \
         tests/07-round-trip/variant-a tests/07-round-trip/variant-b; do
  echo "############ $d"
  .build/debug/erfval "$d" --quiet
  echo
done
echo "############ 05 under the competing marker reading (--comment-first)"
.build/debug/erfval tests/05-narrative-passages --quiet --comment-first | tail -3
echo
echo "############ ERF-53 round-trip: the two variants must dump identically"
diff <(.build/debug/erfval tests/07-round-trip/variant-a --quiet --model-dump | sed -n '/# ERF model/,$p') \
     <(.build/debug/erfval tests/07-round-trip/variant-b --quiet --model-dump | sed -n '/# ERF model/,$p') \
  && echo "model dumps IDENTICAL (no loss in a value the model types)"
