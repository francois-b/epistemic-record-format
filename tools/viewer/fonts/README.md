# Embedded faces for `erf-view`

The reference consumer names three families and embeds all three rather
than hoping the reading device has them. Naming alone works on a machine
with Literata and Inter installed and a mono stack landing on Menlo, and
fails everywhere else: Literata falls through to a generic serif, Inter to
a generic sans, and the identifiers to whatever `monospace` aliases. Record
ids and requirement numbers make the substitution visible first, since a
substitute mono digit beside a serif title reads wrong.

These files are base64-embedded into `assets/erf.css` at render time, so a
rendered corpus fetches nothing from a third party and every device gets
the same page. That constraint is the consumer's own, not the format's:
`ERF` says nothing about presentation.

| File | Used by |
|---|---|
| `literata-400.woff2` | body prose, claim and atom text |
| `literata-400-italic.woff2` | italics inside prose |
| `literata-700.woff2` | h1, claim titles |
| `inter-400.woff2` | topbar, subtitles, tables, footer |
| `inter-400-italic.woff2` | italics in apparatus lines |
| `inter-700.woff2` | section headings, table headers |
| `dejavu-sans-mono-400.woff2` | record ids, dispositions, kinds, quotes, captures |
| `dejavu-sans-mono-400-italic.woff2` | cited titles inside atom sources |

## Why DejaVu Sans Mono and not Menlo

Menlo is Apple's and cannot be embedded or redistributed. Menlo derives
from Bitstream Vera Sans Mono, and so does DejaVu Sans Mono, which is
freely embeddable, so the desktop rendering barely changes while every
other platform gains the same face.

## Provenance and licences

Literata and Inter are SIL Open Font License. DejaVu Sans Mono is from the
dejavu-fonts 2.37 release under the Bitstream Vera licence, kept beside the
files as `LICENSE-DejaVu.txt`. Inter ships variable only and was instanced
to weights 400 and 700 before subsetting.

Subset with `pyftsubset` to `U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,
U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2264-2265,U+25A0-25CF,
U+2713-2717`, keeping `kern,liga,clig,calt,onum,tnum`. `U+2715` survives in
no family, so `×` (U+00D7) stands in wherever a cross is needed.

Copied from this author's `claims-tree-web` publication recipe, which
embeds the same eight faces for the same reason.
