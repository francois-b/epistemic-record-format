Artificial intelligence program by DeepMind

[]

+-----------------------------------------------------------------------+
| Part of a series on                                                   |
+-----------------------------------------------------------------------+
| Artificial intelligence (AI)                                          |
+-----------------------------------------------------------------------+
| Major goals                                                           |
|                                                                       |
| - Artificial general intelligence                                     |
|   - superintelligence                                                 |
| - Intelligent agent                                                   |
| - Recursive self-improvement                                          |
| - Planning                                                            |
| - Computer vision                                                     |
| - General game playing                                                |
| - Knowledge representation                                            |
| - Natural language processing                                         |
| - Robotics                                                            |
| - AI safety                                                           |
+-----------------------------------------------------------------------+
| Approaches                                                            |
|                                                                       |
| - Machine learning                                                    |
| - Data mining                                                         |
| - Symbolic                                                            |
| - Deep learning                                                       |
| - Bayesian networks                                                   |
| - Evolutionary algorithms                                             |
| - Neuro-symbolic AI                                                   |
| - Systems integration                                                 |
| - Open-source                                                         |
| - Open weights                                                        |
| - AI data centers                                                     |
+-----------------------------------------------------------------------+
| Applications                                                          |
|                                                                       |
| - Art                                                                 |
|   - Music                                                             |
| - Bioinformatics                                                      |
| - Deepfake                                                            |
| - Earth sciences                                                      |
| - Finance                                                             |
| - Generative AI                                                       |
|   - Audio                                                             |
|   - Images                                                            |
| - Government                                                          |
| - Healthcare                                                          |
| - Industry                                                            |
| - Software development                                                |
| - Translation                                                         |
| - Military                                                            |
| - Physics                                                             |
| - Projects                                                            |
+-----------------------------------------------------------------------+
| Philosophy                                                            |
|                                                                       |
| - AI alignment                                                        |
| - Artificial consciousness                                            |
| - The bitter lesson                                                   |
| - Chinese room                                                        |
| - Friendly AI                                                         |
| - Ethics                                                              |
| - Existential risk                                                    |
| - Turing test                                                         |
| - Uncanny valley                                                      |
| - Human–AI interaction                                                |
+-----------------------------------------------------------------------+
| History                                                               |
|                                                                       |
| - Timeline                                                            |
| - Progress                                                            |
| - AI winter                                                           |
| - AI boom                                                             |
| - AI build-out financing                                              |
| - AI bubble                                                           |
+-----------------------------------------------------------------------+
| Controversies                                                         |
|                                                                       |
| - Deepfake pornography                                                |
|   - Taylor Swift deepfake pornography controversy                     |
|   - Grok sexual deepfake scandal                                      |
| - Google Gemini image generation controversy                          |
| - It's the Most Terrible Time of the Year                             |
| - Pause Giant AI Experiments                                          |
| - Removal of Sam Altman from OpenAI                                   |
| - Statement on AI Risk                                                |
| - Tay (chatbot)                                                       |
| - Théâtre D'opéra Spatial                                             |
| - Voiceverse NFT plagiarism scandal                                   |
+-----------------------------------------------------------------------+
| Glossary                                                              |
+-----------------------------------------------------------------------+
| - v                                                                   |
| - t                                                                   |
| - e                                                                   |
+-----------------------------------------------------------------------+

AlphaFold is an artificial intelligence (AI) program developed by DeepMind, a subsidiary of Alphabet, which performs predictions of protein structure.^([2]) It is designed using deep learning techniques.^([3])

AlphaFold 1 (2018) placed first in the overall rankings of the 13th Critical Assessment of Structure Prediction (CASP) in December 2018. It was particularly successful at predicting the most accurate structures for targets rated as most difficult by the competition organizers, where no existing template structures were available from proteins with partially similar sequences.

AlphaFold 2 (2020) repeated this placement in the CASP14 competition in November 2020.^([4]) It achieved a level of accuracy much higher than any other entry.^([3][5]) It scored above 90 on CASP's global distance test (GDT) for approximately two-thirds of the proteins, a test measuring the similarity between a computationally predicted structure and the experimentally determined structure, where 100 represents a complete match.^([3][6]) The inclusion of metagenomic data has improved the quality of the prediction of multiple sequence alignments. One of the biggest sources of the training data was the custom-built Big Fantastic Database of 65,983,866 protein families, represented as multiple sequence alignments and Hidden Markov models, covering 2,204,359,010 protein sequences from reference databases, metagenomes, and metatranscriptomes.^([7])

AlphaFold 2's results at CASP14 were described as "astounding"^([8]) and "transformational".^([9]) However, some researchers noted that the accuracy was insufficient for a third of its predictions, and that it did not reveal the underlying mechanism or rules of protein folding for the protein folding problem, which remains unsolved.^([10][11])

Despite this, the technical achievement was widely recognized. On 15 July 2021, the AlphaFold 2 paper was published in Nature as an advance access publication alongside open source software and a searchable database of species proteomes.^([7][12][13]) As of November 2025, the paper had been cited nearly 43,000 times.^([14])

AlphaFold 3 was announced on 8 May 2024. It can predict the structure of complexes created by proteins with DNA, RNA, various ligands, and ions.^([15][16]) The new prediction method shows a minimum 50% improvement in accuracy for protein interactions with other molecules compared to existing methods.^([17])

Demis Hassabis and John Jumper shared one half of the 2024 Nobel Prize in Chemistry, awarded "for protein structure prediction," while the other half went to David Baker "for computational protein design."^([18]) Hassabis and Jumper had previously won the Breakthrough Prize in Life Sciences and the Albert Lasker Award for Basic Medical Research in 2023 for their leadership of the AlphaFold project.^([19][20])

Google announced in 2026 that the team behind AlphaFold had been disbanded, with most being reassigned to work on Gemini while others moved to Isomorphic Labs or left the company entirely.^([21][22])

Background

See also: Protein structure prediction and De novo protein structure prediction

[three individual polypeptide chains at different levels of folding and a cluster of chains]

Proteins consist of chains of amino acids which spontaneously fold to form the three dimensional (3-D) structures of the proteins. The 3-D structure is necessary to understanding the biological function of the protein.

Protein structures can be determined experimentally through techniques such as X-ray crystallography, cryo-electron microscopy and nuclear magnetic resonance (NMR), which are all expensive and time-consuming.^([23]) Such efforts, using the experimental methods, have identified the structures of about 170,000 proteins over the last 60 years, while there are over 200 million known proteins across all life forms.^([6])

Over the years, researchers have applied numerous computational methods to predict the 3D structures of proteins from their amino acid sequences, accuracy of such methods in best possible scenario is close to experimental techniques (NMR) by the use of homology modeling based on molecular evolution. CASP, which was launched in 1994 to challenge the scientific community to produce their best protein structure predictions, found that GDT scores of only about 40 out of 100 can be achieved for the most difficult proteins by 2016.^([6]) AlphaFold started competing in the 2018 CASP using an artificial intelligence (AI) deep learning technique.^([23])

Algorithm

DeepMind is known to have trained the program on over 170,000 protein structures from the Protein Data Bank, a public repository of protein sequences and structures. The program uses a form of attention network, a deep learning technique that focuses on having the AI identify parts of a larger problem, then piece it together to obtain the overall solution.^([3]) The overall training was conducted on processing power between 100 and 200 GPUs.^([3])

AlphaFold 1 (2018)

AlphaFold 1 (2018) was built on work developed by various teams in the 2010s, work that looked at the large databases of related protein sequences now available from many different organisms (most without known 3D structures), to try to find changes at different residues (peptides) that appeared to be correlated, even though the residues were not consecutive in the main chain. Such correlations suggest that the residues may be close to each other physically, even though not close in the sequence, allowing a contact map to be estimated. Building on recent work prior to 2018, AlphaFold 1 extended this by estimating a probability distribution for the distances between residues, effectively transforming the contact map into a distance map. It also used more advanced learning methods than previously to develop the inference.^([24][25]) The code was not made publicly available, except to run on sequences of proteins in the 2018 CASP competition.

AlphaFold 2 (2020)

[]

[]

The 2020 version of the program (AlphaFold 2, 2020) is significantly different from the original version that won CASP 13 in 2018, according to the team at DeepMind.^([27][28])

AlphaFold 1 used a number of separately trained modules to produce a guide potential, which was then combined with a physics-based energy potential. AlphaFold 2 replaced this with a system of interconnected sub-networks, forming a single, differentiable, end-to-end model based on pattern recognition. This model was trained in an integrated manner.^([28][29]) After the neural network's prediction converges, a final refinement step applies local physical constraints using energy minimization based on the AMBER force field. This step only slightly adjusts the predicted structure.^([30])

A key part of the 2020 system are two modules, believed to be based on a transformer design, which are used to progressively refine a vector of information for each relationship (or "edge" in graph-theory terminology) between an amino acid residue of the protein and another amino acid residue (these relationships are represented by the array shown in green); and between each amino acid position and each different sequences in the input sequence alignment (these relationships are represented by the array shown in red).^([29]) Internally these refinement transformations contain layers that have the effect of bringing relevant data together and filtering out irrelevant data (the "attention mechanism") for these relationships, in a context-dependent way, learned from training data. These transformations are iterated, the updated information output by one step becoming the input of the next, with the sharpened residue/residue information feeding into the update of the residue/sequence information, and then the improved residue/sequence information feeding into the update of the residue/residue information.^([29]) As the iteration progresses, according to one report, the "attention algorithm ... mimics the way a person might assemble a jigsaw puzzle: first connecting pieces in small clumps—in this case clusters of amino acids—and then searching for ways to join the clumps in a larger whole."^([6][needs update])

The output of these iterations then informs the final structure prediction module,^([29]) which also uses transformers,^([31]) and is itself then iterated. In an example presented by DeepMind, the structure prediction module achieved a correct topology for the target protein on its first iteration, scored as having a GDT_TS of 78, but with a large number (90%) of stereochemical violations – i.e. unphysical bond angles or lengths. With subsequent iterations the number of stereochemical violations fell. By the third iteration the GDT_TS of the prediction was approaching 90, and by the eighth iteration the number of stereochemical violations was approaching zero.^([32])

