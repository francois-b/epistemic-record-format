While Deep Blue, with its capability of evaluating 200 million positions per second,^([46]) was the first computer to face a world chess champion in a formal match,^([4]) it was a then-state-of-the-art expert system, relying upon rules and variables defined and fine-tuned by chess masters and computer scientists. In contrast, current chess engines such as Leela Chess Zero typically use reinforcement machine learning systems that train a neural network to play, developing its own internal logic rather than relying upon rules defined by human experts.^([40])

In a November 2006 match between Deep Fritz and world chess champion Vladimir Kramnik, the program ran on a computer system containing a dual-core Intel Xeon 5160 CPU, capable of evaluating only 8 million positions per second, but searching to an average depth of 17 to 18 plies (half-moves) in the middlegame thanks to heuristics; it won 4–2.^([47][48])

Design

[]

Software

Deep Blue ran under the AIX operating system, and its chess playing program was written in C. Its evaluation function was initially written in a generalized form, with many to-be-determined parameters (e.g., how important is a safe king position compared to a space advantage in the center, etc.). Values for these parameters were determined by analyzing thousands of master games. The evaluation function was then split into 8,000 parts, many of them designed for special positions. The opening book encapsulated more than 4,000 positions and 700,000 grandmaster games, while the endgame database contained many six-piece endgames and all five and fewer piece endgames. An additional database named the "extended book" summarizes entire games played by Grandmasters. The system combines its searching ability of 200 million chess positions per second with summary information in the extended book to select opening moves.^([49])

Before the second match, the program's rules were fine-tuned by grandmaster Joel Benjamin. The opening library was provided by grandmasters Miguel Illescas, John Fedorowicz, and Nick de Firmian.^([50]) When Kasparov requested that he be allowed to study other games that Deep Blue had played so as to better understand his opponent, IBM refused, leading Kasparov to study many popular PC chess games to familiarize himself with computer gameplay.^([51])

Hardware

Deep Blue used custom VLSI chips to parallelize the alpha–beta search algorithm,^([52]) an example of symbolic AI.^([53]) The system derived its playing strength mainly from computing power. It was an IBM RS/6000 SP, a supercomputer with a massively parallel architecture based on 30 PowerPC 604e processors and 480 custom 600 nm CMOS VLSI "chess chips" designed to execute the chess-playing expert system, as well as FPGAs intended to allow patching of the VLSIs (which ultimately went unused) all housed in two cabinets. The chess chip has four parts: the move generator, the smart-move stack, the evaluation function, and the search control. The move generator is an 8×8 combinational logic circuit, a chess board in miniature.^([54][55][56][57])

In 1997, Deep Blue was upgraded again to become the 259th most powerful supercomputer according to the TOP500 list, achieving 11.38 GFLOPS on the parallel high performance LINPACK benchmark. Deeper Blue was capable of evaluating 200 million positions per second, twice as many as the 1996 version.^([58])

See also
