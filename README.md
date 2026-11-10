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
Implicit nearby searches use the supplied context locations. Other missing
references produce `null`. Errors raise exceptions rather than becoming `null`.
Default mode extracts names only; it does not look up coordinates.

The cases retain their original groups: `prompt` (7), `new` (24 development
cases), and `fresh` (24 later checks). Future reruns are regression checks, not
new held-out evidence. The evaluator exits with status 1 if any answer differs.

## Experimental coordinates

`--experimental` classifies map intent with Qwen3 8B, extracts the operation and
geographic slots with Qwen3 4B, then verifies records returned by
[Photon](https://github.com/komoot/photon). All runtime code is in
`map_selector.py`; the names-only path is unchanged. No additional pip packages
are needed beyond `environment.yml`.

```sh
ollama pull qwen3:8b
ollama pull qwen3:4b-instruct
python map_selector.py "Locate the Eiffel Tower in Paris." --experimental
```

Python callers use `select_map(message, experimental=True)`. `--model` overrides
the experimental slot/verification model; its classifier remains 8B.
There are at most three model calls. Coordinates come from Photon or explicit
input, never model recall. An unsupported condition can leave results empty.

Output is `null` or:

```json
{
  "visualization": "map",
  "references": [{"name": "Paris", "lat": 48.8566, "lng": 2.3522}],
  "locations": []
}
```

`references` provides places for positioning the view; `locations` contains
verified requested pins. Both arrays may be empty. The API/frontend still use
the names-only path; consuming this experimental shape is separate work.
Photon's public demo requires internet access; lookups are cached and paced.
Coordinate data: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL.

## Tests

```sh
python -m unittest discover -s tests
python evaluate_experimental.py --cache tests/photon_cache.json
python evaluate_experimental.py --cases cases.json --presence-only --cache tests/photon_cache.json --output tests/map_legacy_results.json
python evaluate_experimental.py --cases tests/map_intent_cases.json --intent-only --output tests/map_intent_results.json
```

The cache freezes Photon responses; the evaluation still makes live Ollama
calls. Omit `--cache` to test live lookups. Reports include inputs, outputs,
model traces, prompts and source hashes. Evaluations exit with status 1 when
any scored case fails; exploratory cases are excluded.

Pin tests check identity, count, coordinate distance and source records.
References and empty maps cannot earn a correct-pin score. The original 55
cases check only map/null, not reference identity. Intent tests separately
check whether a map is requested, regardless of lookup availability.

The integrated version retained the tested scores:

| Check | Result |
| --- | ---: |
| Original map/null cases | 55/55 |
| Verified pin results | 79/92; 4 false result maps |
| Broader intent cases | 92/97 |
| Two fresh intent sets | 32/36 and 17/24 |

Six exploratory pin cases and one ambiguous intent case are unscored. Some
quoted requests, unknown personal references and fuzzy place matches still
fail. Fixed model settings do not guarantee identical outputs on every run.
The six deterministic contract tests pass. The migration also reproduced all
153 saved prototype cases with identical model requests, lookups and outputs.

Commit `map_selector.py`, `evaluate_experimental.py`, `README.md`, and these test
files: `tests/test_map_selector.py`, `tests/map_cases.json`,
`tests/map_intent_cases.json`, `tests/photon_cache.json`,
`tests/map_results.json`, `tests/map_legacy_results.json`, and
`tests/map_intent_results.json`. No files from `experiments/` are required.
`environment.yml` already includes the required packages and is unchanged.
