# Qwen3 8B map-selection experiment

The initial experiment used Qwen3 8B through Ollama, with reasoning disabled,
to return map JSON or `null` from a single prompt. It passed all **7 prompt
examples**, but only **20/24 additional cases** (27/31 overall). Failures involved
missing geographic references, ambiguous context, and an explicit new location
being overridden by old context. Median response time was **0.26 seconds**.

Inspired by [Least-to-Most Prompting (Zhou et al., ICLR 2023)](https://arxiv.org/abs/2205.10625),
we decomposed the task into smaller steps: first classify whether the geographic
request has sufficient information, then extract named locations only when
needed. Python resolves an implicit nearby area only when context contains one
distinct location. This adapts the paper's decomposition principle; it does not
reproduce its full method. No extra examples or case-specific rules were added.

The final implementation passed **31/31 existing cases twice** and **24/24 fresh
cases on their first run**. Median overall latency was about **0.29 seconds**;
requests needing both calls took about **0.60 seconds**. GPU allocation was about
**5.6 GiB**, still using Qwen3 8B without reasoning.

Measurements used an RTX 3090. The 55 unique
cases are now combined in `cases.json` for regression testing.
