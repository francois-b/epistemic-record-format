Computer Science > Computer Vision and Pattern Recognition

arXiv:2505.17973 (cs)

[Submitted on 23 May 2025]

Title:To Glue or Not to Glue? Classical vs Learned Image Matching for Mobile Mapping Cameras to Textured Semantic 3D Building Models

Authors:Simone Gaisbauer, Prabin Gyawali, Qilin Zhang, Olaf Wysocki, Boris Jutzi

View a PDF of the paper titled To Glue or Not to Glue? Classical vs Learned Image Matching for Mobile Mapping Cameras to Textured Semantic 3D Building Models, by Simone Gaisbauer and 4 other authors

View PDF HTML (experimental)

  Abstract:Feature matching is a necessary step for many computer vision and photogrammetry applications such as image registration, structure-from-motion, and visual localization. Classical handcrafted methods such as SIFT feature detection and description combined with nearest neighbour matching and RANSAC outlier removal have been state-of-the-art for mobile mapping cameras. With recent advances in deep learning, learnable methods have been introduced and proven to have better robustness and performance under complex conditions. Despite their growing adoption, a comprehensive comparison between classical and learnable feature matching methods for the specific task of semantic 3D building camera-to-model matching is still missing. This submission systematically evaluates the effectiveness of different feature-matching techniques in visual localization using textured CityGML LoD2 models. We use standard benchmark datasets (HPatches, MegaDepth-1500) and custom datasets consisting of facade textures and corresponding camera images (terrestrial and drone). For the latter, we evaluate the achievable accuracy of the absolute pose estimated using a Perspective-n-Point (PnP) algorithm, with geometric ground truth derived from geo-referenced trajectory data. The results indicate that the learnable feature matching methods vastly outperform traditional approaches regarding accuracy and robustness on our challenging custom datasets with zero to 12 RANSAC-inliers and zero to 0.16 area under the curve. We believe that this work will foster the development of model-based visual localization methods. Link to the code: this https URL\_Glue\_or\_not\_to\_Glue

+-----------------------------------+---------------------------------------------------------------------------+
| Comments:                         | Accepted to MMT, Xiamen, China; ISPRS Annals                              |
+-----------------------------------+---------------------------------------------------------------------------+
| Subjects:                         | Computer Vision and Pattern Recognition (cs.CV); Machine Learning (cs.LG) |
+-----------------------------------+---------------------------------------------------------------------------+
| Cite as:                          | arXiv:2505.17973 [cs.CV]                                                  |
+-----------------------------------+---------------------------------------------------------------------------+
|                                   | (or arXiv:2505.17973v1 [cs.CV] for this version)                          |
+-----------------------------------+---------------------------------------------------------------------------+
|                                   | https://doi.org/10.48550/arXiv.2505.17973                                 |
|                                   |                                                                           |
|                                   | [] Focus to learn more                                                    |
|                                   |                                                                           |
|                                   | arXiv-issued DOI via DataCite                                             |
+-----------------------------------+---------------------------------------------------------------------------+

Submission history

From: Olaf Wysocki [view email]
[v1] Fri, 23 May 2025 14:41:41 UTC (10,652 KB)

Full-text links:

Access Paper:

- View a PDF of the paper titled To Glue or Not to Glue? Classical vs Learned Image Matching for Mobile Mapping Cameras to Textured Semantic 3D Building Models, by Simone Gaisbauer and 4 other authors

- View PDF

- HTML (experimental)

- TeX Source

[license icon] view license

Current browse context:

cs.CV

< prev   |   next >

new | recent | 2025-05

Change to browse by:

cs
cs.LG

References & Citations

- NASA ADS
- Google Scholar
- Semantic Scholar

export BibTeX citation

Loading...

BibTeX formatted citation

×

Data provided by:

Bookmark

[BibSonomy] [Reddit]

Bibliographic Tools

Bibliographic and Citation Tools

Bibliographic Explorer Toggle

Bibliographic Explorer (What is the Explorer?)

Connected Papers Toggle

Connected Papers (What is Connected Papers?)

Litmaps Toggle

Litmaps (What is Litmaps?)

scite.ai Toggle

scite Smart Citations (What are Smart Citations?)

Code, Data, Media

Code, Data and Media Associated with this Article

alphaXiv Toggle

alphaXiv (What is alphaXiv?)

Links to Code Toggle

CatalyzeX Code Finder for Papers (What is CatalyzeX?)

DagsHub Toggle

DagsHub (What is DagsHub?)

GotitPub Toggle

Gotit.pub (What is GotitPub?)

Huggingface Toggle

Hugging Face (What is Huggingface?)

ScienceCast Toggle

ScienceCast (What is ScienceCast?)

Demos

Demos

Replicate Toggle

Replicate (What is Replicate?)

Spaces Toggle

Hugging Face Spaces (What is Spaces?)

Spaces Toggle

TXYZ.AI (What is TXYZ.AI?)

Related Papers

Recommenders and Search Tools

Link to Influence Flower

Influence Flower (What are Influence Flowers?)

Core recommender toggle

CORE Recommender (What is CORE?)

- Author
- Venue
- Institution
- Topic

[]

[]

[]

[]

About arXivLabs

arXivLabs: experimental projects with community collaborators

arXivLabs is a framework that allows collaborators to develop and share new arXiv features directly on our website.

Both individuals and organizations that work with arXivLabs have embraced and accepted our values of openness, community, excellence, and user data privacy. arXiv is committed to these values and only works with partners that adhere to them.

Have an idea for a project that will add value for arXiv's community? Learn more about arXivLabs.

[]

Which authors of this paper are endorsers? | Disable MathJax (What is MathJax?)
