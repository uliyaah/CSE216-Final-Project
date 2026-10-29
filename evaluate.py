"""Compare the two-call parser with fixed expected results."""

import argparse
import json
from pathlib import Path
import statistics
import time

import ollama

import map_selector
from map_selector import OPTIONS

ROOT = Path(__file__).parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", default="cases.json")
    parser.add_argument("--output", default="results.json")
    parser.add_argument("--repeats", type=int, default=1)
    args = parser.parse_args()
    cases = json.loads((ROOT / args.cases).read_text())
    rows = []
    for repeat in range(args.repeats):
        for case in cases:
            start = time.perf_counter()
            actual, trace = map_selector.run(case["message"], case["context_locations"])
            elapsed = time.perf_counter() - start
            passed = actual == case["expected"]
            rows.append({**case, "repeat": repeat + 1, "actual": actual,
                         "passed": passed, "seconds": elapsed, "trace": trace})
            print(f"{'PASS' if passed else 'FAIL'} {case['id']} {elapsed:.2f}s {actual}", flush=True)
    report = {"model": map_selector.MODEL, "options": OPTIONS,
              "status_prompt": map_selector.STATUS_PROMPT, "names_prompt": map_selector.NAMES_PROMPT,
              "passed": sum(row["passed"] for row in rows), "total": len(rows),
              "median_seconds": statistics.median(row["seconds"] for row in rows),
              "loaded_models": ollama.ps().model_dump(mode="json"), "results": rows}
    (ROOT / args.output).write_text(json.dumps(report, indent=2) + "\n")
    print(f"{report['passed']}/{report['total']}; median {report['median_seconds']:.2f}s")
    raise SystemExit(0 if all(row["passed"] for row in rows) else 1)


if __name__ == "__main__":
    main()
