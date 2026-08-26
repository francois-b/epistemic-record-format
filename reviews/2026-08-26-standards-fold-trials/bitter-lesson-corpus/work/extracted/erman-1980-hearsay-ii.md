HEARSAY-II / 349

The Hearsay-II Speech-Understanding System: Integrating
Knowledge to Resolve Uncertainty
LEE D. ERMAN
USC/Information Sciences Institute, Marina del Rey, California 90291

FREDERICK HAYES-ROTH
The Rand Corporation, Santa Monica, California 90406

VICTOR R. LESSER
University of Massachusetts, Amherst, Massachusetts 01003

D. RAJ REDDY
Carnegie-Mellon University, Pittsburgh, Pennsylvania 15213
The Hearsay-H system, developed during the DARPA-sponsored five-year speechunderstanding research program, represents both a specific solution to the speechunderstanding problem and a general framework for coordinating independent processes
to achieve cooperative problem-solving behavior. As a computational problem, speech
understanding reflects a large number of intrinsically interesting issues. Spoken sounds
are achieved by a long chain of successive transformations, from intentions, through
semantic and syntactic structuring, to the eventually resulting audible acoustic waves. As
a consequence, interpreting speech means effectively inverting these transformations to
recover the speaker's intention from the sound. At each step in the interpretive process,
ambiguity and uncertainty arise.
The Hearsay-II problem-solving framework reconstructs an intention from
hypothetical interpretations formulated at various levels of abstraction. In addition, it
allocates limited processing resources first to the most promising incremental actions. The
final configuration of the Hearsay-II system comprises problem-solving components to
generate and evaluate speech hypotheses, and a focus-of-control mechanism to identify
potential actions of greatest value. Many of these specific procedures reveal novel
approaches to speech problems. Most important, the system successfully integrates and
coordinates all of these independent activities to resolve uncertainty and control
combinatorics. Several adaptations of the Hearsay-II framework have already been
undertaken in other problem domains, and it is anticipated that this trend will continue;
many future systems necessarily will integrate diverse sources of knowledge to solve
complex problems cooperatively.
Discussed in this paper are the characteristics of the speech problem in particular, the
special kinds of problem-solving uncertainty in that domain, the structure of the HearsayII system developed to cope with that uncertainty, and the relationship between Hearsay.
U's structure and those of other speech-understanding systems. The paper is intended for
the general computer science audience and presupposes no speech or artificial intelligence
background.
Keywords and Phrases: artificial intelligence, blackboard, focus of control, knowledgebased system, multiple diverse knowledge sources, multiple levels of abstraction, problemsolving system, speech-understanding systems, uncertainty resolving

350 / EXPERT SYSTEMS AND Al APPLICATIONS

CONTENTS

INTRODUCTION
Dimensions of the Problem: Uncertainty
and Hypothetical Interpretations
Hearsay-11 P,ohlem-Solving Model
Hearsay.II Architecture
I. AN EXAMPLE OF RECOGNITION
1.1. Introduction to the Example
1.2. The Example
2. COMPARISON WITH OTHER SPEECHUNDERSTANDING SYSTEMS
2.1. BBN's HWIM System
2.2. SRI's System
2.3. CMU's HARPY System
3. SYSTEM PERFORMANCE AND ANALYSIS
3.1. Overall Performance of Hearsay-I1
3.2. Opportunistic Scheduling
3.3. Use of Approximate Knowledge
3.4. Adaptability of the Opportunistic Strategy
3.5. Performance Comparisons
4. CONCLUSIONS
4.1. Problem-Solving Systems
4.2. Specific Advantages of Hearsay-II as a ProblemSolving System
4.3. Disadvantages of the Hearsay-I1 Approach
4.4. Other Applications of the Hearsay-I1 Framework
APPENDIX. SYSTEM DEVELOPMENT
ACKNOWLEDGMENTS
REFERENCES

INTRODUCTION
The Hearsay-H speech-understanding system (SUS) developed at Carnegie-Mellon
University recognizes connected speech in
a 1000-word vocabulary with correct interpretations for 90 percent of test sentences.
Its basic methodology involves the application of symbolic reasoning as an aid to
signal processing. A marriage of general
artificial intelligence techniques with specific acoustic and linguistic knowledge was
needed to accomplish satisfactory speechThis research was supported chiefly by Defense Advanced Research Projects Agency contract F44620-73C-0074 to Carnegie-Mellon University. In addition,
support for the preparation of this paper was provided
by USC/ISI, Rand, and the University of Massachusetts. We gratefully acknowledge their support. Views
and conclusions contained in this document are those
of the authors and should not be interpreted as representing the official opinion or policy of DARPA,the
U.S. government, or any other person or agency connected with them.

understanding performance. Because the
various techniques and heuristics employed
were embedded within a general problemsolving framework, the Hearsay-II system
embodies several design characteristics
that are adaptable to other domains as well.
Its structure has been applied to such tasks
as multisensor interpretation (N1178], protein-crystallographic analysis [ENGE77],
image understanding [HANs76], a model of
human reading [Rum E76], and dialogue
comprehension [MANN79]. This paper discusses the characteristics of the speech
problem in particular, the special kinds of
problem-solving uncertainty in that domain, the structure of the Hearsay-H system developed to cope with that uncertainty, and the relationship between Hearsay-I's structure and the structures of
other SUSs.
Uncertainty arises in a problem-solving
system if the system's knowledge is inadequate to produce a solution directly. The
fundamental method for handling uncertainty is to create a space of candidate
solutions and search that space for a solution."Almost all the basic methods used by
intelligent systems can be seen as some
variation of search, responsive to the particular knowledge available" [NEwE77, p.
13]. In a difficult problem, i.e., one with a
large search space, a problem solver can be
effective only if it can search efficiently. To
do so, it must apply knowledge to guide the
search so that relatively few points in the
space need be examined before a solution is
found. A key way of accomplishing this is
by augmenting the space of candidate solutions with candidatepartia/solutions and
then constructing a complete solution by
extending and combining partial candidates. A candidate partial solution represents all complete candidates that contain
it. By considering partial solution candidates, we can often eliminate whole subspaces from further consideration and simultaneously focus the search on more
promising subspaces.
To solve a problem as difficult as speech
understanding, a problem solver requires
several kinds of capabilities in order to
search effectively: It must collect and analyze data, set goals to guide the inferential
search processes, produce and retain appro-

HEARSAY-II / 351

priate inferences, and decide when to stop
working for a possibly better solution.
Years ago, when AI problem solvers first
emerged, they attempted to provide these
capabilities through quite general domain.
independent methods, the so-called weak
methods [NEwE69]. A prime example of
such a problem solver is GPS [ERNs69].
More recently, several major problem-solving accomplishments, such as Dendral
[FE1G71] and Mycin [SH0R76], have reflected a different philosophy: Powerful
problem solvers depend on extensive
amounts of knowledge about both the problem domain and the problem-solving strategies effective in that domain [FEIG77].
Much of what we view as expertise consists
of these two types of knowledge; without
capturing and implementing this knowledge, we could not create effective computer problem solvers. Because knowledge
plays a crucial role in these kinds of tasks,
many people call the corresponding problem solvers knowledge-based systems
[BARN77]. The design of Hearsay-II is responsive to both concerns. While formulated as a general system-building framework that would structure and control
problem-solving behavior involving multiple, diverse, and error-full sources of knowledge, the current Hearsay-II system consists of a particular collection of programs
embedding speech knowledge that are capable of solving the understanding problem.'
The difficulty of the speech-understanding problem, and hence the need for powerful problem-solving methods, derives
from two inherent sources of uncertainty or
error. The first includes ordinary variability
and noise in the speech waveform, and the
second includes the ambiguous and inaccurate judgments arising from an application of incomplete and imprecise theories
of speech. Because we cannot resolve these
uncertainties directly, we structure the
speech-understanding problem as a space
'The problem of speech understanding has been actively pursued recently [REnn75, REDD76, CMI177,
BERN76, Wsut78, W00n76, KLAT77.
Lits801. With the exception of HARPY [LowEROJ,
however, none of the other efforts has been presented
as a structure for problem solving in other domains.

in which our problem solver searches for a
solution. The space is the set of(partial and
complete) interpretations of the input
acoustic signal, i.e., the (partial and complete) mappings from the signal to the possible messages. The goal of our problemsolving system is to find a complete interpretation (i.e., a message and mapping)
which maximizes some evaluation function
based on knowledge about such things as
acoustic-phonetics, vocabulary, grammar,
semantics, and discourse. This resolution of
the combined sources of uncertainty requires the generation, evaluation, and integration of numerous partial interpretations. The need to consider many alternative interpretations without spawning an
explosive combinatorial search thus becomes a principal design objective. Each of
these issues is discussed in more detail in
the following section.
Dimensions of the Problem: Uncertainty
and Hypothetical Interpretations

The first source of difficulty in the speech
problem arises from the speaking process
itself. In the translation from intention to
sound, a speaker transforms concepts into
speech through processes that introduce
variability and noise (see Figure 1). If, for

Speech
Understanding
System

FIGURE 1. Some of the mechanisms that affect the
message: psychology of the speaker,semantics, rules
of discourse, syntax, lexicon, prosodic system, phonemic system,speaker's articulatory apparatus, ambient environmental noise, and microphone and system.[After NEwE75.]

example, we consider the semantic, syntactic, lexical, and phonemic stages, the types
of variance introduced from one level to the
next would correspond to errors or peculiarities of conceptualization, grammar,
word choice, and articulation. In addition

352 / EXPERT SYSTEMS AND Al APPLICATIONS

to these sources of variability, speech is
often affected by pauses, extraneous
sounds, or unnecessary phrase repetitions.
The effect of these factors upon the physical sound signal is to distort it significantly
from the ideal message, that is, from the
message that would be produced if the production mechanisms did not introduce variability and noise. Accordingly, we speak of
the disparity between the ideal and actual
signals as error, and of the variety offactors
that contribute to such distortion as
sources of error. Thus the first source of
error is inherent in the speaker and his
environment.
The second source of error in the understanding process is intrinsic to the listener.
Just as the speaker must transform his
intention through successive intermediate
levels of representation, so we presume the
listener must accomplish the inverse of
those transformations; from the physical
signal the listener must detect acousticphonetic elements, syllables, words, and
syntactic and conceptual structures corresponding to the speaker's intentions. At
each step in this reconstruction the listener
may introduce new errors corresponding to
incorrect perceptual or interpretive judgments.' Because a machine speech-understanding system must also develop interpretations of what was spoken and what
was intended, it is likely to commit similar
mistakes in judgment. These judgmental
errors can be viewed as the result of applying inadequate or inaccurate theoretical
models to the speech-analysis task. If the
first source of error is deviation between
ideal and spoken messages due to inexact
production, the second source of error is
deviation between spoken and interpreted
messages due to imprecise rules of comprehension.
To comprehend an utterance in the context of such errors, a speech-understanding
system must formulate and evaluate numerous candidate interpretations of speech
fragments. Understanding a message requires us to isolate and recognize its indi-

Though the levels of representation appear to be
linearly ordered, the encoding and decoding processes
do not necessarily operate sequentially through this
ordering.

vidual words and parse their syntactic and
conceptual relationships. Each intermediate state of this prccess can be vicwed as
either the generation or evaluation of symbolic interpretations for portions of the spoken utterance. We use the term hypothesis
to refer to a partial interpretation actually
constructed. During the process of speech
interpretation, hypotheses may vary from
highly confident identification of particular
words to great confusion concerning particular portions of the utterance. Between
these two extremes, the listener may entertain simultaneously several competing hypotheses for what was said. Competing alternatives might occur at any of several
levels of abstraction. For example, at the
word level the listener may struggle to distinguish whether "till" or "tell" was spoken
in one portion of the utterance while simultaneously attempting to differentiate
the words "brings" and "rings" in another
interval. These uncertainties derive from
comparable uncertainties at lower levels of
interpretation, such as syllabic and acoustic, where multiple competing hypotheses
can also exist simultaneously. Similarly, uncertainty among word hypotheses at the
lexical level engenders uncertainty at
higher levels of interpretation. Thus the
previously discussed inability to distinguish
between alternative words may be the underlying cause of an inability to distinguish
between the four hypothetical phrase interpretations:
till Bob rings
tell Bob rings
till Bob brings
tell Bob brings
Just as this example suggests, higher
level interpretations incorporate lower level
ones. A phrase-level hypothesis consists of
a selection of word hypotheses from each
interval of time spanned by the higher level
hypothesis. Only one lower level hypothesis
in any time interval can be incorporated
into the higher level interpretation. Thus a
phrase consists of a sequence of words, a
word consists of a sequence of syllables, a
syllable consists of a sequence of acousticphonetic segments, and so on. An overall
interpretation of an entire utterance would
consist of a syntactic or semantic analysis
that recursively incorporated one hypoth-

HEARSAY-II / 353

esis from each level of interpretation for by eliminating one particular hypothesis,
we may logically exclude others that are in
each temporal interval of the utterance.
A fundamental assumption underlying temporally adjacent regions and that dethe understanding problem is that a correct pend directly on that hypothesis. For exinterpretation of an utterance should min- ample, if we have ruled out all possible
imize the difference between those proper- adjectives and nouns in a particular locaties of the speech that the hypothetical tion, we can also rule out adjectives in the
interpretation would predict and those that preceding interval. Conversely, if we can
are observed. This gives rise to the notion identify a particular word as an adjective,
of the consistency between an interpreta- we can increase our belief that the followtion and its supporting data. Thus certain ing word will be an adjective or noun. In
parameter values derived from an acoustic general, each individual hypothesis is
waveform are more or less consistent with strengthened by its apparent combinability
various phonetic classifications, particular with others. Thus we say uncertainty is
sequences of phones are more or less con- reduced by detecting mutually supporting
sistent with various monosyllabic categori- hypotheses that are consistent with the
zations, and various syllable sequences are acoustic data. Equivalently, the credibility
more or less consistent with particular lex- of hypotheses increases as a function of
ical and phrase interpretations. The con- their involvement in such mutually supcept of consistency between two adjacent portive clusters.
This technique for reducing uncertainty
levels of interpretation can be generalized
to permit consideration of the consistency leads to the following incremental problembetween hypotheses at any two levels and, solving method: The goal of the problem
in particular, the consistency between an solver is to construct the most credible
overall interpretation of the utterance and overall interpretation. The fundamental
its supporting hypotheses at the lowest, operations in the construction are hypothacoustic-parametric level. A central as- esis generation, hypothesis combination,
sumption is that the greater the consistency and hypothesis evaluation. At each step in
between the overall interpretation and the the construction, sources of knowledge use
acoustic data, the more likely the interpre- these operations to build larger partial interpretations, adding their constraints to
tation is to be correct.
We refer to the likelihood that some hy- the interpretation. The accrual of conpothesis is correct as its credibility. As the straints reduces the uncertainty inherent in
preceding suggests, the credibility of each the data and in the knowledge sources
hypothesis is a measure of consistency be- themselves.
Three requirements must be met for such
tween the data generating the hypothesis
.
and the expectations it engenders. A credi- a problem solver to be effective:
bility calculation involves a judgment about
the knowledge used in creating the hypoth- (1) At least one possible sequence of
knowledge-based operations must lead
esis and therefore is itself subject to uncertainty.
to a correct overall interpretation.
To assess the credibility of a hypothesis, (2) The evaluation procedure should assess
the correct overall interpretation as
we need basically to evaluate two things:
maximally credible among all overall
all plausible alternatives to this hypothesis
interpretations generated.
and the degree of support each receives
from data. Consider, for example, the eval- (3) The cost of problem solving must satisfy some externally specified limit.
uation of word hypotheses. Initially, nearly
Usually this limit restricts the time or
all words in the language are plausible canspace available for computing. As a
didates for occurring within any time interconsequence, it leads to restrictions on
val. As a consequence, our uncertainty at
the number of alternative partial interthe outset, as approximated by the number
pretations that can be considered. Alof equally plausible alternatives, is maxiternative partial solutions must be conmal. Over time we accrue evidence to elimsidered in order to ensure that a correct
inate some of these alternatives. Moreover,

354 / EXPERT SYSTEMS AND Al APPLICATIONS

The key functions of generating,combining,
and evaluating hypothetical interpretations
are performed by diverse and independent
programs called knowledge sources (KSs).
The necessity for diverse KSs derives from
the diversity of transformations used by the
speaker in creating the acoustic signal and
the corresponding inverse transformations
needed by the listener for interpreting it.
Each KS can be schematized as a condition-action pair. The condition component
prescribes the situations in which the KS
may contribute to the problem-solving activity, and the action component specifies
what that contribution is and how to integrate it into the current situation.' Accord-

ing to the original conception of the diverse
stages and processes involved in speech understanding, KSs have been developed to
perform a variety of functions. These include extracting acoustic parameters, classifying acoustic segments into phonetic
classes, recognizing words, parsing phrases,
and generating and evaluating predictions
for undetected words or syllables. Figure 2
presents a schematic view of the KSs in the
September 1976 configuration of the Hearsay-II speech-understanding system. Figure
3 gives a brief functional description of
these KSs.
Because each KS is an independent condition-action module, KSs communicate
through a global database called the blackboard. The blackboard records the hypotheses generated by KSs. Any KS can
generate a hypothesis (record it on the
blackboard) or modify an existing one.
These actions in turn may produce structures that satisfy the applicability conditions of other KSs. In this framework the
blackboard serves in two roles: It represents
intermediate states of problem-solving activity, and it communicates messages (hypotheses) from one KS that activate other
KSs.
The blackboard is subdivided into a set
of information levels corresponding to the
intermediate representation levels of the
decoding processes (phrase, word, syllable,
etc.). Each hypothesis resides on the blackboard at one of the levels and bears a defining label chosen from a set appropriate to
that level (e.g., the word FLYING,the syllable ING,or the phone NG). The hypothesis contains additional information, including its time coordinates within the spoken utterance and a credibility rating. The
sequence of levels on the blackboard forms
a loose hierarchical structure: hypotheses
at each level aggregate or abstract elements
at the adjacent lower level. The possible
hypotheses at a level form a search space
for KSs operating at that level. A partial

The condition and action components of a KS are
realized as arbitrary programs. To minimize reevaluating the condition programs continuously,each condition program declares to the system the primitive
kinds of situations in which it is interested. The condition program is triggered only when there occur

changes that create such situations (and is then given
pointers to all of them). This changes a polling action
into an interrupt-driven one and is more efficient,
especially for a large number of KSs. When executed,
the condition program can search among the set of
existing hypothetical interpretations for arbitrarily
complex configurations of interest to its KS.

one is included. The greater the uncertainty in the knowledge used to generate and evaluate hypotheses, the
greater the number of alternatives that
must be considered, leading to a possible combinatorial explosion.
As we have seen, the speech-understanding problem is characterized by the need
for highly diverse kinds of knowledge for its
solution and by large amounts of uncertainty and variability in input data and
knowledge. The diversity of knowledge
leads to a search space of multilevel partial
solutions. The uncertainty and variability
mean that the operators used for searching
the space are themselves error-prone;
therefore many competing alternative hypotheses must be generated. To avoid a
combinatorial explosion, a powerful control
scheme is needed to exploit selectively the
most promising combinations of alternatives. As systems tackle more such difficult
real-world problems, such multilevel representations and powerful control schemes
will become increasingly important
[HAYE78a]. The next section discusses how
the Hearsay-H system copes with these representation and control problems.
Hearsay-II Problem-Solving Model

HEARSAY-II / 355

KNOWLEDGE SOURCES

LEVELS
DATA BASE
INTERFACE

PHRASE

WORD-SEOUENCE

4

SEMANT

8
()PARSE

PREDICT
cr■---.Nt

STOP •
cr.—....N

CONGA
WORD-SEO-CTL
•
CT --".•

WORD-SEO

WORD-CTL
WORD

SYLLABLE

SEGMENT

(
)MOW

VERIFY

01.-"'N

)
POM

)
SEG

