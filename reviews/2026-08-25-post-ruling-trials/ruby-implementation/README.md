# Ruby trial, stopped

Launched to stress the YAML layer through Psych, which follows YAML 1.1
conventions, and stopped by the operator before the validator was built:
Ruby duplicates the Python trial's lens (dynamic, imperative), and the
trials that paid were the ones that brought a different way of thinking
about the data.

What survives is `probes/psych_probe.rb`, which the trial wrote first. Run
under Ruby 4.0.6 / Psych 5.3.1 it showed that mapping keys are retyped
exactly as scalars are (`no:` becomes `false`, `012:` becomes `10`), that
`hits_reported: 12:30:00` becomes `45000`, and that `as_of_date`'s three
permitted precisions parse as three different types. That became `F-007`
and, after the operator reframed it, the quoting obligation on `ERF-65`.
`lib/` holds the stub the trial had begun.
