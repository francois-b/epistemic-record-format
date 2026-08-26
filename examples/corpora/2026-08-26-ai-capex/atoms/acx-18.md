---
id: acx-18
type: atom
corpus: ai-capex
finding: 'Sequoia Capital''s David Cahn calculates that the AI industry''s revenue gap -- the new AI revenue needed to justify the pace of infrastructure spending -- grew from his 2023 estimate of a ''$200B question'' to a ''$600B question'' by mid-2024, by taking NVIDIA''s run-rate revenue forecast and multiplying it roughly 4x to account for total data-center cost and end-user resale margin.'
quote: 'AI''s $200B question is now AI''s $600B question. [...] All you have to do is to take Nvidia''s run-rate revenue forecast and multiply it by 2x to reflect the total cost of AI data centers (GPUs are half of the total cost of ownership—the other half includes energy, buildings, backup generators, etc)¹. Then you multiply by 2x again, to reflect a 50% gross margin for the end-user of the GPU, (e.g., the startup or business buying AI compute from Azure or AWS or GCP, who needs to make money as well).'
source: bear-cahn-600b-question-2024
source_quality: medium
as_of_date: '2024-06-20'
limitations: 'The estimate rests on Cahn''s own multiplier methodology (2x for total data-center cost, 2x again for resale margin) applied to NVIDIA''s forecast revenue, not on directly reported industry revenue figures.'
created: {timestamp: '2026-08-25', by: 'agent/claude-sonnet-5'}
finding_audit:
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: '2026-08-25', protocol: capex-audit-v1}
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: '2026-08-25', protocol: capex-audit-v1}
---
