# Title:Mutation Without Variation: Convergence Dynamics in LLM-Driven Program Evolution

Authors:[Can Gurkan](https://arxiv.org/search/cs?searchtype=author&query=Gurkan,+C), [Forrest Stonedahl](https://arxiv.org/search/cs?searchtype=author&query=Stonedahl,+F), [Uri Wilensky](https://arxiv.org/search/cs?searchtype=author&query=Wilensky,+U)

View a PDF of the paper titled Mutation Without Variation: Convergence Dynamics in LLM-Driven Program Evolution, by Can Gurkan and 2 other authors

[View PDF](/pdf/2606.05408) [HTML (experimental)](https://arxiv.org/html/2606.05408v1)

> Abstract:When an LLM repeatedly mutates a program, does it explore new forms or circle back to the same ones? We study this question by analyzing LLM-driven mutation chains in the absence of selection pressure within a domain-specific language, varying prompt design, model family, and stochastic replication. We find that LLM-based mutation consistently converges toward restricted attractor regions in program space. Convergence is especially severe at the structural level: in 87% of chains, over 93% of mutations revisit a previously seen structural form, with most variation confined to terminal substitutions within recurring templates. Cycle analysis reveals short cycles and self-loops dominating the transition structure. The rate of convergence varies with prompt wording and model choice, but the phenomenon is robust across conditions. A classical GP subtree mutation operator does not exhibit comparable convergence, suggesting that the effect is intrinsic to the LLM mutation pipeline. These findings reveal a tension at the heart of LLM-driven program evolution: the same capabilities that enable semantics-aware program transformation also carry a systematic bias toward structural homogeneity that must be accounted for if such systems are to sustain open-ended exploration. Source code is available at [this https URL](https://github.com/can-gurkan/lmca).

[TABLE]

## Submission history