The training data was originally restricted to single peptide chains. However, the October 2021 update, named AlphaFold-Multimer, included protein complexes in its training data. DeepMind stated this update succeeded about 70% of the time at accurately predicting protein-protein interactions.^([33])

AlphaFold 3 (2024)

Announced on 8 May 2024, AlphaFold 3 was co-developed by Google DeepMind and Isomorphic Labs, both subsidiaries of Alphabet. AlphaFold 3 is not limited to proteins, as it can also predict the structures of protein complexes with DNA, RNA, post-translational modifications and selected ligands and ions.^([34][15])

AlphaFold 3 introduces the "Pairformer," a deep learning architecture inspired by the transformer, which is considered similar to, but simpler than, the Evoformer used in AlphaFold 2.^([16]) The Pairformer module's initial predictions are refined by a diffusion model. This model begins with a cloud of atoms and iteratively refines their positions, guided by the Pairformer's output, to generate a 3D representation of the molecular structure.^([15])

The AlphaFold server was created to provide free access to AlphaFold 3 for non-commercial research.^([35]) As of November 2025, the AlphaFold 3 research paper has been directly cited more than 9,000 times.^([36])

Competitions

[]

CASP13

In December 2018, DeepMind's AlphaFold placed first in the overall rankings of the 13th Critical Assessment of Techniques for Protein Structure Prediction (CASP).^([37][38])

The program was particularly successfully predicting the most accurate structure for targets rated as the most difficult by the competition organisers, where no existing template structures were available from proteins with a partially similar sequence. AlphaFold gave the best prediction for 25 out of 43 protein targets in this class,^([38][39][40]) achieving a median score of 58.9 on the CASP's global distance test (GDT) score, ahead of 52.5 and 52.4 by the two next best-placed teams,^([41]) who were also using deep learning to estimate contact distances.^([42][43]) Overall, across all targets, AlphaFold 1 achieved a GDT score of 68.5.^([44])

In January 2020, implementations and illustrative code of AlphaFold 1 was released open-source on GitHub.^([45][23]) but, as stated in the "Read Me" file on that website: "This code can't be used to predict structure of an arbitrary protein sequence. It can be used to predict structure only on the CASP13 dataset (links below). The feature generation code is tightly coupled to our internal infrastructure as well as external tools, hence we are unable to open-source it." Therefore, in essence, the code deposited is not suitable for general use but only for the CASP13 proteins. The company has not announced plans to make their code publicly available as of 5 March 2021.

CASP14

In November 2020, DeepMind's new version, AlphaFold 2, won CASP14.^([46][47]) Overall, AlphaFold 2 made the best prediction for 88 out of the 97 targets.^([8])

On the competition's preferred global distance test (GDT) measure of accuracy, the program achieved a median score of 92.4 (out of 100), meaning that more than half of its predictions were scored at better than 92.4% for having their atoms in more-or-less the right place,^([48][49]) a level of accuracy reported to be comparable to experimental techniques like X-ray crystallography.^([27][9][44]) In 2018 AlphaFold 1 had only reached this level of accuracy in two of all of its predictions.^([8]) 88% of predictions in the 2020 competition had a GDT_TS score of more than 80. On the group of targets classed as the most difficult, AlphaFold 2 achieved a median score of 87.^([citation needed])

Measured by the root-mean-square deviation (RMS-D) of the placement of the alpha-carbon atoms of the protein backbone chain, which tends to be dominated by the performance of the worst-fitted outliers, 88% of AlphaFold 2's predictions had an RMS deviation of less than 4 Å for the set of overlapped C-alpha atoms.^([8]) 76% of predictions achieved better than 3 Å, and 46% had a C-alpha atom RMS accuracy better than 2 Å,^([8]) with a median RMS deviation in its predictions of 2.1 Å for a set of overlapped CA atoms.^([8]) AlphaFold 2 also achieved an accuracy in modelling surface side chains described as "really really extraordinary".

To further validate AlphaFold 2, the conference organizers approached four leading experimental groups working on structures they found particularly challenging and had been unable to determine. In all four cases the three-dimensional models produced by AlphaFold 2 were sufficiently accurate to determine structures of these proteins by molecular replacement. These included target T1100 (Af1503), a small membrane protein studied by experimentalists for ten years.^([6])

Of the three structures that AlphaFold 2 had the least success in predicting, one was an unusual multidomain complex consisting of 52 identical copies of the same domain. For all targets with a single domain, excluding only one very large protein and the two structures determined by NMR, AlphaFold 2 achieved a GDT_TS score of over 80.

CASP15

In 2022, DeepMind did not enter CASP15, but most of the entrants used AlphaFold or tools incorporating AlphaFold.^([50])

Reception and adoption

Public and scientific reception

AlphaFold 2 scoring more than 90 in CASP's global distance test (GDT) was considered a great achievement in computational biology.^([6][9]) Nobel Prize winner and structural biologist Venki Ramakrishnan called the result "a stunning advance on the protein folding problem",^([6]) adding that "It has occurred decades before many people in the field would have predicted. It will be exciting to see the many ways in which it will fundamentally change biological research."^([46])

AlphaFold 2's success received wide media attention.^([51][46][52]) News pieces appeared in the science press, such as Nature,^([9]) Science,^([6]) MIT Technology Review,^([3]) and New Scientist,^([53][54]) and the story was covered by national newspapers.^([55][56][57][58]) A frequent theme was the ability to predict protein structures based on the constituent amino acid sequence, expected to have benefits in the life sciences—accelerating drug discovery and enabling better understanding of diseases.^([9][59]) Some have noted that even a perfect answer to the protein prediction problem still leaves questions about the protein folding problem (and thus protein dynamics)—understanding in detail how the folding process actually occurs in nature (and how sometimes they can also misfold).^([60])

[]

In 2023, Demis Hassabis and John Jumper won the Breakthrough Prize in Life Sciences^([20]) as well as the Albert Lasker Award for Basic Medical Research for their management of the AlphaFold project.^([61]) Hassabis and Jumper proceeded to win the Nobel Prize in Chemistry in 2024 for their work on "protein structure prediction" with David Baker of the University of Washington.^([19][62])

Usage in scientific literature

AlphaFold's predicted structures are widely used in biological research, though the precise scale of that use is difficult to measure. More than 40% of protein-structure papers published in 2023 in Cell, Nature, and Science cited AlphaFold 2.^([63]) A 2024 bibliometric analysis of the Web of Science database identified 1,680 peer-reviewed papers referencing AlphaFold published between January 2019 and May 2024.^([64]) Measures of this kind rely on authors citing the AlphaFold papers when they use the tool, a convention encouraged but not enforced by the maintainers of the AlphaFold Protein Structure Database.

Attempts to validate these counts against the full text of papers suggest that citations to foundational AlphaFold papers can both overstate and understate how widely the tool is used. In an analysis of about 8,900 papers in the PubMed Central Open Access corpus that mentioned AlphaFold, roughly 30% cited none of three foundational AlphaFold papers, while only about half of the papers citing at least one of those three mentioned AlphaFold anywhere in their text. ^([65]) A smaller manual check of 100 papers from a curated protein-literature database found a similar shortfall, with fewer than half of those mentioning AlphaFold including a formal citation.^([66])

Effects on research practice

Some quantitative studies have attempted to assess whether AlphaFold changed the direction or conduct of research, rather than simply its volume. A 2026 working paper by Ryan Hill and Carolyn Stein treated the July 2021 release of the AlphaFold Protein Structure Database as a natural experiment, comparing proteins that already had experimental structures against those that did not. They found that basic research on proteins lacking prior structural information rose by 23 to 32% relative to proteins that already had structures, and characterized this as a "floodlight" effect that widened the range of proteins under study,^([66]) as opposed to a narrowing “streetlight effect” that had been suggested as a possible outcome.^([67]) A 2026 preprint reported a parallel pattern across the field, finding that a long-running decline in the share of experimental structures targeting novel proteins halted after AlphaFold 2's release, with the change concentrated among studies citing AlphaFold 2 and among novel targets for which the model produced high-confidence predictions.^([68]) A 2025 report by the Innovation Growth Lab, funded by Google DeepMind but conducted independently, reported a related pattern at the level of individual researchers. Those who cited AlphaFold 2 submitted experimental structures to the Protein Data Bank at higher rates than a matched comparison group, and the structures they submitted were more likely to be dissimilar to previously known ones.^([69]) A working paper by Zhengyi Yu similarly found that structural biologists' published work moved measurably further from their own prior research after AlphaFold 2 became available, by roughly 3% on a measure derived from SciBERT embeddings of titles, abstracts and keywords.^([63])

Hill and Stein found little evidence that predicted structures displaced experimental work at the level of the field as a whole, with the overall rate of experimental structure determination almost unchanged, and argued that researchers were instead using predictions to make experimental work more efficient: by the end of their sample, experimental structures lacking a closely related known structure used AlphaFold predictions as templates more than 60% of the time, compared with 15% for those that had one. In an accompanying survey of 427 structural biologists, respondents reported solving slightly more structures per year after AlphaFold's release while devoting a smaller share of laboratory time to structure determination.^([66])

Source code

Open access to source code of several AlphaFold versions (excluding AlphaFold 3) has been provided by DeepMind in 2022 after requests from the scientific community.^([70][71][72]) The source code and weights of AlphaFold 3 were made available for non-commercial use to the scientific community upon request in November 2024. It became publicly available in February 2025, still retaining the non-commercial restriction.^([73])

Clones and derivatives

A number of AlphaFold clones have also been published, mostly with permissive license terms. Clones for AlphaFold3 include ByteDance's Protenix (Apache 2.0 License),^([74]) AlQuraishi Laboratory's OpenFold-3 (MIT license), and Boltz-1/2 (MIT license).^([75])

