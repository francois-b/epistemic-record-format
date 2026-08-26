---
id: "short-term-knowledge-counterexamples-2026-08-26"
type: "survey"
corpus: "bitter-lesson"
title: "Documented cases where building human knowledge into a system failed to help even in the short term"
conducted:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
searches:
  - tool: "WebSearch tool in Claude Code (claude-opus-5 session, US web index)"
    query: "counterexample \"building in human knowledge\" hurt short term performance machine learning inductive bias no free lunch harmful prior"
    scope: "the open web as that index covers it, English, no date restriction"
    hits_reported: "ten links; the instrument's own summary states that the specific counterexamples were not addressed in the results"
    timestamp: "2026-08-26"
notable_results:
  - what: "A literature arguing the reverse"
    note: "What the act returned instead was the inductive-bias literature: that some bias over the space of functions is necessary for generalization at all, and that biases matched to the problem help. That is consistent with the essay's third observation and does not test it."
    atoms:
      - "bl-111"
---
What was sought: a single documented instance that would falsify the word 'always' in the essay's second historical observation, a case where built-in human knowledge did not help even at the start.

What came back: nothing of that shape, in one act. The instrument's own summary said so.

Coverage bounds, and they are severe. One query, one index, and a phrasing that assumes the counterexample would be described in the essay's vocabulary rather than in the vocabulary of whatever field it happened in. A negative result of this weight is close to no evidence: it says the claim was not cheaply refuted, and nothing more. Recorded so that the reading is visible rather than implied.

What I would search differently: ablation studies by field, where a hand-designed component is removed and performance rises, which is where such an instance would actually be reported and which would need a per-field search rather than one general query.
