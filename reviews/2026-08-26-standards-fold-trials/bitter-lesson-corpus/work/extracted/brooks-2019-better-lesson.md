Post: A Better Lesson

March 19, 2019 — Reviews

A Better Lesson

[]

rodneybrooks.com/a-better-lesson/

Just last week Rich Sutton published a very short blog post titled  The Bitter Lesson. I’m going to try to keep this review shorter than his post. Sutton is well known for his long and sustained contributions to reinforcement learning.

In his post he argues, using many good examples, that over the 70 year history of AI, more computation and less built in knowledge has always won out as the best way to build Artificial Intelligence systems. This resonates with a current mode of thinking among many of the newer entrants to AI that it is better to design learning networks and put in massive amounts of computer power, than to try to design a structure for computation that is specialized in any way for the task. I must say, however, that at a two day work shop on Deep Learning last week at the National Academy of Science, the latter idea was much more in vogue, something of a backlash against exactly what Sutton is arguing.

I think Sutton is wrong for a number of reasons.

1.  One of the most celebrated successes of Deep Learning is image labeling, using CNNs, Convolutional Neural Networks, but the very essence of CNNs is that the front end of the network is designed by humans to manage translational invariance, the idea that objects can appear anywhere in the frame. To have a Deep Learning network also have to learn that seems pedantic to the extreme, and will drive up the computational costs of the learning by many orders of magnitude.
2.  There are other things in image labeling that suffer mightily because the current crop of CNNs do not have certain things built in that we know are important for human performance. E.g., color constancy. This is why the celebrated example of a traffic stop sign with some pieces of tape on it is seen as a 45 mph speed limit sign by a certain CNN trained for autonomous driving. No human makes that error because they know that stop signs are red, and speed limit signs are white. The CNN doesn’t know that, because the relationship between pixel color in the camera and the actual color of the object is a very complex relationship that does not get elucidated with the measly tens of millions of training images that the algorithms are trained on. Saying that in the future we will have viable training sets is shifting the human workload to creating massive training sets and encoding what we want the system to learn in the labels. This is just as much building knowledge in as it would be to directly build a color constancy stage. It is sleight of hand in moving the human intellectual work to somewhere else.
3.  In fact, for most machine learning problems today a human is needed to design a specific network architecture for the learning to proceed well. So again, rather than have the human build in specific knowledge we now expect the human to build the particular and appropriate network, and the particular training regime that will be used. Once again it is sleight of hand to say that AI succeeds without humans getting into the loop. Rather we are asking the humans to pour their intelligence into the algorithms in a different place and form.
4.  Massive data sets are not at all what humans need to learn things so something is missing. Today’s data sets can have billions of examples, where a human may only require a handful to learn the same thing. But worse, the amount of computation needed to train many of the networks we see today can only be furnished by very large companies with very large budgets, and so this push to make everything learnable is pushing the cost of AI outside that of individuals or even large university departments. That is not a sustainable model for getting further in intelligent systems. For some machine learning problems we are starting to see a significant carbon foot print due to the power consumed during the learning phase.
5.  Moore’s Law is slowing down, so that some computer architects are reporting the doubling time in amount of computation on a single chip is moving from one year to twenty years. Furthermore the breakdown of Dennard scaling back in 2006 means that the power consumption of machines goes up as they perform better, and so we can not afford to put even the results of machine learning (let alone the actual learning) on many of our small robots–self driving cars require about 2,500 Watts of power for computation–a human brain only requires 20 Watts. So Sutton’s argument just makes this worse, and makes the use of AI and ML impractical.
6.  Computer architects are now trying to compensate for these problems by building special purpose chips for runtime use of trained networks. But they need to lock in the hardware to a particular network structure and capitalize on human analysis of what tricks can be played without changing the results of the computation, but with greatly reduced power budgets. This has two drawbacks. First it locks down hardware specific to particular solutions, so every time we have a new ML problem we will need to design new hardware. And second, it once again is simply shifting where human intelligence needs to be applied to make ML practical, not eliminating the need for humans to be involved in the design at all.

So my take on Rich Sutton’s piece is that the lesson we should learn from the last seventy years of AI research is not at all that we should just use more computation and that always wins. Rather I think a better lesson to be learned is that we have to take into account the total cost of any solution, and that so far they have all required substantial amounts of human ingenuity. Saying that a particular solution style minimizes a particular sort of human ingenuity that is needed while not taking into account all the other places that it forces human ingenuity (and carbon footprint) to be expended is a terribly myopic view of the world.

This review, including this comment, is seventy six words shorter than Sutton’s post.

Categories: Reviews

9 comments on “A Better Lesson”

