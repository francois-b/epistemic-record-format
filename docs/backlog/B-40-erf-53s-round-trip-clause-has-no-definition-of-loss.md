---
id: B-40
kind: defect
status: open
basis: demonstrated
raised: "trial 6 (SQL), 2026-08-25"
verified:
  by: "raised by the verification pass itself"
  on: 2026-08-25
  verdict: unverified
  note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-40 · `ERF-53`'s round-trip clause has no definition of loss

`ERF-53` permits a store to hold records any way it likes "provided every record round-trips through the interchange form without loss". The clause has never been tested, and trial 6 found it cannot be as written: three defensible equivalence relations give three different answers on the same corpus. Byte identity holds only on files the writer itself produced (20/20 on its own output, 0/20 on a corpus written in the specification's own example style, which differed on 58 lines with no semantic change). Parse-equality passes those 20. Equality under `ERF-56`'s empty-list rule fails 2 of 8 hostile cases.

Two genuine losses were found. An atom carrying body text lost 151 bytes: permitted by construction, since an atom has no body, but `ERF-57` does not require reporting the discard either, so silent destruction is equally conforming. And `hits_reported: 12` returned as `"12"`, because the store repaired an `ERF-27` violation that no rule covers.

## Proposed resolution

Define the equivalence `ERF-53` means. `ERF-55` plus `ERF-56` is the only place the document says two different files carry the same record, and it covers lists only.
