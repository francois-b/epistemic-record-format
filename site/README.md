# The published site

What a newcomer sees at
`https://francois-b.github.io/epistemic-record-format/`: a landing page making
the case for the format, and the whole 2026-08-26 AI capital-expenditure
corpus rendered by the reference viewer underneath it.

```
site/
  landing.html     the landing page's source, the only hand-written page
  build.sh         regenerates the whole site
  check-links.py   resolves every internal reference, and proves nothing fetches
  build/           generated output, gitignored
```

```
./site/build.sh
open site/build/index.html
```

## Why the source lives here and the output does not

The generated site is a build artifact of the same kind as a rendered
corpus, so it is not committed. Everything under `site/build/` comes from
one of two places: `site/landing.html`, or the reference viewer run over
`examples/corpora/2026-08-26-ai-capex/`. Nothing in the output is ever
edited in place, because the next build would silently discard the edit.

The output is deliberately not under `docs/`, which in this repository is
documentation rather than a publishing root. GitHub Pages therefore
publishes from an Actions workflow (`.github/workflows/pages.yml`) rather
than from a branch folder, which is what lets the site be generated instead
of committed.

## What the build does

1. Runs `erf-check` over the corpus and stops on any violation, so a
   non-conforming corpus cannot reach the published site.
2. Renders the corpus with `erf-view` into `build/corpus/`, passing
   `--link` twice so every corpus page's topbar points back at the landing
   page and out at the specification.
3. Copies the viewer's stylesheet to `build/assets/erf.css`, so the landing
   page and the corpus share one visual language and cannot drift apart.
4. Substitutes the repository URL into the landing page. The URL is a build
   input rather than a constant: the workflow passes the real one, and a
   local build falls back to a placeholder that says plainly it is one.
   Override it with `ERF_REPO_URL`.
5. Writes `.nojekyll`, because Pages otherwise runs Jekyll over generated
   HTML.
6. Checks every internal link, including fragments, and fails if any page
   fetches an external subresource. The site has to open from disk and host
   anywhere.

## Enabling Pages

Settings, then Pages, then set **Build and deployment / Source** to **GitHub
Actions**. Nothing in the repository can set this; until it is set, the
deploy step fails with "Pages site not found". After that, every push to
`main` republishes.
