# Notes on Interchange Forms (fixture)

Captured 2026-08-21 for the SQL trial. Constructed material.

Two serializations of the same mapping differ in bytes whenever the writer's
key order, scalar style, or line width differ from the reader's, and none of
those three is decided by the data model.

A round trip is lossless with respect to a stated equivalence, and the claim
"round-trips without loss" is not decidable until the equivalence is named.
