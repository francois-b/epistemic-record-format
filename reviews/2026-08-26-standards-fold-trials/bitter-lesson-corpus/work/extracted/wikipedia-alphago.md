Artificial intelligence that plays Go

This article is about a computer program. For the film, see AlphaGo (film).

+-----------+----------------------------------------------------+
| AlphaGo                                                        |
+----------------------------------------------------------------+
| []                                                             |
+-----------+----------------------------------------------------+
| Developer | Google DeepMind                                    |
+-----------+----------------------------------------------------+
| Type      | Computer Go software                               |
+-----------+----------------------------------------------------+
| Website   | deepmind.com/research/highlighted-research/alphago |
+-----------+----------------------------------------------------+

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

AlphaGo is a computer program that plays the board game Go.^([1]) It was developed by the London-based DeepMind Technologies,^([2]) an acquired subsidiary of Google. Subsequent versions of AlphaGo became increasingly powerful, including a version that competed under the name Master.^([3]) After retiring from competitive play, AlphaGo Master was succeeded by an even more powerful version known as AlphaGo Zero, which was completely self-taught without learning from human games. AlphaGo Zero was then generalized into a program known as AlphaZero, which played additional games, including chess and shogi. AlphaZero has in turn been succeeded by a program known as MuZero which learns without being taught the rules.

AlphaGo and its successors use a Monte Carlo tree search algorithm to find its moves based on knowledge previously acquired by machine learning, specifically by an artificial neural network (a deep learning method) by extensive training, both from human and computer play.^([4]) A neural network is trained to identify the best moves and the winning percentages of these moves. This neural network improves the strength of the tree search, resulting in stronger move selection in the next iteration.

In October 2015, in a match against Fan Hui, the original AlphaGo became the first computer Go program to beat a human professional Go player without handicap on a full-sized 19×19 board.^([5][6]) In March 2016, it beat Lee Sedol in a five-game match, the first time a computer Go program has beaten a 9-dan professional without handicap.^([7]) Although it lost to Lee Sedol in the fourth game, Lee resigned in the final game, giving a final score of 4 games to 1 in favour of AlphaGo. In recognition of the victory, AlphaGo was awarded an honorary 9-dan by the Korea Baduk Association.^([8]) The lead up and the challenge match with Lee Sedol were documented in a documentary film also titled AlphaGo,^([9]) directed by Greg Kohs. The win by AlphaGo was chosen by Science as one of the Breakthrough of the Year runners-up on 22 December 2016.^([10])

At the 2017 Future of Go Summit, the Master version of AlphaGo beat Ke Jie, the number one ranked player in the world at the time, in a three-game match, after which AlphaGo was awarded professional 9-dan by the Chinese Weiqi Association.^([11])

After the match between AlphaGo and Ke Jie, DeepMind retired AlphaGo, while continuing AI research in other areas.^([12]) The self-taught AlphaGo Zero achieved a 100–0 victory against the early competitive version of AlphaGo, and its successor AlphaZero was perceived as the world's top player in Go by the end of the 2010s.^([13][14])

History

[]

Go is considered much more difficult for computers to win than other games such as chess, because its strategic and aesthetic nature makes it hard to directly construct an evaluation function, and its much larger branching factor makes it prohibitively difficult to use traditional AI methods such as alpha–beta pruning, tree traversal and heuristic search.^([5][15])

Almost two decades after IBM's computer Deep Blue beat world chess champion Garry Kasparov in the 1997 match, the strongest Go programs using artificial intelligence techniques only reached about amateur 5-dan level,^([4]) and still could not beat a professional Go player without a handicap.^([5][6][16]) In 2012, the software program Zen, running on a four PC cluster, beat Masaki Takemiya (9p) twice at five- and four-stone handicaps.^([17]) In 2013, Crazy Stone beat Yoshio Ishida (9p) at a four-stone handicap.^([18])

According to DeepMind's David Silver, the AlphaGo research project was formed around 2014 to test how well a neural network using deep learning can compete at Go.^([19]) AlphaGo represents a significant improvement over previous Go programs. In 500 games against other available Go programs, including Crazy Stone and Zen, AlphaGo running on a single computer won all but one.^([20]) In a similar matchup, AlphaGo running on multiple computers won all 500 games played against other Go programs, and 77% of games played against AlphaGo running on a single computer. The distributed version in October 2015 was using 1,202 CPUs and 176 GPUs.^([4])

Match against Fan Hui

Main article: AlphaGo versus Fan Hui

In October 2015, the distributed version of AlphaGo defeated the European Go champion Fan Hui,^([21]) a 2-dan (out of 9 dan possible) professional, five to zero.^([6][22]) This was the first time a computer Go program had beaten a professional human player on a full-sized board without handicap.^([23]) The announcement of the news was delayed until 27 January 2016 to coincide with the publication of a paper in the journal Nature^([4]) describing the algorithms used.^([6])

Match against Lee Sedol

Main article: AlphaGo versus Lee Sedol

AlphaGo played South Korean professional Go player Lee Sedol, ranked 9-dan, one of the best players at Go,^([16][needs update]) with five games taking place at the Four Seasons Hotel in Seoul, South Korea on 9, 10, 12, 13, and 15 March 2016,^([24][25]) which were video-streamed live.^([26]) Out of five games, AlphaGo won four games and Lee won the fourth game which made him recorded as the only human player who beat AlphaGo in all of its 74 official games.^([27]) AlphaGo ran on Google's cloud computing with its servers located in the United States.^([28]) The match used Chinese rules with a 7.5-point komi, and each side had two hours of thinking time plus three 60-second byoyomi periods.^([29]) The version of AlphaGo playing against Lee used a similar amount of computing power as was used in the Fan Hui match.^([30]) The Economist reported that it used 1,920 CPUs and 280 GPUs.^([31]) At the time of play, Lee Sedol had the second-highest number of Go international championship victories in the world after South Korean player Lee Chang-ho who kept the world championship title for 16 years.^([32]) Since there is no single official method of ranking in international Go, the rankings may vary among the sources. While he was ranked top sometimes, some sources ranked Lee Sedol as the fourth-best player in the world at the time.^([33][34]) AlphaGo was not specifically trained to face Lee nor was designed to compete with any specific human players.

The first three games were won by AlphaGo following resignations by Lee.^([35][36]) However, Lee beat AlphaGo in the fourth game, winning by resignation at move 180. AlphaGo then continued to achieve a fourth win, winning the fifth game by resignation.^([37])

The prize was US$1 million. Since AlphaGo won four out of five and thus the series, the prize will be donated to charities, including UNICEF.^([38]) Lee Sedol received $150,000 for participating in all five games and an additional $20,000 for his win in Game 4.^([29])

In June 2016, at a presentation held at a university in the Netherlands, Aja Huang, one of the Deep Mind team, revealed that they had patched the logical weakness that occurred during the 4th game of the match between AlphaGo and Lee, and that after move 78 (which was dubbed the "divine move" by many professionals), it would play as intended and maintain Black's advantage. Before move 78, AlphaGo was leading throughout the game, but Lee's move caused the program's computing powers to be diverted and confused.^([39]) Huang explained that AlphaGo's policy network of finding the most accurate move order and continuation did not precisely guide AlphaGo to make the correct continuation after move 78, since its value network did not determine Lee's 78th move as being the most likely, and therefore when the move was made AlphaGo could not make the right adjustment to the logical continuation.^([40])

Sixty online games

Main article: Master (software)

