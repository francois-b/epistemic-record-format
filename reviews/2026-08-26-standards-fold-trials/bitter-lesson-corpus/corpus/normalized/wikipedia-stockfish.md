The Stockfish engine was developed by Tord Romstad, Marco Costalba, and Joona Kiiski, and was derived from Glaurung, an open-source engine by Tord Romstad released in 2004. It is now being developed and maintained by the Stockfish community.^([7])

Stockfish historically used only a classical hand-crafted function to evaluate board positions, but with the introduction of the efficiently updatable neural network (NNUE) in August 2020, Stockfish 12 adopted a hybrid evaluation system that primarily used the neural network and occasionally relied on the hand-crafted evaluation.^([8][9][10]) In July 2023, Stockfish removed the hand-crafted evaluation and transitioned to a fully neural-network-based approach.^([11][12])

Features

Stockfish uses a tree-search algorithm based on alpha–beta search with several hand-designed heuristics. Stockfish represents positions using bitboards.^([13])