1.  [] Thomas Dietterich says:

    March 19, 2019 at 9:54 pm

    Rod and Rich are both right. Rich is right that we have achieved significant advances in performance by replacing (some kinds of) human engineering with machine learning from big data. In computer vision, the big lesson from SIFT and HoG descriptors was that trying to design them by hand was not as good as using machine learning to learn large filter banks. Rod is right that we need to find better ways of encoding knowledge into network structure (or other prior constraints). Many groups are working on encoding rotation, scale, and (partial) viewpoint invariance, for example. The trick is to encode knowledge in a way that constrains incorrect solutions but not correct solutions. It is not at all obvious how to do that. I suspect that as we figure out ways to do encode some constraints, there will always be other constraints that we can only encode via training examples. So the top-performing systems will always combine knowledge engineering with brute force.

    Reply

2.  [] Scott says:

    March 19, 2019 at 10:51 pm

    Question re. the power consumption of 20W vs. 2500W. That’s roughly a factor of 100. One common statistic is that human training requires approximately 10,000 hours to achieve mastery. Compress this down to a few hours or even a few days for typical machine learning training times. Are not the actual energy consumptions essentially the same, between human and machine?

    Reply

    1.  [] Rodney Brooks says:

        March 20, 2019 at 12:13 pm

        The 10,000 hour number is to become (roughly) a domain expert in something (e.g., playing the piano, or being a programmer). Children learn lots of concepts in just a few seconds that take millions of examples and hundreds of thousands of repeats for some deep learning systems.

        Reply

3.  [] Gleb Chuvpilo says:

    March 20, 2019 at 12:18 am

    Professor, I completely agree with your reasoning, but I’d like to expand this part of your argument further: “for most machine learning problems today a human is needed to design a specific network architecture for the learning to proceed well.”

    It seems that the predominant conventional belief is that the progress in AI is automatic, and it is often compared to the discovery of the steam engine (Erik Brynjolfsson) or electricity (Andrew Ng). Some (Kai-Fu Lee) even go as far as saying that the era of discovery in AI is over, and we have entered the new era of commercialization (hence Made in China 2025 plan simply calls for more of the same, i.e. more manufacturing robots and more facial recognition). I believe nothing is further from the truth, and agree with [1] that states that “AI’s greatest economic impact will come from its potential as a new method of invention that ultimately reshapes the nature of the innovation process and the organization of R&D”, thus crushing Eroom’s law [2] that has been hanging over technological progress and total factor productivity over last 40+ years.

    However, there are two seemingly hopeless problems with using AI in R&D. First, today’s AI is all about pattern matching, not creativity: from object recognition in images to speech understanding and machine translation, the focus has been on machine learning of human skills and automation of human jobs, not coming up with new ideas. Second, today we treat AI as a hammer in search of a nail, and hence obsess over any discipline that throws off big data, such as advertising, intelligent vehicles, large corpora of text, games, etc. This approach breaks down when dealing with enormous search spaces in chemistry and biology, such as drug discovery in the universe of 10^60 potential molecules, making sense of gene regulation or mapping of mammalian metabolic pathways.

    My answer to both problems is to redefine AI as IA, or Intelligence Amplification, a term invented along with the now-forgotten science of Cybernetics by Norbert Wiener and Ross Ashby in the 1940s and 1950s. They argued that the role of machines was to amplify human intelligence, augment human decision-making and, thus, improve human productivity. In Cybernetics, the human was never supposed to be automated away. Unfortunately, as you taught us in 6.836, Cybernetics fell out of favor after the seminal Dartmouth Workshop of 1956 founded the field of AI that aimed to build thinking machines that would eventually succeed at stacking geometric shapes using logic programming but fail miserably in the messy world of humans.

    I would argue that the necessary condition for a successful IA process is the presence of the trifecta of (1) domain experts (chemists, biologists, etc.), (2) algorithms experts, and (3) powerful specialized machines. Together, domain experts and algorithms experts can co-invent a specific network architecture and then train it on fast machines, which is exactly your argument. I think this co-invention aspect puts the debate with Rich Sutton to rest since he doesn’t leave any space for the human in the loop.

    References

    1. https://www.technologyreview.com/s/612898/ai-is-reinventing-the-way-we-invent/
    2. https://en.wikipedia.org/wiki/Eroom%27s_law

    Sincerely,

    Gleb Chuvpilo

    PS In case you are nostalgic about Subsumption Architecture (I know I am!):
    https://people.csail.mit.edu/chuvpilo/papers/chuvpilo-2002-6.836-project.pdf

    Reply

4.  [] Nigel Seel says:

    March 20, 2019 at 5:35 am

    An obvious point which perhaps bears repeating. Hundreds of millions of years of biological evolution were required to genetically encode the complex modular brain architectures of higher animals, including humans. The brain is not three pounds of undifferentiated porridge, not a tabula rasa at birth. Researching the set of diverse ecological specifications underpinning situated human social agency should be a priority, not something to be ignored. Have we forgotten what David Marr argued for in “Vision”?

    Reply

