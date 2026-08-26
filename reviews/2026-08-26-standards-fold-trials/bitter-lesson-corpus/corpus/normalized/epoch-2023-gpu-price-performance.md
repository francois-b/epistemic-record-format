Executive Summary

Using a dataset of 470 models of graphics processing units (GPUs) released between 2006 and 2021, we find that the amount of floating-point operations/second per $ (hereafter FLOP/s per $) doubles every ~2.5 years. For top GPUs at any point in time, we find a slower rate of improvement (FLOP/s per $ doubles every 2.95 years), while for models of GPU typically used in ML research, we find a faster rate of improvement (FLOP/s per $ doubles every 2.07 years). GPU price-performance improvements have generally been slightly slower than the 2-year doubling time associated with Moore’s law, much slower than what is implied by Huang’s law, yet considerably faster than was generally found in prior work on trends in GPU price-performance. We aim to provide a more precise characterization of GPU price-performance trends based on more or higher-quality data, that is more robust to justifiable changes in the analysis than previous investigations.¹

[Figure 1. Plots of FLOP/s and FLOP/s per dollar for our dataset and relevant trends from the existing literature]

+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Trend                             | 2x time       | 10x time       | Growth rate     | Metric            |
+===================================+===============+================+=================+===================+
| Our dataset                       | 2.46 years    | 8.17 years     | 0.122 OOMs/year | FLOP/s per dollar |
| (n=470)                           | [2.24, 2.72]  | [7.45, 9.04]   | [0.134, 0.111]  |                   |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| ML GPUs                           | 2.07 years    | 6.86 years     | 0.146 OOMs/year | FLOP/s per dollar |
| (n=26)                            | [1.54, 3.13]  | [5.12, 10.39]  | [0.195, 0.096]  |                   |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Top GPUs                          | 2.95 years    | 9.81 years     | 0.102 OOMs/year | FLOP/s per dollar |
| (n=57)                            | [2.54, 3.52]  | [8.45, 11.71]  | [0.118, 0.085]  |                   |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Our data FP16 (n=91)              | 2.30 years    | 7.64 years     | 0.131 OOMs/year | FLOP/s per dollar |
|                                   | [1.69, 3.62]  | [5.60, 12.03]  | [0.179, 0.083]  |                   |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Moore’s law                       | 2 years       | 6.64 years     | 0.151 OOMs/year | FLOP/s            |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Huang’s law                       | 1.08 years    | 3.58 years     | 0.279 OOMs/year | FLOP/s            |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| CPU historical (AI Impacts, 2019) | 2.32 years    | 7.7 years      | 0.130 OOMs/year | FLOP/s per dollar |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
| Bergal, 2019                      | 4.4 years     | 14.7 years     | 0.068 OOMs/year | FLOP/s per dollar |
+-----------------------------------+---------------+----------------+-----------------+-------------------+
