Stable diffusion revolutionized image creation from descriptive text. GPT-2 (ref. ^([1](/articles/s41586-024-07566-y#ref-CR1 "Radford, A. et al. Language models are unsupervised multitask learners. OpenAI blog 1, 9 (2019)."))), GPT-3(.5) (ref. ^([2](/articles/s41586-024-07566-y#ref-CR2 "Brown, T. et al. Language models are few-shot learners. Adv. Neural Inf. Process. Syst. 33, 1877–1901 (2020)."))) and GPT-4 (ref. ^([3](/articles/s41586-024-07566-y#ref-CR3 "OpenAI. GPT-4 Technical Report.
                  https://cdn.openai.com/papers/gpt-4.pdf

                 (2023)."))) demonstrated high performance across a variety of language tasks. ChatGPT introduced such language models to the public. It is now clear that generative artificial intelligence (AI) such as large language models (LLMs) is here to stay and will substantially change the ecosystem of online text and images. Here we consider what may happen to GPT-{*n*} once LLMs contribute much of the text found online. We find that indiscriminate use of model-generated content in training causes irreversible defects in the resulting models, in which tails of the original content distribution disappear. We refer to this effect as ‘model collapse’ and show that it can occur in LLMs as well as in variational autoencoders (VAEs) and Gaussian mixture models (GMMs). We build theoretical intuition behind the phenomenon and portray its ubiquity among all learned generative models. We demonstrate that it must be taken seriously if we are to sustain the benefits of training from large-scale data scraped from the web. Indeed, the value of data collected about genuine human interactions with systems will be increasingly valuable in the presence of LLM-generated content in data crawled from the Internet.

### Similar content being viewed by others

### [The consequences of generative AI for online knowledge communities](https://www.nature.com/articles/s41598-024-61221-0?fromPaywallRec=false)

Article Open access 06 May 2024

### [Large language models are proficient in solving and creating emotional intelligence tests](https://www.nature.com/articles/s44271-025-00258-x?fromPaywallRec=false)

Article Open access 21 May 2025

### [AI language models could both help and harm equity in marine policymaking](https://www.nature.com/articles/s44183-025-00132-7?fromPaywallRec=false)

Article Open access 11 June 2025

### Subjects

- [Computational science](/subjects/computational-science)
- [Computer science](/subjects/computer-science)

## Main

The development of LLMs is very involved and requires large quantities of training data. Yet, although current LLMs^([2](/articles/s41586-024-07566-y#ref-CR2 "Brown, T. et al. Language models are few-shot learners. Adv. Neural Inf. Process. Syst. 33, 1877–1901 (2020)."),[4](#ref-CR4 "Devlin, J., Chang, M.-W., Lee, K. & Toutanova, K. in Proc. 2019 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, Volume 1 (Long and Short Papers) (eds Burstein, J., Doran, C. & Solorio, T.) 4171–4186 (Association for Computational Linguistics, 2019)."),[5](#ref-CR5 "Liu, Y. et al. RoBERTa: a Robustly Optimized BERT Pretraining Approach. Preprint at
                  https://arxiv.org/abs/1907.11692

                 (2019)."),[6](/articles/s41586-024-07566-y#ref-CR6 "Zhang, S. et al. Opt: open pre-trained transformer language models. Preprint at
                  https://arxiv.org/abs/2205.01068

                 (2022).")), including GPT-3, were trained on predominantly human-generated text, this may change. If the training data of most future models are also scraped from the web, then they will inevitably train on data produced by their predecessors. In this paper, we investigate what happens when text produced by, for example, a version of GPT forms most of the training dataset of following models. What happens to GPT generations GPT-{*n*} as *n* increases? We discover that indiscriminately learning from data produced by other models causes ‘model collapse’—a degenerative process whereby, over time, models forget the true underlying data distribution, even in the absence of a shift in the distribution over time. We give examples of model collapse for GMMs, VAEs and LLMs. We show that, over time, models start losing information about the true distribution, which first starts with tails disappearing, and learned behaviours converge over the generations to a point estimate with very small variance. Furthermore, we show that this process is inevitable, even for cases with almost ideal conditions for long-term learning, that is, no function estimation error. We also briefly mention two close concepts to model collapse from the existing literature: catastrophic forgetting arising in the framework of task-free continual learning^([7](/articles/s41586-024-07566-y#ref-CR7 "Aljundi, R., Kelchtermans, K. & Tuytelaars, T. Task-free continual learning. in: Proc. 2019 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) 11254–11263 (IEEE, 2019).")) and data poisoning^([8](/articles/s41586-024-07566-y#ref-CR8 "Carlini, N. & Terzis, A. in Proc. Tenth International Conference on Learning Representations (ICLR, 2022)."),[9](/articles/s41586-024-07566-y#ref-CR9 "Carlini, N. et al. in Proc. 2024 IEEE Symposium on Security and Privacy (SP) 179 (IEEE, 2024).")) maliciously leading to unintended behaviour. Neither is able to explain the phenomenon of model collapse fully, as the setting is fundamentally different, but they provide another perspective on the observed phenomenon and are discussed in more depth in the [Supplementary Materials](/articles/s41586-024-07566-y#MOESM1). Finally, we discuss the broader implications of model collapse. We note that access to the original data distribution is crucial: in learning tasks in which the tails of the underlying distribution matter, one needs access to real human-produced data. In other words, the use of LLMs at scale to publish content on the Internet will pollute the collection of data to train their successors: data about human interactions with LLMs will be increasingly valuable.

## What is model collapse?

### Definition 2.1 (model collapse)

Model collapse is a degenerative process affecting generations of learned generative models, in which the data they generate end up polluting the training set of the next generation. Being trained on polluted data, they then mis-perceive reality. The process is depicted in Fig. [1a](/articles/s41586-024-07566-y#Fig1). We separate two special cases: early model collapse and late model collapse. In early model collapse, the model begins losing information about the tails of the distribution; in late model collapse, the model converges to a distribution that carries little resemblance to the original one, often with substantially reduced variance.
