# Map-selection milestone

Local Qwen3 8B selects map JSON or `null`, with reasoning disabled.
`map_selector.py` contains the prompts, model calls, context resolution, and CLI.
`evaluate.py` checks all 55 cases and saves actual outputs and timings to
`results.json`. See [EXPERIMENT_SUMMARY.md](EXPERIMENT_SUMMARY.md) for the findings.

```sh
conda activate cse216-map
python map_selector.py "Find restaurants near Union Station."
python map_selector.py "Find parking nearby." --context "Balboa Park"
python evaluate.py
```

Python usage:

```python
from map_selector import select_map
result = select_map("Find parking nearby.", ["Balboa Park"])
```

To install elsewhere, run `conda env create -f environment.yml` and
`ollama pull qwen3:8b`. Ollama must be running (`ollama serve` if needed).

The first call classifies the request; a second extracts names only when needed.
Implicit nearby searches require exactly one contextual location. Other missing
references produce `null`. Errors raise exceptions rather than becoming `null`.
There is no geocoding, location lookup, conversation storage, or frontend yet.

The cases retain their original groups: `prompt` (7), `new` (24 development
cases), and `fresh` (24 later checks). Future reruns are regression checks, not
new held-out evidence. The evaluator exits with status 1 if any answer differs.
