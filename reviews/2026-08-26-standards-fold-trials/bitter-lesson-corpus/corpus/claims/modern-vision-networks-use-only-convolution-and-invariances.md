---
id: "modern-vision-networks-use-only-convolution-and-invariances"
type: "claim"
corpus: "bitter-lesson"
title: "Modern deep-learning vision networks use only the notions of convolution and certain kinds of invariance."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "only convolution"
families:
  - "vision"
semantic_query: "vision transformer residual connections built-in priors architecture inductive bias convolution not necessary"
atoms_for:
  - "bl-023"
  - "bl-085"
atoms_against:
  - "bl-084"
  - "bl-088"
  - "bl-089"
  - "bl-090"
  - "bl-091"
  - "bl-092"
edges:
  - to: "early-computer-vision-methods-are-discarded-today"
    relation: "supports"
---
Modern deep-learning vision networks use only the notions of convolution and certain kinds of invariance.

## Working notes

The word 'only' fails in both directions at once. Downward: the networks carry much more built-in structure than convolution, including residual reformulation, which the ResNet authors say is where the gain came from, and, on the AlexNet authors' own account, deliberate prior knowledge to compensate for data they did not have. Upward: by the time the essay was eighteen months old the best image models had removed convolution entirely, and the Vision Transformer paper's headline sentence is that reliance on convolutional networks is not necessary.

Brooks makes the same point from the other side six days after the essay: the convolutional front end is human-designed knowledge about translational invariance.