•

RPOL

•

•

PARAMETER
a

FIGURE 2. The levels and knowledge sources of September 1976. KSs are indicated by vertical
arcs with the circled ends indicating the input level and the pointed ends indicating output
level.

FIGURE 3. Functional description of the speech-understanding KSs.
Signal Acquisition, Parameter Extraction, Segmentation, and Labeling:
• SEG: Digitizes the signal, measures parameters, and produces a labeled segmentation.
Word Spotting:
• POM: Creates syllable-class hypotheses from segments.
• MOW: Creates word hypotheses from syllable classes.
• WORD-CTL: Controls the number of word hypotheses that MOW creates.
Phrase-Aland Generation:
• WORD-SEQ: Creates word-sequence hypotheses that represent potential phrases from word hypotheses and
weak grammatical knowledge.
• WORD-SEQ-CTL: Controls the number of hypotheses that WORD-SEQ creates.
• PARSE: Attempts to parse a word sequence and, if successful, creates a phrase hypothesis from it.
Phrase Extending:
• PREDICT: Predicts all possible words that might syntactically precede or follow a given phrase.
• VERIFY: Rates the consistency between segment hypotheses and a contiguous word-phrase pair.
• CONCAT: Creates a phrase hypothesis from a verified contiguous word-phrase pair.
Rating, Halting, and Interpretation:
• RPOL: Rates the credibility of each new or modified hypothesis, using information placed on the hypothesis
by other KSs.
• STOP: Decides to halt processing (detects a complete sentence with a sufficiently high rating, or notes the
system has exhausted its available resources) and selects the best phrase hypothesis or set of complementary
phrase hypotheses as the output.
• SEMANT:Generates an unambiguous interpretation for the information-retrieval system which the user has
queried.

356 / EXPERT SYSTEMS AND Al APPLICATIONS

interpretation at one level can constrain the
search at another level.
Within this framework we consider two
general types of problem-solving behaviors.
The first type, associated with means-ends
analysis and problem-reduction strategies
[ERNs69, Nms71, SacE74], attempts to
reach a goal by dividing it into a set of
simpler subgoals and reducing these recursively until only primitive or immediately
solvable subgoals remain. Such a strategy
is called top-down or analysis-by-synthesis.
In speech understanding, where the goal is
to find the most credible high-level interpretation of the utterance, a top-down approach would reduce recursively the general sentential concept goal into alternative
sentence forms, each sentence form into
specific alternative word sequences,specific
words into alternative phone sequences,
and so forth, until the one alternative overall interpretation most consistent with the
observed acoustic parameters is identified.
The second, or bottom-up, method attempts to synthesize interpretations directly from characteristics of the data provided. One type of bottom-up method
would employ procedures to classify acoustic segments within phonetic categories by
comparing their observed parameters with
the ideal parameter values of each phonetic
category. Other bottom-up procedures
might generate syllable or word hypotheses
directly from sequences of phone hypotheses, or might combine temporally adjacent word hypotheses into syntactic or
conceptual units. For a hypothesis generated in either the top-down or bottom-up
mode, we would like to represent explicitly
its relationship to the preexisting hypotheses that suggested it. Links are constructed between hypotheses for this purpose.
Both types of problem-solving behaviors
can be accommodated simultaneously by
the condition-action schema of a HearsayII KS. Top-down behaviors represent the
reduction of the higher level goal as the
condition to be satisfied and the generation
of appropriate subgoals as the associated
action. Bottom-up behaviors employ the
condition component to represent the lower
level hypothesis configurations justifying
higher level interpretations,and employ the

action component to represent and generate such hypotheses. In both cases the condition component performs a test to determine if there exists an appropriate configuration of hypotheses that would justify the
generation of additional hypotheses prescribed by the corresponding action component. Whenever such conditions are satisfied, the action component of the KS is
invoked to perform the appropriate hypothesis generation or modification operations. For example, the action of the POM
KS (see Figures 2 and 3) is to create hypotheses at the syllable level. The condition
for invoking the MOW KS is the creation
of a syllable hypothesis. Thus the action of
POM triggers MOW. The invocation condition of RPOL,the rating KS,is the creation or modification of a hypothesis at any
level; thus POM's actions also trigger
RPOL. In short, control of KS activation is
determined by the blackboard actions of
other KSs, rather than explicit calls from
other KSs or some central sequencing
mechanism. This data-directed control regime permits a more flexible scheduling of
KS actions in response to changing conditions on the blackboard. We refer to such
an ability of a system to exploit its best
data and most promising methods as opportunistic problem solving [N1178,
HavE79a].
While it is true that each condition-action knowledge source is logically independent of the others,'effective problem-solving activity depends ultimately on the capability of the individual KS actions to
construct cooperatively an overall interpretation of the utterance. This high-level hypothesis and its recursive supports represent the solution to the understanding
problem. Since each KS action simply generates or modifies hypotheses and links
based on related information, a large number of individual KS invocations may be
needed to construct an overall interpretation.
Any hypothesis that is included in the
solution is cooperative with the others.
Conversely, any hypothesis that is unincorporated into the solution is competitive. In
a similar way, KS invocations can be considered cooperative or competitive depending on whether their potential actions

HEARSAY-II / 357

would or would not contribute to the same
solution. Because of the inherent uncertainty in the speech-understanding task,
there are inevitably large numbers of '^usible alternative actions in each time imerval of the utterance. Before the correct
interpretation has been found, we cannot
evaluate with certainty the prospective
value of any potential action. Actions appear cooperative to the extent to which
they contribute to the formation and support of increasingly comprehensive interpretations. Conversely, any hypothesis occupying the same time interval as another
hypothesis but not part of its support set
must be considered competitive. That is,
two hypotheses compete if they represent
incompatible interpretations of the same
portion of the utterance. As a result, KS
invocations can be viewed as competitive if
their likely actions would generate inconsistent hypotheses, and they can be viewed
as cooperative if their actions would combine to form more comprehensive or more
strongly supported hypotheses.
The major impediment to discovery of
the best overall interpretation in this
scheme is the combinatorial explosion of
KS invocations that can occur. From the
outset, numerous alternative actions are
warranted. A purely top-down approach
would generate a vast number of possible
actions, if unrestrained. Because certainty
of recognition is practically never possible
and substantial numbers of competing hypotheses must be entertained at each time
interval of analysis, any bottom-up approach generates a similarly huge number
of competing possible actions. Thus additional constraints on the problem-solving
activity must be enforced. This is accomplished by selecting for execution only a
limited subset of the invoked KSs.
The objective of selective attention is to
allocate limited computing resources (processing cycles) to the most important and
most promising actions. This selectivity involves three components. First, the probable effects of a potential KS action must be
estimated before it is performed. Second,
the global significance of an isolated action
must be deduced from analysis of its cooperative and competitive relationships with
existing hypotheses; globally significant

actions are those that contribute to the
detection, formation, or extension of combinations of redundant hypotheses. Third,
the desirability of an action must be assessed in comparison with other potential
actions. While the inherent uncertainty of
the speech task precludes error-free performance of these component tasks, there
have been devised some approximate
methods that effectively control the cornbinatorics and make the speech-understanding problem tractable.
Selective attention is accomplished in the
Hearsay-II system by a heuristic scheduler
which calculates a priority for each action
and executes, at each time, the waiting
action with the highest priority[HAvE77a].
The priority calculation attempts to estimate the usefulness of the action in fulfilling the overall system goal of recognizing
the utterance. The calculation is based on
information provided when the condition
part of a KS is satisfied. This information
includes the stimulus frame, which is the
set of hypotheses that satisfied the condition, and the response frame, a stylized
description of the blackboard modifications
that the KS action is likely to perform. For
example,consider a syllable-based word hypothesizer KS (such as MOW);its stimulus
frame would include the specific syllable
hypothesis which matched its condition,
and its response frame would specify the
expected action of generating word hypotheses in a time interval spanning that of
the stimulus frame. In addition to this action-specific information, the scheduler
uses global state information in its calculations and considers especially the credibility and duration of the best hypotheses in
each level and time region and the amount
of processing required from the time the
current best hypotheses were generated.
The latter information allows the system to
reappraise its confidence in its current best
hypotheses if they are not quickly incorporated into more comprehensive hypotheses.
Hearsay-II Architecture

Figure 4 illustrates the primary architectural features of the Hearsay-II system. At
the start of each cycle, the scheduler, in

358 / EXPERT SYSTEMS AND Al APPLICATIONS

Blackboard
KSI

KS,

level2
Level,

Blackboard
Monitor

Scheduling
Queues

Focus-ofcontrol
Database

Scheduler

KEY:
Data flow

Program modules
Databases

-- -40

Control flow

FIGURE 4. Schematic of the Hearsay-II architecture.

accordance with the global state information, calculates a priority for each activity
(KS condition program or action program)
in the scheduling queues.The highest priority activity is removed from the queues and
executed. If the activity is a KS condition
program, it may insert new instances of KS
action programs into the scheduling
queues. If the activity is a KS action program, the blackboard monitor notices the
blackboard changes it makes. Whenever a
change occurs that would be of interest to
a KS condition program, the monitor creates an activity in the scheduling queues
for that program. The monitor also updates
the global state information to reflect the
blackboard modifications.

1. AN EXAMPLE OF RECOGNITION
In this section we present a detailed description of the Hearsay-II speech system
understanding one utterance. The task for
the system is to answer questions about
and retrieve documents from a collection of
computer science abstracts (in the area of

artificial intelligence). Example sentences:
"Which abstracts refer to theory of computation?"
"List those articles."
"What has McCarthy written since nineteen seventy-four?"

The vocabulary contains 1011 words (in
which each extended form of a root, e.g.,
the plural of a noun, is counted separately
if it appears). The grammar defining the
legal sentences is context-free and includes
recursion. The style of the grammar is such
that there are many more nonterminals
than in conventional syntactic grammars;
the information contained in the greater
number of nodes imbeds semantic and
pragmatic constraint directly within the
grammatical structure. For example, in
place of'Noun'in a conventional grammar,
this grammar includes such nonterminaLs
as 'Topic','Author','Year', and 'Publisher'.
Because of its emphasis on semantic categories, this type of grammar is called a
semantic template grammar or simply a
semantic grammar [HAYE75, BuRT76,

HEARSAY-II

HaYE80]. The grammar allows each word The symbol following the colon names the
to be followed, on the average, by 17 other hypothesis. At the word level and above, an
words of the vocabulary.' The standard de- asterisk (*) following the symbol indicates
viation of this measure is very high (about that the hypothesis is correct. The trailing
51), since some words (e.g., "about" or number within each hypothesis is the cred"on") can be followed by many others (up ibility rating on an arbitrary scale ranging
to 300 in several cases).
from 0 to 100.
In the step-by-step description, the name
of
the KS executed at each step follows the
1.1 Introduction to the Example
step number. An asterisk following the KS
We will describe how Hearsay-II under- name indicates that the hypotheses in the
stood the utterance "ARE ANY BY FEI- stimulus frame of this KS instantiation are
GENBAUM AND FELDMAN?"5 Each all correct. Single numbers in parentheses
major step of the processing is shown; a after hypotheses are their credibility ratstep usually corresponds to the action of a ings. All times given are in centisecond
knowledge source. Executions of the con- units; thus the duration of the whole utterdition programs of the KSs are not shown ance, which was 2.25 seconds, is marked as
explicitly, nor do we list those potential 225. When begin- and end-times of hyknowledge-source actions which are never potheses are given, they appear as two
chosen by the scheduler for execution. Ex- numbers separated by a colon (e.g., 52:82).
ecutions of RPOL are also omitted; in order As in the figure, correct hypotheses are
to calculate credibility ratings for hy- marked with an asterisk.
potheses, RPOL runs in high priority immediately after any KS action that creates 1.2 The Example
or modifies a hypothesis.
The waveform of the spoken utterance is The utterance is recorded by a mediumshown in Figure 5a. The "correct" word quality Electro-Voice RE-51 close-speaking
boundaries (determined by human inspec- headset microphone in a moderately noisy
tion) are shown in Figure 5b for reference. environment (>65 dB). The audio signal is
The remaining sections of Figure 5 contain low-pass filtered and 9-bit sampled at 10
all the hypotheses created by the KSs.Each kHz. All subsequent processing, including
hypothesis is represented by a box; the the control of the A/D converter, is perbox's horizontal position indicates the lo- formed digitally on a time-shared PDP-10
cation of the hypothesis within the utter- computer. Four acoustic parameters(called
ance. The hypotheses are grouped by level: ZAPDASH) are derived by simple algosegment, syllable, word, word sequence, rithms operating directly on the sampled
and phrase. Links between hypotheses are signal [G0LD77]. These parameters are exnot shown.The processing will be described tracted in real time and are used initially to
in terms of a sequence of time steps, where detect the beginning and end of the uttereach step corresponds approximately to KS ance.
execution governed by one scheduling deKS: SEG.
cision. Within each hypothesis, the number Step!.
Stimulus: Creation of ZAPDASH parameters
preceding the colon indicates the time step
for the utterance.
during which the hypothesis was created.
Action: Create segment hypotheses.

Actually, a family of grammars, varying in the number of word.s (terminals) and in the number and complexity ofsentences allowed, was generated. The grammar described here and used in most of the testing is
called X05.
5 To improve clarity, the description differs from the
actual computer execution of Hearsay-II in a few
minor details.

The ZAPDASH parameters are used by
the SEG knowledge source as the basis for
an acoustic segmentation and classification
of the utterance [GILL78]. This segmentation is accomplished by an iterative refinement technique: First, silence is separated
from nonsilence; then the nonsilence is broken down into the sonorant and nonsonorant regions, and so on. Eventually five

/

359

360 / EXPERT SYSTEMS AND Al APPLICATIONS

744

IN

II

4 MIN

1

4 PA/ 77

1

4 PAP 78

174

700

4 NAN, NI

4 NM 18 1 4 PAN 7.

4 AN4 78

liEl

aim
4 PA 74

1

1

I

1

f

4 NIA NI

4 IA IS

4 AAP 78

1

4 INF 711

1 4 A 72

1=10
4 LII 84

„1 j4 FAN 77

"
N

AI 7%

4 Ai 73

111
4 LI

14

4 A 77
4 714 10

1 4 FA 17

731

4 PAP SS

I

1 4 AP S7

4 FIN U

a IN SI

1

4 AIN 714,
4 AN
74
4 IN
72

1

4 f A 74

1

4 AN 77
4 A HI

1

4 PAN U
4 PA SO

NAN SS

1

4 NA S7

I

I IN

•

IAN
AY
AA

IF
IV

TN
0

I AN
Ay
AO

NA
NA
IN
NH

AN

AMY

SO

AN
Ay
AN

OV
AA IN
IN
AN

TN

I AO
Avs
AA
AY

Et

N

45

I•
IN

IN

N

FEIGENIAull

FIGURE 5. The example utterance: (a) the waveform of "Are any by Feigenbaum and Feldman?"; (b) the
correct words (for reference); (c) segments; (d) syllable classes; (e) words (created by MOW); (f) words
(created by VERIFY);(g) word sequences;(h) phrases.(See facing page for Figure 5e-h.)