5.  [] Michael says:

    March 20, 2019 at 5:36 am

    Rodney,

    Excellent article, very thought-provoking.

    I recently ran some code on an AWS P2.16xlarge EC2 instance, running 16xNVIDIA Tesla K80 GPUs. I believe each GPU consumes 300w of power. So 16×300=4.8Kw in total. The electric fire in my lounge at home has a max output of 3Kw.

    How much power does the AI industry consume annually? Year on year how much has it grown by? Does the slow down of Moores Law mean we’ve finally reached a hardware impasse? So AI will not become the ubiquitous technology as so vehemently promised.

    Do you envision more human intelligence being hard-coded into AI? So from here on the goal will shift from general to highly specialised AI, what we’ve had all along I’d argue. Will more, not less human interventions be needed to keep the AI optimised and the costs down? or is hardware cheaper than humans?

    Thanks

    Reply

6.  [] Santosh Ananthraman says:

    March 20, 2019 at 7:00 am

    Well said, Rod!

    Pre-engineering the “first principles” of an underlying problem directly into a learning model seems to be a big no-no these days. It is more of the fire-and-forget approach which is well suited for a “reflexive” approach to computation rather than a “declarative” one. People forget to use a subsumptive hierarchy where one could easily engineer a system to have CNNs and other reflexive processes at the sensory ends of an architecture and then have them subsume into an upper level declarative end. Also why re-invent all of signal and image processing (example, filtering, feature detection, translation scale invariance etc..) with the gobledegook of the convolution layers.

    I guess it is because a CNN is an easy to use, one-size-fits-all, mousetrap.

    Reply

7.  [] Eric Olsen says:

    March 20, 2019 at 9:25 am

    Hi Rodney,
    I have commented on each number as best I could:
    1. I agree. There is a lot of redundant information in a training set that attempts to address simple image transformations such as linear and rotational translation. This may be a big waste. However, I’m sure the CNN people would argue that their “math” represents a linear separation in multiple dimensions, thereby inherently solving that problem.
    2. Not sure, Rodney. I would agree that color processing is extremely complex, and may not be readily handled by CNNs. However, once again, its the pre-processing of an image and the extraction of features that don’t make much sense to humans that the CNN is being trained for. Color has an extra dimension of information, and so feature extraction from this map to a standard 2-D image map might be a bit tricky, but certainly not impossible. Good point.
    3. I’m an engineer. I think boundary conditions first. IN my feeble AI knowledge, that means the “framework” for logic and learning, i.e., the intrinsic “given” information. You’re right Rodney. But let’s not take too much credit here, I think the CNN guys are doing it, but not acknowledging that at least at some place, its there in their system , just not as pronounced.
    4. I like your last points here. Yes, the cost of AI R&D is growing too high. And governments like China are funding directly. The top three AI companies in US spent about 50 billion in one year in R&D, much of it in AI. I would offer a little hope for your students … develop something out of the box that is really needed, and if people need it, your effort can amortized against the R&D budgets of the big guys. But develop your well written patents first!
    5. Rodney, you’re right. But as you know, a lot of others realize the power cost of AI is staggering, and so it is “Efficiency” that we need to work towards. (another soaring carbon source that everyone wants, and everyone is ignoring). Let me introduce a thought … computation is digital arithmetic. Elon Musk is right to describe this sort of “computational AI” as “digital intelligence”. Laboratory solutions for AI not employing digital arithmetic might soon proliferate, making this distinction even more important. But back to my point … we must make digital arithmetic more efficient, that’s what I’m working on.
    6. I don’t agree here Rodney. General purpose CPU’s is what we’ve been using all along. GPU’s have demonstrated their place, but they are still using floating point units. As a guru of computer history, there was a big argument as to whether computers should employ floating point versus fixed-point arithmetic. This argument goes back to the days of John von Neumann. What happened was that computer scientists relieved themselves of having to worry about arithmetic coding if they used the power floating-point unit. We all got stupid about this every since. The floating point unit is very powerful and flexible, but is terribly in-efficient. But fixed point array processors, and specialized hardware matrix multipliers (TPUs) can be utilized by software solutions to bring efficiency way up.

    Reply

8.  [] JRStern says:

    March 20, 2019 at 11:13 am

    I’d like to come down firmly on both sides of this argument. Sutton is historically right, and looking back we can see that a lot of early AI, across the board, was far too small-scale, because of the nature of computing resources back in the day. And yet Brooks is right, too, and if we need 2500 watts to equal the neural processing power of a moth, we’re still missing the trick.

    I believe the classic analysis is that both hardware and software evolve in tandem, and perhaps they both have a long ways to go.

    Reply

Comment on this Cancel reply

Your email address will not be published. Required fields are marked *

Comment

Name *

Email *

Website

Post navigation

Previous Previous post: Predictions Scorecard, 2019 January 01

Next Next post: AGI Has Been Delayed
