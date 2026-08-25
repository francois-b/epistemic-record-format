---
# ERF-54: "A file carrying no `type` is not part of the corpus; a consumer MUST
# ignore it and MUST report that it did (ERF-57)."
#
# The distinction between THIS file (no `type` at all -- outside the corpus)
# and opaque-unknown-type.md (an unrecognized `type` -- inside the corpus,
# preserved as opaque) decides which rule applies. In OpaqueFile that
# distinction is carried by `optional string type_value`, i.e. by explicit
# presence, and would be destroyed by a plain `string`.
title: "Scratch notes, not a corpus file"
author: francois
---
Not part of the corpus. A consumer ignores this and says that it did.