classes of segments are produced: silence, segment represents an occurrence of the ith
sonorant peak,sonorant nonpeak,fricative, allophone in the label set. For each segand flap. Associated with each classified ment,SEG creates a hypothesis at the segsegment is its duration, absolute amplitude, ment level and associates with it the vector
and amplitude relative to its neighboring of estimated allophone probabilities. The
segments (i.e., local peak, local valley, or several highest rated labels ofeach segment
plateau). The segments are contiguous and are shown in Figure 5c.
nonoverlapping, with one class designation
Step 2. KS: WORD-CTL
for each.
Stimulus: Start of processing.
SEG also does a finer labeling of each
Action: Create goal hypotheses at the word
segment, using a repertory of 98 phonelike
level.
These will control the amount of hylabels. Each of the labels is characterized
pothesization that MOW will do. (The goal
by a vector of autocorrelation coefficients
hypotheses are not shown in Figure 5.)
[ITAK75]. These template vectors were genStep
3. KS: WORD-SEQ-CTL
eralized from manually labeled speaker.
Stimulus: Start of processing.
specific training data. The labeling process
Action: Create goal hypotheses at the wordmatches the central portion of each segsequence le. These will control the amount
ment against each of the templates using
of hypothesization that WORD-SEQ will do.
the Itakura metric and produces a vector of Step
4. KS: POM.
98 numbers. The ith number is an estimate
Stimulus: New segment hypotheses.
of the (negative log) probability that the
Action: Create syllable-class hypotheses.

HEARSAY-II / 361

114

100

iirkkompainfiO4e0i0Aowina4tomm54•55,

IYA .154,11■174-3.411.444.41MAHNOW g

X13

.7.717ennee

LID 1515•111,45INMSOMMI•Ali0410511554115,
74 NOT.EIEGENIAUM.AEUO.111011A14.113
DI CITE•FIEGE !Mum AND.411.17MAM•1 53

UI A11010.1116110101.A115411.011/N.1 13

0

•

A. .
0/11/104,

,ZA.145

4.40

641

1.5045035
- 1051 00

SHAINANDNIARTIN /3

Etimmi0111.11
-

36 ALTEATS IS
35 REGULARLY 25
34 NAGEL
23 WRITTEN 23

27 AND PS
27 01 30

23 ARTICLES IS
23 ARUM 23

27 CITED SO
72 TSAR OR

I? CITES 35

n THESE 75

17 QUOTE 70

I

17 CITE 70

WHAT 10

III YOU
1
36
11 HUGH

I

I 33 ANT 30 I
31 IN TO

31 NT IS I

14 NELTSOPIN /0
I4 NORMAN 70

I/ NOT 73
14 WEIZENIALII 70
17
13 111111110

IE ROOST SS

111 ULLNAH 70

IXIMIX6113
I. MORE a

Val

GAME

6 ART IN

6 *INN

uLuIAN 04

ROOST
6 ASOUT 76

6 HOLLAND 04

ANO 110
6 CAN a

5 TARE 73

[lull
c=11111

6 MARE 75

1I

I MANN II

;l11

N. Al NI

I 5 TEN SI

6 SEEN 71

& VIC 15

ALSONITHO 76

& CITE 70

I SOLOWAT 75

N. THOUGHT 70
6 an n
IWPORTERS 04

I. SOLVING 16
wmEN 70

IV 76

5 IIMIT 00

11160EL is

& earnil

MEDICAL 13

6 COPYING 75

5 NEWT 110

TELL 73

6 OUR 76

6 DONE 71
1 GIVER 76

SHAW

• Will

I LONG 73

WEAK MI

60AL IS

I

1 6 FOURTEEN a

1

S *NUT /0

6 CYN

I

I

I EIGHTEEN 04
1

I S SHAW 70

6 MONITOR NO

5 ONE 73
ONES 73

WA SO

1

6 MANNA 75
6 MODELS 73

6 TWO 15
I 110STOIT SO

UP IS

IN

775

362 / EXPERT SYSTEMS AND Al APPLICATIONS

TABLE I. PHONE CLASSES USED TO DEFINE THE
SYLLABLE CLASSES
Code Phone Class

Phones in Class

A
I
U

A-like
I-like
U-like

L
N
P
F

Liquid
Nasal
Stop
Fricative

AE, AA, AH, AO, AX
IY, IH, EY,EH,IX, AY
OW,UH, U. UW,ER, AW,
OY,EL, EM,EN
Y, W,R,L
M,N, NX
P. T, K,B, D, G,DX
HH, F, TI!, S. SH, V, DH,
Z,ZH,CH,JH, WH

Using the labeled segments as input, the
POM knowledge source[Smrr76]generates
hypotheses for likely syllable classes. This
is done by first identifying syllable nuclei
and then parsing outward from each nucleus, using a probabilistic grammar with
production rules of the form:
syllable-class

segment-sequence.

The rules and their probabilities are induced by an off-line program that trains on
manually segmented and labeled utterances. For each nucleus position, several
(typically three to eight) competing syllable-class hypotheses may be generated.
Figure 5d shows the syllable-class hypotheses created. Each class name is made
up of single-letter codes representing
classes of phones, as given in Table 1.
Step 5. KS: MOW.
Stimulus: New syllable hypotheses.'
Action: Create word hypotheses.

about 50 words of the 1011-word vocabulary
are generated at each syllable nucleus position.
Finally, the generated word candidates
are rated and their begin- and end-times
adjusted by the WIZARD procedure
[McKE771. For each word in the vocabulary, WIZARD has a network description
of its possible pronunciations. A word rating is calculated by finding the one path
through the network which most closely
matches the labeled segments, using the
probabilities associated with the segment
for each label; the resultant rating reflects
the difference between this optimal path
and the segment labels.'
Processing to this point has resulted in a
set of bottom-up word candidates. Each
word includes a begin-time, an end-time,
and a credibility rating. MOW selects a
subset of these words, based on their times
and ratings, to be hypothesized; these selected word hypotheses form the base for
the top-end processing. Words not immediately hypothesized are retained internally
by MOW for possible later hypothesization.s
The amount of hypothesization that
MOW does is controlled by the WORDCTL (Word Control) KS. At step 2,
WORD-CTL created initial goal hypotheses at the word level; these are interpreted by MOW as indicating how many
word hypotheses to attempt to create in
each time area.Subsequently, WORD-CTL
may retrigger and modify the goal hypotheses (and thus retrigger MOW) if the
overall search process stagnates; this condition is recognized when there are no waiting KS instantiations above a threshold
priority or when the global measures of
current state of the problem solution have

The syllable classes are used by MOW in
step 5 to hypothesize words. Each of the
1011 words in the vocabulary is specified by
a pronunciation description. For word hypothesization purposes, an inverted form of
the dictionary is kept; this associates each
syllable class with all words whose pronunciation contains it. The MOW KS[SmIT76]
looks up each hypothesized syllable class in 7 WIZARD is, in effect, a miniature version of the
the dictionary and generates word candi- HARPY speech-recognition system (see Section 2.3),
dates from among those words containing except that it has a network for each word, rather
that syllable class. For each word that is than one network containing all sentences.
multisyllabic, all of the syllables in one of
Since the September 1976 version, the POM and
the pronunciations must match with a rat- MOW KSs have been replaced by NOAH [Sher77,
ing above a specified threshold. Typically, SmiT811. This KS outperforms, in both speed and

MOW will also be reinvoked upon a modification to
the word goal hypotheses by WORD-CTL

accuracy, POM and MOW (with WIZARD) on the
1011-word vocabulary and is able to handle much
larger vocabularies; its performance degradation is
only logarithmic in vocabulary size, in the range of 500
to 19,000 words.

HEARSAY-II / 363

not improved in the last several KS execu- cause of the relatively poor reliability of
tions.
ratings of single words. With multiword
WORD-CTL (and WORD-SEQ-CTL) islands, syntactic and coarticulation conare examples of KSs not directly involved straints can be used to increase the reliain the hypothesizing and testing of partial bility of the ratings.
WORD-SEQ uses three kinds of knowlsolutions. Instead, these KSs control the
search by influencing the activations of edge to generate multiword islands effiother KSs. These policy KSs impose global ciently:
search strategies on the basic priority
scheduling mechanism. For example, MOW (1) A table derived from the grammar indicates for every ordered pair of words
is a generator of word hypotheses(from the
in
the vocabulary (1011 x 1011)
candidates it creates internally) and
whether that pair can occur in sequence
WORD-CTL controls the number to be
within some sentence of the defined
hypothesized. This clear separation of pollanguage.
This binary table, whose denicy from mechanism has facilitated experisity
of
ones
for the X05 grammar is 1.7
mentation with various control schemes. A
percent, defines a language-adjacent
trivial change to WORD-CTL such that
relation.
goal hypotheses are generated only at the
(2)
Acoustic-phonetic knowledge, embodstart of the utterance (left-hand end) reied
in the JUNCT(juncture) procedure
sults in MOW creating word hypotheses
[CR0N77], is applied to pairs of word
only at the start, thus forcing all top-end
hypotheses and is used to decide if that
processing to be left-to-right (see Section
pair might be considered to be time3.2).
adjacent in the utterance. JUNCT uses
In this example four words (ARE, BY,
the dictionary pronunciations, and exAND, and FELDMAN) of the six in the
amines the segments at their juncture
utterance were correctly hypothesized; 86
(gap
or overlap) in making its decision.
incorrect hypotheses were generated (see
Figure 5e). The 90 words that were hypoth- (3) Statistical knowledge is used to assess
the credibility of generated alternative
esized represent approximately 1.5 percent
word sequences and to terminate the
of the 1011-word vocabulary for each one
search
for additional candidates when
of the six words in the utterance.
the chance of finding improved hyIn addition, two unique word-level hypotheses drops. The statistics are genpotheses are generated before the first and
erated
from previously observed behavafter the last segment of the utterance to
ior
of
WORD-SEQ and are based on
denote the start and end of utterance, rethe number of hypotheses generable
spectively. They are denoted by[and].
from the given bottom-up word hyStep 6. KS: WORD-SEQ.
potheses and their ratings.
Stimulus: New words created bottom-up.
Action: Create four word-sequence hypotheses:
[—ARE*(97,0:28),
AND—FELDMAN—]*(90, 145:225),
EIGHT(85, 48:57).
SHAW—AND—MARVIN(75,72:157),

The WORD-SEQ knowledge source
[LEss77a] has the task of generating, from
the bottom-up word hypotheses,a small set
(about three to ten) of word-sequence hypotheses. Each of these sequences, or islands, can be used as the basis for expansion into larger islands, which it is hoped
will culminate in a hypothesis spanning the
entire utterance. Multiword islands are
used rather than single-word islands be-

WORD-SEQ takes the highest rated single
words and generates multiword sequences
by expanding them with other hypothesized
words that are both time- and languageadjacent. This expansion is guided by credibility ratings generated by using the statistical knowledge. The best of these word
sequences(which occasionally includes single words) are hypothesized.
The WORD-SEQ-CTL (Word-Sequence-Control) KS controls the amount of
hypothesization that WORD-SEQ does by
creating "goal" hypotheses that WORDSEQ interprets as indicating how many hypotheses to create. This provides the same
kind ofseparation of policy and mechanism

364 / EXPERT SYSTEMS AND Al APPLICATIONS

achieved in the MOW/WORD-CTL pair of phrase hypothesis is the word sequence
KSs. WORD-SEQ-CTL fired at the start of that supports it, as well as information
processing, at step 3, in order to create the about the parse(s).
goal hypotheses. Subsequently, WORDSteps 7 through 10 show the PARSE KS
SEQ-CTL may trigger if stagnation is rec; processing each of the multiword seognized; it then modifies the word-sequence quences. In this example all four multiword
goal hypotheses, thus stimulating WORD- sequences were verified as valid language
SEQ to generate new islands from which fragments. However, if a multiword sethe search may prove more fruitful. quence had been rejected, the WORD-SEQ
WORD-SEQ may generate the additional KS might have been reinvoked to generate
hypotheses by decomposing word se- additional multiword sequences in the time
quences already on the blackboard or by area of the rejected one. WORD-SEQ
generating islands previously discarded be- would generate the additional hypotheses
cause their ratings seemed too low.
by decomposing (shortening) word-seStep 6 results in the generation of four quence islands already on the blackboard
multiword sequences (see Figure 5g). These or by regenerating islands which may not
are used as initial, alternative anchor points have been hypothesized initially owing to
for additional searching. Note that two of low ratings. Additional word-sequence hythese islands are correct, each representing potheses might also be generated in rean alternative search path that potentially sponse to the modification of "goal" hycan lead to a correct interpretation of the potheses at the word-sequence level by the
utterance. This ability to derive the correct WORD-SEQ-CTL. Such a structuring of a
interpretation in multiple ways makes the KS as a generator is a primary mechanism
system more robust. For example, there in Hearsay-II for limiting the number of
have been cases in which a complete inter- hypotheses created on the blackboard and
pretation could not be constructed from thereby reducing the danger of a combinaone correct island because of KS errors but torial explosion of KS activity in reaction
was derived from another island.
to those hypotheses.
High-level processing on the multiword
The scheduling strategy is parameterized
sequences is accomplished by the following to delay phrase-level processing until an
KSs: PARSE, PREDICT, VERIFY, CON- adequate number of highly rated phrase
CAT,STOP,and WORD-SEQ-CTL. Since hypothesis islands is generated. This stratan execution of the VERIFY KS will often egy is not built directly into the scheduler,
immediately follow the execution of the but rather is accomplished by (1) appropriPREDICT KS (each on the same hypoth- ately setting external scheduling paramesis), we have combined the descriptions of eters (i.e., the high setting of the priorities
the two KS executions into one step for of WORD-SEQ and PARSE KS actions in
ease of understanding.
contrast to those of PREDICT, VERIFY,
Because the syntactic constraint used in and CONCAT),9 and (2) taking into acthe generation of the word sequences is count the current state of hypotheses on
only pairwise, a sequence longer than two the phrase level of the blackboard in evalwords might not be syntactically accepts- uating the usefulness of potential KS acble. The PARSE knowledge source tions as described by their response frames.
[HAYE77b] can parse a word sequence of
Step 7. KS: PARSE'.
arbitrary length, using the full grammatical
Stimulus:[—ARE*(word sequence).
constraints. This parsing does not require
Action: Create phrase:[+ARE• (97, 0:28).
that the word sequence form a complete
Step 8. KS: PARSE'.
nonterminal in the grammar or that the
Stimulus: AND—FELDMAN—]
•(word sesequence be sentence-initial or sentence-fiquence).
nal; the words need only occur contiguously
in some sentence of the language. If a sequence hypothesis does not parse, it is 'These settings are determined empirically by observmarked as "rejected." Otherwise a phrase ing a number of training runs. They are not adjusted
hypothesis is created. Associated with the during test runs of the system.

HEARSAY-II / 365

Action: Create phrase:
AND+FELDMAN+]* (90, 145:225).
Step 9. KS: PARSE.
Stimulus: EIGHT (word sequence).
Action: Create phrs
EIGHT (85, 48:57).
Step 10. KS: PARSE.
Stimulus: SHAW—AND—MARVIN (word
sequence).
Action: Create phrase: SHAW+AND+MARVIN (75, 72:157).

sibility of the time-adjacency relationship
between the predicting phrase and the predicted word. Finally, WIZARD compares
its word-pronunciation network with the
segments in an attempt to verify the prediction.
For each of these different kinds of verification, the approximate begin-time (endtime if verifying an antecedent prediction)
of the word being predicted following (preceding)
the phrase is taken to be the endEach of the four executions of the
time
(begin-time)
of the phrase. The endPARSE KS (steps 7-10) results in the creation of a phrase hypothesis; these are time (begin-time) of the predicted word is
shown in Figure 5h. Each of these hy- not known, and in fact one function of the
potheses causes an invocation of the PRE- verification step is to generate an approximate end-time (begin-time) for the verified
DICT KS.
The PREDICT knowledge source[HAYE word. In general, it is possible to generate
77b] can, for any phrase hypothesis, gen- several different "versions" of the word
erate predictions of all words which can which differ primarily in their end-times
immediately precede and all which can im- (begin-times); since no context following
mediately follow that phrase in the lan- (preceding) the predicted word is given,
guage. In generating these predictions this several different estimates of the end (beKS uses the parsing information attached ginning) of the word may be plausible solely
to the phrase hypothesis by the parsing on the basis of the segmental information.
component. The action of PREDICT is to These alternatives give rise to the creation
attach a "word-predictor" attribute to the of competing hypotheses.
VERIFY is invoked when a KS (PREhypothesis which specifies the predicted
places a "word-predictor" attribute
DICT)
words. Not all of these PREDICT KS inhypothesis. For each word on
on
a
phrase
stantiations are necessarily executed (and
attribute
list that it verifies, it creates
the
thus indicated as a step in the execution
history). For instance, further processing a word hypothesis (if one does not already
on the phrases[+ARE and AND+FELD- exist), and the word is placed on a "wordMAN+] is sufficiently positive that the verification" attribute of the phrase hyscheduler never executes the instantiation pothesis. Word hypotheses created by
of PREDICT for the phrase SHAW+ VERIFY are shown in Figure 5f.
The CONCAT KS[HAYE77b]is invoked
AND+MARVIN (created in step 10).
on
phrase hypotheses which have word-verThe VERIFY KS can attempt to verify
ification
attributes attached. For each verthe existence of or reject each such preword,
the phrase and new word are
ified
dicted word in the context of its predicting
and a new,extended phrase
parsed
together
phrase. If verified, a confidence rating for
(as shown in Figure
hypothesis
is
created
the word is also generated. The verification
receives a rating
hypothesis
The
new
5h).
proceeds as follows: First, if the word has
its component
the
ratings
of
based
on
been hypothesized previously and passes
predictions
preceding or
words.
If
all
word
the test for time-adjacency (by the JUNCT
been rejected, the
phrase
had
following
the
procedure), it is marked as verified and the
marked
word hypothesis is associated with the pre- phrase hypothesis itself would be
Similarly, the underlying
"rejected."
as
diction. (Note that some word hypotheses
if all
may thus become associated with several word-sequence hypothesis is rejected
supports are rehypotheses
it
the
phrase
different phrases.) Second,a search is made
retrigger
of the internal store created by MOW to jected. (This action would
word semore
generate
to
WORD-SEQ
see if the prediction can be matched by a
quences.)
previously generated word candidate which
had not yet been hypothesized. Again, Step 11. KS: PREDICT & VERIFY*.
Stimulus:[+ARE* (phrase).
JUNCT makes a judgment about the plau-

366 / EXPERT SYSTEMS AND Al APPLICATIONS

Action: Predict(from the grammar)292 words
following. Reject (using the acoustic information) 277 of them. The four highest rated of
the 15 verified words are
REDDY(85,26:52),
ANY*(65,24:49),
HUGH(55,30:39), and
YOU(55, 28:39).
Step 12. KS: CONCAT.
Stimulus:[+ARE•(phrase), REDDY (word).
Action: Create phrase:[+ARE+REDDY (91,
0:52).
Step 13. KS: CONCAT*.
Stimulus:(+ARE* (phrase), ANY (word).
Action: Create phrase: [+ARE+ANY• (86,
0:49).

Step 16. KS: CONCAT'.
Stimulus: FEIGENBAUM• (word), AND+
FELDMAN+]'(phrase).
Action: Create phrase: FEIGENBAUM*
AND+FELDMANAT (85, 72:225).

Beginning with step 16, extending the
phrase AND+FELDMAN+] with the
highly rated word FEIGENBAUM looks
sufficiently promising for processing to continue now in a more depth-first manner
along the path FEIGENBAUM+AND+
FELDMAN+] through step 25.10 Processing on the path[+ARE+REDDY does not
resume until step 26.
Step 17. KS: PREDICT & VERIFY*.

Stimulus: FEIGENBAUM+AND+FELDIn steps 11 through 13 the highly rated
MAN+]• (phrase).
phrase [+ARE is extended and results in
Action:
Predict eight preceding words. Reject
the generation of the additional phrases
one (DISCUSS). Find two already on the
[+ARE+REDDY and [+ARE+ANY.
blackboard:
These phrases, however, are not immediBY•(80, 52:72) and
ately extended because the predicted words
ABOUT(75,48:72).
REDDY and ANY are not rated suffiVerify five others:
ciently high. Instead, the scheduler, pursuNOT(75, 49:82),
ED(75, 67:72),
ing a strategy more conservative than strict
CITE(70, 49:82),
best-first, investigates phrases that look alQUOTE(70, 49:82),
most as good as the best one. This schedCITES(65, 49:82).
uling strategy results in the execution of
the PREDICT and VERIFY KSs on two of
In steps 18 through 24, alternative word
the other initial phrase islands: AND+ extensions of FEIGENBAUM+AND+
FELDMAN+]and EIGHT.
FELDMAN+]are explored. As a result of
this
exploration the phrase BY+FEIGENStep 14. KS: PREDICT & VERIFY'.
BAUM+AND+FELDMAN+] is considStimulus: AND+FELDMAN+]* (phrase).
Action: Predict 100 words preceding. Reject ered the most credible.
76 of them. The best of the verified 24 (in
descending rating order) are
FEIGENBAUM*(80, 72:150),
WEIZENBAUM(70, 72:150),
ULLMAN(70, 116:150),
NORMAN(70, 108:150), and
NEWBORN(70, 108:150).
Step 15. KS: PREDICT & VERIFY.
Stimulus: EIGHT (phrase).
Action: Predict the word NINE following and
verify it (80, 52:82). Predict SEVEN preceding, but reject this because of mismatch with
the acoustic segments.

The attempt to extend the phrase
EIGHT at step 15 is not successful; none of
the grammatically predicted words are
acoustically verified, even using a lenient
threshold. Thus this phrase is marked rejected and is dropped from further consideration.

Step 18. KS CONCAT*.
Stimulus: BY (word), FEIGENBAUM+
AND+FELDMAN+]• (phrase).
Action: Create phrase: BY+FEIGENBAUM+AND+FELDMAN+j•(84, 52:225).
Step 19. KS: CONCAT.
Stimulus: ABOUT (word), FEIGENBAUM+
AND+FELDMAN+)* (phrase).
Action: Create phrase: ABOUT+FEIGENBAUM+AND+FELDMAN+1 (83,48:225).
Step 20. KS: PREDICT & VERIFY.

Stimulus:
ABOUT+FEIGENBAUM+AND+ FELDMAN+)(phrase).
'" The rating on a hypothesis is only one parameter
used by the scheduler to assign priorities to waiting
KS instantiations. In particular, the length of a hy-

pothesis is also important.Thus,FEIGENBAUM with
a rating of 80 looks better than REDDY with a rating
of 85 because it is much longer.

HEARSAY-II / 367

Action: Predict one preceding word: WHAT. generate the enlarged hypothesis from
Verify it (10, 20:49).
either of the two original hypotheses in an
incremental fashion. Thus the recognition
Step 21. KS: CONCAT
Stimulus: CITE (word), FEIGENBAUM+
process is sped up in two ways: (1) several
AND+FELDMAN+)(phrase).
single-word actions are eliminated, and (2)
Action: Create phrase: CITE+FEIGENthe scheduler postpones KS actions on
BAUM+AND+FELDMAN+](83, 49:225).
competing (incorrect) hypotheses since
Step 22. KS: PREDICT & VERIFY.
these potential actions seem less attractive
Stimulus: CITE+FEIGENBAUM+AND+
than actions on the new, enlarged hypothFELDMAN+)(phrase).
esis. Such mergings occur in approximately
Action: Predict four preceding words. Reject
half of the runs on the 1011-word grammar
two of them: BOOKS,PAPERS. Verify
with the small branching factor (X05); in
THESE (25, 28:49),
grammars with higher branching factors,
YEAR (20, 30:49).
the merging of phrase hypotheses occurs
Step 23. KS: PREDICT & VERIFY*.
with even higher frequency.
Stimulus: BY+FEIGENBAUM+AND+
It has been our experience that just as a
FELDMAN+)* (phrase).
multiword
island is more credible than the
Action: Predict ten preceding words. Reject
individual words that compose it, so a
five: ABSTRACTS, ARE, BOOKS,PAmerged phrase hypothesis is more credible
PERS,REFERENCED. Find two already
on the blackboard:
than its two constituent phrases. For exANY (65, 24:49),
ample, about 80 percent of the mergings in
THESE (25, 28:49).
X05 runs produce correct hypotheses. In
Verify three more:
more complex grammars this statistic drops
ARTICLE (25, 9:52),
to about 35 percent, but correspondingly
WRITTEN (25, 24:52),
more phrase mergings occur.
ARTICLES (10, 9:52).
The newly created merged phrase also
Step 24. KS: CONCAT.
happens to be a complete sentence; i.e., it
Stimulus: NOT (word), FEIGENBAUM+
has begin- and end-of-utterance markers as
AND+FELDMAN-i-r.
its
extreme constituents. Thus it is a canAction: Create phrase: NOT+FEIGENdidate for the interpretation of the utterBAUM+AND+FELDMAN+](83, 49:225).
ance.
Step 25. KS: CONCAT*.
Stimulus: ANY•(word), BY+FEIGENStep 26. KS: STOP.
BAUM+AND+FELDMAN+]• (phrase).
Stimulus:[+ARE+ANY+BY+FEIGENAction: Create phrase: ANY+BY+FEIGENBAUM+AND+FELDMAN+]• (complete
BAUM+AND+FELDMAN+1* (82, 24:225).
sentence).
[+ARE+ANY+BY+FEIGENBAUM+
Action: Deactivation of several dozen comAND+FELDMAN+]* (85, 0:225) is also crepeting hypotheses.
ated,from[+ARE+ANY and BY+FEIGENThese start- and end-of-utterance
BAUM+ AND+FELDMAN+].

