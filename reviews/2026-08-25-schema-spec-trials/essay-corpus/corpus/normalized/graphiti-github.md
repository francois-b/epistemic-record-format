⭐ *Help us reach more developers and grow the Graphiti community. Star this repo!*

Tip

Check out the new [MCP server for Graphiti](/getzep/graphiti/blob/main/mcp_server/README.md)! Give Claude, Cursor, and other MCP clients powerful context graph-based memory with temporal awareness.

Graphiti is a framework for building and querying temporal context graphs for AI agents. Unlike static knowledge graphs, Graphiti's context graphs track how facts change over time, maintain provenance to source data, and support both prescribed and learned ontology — making them purpose-built for agents operating on evolving, real-world data.

Unlike traditional retrieval-augmented generation (RAG) methods, Graphiti continuously integrates user interactions, structured and unstructured enterprise data, and external information into a coherent, queryable graph. The framework supports incremental data updates, efficient retrieval, and precise historical queries without requiring complete graph recomputation, making it suitable for developing interactive, context-aware AI applications.

Use Graphiti to:

- Build context graphs that evolve with every interaction — tracking what's true now and what was true before.
- Give agents rich, structured context instead of flat document chunks or raw chat history.
- Query across time, meaning, and relationships with hybrid retrieval (semantic + keyword + graph traversal).

[](/getzep/graphiti/blob/main/images/graphiti-graph-intro.gif)

## What is a Context Graph?

[](#what-is-a-context-graph)

A **context graph** is a temporal graph of entities, relationships, and facts — like *"Kendra loves Adidas shoes (as of March 2026)."* Unlike traditional knowledge graphs, each fact in a context graph has a validity window: when it became true, and when (if ever) it was superseded. Entities evolve over time with updated summaries. Everything traces back to **episodes** — the raw data that produced it.

What makes Graphiti unique is its ability to autonomously build context graphs from unstructured and structured data, handling changing relationships while preserving full temporal history.

A context graph contains:

| Component | What it stores |
|----|----|