On 29 December 2016, a new account on the Tygem server named "Magister" (shown as 'Magist' at the server's Chinese version) from South Korea began to play games with professional players. It changed its account name to "Master" on 30 December, then moved to the FoxGo server on 1 January 2017. On 4 January, DeepMind confirmed that the "Magister" and the "Master" were both played by an updated version of AlphaGo, called AlphaGo Master.^([41][42]) As of 5 January 2017, AlphaGo Master's online record was 60 wins and 0 losses,^([43]) including three victories over Go's top-ranked player, Ke Jie,^([44]) who had been quietly briefed in advance that Master was a version of AlphaGo.^([43]) After losing to Master, Gu Li offered a bounty of 100,000 yuan (US$14,400) to the first human player who could defeat Master.^([42]) Master played at the pace of 10 games per day. Many quickly suspected it to be an AI player due to little or no resting between games. Its adversaries included many world champions such as Ke Jie, Park Jeong-hwan, Yuta Iyama, Tuo Jiaxi, Mi Yuting, Shi Yue, Chen Yaoye, Li Qincheng, Gu Li, Chang Hao, Tang Weixing, Fan Tingyu, Zhou Ruiyang, Jiang Weijie, Chou Chun-hsun, Kim Ji-seok, Kang Dong-yun, Park Yeong-hun, and Won Seong-jin; national champions or world championship runners-up such as Lian Xiao, Tan Xiao, Meng Tailing, Dang Yifei, Huang Yunsong, Yang Dingxin, Gu Zihao, Shin Jinseo, Cho Han-seung, and An Sungjoon. All 60 games except one were fast-paced games with three 20 or 30 seconds byo-yomi. Master offered to extend the byo-yomi to one minute when playing with Nie Weiping in consideration of his age. After winning its 59th game Master revealed itself in the chatroom to be controlled by Dr. Aja Huang of the DeepMind team,^([45]) then changed its nationality to the United Kingdom. After these games were completed, the co-founder of DeepMind, Demis Hassabis, said in a tweet, "we're looking forward to playing some official, full-length games later [2017] in collaboration with Go organizations and experts".^([41][42])

Go experts were impressed by the program's performance and its nonhuman play style; Ke Jie stated that "After humanity spent thousands of years improving our tactics, computers tell us that humans are completely wrong... I would go as far as to say not a single human has touched the edge of the truth of Go."^([43])

Future of Go Summit

Main article: Future of Go Summit

Further information: AlphaGo versus Ke Jie

In the Future of Go Summit held in Wuzhen in May 2017, AlphaGo Master played three games with Ke Jie, the world No.1 ranked player, as well as two games with several top Chinese professionals, one pair Go game and one against a collaborating team of five human players.^([46])

Google DeepMind offered 1.5 million dollar winner prizes for the three-game match between Ke Jie and Master while the losing side took 300,000 dollars.^([47][48]) Master won all three games against Ke Jie,^([49][50]) after which AlphaGo was awarded professional 9-dan by the Chinese Weiqi Association.^([11])

After winning its three-game match against Ke Jie, the top-rated world Go player, AlphaGo retired. DeepMind also disbanded the team that worked on the game to focus on AI research in other areas.^([12]) After the Summit, DeepMind published 50 full length AlphaGo vs AlphaGo matches, as a gift to the Go community.^([51])

AlphaGo Zero and AlphaZero

Main articles: AlphaGo Zero and AlphaZero

AlphaGo's team published an article in the journal Nature on 19 October 2017, introducing AlphaGo Zero, a version without human data and stronger than any previous human-champion-defeating version.^([52]) By playing games against itself, AlphaGo Zero surpassed the strength of AlphaGo Lee in three days by winning 100 games to 0, reached the level of AlphaGo Master in 21 days, and exceeded all the old versions in 40 days.^([53])

In a paper released on arXiv on 5 December 2017, DeepMind claimed that it generalized AlphaGo Zero's approach into a single AlphaZero algorithm, which achieved within 24 hours a superhuman level of play in the games of chess, shogi, and Go by defeating world-champion programs, Stockfish, Elmo, and 3-day version of AlphaGo Zero in each case.^([54])

Teaching tool

On 11 December 2017, DeepMind released an AlphaGo teaching tool on its website^([55]) to analyze winning rates of different Go openings as calculated by AlphaGo Master.^([56]) The teaching tool collects 6,000 Go openings from 230,000 human games each analyzed with 10,000,000 simulations by AlphaGo Master. Many of the openings include human move suggestions.^([56])

Versions

An early version of AlphaGo was tested on hardware with various numbers of CPUs and GPUs, running in asynchronous or distributed mode. Two seconds of thinking time was given to each move. The resulting Elo ratings are listed below.^([4]) In the matches with more time per move higher ratings are achieved.

  -------------------------- -------------- -------------- -------------- --------------
  Configuration              Search         No. of CPU     No. of GPU     Elo rating
                             threads                                      

  Single^([4]) ^(p. 10–11)   40             48             1              2,181

  Single                     40             48             2              2,738

  Single                     40             48             4              2,850

  Single                     40             48             8              2,890

  Distributed                12             428            64             2,937

  Distributed                24             764            112            3,079

  Distributed                40             1,202          176            3,140

  Distributed                64             1,920          280            3,168
  -------------------------- -------------- -------------- -------------- --------------

  : Configuration and performance {#mwAeQ .wikitable .sortable style="text-align:center"}

In May 2016, Google unveiled its own proprietary hardware "tensor processing units", which it stated had already been deployed in multiple internal projects at Google, including the AlphaGo match against Lee Sedol.^([57][58])

In the Future of Go Summit in May 2017, DeepMind disclosed that the version of AlphaGo used in this Summit was AlphaGo Master,^([59][60]) and revealed that it had measured the strength of different versions of the software. AlphaGo Lee, the version used against Lee, could give AlphaGo Fan, the version used in AlphaGo vs. Fan Hui, three stones, and AlphaGo Master was even three stones stronger.^([61])

+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| Versions                | Hardware                      | Elo rating   | Date        | Results                               |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| AlphaGo Fan             | 176 GPUs,^([53]) distributed  | 3,144^([52]) | Oct 2015    | 5:0 against Fan Hui                   |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| AlphaGo Lee             | 48 TPUs,^([53]) distributed   | 3,739^([52]) | Mar 2016    | 4:1 against Lee Sedol                 |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| AlphaGo Master          | 4 TPUs,^([53]) single machine | 4,858^([52]) | May 2017    | 60:0 against professional players;    |
|                         |                               |              |             | Future of Go Summit                   |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| AlphaGo Zero (40 block) | 4 TPUs,^([53]) single machine | 5,185^([52]) | Oct 2017    | 100:0 against AlphaGo Lee             |
|                         |                               |              |             |                                       |
|                         |                               |              |             | 89:11 against AlphaGo Master          |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+
| AlphaZero (20 block)    | 4 TPUs, single machine        | 5,018^([63]) | Dec 2017    | 60:40 against AlphaGo Zero (20 block) |
+-------------------------+-------------------------------+--------------+-------------+---------------------------------------+

: Configuration and strength^([62]) {#mwAj4 .wikitable .sortable style="text-align:center"}

Algorithm

As of 2016, AlphaGo's algorithm uses a combination of machine learning and tree search techniques, combined with extensive training, both from human and computer play. It uses Monte Carlo tree search, guided by a "value network" and a "policy network", both implemented using deep neural network technology.^([5][4]) A limited amount of game-specific feature detection pre-processing (for example, to highlight whether a move matches a nakade pattern) is applied to the input before it is sent to the neural networks.^([4]) The networks are convolutional neural networks with 12 layers, trained by reinforcement learning.^([4])

The system's neural networks were initially bootstrapped from human gameplay expertise. AlphaGo was initially trained to mimic human play by attempting to match the moves of expert players from recorded historical games, using a database of around 30 million moves.^([21]) Once it had reached a certain degree of proficiency, it was trained further by being set to play large numbers of games against other instances of itself, using reinforcement learning to improve its play.^([5]) To avoid "disrespectfully" wasting its opponent's time, the program is specifically programmed to resign if its assessment of win probability falls beneath a certain threshold; for the match against Lee, the resignation threshold was set to 20%.^([64])

Style of play

Toby Manning, the match referee for AlphaGo vs. Fan Hui, has described the program's style as "conservative".^([65]) AlphaGo's playing style strongly favours greater probability of winning by fewer points over lesser probability of winning by more points.^([19]) Its strategy of maximising its probability of winning is distinct from what human players tend to do which is to maximise territorial gains, and explains some of its odd-looking moves.^([66]) It makes a lot of opening moves that have never or seldom been made by humans. It likes to use shoulder hits, especially if the opponent is over concentrated.^([67])

Responses to 2016 victory

AI community

AlphaGo's March 2016 victory was a major milestone in artificial intelligence research.^([68]) Go had previously been regarded as a hard problem in machine learning that was expected to be out of reach for the technology of the time.^([68][69][70]) Most experts thought a Go program as powerful as AlphaGo was at least five years away;^([71]) some experts thought that it would take at least another decade before computers would beat Go champions.^([4][72][73]) Most observers at the beginning of the 2016 matches expected Lee to beat AlphaGo.^([68])

With games such as checkers (that has been solved by the Chinook computer engine), chess, and now Go won by computers, victories at popular board games can no longer serve as major milestones for artificial intelligence in the way that they used to. Deep Blue's Murray Campbell called AlphaGo's victory "the end of an era... board games are more or less done and it's time to move on."^([68])

When compared with Deep Blue or Watson, AlphaGo's underlying algorithms are potentially more general-purpose and may be evidence that the scientific community is making progress towards artificial general intelligence.^([19][74]) Some commentators believe AlphaGo's victory makes for a good opportunity for society to start preparing for the possible future impact of machines with general purpose intelligence. As noted by entrepreneur Guy Suter, AlphaGo only knows how to play Go and doesn't possess general-purpose intelligence; "[It] couldn't just wake up one morning and decide it wants to learn how to use firearms."^([68]) AI researcher Stuart Russell said that AI systems such as AlphaGo have progressed quicker and become more powerful than expected, and we must therefore develop methods to ensure they "remain under human control".^([75]) Some scholars, such as Stephen Hawking, warned (in May 2015 before the matches) that some future self-improving AI could gain actual general intelligence, leading to an unexpected AI takeover; other scholars disagree: AI expert Jean-Gabriel Ganascia believes that "Things like 'common sense'... may never be reproducible",^([76]) and says "I don't see why we would speak about fears. On the contrary, this raises hopes in many domains such as health and space exploration."^([75]) Computer scientist Richard Sutton said "I don't think people should be scared... but I do think people should be paying attention."^([77])

In China, AlphaGo was a "Sputnik moment" which helped convince the Chinese government to prioritize and dramatically increase funding for artificial intelligence.^([78])

In 2017, the DeepMind AlphaGo team received the inaugural IJCAI Marvin Minsky medal for Outstanding Achievements in AI. "AlphaGo is a wonderful achievement, and a perfect example of what the Minsky Medal was initiated to recognise", said Professor Michael Wooldridge, Chair of the IJCAI Awards Committee. "What particularly impressed IJCAI was that AlphaGo achieves what it does through a brilliant combination of classic AI techniques as well as the state-of-the-art machine learning techniques that DeepMind is so closely associated with. It's a breathtaking demonstration of contemporary AI, and we are delighted to be able to recognise it with this award."^([79])

Go community

Go is a popular game in China, Japan and Korea, and the 2016 matches were watched by perhaps a hundred million people worldwide.^([68][80]) Many top Go players characterized AlphaGo's unorthodox plays as seemingly-questionable moves that initially befuddled onlookers, but made sense in hindsight:^([72]) "All but the very best Go players craft their style by imitating top players. AlphaGo seems to have totally original moves it creates itself."^([68]) AlphaGo appeared to have unexpectedly become much stronger, even when compared with its October 2015 match^([81]) where a computer had beaten a Go professional for the first time ever without the advantage of a handicap.^([82]) The day after Lee's first defeat, Jeong Ahram, the lead Go correspondent for one of South Korea's biggest daily newspapers, said "Last night was very gloomy... Many people drank alcohol."^([83]) The Korea Baduk Association, the organization that oversees Go professionals in South Korea, awarded AlphaGo an honorary 9-dan title for exhibiting creative skills and pushing forward the game's progress.^([84])

China's Ke Jie, an 18-year-old generally recognized as the world's best Go player at the time,^([33][85]) initially claimed that he would be able to beat AlphaGo, but declined to play against it for fear that it would "copy my style".^([85]) As the matches progressed, Ke Jie went back and forth, stating that "it is highly likely that I (could) lose" after analysing the first three matches,^([86]) but regaining confidence after AlphaGo displayed flaws in the fourth match.^([87])

Toby Manning, the referee of AlphaGo's match against Fan Hui, and Hajin Lee, secretary general of the International Go Federation, both reason that in the future, Go players will get help from computers to learn what they have done wrong in games and improve their skills.^([82])

After game two, Lee said he felt "speechless": "From the very beginning of the match, I could never manage an upper hand for one single move. It was AlphaGo's total victory."^([88]) Lee apologized for his losses, stating after game three that "I misjudged the capabilities of AlphaGo and felt powerless."^([68]) He emphasized that the defeat was "Lee Se-dol's defeat" and "not a defeat of mankind".^([27][76]) Lee said his eventual loss to a machine was "inevitable" but stated that "robots will never understand the beauty of the game the same way that we humans do."^([76]) Lee called his game four victory a "priceless win that I (would) not exchange for anything."^([27])

AlphaGo documentary film (2016)

Reception

On Rotten Tomatoes the documentary has an average rating of 100% from 10 reviews.^([89])

Michael Rechtshaffen of the Los Angeles Times gave the documentary a positive review and said: "It helps matters when you have a group of engaging human subjects like soft-spoken Sedol, who's as intensively contemplative as the game itself, contrasted by the spirited, personable Fan Hui, the Paris-based European champ who accepts an offer to serve as an advisor for the DeepMind team after suffering a demoralizing AI trouncing". He also mentioned that with the passion of Hauschka's Volker Bertelmann, the film's producer, this documentary shows many unexpected sequences, including strategic and philosophical components.^([90]) (Rechtshaffen, 2017 John Defore of The Hollywood Reporter, wrote this documentary is "an involving sports-rivalry doc with an AI twist." "In the end, observers wonder if AlphaGo's odd variety of intuition might not kill Go as an intellectual pursuit but shift its course, forcing the game's scholars to consider it from new angles. So maybe it isn't time to welcome our computer overlords, and won't be for a while - maybe they'll teach us to be better thinkers before turning us into their slaves."^([91])

Greg Kohs, the director of the film, said "The complexity of the game of Go, combined with the technical depth of an emerging technology like artificial intelligence seemed like it might create an insurmountable barrier for a film like this. The fact that I was so innocently unaware of Go and AlphaGo actually proved to be beneficial. It allowed me to approach the action and interviews with pure curiosity, the kind that helps make any subject matter emotionally accessible." Kohs also said that "Unlike the film's human characters – who turn their curious quest for knowledge into an epic spectacle with great existential implications, who dare to risk their reputation and pride to contest that curiosity – AI might not yet possess the ability to empathize. But it can teach us profound things about our humanness – the way we play board games, the way we think and feel and grow. It's a deep, vast premise, but my hope is, by sharing it, we can discover something within ourselves we never saw before".^([92])

Professional Go player

Hajin Lee, a former professional Go player, described this documentary as being "beautifully filmed". In addition to the story itself, the feelings and atmosphere were also conveyed through different scene arrangements. For example, the close-up shots of Lee Sedol when he realizes that the AlphaGo AI is intelligent, the atmospheric scene of the Korean commentator's distress and affliction following the first defeat, and the tension being held inside the room. The documentary also tells a story by describing the background of AlphaGo technology and the customs of the Korean Go community. She suggests some areas to be covered additionally. For instance, the details of the AI prior to AlphaGo, the confidence and pride of the professional Go players, and the shifting of perspective to the Go AI between and after the match as "If anything could be added, I would include information about the primitive level of top Go A.I.s before AlphaGo, and more about professional Go players' lives and pride, to provide more context for Lee Sedol's pre-match confidence, and Go players' changing perception of AlphaGo as the match advanced".^([93])(Lee, 2017).

Fan Hui, a professional Go player, and former player with AlphaGo said that "DeepMind had trained AlphaGo by showing it many strong amateur games of Go to develop its understanding of how a human plays before challenging it to play versions of itself thousands of times, a novel form of reinforcement learning which had given it the ability to rival an expert human. History had been made, and centuries of received learning overturned in the process. The program was free to learn the game for itself.^([94])

Technology and AI-related fields

James Vincent, a reporter from The Verge, comments that "It prods and pokes viewers with unsubtle emotional cues, like a reality TV show would. "Now, you should be nervous; now you should feel relieved". The AlphaGo footage slowly captures the moment when Lee Sedol acknowledges the true power of AlphaGo AI. In the first game, he had more experience than his human-programmed AI, so he thought it would be easy to beat the AI. However, the early game dynamics were not what he expected. After losing the first match, he became more nervous and lost confidence. Afterward, he reacted to attacks by saying that he just wanted to win the match, unintentionally displaying his anger, and acting in an unusual way. Also, he spends 12 minutes on one move, while AlphaGo only takes a minute and a half to respond. AlphaGo weighs each alternative equally and consistently. No reaction to Lee's fight. Instead, the game continues as if he was not there.

James also said that "suffice to say that humanity does land at least one blow on the machines, through Lee's so-called "divine move". "More likely, the forces of automation we'll face will be impersonal and incomprehensible. They'll come in the form of star ratings we can't object to, and algorithms we can't fully understand. Dealing with the problems of AI will take a perspective that looks beyond individual battles. AlphaGo is worth seeing because it raises these questions" ^([95])(Vincent, 2017)

Murray Shanahan, a professor of cognitive robotics at Imperial College London, critics that "Go is an extraordinary game but it represents what we can do with AI in all kinds of other spheres," says Murray Shanahan, professor of cognitive robotics at Imperial College London and senior research scientist at DeepMind, says. "In just the same way there are all kinds of realms of possibility within Go that have not been discovered, we could never have imagined the potential for discovering drugs and other materials."^([94])

Similar systems

Facebook has also been working on its own Go-playing system darkforest, also based on combining machine learning and Monte Carlo tree search.^([65][96]) Although a strong player against other computer Go programs, as of early 2016, it had not yet defeated a professional human player.^([97]) Darkforest has lost to CrazyStone and Zen and is estimated to be of similar strength to them.^([98])

DeepZenGo, a system developed with support from video-sharing website Dwango and the University of Tokyo, lost 2–1 in November 2016 to Go master Cho Chikun, who holds the record for the largest number of Go title wins in Japan.^([99][100])

A 2018 paper in Nature cited AlphaGo's approach as the basis for a new means of computing potential pharmaceutical drug molecules.^([101][102]) Systems consisting of Monte Carlo tree search guided by neural networks have since been explored for a wide array of applications.^([103])

Example game

AlphaGo Master (white) v. Tang Weixing (31 December 2016), AlphaGo won by resignation. White 36 was widely praised.

+--------------------------------------------------------------------------------------------------+
|   ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- |
+--------------------------------------------------------------------------------------------------+
| First 99 moves                                                                                   |
+--------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------+
|   ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   []   |
|   ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- |
+--------------------------------------------------------------------------------------------------+
| Moves 100–186 (149 at 131, 150 at 130)                                                           |
+--------------------------------------------------------------------------------------------------+

Impacts on Go

The documentary film AlphaGo^([9][89]) raised hopes that Lee Sedol and Fan Hui would have benefitted from their experience of playing AlphaGo, but as of May 2018^([update]), their ratings were little changed; Lee Sedol was ranked 11th in the world, and Fan Hui 545th.^([104]) On 19 November 2019, Lee announced his retirement from professional play, arguing that he could never be the top overall player of Go due to the increasing dominance of AI. Lee referred to them as being "an entity that cannot be defeated".^([105])

See also

- Albert Lindsey Zobrist, wrote first Go program in 1968
- Chinook (draughts player), draughts playing program
- Deep reinforcement learning, subfield of machine learning that is the basis of AlphaGo
- Glossary of artificial intelligence
- Go and mathematics
- KataGo, the leading open-source Go program
- Leela Zero, another open-source Go program
- Matchbox Educable Noughts and Crosses Engine
- Samuel's learning computer checkers (draughts)
- TD-Gammon, backgammon neural network
- Pluribus (poker bot)
- AlphaZero
- AlphaFold

References

1.  ↑ "Artificial intelligence: Google's AlphaGo beats Go master Lee Se-dol". BBC News. 12 March 2016. Archived from the original on 26 August 2016. Retrieved 17 March 2016.
2.  ↑ "DeepMind AlphaGO". DeepMind Artificial Intelligence AlphaGo. Archived from the original on 14 September 2019. Retrieved 16 September 2019.
3.  ↑ "AlphaGo | DeepMind". DeepMind. Archived from the original on 28 May 2017. Retrieved 28 May 2017.
4.  1 2 3 4 5 6 7 8 9 10 Silver, David; Huang, Aja; Maddison, Chris J.; Guez, Arthur; Sifre, Laurent; Driessche, George van den; Schrittwieser, Julian; Antonoglou, Ioannis; Panneershelvam, Veda; Lanctot, Marc; Dieleman, Sander; Grewe, Dominik; Nham, John; Kalchbrenner, Nal; Sutskever, Ilya; Lillicrap, Timothy; Leach, Madeleine; Kavukcuoglu, Koray; Graepel, Thore; Hassabis, Demis (28 January 2016). "Mastering the game of Go with deep neural networks and tree search". Nature. 529 (7587): 484–489. Bibcode:2016Natur.529..484S. doi:10.1038/nature16961. ISSN 0028-0836. PMID 26819042. S2CID 515925.[Closed access icon]
5.  1 2 3 4 5 "Research Blog: AlphaGo: Mastering the ancient game of Go with Machine Learning". Google Research Blog. 27 January 2016. Archived from the original on 30 January 2016. Retrieved 28 January 2016.
6.  1 2 3 4 "Google achieves AI 'breakthrough' by beating Go champion". BBC News. 27 January 2016. Archived from the original on 2 December 2021. Retrieved 20 July 2018.
7.  ↑ "Match 1 – Google DeepMind Challenge Match: Lee Sedol vs AlphaGo". YouTube. 8 March 2016. Archived from the original on 29 March 2017. Retrieved 9 March 2016.
8.  ↑ "Google's AlphaGo gets 'divine' Go ranking". The Straits Times. straitstimes.com. 15 March 2016. Archived from the original on 7 October 2016. Retrieved 9 December 2017.
9.  1 2 "AlphaGo Movie". AlphaGo Movie. Archived from the original on 3 January 2018. Retrieved 14 October 2017.
10. ↑ "From AI to protein folding: Our Breakthrough runners-up". Science. 22 December 2016. Archived from the original on 17 June 2022. Retrieved 29 December 2016.
11. 1 2 "中国围棋协会授予AlphaGo职业九段 并颁发证书" (in Chinese). Sohu.com. 27 May 2017. Archived from the original on 3 June 2017. Retrieved 9 December 2017.
12. 1 2 Metz, Cade (27 May 2017). "After Win in China, AlphaGo's Designers Explore New AI". Wired.
13. ↑ "AlphaZero Crushes Stockfish In New 1,000-Game Match". 17 April 2019. Archived from the original on 12 November 2020. Retrieved 22 April 2021.
14. ↑ Silver, David; Hubert, Thomas; Schrittwieser, Julian; Antonoglou, Ioannis; Lai, Matthew; Guez, Arthur; Lanctot, Marc; Sifre, Laurent; Kumaran, Dharshan; Graepel, Thore; Lillicrap, Timothy; Simonyan, Karen; Hassabis, Demis (7 December 2018). "A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play". Science. 362 (6419): 1140–1144. Bibcode:2018Sci...362.1140S. doi:10.1126/science.aar6404. PMID 30523106. S2CID 54457125.
15. ↑ Schraudolph, Nicol N.; Terrence, Peter Dayan; Sejnowski, J., Temporal Difference Learning of Position Evaluation in the Game of Go (PDF), archived (PDF) from the original on 28 March 2017, retrieved 31 January 2016
16. 1 2 "Computer scores big win against humans in ancient game of Go". CNN. 28 January 2016. Archived from the original on 31 January 2016. Retrieved 28 January 2016.
17. ↑ "Zen computer Go program beats Takemiya Masaki with just 4 stones!". Go Game Guru. Archived from the original on 1 February 2016. Retrieved 28 January 2016.
18. ↑ "「アマ六段の力。天才かも」囲碁棋士、コンピューターに敗れる 初の公式戦". MSN Sankei News. Archived from the original on 24 March 2013. Retrieved 27 March 2013.
19. 1 2 3 John Riberio (14 March 2016). "AlphaGo's unusual moves prove its AI prowess, experts say". PC World. Archived from the original on 17 July 2016. Retrieved 18 March 2016.
20. ↑ "Google AlphaGo AI clean sweeps European Go champion". ZDNet. 28 January 2016. Archived from the original on 29 January 2016. Retrieved 28 January 2016.
21. 1 2 Metz, Cade (27 January 2016). "In Major AI Breakthrough, Google System Secretly Beats Top Player at the Ancient Game of Go". WIRED. Retrieved 1 February 2016.
22. ↑ "Special Computer Go insert covering the AlphaGo v Fan Hui match" (PDF). British Go Journal. 2017. Archived (PDF) from the original on 2 February 2016. Retrieved 1 February 2016.
23. ↑ "Première défaite d'un professionnel du go contre une intelligence artificielle". Le Monde (in French). 27 January 2016. Archived from the original on 29 January 2016. Retrieved 28 January 2016.
24. ↑ "Google's AI AlphaGo to take on world No 1 Lee Sedol in live broadcast". The Guardian. 5 February 2016. Archived from the original on 14 August 2017. Retrieved 15 February 2016.
25. ↑ "Google DeepMind is going to take on the world's best Go player in a luxury 5-star hotel in South Korea". Business Insider. 22 February 2016. Archived from the original on 2 March 2016. Retrieved 23 February 2016.
26. ↑ Novet, Jordan (4 February 2016). "YouTube will livestream Google's AI playing Go superstar Lee Sedol in March". VentureBeat. Archived from the original on 9 February 2016. Retrieved 7 February 2016.
27. 1 2 3 Yoon Sung-won (14 March 2016). "Lee Se-dol shows AlphaGo beatable". The Korea Times. Archived from the original on 14 March 2016. Retrieved 15 March 2016.
28. ↑ "李世乭：即使Alpha Go得到升级也一样能赢". JoongAng Ilbo (in Chinese). 23 February 2016. Archived from the original on 4 March 2016. Retrieved 24 February 2016.
29. 1 2 "이세돌 vs 알파고, '구글 딥마인드 챌린지 매치' 기자회견 열려" (in Korean). Korea Baduk Association. 22 February 2016. Archived from the original on 3 March 2016. Retrieved 22 February 2016.
30. ↑ Demis Hassabis [@demishassabis] (11 March 2016). "We are using roughly same amount of compute power as in Fan Hui match: distributing search over further machines has diminishing returns" (Tweet). Retrieved 14 March 2016 – via Twitter.
31. ↑ "Showdown". The Economist. Archived from the original on 14 August 2017. Retrieved 19 November 2016.
32. ↑ Steven Borowiec (9 March 2016). "Google's AI machine v world champion of 'Go': everything you need to know". The Guardian. Archived from the original on 15 March 2016. Retrieved 15 March 2016.
33. 1 2 Rémi Coulom. "Rating List of 2016-01-01". Archived from the original on 18 March 2016. Retrieved 18 March 2016.
34. ↑ "Korean Go master proves human intuition still powerful in Go". The Korean Herald/ANN. 14 March 2016. Archived from the original on 12 April 2016. Retrieved 15 March 2016.
35. ↑ "Google's AI beats world Go champion in first of five matches – BBC News". BBC Online. Archived from the original on 10 March 2018. Retrieved 9 March 2016.
36. ↑ "Google AI wins second Go game against world champion – BBC News". BBC Online. Archived from the original on 10 March 2016. Retrieved 10 March 2016.
37. ↑ "Google DeepMind AI wins final Go match for 4–1 series win". Engadget. 15 March 2016. Archived from the original on 15 March 2016. Retrieved 15 March 2016.
38. ↑ "Human champion certain he'll beat AI at ancient Chinese game". Associated Press. 22 February 2016. Archived from the original on 24 January 2019. Retrieved 22 February 2016.
39. ↑ "In Two Moves, AlphaGo and Lee Sedol Redefined the Future". WIRED. Retrieved 12 November 2017.
40. ↑ "黄士杰：AlphaGo李世石人机大战第四局问题已解决date=8 July 2016" (in Chinese). Archived from the original on 10 October 2018. Retrieved 8 July 2016.
41. 1 2 Demis Hassabis (4 January 2017). "Demis Hassabis on Twitter: "Excited to share an update on #AlphaGo!"". Demis Hassabis's Twitter account. Archived from the original on 4 May 2019. Retrieved 4 January 2017.
42. 1 2 3 Elizabeth Gibney (4 January 2017). "Google reveals secret test of AI bot to beat top Go players". Nature. 541 (7636): 142. Bibcode:2017Natur.541..142G. doi:10.1038/nature.2017.21253. PMID 28079098.
43. 1 2 3 "Humans Mourn Loss After Google Is Unmasked as China's Go Master". Wall Street Journal. 5 January 2017. Archived from the original on 26 May 2019. Retrieved 6 January 2017.
44. ↑ "The world's best Go player says he still has "one last move" to defeat Google's AlphaGo AI". Quartz. 4 January 2017. Archived from the original on 19 November 2020. Retrieved 6 January 2017.
45. ↑ "横扫中日韩棋手斩获59胜的Master发话：我是阿尔法狗" (in Chinese). 澎湃新闻. 4 January 2017. Archived from the original on 30 September 2020. Retrieved 11 December 2017.
46. ↑ "Exploring the mysteries of Go with AlphaGo and China's top players". 10 April 2017. Archived from the original on 11 April 2017. Retrieved 10 April 2017.
47. ↑ "World No.1 Go player Ke Jie takes on upgraded AlphaGo in May". 10 April 2017. Archived from the original on 15 April 2017. Retrieved 27 May 2017.
48. ↑ "Ke Jie vs. AlphaGo: 8 things you must know". 27 May 2017. Archived from the original on 14 December 2017. Retrieved 27 May 2017.
49. ↑ Metz, Cade (23 May 2017). "Revamped AlphaGo Wins First Game Against Chinese Go Grandmaster". Wired.
50. ↑ Metz, Cade (25 May 2017). "Google's AlphaGo Continues Dominance With Second Win in China". Wired.
51. ↑ "Full length games for Go players to enjoy". Deepmind. Archived from the original on 5 August 2019. Retrieved 28 May 2017.
52. 1 2 3 4 5 Silver, David; Schrittwieser, Julian; Simonyan, Karen; Antonoglou, Ioannis; Huang, Aja; Guez, Arthur; Hubert, Thomas; Baker, Lucas; Lai, Matthew; Bolton, Adrian; Chen, Yutian; Lillicrap, Timothy; Fan, Hui; Sifre, Laurent; Driessche, George van den; Graepel, Thore; Hassabis, Demis (19 October 2017). "Mastering the game of Go without human knowledge" (PDF). Nature. 550 (7676): 354–359. Bibcode:2017Natur.550..354S. doi:10.1038/nature24270. ISSN 0028-0836. PMID 29052630. S2CID 205261034. Archived (PDF) from the original on 24 November 2020. Retrieved 29 August 2020.[Closed access icon]
53. 1 2 3 4 5 "AlphaGo Zero: Learning from scratch". DeepMind official website. 18 October 2017. Archived from the original on 19 October 2017. Retrieved 19 October 2017.
54. ↑ Silver, David; Hubert, Thomas; Schrittwieser, Julian; Antonoglou, Ioannis; Lai, Matthew; Guez, Arthur; Lanctot, Marc; Sifre, Laurent; Kumaran, Dharshan; Graepel, Thore; Lillicrap, Timothy; Simonyan, Karen; Hassabis, Demis (5 December 2017). "Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm". arXiv:1712.01815 [cs.AI].
55. ↑ "AlphaGo teaching tool". DeepMind. Archived from the original on 12 December 2017. Retrieved 11 December 2017.
56. 1 2 "AlphaGo教学工具上线 樊麾：使用Master版本" (in Chinese). Sina.com.cn. 11 December 2017. Archived from the original on 12 December 2017. Retrieved 11 December 2017.
57. ↑ McMillan, Robert (18 May 2016). "Google Isn't Playing Games With New Chip". The Wall Street Journal. Archived from the original on 29 June 2016. Retrieved 26 June 2016.
58. ↑ Jouppi, Norm (18 May 2016). "Google supercharges machine learning tasks with TPU custom chip". Google Cloud Platform Blog. Archived from the original on 18 May 2016. Retrieved 26 June 2016.
59. ↑ "AlphaGo官方解读让三子 对人类高手没这种优势" (in Chinese). Sina. 25 May 2017. Archived from the original on 16 April 2021. Retrieved 2 June 2017.
60. ↑ "各版alphago实力对比 master能让李世石版3子" (in Chinese). Sina. 24 May 2017. Archived from the original on 3 June 2017. Retrieved 2 June 2017.
61. ↑ "New version of AlphaGo self-trained and much more efficient". American Go Association. 24 May 2017. Archived from the original on 3 June 2017. Retrieved 1 June 2017.
62. ↑ "【柯洁战败解密】AlphaGo Master最新架构和算法，谷歌云与TPU拆解" (in Chinese). Sohu. 24 May 2017. Archived from the original on 17 September 2017. Retrieved 1 June 2017.
63. ↑ Silver, David; Hubert, Thomas; Schrittwieser, Julian; Antonoglou, Ioannis; Lai, Matthew; Guez, Arthur; Lanctot, Marc; Sifre, Laurent; Kumaran, Dharshan; Graepel, Thore; Lillicrap, Timothy; Simonyan, Karen; Hassabis, Demis (7 December 2018). "A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play". Science. 362 (6419): 1140–1144. Bibcode:2018Sci...362.1140S. doi:10.1126/science.aar6404. PMID 30523106. S2CID 54457125.
64. ↑ Cade Metz (13 March 2016). "Go Grandmaster Lee Sedol Grabs Consolation Win Against Google's AI". Wired News. Archived from the original on 17 November 2017. Retrieved 29 March 2016.
65. 1 2 Gibney, Elizabeth (27 January 2016). "Google AI algorithm masters ancient game of Go". Nature. 529 (7587): 445–6. Bibcode:2016Natur.529..445G. doi:10.1038/529445a. PMID 26819021.
66. ↑ Chouard, Tanguy (12 March 2016). "The Go Files: AI computer clinches victory against Go champion". Nature. doi:10.1038/nature.2016.19553. S2CID 155164502. Archived from the original on 18 June 2016. Retrieved 18 December 2016.
67. ↑ "韩国研究新版AlphaGo：穿越而来展示未来围棋" (in Chinese). Sina.com. 11 January 2017. Archived from the original on 24 April 2017. Retrieved 24 April 2017.
68. 1 2 3 4 5 6 7 8 Steven Borowiec; Tracey Lien (12 March 2016). "AlphaGo beats human Go champ in milestone for artificial intelligence". Los Angeles Times. Archived from the original on 13 May 2018. Retrieved 13 March 2016.
69. ↑ Connor, Steve (27 January 2016). "A computer has beaten a professional at the world's most complex board game". The Independent. Archived from the original on 28 January 2016. Retrieved 28 January 2016.
70. ↑ "Google's AI beats human champion at Go". CBC News. 27 January 2016. Archived from the original on 10 March 2016. Retrieved 28 January 2016.
71. ↑ Dave Gershgorn (12 March 2016). "GOOGLE'S ALPHAGO BEATS WORLD CHAMPION IN THIRD MATCH TO WIN ENTIRE SERIES". Popular Science. Archived from the original on 16 December 2016. Retrieved 13 March 2016.
72. 1 2 "Google DeepMind computer AlphaGo sweeps human champ in Go matches". CBC News. Associated Press. 12 March 2016. Archived from the original on 13 March 2016. Retrieved 13 March 2016.
73. ↑ Sofia Yan (12 March 2016). "A Google computer victorious over the world's 'Go' champion". CNN Money. Archived from the original on 8 August 2020. Retrieved 13 March 2016.
74. ↑ "AlphaGo: Google's artificial intelligence to take on world champion of ancient Chinese board game". Australian Broadcasting Corporation. 8 March 2016. Archived from the original on 15 June 2016. Retrieved 13 March 2016.
75. 1 2 Mariëtte Le Roux (12 March 2016). "Rise of the Machines: Keep an eye on AI, experts warn". Phys.org. Archived from the original on 13 March 2016. Retrieved 13 March 2016.
76. 1 2 3 Mariëtte Le Roux; Pascale Mollard (8 March 2016). "Game over? New AI challenge to human smarts (Update)". phys.org. Archived from the original on 14 March 2016. Retrieved 13 March 2016.
77. ↑ Tanya Lewis (11 March 2016). "An AI expert says Google's Go-playing program is missing 1 key feature of human intelligence". Business Insider. Archived from the original on 12 March 2016. Retrieved 13 March 2016.
78. ↑ Mozur, Paul (20 July 2017). "Beijing Wants A.I. to Be Made in China by 2030". The New York Times. Archived from the original on 11 April 2018. Retrieved 11 April 2018.
79. ↑ "Marvin Minsky Medal for Outstanding Achievements in AI". International Joint Conference on Artificial Intelligence. 19 October 2017. Archived from the original on 21 October 2017. Retrieved 21 October 2017.
80. ↑ CHOE SANG-HUN (16 March 2016). "Google's Computer Program Beats Lee Se-dol in Go Tournament". The New York Times. Archived from the original on 18 March 2016. Retrieved 18 March 2016. “More than 100 million people watched the AlphaGo-Lee matches, Mr. Hassabis said.”
81. ↑ John Ribeiro (12 March 2016). "Google's AlphaGo AI program strong but not perfect, says defeated South Korean Go player". PC World. Archived from the original on 13 March 2016. Retrieved 13 March 2016.
82. 1 2 Gibney, Elizabeth (2016). "Go players react to computer defeat". Nature. doi:10.1038/nature.2016.19255. S2CID 146868978. Archived from the original on 30 January 2016. Retrieved 29 January 2016.
83. ↑ Zastrow, Mark (15 March 2016). "How victory for Google's Go AI is stoking fear in South Korea". New Scientist. Archived from the original on 21 March 2016. Retrieved 18 March 2016.
84. ↑ JEE HEUN KAHNG; SE YOUNG LEE (15 March 2016). "Google artificial intelligence program beats S. Korean Go pro with 4–1 score". Reuters. Archived from the original on 28 July 2017. Retrieved 18 March 2016.
85. 1 2 Neil Connor (11 March 2016). "Google AlphaGo 'can't beat me' says China Go grandmaster". The Telegraph (UK). Archived from the original on 13 March 2016. Retrieved 13 March 2016.
86. ↑ "Chinese Go master Ke Jie says he could lose to AlphaGo : The DONG-A ILBO". Archived from the original on 15 March 2016. Retrieved 17 March 2016.
87. ↑ "...if today's performance was its true capability, then it doesn't deserve to play against me". M.hankooki.com. 14 March 2016. Archived from the original on 15 March 2016. Retrieved 5 June 2018.
88. ↑ CHOE SANG-HUN (15 March 2016). "In Seoul, Go Games Spark Interest (and Concern) About Artificial Intelligence". The New York Times. Archived from the original on 18 March 2016. Retrieved 18 March 2016.
89. 1 2 "ALPHAGO". Rotten Tomatoes. Retrieved 15 April 2023.
90. ↑ Rechtshaffen, Michael (26 October 2017). "Review: Ancient Chinese board game treated with NFL-like drama and intrigue in documentary 'AlphaGo'". www.latimes.com. Archived from the original on 15 April 2023. Retrieved 15 April 2023.
91. ↑ Defore, John (29 September 2017). "'AlphaGo': Film Review". The Hollywood Reporter. Archived from the original on 13 February 2023. Retrieved 15 April 2023.
92. ↑ Kohs, Greg (23 October 2018). "Five Questions for Filmmakers: AlphaGo". Science Media Awards & Summit in the Hub (SMASH). Archived from the original on 28 March 2023. Retrieved 15 April 2023.
93. ↑ Lee, Hajin (28 April 2017). "AlphaGo" Film Review: The Art of Capturing the Essence". hajinlee.medium.com. Archived from the original on 15 April 2023. Retrieved 15 April 2023.
94. 1 2 Williams, Rhiannon (8 October 2020). "Fan Hui: What I learned from losing to DeepMind's AlphaGo". inews.co.uk. Archived from the original on 28 March 2023. Retrieved 15 April 2023.
95. ↑ Vincent, James (12 October 2017). "How will we face being defeated by machines?". www.theverge.com. Archived from the original on 15 April 2023. Retrieved 15 April 2023.
96. ↑ Tian, Yuandong; Zhu, Yan (2015). "Better Computer Go Player with Neural Network and Long-term Prediction". arXiv:1511.06410v1 [cs.LG].
97. ↑ HAL 90210 (28 January 2016). "No Go: Facebook fails to spoil Google's big AI day". The Guardian. ISSN 0261-3077. Archived from the original on 15 March 2016. Retrieved 1 February 2016.{{cite news}}: CS1 maint: numeric names: authors list (link)
98. ↑ "Strachey Lecture – Dr Demis Hassabis". The New Livestream. Archived from the original on 16 March 2016. Retrieved 17 March 2016.
99. ↑ "Go master Cho wins best-of-three series against Japan-made AI". The Japan Times Online. 24 November 2016. Archived from the original on 14 August 2017. Retrieved 27 November 2016.
100. ↑ "Humans strike back: Korean Go master bests AI in board game bout". CNET. Archived from the original on 25 November 2016. Retrieved 27 November 2016.
101. ↑ "Go and make some drugs The Engineer". www.theengineer.co.uk. 3 April 2018. Archived from the original on 3 April 2018. Retrieved 3 April 2018.
102. ↑ Segler, Martwin H.S.; Preuss, Mike; Waller, Mark P. (29 March 2018). "Planning chemical syntheses with deep neural networks and symbolic AI". Nature. 555 (7698): 604–610. arXiv:1708.04202. Bibcode:2018Natur.555..604S. doi:10.1038/nature25978. hdl:1887/69740. PMID 29595767. S2CID 205264340. Archived from the original on 12 December 2021. Retrieved 12 December 2021.
103. ↑ Kemmerling, Marco; Lütticke, Daniel; Schmitt, Robert H. (1 January 2024). "Beyond games: a systematic review of neural Monte Carlo tree search applications". Applied Intelligence. 54 (1): 1020–1046. arXiv:2303.08060. doi:10.1007/s10489-023-05240-w. ISSN 1573-7497.
104. ↑ "Go Ratings". Go Ratings. Archived from the original on 15 August 2021. Retrieved 5 June 2018.
105. ↑ Vincent, James (27 November 2019). "Former Go champion beaten by DeepMind retires after declaring AI invincible". The Verge. Archived from the original on 7 April 2020. Retrieved 28 November 2019.

External links

- Official website
- AlphaGo wiki at Sensei's Library, including links to AlphaGo games
- AlphaGo page, with archive and games
- Estimated 2017 rating of Alpha Go
- AlphaGo - The Movie on YouTube
- [Wikimedia Commons logo] Media related to AlphaGo at Wikimedia Commons
- [] Quotations related to AlphaGo at Wikiquote

+-------------------------------------+--------------------------------------+
| - v                                                                        |
| - t                                                                        |
| - e                                                                        |
|                                                                            |
| Go                                                                         |
+-------------------------------------+--------------------------------------+
| Overview                            | - Handicaps                          |
|                                     | - Komi                               |
|                                     | - Rules                              |
+-------------------------------------+--------------------------------------+
| Equipment                           | - Bowls                              |
|                                     | - Goban                              |
|                                     |   - Katsura                          |
|                                     |   - Kaya                             |
|                                     | - Stones                             |
|                                     |   - Clamshell                        |
|                                     |   - Slate                            |
|                                     |   - Yunzi                            |
+-------------------------------------+--------------------------------------+
| Terms                               | - Aji                                |
|                                     | - Atari                              |
|                                     | - Board positions                    |
|                                     | - Dame                               |
|                                     | - Divine move                        |
|                                     | - Double hane                        |
|                                     | - Eyes                               |
|                                     | - Gote, sente and tenuki             |
|                                     | - Hane                               |
|                                     | - Hayago                             |
|                                     | - Jigo                               |
|                                     | - Joseki                             |
|                                     | - Kakari                             |
|                                     | - Keima                              |
|                                     | - Kiai                               |
|                                     | - Kikashi                            |
|                                     | - Ko                                 |
|                                     | - Komi                               |
|                                     | - Korigatachi                        |
|                                     | - Kosumi                             |
|                                     | - Ladder                             |
|                                     | - Liberty                            |
|                                     | - Miai                               |
|                                     | - Monkey jump                        |
|                                     | - Moyo                               |
|                                     | - Myoushu                            |
|                                     | - Nakade                             |
|                                     | - Nerai                              |
|                                     | - Myoushu                            |
|                                     | - Peep                               |
|                                     | - Pincer                             |
|                                     | - Probe                              |
|                                     | - Sabaki                             |
|                                     | - Seki                               |
|                                     | - Sente                              |
|                                     | - Shape                              |
|                                     | - Shoulder hit                       |
|                                     | - Tesuji                             |
|                                     | - Thickness                          |
|                                     | - Yose                               |
+-------------------------------------+--------------------------------------+
| Strategy and tactics                | - Capturing race                     |
|                                     | - Fuseki                             |
|                                     |   - Chinese                          |
|                                     |   - Kobayashi                        |
|                                     |   - Shinfuseki                       |
|                                     |   - Shusaku                          |
|                                     | - Jōseki                             |
|                                     |   - Nadare                           |
|                                     |   - Taisha                           |
|                                     | - Ko fight                           |
|                                     | - Ladder                             |
|                                     | - Life and death                     |
|                                     | - Mirror Go                          |
|                                     | - Opening theory                     |
|                                     | - Proverbs                           |
|                                     | - Shape                              |
|                                     |   - Empty triangle                   |
|                                     |   - Ponnuki                          |
|                                     | - Tenuki                             |
|                                     | - Tsumego                            |
+-------------------------------------+--------------------------------------+
| History                             | - Classic of Arts                    |
|                                     | - Dunhuang Go Manual                 |
|                                     | - Emperor Yao                        |
|                                     | - Four Go houses                     |
|                                     | - Four arts                          |
|                                     | - Hoensha                            |
|                                     | - 9 Pin Zhi                          |
|                                     | - Oskar Korschelt                    |
|                                     | - Oshirogo                           |
|                                     | - Players                            |
|                                     |   - European players                 |
|                                     |   - Female players                   |
|                                     |   - Nihon Ki-in Hall of Fame         |
|                                     | - Professional handicaps             |
+-------------------------------------+--------------------------------------+
| Competition                         | - Go professional                    |
|                                     | - Ranks and ratings                  |
|                                     |   - Dan                              |
|                                     |   - Kyū                              |
|                                     | - Honorary titles                    |
|                                     | - Jubango                            |
|                                     | - Tournaments                        |
|                                     | - World champions                    |
+-------------------------------------+--------------------------------------+
| Games and matches                   | - AlphaGo vs. Fan Hui                |
|                                     | - AlphaGo vs. Ke Jie                 |
|                                     | - AlphaGo vs. Lee Sedol              |
|                                     | - Atomic bomb game                   |
|                                     | - Blood-vomiting game                |
|                                     | - Ear-reddening game                 |
|                                     | - The Game of the Century            |
|                                     | - Kamakura jubango                   |
|                                     | - Lee's broken ladder game           |
+-------------------------------------+--------------------------------------+
| Art and media                       | - AlphaGo                            |
|                                     | - The Divine Move                    |
|                                     | - The Girl Who Played Go             |
|                                     | - The Go Master                      |
|                                     | - The Go Player                      |
|                                     | - Go World                           |
|                                     | - Hikaru no Go                       |
|                                     | - Igo Hatsuyōron                     |
|                                     | - Long Ode to Watching Weiqi         |
|                                     | - The MANIAC                         |
|                                     | - The Master of Go                   |
|                                     | - Ranka                              |
|                                     | - Sensei's Library                   |
|                                     | - Shibumi                            |
|                                     | - The Surrounding Game               |
|                                     | - The Weiqi Devil                    |
+-------------------------------------+--------------------------------------+
| Computers                           | - Computer Go UEC Cup                |
|                                     | - Engines                            |
|                                     |   - AlphaGo                          |
|                                     |   - AlphaGo Master                   |
|                                     |   - AlphaGo Zero                     |
|                                     |   - AlphaZero                        |
|                                     |   - Crazy Stone                      |
|                                     |   - Darkforest                       |
|                                     |   - Fine Art                         |
|                                     |   - GNU Go                           |
|                                     |   - KataGo                           |
|                                     |   - Leela                            |
|                                     |   - Leela Zero                       |
|                                     |   - Zen                              |
|                                     | - Future of Go Summit                |
|                                     | - Monte Carlo tree search            |
|                                     | - Smart Game Format                  |
|                                     | - Servers                            |
|                                     |   - KGS Go Server                    |
|                                     |   - Pandanet                         |
|                                     |   - Tygem                            |
+-------------------------------------+--------------------------------------+
| Organizations                       | - American Go Association            |
|                                     | - Australian Go Association          |
|                                     | - British Go Association             |
|                                     | - China                              |
|                                     |   - China Qiyuan                     |
|                                     |   - Chinese Weiqi Association        |
|                                     |   - Hong Kong Go Association         |
|                                     | - European Go Federation             |
|                                     | - French Federation of Go            |
|                                     | - International Go Federation        |
|                                     | - Irish Go Association               |
|                                     | - Japan                              |
|                                     |   - All Japan Student Go Federation  |
|                                     |   - Kansai Ki-in                     |
|                                     |   - Nihon Ki-in                      |
|                                     | - Korea                              |
|                                     |   - Korea Baduk Association          |
|                                     |   - Myongji University               |
|                                     | - Mind Sports Organisation           |
|                                     | - New Zealand Go Society             |
|                                     | - Singapore Weiqi Association        |
|                                     | - Taiwan Chi Yuan Culture Foundation |
+-------------------------------------+--------------------------------------+
| Other                               | - Benson's algorithm                 |
|                                     | - Game record (kifu)                 |
|                                     | - Go and mathematics                 |
|                                     | - Variants                           |
|                                     |   - Batoo                            |
|                                     |   - Capture go                       |
|                                     |   - Sygo                             |
+-------------------------------------+--------------------------------------+
| - [] Go portal                                                             |
| - Category                                                                 |
+----------------------------------------------------------------------------+

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
