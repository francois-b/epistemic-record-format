Chess-playing computer made by IBM

+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| []                                                                                                                                                          |
|                                                                                                                                                             |
| A computer similar to Deep Blue at the Computer History Museum                                                                                              |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Active                              | 1995 (prototype)                                                                                                      |
|                                     | 1996 (release)                                                                                                        |
|                                     | 1997 (upgrade)                                                                                                        |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Architecture                        | - 1995: IBM RS/6000 with 14 custom VLSI first-generation "chess chips"^([1])                                          |
|                                     | - 1996: IBM RS/6000 SP with 30 PowerPC 604 "High 1" 120 MHz CPUs and 480 custom VLSI second-generation "chess chips"  |
|                                     | - 1997: IBM RS/6000 SP with 30 PowerPC 604e "High 2" 200 MHz CPUs and 480 custom VLSI second-generation "chess chips" |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Operating system                    | IBM AIX                                                                                                               |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Space                               | 2 cabinets                                                                                                            |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Speed                               | 11.38 GFLOPS (1997)                                                                                                   |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Purpose                             | playing chess                                                                                                         |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+
| Website                             | ibm.com at the Wayback Machine (archived 2002-08-06)                                                                  |
+-------------------------------------+-----------------------------------------------------------------------------------------------------------------------+

