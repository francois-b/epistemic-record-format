# 07-round-trip

Exercises **ERF-53** and section 7's opening ("Conformance is a property of a
corpus as loaded into the model"; "Loss is any difference, after loading, in a
value the model types or in a narrative's text").

`variant-a` and `variant-b` are the same corpus written two ways *inside the
same binding*: block versus flow collections, quoted versus plain versus folded
scalars, a block sequence versus a flow sequence.

    erfval tests/07-round-trip/variant-a --model-dump > /tmp/a
    erfval tests/07-round-trip/variant-b --model-dump > /tmp/b
    diff /tmp/a /tmp/b

The dumps are byte-identical, which is the operational form of "two forms are
equivalent when they load to the same model instance".

Two differences between the variants are **invisible** to that comparison, and
both are the finding:

1. `citation.chapter-number` is `36` in A and `36.0` in B. ERF-53's own
   worked example of loss is *exactly this pair* -- "a store that returns
   `chapter-number: 36.0` for `36` has lost". But `citation` is typed `CSL`,
   and section 3 says it omits the `CSL` alias definition, so `36` is not "a
   value the model types" and the definition does not reach its own example.
2. `variant-a/rt-claim.md` carries `x_reviewer`, which `variant-b` drops.
   ERF-72 makes it legal and ERF-57 obliges a consumer to preserve it, but it
   is typed by nothing, so dropping it is not loss under ERF-53's definition.

See ambiguities.md, ERF-53 #1 and #2.
