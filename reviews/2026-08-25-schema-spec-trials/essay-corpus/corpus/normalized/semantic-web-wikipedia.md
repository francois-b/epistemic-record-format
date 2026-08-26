[TABLE]

The **Semantic Web**, sometimes known as **Web 3.0**, is an extension of the [World Wide Web](https://en.wikipedia.org/wiki/World_Wide_Web "World Wide Web") through standards^([\[1\]](#cite_note-1)) set by the [World Wide Web Consortium](https://en.wikipedia.org/wiki/World_Wide_Web_Consortium "World Wide Web Consortium") (W3C). The goal of the Semantic Web is to make [Internet](https://en.wikipedia.org/wiki/Internet "Internet") data [machine-readable](https://en.wikipedia.org/wiki/Machine-readable "Machine-readable").

To enable the encoding of [semantics](https://en.wikipedia.org/wiki/Semantics "Semantics") with the data, technologies such as [Resource Description Framework](https://en.wikipedia.org/wiki/Resource_Description_Framework "Resource Description Framework") (RDF)^([\[2\]](#cite_note-2)) and [Web Ontology Language](https://en.wikipedia.org/wiki/Web_Ontology_Language "Web Ontology Language") (OWL)^([\[3\]](#cite_note-3)) are used. These technologies are used to formally represent [metadata](https://en.wikipedia.org/wiki/Metadata "Metadata"). For example, [ontology](https://en.wikipedia.org/wiki/Ontology_(information_science) "Ontology (information science)") can describe [concepts](https://en.wikipedia.org/wiki/Concept "Concept"), relationships between [entities](https://en.wikipedia.org/wiki/Entity–relationship_model "Entity–relationship model"), and categories of things. These embedded semantics offer significant advantages such as [reasoning](https://en.wikipedia.org/wiki/Reasoning_engine "Reasoning engine") over data and operating with heterogeneous data sources.^([\[4\]](#cite_note-4)) These standards promote common data formats and exchange protocols on the Web, fundamentally the RDF. According to the W3C, "The Semantic Web provides a common framework that allows data to be shared and reused across application, enterprise, and community boundaries."^([\[5\]](#cite_note-W3C-SWA-5)) The Semantic Web is therefore regarded as an integrator across different content and information applications and systems.

## History

\[[edit](/w/index.php?title=Semantic_Web&action=edit&section=1 "Edit section: History")\]

The term was coined by [Tim Berners-Lee](https://en.wikipedia.org/wiki/Tim_Berners-Lee "Tim Berners-Lee") for a web of data (or **data web**)^([\[6\]](#cite_note-6)) that can be processed by machines^([\[7\]](#cite_note-Berners-Lee-7))—that is, one in which much of the [meaning](https://en.wikipedia.org/wiki/Meaning_(linguistics) "Meaning (linguistics)") is [machine-readable](https://en.wikipedia.org/wiki/Machine-readable_data "Machine-readable data"). While its critics have questioned its feasibility, proponents argue that applications in [library](https://en.wikipedia.org/wiki/Library_science "Library science") and [information science](https://en.wikipedia.org/wiki/Information_science "Information science"), industry, [biology](https://en.wikipedia.org/wiki/Biology "Biology") and [human sciences](https://en.wikipedia.org/wiki/Human_science "Human science") research have already proven the validity of the original concept.^([\[8\]](#cite_note-8))

The idea of adding semantics to the Web predates the term itself. Berners-Lee discussed the need for semantics in the Web at the first [International World Wide Web Conference](https://en.wikipedia.org/wiki/International_World_Wide_Web_Conference "International World Wide Web Conference") in 1994.^([\[9\]](#cite_note-9)) In 1998, he published a design document titled "Semantic Web Road map", outlining the architecture for a web of machine-processable data.^([\[10\]](#cite_note-10)) The first patent for the creation of a semantic web was filed by [Amit Sheth](https://en.wikipedia.org/wiki/Amit_Sheth "Amit Sheth") et al. on 30 October 2001.^([\[11\]](#cite_note-11))

Berners-Lee originally expressed his vision of the Semantic Web in 1999 as follows:

> I have a dream for the Web \[in which computers\] become capable of analyzing all the data on the Web – the content, links, and transactions between people and computers. A "Semantic Web", which makes this possible, has yet to emerge, but when it does, the day-to-day mechanisms of trade, bureaucracy and our daily lives will be handled by machines talking to machines. The "[intelligent agents](https://en.wikipedia.org/wiki/Intelligent_agent "Intelligent agent")" people have touted for ages will finally materialize.^([\[12\]](#cite_note-12))

The 2001 *[Scientific American](https://en.wikipedia.org/wiki/Scientific_American "Scientific American")* article by Berners-Lee, [Hendler](https://en.wikipedia.org/wiki/James_Hendler "James Hendler"), and [Lassila](https://en.wikipedia.org/wiki/Ora_Lassila "Ora Lassila") described an expected evolution of the existing Web to a Semantic Web.^([\[13\]](#cite_note-13)) In 2006, Berners-Lee and colleagues stated that: "This simple idea…remains largely unrealized".^([\[14\]](#cite_note-14)) In 2013, more than four million Web domains (out of roughly 250 million total) contained Semantic Web markup.^([\[15\]](#cite_note-15))

## Example

\[[edit](/w/index.php?title=Semantic_Web&action=edit&section=2 "Edit section: Example")\]

In the following example, the text "Paul Schuster was born in Dresden" on a website will be annotated, connecting a person with their place of birth. The following [HTML](https://en.wikipedia.org/wiki/HTML "HTML") fragment shows how a small graph is being described, in [RDFa](https://en.wikipedia.org/wiki/RDFa "RDFa")-syntax using a [schema.org](https://en.wikipedia.org/wiki/Schema.org "Schema.org") vocabulary and a [Wikidata](https://en.wikipedia.org/wiki/Wikidata "Wikidata") ID:

```
<div vocab="https://schema.org/" typeof="Person">
  <span property="name">Paul Schuster</span> was born in
  <span property="birthPlace" typeof="Place" href="https://www.wikidata.org/entity/Q1731">