: Deep Blue {#mwDA .infobox about="#mwt6"}

+-----------------------------------------------------------------------+
| This article is part of the series on                                 |
+-----------------------------------------------------------------------+
| Chess programming                                                     |
+-----------------------------------------------------------------------+
| []                                                                    |
+-----------------------------------------------------------------------+
| Board representations                                                 |
|                                                                       |
| - 0x88                                                                |
| - Bitboards                                                           |
+-----------------------------------------------------------------------+
| Evaluation functions                                                  |
|                                                                       |
| - Artificial neural networks                                          |
| - Efficiently updatable neural networks                               |
| - Piece-square tables                                                 |
| - Handcrafted evaluation functions                                    |
| - Deep neural networks                                                |
| - Transformers                                                        |
| - Convolutional neural networks                                       |
| - Residual neural networks                                            |
| - Attention                                                           |
+-----------------------------------------------------------------------+
| Tuning and training algorithms                                        |
|                                                                       |
| - Reinforcement learning                                              |
| - Supervised learning                                                 |
| - Unsupervised learning                                               |
| - Gradient descent                                                    |
| - Stochastic gradient descent                                         |
| - Local search (Texel tuning)                                         |
+-----------------------------------------------------------------------+
| Graph and tree search algorithms                                      |
|                                                                       |
| - Minimax                                                             |
| - Alpha-beta pruning                                                  |
| - Principal variation search                                          |
| - Quiescence search                                                   |
| - Monte Carlo tree search                                             |
+-----------------------------------------------------------------------+
| Chess computers                                                       |
|                                                                       |
| - Belle                                                               |
| - ChessMachine                                                        |
| - ChipTest                                                            |
| - Deep Blue                                                           |
| - Deep Thought                                                        |
| - HiTech                                                              |
| - Hydra                                                               |
| - Mephisto                                                            |
| - Saitek                                                              |
+-----------------------------------------------------------------------+
| Chess engines                                                         |
|                                                                       |
| - AlphaZero                                                           |
| - Chess Tiger                                                         |
| - Crafty                                                              |
| - Cray Blitz                                                          |
| - CuckooChess                                                         |
| - Deep Fritz                                                          |
| - Dragon by Komodo Chess                                              |
| - Fairy-Max                                                           |
| - Fritz                                                               |
| - Fruit                                                               |
| - GNU Chess                                                           |
| - HIARCS                                                              |
| - Houdini                                                             |
| - Ikarus                                                              |
| - Junior                                                              |
| - KnightCap                                                           |
| - Komodo                                                              |
| - Leela Chess Zero                                                    |
| - MChess Pro                                                          |
| - Mittens                                                             |
| - MuZero                                                              |
| - Naum                                                                |
| - REBEL                                                               |
| - Rybka                                                               |
| - Shredder                                                            |
| - Sjeng                                                               |
| - SmarThink                                                           |
| - Stockfish                                                           |
| - Torch                                                               |
| - Turochamp                                                           |
| - Zappa                                                               |
+-----------------------------------------------------------------------+
| - v                                                                   |
| - t                                                                   |
| - e                                                                   |
+-----------------------------------------------------------------------+

Deep Blue was^([a]) a customized IBM RS/6000 SP supercomputer for chess-playing designed by computer scientist Feng-hsiung Hsu.^([2]) It was the first computer to win a game, and the first to win a match, against a reigning world champion under regular time controls. Development began in 1985 at Carnegie Mellon University under the name ChipTest. It then moved to IBM, where it was first renamed Deep Thought, then again in 1989 to Deep Blue. In 1996, it was used to compete against world champion Garry Kasparov in a six-game match, where it won one, drew two, and lost three games. In 1997, it underwent an upgrade, and in a six-game rematch it defeated Kasparov by winning two games and drawing three. Deep Blue's victory is considered a milestone in the history of artificial intelligence and has been the subject of several books and films.

History

While a doctoral student at Carnegie Mellon University, Feng-hsiung Hsu began development of a chess-playing supercomputer under the name ChipTest. The machine won the North American Computer Chess Championship in 1987 and Hsu and his team followed up with a successor, Deep Thought, in 1988.^([3][4]) After receiving his doctorate in 1989, Hsu and Murray Campbell joined IBM Research to continue their project to build a machine that could defeat a world chess champion.^([5]) Their colleague Thomas Anantharaman briefly joined them at IBM before leaving for the finance industry and being replaced by programmer Arthur Joseph Hoane.^([6][7]) Jerry Brody, a long-time employee of IBM Research, subsequently joined the team in 1990.^([8])

After Deep Thought's two-game 1989 loss to Kasparov, IBM held a contest to rename the chess machine: the winning name was "Deep Blue", submitted by Peter Fitzhugh Brown,^([9]) which was a play on IBM's nickname, "Big Blue".^([b]) After a scaled-down version of Deep Blue played Grandmaster Joel Benjamin,^([11]) Hsu and Campbell decided that Benjamin was the expert they were looking for to help develop Deep Blue's opening book, so they hired him to assist with the preparations for Deep Blue's matches against Garry Kasparov.^([12]) In 1995, a Deep Blue prototype played in the eighth World Computer Chess Championship, playing Wchess to a draw before ultimately losing to Fritz in round five, despite playing as White.^([13])

Today, one of the two racks that made up Deep Blue is held by the National Museum of American History, having previously been displayed in an exhibit about the Information Age,^([14]) while the other rack was acquired by the Computer History Museum in 1997, and is displayed in the Revolution exhibit's "Artificial Intelligence and Robotics" gallery.^([15]) Several books were written about Deep Blue, among them Behind Deep Blue: Building the Computer that Defeated the World Chess Champion by Deep Blue developer Feng-hsiung Hsu.^([16])

Deep Blue versus Kasparov

Main article: Deep Blue versus Garry Kasparov

[]

Subsequent to its predecessor Deep Thought's 1989 loss to Garry Kasparov, Deep Blue played Kasparov twice more. In the first game of the first match, which took place from 10 to 17 February 1996, Deep Blue became the first machine to win a chess game against a reigning world champion under regular time controls. However, Kasparov won three and drew two of the following five games, beating Deep Blue by 4–2 at the close of the match.^([17][18])

Deep Blue's hardware was subsequently upgraded,^([4][19][c]) doubling its speed before it faced Kasparov again in May 1997, when it won the six-game rematch 3½–2½. Deep Blue won the deciding game after Kasparov failed to secure his position in the opening, thereby becoming the first computer system to defeat a reigning world champion in a match under standard chess tournament time controls.^([21][22]) The version of Deep Blue that defeated Kasparov in 1997 typically searched to a depth of six to eight moves, and twenty or more moves in some situations.^([23]) David Levy and Monty Newborn estimate that each additional ply (half-move) of forward insight increases the playing strength between 50 and 70 Elo points.^([24])

In the 44th move of the first game of their second match, unknown to Kasparov, a bug in Deep Blue's code led it to enter an unintentional loop, which it exited by taking a randomly selected valid move.^([25]) Kasparov did not take this possibility into account, and misattributed the seemingly pointless move to "superior intelligence".^([22]) Subsequently, Kasparov experienced a decline in performance in the following game,^([25]) though he denies this was due to anxiety in the wake of Deep Blue's inscrutable move.^([26])

After his loss, Kasparov said that he sometimes saw unusual creativity in the machine's moves, suggesting that during the second game, human chess players had intervened on behalf of the machine. IBM denied this, saying the only human intervention occurred between games.^([27][28]) Kasparov demanded a rematch, but IBM had dismantled Deep Blue after its victory and refused the rematch.^([29]) The rules allowed the developers to modify the program between games, an opportunity they said they used to shore up weaknesses in the computer's play that were revealed during the course of the match. Kasparov requested printouts of the machine's log files, but IBM refused, although the company later published the logs on the Internet.^([30])

The 1997 tournament awarded a $700,000 first prize to the Deep Blue team and a $400,000 second prize to Kasparov. Carnegie Mellon University awarded an additional $100,000 to the Deep Blue team, a prize created by computer science professor Edward Fredkin in 1980 for the first computer program to beat a reigning world chess champion.^([31])

Aftermath

Chess

Kasparov initially called Deep Blue an "alien opponent", but later belittled it, stating that it was "as intelligent as your alarm clock".^([32]) According to Martin Amis, two grandmasters who played Deep Blue agreed that it was "like a wall coming at you".^([33][34]) Hsu had the rights to use the Deep Blue design independently of IBM, but also independently declined Kasparov's rematch offer.^([35]) In 2003, the documentary film Game Over: Kasparov and the Machine investigated Kasparov's claims that IBM had cheated. In the film, some interviewees describe IBM's investment in Deep Blue as an effort to boost its stock value.^([36])

Other games

Following Deep Blue's victory, AI specialist Omar Syed designed a new game, Arimaa, which was intended to be very simple for humans but very difficult for computers to master;^([37][38]) however, in 2015, computers proved capable of defeating strong Arimaa players.^([39]) Since Deep Blue's victory, computer scientists have developed software for other complex board games with competitive communities. The AlphaGo series (AlphaGo, AlphaGo Zero, AlphaZero) defeated top Go players in 2016–2017.^([40][41])

Computer science

Computer scientists such as Deep Blue developer Campbell believed that playing chess was a good measurement for the effectiveness of artificial intelligence, and by beating a world champion chess player, IBM showed that they had made significant progress.^([4]) Throughout the history of AI, game-playing had been used to demonstrate the capability of artificial intelligence programs^([42][43]) and to discuss their limits.^([44]) Some questioned the usefulness of game playing to other applications.^([45])

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

- [icon]Chess portal

- Anti-computer tactics, which exploit the repetitive habits of computers
- IBM Watson, which could adeptly answer questions in human language
- Mechanical Turk, an 18th- and 19th-century hoax purported to be a chess-playing machine
- X3D Fritz, which also tied Kasparov
- Rematch, a 2024 TV miniseries about the 1997 match

References

Notes

1.  ↑ Parts of the computer were split up to museums
2.  ↑ IBM renamed "Deep Thought" because the name resembled the title of the hit pornographic film Deep Throat.^([10])
3.  ↑ Unofficially nicknamed "Deeper Blue".^([20])

Citations

1.  ↑ "Deep Thought (Chess)". ICGA Tournaments. Archived from the original on 6 November 2020. Retrieved 11 January 2022.
2.  ↑ "Behind Deep Blue: Building the Computer That Defeated the World Chess Champion". ieeexplore.ieee.org. Retrieved 5 November 2025.
3.  ↑ Newborn 2002, pp. 11–20
4.  1 2 3 4 Greenemeier, Larry (2 June 2017). "20 Years after Deep Blue: How AI Has Advanced Since Conquering Chess". Scientific American. Archived from the original on 30 June 2018. Retrieved 29 June 2018.
5.  ↑ Hsu 2002, pp. 92–95
6.  ↑ Hsu 2002, p. 107
7.  ↑ Hsu 2002, p. 132
8.  ↑ IBM. "Deep Blue – Overview". IBM Research. Archived from the original on 12 December 2008. Retrieved 19 August 2008.
9.  ↑ Hsu 2002, pp. 126–127
10. ↑ Zuckerman 2019, p. 178
11. ↑ "Joel Benjamin playing a practice game with Deep Blue". Computer History Museum. Archived from the original on 17 February 2020. Retrieved 17 February 2020.
12. ↑ Hsu 2002, pp. 160–161, 174, 177, 193
13. ↑ "8th World Computer Chess Championship". ICGA Tournaments. Archived from the original on 7 October 2008. Retrieved 4 June 2020.
14. ↑ "Deep Blue Supercomputer Tower". National Museum of American History. Archived from the original on 2 February 2019. Retrieved 1 February 2019.
15. ↑ "Deep Blue II". Computer History Museum. Archived from the original on 4 October 2019. Retrieved 8 June 2020.
16. ↑ (Hsu 2004)
17. ↑ Stuart Russell and Peter Norvig, Stuart Russell and Peter Norvig (2020). Artificial Intelligence: A Modern Approach (4th ed.). Pearson. p. 3. ISBN 9780134610993.
18. ↑ Newborn 1997, p. 287
19. ↑ McPhee, Michele; Baker, K.C.; Siemaszko, Corky (10 May 2015). "IBM's Deep Blue beats chess champion Garry Kasparov in 1997". Daily News. New York. Archived from the original on 3 August 2017. Retrieved 3 August 2017.
20. ↑ IBM Research Game 2 Archived 19 October 2007 at the Wayback Machine, Deep Blue IBM
21. ↑ Saletan, William (11 May 2007). "Chess Bump: The triumphant teamwork of humans and computers". Slate. Archived from the original on 13 May 2007.
22. 1 2 Roberts, Jacob (2016). "Thinking Machines: The Search for Artificial Intelligence". Distillations. 2 (2): 14–23. Archived from the original on 19 August 2018. Retrieved 22 March 2018.
23. ↑ Campbell 1998, p. 88
24. ↑ Levy & Newborn 1991, p. 192
25. 1 2 Plumer, Brad (26 September 2012). "Nate Silver's 'The Signal and the Noise'". The Washington Post. Archived from the original on 9 November 2012. Retrieved 18 August 2021.
26. ↑ LC Catalog – Item Information (Full Record). LCCN 2017304768.
27. ↑ Silver, Albert (19 February 2015). "Deep Blue's cheating move". Chess Base. Chess News. Archived from the original on 29 July 2020. Retrieved 3 June 2020.
28. ↑ Hsu 2004, p. x
29. ↑ Warwick 2004, p. 95
30. ↑ "Deep Blue – Replay the Games". IBM Research. Archived from the original on 1 July 2008. Retrieved 10 June 2020.
31. ↑ Boyle, Alan (16 June 2004). "How prizes pushed progress". NBC News. Retrieved 23 January 2024.
32. ↑ Baldwin, Alan (11 April 2020). "On this day: Born April 13, 1963; Russian chess champion Garry Kasparov". Reuters. Archived from the original on 2 November 2020. Retrieved 18 August 2021.
33. ↑ Amis 2011, p. vii
34. ↑ Barrat 2013, p. 13
35. ↑ "Owen Williams replies to Feng-hsiung Hsu". The Week in Chess. 13 January 2000. Archived from the original on 29 July 2012. Retrieved 11 May 2012.
36. ↑ "'Game Over' : Did IBM Cheat Kasparov?". About.com: Chess. June 2005. Archived from the original on 12 October 2007. Retrieved 4 June 2020.
37. ↑ Syed & Syed 2003, p. 138
38. ↑ "Deep Blue: Cultural Impacts". IBM100. IBM. Archived from the original on 30 March 2014. Retrieved 5 June 2020.
39. ↑ Wu 2015, p. 19
40. 1 2 Silver, David; Hubert, Thomas; Schrittwieser, Julian; et al. (6 December 2018). "A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play" (PDF). Science. 362 (6419): 1140–1144. Bibcode:2018Sci...362.1140S. doi:10.1126/science.aar6404. PMID 30523106. S2CID 54457125. Archived (PDF) from the original on 1 September 2019. Retrieved 4 January 2022.
41. ↑ "Google's AlphaGo retires on top after humbling world No. 1". phys.org. 27 May 2017. Archived from the original on 28 May 2017. Retrieved 4 January 2022.
42. ↑ Time (22 January 1950). "Science: The Thinking Machine". Time Magazine.
43. ↑ Gill, Brendan; Logan, Andy (29 December 1956). "Chess to Come". The New Yorker.
44. ↑ Dreyfus, Hubert (December 1965). Alchemy and AI (PDF) (Report). Rand Corporation.
45. ↑ Barbierato, Enrico; Zamponi, Maria Enrica (2022). "Shifting Perspectives on AI Evaluation: The Increasing Role of Ethics in Cooperation". AI. 3 (2): 331–352. doi:10.3390/ai3020021. hdl:10807/259716.
46. ↑ Strogatz, Steven (26 December 2018). "One Giant Step for a Chess-Playing Machine". The New York Times. ISSN 0362-4331. Archived from the original on 4 January 2022. Retrieved 4 January 2022.
47. ↑ Schulz, André (23 November 2006). "Das letzte Match Mensch gegen Maschine?" [The last man vs machine match?]. Der Spiegel (in German). Translated by ChessBase Chess News. Archived from the original on 16 October 2012. Retrieved 18 August 2021.
48. ↑ "Chess champion loses to computer". BBC News. 5 December 2006. Archived from the original on 31 December 2007. Retrieved 4 May 2008.
49. ↑ Campbell 1999, p. 66
50. ↑ Weber, Bruce (18 May 1997). "What Deep Blue Learned in Chess School". The New York Times. ISSN 0362-4331. Archived from the original on 17 May 2017. Retrieved 4 July 2017.
51. ↑ Weber, Bruce (5 May 1997). "Computer Defeats Kasparov, Stunning the Chess Experts". The New York Times. Archived from the original on 24 April 2020. Retrieved 18 May 2020.
52. ↑ Hsu, Campbell & Hoane 1995 p. 240
53. ↑ Greenemeier, Larry. "20 Years after Deep Blue: How AI Has Advanced Since Conquering Chess". Scientific American. Archived from the original on 20 December 2021. Retrieved 3 January 2022.
54. ↑ Hsu, Feng-hsiung (March–April 1999). "IBM's Deep Blue Chess Grandmaster Chips" (PDF). IEEE Micro. 19 (2): 70–81. Bibcode:1999IMicr..19b..70F. doi:10.1109/40.755469. Archived from the original (PDF) on 28 December 2004. Retrieved 11 January 2022.
55. ↑ Festa, Paul (2 September 1997). "IBM upgrades Deep Blue". Clnet. Archived from the original on 3 January 2022. Retrieved 11 January 2022.
56. ↑ Gonsalves 2017, p. 234
57. ↑ Hsu, Feng-hsiung (3 May 2022). Behind Deep Blue: Building the Computer That Defeated the World Chess Champion. Princeton University Press. ISBN 978-0-691-23514-1.
58. ↑ "TOP500 List – June 1997 (201–300)". Top 500. 13 February 2009. Archived from the original on 13 February 2009. Retrieved 10 June 2020.

Bibliography

- Amis, Martin (2011). "Foreword". In Mann, Windsor (ed.). The Quotable Hitchens: From Alcohol to Zionism. Da Capo Press. ISBN 978-0-306-81983-4. Archived from the original on 29 March 2022. Retrieved 18 August 2021.
- Barrat, James (2013). Our Final Invention (Kindle ed.). St. Martin's Press. ISBN 978-0-312-62237-4.
- Campbell, Murray (1998). "An Enjoyable Game". In Stork, D. G. (ed.). HAL's Legacy: 2001's Computer as Dream and Reality. Cambridge, Mass: MIT Press. ISBN 978-0-262-19378-8.
- Campbell, Murray (1999). "Knowledge discovery in deep blue". Communications of the ACM. 42 (11). Association for Computing Machinery: 65–67. doi:10.1145/319382.319396. S2CID 176390.
- Campbell, Murray; Hoane, A. Joseph Jr.; Hsu, Feng-hsiung (2002). "Deep Blue". Artificial Intelligence. 134 (1–2). Elsevier: 57–83. doi:10.1016/S0004-3702(01)00129-1. ISSN 0004-3702.
- Gonsalves, Tad (2017). "The Summers and Winters of Artificial Intelligence". In Khosrow-Pour, Mehdi (ed.). Encyclopedia of Information Science and Technology. Vol. 1. IGI Global. pp. 229–238. ISBN 978-1-5225-2256-0. Archived from the original on 29 March 2022. Retrieved 19 June 2020.
- Hsu, Feng-hsiung; Campbell, Murray; Hoane, A. Joseph Jr. (1995). "Deep Blue System Overview" (PDF). Proceedings of the 9th International Conference on Supercomputing. 1995 International Conference on Supercomputing. Association for Computing Machinery. pp. 240–244. doi:10.1145/224538.224567. ISBN 978-0-89791-728-5. Archived from the original on 17 October 2018 – via top-5000.nl.
- Hsu, Feng-hsiung (2002). Behind Deep Blue: Building the Computer that Defeated the World Chess Champion (1st ed.). Princeton University Press. ISBN 978-0-691-09065-8.
- Hsu, Feng-hsiung (2004) [2002]. Behind Deep Blue: Building the Computer that Defeated the World Chess Champion (revised ed.). Princeton University Press. ISBN 978-0-691-11818-5. Archived from the original on 22 March 2022. Retrieved 10 December 2018.
- King, Daniel (1997). Kasparov v. Deeper Blue: The Ultimate Man v. Machine Challenge. Batsford. ISBN 978-0-7134-8322-2.
- Levy, David; Newborn, Monty (1991). How Computers Play Chess. Computer Science Press. ISBN 978-0-7167-8121-9.
- Newborn, Monty (1997). Kasparov versus Deep Blue: Computer Chess Comes of Age (1st ed.). Springer. ISBN 978-0-387-94820-1. Archived from the original on 18 August 2021. Retrieved 31 August 2020.
- Newborn, Monty (2002). Deep Blue: An Artificial Intelligence Milestone. Springer. ISBN 978-0-387-95461-5.
- Syed, Omar; Syed, Aamir (2003). "Arimaa – a New Game Designed to be Difficult for Computers". International Computer Games Association Journal. 26 (2). Leiden University: 138–139. doi:10.3233/ICG-2003-26213. Archived from the original on 6 November 2020. Retrieved 18 August 2021 – via arimaa.com.
- Warwick, Kevin (2004). I, Cyborg. University of Illinois Press. ISBN 978-0-252-07215-4. Archived from the original on 18 August 2021. Retrieved 17 May 2020.
- Wu, David J. (2015). "Designing a Winning Arimaa Program" (PDF). International Computer Games Association Journal. 38 (1). Leiden University: 19–40. doi:10.3233/ICG-2015-38104. Archived (PDF) from the original on 13 November 2017. Retrieved 18 August 2021 – via arimaa.com.
- Zuckerman, Gregory (2019). The Man Who Solved the Market: How Jim Simons Launched the Quant Revolution (1st (hbk) ed.). Penguin/Portfolio. ISBN 978-0-7352-1798-0. Archived from the original on 18 August 2021. Retrieved 18 August 2021.

External links

- Official website at the Wayback Machine (archived 2002-08-06)
- Deep Blue IBM at ibm.com

+-------------------------------------+-----------------------------------------------------------------------------------+
| - v                                                                                                                     |
| - t                                                                                                                     |
| - e                                                                                                                     |
|                                                                                                                         |
| Chess                                                                                                                   |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Outline                             | - Theory                                                                          |
|                                     | - Titles                                                                          |
|                                     |   - Grandmaster                                                                   |
|                                     | - Computer chess                                                                  |
|                                     |   - glossary                                                                      |
|                                     |   - matches                                                                       |
|                                     |   - engines                                                                       |
|                                     |   - software                                                                      |
|                                     | - Correspondence chess                                                            |
|                                     | - FIDE                                                                            |
|                                     | - Glossary                                                                        |
|                                     | - Online chess                                                                    |
|                                     |   - Premove                                                                       |
|                                     |   - Internet chess server                                                         |
|                                     |     - list                                                                        |
|                                     | - Rating system                                                                   |
|                                     |   - world rankings                                                                |
|                                     |   - norms                                                                         |
|                                     | - Variants                                                                        |
|                                     |   - List                                                                          |
|                                     | - World records                                                                   |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Equipment                           | - Chess set                                                                       |
|                                     |   - Board                                                                         |
|                                     |   - Dubrovnik                                                                     |
|                                     |   - Staunton                                                                      |
|                                     | - Pieces                                                                          |
|                                     |   - King                                                                          |
|                                     |   - Queen                                                                         |
|                                     |   - Rook                                                                          |
|                                     |   - Bishop                                                                        |
|                                     |   - Knight                                                                        |
|                                     |   - Pawn                                                                          |
|                                     |   - Fairy                                                                         |
|                                     | - Clock                                                                           |
|                                     | - Table                                                                           |
|                                     | - Score sheets                                                                    |
+-------------------------------------+-----------------------------------------------------------------------------------+
| History                             | - Timeline                                                                        |
|                                     |   - Versus de scachis                                                             |
|                                     |   - Scachs d'amor                                                                 |
|                                     |   - Göttingen manuscript                                                          |
|                                     |   - Charlemagne chessmen                                                          |
|                                     |   - Lewis chessmen                                                                |
|                                     |   - Romantic chess                                                                |
|                                     |   - Hypermodernism                                                                |
|                                     |   - Soviet chess school                                                           |
|                                     |   - Top player comparison                                                         |
|                                     | - Geography of chess                                                              |
|                                     |   - Africa                                                                        |
|                                     |     - South Africa                                                                |
|                                     |   - China                                                                         |
|                                     |   - Europe                                                                        |
|                                     |     - Azerbaijan                                                                  |
|                                     |     - Armenia                                                                     |
|                                     |     - Spain                                                                       |
|                                     |   - India                                                                         |
|                                     | - List of chess players                                                           |
|                                     |   - amateurs                                                                      |
|                                     |   - female                                                                        |
|                                     |   - grandmasters                                                                  |
|                                     | - Women in chess                                                                  |
|                                     | - Transgender people in chess                                                     |
|                                     | - Chess museums                                                                   |
|                                     |   - Bobby Fischer Center                                                          |
|                                     |   - Gökyay Association Chess Museum                                               |
|                                     |   - World Chess Hall of Fame                                                      |
|                                     |                                                                                   |
|                                     | +-----------------------------------+-------------------------------------------+ |
|                                     | | Notable games                     | - Immortal Game                           | |
|                                     | |                                   | - Evergreen Game                          | |
|                                     | |                                   | - Opera Game                              | |
|                                     | |                                   | - Peruvian Immortal                       | |
|                                     | |                                   | - Game of the Century                     | |
|                                     | |                                   | - Deep Blue versus Kasparov, 1996, Game 1 | |
|                                     | |                                   | - Kasparov's Immortal                     | |
|                                     | |                                   | - Kasparov versus the World               | |
|                                     | +-----------------------------------+-------------------------------------------+ |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Rules                               | - Castling                                                                        |
|                                     | - Cheating in chess                                                               |
|                                     |   - doping                                                                        |
|                                     | - Check                                                                           |
|                                     | - Checkmate                                                                       |
|                                     | - Draw                                                                            |
|                                     |   - by agreement                                                                  |
|                                     |   - Fifty-move rule                                                               |
|                                     |   - Perpetual check                                                               |
|                                     |   - Stalemate                                                                     |
|                                     |   - Threefold repetition                                                          |
|                                     | - En passant                                                                      |
|                                     | - Pawn promotion                                                                  |
|                                     | - Time control                                                                    |
|                                     |   - Fast chess                                                                    |
|                                     | - Touch-move rule                                                                 |
|                                     | - White and Black                                                                 |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Terms                               | - Blunder                                                                         |
|                                     | - Chess notation                                                                  |
|                                     |   - algebraic                                                                     |
|                                     |   - descriptive                                                                   |
|                                     |   - PGN                                                                           |
|                                     |   - annotation symbols                                                            |
|                                     |   - symbols in Unicode                                                            |
|                                     | - Fianchetto                                                                      |
|                                     | - Gambit                                                                          |
|                                     | - Key square                                                                      |
|                                     | - King walk                                                                       |
|                                     | - Open file                                                                       |
|                                     |   - Half-open file                                                                |
|                                     | - Outpost                                                                         |
|                                     | - Pawns                                                                           |
|                                     |   - backward                                                                      |
|                                     |   - connected                                                                     |
|                                     |   - doubled                                                                       |
|                                     |   - isolated                                                                      |
|                                     |   - passed                                                                        |
|                                     | - Swindle                                                                         |
|                                     | - Tempo                                                                           |
|                                     | - Transposition                                                                   |
|                                     | - Trap                                                                            |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Tactics                             | - Artificial castling                                                             |
|                                     | - Battery                                                                         |
|                                     |   - Alekhine's gun                                                                |
|                                     | - Block                                                                           |
|                                     | - Checkmate patterns                                                              |
|                                     | - Combination                                                                     |
|                                     | - Decoy                                                                           |
|                                     | - Deflection                                                                      |
|                                     | - Desperado                                                                       |
|                                     | - Discovered attack                                                               |
|                                     | - Double check                                                                    |
|                                     | - Fork                                                                            |
|                                     | - Interference                                                                    |
|                                     | - Overloading                                                                     |
|                                     | - Pawn storm                                                                      |
|                                     | - Pin                                                                             |
|                                     | - Sacrifice                                                                       |
|                                     |   - Queen sacrifice                                                               |
|                                     | - Skewer                                                                          |
|                                     | - Undermining                                                                     |
|                                     | - Windmill                                                                        |
|                                     | - X-ray                                                                           |
|                                     | - Zwischenzug                                                                     |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Strategy                            | - Compensation                                                                    |
|                                     | - Exchange                                                                        |
|                                     |   - the exchange                                                                  |
|                                     | - Initiative                                                                      |
|                                     |   - first-move advantage                                                          |
|                                     | - Middlegame                                                                      |
|                                     | - Pawn structure                                                                  |
|                                     |   - Hedgehog                                                                      |
|                                     |   - Isolated Queen's Pawn                                                         |
|                                     |   - Maróczy Bind                                                                  |
|                                     |   - Minority attack                                                               |
|                                     | - Piece values                                                                    |
|                                     | - Prophylaxis                                                                     |
|                                     | - School of chess                                                                 |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Openings                            | +-----------------------------------+-----------------------------------+         |
|                                     | | Flank opening                     | - Benko Opening                   |         |
|                                     | |                                   | - Bird's Opening                  |         |
|                                     | |                                   | - Dunst Opening                   |         |
|                                     | |                                   | - English Opening                 |         |
|                                     | |                                   | - Grob's Attack                   |         |
|                                     | |                                   | - Nimzowitsch–Larsen Attack       |         |
|                                     | |                                   | - Zukertort Opening               |         |
|                                     | |                                   |   - King's Indian Attack          |         |
|                                     | |                                   |   - Réti Opening                  |         |
|                                     | +-----------------------------------+-----------------------------------+         |
|                                     | | King's Pawn Game                  | - Alekhine's Defence              |         |
|                                     | |                                   | - Caro–Kann Defence               |         |
|                                     | |                                   | - French Defence                  |         |
|                                     | |                                   | - Modern Defence                  |         |
|                                     | |                                   | - Nimzowitsch Defence             |         |
|                                     | |                                   | - Open Game                       |         |
|                                     | |                                   |   - Four Knights Game             |         |
|                                     | |                                   |   - Giuoco Piano                  |         |
|                                     | |                                   |   - Italian Game                  |         |
|                                     | |                                   |   - King's Gambit                 |         |
|                                     | |                                   |   - Petrov's Defence              |         |
|                                     | |                                   |   - Philidor Defence              |         |
|                                     | |                                   |   - Ponziani Opening              |         |
|                                     | |                                   |   - Ruy Lopez                     |         |
|                                     | |                                   |   - Semi-Italian Opening          |         |
|                                     | |                                   |   - Scotch Game                   |         |
|                                     | |                                   |   - Two Knights Defence           |         |
|                                     | |                                   |   - Vienna Game                   |         |
|                                     | |                                   | - Owen's Defence                  |         |
|                                     | |                                   | - Pirc Defence                    |         |
|                                     | |                                   | - Scandinavian Defence            |         |
|                                     | |                                   | - Sicilian Defence                |         |
|                                     | |                                   |   - Alapin                        |         |
|                                     | |                                   |   - Dragon/Accelerated Dragon     |         |
|                                     | |                                   |   - Najdorf                       |         |
|                                     | |                                   |   - Scheveningen                  |         |
|                                     | +-----------------------------------+-----------------------------------+         |
|                                     | | Queen's Pawn Game                 | - Colle System                    |         |
|                                     | |                                   | - Dutch Defence                   |         |
|                                     | |                                   | - English Defence                 |         |
|                                     | |                                   | - Indian Defence                  |         |
|                                     | |                                   |   - Benoni Defence                |         |
|                                     | |                                   |   - Modern Benoni                 |         |
|                                     | |                                   |   - Bogo-Indian Defence           |         |
|                                     | |                                   |   - Budapest Gambit               |         |
|                                     | |                                   |   - Catalan Opening               |         |
|                                     | |                                   |   - Grünfeld Defence              |         |
|                                     | |                                   |   - King's Indian Defence         |         |
|                                     | |                                   |   - Nimzo-Indian Defence          |         |
|                                     | |                                   |   - Old Indian Defence            |         |
|                                     | |                                   |   - Queen's Indian Defence        |         |
|                                     | |                                   | - London System                   |         |
|                                     | |                                   | - Stonewall Attack                |         |
|                                     | |                                   | - Richter–Veresov Attack          |         |
|                                     | |                                   | - Queen's Gambit                  |         |
|                                     | |                                   |   - Accepted                      |         |
|                                     | |                                   |   - Declined                      |         |
|                                     | |                                   |   - Slav Defence                  |         |
|                                     | |                                   |   - Semi-Slav Defence             |         |
|                                     | |                                   |   - Chigorin Defence              |         |
|                                     | |                                   | - Torre Attack                    |         |
|                                     | |                                   | - Trompowsky Attack               |         |
|                                     | +-----------------------------------+-----------------------------------+         |
|                                     | | Other                             | - List of ECO codes               |         |
|                                     | |                                   | - Theory table                    |         |
|                                     | |                                   | - List of chess gambits           |         |
|                                     | |                                   | - Irregular                       |         |
|                                     | |                                   |   - Bongcloud Attack              |         |
|                                     | |                                   |   - Fool's mate                   |         |
|                                     | |                                   |   - Scholar's mate                |         |
|                                     | +-----------------------------------+-----------------------------------+         |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Endgames                            | - Bishop and knight checkmate                                                     |
|                                     | - King and pawn vs. king                                                          |
|                                     | - Opposite-coloured bishops                                                       |
|                                     | - Pawnless endgame                                                                |
|                                     | - Queen and pawn vs. queen                                                        |
|                                     | - Queen vs. pawn                                                                  |
|                                     | - Queen vs. rook                                                                  |
|                                     | - Rook and bishop vs. rook                                                        |
|                                     | - Rook and pawn vs. rook                                                          |
|                                     |   - Lucena position                                                               |
|                                     |   - Philidor position                                                             |
|                                     | - Strategy                                                                        |
|                                     |   - fortress                                                                      |
|                                     |   - opposition                                                                    |
|                                     |   - Tarrasch rule                                                                 |
|                                     |   - triangulation                                                                 |
|                                     |   - Zugzwang                                                                      |
|                                     | - Study                                                                           |
|                                     | - Tablebase                                                                       |
|                                     | - Two knights endgame                                                             |
|                                     | - Wrong bishop                                                                    |
|                                     | - Wrong rook pawn                                                                 |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Tournaments                         | - List of strong chess tournaments                                                |
|                                     | - Chess Olympiad                                                                  |
|                                     |   - Women                                                                         |
|                                     | - Olympics                                                                        |
|                                     |   - Olympic Esports Series                                                        |
|                                     | - World Chess Championship                                                        |
|                                     |   - List                                                                          |
|                                     |   - Candidates Tournament                                                         |
|                                     |   - Chess World Cup                                                               |
|                                     |   - FIDE Grand Prix                                                               |
|                                     | - Other world championships                                                       |
|                                     |   - Women                                                                         |
|                                     |   - Team                                                                          |
|                                     |   - Rapid                                                                         |
|                                     |   - Blitz                                                                         |
|                                     |   - Junior                                                                        |
|                                     |   - Youth                                                                         |
|                                     |   - Senior                                                                        |
|                                     |   - Amateur                                                                       |
|                                     |   - Chess composition                                                             |
|                                     |   - Solving                                                                       |
|                                     | - Computer chess championships                                                    |
|                                     |   - CCC                                                                           |
|                                     |   - CSVN                                                                          |
|                                     |   - North American                                                                |
|                                     |   - TCEC                                                                          |
|                                     |   - WCCC                                                                          |
|                                     |   - WCSCC                                                                         |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Art and media                       | - Caïssa                                                                          |
|                                     | - Chess aesthetics                                                                |
|                                     | - Chess in the arts                                                               |
|                                     |   - early literature                                                              |
|                                     |   - film                                                                          |
|                                     |   - novels                                                                        |
|                                     |   - paintings                                                                     |
|                                     |   - poetry                                                                        |
|                                     |   - short stories                                                                 |
|                                     | - Chess books                                                                     |
|                                     |   - opening books                                                                 |
|                                     |   - endgame literature                                                            |
|                                     |   - Oxford Companion                                                              |
|                                     | - Chess libraries                                                                 |
|                                     | - Chess newspaper columns                                                         |
|                                     | - Chess periodicals                                                               |
+-------------------------------------+-----------------------------------------------------------------------------------+
| Related                             | - Arbiter                                                                         |
|                                     | - Chess boxing                                                                    |
|                                     | - Chess club                                                                      |
|                                     | - Chess composer                                                                  |
|                                     | - Chess engine                                                                    |
|                                     |   - AlphaZero                                                                     |
|                                     |   - Deep Blue                                                                     |
|                                     |   - Leela Chess Zero                                                              |
|                                     |   - Mittens                                                                       |
|                                     |   - Stockfish                                                                     |
|                                     | - Chess problem                                                                   |
|                                     |   - glossary                                                                      |
|                                     |   - joke chess                                                                    |
|                                     | - Chess prodigy                                                                   |
|                                     | - Elo rating system                                                               |
|                                     | - Mechanical Turk                                                                 |
|                                     | - Simultaneous exhibition                                                         |
|                                     | - Tie-breaking in Swiss-system tournaments                                        |
|                                     | - Solving chess                                                                   |
|                                     | - Video assistant referee system                                                  |
+-------------------------------------+-----------------------------------------------------------------------------------+
| - [icon] Chess portal                                                                                                   |
| - Category                                                                                                              |
+-------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| - v                                                                                                                                                       |
| - t                                                                                                                                                       |
| - e                                                                                                                                                       |
|                                                                                                                                                           |
| IBM                                                                                                                                                       |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| History                             | - History                                                                                                           |
|                                     |   - World War II                                                                                                    |
|                                     | - Mergers and acquisitions                                                                                          |
|                                     |   - PC business acquisition by Lenovo                                                                               |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Products                            | +-------------------------------------+---------------------------------------------------------------------------+ |
|                                     | | Hardware                            | +-----------------------------------+-----------------------------------+ | |
|                                     | |                                     | | Current                           | - Mainframe                       | | |
|                                     | |                                     | |                                   |   - IBM Z                         | | |
|                                     | |                                     | |                                   | - Power microprocessors           | | |
|                                     | |                                     | |                                   | - Power Systems                   | | |
|                                     | |                                     | |                                   | - Storage                         | | |
|                                     | |                                     | |                                   |   - FlashSystem                   | | |
|                                     | |                                     | |                                   |   - DS8000                        | | |
|                                     | |                                     | |                                   | - Quantum                         | | |
|                                     | |                                     | |                                   |   - Q System One                  | | |
|                                     | |                                     | |                                   |   - Q System Two                  | | |
|                                     | |                                     | |                                   |   - Eagle                         | | |
|                                     | |                                     | |                                   |   - Osprey                        | | |
|                                     | |                                     | |                                   |   - Heron                         | | |
|                                     | |                                     | |                                   |   - Condor                        | | |
|                                     | |                                     | +-----------------------------------+-----------------------------------+ | |
|                                     | |                                     | | Former                            | - Blue Gene                       | | |
|                                     | |                                     | |                                   | - Cell microprocessors            | | |
|                                     | |                                     | |                                   | - PowerPC                         | | |
|                                     | |                                     | |                                   | - Midrange computer               | | |
|                                     | |                                     | |                                   | - Personal Computer               | | |
|                                     | |                                     | |                                   | - Selectric                       | | |
|                                     | |                                     | |                                   | - Other                           | | |
|                                     | |                                     | |                                   |   - ThinkPad                      | | |
|                                     | |                                     | |                                   |   - ThinkCentre                   | | |
|                                     | |                                     | +-----------------------------------+-----------------------------------+ | |
|                                     | +-------------------------------------+---------------------------------------------------------------------------+ |
|                                     | | - Carbon Design System                                                                                          | |
|                                     | | - Cloud                                                                                                         | |
|                                     | |   - Cloudant                                                                                                    | |
|                                     | | - Cognos Analytics                                                                                              | |
|                                     | | - Connections                                                                                                   | |
|                                     | | - Criminal Reduction Utilising Statistical History                                                              | |
|                                     | | - Fortran                                                                                                       | |
|                                     | | - ILOG                                                                                                          | |
|                                     | | - Information Management Software                                                                               | |
|                                     | | - Mainframe operating systems                                                                                   | |
|                                     | | - Mashup Center                                                                                                 | |
|                                     | | - Planning Analytics                                                                                            | |
|                                     | | - PureQuery                                                                                                     | |
|                                     | | - Quantum Platform                                                                                              | |
|                                     | |   - Qiskit                                                                                                      | |
|                                     | |   - OpenQASM                                                                                                    | |
|                                     | | - Rational Software                                                                                             | |
|                                     | | - SPSS                                                                                                          | |
|                                     | | - Tivoli Software                                                                                               | |
|                                     | |   - Service Automation Manager                                                                                  | |
|                                     | | - Watson                                                                                                        | |
|                                     | | - Watsonx                                                                                                       | |
|                                     | |   - Granite                                                                                                     | |
|                                     | | - WebSphere                                                                                                     | |
|                                     | +-----------------------------------------------------------------------------------------------------------------+ |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Business                            | +-----------------------------------+---------------------------------------------+                                 |
| entities                            | | Current                           | - Apptio                                    |                                 |
|                                     | |                                   | - Center for The Business of Government     |                                 |
|                                     | |                                   | - Consulting                                |                                 |
|                                     | |                                   |   - Promontory                              |                                 |
|                                     | |                                   | - HashiCorp                                 |                                 |
|                                     | |                                   | - Kenexa                                    |                                 |
|                                     | |                                   | - International subsidiaries                |                                 |
|                                     | |                                   |   - India                                   |                                 |
|                                     | |                                   | - Press                                     |                                 |
|                                     | |                                   | - Red Hat                                   |                                 |
|                                     | |                                   | - Research                                  |                                 |
|                                     | +-----------------------------------+---------------------------------------------+                                 |
|                                     | | Former                            | - AdStar                                    |                                 |
|                                     | |                                   | - AIM alliance                              |                                 |
|                                     | |                                   |   - Kaleida Labs                            |                                 |
|                                     | |                                   |   - Taligent                                |                                 |
|                                     | |                                   | - Ambra Computer                            |                                 |
|                                     | |                                   | - Cognos                                    |                                 |
|                                     | |                                   | - EduQuest                                  |                                 |
|                                     | |                                   | - Kyndryl                                   |                                 |
|                                     | |                                   | - Lexmark                                   |                                 |
|                                     | |                                   | - Lotus Development                         |                                 |
|                                     | |                                   | - Merative                                  |                                 |
|                                     | |                                   | - Microelectronics                          |                                 |
|                                     | |                                   | - Product Center                            |                                 |
|                                     | |                                   | - Retail Store Solutions                    |                                 |
|                                     | |                                   | - Science Research Associates               |                                 |
|                                     | |                                   | - Service Bureau                            |                                 |
|                                     | |                                   | - The Weather Company (Weather Underground) |                                 |
|                                     | +-----------------------------------+---------------------------------------------+                                 |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Facilities                          | - Towers                                                                                                            |
|                                     |   - 1250 René-Lévesque, Montreal, QC                                                                                |
|                                     |   - One Atlantic Center, Atlanta, GA                                                                                |
|                                     | - Software Labs                                                                                                     |
|                                     |   - Rome Software Lab                                                                                               |
|                                     |   - Toronto Software Lab                                                                                            |
|                                     | - IBM Buildings                                                                                                     |
|                                     |   - Chicago                                                                                                         |
|                                     |   - Honolulu                                                                                                        |
|                                     |   - New York                                                                                                        |
|                                     |   - Seattle                                                                                                         |
|                                     | - Facilities                                                                                                        |
|                                     |   - Thomas J. Watson Research Center                                                                                |
|                                     |   - Hakozaki Facility                                                                                               |
|                                     |   - Yamato Facility                                                                                                 |
|                                     | - Cambridge Scientific Center                                                                                       |
|                                     | - IBM Hursley                                                                                                       |
|                                     | - Canada Head Office Building                                                                                       |
|                                     | - IBM Rochester                                                                                                     |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Initiatives                         | - Deep Thunder                                                                                                      |
|                                     |   - Develothon                                                                                                      |
|                                     | - Fellow                                                                                                            |
|                                     | - The Great Mind Challenge                                                                                          |
|                                     | - Linux Technology Center                                                                                           |
|                                     | - SkillsBuild                                                                                                       |
|                                     | - Smarter Planet                                                                                                    |
|                                     | - Virtual Universe Community                                                                                        |
|                                     | - World Community Grid                                                                                              |
|                                     | - Think conference                                                                                                  |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Inventions                          | - Automated teller machine                                                                                          |
|                                     | - Cynefin framework                                                                                                 |
|                                     | - DRAM                                                                                                              |
|                                     | - Electronic keypunch                                                                                               |
|                                     | - Floppy disk                                                                                                       |
|                                     | - Hard disk drive                                                                                                   |
|                                     | - Magnetic stripe card                                                                                              |
|                                     | - Relational model                                                                                                  |
|                                     | - Sabre airline reservation system                                                                                  |
|                                     | - Scanning tunneling microscope                                                                                     |
|                                     | - Financial swaps                                                                                                   |
|                                     | - Universal Product Code                                                                                            |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Terminology                         | - Big Blue                                                                                                          |
|                                     | - Commercial Processing Workload                                                                                    |
|                                     | - Customer engineer                                                                                                 |
|                                     | - Globally integrated enterprise                                                                                    |
|                                     | - e-business                                                                                                        |
|                                     | - Think slogan                                                                                                      |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| CEOs                                | - Thomas J. Watson (1914–1956)                                                                                      |
|                                     | - Thomas Watson Jr. (1956–1971)                                                                                     |
|                                     | - T. Vincent Learson (1971–1973)                                                                                    |
|                                     | - Frank T. Cary (1973–1981)                                                                                         |
|                                     | - John R. Opel (1981–1985)                                                                                          |
|                                     | - John Fellows Akers (1985–1993)                                                                                    |
|                                     | - Louis V. Gerstner Jr. (1993–2002)                                                                                 |
|                                     | - Samuel J. Palmisano (2002–2011)                                                                                   |
|                                     | - Ginni Rometty (2012–2020)                                                                                         |
|                                     | - Arvind Krishna (since 2020)                                                                                       |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| Other                               | - A Boy and His Atom                                                                                                |
|                                     | - Big Blue sports teams                                                                                             |
|                                     |   - American football                                                                                               |
|                                     |   - Rugby union                                                                                                     |
|                                     | - Common Public License/IBM Public License                                                                          |
|                                     |   - Wallace v. International Business Machines Corp.                                                                |
|                                     | - Deep Blue                                                                                                         |
|                                     | - Deep Thought                                                                                                      |
|                                     | - Dynamic infrastructure                                                                                            |
|                                     | - GlobalFoundries                                                                                                   |
|                                     | - GUIDE International                                                                                               |
|                                     | - IBM and the Holocaust                                                                                             |
|                                     | - International chess tournament                                                                                    |
|                                     | - Lucifer cipher                                                                                                    |
|                                     | - Mathematica                                                                                                       |
|                                     | - IBM Plex                                                                                                          |
|                                     | - SHARE computing                                                                                                   |
|                                     | - ScicomP                                                                                                           |
|                                     | - Unions                                                                                                            |
+-------------------------------------+---------------------------------------------------------------------------------------------------------------------+
| - [] Commons                                                                                                                                              |
| - [] Category                                                                                                                                             |
| - [] Navigational boxes                                                                                                                                   |
|   - FOSS                                                                                                                                                  |
|   - Midrange computers                                                                                                                                    |
|   - Operating systems                                                                                                                                     |
|   - Personal computers                                                                                                                                    |
|   - System/360                                                                                                                                            |
|   - System/370                                                                                                                                            |
|   - Typewriters                                                                                                                                           |
|   - Vacuum tube computers                                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------+-------------------------------------+
| Authority control databases [Edit this at Wikidata]                       |
+-------------------------------------+-------------------------------------+
| International                       | - GND                               |
+-------------------------------------+-------------------------------------+
| National                            | - United States                     |
|                                     | - Israel                            |
+-------------------------------------+-------------------------------------+
| People                              | - LibraryThing                      |
+-------------------------------------+-------------------------------------+
| Other                               | - Yale LUX                          |
+-------------------------------------+-------------------------------------+