There are also clones for older versions, though they became less relevant with the open-source release of AlphaFold 1 and 2 source codes. Still relevant are models, both open- and closed-source, that include modifications to the AlphaFold architecture. For AlphaFold 2, a notable example is ESMFold from Meta, which replaces the multiple sequence alignment with the latent space of a protein language model.^([76])

Open-source tools that complement AlphaFold have also been made. One well-cited example is ColabFold, which uses MMseqs2^([77]) instead of HHblits to speed up the sequence search, allowing the AlphaFold pipelines to run quickly on Google Colab.^([78])

Database of protein models generated by AlphaFold

+-------------------------------------+-------------------------------------+
| Content                                                                   |
+-------------------------------------+-------------------------------------+
| Data types                          | protein structure prediction        |
| captured                            |                                     |
+-------------------------------------+-------------------------------------+
| Organisms                           | all UniProt proteomes               |
+-------------------------------------+-------------------------------------+
| Contact                                                                   |
+-------------------------------------+-------------------------------------+
| Research center                     | EMBL-EBI                            |
+-------------------------------------+-------------------------------------+
| Primary citation                    | ^([7])                              |
+-------------------------------------+-------------------------------------+
| Access                                                                    |
+-------------------------------------+-------------------------------------+
| Website                             | https://www.alphafold.ebi.ac.uk/    |
+-------------------------------------+-------------------------------------+
| Download URL                        | yes                                 |
+-------------------------------------+-------------------------------------+
| Tools                                                                     |
+-------------------------------------+-------------------------------------+
| Web                                 | yes                                 |
+-------------------------------------+-------------------------------------+
| Miscellaneous                                                             |
+-------------------------------------+-------------------------------------+
| License                             | CC-BY 4.0                           |
+-------------------------------------+-------------------------------------+
| Curation policy                     | automatic                           |
+-------------------------------------+-------------------------------------+

