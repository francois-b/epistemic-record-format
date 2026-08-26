It’s certainly true that Deep Blue used massive search – at its peak, Deep Blue was evaluating roughly 200 million positions per second, using special custom-built chess chips(!) But Deep Blue also built in a great deal of expert domain knowledge. There’s a lovely overview paper describing how Deep Blue worked, written by three of the team behind it (Murray Campbell, A. Joseph Hoane Jr., and Feng-hsiung Hsu). Here’s just one of many examples of crucial expert knowledge used by Deep Blue:

  There is an additional factor to consider for rooks on files. Under some circumstances, pawns can be semi-transparent to rooks. For example, if a pawn is “levering”, it is considered semi-transparent to rooks. For this purpose, levering is defined to be having the possibility of capturing an enemy pawn. Under such circumstances, rooks get about half the value of the unblocked file. This feature was of critical importance in Game 2 of the 1997 match between Garry Kasparov and Deep Blue.

This is part of a much longer description of how Deep Blue evaluates the worth of a rook on a particular file – it involves many ideas, from relatively elementary knowledge (more central files are better), through to more complex chess ideas about king safety, different kinds of traps, and preferred pawn structures.

These ideas are, in turn, just a small fraction of the ideas which go into the roughly 8,000 features which Deep Blue used to evaluate board positions. Many of those features, like that of rooks on a file with a levering pawn, were based on deep domain knowledge of chess. Indeed, many were based on expert analysis of games lost by Deep Blue’s predecessor systems (an earlier version of Deep Blue, Deep Thought, and ChipTest).

Sutton is correct that Deep Blue was a triumph of “massive, deep search”. But it was also a triumph of expert knowledge of chess. It seems to me an example of a hybrid approach: deep domain knowledge and massive search leveraging computational power.

Jump forward more than two decades, and you have DeepMind’s AlphaZero and MuZero systems. AlphaZero taught itself to play chess (and Go and Shogi) using self-play; on top of those games, MuZero added as well 57 Atari video games. Neither system had hand-engineered features – they started solely with the rules of the various games. And they quickly learned to play many of the games (all?) better than any human being.

This supports Sutton’s contention that:

  The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin.

The trouble with the contention is that “ultimately” isn’t a very informative stance. Does it mean in 5 years? In 20 years? In 100 years? It offers no guidance. In the meantime, even if Sutton’s contention is correct it doesn’t tell us whether the best approach over the next 5-10 years is based on domain knowledge, leveraging computation, or a hybrid approach.

My guess, unbacked by any actual evidence: if you tried AlphaZero or MuZero’s approach in 1997, the system would have been trounced by Deep Blue. At the time, a hybrid system was the way to go.

Many other examples illustrate this:

- The best neural networks for image recognition typically leverage quite a number of image-specific ideas. For a long time they used ideas about symmetry and pooling, inspired (it is often said) by results in neuroscience about the structure of mammalian visual cortices. I haven’t been following recent work on image recognition, but my understanding is that modern approaches use somewhat different ideas, but nonetheless still use specialized architectures employing image-specific ideas. People occasionally try using much more generic approaches – here’s one I like, using multi-layer perceptrons to attack MNIST. But while such papers are fun and stimulating, they also seem like stunts, and certainly aren’t state-of-the-art.

- On Twitter, the high-energy physicist Kyle Cranmer, who has used machine learning extensively in science, points out:

  We have a few examples of problems (Eg lattice field theory) that are ~hopeless with traditional deep learning, but work when you bake in / enforce symmetries. It seems to take much (exponentially?) more data and compute to learn without that inductive bias.

This is followed up by DeepMind’s Danilo Rezende:

  Agree! The rapid progress of ML applied to LQCD [lattice quantum chromodynamics], mol. dyn., protein folding and computer graphics is the result of the combining domain knowledge (e.g. symmetries) with ML The “bitter lesson” applies more to domains where domain knowledge is weak or hard to express mathematically.

If you take Sutton’s point of view seriously, the response might seem to be: well, maybe in the short run hybrid approaches will often win, but over the long run the less opinionated and more general computationally intensive systems will win. That is, Deep Blue-like hybrid systems will ultimately be displaced by more purely compute-oriented approaches like AlphaZero.
