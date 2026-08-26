> \_**WARNING**: The ontology here is out of date with the most recent developments in the SEPIO Model, which has focused on the development of a linkML-based information model, and 'Profiling' framework that supports derivation of custom schema for specific types of knowledge and use cases.
>
> The ontological model in this repository will be updated soon to reflect evolution of SEPIO.
>
> PLEASE USE THE MODELS IN THE NEW REPOSITORY [HERE](https://github.com/sepio-framework/sepio-linkml), as described in the web documentation [here](https://sepio-framework.github.io/sepio-linkml/).

------------------------------------------------------------------------

The **Scientific Evidence and Provenance Information Ontology** (**SEPIO**) is an OWL ontology developed to support rich, computable representations of the evidence and provenance behind scientific assertions. The core ontology defines a flexible and generic model that can be applied in any domain and extended with domain-specific features. The ontological model is the foundation of a larger **SEPIO Framework** that provides mechanisms to create custom schema for specific applications that leverage modern semantic web standards. The framework is comprised of four main components:

1.  **SEPIO Core Ontology**: a computable, 'open-world' domain model encoded in the OWL description logic language.
2.  **SEPIO Information Model**: provides an informal specification for how terms and design patterns defined in the ontology can be applied as a 'closed-world' model for structuring data.
3.  **SEPIO Profiles**: subsets of the maximal information model that can be customized and extended to support a particular use case, and implemented in a formal schema language (e.g. JSON schema, ShEx).
4.  **SEPIO Value Sets**: re-usable collections of terms bound to a particular attribute that can constrain values it can take in a particular Profile.

Data sources or developers interested in using SEPIO should begin by reading the Wiki pages recommended below, and browsing the current version of the SEPIO ontology located [here](https://github.com/monarch-initiative/SEPIO-ontology/blob/master/src/ontology/sepio.owl). Comments or questions can be sent to Matthew Brush at <brushm@ohsu.edu>, or posted as tickets in the [SEPIO issue tracker](https://github.com/monarch-initiative/SEPIO-ontology/issues).

### Resources
