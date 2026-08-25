---
id: broadcom-custom-silicon-results-show-ai-chip-demand-extending-beyond-nvidia-gpus
type: claim
corpus: ai-capex
title: "Broadcom's record Q2 fiscal 2026 results and Q3 guidance, with AI semiconductor revenue up 143% year-over-year to $10.8 billion and guided to grow over 200% next quarter to $16.0 billion, show AI-driven chip demand extending to custom ASIC and networking silicon beyond NVIDIA GPUs specifically"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [demand-signals, capex-figures, supply-chain]
atoms_for: [acx-38, acx-146]
edges:
  - {to: semiconductor-supply-chain-results-show-real-not-just-announced-demand, relation: supports}
---
Broadcom's record Q2 fiscal 2026 results and Q3 guidance, with AI semiconductor revenue up 143% year-over-year to $10.8 billion and guided to grow over 200% next quarter to $16.0 billion, show AI-driven chip demand extending to custom ASIC and networking silicon beyond NVIDIA GPUs specifically

## Working notes

Broadcom's record Q2 fiscal 2026 results and Q3 guidance, with AI semiconductor revenue up 143% year-over-year to $10.8 billion and guided to grow over 200% next quarter to $16.0 billion, show AI-driven chip demand extending to custom ASIC and networking silicon beyond NVIDIA GPUs specifically.

Broadcom is not cited anywhere in the 27 existing claims, which is a gap: the supply-chain evidence in this corpus is otherwise entirely GPU- and memory-centric (NVIDIA, TSMC, ASML, Samsung, SK hynix). Broadcom's Q2 fiscal 2026 AI semiconductor revenue reached $10.8 billion, up 143% YoY and above the company's own forecast, with Q3 guidance of $16.0 billion, growth of over 200% YoY (acx-38); total company revenue grew 48% to a record $22.2 billion with adjusted EBITDA at 69% of revenue, and Q3 consolidated revenue is guided to grow 84% YoY (acx-146). Carries a supports edge into semiconductor-supply-chain-results-show-real-not-just-announced-demand: this is a company outside that claim's named set (TSMC, ASML, Samsung, SK hynix) but the same kind of evidence -- realized upstream revenue, not just customer-side capex announcements -- for a different link in the chain (custom AI accelerators and networking silicon, which several hyperscalers are buying alongside or instead of NVIDIA GPUs). No atoms_against: no atom in the corpus disputes Broadcom's reported figures, and forcing the same China-competition consideration used on the GPU/foundry claims here would be a weaker fit since Broadcom's custom-silicon business is design-and-IP-driven in a way that is less exposed to the specific dynamic Doomberg (acx-53) describes.
