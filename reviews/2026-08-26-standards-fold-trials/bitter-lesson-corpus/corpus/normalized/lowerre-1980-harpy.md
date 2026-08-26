INTRODUCTION

Harpy is one of the systems developed as part of the five year ARPA speech understanding research effort. A study group headed by Alien Newell proposed a set of specific performance goals in 1971 to be achieved within a five year period (Newell, et al., 1971). Figure 15-1 presents the original stated goals and the performance of the Harpy system. It is interesting to note that Harpy not only met all the specifications but exceeded several of the stated objectives. In particular, the system ran an order of magnitude faster with only about half the error rate, in a noisy environment using a poor frequencyresponse close speaking microphone. A comprehensive review of the recent speech recognition research including the ARPA speech program is given in Reddy (1976), Klatt (1977) t and Lea (this volume). Here, we will briefly mention some of the prior research which directly contributed to the success of the Harpy System. The parametric representation and the distance metric used in the Harpy system are based on LPC coefficients (Atal, 1971; Itakura, 1968; and Markel, 1972) using minimum distance residual metric (Itakura, 1975). The segmentation and labeling are extensions of techniques used in Hearsay II (Erman, this volume), Hearsay I (Reddy, et al., 1973) , and earlier work of our group (Reddy, 1967). Other significant early work in this area is by Tappert et al. (1970) using the transeme approach. The juncture rules were all empirically derived but were influenced by the work of Oshika, et al., (1975) and Cohen & Mercer, (1975). The integrated network representation of knowledge is based on the Dragon system developed by Jim Baker at Carnegie-Mellon University. The best-few beam search technique is an extension of the best-first technique used in the Hearsay I system. Of all these, the single most important intellectual legacy upon which Harpy is based is the representation and delayed-decision techniques first used effectively in the Dragon system (Baker, 1975). It is also important to note the intellectual ferment created

-2-

Targets (from 1971)

HARPY Performance (1976)

Accept connected speech
