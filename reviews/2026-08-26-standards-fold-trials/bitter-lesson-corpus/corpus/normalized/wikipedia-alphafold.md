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
