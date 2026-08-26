---
id: "early-computer-vision-methods-are-discarded-today"
type: "claim"
corpus: "bitter-lesson"
title: "The early computer-vision methods, edges, generalized cylinders and SIFT features, are today all discarded."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "vision methods discarded"
families:
  - "vision"
semantic_query: "SIFT still used 2025 structure from motion COLMAP classical versus learned feature matching"
atoms_for:
  - "bl-022"
  - "bl-083"
atoms_against:
  - "bl-081"
  - "bl-082"
edges:
  - to: "computation-leveraging-methods-win-over-seventy-years"
    relation: "supports"
---
The early computer-vision methods, edges, generalized cylinders and SIFT features, are today all discarded.

## Working notes

False as written, and the counter-evidence is recent. A 2025 photogrammetry paper opens by saying that classical handcrafted SIFT matching with nearest-neighbour matching and RANSAC has been state of the art for mobile mapping cameras, and the same paper then reports learned matching beating it on their datasets. Both facts are in the corpus, on opposite sides.

The honest reading is that the frontier moved and the installed base did not. 'Discarded' is a claim about practice, and in practice the technique is still shipped.