: AlphaFold Protein Structure Database {#mwAsU .infobox .vevent style="width:" about="#mwt278"}

The AlphaFold Protein Structure Database (AFDB), a joint project between AlphaFold and EMBL-EBI, was launched on July 22, 2021. At launch, the database contained AlphaFold 1-predicted models for nearly the complete UniProt proteome of humans and 20 model organisms, totaling over 365,000 proteins. The database does not include proteins with fewer than 16 or more than 2700 amino acid residues,^([79]) but for humans they are available in the whole batch file.^([80]) AlphaFold's initial goal (as of early 2022) was to expand the database to cover most of the UniRef90 set, which contains over 100 million proteins. As of May 15, 2022, the database contained 992,316 predictions.^([81])

In July 2021, UniProt-KB and InterPro^([82]) has been updated to show AlphaFold predictions when available.^([83])

On July 28, 2022, the team uploaded to the database the structures of around 200 million proteins from 1 million species, covering nearly every known protein on the planet.^([84]) The number as of 2024 is 214 million, with 26 million being duplicates (exact sequence matches) of another protein in the database. The predicted structures can differ significantly between duplicates.^([85])

As of 2025, the AFDB uses AlphaFold 2 for its predictions. All structures produced remain monomeric, but multimeric structures produced by other databases are linked on the page through the 3D-Beacons API. Foldseek, which provides fast and accurate structure searches, is also integrated. Information from AlphaMissense (a tool that uses AlphaFold to predict the outcome of missense mutations) is also integrated.^([86])

Derived databases

AlphaFill adds cofactors to AlphaFold models where appropriate. This is achieved by searching the Protein Data Bank for similar structures and transplanting cofactors to analogous positions.^([87]) It is also linked to by UniProt.

TmAlphaFold docks AlphaFold models to biological membranes, similar to what OPM does for PDB structures.^([88])

AFTM uses AlphaFold models to identify transmembrane regions in human proteins, similar to what PDBTM does for PDB structures.^([88])

ChannelsDB 2.0 uses PDB or AlphaFill models to calculate the pathway a molecule may take to reach an enzyme's active site or to reach another side of a transmembrane pore.^([89])

The AFDB is not updated with UniProt sequences changes. AlphaSync keeps the AFDB in sync with UniProt entry changes, generating updated structures, residue-level features and contacts. It tries to use an AFDB entry for the exact updated sequence when available and run AlphaFold 2 independently otherwise. It fills in AFDB's blank for large (> 2,700 aa) proteins and proteins with special FASTA characters such as B, Z, U or X.^([90])

The Encyclopedia of Domains (TED) applies the domain-recognition method from CATH database to 188 million unique structures from the AFDB, identifying nearly 365 million domains, which is 100 million more than what sequence-based methods could identify.^([85])

The Evolutionary Classification of Protein Domains database (ECOD) assigns ECOD classifications to all SwissProt proteins in AFDB.^([91])

Unrelated AlphaFold-based databases

isoform.io is a database of AlphaFold2-generated structures of proposed splice isoforms in the human genome. It includes information from 237,275 human transcripts. It has been used to detect errors in the mRNA predictions for a handful of genes.^([92])

Performance, validations and limitations

AlphaFold has shown certain limitations.

AlphaFold 1, 2, and AlphaFold DB

- AlphaFold DB provides models of individual protein chains (monomers), rather than their biologically relevant complexes.^([93])
- Many protein regions are predicted with low confidence score, including the intrinsically disordered protein regions.^([94])
- Alphafold-2 was validated for predicting effects of point mutations on structure^([95]) and free energy,^([96]) with a partial success.

AlphaFold 3

- Across several benchmarks, AlphaFold3 has demonstrated, on average, superior performance to conventional search-based docking algorithms in predicting small-molecule–protein binding modes.^([97])
- AlphaFold 3 version can predict structures of protein complexes with a very limited set of selected cofactors and co- and post-translational modifications.^([98]) Between 50% and 70% of the structures of the human proteome are incomplete without covalently-attached glycans.^([99][93])
- Studies have shown that although AlphaFold3 can jointly model protein–ligand co-folding, its accuracy drops markedly on test cases with low similarity to its training data—an area of particular importance for drug discovery.^([100]) Other work has found that AlphaFold is insensitive to adversarial decoys generated by altering the physicochemical properties of binding pockets, suggesting potential reliance on training-set memorization rather than genuine chemical awareness.^([101])

General

- In the algorithm, the residues are moved freely, without any restraints. Therefore, during modeling the integrity of the chain is not maintained. As a result, AlphaFold may produce topologically wrong results, like structures with an arbitrary number of knots. (The study uses AlphaFold 2.3.2.)^([102])
- The model relies, to some extent, on co-evolutionary information from similar proteins. Therefore, it may not perform as well on synthetic proteins or proteins with very low homology to those in the training database.^([103]) Benchmarks support this limitation: when applied to naturally evolved de novo proteins, AlphaFold2 often yields low-confidence and predictor-dependent models, and protein language model–based (alignment-free) structure predictors can perform better for orphan proteins than AlphaFold2.^([104][105]) More broadly, comparative analyses show that structure/disorder predictors (including AlphaFold2 and ESMFold) behave differently on de novo and random-sequence proteins than on conserved proteins, and that confidence metrics can show different relationships with predicted disorder in these sequence classes.^([106][107])
- The model's ability to predict multiple native conformations of proteins is limited.
- Proteins are inherently dynamic, and accessing multiple native conformations is often crucial for understanding their function. However, the model has limited capability to represent these alternative conformational states, particularly those that coexist or interconvert in biological environments.

Applications

See also: Earth BioGenome Project

AlphaFold has been used to predict structures of proteins of SARS-CoV-2, the causative agent of COVID-19. The structures of these proteins were pending experimental detection in early 2020.^([108][9]) Results were reviewed by scientists at the Francis Crick Institute in the United Kingdom before being released to the broader research community. The team also confirmed accurate prediction against the experimentally determined SARS-CoV-2 spike protein that was shared in the Protein Data Bank, an international open-access database, before releasing the computationally determined structures of the under-studied protein molecules.^([109]) The team acknowledged that although these protein structures might not be the subject of ongoing therapeutical research efforts, they will add to the community's understanding of the SARS-CoV-2 virus.^([109]) Specifically, AlphaFold 2's prediction of the structure of the ORF3a protein was very similar to the structure determined by researchers at University of California, Berkeley using cryo-electron microscopy. This specific protein is believed to assist the virus in breaking out of the host cell once it replicates. This protein is also believed to play a role in triggering the inflammatory response to the infection.^([110])

Published works

- Andrew W. Senior et al. (December 2019), "Protein structure prediction using multiple deep neural networks in the 13th Critical Assessment of Protein Structure Prediction (CASP13)", Proteins: Structure, Function, Bioinformatics 87(12) 1141–1148 doi:10.1002/prot.25834
- Andrew W. Senior et al. (15 January 2020), "Improved protein structure prediction using potentials from deep learning", Nature 577 706–710 doi:10.1038/s41586-019-1923-7
- John Jumper et al. (December 2020), "High Accuracy Protein Structure Prediction Using Deep Learning", in Fourteenth Critical Assessment of Techniques for Protein Structure Prediction (Abstract Book), pp. 22–24
- John Jumper et al. (December 2020), "AlphaFold 2". Presentation given at CASP 14.
- Abramson, J., Adler, J., Dunger, J. et al. (May 2024), "Accurate structure prediction of biomolecular interactions with AlphaFold 3", Nature 630, 493–500 (2024)

See also

- Folding@home
- IBM Blue Gene
- Foldit
- Rosetta@home
- Human Proteome Folding Project
- Predicted Aligned Error

References

1.  ↑ Tunyasuvunakool, Kathryn; Adler, Jonas; Wu, Zachary; Green, Tim; Zielinski, Michal; Žídek, Augustin; Bridgland, Alex; Cowie, Andrew; Meyer, Clemens; Laydon, Agata; Velanka*, Sameer; Kleywegt *, Gerard J; Bateman*, Alex; Evans, Richard; Pritzel, Alexander; Figurnov, Michael; Ronneberger, Olaf; Bates, Russ; Kohl, Simon A. A.; Potapenko, Anna; Ballard, Andrew J; Romera-Paredes, Bernardino; Nikolov, Stanislav; Jain, Rishub; Clancy, Ellen; Reiman, David; Petersen, Stig; Senior, Andrew; Kavukcuoglu, Koray; Birney *, Ewan; Kohli, Pushmeet; Jumper, John; Hassabis, Demis (2021-07-22). "Enabling high-accuracy protein structure prediction at the proteome scale". Google DeepMind. (* external authors). Retrieved 2026-08-17.
2.  ↑ "AlphaFold". Deepmind. Archived from the original on 19 January 2021. Retrieved 30 November 2020.
3.  1 2 3 4 5 6 "DeepMind's protein-folding AI has solved a 50-year-old grand challenge of biology". MIT Technology Review. Archived from the original on 2021-08-28. Retrieved 2020-11-30.
4.  ↑ Shead, Sam (2020-11-30). "DeepMind solves 50-year-old 'grand challenge' with protein folding A.I." CNBC. Archived from the original on 2021-01-28. Retrieved 2020-11-30.
5.  ↑ Stoddart, Charlotte (1 March 2022). "Structural biology: How proteins got their close-up". Knowable Magazine. doi:10.1146/knowable-022822-1. S2CID 247206999. Archived from the original on 7 April 2022. Retrieved 25 March 2022.
6.  1 2 3 4 5 6 7 8 Robert F. Service, 'The game has changed.' AI triumphs at solving protein structures Archived 2023-06-24 at the Wayback Machine, Science, 30 November 2020
7.  1 2 3 Jumper, John; Evans, Richard; Pritzel, Alexander; Green, Tim; Figurnov, Michael; Ronneberger, Olaf; Tunyasuvunakool, Kathryn; Bates, Russ; Žídek, Augustin; Potapenko, Anna; Bridgland, Alex; Meyer, Clemens; Kohl, Simon A A; Ballard, Andrew J; Cowie, Andrew; Romera-Paredes, Bernardino; Nikolov, Stanislav; Jain, Rishub; Adler, Jonas; Back, Trevor; Petersen, Stig; Reiman, David; Clancy, Ellen; Zielinski, Michal; Steinegger, Martin; Pacholska, Michalina; Berghammer, Tamas; Bodenstein, Sebastian; Silver, David; Vinyals, Oriol; Senior, Andrew W; Kavukcuoglu, Koray; Kohli, Pushmeet; Hassabis, Demis (2021-07-15). "Highly accurate protein structure prediction with AlphaFold". Nature. 596 (7873): 583–589. Bibcode:2021Natur.596..583J. doi:10.1038/s41586-021-03819-2. PMC 8371605. PMID 34265844.
8.  1 2 3 4 5 6 Mohammed AlQuraishi, CASP14 scores just came out and they're astounding Archived 2022-08-04 at the Wayback Machine, Twitter, 30 November 2020.
9.  1 2 3 4 5 6 Callaway, Ewen (2020-11-30). "'It will change everything': DeepMind's AI makes gigantic leap in solving protein structures". Nature. 588 (7837): 203–204. Bibcode:2020Natur.588..203C. doi:10.1038/d41586-020-03348-4. PMID 33257889. S2CID 227243204.
10. ↑ Stephen Curry, No, DeepMind has not solved protein folding Archived 2022-07-29 at the Wayback Machine, Reciprocal Space (blog), 2 December 2020
11. ↑ Ball, Phillip (9 December 2020). "Behind the screens of AlphaFold". Chemistry World. Archived from the original on 15 August 2021. Retrieved 10 December 2020.
12. ↑ "GitHub - deepmind/alphafold: Open source code for AlphaFold". GitHub. Archived from the original on 2021-07-23. Retrieved 2021-07-24.
13. ↑ "AlphaFold Protein Structure Database". alphafold.ebi.ac.uk. Archived from the original on 2021-07-24. Retrieved 2021-07-24.
14. ↑ "Google Scholar". scholar.google.com. Retrieved 2025-05-01.
15. 1 2 3 "AlphaFold 3 predicts the structure and interactions of all of life's molecules". Google. 2024-05-08. Archived from the original on 2024-05-09. Retrieved 2024-05-09.
16. 1 2 Abramson, Josh; Adler, Jonas; Dunger, Jack; Evans, Richard; Green, Tim; Pritzel, Alexander; Ronneberger, Olaf; Willmore, Lindsay; Ballard, Andrew J.; Bambrick, Joshua; Bodenstein, Sebastian W.; Evans, David A.; Hung, Chia-Chun; O'Neill, Michael; Reiman, David (2024-05-08). "Accurate structure prediction of biomolecular interactions with AlphaFold 3". Nature. 630 (8016): 493–500. Bibcode:2024Natur.630..493A. doi:10.1038/s41586-024-07487-w. ISSN 1476-4687. PMC 11168924. PMID 38718835.
17. ↑ "Beyond AlphaFold 3: Navigating Future Challenges in Protein Structure Prediction". 2024-05-10. Retrieved 2024-11-29.
18. ↑ "Press release: The Nobel Prize in Chemistry 2024". The Royal Swedish Academy of Sciences. 9 October 2024. Retrieved 29 November 2024. “The Royal Swedish Academy of Sciences has decided to award the Nobel Prize in Chemistry 2024 with one half to David Baker..."for computational protein design" and the other half jointly to Demis Hassabis... John Jumper..."for protein structure prediction"”
19. 1 2 Hunt, Christian Edwards, Katie (9 October 2024). "Scientists who used AI to 'crack the code' of almost all proteins win Nobel Prize in chemistry". CNN. Archived from the original on 10 October 2024. Retrieved 9 October 2024.{{cite news}}: CS1 maint: multiple names: authors list (link)
20. 1 2 Knapp, Alex. "2023 Breakthrough Prizes Announced: Deepmind's Protein Folders Awarded $3 Million". Forbes. Archived from the original on 2024-05-09. Retrieved 2024-05-09.
21. ↑ Murgia, Madhumuti (29 July 2026). "Google DeepMind dismantles Nobel-winning AlphaFold team in strategy shift". Financial Times. Retrieved 29 July 2026.
22. ↑ "Google shuts down its Nobel-prize winning AlphaFold project as it focuses on Gemini". Engadget. Retrieved 2026-07-29.
23. 1 2 3 "AlphaFold: Using AI for scientific discovery". Deepmind. 15 January 2020. Archived from the original on 2022-03-07. Retrieved 2020-11-30.
24. ↑ Mohammed AlQuraishi (May 2019), AlphaFold at CASP13 Archived 2021-11-22 at the Wayback Machine, Bioinformatics, 35(22), 4862–4865 doi:10.1093/bioinformatics/btz422. See also Mohammed AlQuraishi (December 9, 2018), AlphaFold @ CASP13: "What just happened?" Archived 2022-07-29 at the Wayback Machine (blog post).
    Mohammed AlQuraishi (15 January 2020), A watershed moment for protein structure prediction Archived 2022-06-23 at the Wayback Machine, Nature 577, 627–628 doi:10.1038/d41586-019-03951-0
25. ↑ AlphaFold: Machine learning for protein structure prediction Archived 2022-05-12 at the Wayback Machine, Foldit, 31 January 2020
26. 1 2 Jumper, John; et al. (August 2021). "Highly accurate protein structure prediction with AlphaFold". Nature. 596 (7873): 583–589. Bibcode:2021Natur.596..583J. doi:10.1038/s41586-021-03819-2. ISSN 1476-4687. PMC 8371605. PMID 34265844.
27. 1 2 "DeepMind is answering one of biology's biggest challenges". The Economist. 2020-11-30. ISSN 0013-0613. Archived from the original on 2020-12-03. Retrieved 2020-11-30.
28. 1 2 Jeremy Kahn, Lessons from DeepMind's breakthrough in protein-folding A.I. Archived 2022-04-08 at the Wayback Machine, Fortune, 1 December 2020
29. 1 2 3 4 See block diagram. Also John Jumper et al. (1 December 2020), AlphaFold 2 presentation Archived 2022-07-03 at the Wayback Machine, slide 10
30. ↑ John Jumper et al., conference abstract (December 2020)
31. ↑ The structure module is stated to use a "3-d equivariant transformer architecture" (John Jumper et al. (1 December 2020), AlphaFold 2 presentation Archived 2022-07-03 at the Wayback Machine, slide 12).
    One design for a transformer network with SE(3)-equivariance was proposed in Fabian Fuchs et al SE(3)-Transformers: 3D Roto-Translation Equivariant Attention Networks Archived 2021-10-07 at the Wayback Machine, NeurIPS 2020; also website Archived 2022-07-03 at the Wayback Machine. It is not known how similar this may or may not be to what was used in AlphaFold.
    See also the blog post Archived 2020-12-08 at the Wayback Machine by AlQuaraishi on this, or the more detailed post Archived 2022-07-03 at the Wayback Machine by Fabian Fuchs
32. ↑ John Jumper et al. (1 December 2020), AlphaFold 2 presentation Archived 2022-07-03 at the Wayback Machine, slides 12 to 20
33. ↑ Callaway, Ewen (13 April 2022). "What's next for AlphaFold and the AI protein-folding revolution". Nature. 604 (7905): 234–238. Bibcode:2022Natur.604..234C. doi:10.1038/d41586-022-00997-5. PMID 35418629. S2CID 248156195.
34. ↑ Metz, Cade (2024-05-08). "Google Unveils A.I. for Predicting Behavior of Human Molecules". The New York Times. ISSN 0362-4331. Archived from the original on 2024-10-10. Retrieved 2024-05-09.
35. ↑ "A non-commercial server of AlphaFold-3". Archived from the original on 2024-10-10. Retrieved 2024-05-12.
36. ↑ "Google Scholar". scholar.google.com. Retrieved 2025-05-01.
37. ↑ Group performance based on combined z-scores Archived 2022-03-08 at the Wayback Machine, CASP 13, December 2018. (AlphaFold = Team 043: A7D)
38. 1 2 Sample, Ian (2 December 2018). "Google's DeepMind predicts 3D shapes of proteins". The Guardian. Archived from the original on 18 July 2019. Retrieved 30 November 2020.
39. ↑ "AlphaFold: Using AI for scientific discovery". Deepmind. January 2020. Archived from the original on 10 October 2024. Retrieved 30 November 2020.
40. ↑ Singh, Arunima (2020). "Deep learning 3D structures". Nature Methods. 17 (3): 249. doi:10.1038/s41592-020-0779-y. ISSN 1548-7105. PMID 32132733. S2CID 212403708.
41. ↑ See CASP 13 data tables Archived 2022-03-14 at the Wayback Machine for 043 A7D, 322 Zhang, and 089 MULTICOM
42. ↑ Wei Zheng et al,Deep-learning contact-map guided protein structure prediction in CASP13 Archived 2022-01-22 at the Wayback Machine, Proteins: Structure, Function, and Bioinformatics, 87(12) 1149–1164 doi:10.1002/prot.25792; and slides Archived 2022-07-26 at the Wayback Machine
43. ↑ Hou, Jie; Wu, Tianqi; Cao, Renzhi; Cheng, Jianlin (2019-04-25). "Protein tertiary structure modeling driven by deep learning and contact distance prediction in CASP13". Proteins: Structure, Function, and Bioinformatics. 87 (12). Wiley: 1165–1178. bioRxiv 10.1101/552422. doi:10.1002/prot.25697. ISSN 0887-3585. PMC 6800999. PMID 30985027.
44. 1 2 "DeepMind Breakthrough Helps to Solve How Diseases Invade Cells". Bloomberg.com. 2020-11-30. Archived from the original on 2022-04-05. Retrieved 2020-11-30.
45. ↑ "deepmind/deepmind-research". GitHub. Archived from the original on 2022-02-01. Retrieved 2020-11-30.
46. 1 2 3 "AlphaFold: a solution to a 50-year-old grand challenge in biology". Deepmind. 30 November 2020. Archived from the original on 30 November 2020. Retrieved 30 November 2020.
47. ↑ "DeepMind's protein-folding AI has solved a 50-year-old grand challenge of biology". MIT Technology Review. Archived from the original on 28 August 2021. Retrieved 30 November 2020.
48. ↑ For the GDT_TS measure used, each atom in the prediction scores a quarter of a point if it is within 8 Å (0.80 nm) of the experimental position; half a point if it is within 4 Å, three-quarters of a point if it is within 2 Å, and a whole point if it is within 1 Å.
49. ↑ To achieve a GDT_TS score of 92.5, mathematically at least 70% of the structure must be accurate to within 1 Å, and at least 85% must be accurate to within 2 Å,
50. ↑ Callaway, Ewen (2022-12-13). "After AlphaFold: protein-folding contest seeks next big breakthrough". Nature. 613 (7942): 13–14. doi:10.1038/d41586-022-04438-1. PMID 36513827. S2CID 254660427.
51. ↑ Artificial intelligence solution to a 50-year-old science challenge could 'revolutionise' medical research Archived 2022-04-24 at the Wayback Machine (press release), CASP organising committee, 30 November 2020
52. ↑ Brigitte Nerlich, Protein folding and science communication: Between hype and humility Archived 2022-02-15 at the Wayback Machine, University of Nottingham blog, 4 December 2020
53. ↑ Michael Le Page, DeepMind's AI biologist can decipher secrets of the machinery of life Archived 2022-08-02 at the Wayback Machine, New Scientist, 30 November 2020
54. ↑ The predictions of DeepMind's latest AI could revolutionise medicine Archived 2021-11-07 at the Wayback Machine, New Scientist, 2 December 2020
55. ↑ Tom Whipple, Deepmind finds biology's 'holy grail' with answer to protein problem, The Times (online), 30 November 2020.
    Tom Whipple wrote six articles on the subject for The Times when the news broke. (thread Archived 2021-11-08 at the Wayback Machine).
56. ↑ Cade Metz, London A.I. Lab Claims Breakthrough That Could Accelerate Drug Discovery Archived 2022-08-04 at the Wayback Machine, New York Times, 30 November 2020
57. ↑ Ian Sample,DeepMind AI cracks 50-year-old problem of protein folding Archived 2020-11-30 at the Wayback Machine, The Guardian, 30 November 2020
58. ↑ Lizzie Roberts, 'Once in a generation advance' as Google AI researchers crack 50-year-old biological challenge Archived 2022-08-04 at the Wayback Machine. Daily Telegraph, 30 November 2020
59. ↑ Tim Hubbard, The secret of life, part 2: the solution of the protein folding problem. Archived 2022-05-14 at the Wayback Machine, medium.com, 30 November 2020
60. ↑ e.g. Greg Bowman, Protein folding and related problems remain unsolved despite AlphaFold's advance Archived 2022-07-13 at the Wayback Machine, Folding@home blog, 8 December 2020
61. ↑ Sample, Ian (2023-09-21). "Team behind AI program AlphaFold win Lasker science prize". The Guardian. ISSN 0261-3077. Archived from the original on 2024-10-10. Retrieved 2024-05-09.
62. ↑ "The Nobel Prize in Chemistry 2024". NobelPrize.org. Archived from the original on 2024-10-09. Retrieved 2024-10-10.
63. 1 2 Yu, Zhengyi (February 2026). The Impacts of AI at Scale: Evidence from Research Scientists (Working paper). CESifo Working Papers. Munich: CESifo. ISSN 2364-1428. SSRN 6190983.
64. ↑ Guo, Song-Bin; Meng, Yuan; Lin, Liteng; Zhou, Zhen-Zhong; Li, Hai-Long; Tian, Xiao-Peng; Huang, Wei-Juan (2024-10-05). "Artificial intelligence alphafold model for molecular biology and drug discovery: a machine-learning-driven informatics investigation". Molecular Cancer. 23 (1): 223. doi:10.1186/s12943-024-02140-6. ISSN 1476-4598. PMC 11452995. PMID 39369244.
65. ↑ Cui, Haochuan; Wang, Yuzhuo; Li, Kai (2025). Beyond Citations: Tracing and Validating the Rapid Adoption of AlphaFold in Biomedical Research Through Full-Text Analysis (PDF). 20th International Conference on Scientometrics and Informetrics (ISSI 2025). Yerevan, Armenia: ISSI Society. pp. 2002–2009. doi:10.51408/issi2025_147.
66. 1 2 3 Hill, Ryan; Stein, Carolyn (17 July 2026) [First version 11 March 2026]. How Artificial Intelligence Shapes Science: Evidence from AlphaFold (PDF) (Working paper) (Revised ed.). Earlier version issued as NBER Working Paper No. 35143 doi:10.3386/w35143. Retrieved 2026-07-30.
67. ↑ Hoelzemann, Johannes; Manso, Gustavo; Nagaraj, Abhishek; Tranchero, Matteo (May 2024). The Streetlight Effect in Data-Driven Exploration (Working paper). NBER Working Papers. Cambridge, MA: National Bureau of Economic Research. doi:10.3386/w32401.
68. ↑ Sun, Mengyi; Choi, Sukwoong; Yin, Yian (2026-04-07). "AI predictions and the expansion of scientific frontiers: Evidence from structural biology". bioRxiv 10.64898/2026.04.06.716821.
69. ↑ "AI in Science: Evidence of impact from AlphaFold 2". Innovation Growth Lab. 2025-11-24. Retrieved 2026-07-30.
70. ↑ Domínguez, Nuño (2020-12-02). "La inteligencia artificial arrasa en uno de los problemas más importantes de la biología". El País (in Spanish). Archived from the original on 2022-07-26. Retrieved 2024-05-12.
71. ↑ Briggs, David (2020-12-04). "If Google's Alphafold2 really has solved the protein folding problem, they need to show their working". The Skeptic. Archived from the original on 2024-05-12. Retrieved 2024-05-12.
72. ↑ Demis Hassabis, "Brief update on some exciting progress on #AlphaFold!" Archived 2022-07-22 at the Wayback Machine (tweet), via twitter, 18 June 2021
73. ↑ google-deepmind/alphafold3, Google DeepMind, 2025-02-08, retrieved 2025-02-08
74. ↑ ByteDance AML AI4Science Team; Chen, Xinshi; Zhang, Yuxuan; Lu, Chan; Ma, Wenzhi; Guan, Jiaqi; Gong, Chengyue; Yang, Jincai; Zhang, Hanyu; Zhang, Ke; Wu, Shenghao; Zhou, Kuangqi; Yang, Yanping; Liu, Zhenyu; Wang, Lan; Shi, Bo; Shi, Shaochen; Xiao, Wenzhi (2025-01-11). "Protenix - Advancing Structure Prediction Through a Comprehensive AlphaFold3 Reproduction". bioRxiv 10.1101/2025.01.08.631967.{{cite bioRxiv}}: CS1 maint: numeric names: authors list (link)
75. ↑ Naddaf, Miryam (28 October 2025). "Open-source protein structure AI aims to match AlphaFold". Nature. doi:10.1038/d41586-025-03546-y. PMID 41152525.
76. ↑ Lin, Z; Akin, H; Rao, R; Hie, B; Zhu, Z; Lu, W; Smetanin, N; Verkuil, R; Kabeli, O; Shmueli, Y; Dos Santos Costa, A; Fazel-Zarandi, M; Sercu, T; Candido, S; Rives, A (17 March 2023). "Evolutionary-scale prediction of atomic-level protein structure with a language model". Science. 379 (6637): 1123–1130. Bibcode:2023Sci...379.1123L. doi:10.1126/science.ade2574. PMID 36927031.
77. ↑ Steinegger, Martin; Söding, Johannes (2017). "MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets". Nature Biotechnology. 35 (11): 1026–1028. doi:10.1038/nbt.3988. hdl:11858/00-001M-0000-002E-1967-3. ISSN 1087-0156. PMID 29035372.
78. ↑ Mirdita, Milot; Schütze, Konstantin; Moriwaki, Yoshitaka; Heo, Lim; Ovchinnikov, Sergey; Steinegger, Martin (2022-05-30). "ColabFold: Making protein folding accessible to all". Nature Methods. 19 (6): 679–682. doi:10.1038/s41592-022-01488-1. PMC 9184281. PMID 35637307.
79. ↑ "AlphaFold Protein Structure Database". alphafold.ebi.ac.uk. Archived from the original on 2022-07-29. Retrieved 2021-07-29.
80. ↑ "AlphaFold Protein Structure Database". alphafold.ebi.ac.uk. Archived from the original on 29 July 2022. Retrieved 27 July 2021.
81. ↑ "AlphaFold Protein Structure Database". www.alphafold.ebi.ac.uk. Archived from the original on 2022-08-02. Retrieved 2021-07-24.
82. ↑ InterPro (22 July 2021). "Alphafold Structure Predictions Available In Interpro". proteinswebteam.github.io. Archived from the original on 2021-11-05. Retrieved 2021-07-29.
83. ↑ "Putting the power of AlphaFold into the world's hands". Deepmind. 22 July 2022. Archived from the original on 24 July 2021. Retrieved 24 July 2021.
84. ↑ Callaway, Ewen (2022-07-28). "'The entire protein universe': AI predicts shape of nearly every known protein". Nature. 608 (7921): 15–16. Bibcode:2022Natur.608...15C. doi:10.1038/d41586-022-02083-2. PMID 35902752. S2CID 251159714.
85. 1 2 Lau, Andy M.; Bordin, Nicola; Kandathil, Shaun M.; Sillitoe, Ian; Waman, Vaishali P.; Wells, Jude; Orengo, Christine A.; Jones, David T. (November 2024). "Exploring structural diversity across the protein universe with The Encyclopedia of Domains". Science. 386 (6721) eadq4946. Bibcode:2024Sci...386q4946L. doi:10.1126/science.adq4946. PMC 7618865. PMID 39480926.
86. ↑ Fleming, Jennifer; Magana, Paulyna; Nair, Sreenath; Tsenkov, Maxim; Bertoni, Damian; Pidruchna, Ivanna; Lima Afonso, Marcelo Querino; Midlik, Adam; Paramval, Urmila; Žídek, Augustin; Laydon, Agata; Kovalevskiy, Oleg; Pan, Joshua; Cheng, Jun; Avsec, Žiga; Bycroft, Clare; Wong, Lai Hong; Last, Meera; Mirdita, Milot; Steinegger, Martin; Kohli, Pushmeet; Váradi, Mihály; Velankar, Sameer (August 2025). "AlphaFold Protein Structure Database and 3D-Beacons: New Data and Capabilities". Journal of Molecular Biology. 437 (15) 168967. doi:10.1016/j.jmb.2025.168967. PMID 40133787.
87. ↑ Hekkelman, Maarten L.; de Vries, Ida; Joosten, Robbie P.; Perrakis, Anastassis (February 2023). "AlphaFill: enriching AlphaFold models with ligands and cofactors". Nature Methods. 20 (2): 205–213. Bibcode:2023NaMet..20..205H. doi:10.1038/s41592-022-01685-y. PMC 9911346. PMID 36424442.
88. 1 2 Rosignoli, Serena; Pacelli, Maddalena; Manganiello, Francesca; Paiardini, Alessandro (February 2025). "An outlook on structural biology after Alpha Fold: tools, limits and perspectives". FEBS Open Bio. 15 (2): 202–222. doi:10.1002/2211-5463.13902. PMC 11788754. PMID 39313455.
89. ↑ Špačková, Anna; Vávra, Ondřej; Raček, Tomáš; Bazgier, Václav; Sehnal, David; Damborský, Jiří; Svobodová, Radka; Bednář, David; Berka, Karel (5 January 2024). "ChannelsDB 2.0: a comprehensive database of protein tunnels and pores in AlphaFold era". Nucleic Acids Research. 52 (D1): D413–D418. doi:10.1093/nar/gkad1012. PMC 10767935. PMID 37956324.
90. ↑ Lang, Benjamin; Babu, M. Madan (2025). "AlphaSync is an enhanced AlphaFold structure database synchronized with UniProt". Nature Structural & Molecular Biology. 32 (12): 2628–2632. bioRxiv 10.1101/2025.03.12.642845. doi:10.1038/s41594-025-01719-x. PMID 41219581.
91. ↑ Schaeffer, RD; Zhang, J; Cong, Q; Grishin, NV (March 2026). "ECOD: Classification of domains in AFDB Swiss-Prot structure predictions". PLOS Computational Biology. 22 (3) e1013431. Bibcode:2026PLSCB..2213431S. doi:10.1371/journal.pcbi.1013431. PMC 13048469. PMID 41911251.
92. ↑ Sommer, Markus J; Cha, Sooyoung; Varabyou, Ales; Rincon, Natalia; Park, Sukhwan; Minkin, Ilia; Pertea, Mihaela; Steinegger, Martin; Salzberg, Steven L (15 December 2022). "Structure-guided isoform identification for the human transcriptome". eLife. 11 e82556. doi:10.7554/eLife.82556. PMC 9812405. PMID 36519529.
93. 1 2 "What use cases does AlphaFold not support?". AlphaFold Protein Structure Database. Archived from the original on 2022-07-29. Retrieved 2022-05-15.
94. ↑ AlphaFold heralds a data-driven revolution in biology and medicine Archived 2024-10-10 at the Wayback Machine, by Janet M. Thornton, Roman A. Laskowski & Neera Borkakoti, Nature Medicine, volume 12, pages 1666–1669, 12 October 2021
95. ↑ McBride, John M.; Polev, Konstantin; Abdirasulov, Amirbek; Reinharz, Vladimir; Grzybowski, Bartosz A.; Tlusty, Tsvi (2023-11-20). "AlphaFold2 Can Predict Single-Mutation Effects". Physical Review Letters. 131 (21) 218401. arXiv:2204.06860. Bibcode:2023PhRvL.131u8401M. doi:10.1103/PhysRevLett.131.218401. ISSN 0031-9007. PMID 38072605. Archived from the original on 2024-06-09. Retrieved 2023-11-26.
96. ↑ McBride, John M.; Tlusty, Tsvi (2024-08-26). "AI-Predicted Protein Deformation Encodes Energy Landscape Perturbation". Physical Review Letters. 133 (9) 098401. arXiv:2311.18222. Bibcode:2024PhRvL.133i8401M. doi:10.1103/PhysRevLett.133.098401. ISSN 0031-9007. PMID 39270162.
97. ↑ Abramson, Josh; Adler, Jonas; Dunger, Jack; Evans, Richard; Green, Tim; Pritzel, Alexander; Ronneberger, Olaf; Willmore, Lindsay; Ballard, Andrew J.; Bambrick, Joshua; Bodenstein, Sebastian W.; Evans, David A.; Hung, Chia-Chun; O'Neill, Michael; Reiman, David (June 2024). "Accurate structure prediction of biomolecular interactions with AlphaFold 3". Nature. 630 (8016): 493–500. Bibcode:2024Natur.630..493A. doi:10.1038/s41586-024-07487-w. ISSN 1476-4687. PMC 11168924. PMID 38718835.
98. ↑ Bagdonas, Haroldas; Fogarty, Carl A.; Fadda, Elisa; Agirre, Jon (2021-10-29). "The case for post-predictional modifications in the AlphaFold Protein Structure Database" (PDF). Nature Structural & Molecular Biology. 28 (11): 869–870. doi:10.1038/s41594-021-00680-9. ISSN 1545-9985. PMID 34716446. S2CID 240228913. Archived (PDF) from the original on 2024-01-13. Retrieved 2024-01-13.
99. ↑ An, Hyun Joo; Froehlich, John W; Lebrilla, Carlito B (2009-10-01). "Determination of glycosylation sites and site-specific heterogeneity in glycoproteins". Current Opinion in Chemical Biology. Analytical Techniques/Mechanisms. 13 (4): 421–426. doi:10.1016/j.cbpa.2009.07.022. ISSN 1367-5931. PMC 2749913. PMID 19700364.
100. ↑ Škrinjar, Peter; Eberhardt, Jérôme; Tauriello, Gerardo; Schwede, Torsten; Durairaj, Janani (2026). "Evaluating generalization in protein–ligand cofolding methods". Nature Structural & Molecular Biology. 33 (5): 782–794. bioRxiv 10.1101/2025.02.03.636309. doi:10.1038/s41594-026-01797-5. PMID 42103936.
101. ↑ Masters, Matthew R.; Mahmoud, Amr H.; Lill, Markus A. (2025-10-06). "Investigating whether deep learning models for co-folding learn the physics of protein-ligand interactions". Nature Communications. 16 (1): 8854. Bibcode:2025NatCo..16.8854M. doi:10.1038/s41467-025-63947-5. ISSN 2041-1723. PMC 12501370. PMID 41053181.
102. ↑ Dabrowski-Tumanski, Pawel; Stasiak, Andrzej (7 November 2023). "AlphaFold Blindness to Topological Barriers Affects Its Ability to Correctly Predict Proteins' Topology". Molecules. 28 (22): 7462. doi:10.3390/molecules28227462. PMC 10672856. PMID 38005184.
103. ↑ "DeepMind's latest AI breakthrough could turbocharge drug discovery". Fast Company. ISSN 1085-9241. Archived from the original on 2023-01-24. Retrieved 2023-01-24.
104. ↑ Aubel, Margaux; Eicholt, Lars; Bornberg-Bauer, Erich (2023-03-29). "Assessing structure and disorder prediction tools for de novo emerged proteins in the age of machine learning". F1000Research. 12: 347. doi:10.12688/f1000research.130443.1. PMC 10126731. PMID 37113259.
105. ↑ Michaud, Jennifer M.; Madani, Ali; Fraser, James S. (November 2022). "A language model beats alphafold2 on orphans". Nature Biotechnology. 40 (11): 1576–1577. doi:10.1038/s41587-022-01466-0. PMC 9669189. PMID 36192635.
106. ↑ Middendorf, Lasse; Eicholt, Lars A. (June 2024). "Random, de novo, and conserved proteins: How structure and disorder predictors perform differently". Proteins. 92 (6): 757–767. doi:10.1002/prot.26652. PMID 38226524.
107. ↑ Liu, Jing; Yuan, Rongqing; Shao, Wei; Wang, Jitong; Silman, Israel; Sussman, Joel L. (August 2023). "Do "Newly Born" orphan proteins resemble "Never Born" proteins? A study using three deep learning algorithms". Proteins. 91 (8): 1097–1115. doi:10.1002/prot.26496. PMID 37092778.
108. ↑ "AI Can Help Scientists Find a Covid-19 Vaccine". Wired. ISSN 1059-1028. Archived from the original on 2022-04-23. Retrieved 2020-12-01.
109. 1 2 "Computational predictions of protein structures associated with COVID-19". Deepmind. 4 August 2020. Archived from the original on 2022-03-25. Retrieved 2020-12-01.
110. ↑ "How DeepMind's new protein-folding A.I. is already helping to combat the coronavirus pandemic". Fortune. Archived from the original on 2020-11-30. Retrieved 2020-12-01.

Further reading

- Carlos Outeiral, CASP14: what Google DeepMind's AlphaFold 2 really achieved, and what it means for protein folding, biology and bioinformatics, Oxford Protein Informatics Group. (3 December)
- Mohammed AlQuraishi, AlphaFold2 @ CASP14: "It feels like one's child has left home." (blog), 8 December 2020
- Mohammed AlQuraishi, The AlphaFold2 Method Paper: A Fount of Good Ideas (blog), 25 July 2021

External links

- AlphaFold-3 web server
- AlphaFold v2.1 code and links to model on GitHub
- Open access to protein structure predictions for the human proteome and 20 other key organisms at European Bioinformatics Institute (AlphaFold Protein Structure Database)
- CASP 14 website
- AlphaFold: The making of a scientific breakthrough, DeepMind, via YouTube.
- ColabFold, version for homooligomeric prediction and complexes

+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| - v                                                                                                                                                     |
| - t                                                                                                                                                     |
| - e                                                                                                                                                     |
|                                                                                                                                                         |
| Google AI                                                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+
| - Google                                                                                                                                                |
| - Google Brain                                                                                                                                          |
| - Google DeepMind                                                                                                                                       |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| Computer                            | +-----------------------------------+---------------------------------------------------------------------------+ |
| programs                            | | AlphaGo                           | +-----------------------------------+-----------------------------------+ | |
|                                     | |                                   | | Versions                          | - AlphaGo (2015)                  | | |
|                                     | |                                   | |                                   | - Master (2016)                   | | |
|                                     | |                                   | |                                   | - AlphaGo Zero (2017)             | | |
|                                     | |                                   | |                                   | - AlphaZero (2017)                | | |
|                                     | |                                   | |                                   | - MuZero (2019)                   | | |
|                                     | |                                   | +-----------------------------------+-----------------------------------+ | |
|                                     | |                                   | | Competitions                      | - Fan Hui (2015)                  | | |
|                                     | |                                   | |                                   | - Lee Sedol (2016)                | | |
|                                     | |                                   | |                                   | - Ke Jie (2017)                   | | |
|                                     | |                                   | +-----------------------------------+-----------------------------------+ | |
|                                     | |                                   | | In popular culture                | - AlphaGo (2017)                  | | |
|                                     | |                                   | +-----------------------------------+-----------------------------------+ | |
|                                     | +-----------------------------------+---------------------------------------------------------------------------+ |
|                                     | | Other                             | - AlphaFold (2018)                                                        | |
|                                     | |                                   | - AlphaStar (2019)                                                        | |
|                                     | |                                   | - AlphaTensor (2022)                                                      | |
|                                     | |                                   | - AlphaDev (2023)                                                         | |
|                                     | |                                   | - AlphaGeometry (2024)                                                    | |
|                                     | |                                   | - AlphaGenome (2025)                                                      | |
|                                     | +-----------------------------------+---------------------------------------------------------------------------+ |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| Machine                             | +-----------------------------------+---------------------------------------+                                     |
| learning                            | | Neural networks                   | - Inception (2014)                    |                                     |
|                                     | |                                   | - WaveNet (2016)                      |                                     |
|                                     | |                                   | - MobileNet (2017)                    |                                     |
|                                     | |                                   | - Transformer (2017)                  |                                     |
|                                     | |                                   | - EfficientNet (2019)                 |                                     |
|                                     | |                                   | - Gato (2022)                         |                                     |
|                                     | +-----------------------------------+---------------------------------------+                                     |
|                                     | | Other                             | - Quantum Artificial Intelligence Lab |                                     |
|                                     | |                                   | - TensorFlow                          |                                     |
|                                     | |                                   | - Tensor Processing Unit              |                                     |
|                                     | +-----------------------------------+---------------------------------------+                                     |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| Generative                          | +-----------------------------------+-----------------------------------+                                         |
| AI                                  | | Chatbots                          | - Assistant (2016)                |                                         |
|                                     | |                                   | - Sparrow (2022)                  |                                         |
|                                     | |                                   | - Gemini (2023)                   |                                         |
|                                     | |                                   | - Nano Banana (2025)              |                                         |
|                                     | +-----------------------------------+-----------------------------------+                                         |
|                                     | | Models                            | - BERT (2018)                     |                                         |
|                                     | |                                   | - XLNet (2019)                    |                                         |
|                                     | |                                   | - T5 (2019)                       |                                         |
|                                     | |                                   | - LaMDA (2021)                    |                                         |
|                                     | |                                   | - Chinchilla (2022)               |                                         |
|                                     | |                                   | - PaLM (2022)                     |                                         |
|                                     | |                                   | - Imagen (2023)                   |                                         |
|                                     | |                                   | - Gemini (2023)                   |                                         |
|                                     | |                                   | - VideoPoet (2024)                |                                         |
|                                     | |                                   | - Gemma (2024)                    |                                         |
|                                     | |                                   | - Genie (2024)                    |                                         |
|                                     | |                                   | - Veo (2024)                      |                                         |
|                                     | +-----------------------------------+-----------------------------------+                                         |
|                                     | | Other                             | - DreamBooth (2022)               |                                         |
|                                     | |                                   | - NotebookLM (2023)               |                                         |
|                                     | |                                   | - Vids (2024)                     |                                         |
|                                     | |                                   | - Gemini Robotics (2025)          |                                         |
|                                     | |                                   | - Antigravity (2025)              |                                         |
|                                     | +-----------------------------------+-----------------------------------+                                         |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| See also                            | - "Attention Is All You Need"                                                                                     |
|                                     | - Future of Go Summit                                                                                             |
|                                     | - Generative pre-trained transformer                                                                              |
|                                     | - Google Labs                                                                                                     |
|                                     | - Google Workspace                                                                                                |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| - [] Category                                                                                                                                           |
| - [] Commons                                                                                                                                            |
+---------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------+---------------------------------------------------------------------------+
| - v                                                                                                             |
| - t                                                                                                             |
| - e                                                                                                             |
|                                                                                                                 |
| Artificial intelligence (AI)                                                                                    |
+-----------------------------------------------------------------------------------------------------------------+
| - History                                                                                                       |
|   - timeline                                                                                                    |
| - Glossary                                                                                                      |
| - Companies                                                                                                     |
| - Projects                                                                                                      |
| - List of open-source AI software                                                                               |
+-------------------------------------+---------------------------------------------------------------------------+
| Concepts                            | - Automated reasoning                                                     |
|                                     | - Automated planning                                                      |
|                                     | - Constraint satisfaction                                                 |
|                                     | - Knowledge representation                                                |
|                                     | - Parameter                                                               |
|                                     |   - Hyperparameter                                                        |
|                                     | - Loss functions                                                          |
|                                     | - Regression                                                              |
|                                     |   - Bias–variance tradeoff                                                |
|                                     |   - Double descent                                                        |
|                                     |   - Overfitting                                                           |
|                                     | - Clustering                                                              |
|                                     | - Gradient descent                                                        |
|                                     |   - SGD                                                                   |
|                                     |   - Quasi-Newton method                                                   |
|                                     |   - Conjugate gradient method                                             |
|                                     | - Backpropagation                                                         |
|                                     | - Attention                                                               |
|                                     | - Convolution                                                             |
|                                     | - Normalization                                                           |
|                                     |   - Batchnorm                                                             |
|                                     | - Activation                                                              |
|                                     |   - Softmax                                                               |
|                                     |   - Sigmoid                                                               |
|                                     |   - Rectifier                                                             |
|                                     | - Gating                                                                  |
|                                     | - Weight initialization                                                   |
|                                     | - Regularization                                                          |
|                                     | - Datasets                                                                |
|                                     |   - Augmentation                                                          |
|                                     | - Prompt engineering                                                      |
|                                     | - Reinforcement learning                                                  |
|                                     |   - Q-learning                                                            |
|                                     |   - SARSA                                                                 |
|                                     |   - Imitation                                                             |
|                                     |   - Policy gradient                                                       |
|                                     | - Diffusion                                                               |
|                                     | - Latent diffusion model                                                  |
|                                     | - Autoregression                                                          |
|                                     | - Adversary                                                               |
|                                     | - RAG                                                                     |
|                                     | - Uncanny valley                                                          |
|                                     | - LLM post-training                                                       |
|                                     | - RLHF                                                                    |
|                                     | - Self-supervised learning                                                |
|                                     | - Reflection                                                              |
|                                     | - Recursive self-improvement                                              |
|                                     | - Hallucination                                                           |
|                                     | - Word embedding                                                          |
|                                     | - Vibe coding                                                             |
|                                     | - Symbolic AI                                                             |
|                                     | - Neuro-symbolic AI                                                       |
+-------------------------------------+---------------------------------------------------------------------------+
| Applications                        | - Automated theorem proving                                               |
|                                     | - General game playing                                                    |
|                                     | - Machine learning                                                        |
|                                     |   - In-context learning                                                   |
|                                     | - Artificial neural network                                               |
|                                     |   - Deep learning                                                         |
|                                     | - Language model                                                          |
|                                     |   - Large                                                                 |
|                                     |   - NMT                                                                   |
|                                     |   - Reasoning                                                             |
|                                     | - Model Context Protocol                                                  |
|                                     | - Intelligent agent                                                       |
|                                     |   - AI agent                                                              |
|                                     | - Artificial human companion                                              |
|                                     | - Humanity's Last Exam                                                    |
|                                     | - Lethal autonomous weapons (LAWs)                                        |
|                                     | - Generative AI                                                           |
|                                     | - Weak AI                                                                 |
|                                     | - Hypothetical                                                            |
|                                     |   - Artificial general intelligence (AGI)                                 |
|                                     |   - Artificial superintelligence (ASI)                                    |
|                                     | - Agent2Agent protocol                                                    |
|                                     | - Physical AI                                                             |
+-------------------------------------+---------------------------------------------------------------------------+
| Implementations                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Audio–visual                      | - AlexNet                         | |
|                                     | |                                   | - WaveNet                         | |
|                                     | |                                   | - Human image synthesis           | |
|                                     | |                                   | - HWR                             | |
|                                     | |                                   | - OCR                             | |
|                                     | |                                   | - Computer vision                 | |
|                                     | |                                   | - Speech synthesis                | |
|                                     | |                                   |   - 15.ai                         | |
|                                     | |                                   |   - ElevenLabs                    | |
|                                     | |                                   | - Speech recognition              | |
|                                     | |                                   |   - Whisper                       | |
|                                     | |                                   | - Facial recognition              | |
|                                     | |                                   | - AlphaFold                       | |
|                                     | |                                   | - Text-to-image models            | |
|                                     | |                                   |   - Aurora                        | |
|                                     | |                                   |   - DALL-E                        | |
|                                     | |                                   |   - Firefly                       | |
|                                     | |                                   |   - Flux                          | |
|                                     | |                                   |   - GPT Image                     | |
|                                     | |                                   |   - Ideogram                      | |
|                                     | |                                   |   - Imagen                        | |
|                                     | |                                   |   - Midjourney                    | |
|                                     | |                                   |   - Recraft                       | |
|                                     | |                                   |   - Stable Diffusion              | |
|                                     | |                                   | - Text-to-video models            | |
|                                     | |                                   |   - Dream Machine                 | |
|                                     | |                                   |   - Runway Gen                    | |
|                                     | |                                   |   - Hailuo AI                     | |
|                                     | |                                   |   - Kling                         | |
|                                     | |                                   |   - Sora                          | |
|                                     | |                                   |   - Seedance                      | |
|                                     | |                                   |   - Veo                           | |
|                                     | |                                   | - Music generation                | |
|                                     | |                                   |   - Riffusion                     | |
|                                     | |                                   |   - Suno                          | |
|                                     | |                                   |   - Udio                          | |
|                                     | |                                   | - World models                    | |
|                                     | |                                   |   - Genie                         | |
|                                     | |                                   |   - Oasis                         | |
|                                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Text                              | - List of large language models   | |
|                                     | |                                   | - Project Debater                 | |
|                                     | |                                   | - IBM Watson                      | |
|                                     | |                                   |   - IBM Watsonx                   | |
|                                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Decisional                        | - AlphaGo                         | |
|                                     | |                                   | - AlphaZero                       | |
|                                     | |                                   | - OpenAI Five                     | |
|                                     | |                                   | - Self-driving car                | |
|                                     | |                                   | - MuZero                          | |
|                                     | |                                   | - Action selection                | |
|                                     | |                                   |   - AutoGPT                       | |
|                                     | |                                   | - Robot control                   | |
|                                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Reasoning systems                 | - Deductive classifiers           | |
|                                     | |                                   | - Expert systems                  | |
|                                     | |                                   | - Inference engines               | |
|                                     | |                                   | - Knowledge-based systems         | |
|                                     | |                                   | - Logic programs                  | |
|                                     | |                                   | - Procedural reasoning systems    | |
|                                     | |                                   | - Semantic reasoners              | |
|                                     | |                                   | - Rule-based systems              | |
|                                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Cognitive architectures           | - ACT-R                           | |
|                                     | |                                   | - Soar                            | |
|                                     | |                                   | - CLARION                         | |
|                                     | |                                   | - LIDA                            | |
|                                     | |                                   | - OpenCog                         | |
|                                     | +-----------------------------------+-----------------------------------+ |
|                                     | | Knowledge bases                   | - ConceptNet                      | |
|                                     | |                                   | - Wikidata                        | |
|                                     | |                                   | - DBpedia                         | |
|                                     | |                                   | - YAGO                            | |
|                                     | +-----------------------------------+-----------------------------------+ |
+-------------------------------------+---------------------------------------------------------------------------+
| People                              | - Alan Turing                                                             |
|                                     | - Warren Sturgis McCulloch                                                |
|                                     | - Walter Pitts                                                            |
|                                     | - John von Neumann                                                        |
|                                     | - Christopher D. Manning                                                  |
|                                     | - Claude Shannon                                                          |
|                                     | - Shun'ichi Amari                                                         |
|                                     | - Kunihiko Fukushima                                                      |
|                                     | - Takeo Kanade                                                            |
|                                     | - Marvin Minsky                                                           |
|                                     | - John McCarthy                                                           |
|                                     | - Nathaniel Rochester                                                     |
|                                     | - Allen Newell                                                            |
|                                     | - Cliff Shaw                                                              |
|                                     | - Herbert A. Simon                                                        |
|                                     | - Oliver Selfridge                                                        |
|                                     | - Frank Rosenblatt                                                        |
|                                     | - Bernard Widrow                                                          |
|                                     | - Joseph Weizenbaum                                                       |
|                                     | - Seymour Papert                                                          |
|                                     | - Seppo Linnainmaa                                                        |
|                                     | - Paul Werbos                                                             |
|                                     | - Geoffrey Hinton                                                         |
|                                     | - John Hopfield                                                           |
|                                     | - Jürgen Schmidhuber                                                      |
|                                     | - Yann LeCun                                                              |
|                                     | - Yoshua Bengio                                                           |
|                                     | - Lotfi A. Zadeh                                                          |
|                                     | - Stephen Grossberg                                                       |
|                                     | - Alex Graves                                                             |
|                                     | - James Goodnight                                                         |
|                                     | - Andrew Ng                                                               |
|                                     | - Fei-Fei Li                                                              |
|                                     | - Alex Krizhevsky                                                         |
|                                     | - Ilya Sutskever                                                          |
|                                     | - Oriol Vinyals                                                           |
|                                     | - Quoc V. Le                                                              |
|                                     | - Ian Goodfellow                                                          |
|                                     | - Demis Hassabis                                                          |
|                                     | - David Silver                                                            |
|                                     | - Andrej Karpathy                                                         |
|                                     | - Ashish Vaswani                                                          |
|                                     | - Noam Shazeer                                                            |
|                                     | - Aidan Gomez                                                             |
|                                     | - John Schulman                                                           |
|                                     | - Mustafa Suleyman                                                        |
|                                     | - Jan Leike                                                               |
|                                     | - Daniel Kokotajlo                                                        |
|                                     | - François Chollet                                                        |
+-------------------------------------+---------------------------------------------------------------------------+
| Neural network architectures        | - Neural Turing machine                                                   |
|                                     | - Differentiable neural computer                                          |
|                                     | - Transformer                                                             |
|                                     |   - Vision transformer (ViT)                                              |
|                                     | - Recurrent neural network (RNN)                                          |
|                                     | - Long short-term memory (LSTM)                                           |
|                                     | - Gated recurrent unit (GRU)                                              |
|                                     | - Echo state network                                                      |
|                                     | - Multilayer perceptron (MLP)                                             |
|                                     | - Convolutional neural network (CNN)                                      |
|                                     | - Residual neural network (RNN)                                           |
|                                     | - Highway network                                                         |
|                                     | - Mamba                                                                   |
|                                     | - Autoencoder                                                             |
|                                     | - Variational autoencoder (VAE)                                           |
|                                     | - Generative adversarial network (GAN)                                    |
|                                     | - Graph neural network (GNN)                                              |
+-------------------------------------+---------------------------------------------------------------------------+
| Political                           | - AI Cold War                                                             |
|                                     | - AI in government                                                        |
|                                     | - AI safety (Alignment)                                                   |
|                                     | - AI takeover                                                             |
|                                     | - Elections                                                               |
|                                     | - Ethics of AI                                                            |
|                                     | - EU AI Act                                                               |
|                                     | - Nationalism                                                             |
|                                     | - Precautionary principle                                                 |
|                                     | - Regulation of AI                                                        |
|                                     |   - US                                                                    |
|                                     | - Virtual politician                                                      |
|                                     | - Propaganda                                                              |
+-------------------------------------+---------------------------------------------------------------------------+
| Social and economic                 | - AI boom                                                                 |
|                                     | - AI bubble                                                               |
|                                     | - AI data center                                                          |
|                                     | - AI effect                                                               |
|                                     | - AI infrastructure                                                       |
|                                     | - AI literacy                                                             |
|                                     | - AI slop                                                                 |
|                                     | - AI winter                                                               |
|                                     | - Anthropomorphism                                                        |
|                                     | - Arms race                                                               |
|                                     | - Competition                                                             |
|                                     | - Environmental impact                                                    |
|                                     | - Explainable AI                                                          |
|                                     | - Generative engine optimization                                          |
|                                     | - In architecture                                                         |
|                                     | - In education                                                            |
|                                     | - In fiction                                                              |
|                                     | - In healthcare                                                           |
|                                     |   - Chatbot psychosis                                                     |
|                                     | - In marketing                                                            |
|                                     | - In video games                                                          |
|                                     | - In visual art                                                           |
|                                     | - Military applications                                                   |
|                                     |   - AI warfare                                                            |
|                                     | - Workplace impact                                                        |
+-------------------------------------+---------------------------------------------------------------------------+
| - [] Category                                                                                                   |
+-----------------------------------------------------------------------------------------------------------------+