"words"(denoted by[ and ]) appear in the
In step 25 the word ANY is concatenated syntactic specification of the language as
onto the phrase BY+FEIGENBAUM+ the first and last terminals of every comAND+FELDMAN+1 However, instead of plete sentence. Thus any verified phrase
only creating this new combined phrase, that includes these as its extreme constituthe CONCAT KS also notices that the word ents is a complete sentence and spans the
ANY is the last word of the phrase entire utterance. Such a sentence becomes
[+ARE+ANY;this leads the CONCAT KS a candidate for selection as the system's
to merge the two adjacent phrases recognition result.
[+ARE+ANY and BY+FEIGENBAUM+
In general, the control and rating strateAND+FELDMAN+]into a single phrase, gies do not guarantee that the first such
after first ascertaining that the resulting complete spanning hypothesis found will
phrase is grammatical. This merging by- have the highest rating of all possible spanpasses the several single-word PREDICT, ning sentence hypotheses that might be
VERIFY, and CONCAT actions needed to found if the search were allowed to con-

368 / EXPERT SYSTEMS AND Al APPLICATIONS

tinue, so the system does not just stop with
the first one generated." However the characteristics of such a hypothesis are used by
the STOP knowledge source to prune from
further consideration other partial hypotheses which, because of their low ratings, are unlikely to be extendible into spanning hypotheses with ratings higher than
the best already-discovered spanning sentence. This heuristic pruning procedure is
based on the form of the ratings function
(i.e., how the rating of the phrase is derived
from its constituent words). The pruning
procedure considers each partial phrase
and uses the ratings of other word hypotheses in the time areas not covered by
the phrase to determine if the phrase might
be extendible to a phrase rated higher than
the spanning hypothesis; if not, the partial
phrase is pruned. This pruning process and
the rating and halting policies are discussed
in MosT77.
Of the hypotheses not discarded, extensions to the phrase [+ARE now appear as
the most likely candidates to produce new
and better complete phrases. This search
for better complete phrases results, in steps
27 through 36, in the examination of numerous alternative extensions, each of
which is promising.
Step 27. KS: PREDICT & VERIFY.

Stimulus:[+ARE+REDDY.
Action: Predict three following words. Verify
CITED (60, 52:86), OR (30, 52:67), AND
(25, 52:82).
Step 28. KS: CONCAT.
Stimulus:[+ARE• (phrase), HUGH (word).
Action: Create phrase:[+ARE+HUGH (83,
0:39).
Step 29. KS: CONCAT.
Stimulus:[+ARE (phrase), YOU (word).
Action: Create phrase:[+ARE+YOU (83,
0:39).
Step 30. KS: CONCAT.

Stimulus:[+ARE+REDDY (phrase),
CITED (word).
" An alternative control strategy based on the Shortfall Density scoring function and assumptions of the
completeness of processing at the word level can guarantee that the first complete interpretation generated
is the best possible (see Section 2.1). This results in a
more conservative, breadth-first search,in which more
alternatives are explored.

Action: Create phrase:[+ARE+REDDY+
CITED (80, 0:86).
Step 31. KS: PREDICT & VERIFY.
Stimulus:[+ARE+REDDY+CITED
(phrase).
Action: Predict two following words. Verify
BY(75, 83:98), IN(20, 86:114).
Step 32. KS: CONCAT.
Stimulus:[+ARE+REDDY+CITED
(phrase), BY (word).
Action: Create phrase:[+ARE+REDDY+
CITED+BY (80, 0:98).
Step 33. KS: PREDICT & VERIFY.
Stimulus:[+ARE+REDDY+CITED+BY
(phrase).
Action: Predict one following word. Verify
ANY (30, 105:126).
Step 34. KS: PREDICT 8c VERIFY.
Stimulus:[+ARE+HUGH (phrase).
Action: Predict one following word. Verify
NAGEL (40, 42:63).
Step 35. KS: PREDICT & VERIFY.
Stimulus:[+ARE+YOU (phrase).
Action: Predict three following words. Reject
USUALLY. Verify
REGULARLY (25, 39:116),
ALWAYS (15, 39:72).
Step 36. KS: CONCAT.

Stimulus:[+ARE+REDDY (phrase), OR
(word).
Action: Create phrase:[+ARE+REDDY+
OR (79, 0:67).
Step 37. KS: CONCAT.
Stimulus:[+ARE+REDDY (phrase), AND
(word).
Action: Create phrase:[+ARE+REDDY+
AND (78, 0:82).
Step 38. KS: STOP.

Stimulus: Stagnation
Action: Stop search and accept[+ARE+
ANY+BY+FEIGENBAUM+AND+FELD.
MAN+]e.
The recognition processing finally halts
in one of two ways: First, there may be no
more partial hypotheses left to consider for
prediction and extension. Because of the
combinatorics of the grammar and the likelihood of finding some prediction rated at
least above the absolute rejection threshold, this termination happens when the
heuristic pruning procedure used by STOP
and RPOL has eliminated all competitors.
Such a halt occurs here as STOP decides
to terminate the search process and accept
the phrase [+ARE+ANY+BY+FEIGEN-

HEARSAY-II / 369

BAUM+AND+FELDMAN+] as the correct interpretation. In general there might
be more than one complete sentence by"thesis at this point; STOP would select
L.e one with the highest rating.
A second kind of halt occurs if the system
expends its total allowed computing resources(time or space).(The actual thresholds used are set according to the past
performance of the system on similar sentences, i.e., of the given length and over the
same vocabulary and grammar.) In that
case a selection of several of the highest
rated phrase hypotheses is the result of the
recognition process, with the selection
biased toward the longest phrases which
overlap (in time) the least.
Step 39. KS: SEMANT*.
Stimulus: Recognized utterance:[+ARE+
ANY+BY+FEIGENBAUM +AND+FELD MAN+]*.
Action: Generate an interpretation for the
database retrieval system.

account the rating, temporal position, and
semantic consistency of the partial sentences.
.The DISCO (discourse) knowledge
source [HAYE77c] accepts the formatted
interpretation of SEMANT and produces
a response to the speaker. This response is
often the display of a selected portion of
the queried database. In order to retain a
coherent interpretation across sentences,
DISCO maintains a finite-state model of
the ongoing discourse.

2. COMPARISON WITH OTHER SPEECHUNDERSTANDING SYSTEMS
In addition to Hearsay-II, several other
speech-understanding systems were also
developed as part of the Defense Advanced
Research Projects Agency (DARPA) research program in speech understanding
from 1971 to 1976 [MEDR78]. As a way of
concretely orienting the research, a common set of system performance goals,
shown in Figure 6, was established by the
study committee that launched the project
[NEwE73]. All of the systems are based on
the idea of diverse, cooperating KSs to handle the uncertainty in the signal and processing. They differ in the types of knowledge, interactions of knowledge, representation of search space, and control of the

The SEMANT knowledge source
[Fox77] takes the word sequence(s) result
of the recognition process and constructs
an interpretation in an unambiguous format for interaction with the database that
the speaker is querying. The interpretation
is constructed by actions associated with
"semantically interesting" nonterminals
(which have been prespecified for the grammar) in the parse tree(s) of the recognized FIGURE 6. DARPA speech-understanding-system
sequence(s). In our example the following
performance goals set in 1971. [After NEwE73 and
structure is produced:
MEDR78.]
FJU:([ARE ANY BY FEIGENBAUM AND

The system should

FELDMAN])
•Accept connected speech
N:(SPRUNE!LIST
•from many
S:(WRUNE!LIST!AUTHOR K:(A: •cooperative speakers of the General American Dia((FEIGENBAUM • FELDMAN)))))]
lect
•in a quiet room

F denotes the total message. U contains the •using a good-quality microphone
utterance itself. N indicates the main type •with slight tuning per speaker
of the utterance (e.g., PRUNE a previously •requiring only natural adaptation by the user
specified list of citations, REQUEST, •permitting a slightly selected vocabulary of 1000
words
HELP), S the subtype (e.g., PRUNE a list
according to its author). K denotes the dif- •with a highly artificial syntax and highly constrained
ferent attributes associated with the utter- •task
providing graceful interaction
ance (e.g., A is the author, T is the topic). •tolerating less than 10 percent semantic error
If recognition produces more than one •in a few times real time on a 100-million-instructionspartial sequence, SEMANT constructs a
per-second machine
maximally consistent interpretation based •and be demonstrable in 1976 with a moderate chance
on all of the partial sentences, taking into
of success.

370 / EXPERT SYSTEMS AND Al APPLICATIONS

TRIP

TALKER

))
)RESPONSE

SEMANTIC
INTERPRETATIONS

DISCOURSE
EXPECTATIONS

CONTROL STRATEGY
WORD
HYPOTHESES

WORD
HYPOTHESES

WORD
MATCHES

SYNTACTIC
HYPOTHESES

SCORES

LEXICAL
RETRIEVAL
SEGMENT
LATTICE

SYNTACTIC
PREDICTIONS

SYNTAX

TRIP
VERIFICATION

AP
PARAMETERS
PSA

I

DIGITIZED
WAVEFORM

I RUNE

1-4/ 4"4"4"...

UTTERANCE

FIGURE 7. Structure of HWIM.[From W0LF80.]

search. (They also differ in the tasks and
languages handled, but we do not address
those here.) In this section we describe
three of these systems, Bolt Beranek and
Newman's (BBN's) HWIM, Stanford Research Institute's (SRI's) system, and
Carnegie-Mellon University's (CMU's)
HARPY,and compare them with HearsayII along those dimensions. For consistency
we will use the terminology developed in
this paper in so far as possible,even though
it is often not identical to that used by the
designers of each of the other systems.'
Although the performance specifications
had the strong effect of pointing the various
efforts in the same directions, the backgrounds and motivations of each group led
to different emphases. For example, BBN's
expertise in natural-language processing
and acoustic-phonetics led to an emphasis
"IBM has been funding work with a somewhat different objective[BaHL76]. Its stated goals mandate little
reliance on the strong syntactic/semantic/task constraints exploited by the DARPA projects. This orientation is usually dubbed speech recognition as distinguished from speech understanding.

on those KSs; SRI's interest in semantics
and discourse strongly influenced its system
design; and CMU's predilection for system
organization placed that group in the central position (and led to the Hearsay-fl and
HARPY structures).

2.1

BBN's HWIM System

Figure 7 shows the structure of BBN's
HWIM (Hear What I Mean) system
[WooD76, WoLF80]. In overall form,
HWIM's general processing structure is
strikingly similar to that of Hearsay-H.Processing of a sentence is bottom-up through
audio signal digitization, parameter extraction, segmentation and labeling, and a scan
for word hypotheses; this phase is roughly
similar to Hearsay-II's initial bottom-up
processing up through the MOW KS.
Following this initial phase, the Control
Strategy module takes charge, calling the
Syntax and Lexical Retrieval KSs as subroutines:
•The grammar is represented as an aug-

mented transition network [WOOD70],

and, as in Hearsay-H, includes semantic

HEARSAY-II / 371

and pragmatic knowledge of the domain
(in this case,"travel planning"). The Syntax KS combines the functions of Hearsay-II's PREDICT and CONCAT KSs.
Like them, it handles contiguous sequences of words in the language, independently of the phrase structure nonterminal boundaries, as well as the merging
of phrase hypotheses (i.e., island collision).
•The Lexical Retriever functions in this
phase much like Hearsay-II's VERIFY
KS, rating the acoustic match of a predicted word at one end of a phrase. Some
configurations of HWIM also have a KS
which does an independent, highly reliable, and very expensive word verification;
that KS is also called directly by the Control Strategy.
•The Control Strategy module schedules
the Syntax and Lexical Retrieval KSs opportunistically. To this end it keeps a task
agenda that prioritizes the actions on the
most promising phrase hypotheses. The
task agenda is initialized with single-word
phrase hypotheses constructed from the
best word hypotheses generated in the
bottom-up phase.

[WOOD 73]. In this methodology the overall system is implemented initially with
some combination of compt..ter programs
and human simulators, with the latter
filling the role of components (i.e., KSs
and scheduling) not fully conceptualized.
As experience is gained, the human simulators are replaced by computer programs. Thus by the time the system has
evolved into a fully operational computer
program, the type of KSs and their interaction patterns are expected to be stable.
Modifications after this point aim to improve the performance of individual KSs
and their scheduling, with only minor
changes expected in KS interaction patterns. From this perspective, developing
specific explicit structures for explicit KS
interactions is reasonable.

Thus HWIM has an explicit control strategy, in which KSs directly call each other,
and in which the scheduler has built-in
knowledge about the specific KSs in the
system. The Hearsay-II scheduler has no
such built-in knowledge but rather is given
an abstract description of each KS instantiation by its creator condition progiam.
Similarly, one KS communicates with anGiven these similarities between HWIM other in HWIM via ad hoc KS-specific data
and Hearsay-II, what besides the content structures. The introduction of a new KS is
of the KSs (which we do not address) are expected to occur very rarely and requires
the differences? The most significant differ- either that it adopt some other KS's existences involve the mechanisms for instan- ing data representation or that its new fortiating KSs, scheduling KSs (i.e., selective mats be integrated into those KSs that will
attention for controlling the search), and interact with it. Hearsay-H's blackboard,
representing, accessing, and combining KS on the other hand, provides a uniform represults. These differences stem primarily resentation which facilitates experimentation with new or highly modified KSs.
from differing design philosophies:
When one KS in a hierarchical structure
•The Hearsay-H design was based on the like that in HWIM calls another,it provides
assumption that a very general and flexi- the called KS with those data it deems
ble model for KS interaction patterns was relevant. The called KS also uses whatever
required because the type, number, and data it has retained internally plus what it
interaction patterns of KSs would change might acquire by calling other KSs. Hearsubstantially over the lifetime of the sys- say-I's blackboard, on the other hand, protem [LESS75, LESS77b]. Thus we rejected vides a place for all data known to all the
an explicit subroutine-like architecture KSs; one KS can use data created by a
for KS interaction because it reduces previous KS execution without the creator
modularity. Rather, the implicit data-di- of the data having to know which KS will
rected approach was taken, in which KSs use the data and without the user KS havinteract uniformly and anonymously via ing to know which KS might be able to
the blackboard.
create the data.
The ability to embed into the HWIM
•The HWIM design evolved out of an
incremental simulation methodology system a detailed model of the KSs and

372 / EXPERT SYSTEMS AND Al APPLICATIONS

their interaction patterns has had its most performance statistics gathered on test
profound effect on the techniques devel- data. This uniform scheme for calibration
oped for scheduling. Several alternative and combination of ratings facilitates addscheduling policies were implemented in ing and modifying KSs. The issue of evalthe Control Strategy module. The most uating the combination of evidence from
interesting of these, the "shortfall density multiple sources is a recurrent probscoring strategy"[WOOD 77], can be shown lem in knowledge-based systems [Sn0R75,
formally to guarantee that the first com- DunA78].
plete sentence hypothesis constructed by
the system is the best possible (i.e., highest 2.2 SRI's System
rated) such hypothesis that it will ever be
able to construct. Heuristic search strate- The SRI system [WALK78, WALK80],
gies with this property are called admissi- though never fully operational on a large
ble [Nns71]. This contrasts with the ap- vocabulary task, presents another interestproximate Hearsay-II scheduling strategy, ing variant on structuring a speech-underin which there is no guarantee at any point standing system. Like the HWIM system,
that a better interpretation cannot be found it uses an explicit control strategy with,
by continued search. Thus Hearsay-II re- however, much more control being centralquires a heuristic stopping decision, as de- ized in the Control Strategy module. The
scribed in Section 1.2. In HWIM an admis- designers of the system felt there was "a
sible strategy is possible because the sched- large potential for mutual guidance that
uler can make some strong assumptions would not be realized if all knowlabout the nature of KS processing: in par- edge source communication was indirect"
ticular, the algorithms used by the Lexical [WALK 78, p.84]. Part of this explicit control
Retriever KS are such that it does not is embedded within the rules that define
subsequently generate a higher rating for a the phrases of the task grammar;each rule,
predicted word than that of the highest in addition to defining the possible constitrated word predicted in that utterance lo- uent structure for phrases in an extended
cation by the initial, bottom-up processing. form of BNF, contains procedures for calAn admissible strategy eliminates errors culating attributes of phrases and factors
which an approximate strategy may make used in rating phrases. These procedures
by stopping too soon. However, even when may, in turn, call as subroutines any of the
an admissible strategy can be constructed, knowledge sources in the system. The atit may not be preferable if it generates tributes include acoustic attributes related
excessive additional search in order to guar- to the input signal, syntactic attributes
antee its admissibility. More discussion of (e.g., mood and number), semantic attrithis issue in speech understanding can be butes such as the representation of the
found in WoLF80, WOOD 77, MosT77, and meaning of the phrase, and discourse attriHAYE80. Discussions of it in more general butes for anaphora and ellipsis. Thus the
cases can be found in P0in,70, HARR74,and phrase itself is the basic unit for integrating
and controlling knowledge-source execuPom.77.
Given that hypotheses are rated by KSs, tion.
The interpreter of these rules (i.e., the
combining on a single hypothesis several
ratings generated by different KSs is a Syntax module) is integrated with the
problem. A similar problem also occurs scheduling components to define a highwithin a KS when constructing a hypothe- level Control Strategy module. Like Hearsis from several lower level hypotheses; the say-II and HWIM,this control module oprating of the new one should reflect the portunistically executes the syntax rules to
combination of ratings of its components. predict new phrases and words from a given
Hearsay-1-:: uses ad hoc schemes for such phrase hypothesis and executes the word
rating combinations [HAYE77d]. HWIM verifier to verify predicted words. This
takes a formal approach, using an applica- module maintains a data structure, the
tion of Bayes' theorem. To implement this, "parse-net," containing all the word and
each KS's ratings are calibrated by using phrase hypotheses constructed, and the at-

HEARSAY-Il / 373

FIGURF 8. HARPY pronunciation network for the word "Please."
(After LowE80.1

tributes and factors associated with each
hypothesis. This data structure is similar to
a Hearsay-II blackboard restricted to the
word and phrase levels. Like the blackboard, it serves to avoid redundant computation and facilitates the detection of
possible island collisions.
As with Hearsay-II and HWIM,the SRI
Control Strategy module is parameterized
to permit a number of different strategies,
such as top-down, bottom-up, island-driving, and left-to-right. Using a simulated
word recognizer, SRI ran a series of experiments with several different strategies.
One of the results, also substantiated by
BBN experiments with HWIM, is that island-driving is inferior to some forms of
left-to-right search. This appears to be in
conflict with the Hearsay-II experimental
results, which show island-driving clearly
superior [LEss77a]. We believe the difference to be caused by the reliability of ratings of the initial islands: Both the HWIM
and SRI experiments used single-word islands, but Hearsay-II uses multiword islands, which produce much higher reliability. (See the discussion at step 6 in Section
1.2 and in HAYE78b.) Single-word island.
driving proved inferior in Hearsay-II as
well.

2.3 CMU's HARPY System
In the systems described so far, knowledge
sources are discernible as active components during the understanding process.
However, if one looks at Hearsay-II,
HWIM,and the SRI system in that order,
there is clearly a progression of increasing
integration of the KSs with the control
structure. The HARPY system [LowE 76,
LowE80] developed at Carnegie-Mellon
University is located at the far extreme of
that dimension: Most of the knowledge is

precompiled into a unified structure representing all possible utterances; a relatively
simple interpreter then compares the spoken utterance against this structure to find
the utterance that matches best. The motivation for this approach is to speed up the
search so that a larger portion of the space
may be examined explicitly. In particular,
the hope is to avoid errors made when
portions of the search space are eliminated
on the basis of characteristics of small partial solutions; to this end, pruning decisions
are delayed until larger partial solutions are
constructed.
To describe HARPY, we describe the
knowledge sources, their compilation_and
the match (search) process. The parameterization and segmentation KSs are identical to those of Hearsay-II [G0LD77,
Giu.,78]; these are not compiled into the
network but, as in the other systems, applied to each utterance as it is spoken. As
in Hearsay-II, the syntax is specified as a
set of context-free production rules;
HARPY uses the same task and grammar
definitions. Lexical knowledge is specified
as a directed pronunciation graph for each
word;for example, Figure 8 shows the graph
for the word "please." The nodes in the
graph are names of the phonelike labels
also generated by the labeler KS. A graph
is intended to represent all possible pronunciations of the word. Knowledge about phonetic phenomena at word junctures is contained in a set of rewriting rules for the
pronunciation graphs.
For a given task language, syntax and
lexical and juncture knowledge are combined by a knowledge compiler program to
form a single large network. First, the grammar is converted into a directed graph, the
"word network," containing only terminal
symbols (i.e., words); because of heuristics

374 / EXPERT SYSTEMS AND Al APPLICATIONS

(SENT)
(SS)
(Q)
(1V1

;;

;

FIGURE 9.

FIGURE 10.

=

[ tSS)
please help(M) I please show (M)(Q)
everything I something
me I us

A tiny example grammar.[After LowE80.1

Word network for example language.[After LowE801

used to compact this network, some of the
constraint of the original grammar may be
lost. Figure 9 shows a toy grammar, and
Figure 10 the resulting word network. Next,
the compiler replaces each word by a copy
of its pronunciation graph, applying the
word-juncture rules at all the word boundaries. Figure 11 shows part of the network
for the toy example. The resulting network
has the name of a segment label at each
node. For the same 1011-word X05 language used by Hearsay-II, the network has
15,000 nodes and took 13 hours of DEC
PDP-10(KL10) processing time to compile.
In the network each distinct path from
the distinguished start node to the distinguished end node represents a sequence of
segments making up a "legal" utterance.
The purpose of the search is to find the
sequence which most closely matches the

FIGURE 11.

segment sequence of the input spoken utterance. For any given labeled segment and
any given node in the network, a primitive
match algorithm can calculate a score for
matching the node to the segment. The
score for matching a sequence of nodes with
a sequence of segments is just the sum of
the corresponding primitive matches.
The search technique used, called beam
search, is a heuristic form of dynamic programming, with the input segments processed one at a time from left to right and
matched against the network. At the beginning of the ith step, the first i — 1 segments
have been processed. Some number of
nodes in the network are active; associated
with each active node is a path to it from
the start node and the total score of the
match between that path and the first
i — 1 segments of the utterance. All nodes

Partial final network for example language.[After LowE80.]

•••

•
••

•••

HEARSAY-Il / 375

in the network that are successors of the computer memory and processing costs
active nodes are matched against the ith continue to decline, so that using larger
segment and become the new active nodes. networks becomes increasingly feasible.
The score for a new active node is the best
HARPY's novel structure is also interpath score that reaches the node at the ith esting in its own right and is beginning to
segment, i.e., the sum of the primitive have effects beyond speech-understanding
match at the segment plus the best path systems. Newell has done a speculative but
thorough analysis of HARPY as a model
score to any of its predecessor nodes.
The best path score among all the new for human speech understanding, using the
active nodes is taken as the target, and any production system formalism [NEwE80];
new active nodes with path scores more Rubin has successfully applied the HARPY
than some threshold amount from the tar- structure to an image-understanding task
get are pruned away. This pruning rule is [Ruin 78].
the heuristic heart of the search algorithm.
It reduces the number of active nodes at 3. SYSTEM PERFORMANCE AND ANALYSIS
each step and thus reduces the amount of
processing time (and storage) needed in the 3.1 Overall Performance of Hearsay-ll
search; typically only about 3 percent of the
nodes in the net need to be matched. Note Overall performance of the Hearsay-II
that the heuristic does not fix the number speech-understanding system at the end of
of active nodes retained at each step but 1976 is summarized in Table 2 in a form
allows it to vary with the density of com- paralleling the goals given in Figure 6.
petitors with scores near the best path.
Thus in highly uncertain regions, many
TABLE 2. HEARSAY-Il PERFORMANCE
nodes are retained, and the search slows
One
down; in places where one path is signifi- Number of
speakers
cantly better than most others, few comComputer terminal room
petitors are kept, and the processing is Environment
(>65 dB)
rapid. The search strategy, therefore, is au- Microphone
Medium-quality, close-talking
tomatically cautious or decisive in response System speaker- 20-30 training utterances
tuning
to the partial results. The threshold, i.e.,
None required
the "beam width," is tuned ad hoc from test Speaker
adaptation
runs.
Task
Document retrieval
There are two major concerns about the Vocabulary
1011 words, with no selection for
phonetic discriminability
extensibility of HARPY. First, the compiContext-free semantic grammar,
lation process requires all knowledge to be Language
constraints
based on protocol analysis, with
represented in a highly stylized form; addstatic branching factor of 10
ing new kinds of knowledge strains the de- Test data
23 utterances, brand-new to the
veloper's ingenuity. So far, however,several
system and run "blind." 7
words/utterance average, 2.6
kinds of knowledge have been added within
seconds/utterance average, avthe basic framework of expanding a node
erage fanout' of 40 (maximum
by replacing it with a graph. For example,
292)
as mentioned previously, phonetic phenom- Accuracy
9 percent sentence semantic error,b 19 percent sentence error
ena at word junctures are handled. Also,
(i.e., not word-for-word correct)
the expected length of each segment is
60 MIPSS (million instructions
stored at each node and influences the Computing
resources
per second of speech) on a 36match score. The second concern is with
bit PDP-10
the size and compilation cost of the com- "The static branching factor is the average number
piled network; both grow very large as the of words that can follow any initial sequence as defined
task language becomes more complex. by the grammar. The fanout is the number of words
There have been proposals that the word that can follow any initial sequence in the test sennetwork not be expanded explicitly, but tences.
b An interpretation is semantically correct if the query
rather that the word pronunciation graphs generated for it by the SEMANT KS is identical to
be interpreted dynamically, as needed. An that generated for a sentence which is word-for-word
alternative response to this concern is that correct.

376 / EXPERT SYSTEMS AND Al APPLICATIONS

one [HAYE77a] the opportunistic scheduling was contrasted with a strategy using no
ordering of KS activations. Here, all KS
precondition procedures were executed,followed by all KS activations they created;
this cycle was repeated. For the utterances
tested, the opportunistic strategy had a 29
percent error rate (word for word), compared with a 48 percent rate for the nonopportunistic. Also, the opportunistic strategy took less than half as much processing
time."
In another experiment [LEss77a] the island-driving strategy, which is opportunistic across the whole utterance, was compared with a left-to-right strategy, in which
the high-level search was initiated from
single-word islands in utterance-initial position. For the utterances tested, the opportunistic strategy had a 33 percent error rate
as compared with 53 percent for the left-toright; for those utterances correctly recogScheduling
3.2 Opportunistic
nized by both strategies, the opportunistic
In earlier KS configurations of the system, one used only 70 percent as much processlow-level processing (i.e., at the segment, ing time.
syllable, and word levels) was not done in
the serial, lock-step manner of steps 1, 4, 3.3 Use of Approximate Knowledge
and 5 of the example, that is, level-to-level,
where each level is completely processed In several places the Hearsay-II system
before work on the next higher level is uses approximate knowledge, as opposed to
begun. Rather, processing was opportunis- its more complete form also included in the
tic and data-directed as in the higher levels; system. The central notion is that even
as interesting hypotheses were generated at though the approximation increases the
one level, they were immediately propa- likelihood of particular decisions being ingated to and processed by KSs operating at correct, other knowledge can correct those
higher and lower levels. We found, however, errors, and the amount of computational
that opportunistic processing at the lower resources saved by first using the approxilevels was ineffective and harmful because mation exceeds that required for subsethe credibility ratings of hypotheses were quent corrections.
The organization of the POM and MOW
insufficiently accurate to form hypothesis
islands capable of focusing the search effec- KSs is an example. The bottom-up syllable
tively. For example, even at the relatively and word-candidate generation scheme aphigh word level, the bottom-up hypotheses proximates WIZARD matching all words in
created by MOW include only about 75 the vocabulary at all places in the utterpercent of the words actually spoken; and ance, but in a fraction of the time. The
the KS-assigned ratings rank each correct errors show up as poor ratings of the canhypothesis on the average about 4.5 as compared with the 20 or so incorrect hypotheses that compete with it (i.e., which
The performance results given here and in the foloverlap it in time significantly). It is only lowing sections reflect various configurations of vocawith the word-sequence hypotheses that bularies, grammars, test data, halting criteria, and
the KSs and underlying systhe reliability of the ratings is high enough states of development of performance
results of each
tem. Thus the absolute
to allow selective search.
experiment are not directly comparable to the perSeveral experiments have shown the ef- formance reported in Section 3.1 or to the results of
fectiveness of the opportunistic search. In the other experiments.
Active development of the Hearsay-II
speech system ceased at the end of 1976
with the conclusion of the speech-understanding program sponsored by DARPA
[MEDR78, KLAT77]. Even though the configuration of KSs at that point was young,
having been assembled in August 1976, the
performance described in Table 2 comes
close to meeting the ambitious goals,shown
in Figure 6, established for the DARPA
program in 1971 [NEwE73]. This overall
performance supports our assertion that
the Hearsay-II architecture can be used to
integrate knowledge for resolving uncertainty. In the following sections we relate
some detailed analyses of the Hearsay-H
performance to the resolution of uncertainty. We finish with some comparison
with the performances of the other systems
described in Section 2.

HEARSAY-II / 377

grammar:

05

15

250 words

err = 5.9 percent
comp = 1.0
fanout 10

err = 20.6 percent
cony = 2.7
fanout = 17

500 words

err = 5.9 percent
comp = 1.1
fanout g. 18

vocabulary

X
1011 words

err = 20.6 percent
comp = 3.4
fanout = 27

err = 11.8 percent
comp = 2.0
fanout = 36

err = = semantic error rate
comp = = average ratio of execution time to that of 505 case, for correct utterances
fanout = = fanout of the test sentences (see note a of Table 2, Section 3.1)
N 34 utterances
FIGURE 12. Hearsay-II performance under varying vocabularies and grammars.

didate words and as missing correct words
among the candidates. The POM-MOW errors are corrected by applying WIZARD to
the candidates to create good ratings and
by having the PREDICT KS generate additional candidates.
Another example is the WORD-SEQ KS.
Recall that it applies syntactic and acoustic-phonetic knowledge to locate sequences
of words within the lattice of bottom-up
words and statistical knowledge to select a
few most credible sequences. The syntactic
knowledge only approximates the full grammar, but takes less than 1 percent as much
processing time to apply. The errors
WORD-SEQ makes because of the approximation (i.e., generating some nongrammatical sequences) are corrected by applying
the full grammatical knowledge of the
PARSE KS, but only on the few, highly
credible sequences WORD-SEQ identifies.
3.4

Adaptability of the Opportunistic
Strategy

The opportunistic search strategy adapts
automatically to changing conditions of uncertainty in the problem-solving process by
changing the breadth of search. The basic
mechanism for this is the interaction between the KS-assigned credibility ratings
on hypotheses and scheduler-assigned
priorities of pending KS activations. When
hypotheses have been rated approximately
equal, KS activations for their extension
are usually scheduled together. Thus where

there is ambiguity among competing hypotheses, the scheduler automatically
searches with more breadth. This delays
the choice among competing hypotheses
until further information is brought to bear.
This adaptiveness works for changing
conditions of uncertainty, whether it arises
from the data or from the knowledge. The
data-caused changes are evidenced by large
variations in the numbers of competing hypotheses considered at various locations in
an utterance, and by the large variance in
the processing time needed for recognizing
utterances. The results of changing conditions of knowledge constraint can be seen
in Figure 12, which shows the results of one
experiment varying vocabulary sizes and
grammatical constraints."
3.5

Performance Comparisons

It is extremely difficult to compare the re-

ported performances of existing speech-understanding systems. Most have operated
in different task environments and hence
can apply different amounts of constraint

"Note that Figure 12 shows imperfect correlation
between fanout and performance; compare, for example, X05 and SF. Fanout is an approximate measure of
language complexity that reflects the average uncertainty between adjacent words. While X05 has a large
fanout, it may be a simpler language to interpret than
SF because most of the fanout is restricted to a few
loci in the language, as opposed to the lower but more
uniform uncertainty of SF.

378 / EXPERT SYSTEMS AND Al APPLICATIONS

GOAL: ACCEPT CONTINUOUS SPEECH FROM MANY COOPERATIVE SPEAKERS,
HARPY:I
13 Male, 2 Female
11841
22
1 Male
Hearsay-II:
' Speakers
tested with
sentences from
1
124
3 Male
HWIM:
11 Male
SDC:
54
GOAL: IN A QUIET ROOM, WITH A GOOD MIC, AND SLIGHT TUNING/SPEAKER.
I 20j
HARPY:I
t
in a computer terminal room,
and
20
training sentences
Hearsay-II:j
with a close-talking mic,
NO
per speaker,
HWIM:
in a quiet room, with a good mic, and
NO
SDC:
GOAL: ACCEPTING 1000 WORDS, USING AN ARTIFICIAL SYNTAX & CONSTRAINING TASK,
iBF = 33 t for document
HARPY:I
1011 words, context-free grammar,
IBF = 3.3, 461
retrieval,
Hearsay-II:
1097 words, restricted ATN grammar,
BF = 196,
for travel planning,
HWIM:
BF = 105,
for data retrieval,
1000 words, context-free grammar,
. SDC:
GOAL: YIELDING <10% SEMANTIC ERROR,IN A FEW TIMES REAL-TIME (=300 MIPSS)
5%
million
HARPY:1
9%,26%
851
28
instructions per
Hearsay-II:
yielding
semantic error, using
56%
500
second of
HWIM:
76%
92
speech (MIPSS)
SDC:
FIGURE 13. Goals and performance for final (1976) DARPA systems.[After Lea79.]

The Hearsay-II and HARPY results are
from the task language to help the problem
solving. Although some progress has been directly comparable, the two systems havmade[Goon76, S0ND78, BAHL78], there is ing been tested on the same tasks using the
no agreed-upon method for calibrating same test data. HARPY's performance here
these differences. Also, the various systems dominates Hearsay-II's in both accuracy
use different speakers and recording con- and computation speed. And, in fact,
ditions. And finally, none of the systems HARPY was the only system clearly to
has reached full maturity; the amount that meet and exceed the DARPA specifications
might be gained by further debugging and (see Figure 6). It is difficult to determine
tuning is unknown, but often clearly sub- the exact reasons for HARPY's higher accuracy, but we feel it is caused primarily by
stantial.
LEA79 contains an extensive description a combination of three factors:
of the systems developed in the DARPA
speech-understanding project and includes (1) Because of its highly compiled efficiency, HARPY can afford to search a
the best existing performance comparisons
relatively
large part of the search space.
and evaluations. Figures 13 and 14, reproIn
particular,
it can continue pursuing
duced here from that report, show some
solutions
even if they contain
partial
comparison of the performances of Hearseveral
low-rated
segments (and its
say-II, HARPY, HWIM,and the SDC syspruning
threshold
is explicitly set to
tem [BERN76].15
ensure this). Thus HARPY is less prone
to catastrophic errors, that is, pruning
away the correct path. Hearsay-II, on
the other hand, cannot afford to delay
pruning decisions as long and thus is
13 Performance of the SRI system is not included bemore likely to make such errors.
cause that system was run only with a simulated
bottom-end. Also, there are slight differences between (2) Some knowledge sources are weaker in
the Hearsay-H perforn
e shown in Figure 13 and
Hearsay-II than in HARPY. In particthat of Section 3.1; the former shows results from the
ular,
Hearsay-II's JUNCT KS has only
official end of the DARPA project in September 1976,
a
weak
model of word juncture phewhile the latter reflects some slight improvements
nomena as compared with the more
made in the subsequent three months.

HEARSAY-II / 379

100

0
10

90
HARPY
HEARSAY-II

80

20
30

70

40

60
ACCURACY
RATE 50
(%)
40

ERROR
50 RATE
(%)
60

HWIM

70

30
•

SDC

20

80

10
0

20

40

80 100 120 140
60
STATIC BRANCHING FACTOR

160

180

90
100
200

FIGURE 14 Effects of static branching factor on recognition error rate.[After LEA79.]

comprehensive and sophisticated juncture rules in HARPY. This disparity is
an accident of the systems' development histories; there is no major conceptual reason why HARPY's juncture
rules could not be employed by Hearsay-II.
(3) HARPY was debugged and tuned much
more extensively than Hearsay-II (or
any of the other DARPA SUSs,for that
matter).This was facilitated by the
lower processing costs for running tests.
It was also helped by fixing the HARPY
structure at an earlier point; HearsayII's KS configuration underwent a massive modification very late in the
DARPA effort, as did HWIM's.
It seems clear that for a performance
system in a task with a highly constrained
and simply structured language, the
HARPY structure is an excellent one. However, as we move to tasks that require more
complex kinds of knowledge to constrain
the search, we expect conceptual difficulties
incorporating those kinds of knowledge into
HARPY's simple integrated network representation.
4. CONCLUSIONS
Hearsay-II represents a new approach to
problem solving that will prove useful in

many domains other than speech. Thus far,
however, we have focused on the virtues,
and limitations, of Hearsay-II as a solution
to the speech-understanding problem per
se. In this section we consider what-Hearsay-II suggests about problem-solving systems in general. To do so, we identify aspects of the Hearsay-II organization that
facilitate development of"expert systems."
Before concluding, we point out some apparent deficiencies of the current system
that suggest avenues of further research. A
more detailed discussion of these issues can
be found in LEss77b.
4.1 Problem-Solving Systems

The designer of a knowledge-based problem-solving system faces several typical
questions, many of which motivate the design principles evolved by Hearsay-II. The
designer must first represent and structure
the problem in a way that permits decomposition. A general heuristic for solving
complex problems is to "divide and conquer" them. This requires methods to factor subproblems and to combine their eventual solutions. Hearsay-II, for example, divides the understanding problem in two
ways: It breaks the total interpretation into
separable hypotheses, and it modularizes
different types of knowledge that can op-

380 / EXPERT SYSTEMS AND Al APPLICATIONS

erate independently and cooperatively.
This latter attribute helps the designer address the second basic question,"How can
I acquire and implement relevant knowledge?" Because knowledge sources operate
solely by detecting and modifying hypotheses on the blackboard, we can develop
and implement each independently. This
allows us to "divide and conquer" the
knowledge acquisition problem.
Two other design questions concern the
description and use of knowledge. First, we
must decide how to break knowledge into
executable units. Second, we must develop
strategies for applying knowledge selectively and efficiently. Choices for these design issues should attempt to exploit
sources ofstructure and constraint intrinsic
to the problem domain and knowledge
available about it. In the current context
this means that a speech-understanding
system should exploit many alternative
types of speech knowledge to reduce uncertainty inherent in the signal. Moreover,the
different types of knowledge should apply,
ideally, in a best-rust manner. That is, the
most credible hypotheses should stimulate
searches for the most likely adjoining hypotheses first. To this end, the Hearsay-II
focusing scheduler considers the quality of
hypotheses and potential predictions in
each temporal interval and then selectively
executes only the most marginally productive KS actions. Accomplishing this type of
control required several new sorts of mechanisms. These included explicit interlinked
hypothesis representations, declarative descriptions of KS stimulus and response
frames, a dynamic problem state description, and a prioritized schedule of pending
KS instantiations.
4.2

Specific Advantages of Hearsay-II
as a Problem-Solving System

solving a problem. This capability especially helps in situationa characterized by
incomplete or uncertain information. Uncertainty can arise from any of a number of
causes, including noisy data, apparent ambiguities, and imperfect or incomplete
knowledge. Each of these departures from
the certainty of perfect information leads
to uncertainty about both what the problem solver should believe and what it
should do next. In such situations finding a
solution typically requires simultaneously
combining multiple kinds of knowledge. Although each type of knowledge may rule
out only a few alternative (competing) hypotheses, the combined effect of several
sources can often identify the single most
credible conclusion.
Multiple Levels of Abstraction

Solving problems in an intelligent manner
often requires using descriptions at different levels of abstraction. After first finding
an approximate or gross solution, a problem
solver may work quickly toward a refined,
detailed solution consistent with the rough
solution. In its use of multiple levels of
abstraction, Hearsay-H provides rudimentary facilities for such variable-granularity
reasoning. In the speech task particularly,
the different levels correspond to separable
domains of reasoning. Hypotheses about
word sequences must satisfy the constraints
of higher level syntactic phrase-structure
rules. Once these are satisfied, testing more
detailed or finely tuned word juncture relations would be justified. Of course the
multiple levels of abstraction also support
staged decision making that proceeds from
lower level hypotheses up to higher levels.
Levels in such bottom-up processing support a different type of function, namely,
the sharing of intermediate results, discussed separately in the following paragraph.

This paper has covered an extensive set of
issues and details. From these we believe
the reader should have gained an appreci- Shared Partial Solutions
ation of Hearsay-H's principal benefits,
The blackboard and hypothesis structures
summarized briefly as follows.
allow the knowledge sources to represent
and share partial results. This proves esMultiple Sources of Knowledge
pecially desirable for complex problems
Hearsay-H provides a framework for di- where no a priori knowledge can reliably
verse types of knowledge to cooperate in foretell the best sequence of necessary de-

HEARSAY-II / 381

cisions. Different attempts to solve the ning the entire interval of speech. By allowsame problem may require solving identical ing information to accumulate in this piecesubproblems. In the six h domain these meal fashion, Hearsay-II provides a conproblems correspond to comparable hy- venient framework for heuristic problem
potheses (same level, type, time). Hearsay- solving. Diverse heuristic methods can conII provides capabilities for the KSs to rec- tribute various types of assistance in the
ognize a hypothesis of interest and to in- effort to eliminate uncertainty, to recognize
corporate it into alternative competing hy- portions of the sequence, and to model the
potheses at higher levels. Subsequent speaker's intentions. Because these diverse
changes to the partial result then propagate methods exist in the form of independent,
to all of the higher level constructs that cooperating KSs, each addition to the curcontain it.
rent problem solution consists simply of an
update to the blackboard.
Independent Knowledge Sources Limited to
Data-Directed Interactions

Opportunistic Problem-Solving Behavior

Separating the diverse sources of knowl- Whenever good algorithms do not exist for
edge into independent program modules solving a problem, we must apply heuristic
provides several benefits. Different people methods or "rules-of-thumb" to search for
can create, test, and modify KSs indepen- a solution. In problems where a large numdently. In addition to the ordinary benefits ber of data exist to which a large number of
of modularity in programming, this inde- alternative heuristics potentially apply, we
pendence allows human specialists (e.g., need to choose each successive action carephoneticians, linguists) to operationalize fully. We refer to a system's ability to extheir diverse types of knowledge without ploit selectively its best data and most
concern for the conceptual framework and promising methods as "opportunistic"
detailed behavior of other possible mod- problem solving [N1178, HAYE7913]. Hearules. Although the programming style and say-II developed several mechanisms to
epistemological nature of several KSs may support such opportunistic behavior. In
vary widely, Hearsay-II provides for all of particular, its focus policies and prioritized
• them a single uniform programming envi- scheduling allocate computation resources
ronment. This environment constrains the first to those KSs that exploit the most
KSs to operate in a data-directed manner— credible hypotheses, promise the most sigreading hypotheses from the blackboard nificant increments to the solution. and use
when situations of interest occur, process- the most reliable and inexpensive methods.
ing them to draw inferences, and recording Similar needs to focus intelligently will
new or modified hypotheses on the black- arise in many comparably rich and complex
board for others to process further. This problem domains.
paradigm facilitates problem-oriented interactions while minimizing complicated Experimentation in System Development
and costly design interactions.
Whenever we attempt to solve a previously
problem, the need for experimenunsolved
Incremental Formation of Solutions
tation arises. In the speech-understanding
Problem solving in Hearsay-II proceeds in- task, for example, we generated several difcrementally through the accretion and in- ferent types of KSs and experimentally
tegration of partial solutions. KSs generate tested a variety of alternative system
hypotheses based on current data and configurations (specific sets of KSs)
knowledge. By integrating adjacent and [LEss7713]. A solution to the overall probconsistent hypotheses into larger compos- lem depended on both developing powerful
ites, the system develops increasingly cred- individual KSs and organizing multiple KSs
ible and comprehensive partial solutions. to cooperate effectively to reduce uncerThese in turn stimulate focused efforts that tainty. These requirements necessitated a
drive the overall system toward the final trial-and-error evaluation of alternative
goal, one most credible interpretation span- system designs. Throughout these explora-

382 / EXPERT SYSTEMS AND Al APPLICATIONS

tions, the basic Hearsay-II structure proved
robust and sufficient. Alternative configurations were constructed with relative ease
by inserting or removing specific KSs.
Moreover, we could test radically different
high-level control concepts (e.g., depth-first
versus breadth-first versus left-to-right
searches) simply by changing the focus policy KS. The need for this kind of flexibility
will probably arise in many future state-ofthe-art problem-solving tasks. To support
this flexibility, systems must be able to
apply the same KSs in different orders and
to schedule them according to varying selection criteria. These requirements directly motivate KS data-directed independence, as well as autonomous scheduling
KSs that can evaluate the probable effects
of potential KS actions. Because it supports
these needs, Hearsay-II provides an excellent environment for experimental research
and development in speech and other complex tasks.
4.3

Disadvantages of the Hearsay-ll
Approach

We can identify two different but related
weaknesses of the Hearsay-II approach to
problem solving. One weakness derives
from the system's generality, and the other
concerns its computational efficiency. Each
of these is considered briefly in turn.
Generality Impedes Specialization and Limits
Power

The Hearsay-II approach suggests a very
general problem-solving paradigm. Every
inference process reads data from the
blackboard and places a new hypothesis
also on the blackboard. Thus blackboard
accesses mediate each decision step. While
this proved desirable for structuring communications between different KSs, it
proved undesirable for most intermediate
decision tasks arising within a single KS.
Most KSs employed private, stylized internal data structures different from the single
uniform blackboard links and hypotheses.
For example,the word recognizer used specialized sequential networks, whereas the
word sequence recognizer exploited a large
bit-matrix of word adjacencies. Each KS
also stored intermediate results, useful for

its own internal searches, in appropriately
distinctive data structures. Attempt3 to
coerce these specialized activities into the
general blackboard-mediated style of Hearsay-II either failed completely or caused
intolerable
performance
degradation
[LEss7713].
interpretive Versus Compiled Knowledge

Hearsay-II uses knowledge interpretively.
That is, it actively evaluates alternative
actions, chooses the best for the current
situation, and then applies the procedure
associated with the most promising KS instantiation. Such deliberation takes time
and requires many fairly sophisticated
mechanisms; its expense can be justified
whenever an adequate, explicit algorithm
does not exist for the same task. Whenever
such an algorithm emerges,equal or greater
performance and efficiency may be obtained by compiling the algorithm and executing it directly. For example,recognizing
restricted vocabulary and grammatical spoken sentences from limited syntax can now
be accomplished faster by techniques other
than those in Hearsay-II. As described in
Section 2.3, by compiling all possible interlevel substitutions (sentence to phrase to
word to phone to segment) into one enormous finite-state Markov network, the
HARPY system uses a modified dynamic
programming search to find the one network,path that most closely approximates
the segmented speech signal. This type of
systematic, compiled, and broad search becomes increasingly desirable as problemsolving knowledge improves. Put another
way,once a satisfactory specific method for
solving any problem is found, the related
procedure can be "algorithmetized," compiled, and applied repetitively. In such a
case the flexibility of a system like HearsayII may no longer be needed.
4.4

Other Applications of the Hearsay-ll
Framework

Both the advantages and disadvantages of
Hearsay-II have stimulated additional research. Several researchers have applied
the general framework to problems outside
the speech domain, and others have begun
to develop successors to the Hearsay-II sys-

HEARSAY-Il / 383

tern. We will briefly discuss one of these
new applications and then mention the
other types of activities underway.
Although the Hearsay-II framework developed around an understanding task, B.
and F. Hayes-Roth et al. have extended
many of its principal features to develop a
model of planning [HAYE79b, HAYE79c].
While understanding tasks require "interpretive" or "analytic" processes, planning belongs to a complementary set of
"generative" or "synthetic" activities. The
principal features of the Hearsay-II system
which make it attractive as a problem-solving model for speech understanding also
suggest it as a model of planning.
The planning application shares all the
principal features of the Hearsay-II system

summarized in Section 4.2, but, as Figure
15 suggests, the planning model differs from
the Hearsay-II framework in several ways.
In particular, the designers found it convenient to distinguish five separate blackboard
"planes," reflecting five qualitatively different sorts of decisions. The Plan plane corresponds most closely to Hearsay-II's single
blackboard, holding the decisions that combine to form a solution to the planning
problem, i.e., what low-level operations can
be aggregated to achieve the high-level outcomes of the plan. These kinds of decisions
in generative tasks can be thought of as the
dual of the successively higher level, more
aggregated hypotheses constituting the
blackboard for interpretation tasks. In the
speech task, corresponding hypotheses ex-

The planning blackboard and the actions of illustrative knowledge sources.[From
HAvE79b.]

FIGURE 15

Director

Referee

EXECUTIVE

META-PLAN

Priorities 4—

Problem Definition

E
E

Administration
Middle
Management

Focus

E

_. Model

Top
Management

Schedule

r

L•i. Policies•
•

j

Compromiser

Evaluation Criteria

Policy Analyst

PLAN ABSTRACTION

E

Errands •

Intentions•

Schemes
:

PLAN

KNOWLEDGE BASE
Goal Setter

Outcomes

Architect

Strategist

Schemer

Designs

•Layout
Pattern
Recognizer

Inventor

Strategies
Tactician

t
i

E

Designer

Procedures

Neighbors 4_
Proximity
Detector

Tactics

Routes

iv—

Wanderer

Operations

384 / EXPERT SYSTEMS AND Al APPLICATIONS

press how low-level segments and phones ized some aspects of meta-planning and
can be aggregated to form the high-level executive control and have treated this type
phrases and sentences intended by the of problem solving within one uniform
speaker. The other four planes of the plan- framework. Nil [N1179] has developed a
ning blackboard hold intermediate deci- system that assists a programmer in develsions that enter into the planning process oping a new special-purpose variant of a
in various ways. For example, based on the Hearsay-II system suitable for some particHearsay-II experience with selective atten- ular new task. Balzer and others [BALz80]
tion strategies, resource allocation strate- have implemented a more formalized, dogies were formalized and associated explic- main-independent version of Hearsay-II
and are applying it to an automatic-proitly with an Executive plane.
Although the planning model is the only gramming-like task. This system uses one
current application of the Hearsay-II blackboard for interpretation and another
framework to generative tasks, several in- for scheduling decisions, in a manner akin
teresting applications that transfer the ap- to that proposed for the Executive decisions
proach to other interpretation problems in the Hayes-Roth planning system. In a
have been made. Rumelhart[RumE76] has similar way, Stefik uses three distinct
proposed to apply the Hearsay-II frame- planes to record the plan, meta-plan, and
work to model human reading behavior. In executive decisions arising in a system that
this application only one blackboard plane incrementally plans genetic experiments
is used,the levels closely approximate those [STEF80].
Lesser and Erman have used Hearsay-II
used in the speech-understanding task, and
many additional KSs are introduced to rep- as a central component in a model for inresent how varying amounts of linguistic terpretation tasks in which the problem
and semantic knowledge affect reading solving is accomplished cooperatively by
skills. Engelmore [ENGE77] and Nii and distributed p.ocessors, each with only a
Feigenbaum [N1178] describe other signal- limited view of the problem and with
intercommunication;
processing applications, namely, protein narrow-bandwidth
crystallography and acoustic signal under- LEss79 describes the model and some valistanding. These applications employ mul- dating experiments using the Hearsay-II
tiple levels and planes appropriate to their speech-understanding system. Hearsay-II
specific domains. Soloway [SoLo77] has has also influenced some attempts at deused the framework in a learning system veloping general techniques for formal dethat develops multilevel models of observed scriptions of complex systems [Fox79a,
game behaviors. Hanson and Riseman Fox79b, LEss80].
We predict that in the future the Hear[HANs78] and Levine [LEv178] have developed systems that mirror the Hearsay-II say-II paradigm will be chosen increasingly
speech-understanding components in the as a m /del of heuristic, knowledge-based
image-understanding task. Arbib [AR.B179] reasoning. Improved compilation techproposes Hearsay-II-based multilevel, in- niques and increased computing power will
cremental problem-solving structures as a further enhance its performance. In the fibasis for neuroscience models, and Norman nal analysis, however, Hearsay-II will be
states that Hearsay-II has been a source of remembered as the first general framework
ideas for theoretical psychology and that it for combining multiple sources of knowl"fulfills [his]. _intuitions about the form of edge, at different levels of abstraction, into
a general cognitive processing structure" a coordinated and opportunistic problem[N0Rm80, p. 383]. Finally, Mann[MANN79] solving system. Such systems seem certain
has adapted the Hearsay-II structure to the to play a significant role in the development
task of interpreting human-machine com- of artificial intelligence.
munication dialogues.
Several researchers have focused efforts
on generalizing, refining, or systematizing APPENDIX. SYSTEM DEVELOPMENT
aspects of the Hearsay-II architecture for
wider application. As previously men- On the basis of our experience with the
tioned, B. and F. Hayes-Roth have formal- Hearsay-I system [REIN:173a, REDD73b], at

HEARSAY-Il / 385

the beginning of the Hearsay-II effort in interaction with other KSs (through the
1973 we expected to require and evolve blackboard). The high-level environment
types of knowledge and interaction patterns also provides mechanisms for KSs to specwhose details could not be anticipated. Be- ify (usually in nonprocedural ways) inforcause of this, the development of the sys- mation used by the kernel when configuring
tem was marked by much experimentation a system, scheduling KS activity, and conand redesign. This uncertainty character- trolling researcher interaction with the sysizes the development of knowledge-based tem.
The knowledge in a KS is represented
systems. Instead of designing a specific
speech-understanding system, we consid- using SAIL data structures and code, in
ered Hearsay-II as a model for a class of whatever stylized form the KS developer
systems and a framework within which spe- chooses. The kernel environment provides
cific configurations of that general model the facilities for structuring the interface
could be constructed and studied [LEss75, between this knowledge and other KSs, via
the blackboard. For example, the syntax
EamA75).
KS contains a grammar for the specialized
high-level
approach
a
On the basis of this
programming system was designed to pro- task language to be recognized; this gramvide an environment for programming mar is coded in a compact network form.
knowledge sources, configuring groups of The KS also contains procedures for
them into systems, and executing them. searching this network, for example, to
Because KSs interact via the blackboard parse a sequence of words. The kernel pro(triggering on patterns, accessing hy- vides facilities (1) for triggering this KS
potheses, and making modifications) and when new word hypotheses appear on the
the blackboard is uniformly structured, KS blackboard, (2) for the KS to read those
interactions are also uniform. Thus one set word hypotheses (in order to find the.seof facilities can serve all KSs. Facilities are quence of words to parse), and (3) for the
KS to create new hypotheses on the blackprovided for
board,indicating the structure of the parse.
• defining levels on the blackboard,
Active development of Hearsay-II ex• configuring groups of KSs into executable tended for three years. About 40 KSs were
systems,
developed, each a one- or two-person effort
• accessing and modifying hypotheses on lasting from two months to three years.
the blackboard,
The KSs range from about 5 to 100 pages
• activating and scheduling KSs,
of source code (with 30 pages typical), and
• debugging and analyzing the perform- each KS has up to about 50 kbytes• of
ance of KSs.
information in its local database.
The kernel is about 300 pages of code,
These facilities collectively form the Hearsay-II "kernel." One can think of the Hear- roughly one-third of which is the declarasay-II kernel as a high-level system for pro- tions and macros that create the extended
gramming speech-understanding systems environment for KSs.The remainder of the
of a type conforming to the underlying code implements the architecture: primarily activation and scheduling of KSs, mainHearsay-II model.
Hearsay-II is implemented in the SAIL tenance of the blackboard, and a variety of
programming system [REts76], an Algol-60 other standard utilities. During the three
dialect with a sophisticated compile-time years of active development, an average of
macro facility as well as a large number of about two full-time-equivalent research
data structures (including lists and sets) programmers were responsible for the imand control modes which are implemented plementation, modification, and maintefairly efficiently. The Hearsay-II kernel nance of the kernel. Included during this
provides a high-level environment for KSs period were a half-dozen major reimpleat compile-time by extending SAIL's data mentations and scores of minor ones; these
types and syntax through declarations of changes usually were specializations or seprocedure calls, global variables, and ma- lective optimizations, designed as expericros. This extended SAIL provides an ex- ence with the system led to a better underplicit structure for specifying a KS and its standing of the usage of the various con-

386 / EXPERT SYSTEMS AND Al APPLICATIONS

structs. During this same period about eight
full-time-equivalent researchers were using
the system to develop KSs.
Implementation of the first version of the
kernel began in the autumn of 1973, and
was completed by two people in four
months. The first major KS configuration,
though incomplete, was running in early
1975. The first complete configuration,
"Cl," ran in January 1976. This configuration had very poor performance, with more
than 90 percent sentence errors over a 250word vocabulary. Experience with this configuration led to a substantially different
KS configuration, "C2," completed in September 1976. C2 is the configuration described in this paper.
Implementing a general framework has a
potential disadvantage: the start-up cost is
relatively high. However, if the framework
is suitable, it can be used to explore different configurations within the model more
easily than if each configuration were built
in an ad hoc manner. Additionally, a natural result of the continued use of any highlevel system is its improvement in terms
of enhanced facilities, increased stability,
reliability, and efficiency, and greater familiarity on the part of the researchers
using it.
Hearsay-II has been successful in this
respect; we believe that the total cost of
creating the high-level system and using it
to develop KS configurations Cl and C2
(and intermediate configurations) was less
than it would have been to generate them
in an ad hoc manner. It should be stressed
that the construction of even one configuration is itself an experimental and evolving
process. The high-level programming system provides a framework, both conceptual
and physical,for developing a configuration
in an incremental fashion. The speed with
which C2 was developed is some indication
of the advantage of this system-design approach. A more detailed description of the
development philosophy and tools can be
found in EamA78, and a discussion of the
relationships between the Cl and C2 configurations can be found in LEss77b.

Group": Christina Adam. Mark Birnbaum, Robert Cronk.
Richard Fennell, Mark Fox. Gregory Gill, Henry Goldt erg.
Gary Goodman, Bruce Lowerre, Paul Masulis. David
McKeown. Jack Mostow, Linda Shockey, Richard Smith. and
Richard Suslick. Daniel Corkill, David Taylor,and the reviewers made helpful comments on early drafts of this paper.
Figure 1 is adapted from A. Newell,"A tutorial on speech
understanding systems," in Speech recognition: Invited papers of the IEEE symposium, D. R. Reddy, Ed., Academic
Press, New York, 1975. Figure 6 is adapted from M.F. Medress
et al., "Speech understanding systems. Report of a steering
committee," Artif Intel!, 9 (1978). Figure 7 is reprinted from
J. J. Wolf and W. A. Woods,"The HW1M speech understandW. A. Lea, Ed.,
ing system," in Trends in speech recognition,W
33 1980, by permission of Prentice-Hall, Inc., Englewood Cliffs,
N.J. Figures 8-11 are reprinted from B. T. Lowerre and R.
Reddy, "The HARPY speech understanding system," in
Trends in speech recognition, W. A. Lea, Ed.,0 1980, by
permission of Prentice-Hall, Inc., Englewood Cliffs, N.J.
Figure 15 originally appeared in B. Hayes-Roth and
F. Hayes-Roth, "A cognitive model of planning," Cognitive
science, 1979, 3 275-310. Able: Publishing Corporation, Norwood, N.J.

REFERENCES
ARBI79
BAHL76

BAHL78

BALT..80

BARN77

BERN76

BURT76
ACKNOWLEDGMENTS
The success of the Hearsay-II project depended on many
persons, especially the following members of the CarnegieMellon University Computer Science Department "Speech

ARBIB, M. A., AND CAPLAN, D. "Neurolinguistics must be computational," Behay. Brain Sci 2,3 (1979).
BAHL, L R., BAKER, J. K., COHEN, P. S.,
DIXON, N. R., JELINEK, F., MERCER, R.
L., AND SILVERMAN, H. F. "Preliminary
results on the performance of a system for
the automatic recognition of continuous
speech," in 1976 IEEE Int. Conf. Acoustics, Speech, and Signal Processing, Philadelphia, Apr. 1976, pp. 425-433.
BAHL, L. R., BAKER, J. K., COHEN, P. S.,
COLE, A. G., JELINEK, F., LEWIS, B. L.,
AND MERCER, R. L "Automatic recognition of continuously spoken sentences
from a finite state grammar," in Proc.
IEEE Int, Con! Acoustics, Speech, and
Signal Processing, Tulsa, Okla., Apr.
1978, pp. 418-421.
BALZER,R.,ERMAN,L D., AND WILLIAMS,
C. Hearsay-III: A domain-independent
base for knowledge-based problem-solving, Tech. Rep., USC/Information Sciences Institute, Marina del Rey, Calif.,
1980. To appear.
BARNETT, J. A., AND BERNSTEIN, M. I.
Knowledge-based systems: A tutorial,
Tech. Rep. TM-(L)-5903/000/00 (NTIS:
AD/A-044-883), System Development
Corp., Santa Monica, Calif., June 1977.
BERNsTEtN, M.I. Interactive systems research: Final report to the Director, Advanced Research Projects Agency, Tech.
Rep. TM-5243/006/00, System Development Corp., Santa Monica, Calif., Sept.
1976.
BURTON, R. R Semantic grammar: An
engineering technique for constructing
natural language understanding systems,
Tech. Rep. BBN Rep. No, 3453, Bolt Beranek and Newman, Cambridge, Mass.,
1976.

HEARSAY-II / 387

CMU77

CR0N77

DUDA78

ENGE77

ERMA75

ERMA78

ERNS69

FRIG71

FRiG77

Fox77

Fox79a

Fox79b

Gru..78

speech, Tech. Rep.CMU-CS-78-134,ComCMU COMPUTER SCIENCE SPEECH
puter g,
ience Dep.. Carnegie-Mellon
GROUP. Summary of the CMU five-year
Univ., 1)
:::.sburgh, Pa., May 1978.
ARPA effort in speech understanding reG0LD77
GOLDBERG, H., REDDY, R., AND GILL, G.
search. Tech. Rep., Computer Science
"The ZAPDASH parameters, feature exDep., Carnegie-Mellon Univ., Pittsburgh,
traction, segmentation, and labeling for
Pa., 1977.
speech
understanding systems," in
CRONR,R. "Word pair adjacency acceptCMU77, pp. 10-11.
ance procedure in Hearsay-II," in CMU77,
GOODMAN, G. Analysis oflanguages for
Goon76
pp. 15-16.
man-machine voice communication,
DUDA, R. 0., HART, P. E., NILSSON, N. J.,
Tech. Rep., Computer Science Dep., CarAND SOUTHERLAND, G. L. "Semantic
negie-Mellon Univ., Pittsburgh, Pa., May
network representation in rule-based in1976.
ference systems," in Pattern-directed inHANSON, A. R., AND RISEMAN, E. M.
ference systems, D. A. Waterman and F. HANS78
"VISIONS: A computer system for interHayes-Roth, Eds., Academic Press, New
preting scenes," in Computer vision sysYork, 1978, pp. 203-222.
tems, A. Hanson and E. Riseman, Eds.,
ENGELMORE, R. S., AND Nu, H. P. A
Academic Press, New York, 1978, pp. 303knowledge-based system for the interpre333.
tation of protein X-ray crystallographic
HARR74
HARRIS, L. R. "The heuristic search undata, Tech. Rep. Stan-CS-77-589, Comder conditions of error," Artif Intel!. 5, 3
puter Science Dep., Stanford Univ., Stan(1974),217-234.
ford, Calif., 1977.
HAYES-ROTH, F., AND MOSTOW, D. J.
HAYE75
ERMAN L. D., AND LESSER, V. R. "A
"An automatically compilable recognition
multi-level organization for problem solvnetwork for structured patterns," in Proc.
ing using many diverse cooperating
4th Int. Jt. Conf. Artificial Intelligence,
sources of knowledge," in Proc.4th Int. Jt.
Tbilisi, USSR, 1975, pp. 246-252.
Conf. Artificial Intelligence, Tbilisi,
HAvE77a HAvEs-ROTH, F., AND LESSER, V. R.
USSR, 1975, pp. 483-490.
"Focus of attention in the Hearsay-II sysERMAN, L. D., AND LESSER, V. R. "System," in Proc. 5th Int. Jt. Conf. Artificial
tem engineering techniques for artificial
Intelligence, Cambridge, Mass., 1977, pp.
intelligence systems," in Computer vision
27-35.
systems, A. Hanson and E. Riseman, Eds.,
HATE77b HAYES-ROTH, F., ERMAN, L. D., Fox, M.,
Academic Press, New York, 1978, pp. 37AND MOSTOW, D. J. "Syntactic process45.
ing in Hearsay-II," in CMU77, pp. 16-18.
ERNST, G., AND NEWELL, A. GPS: A
HAvE77c HAYES-ROTH, F., GILL, G., AND Mosrow,
case study in generality and problem solvD. J. "Discourse analysis and task pering, Academic Press, New York, 1969.
formance in the Hearsay-II speech underFEIGENBAUM, E. A., BUCHANAN, B. G.,
standing system," in CMU77, pp. 24-28.
AND LEDERBERG, J. "On generality and
HAvE77d HAYES-ROTH, F., LESSER, V. R., MosTow,
problem solving: A case study using the
D. J., AND ERMAN, L. D. "Policies for
DENDRAL program," in Machine intelrating hypotheses, halting, and selecting a
ligence 6, D. Michie, Ed., Edinburgh Univ.
solution in Hearsay-II," in CMU77, pp.
Press, Edinburgh, Scotland, 1971.
19-24.
FEIGENBAUM, E. A. "The art of artificial
intelligence: Themes and case studies of HATE78a HAYES-ROTH, F., WATERMAN, D. A., AND
LENAT, D. B. "Principles of pattern-diknowledge engineering," in Proc. 5th Int.
rected inference systems," in Pattern-diJt. Conf. Artificial Intelligence, Camrected inference systems, D. A. Waterman
bridge, Mass., 1977, pp. 1014-1029.
and F. Hayes-Roth, Eds., Academic Press,
Fox, M. S., AND MOSTOW, D. J. "MaxiNew York, 1978.
mal consistent interpretations of errorful
data in hierarchically modelled domains," HAvE78b HAvEs-Rcrrii, F. "The role of partial and
best matches in knowledge systems," in
in Proc. 5th Int. Jt. Conf. Artificial IntelPattern-directed inference systems, D. A.
ligence, Cambridge, Mass., 1977, pp. 65Waterman and F. Hayes-Roth, Eds., Aca171.
demic Press, New York, 1978.
Fox, M. S. "An organizational view of
distributed systems," in Proc. Int. Conf. HATE79a HAYES-ROTH, B., AND HAYES-ROTH, F.
Cognitive processes in planning, Tech.
Systems and Cybernetics, Denver, Colo.,
Rep. R-2366-0NR, The RAND Corp.,
Oct. 1979.
Santa Monica, Calif., 1979.
Fox, M. S. Organization structuring:
Designing large, complex software, Tech. HAvE79b HAYES-ROTH, B., AND HAYES-ROTH, F.
"A cognitive model of planning," CogniRep. CMU-CS-79-115, Computer Science
tive Sci. 3(1979), 275-310.
Dep., Carnegie-Mellon Univ., Pittsburgh,
HATE79C HAYES-ROTH, B., HAYES-ROTH, F., RoPa., 1979.
SENSCHEIN, S., AND CAMMARATA, S.
GILL, G., GOLDBERG, H., REDDY, R., AND
"Modeling planning as an incremental opYEGNANARAYANA, B. A recursive segportunistic process." in Proc. 6th Int. Jt.
mentation procedure for continuous

388 / EXPERT SYSTEMS AND Al APPLICATIONS

HAYE80

ITAK78

Ktar77
LE179

LEA80
LEss75

LEss77a

LEss77b

LEss79

LES..980

LEv178

LOWE76

L0WE80

LOWR80

Computer and Information Sciences,
Conf. Artificial Intelligence, Tokyo. 1979.
Univ. Massachusetts, 1980 (forthcoming).
pp. 375-383.
MANN79 MANN, W. C. "Design for dialogue comHAYES-RCrTH, F. "Syntax, semantics, and
prehension," in 17th Ann. Meeting Assoc.
pragmatics in speech understanding," in
Trends in speech recognition, W. A. Lea,
Computational Linguistics, La Jolla,
Calif., Aug. 1979.
Ed., Prentice-Hall, Englewood Cliffs, N.J.,
1980.
McKE77 McKEowN, D. M. "Word verification in
the Hearsay-II speech understanding sys1TAKURA, F. "Minimum prediction residual principle applied to speech recognitem," in Proc. IEEE Int. Conf. Acoustics,
tion," IEEE Trans. Acoust., Speech, SigSpeech, and Signal Processing, Hartford,
nal Proc. 23 (1975), 67-72.
Conn., 1977, pp. 795-798.
KLATT, D. H. "Review of the ARPA
MEDR78 MEDRESS, M. F., COOPER, F. S., FORGIE,
speech understanding project," J. Acoust.
J. W., GREEN, C. C., KLATT, D. H.,
Soc. Am.62 (Dec. 1977), 1345-1366.
O'MALLEY, M. H., NEUBURG, E. P., NEWLEA, W. A., AND SHOUP, J. E. Review of
ELL, A., REDDY, D. R., RITEA, B., SHOUPthe ARPA SUR Project and survey of
HUMMEL, J. E., WALKER, D. E., AND
current technology in speech understandWOODS, W. A. "Speech understanding
in,g, Final Rep., Office of Naval Research
systems: Report of a steering committee,"
Contract No. N00014-77-C-0570, Speech
Artif. Intel!. 9(1978), 307-316.
Communications Research Lab., Los An- Morel?
Mos-row, D. J. "A halting condition and
geles, Calif., Jan. 1979.
related pruning heuristic for combinatorial
LEA, W. A., ED. Trends in speech recsearch," in CMU77, pp. 158-166.
ognition, Prentice-Hall, Englewood Cliffs, NEwE69 NEWELL, A. "Heuristic programminj:
N.J., 1980.
Ill-structured problems," in Progress in
LESSER, V. R., FENNELL, R. D., ERMAN,
operations research 3, J. Aronofsky, Ed.,
L. D., AND REDDY, D. R. "Organization
Wiley, New York, 1969, pp. 360-414.
of the Hearsay-II speech understanding NEwE73 NEWELL, A., BARNETT, J., FORGIE, J.,
system," IEEE Trans. Acous., Speech,
GREEN, C., KLATT, D., LICKLIDER, J. C.
Signal Proc. 23 (1975), 11-23.
R., MUNSON, J., REDDY, R., AND WOODS,
LESSER, V. R., HAYEs-ROTH, F., BIRNW. Speech understanding systems: FiBAUM, M., AND CRONK, R. "Selection of
nal report of a study group, North-Holword islands in the Hearsay-II speech unland, Amsterdam, 1973.
derstanding system," in Proc. IEEE Int. NEWE75 NEWELL, A., "A tutorial on speech unConf. Acoustics, Speech, and Signal Proderstanding systems," in Speech recognicessing, Hartford, Conn., 1977, pp. 791tion: Invited papers of the IEEE sympo794.
sium, D. R. Reddy, Ed., Academic Press,
LESSER, V. R., AND ERMAN, L. D. "A
New York, 1975, pp. 3-54.
retrospective view of the Hearsay-II ar- NEwE77 NEWELL, A., McDEnmorr, J., AND FORchitecture," in Proc. 5th Int. Joint Conf.
GIE, C. Artificial intelligence: A self
Artificial Intelligence, Cambridge, Mass.,
paced introductory course, Computer Sci1977, pp. 790-800.
ence Dep., Carnegie-Mellon Univ., Pittsburgh, Pa., 1977.
LESSER, V. R., AND ERMAN, L. D. "An
experiment in distributed interpretation," NEWE80 NEWELL, A. "HARPY, production systems and human cognition," in Perception
in 1st Int. Conf. Distributed Computing
and production offluent speech, R. Cole,
Systems,IEEE Computer Society, HuntsEd., L. Erlbaum, Hillsdale, N.J., 1980,
ville, Ala., Oct. 1979, pp. 553-571.
Chap. 11.
LESSER, V. R., PAVLIN, J., AND REED,
Nit, H. P., AND FEIGENBAUM, E. A.
S. Quantifying and simulating the be- N1178
"Rule-based understanding of signals," in
havior ofknowledge-based systems,Tech.
_ Pattern-directed inference systems, D. A.
Rep., Dep. Computer and Information SciWaterman and F. Hayes-Roth, Eds., Acaences, Univ. Massachusetts, Amherst,
demic Press, New York, 1978.
Mass., 1980.
Nil, H. P., AND AIELLO, N. "AGE (AtLEVINE, M. D. "A knowledge-based N1179
tempt to Generalize): A knowledge-based
computer vision system," in Computer viprogram for building knowledge-based
sion systems, A. Hanson and E. Riseman,
programs," in Proc. 6th Int. Jt. Conf. ArEds., Academic Press, New York, 1978, pp.
tificial Intelligence, Tokyo, Feb. 1979, pp.
335-352.
645-655.
LOWERRE, B. T. The HARPY speech
NILSSON, N. Problem-solving methods
recognition system, Ph.D. thesis, Com- NILS7I
in artificial intelligence, McGraw-Hill,
puter Science Dep., Carnegie-Mellon
New York, 1971.
Univ., Pittsburgh, Pa., 1976.
LOWERRE, B. T., AND REDDY, R. "The Noam80 NORMAN,D. A. "Copycat science or does
the mind really work by table look-up?,"
HARPY speech understanding system," in
in Perception and production of fluent
Trends in speech recognition, W. A. Lea,
speech, R. Cole, Ed., L. Erlbaum, HillsEd., Prentice-Hall, Englewood Cliffs, N.J.,
dale, N.J., 1980, Chap. 12.
1980, Chap. 15.
LOWRANCE, J. Dependence-graph models POHL70
POHL, I. "First results on the effects of
of evidential support, Ph.D. thesis, Dep.
error in heuristic search," in Machine in-

HEARSAY-II / 389

Pa.. 1977.
telligence 5, B. Meltzer and D. Michie,
SMITH, A.- R., AND ERMAN, L. D.
Eds., Edinburgh Univ. Press, Edinburgh, Ssirr81
"NOAH: A bottom-up word hypothesizer
Scotland, 1970.
for large-vocabulary speech-understandP0HL77
POHL, I. "Practical and theoretical coning systems," IEEE Trans. Pattern Anal.
siderations in heuristic search algorithms,"
Mach. Intell. (1981). to be published.
in Machine intelligence 8, E. Elcock and
SOLOWAY, E. M., AND RISEMAN, E. M.
SOL077
D. Michie, Eds., Ellis Horwood, Chichester, England, 1977.
"Levels of pattern description in learning,"
in Proc. 5th Int. J. Cont Artificial IntelREDD73a REDDY, D. R., ERMAN, L. D., AND NEELY,
R.B. "A model and a system for machine
ligence, Cambridge, Mass., 1977, pp. 801recognition of speech," IEEE Trans. Au811.
SONDHI, M. M., AND LEVINSON, S. E.
dio and Electroacoustics AU-21 (1973), S0ND78
"Computing relative redundancy to mea229-238.
sure grammatical constraint in speech recREDD73b REDDY,D. R., ERMAN,L. D., FENNELL, R.
ognition tasks." in Proc. IEEE Int. Conf.
D., AND NEELY, R. B. "The Hearsay
Acoustics, Speech, and Signal Processspeech understanding system: An example
ing, Tulsa, Okla., Apr. 1978.
of the recognition process," in Proc. 3rd
STEFIK, M. Planning with constraints,
Int. Jt. Conf. Artificial Intelligence, Stan- STEF80
Ph.D. thesis, Computer Science Dep.,
ford, Calif., 1973, pp. 185-193.
Stanford Univ., Stanford, Calif., Jan. 1980.
REDDY, D. R., ED. Speech recognition:
REDD75
Invited papers presented at the 1974 WALK78 WALKER,D. E., ED. Understanding spoken language, Elsevier North-Holland,
IEEE Symposium, Academic Press, New
York, 1975,
New York, 1978.
REDD78
REDDY, D. R. "Speech recognition by WALK80 WALKER, D. E. "SRI research on speech
understanding," in Trends in speech recmachine: A review," Proc. IEEE 64 (Apr.
1976), 501-531.
ognition, W. A. Lea, Ed., Prentice-Hall,
Englewood Cliffs, N.J., 1980, Chap. 13.
REIS78
REISER, J. F. SAIL, Tech. Rep. AIM.
WOLF, J. J., AND WOODS, W. A. "The
289, Al Lab., Stanford Univ., Stanford, WOLFS°
HWIM speech understanding system," in
Calif., 1976.
Trends in speech recognition, W. A. Lea,
Rue178
RUBIN, S. The ARGOS image understanding system. Ph.D. thesis, Computer
Ed., Prentice-Hall, Englewood Cliffs, N.J.,
1980, Chap. 14.
Science Dep., Carnegie-Mellon Univ.,
network
WOODS, W. A. "Transition
Pittsburgh, Pa., 1978.
WOOD70
RumE76 RUPAELHART, D. E. Toward an interacgrammars for natural language analysis,"
tive model ofreading, Tech. Rep. 56, CenCommun. ACM 13, 10 (Oct. 1970), 591ter for Human Information Processing,
606.
Univ. California, San Diego, 1976.
WO0D73 WOODS, W. A., AND MAKHOUL, J.
SscE74
SACERDOTI, E. E. "Planning in a hierar"Mechanical inference problems in continchy of abstraction spaces," Artif. Intel!. 5
uous speech understanding," in Proc. 3rd
(1974), 115-135.
Int. Jt. Conf. Artificial Intelligence, StanSH0R75
SHORTLIFFE, E. H., AND BUCHANAN, B.
ford, Calif., 1973, pp. 73-91, also Artif.
G. "A model of inexact reasoning in medIntel!. 5, 1 (Spring 1974), 73-91.
icine," Math. Bio. Sci. 23 (1975).
W00076 WOODS, W., BATES, M., BROWN, G.,
SHORTLIFFE, E. Computer-based mediSH0R78
BRUCE, B., COOK, C., KLOVSTAD,J., MAKcal consultation: MYCIN, Elsevier, Ne'w
HOUL, J., NASH-WEBBER, B., SCHWARTZ,
York, 1976.
R., WOLF,J., AND ZUE, V. Speech underSMITH, A. R. "Word hypothesization in
SMIT76
standing systems: Final technical progthe Hearsay-II speech system," in Proc.
ress report, Tech. Rep. 3438, Bolt Beranek
IEEE Int. Conf. Acoustics, Speech, and
and Newman, Cambridge, Mass., Dec.
Signal Processing, Philadelphia, Pa.,
1976 (in five volumes).
1976, pp. 549-552.
WOOD77 WOODS, W. A. "Shortfall and density
SmIT77
Shunt, A. R. Word hypothesization for
scoring strategies for speech understandlarge-vocabulary speech understanding
ing control," in Proc. 5th Int. Jt. Conf.
systems, Ph.D. thesis, Computer Science
Artificial Intelligence, Cambridge, Mass.,
Dep., Carnegie-Mellon Univ., Pittsburgh,
1977, pp. 13-26. •

