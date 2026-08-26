# Check grounding with RAG  Stay organized with collections   Save and categorize content based on your preferences.

As part of your Retrieval Augmented Generation (RAG) experience in Agent Search, you can check grounding to determine how grounded a piece of text (called an *answer candidate*) is in a given set of reference texts (called *facts*).

The check grounding API returns an overall support score of 0 to 1, which indicates how much the answer candidate agrees with the given facts. The response also includes *citations* to the facts supporting each claim in the answer candidate.

Perfect grounding requires that every claim in the answer candidate must be supported by one or more of the given facts. In other words, the claim is wholly entailed by the facts. If the claim is only partially entailed, it is not considered grounded. For example, the claim "Google was founded by Larry Page and Sergey Brin in 1975" is only partially correct—the names of the founders are correct but the date is wrong—and as such the whole claim is considered ungrounded. In this version of the check grounding API, a sentence is considered a single claim.

You can use the check grounding API to check any piece of text. It can be a human-generated blurb or a machine-generated response. A typical use case is to check an LLM-generated response against a given set of facts. The check grounding API is designed to be fast, with latency less than 500ms. This speed allows chat bots to call the check grounding API during each inference, without incurring a significant slowdown. The check grounding API can also provide references to support its findings, so that users can tell which parts of the generated response are reliable. The API also provides a support score to indicate the overall accuracy of the response. By setting a citation threshold, chat bots can filter out responses at inference time that are likely to contain hallucinated claims.

This page describes how to check grounding using the check grounding API.

## Terms defined and explained

Before you use the check grounding API, it helps to understand the inputs and outputs, and how to structure your grounding facts for best results.

### Input data

The check grounding API requires the following inputs in the request.

- **Answer candidate:** An answer candidate can be any piece of text whose grounding you want to check. For example, in the context of Agent Search, the answer candidate might be the generated search summary that answers a query. The API would then determine how grounded the summary is in the input facts. An answer candidate can have a maximum length of 4096 tokens, where a token is defined as a word in a sentence or a period (a punctuation mark used to end the sentence). For example, the sentence "They wore off-the-rack clothes in 2024." is seven tokens long, including six words and a period.
