"""Check experimental map targets against sourced place and coordinate references."""

import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import time

from jsonschema import validate

import map_selector

OUTPUT_SCHEMA = {
    "type": "object", "required": ["visualization", "locations"], "additionalProperties": False,
    "properties": {
        "visualization": {"const": "map"},
        "locations": {"type": "array", "minItems": 1, "items": {
            "type": "object", "required": ["name", "lat", "lng"], "additionalProperties": False,
            "properties": {
                "name": {"type": "string"},
                "lat": {"type": "number", "minimum": -90, "maximum": 90},
                "lng": {"type": "number", "minimum": -180, "maximum": 180},
            },
        }},
    },
}
MAP_SCHEMA = copy.deepcopy(OUTPUT_SCHEMA)
MAP_SCHEMA["properties"]["locations"]["minItems"] = 0
MAP_SCHEMA["properties"]["references"] = MAP_SCHEMA["properties"]["locations"]
MAP_SCHEMA["required"].append("references")


def distance_m(a, b):
    lat1, lat2 = math.radians(a["lat"]), math.radians(b["lat"])
    dlat, dlng = lat2 - lat1, math.radians(b["lng"] - a["lng"])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(min(1, h)))


def assess(case, actual):
    expected = case["expected"]
    if expected is None or actual is None:
        return {"passed": actual == expected, "errors": [] if actual == expected else ["Map/null mismatch"]}
    validate(actual, OUTPUT_SCHEMA)
    points, references = actual["locations"], list(expected["locations"])
    errors, distances = [], []
    if len(points) != case.get("expected_count", len(references)):
        errors.append("Wrong number of pins")
    normalize = lambda name: "".join(c for c in name.casefold() if c.isalnum())
    for point in points:
        reference = next((r for r in references if normalize(point["name"]) in
                          [normalize(name) for name in r["aliases"]]), None)
        if reference is None:
            errors.append(f"Unverified, wrong or duplicate target: {point['name']}")
            continue
        references.remove(reference)
        error = distance_m(point, reference)
        distances.append({"name": point["name"], "error_m": round(error, 1),
                          "tolerance_m": reference["tolerance_m"]})
        if not math.isfinite(error) or error > reference["tolerance_m"]:
            errors.append(f"Coordinate outside tolerance: {point['name']}")
    return {"passed": not errors, "errors": errors, "distances": distances}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, default=Path("tests/map_cases.json"))
    parser.add_argument("--output", type=Path, default=Path("tests/map_results.json"))
    parser.add_argument("--model", default=map_selector.EXPERIMENTAL_MODEL)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--presence-only", action="store_true",
                        help="Score only map versus null, for the original names-only cases")
    mode.add_argument("--intent-only", action="store_true",
                      help="Score the first classifier against requires_map labels")
    parser.add_argument("--cache", type=Path, help="Use saved Photon responses; models still run live")
    args = parser.parse_args()
    if args.cache:
        cache = json.loads(args.cache.read_text())
        map_selector.photon_search = lambda **params: copy.deepcopy(cache[json.dumps(params, sort_keys=True)])
    report = {
        "model": args.model, "classifier_model": map_selector.MODEL, "options": map_selector.OPTIONS,
        "source_hash": hashlib.sha256(Path(map_selector.__file__).read_bytes()).hexdigest(),
        "case_hash": hashlib.sha256(args.cases.read_bytes()).hexdigest(),
        "cache_hash": hashlib.sha256(args.cache.read_bytes()).hexdigest() if args.cache else None,
        "status_prompt": map_selector.EXPERIMENTAL_STATUS_PROMPT,
        "search_prompt": map_selector.SEARCH_PROMPT, "selection_prompt": map_selector.SELECT_PROMPT,
        "search_schema": map_selector.SEARCH_SCHEMA,
        "presence_only": args.presence_only, "intent_only": args.intent_only,
        "criteria": ("First-stage map intent only, independent of lookup availability. Unlabelled cases are excluded."
                     if args.intent_only else
                     "Map versus null only; returned maps must still satisfy the coordinate schema and provenance checks. Exceptions fail."
                     if args.presence_only else
                     "Identity, requested count and geodesic error. Test-only tolerances: 250 m for venues/landmarks, 2 km for city representative points. Reference pools for open searches are not exhaustive; unexpected venues fail verification pending review. References never enter model prompts."),
        "attribution": "Coordinates: © OpenStreetMap contributors, ODbL, via Photon. https://www.openstreetmap.org/copyright",
        "results": [],
    }
    for case in json.loads(args.cases.read_text()):
        start = time.perf_counter()
        actual, trace = None, []
        try:
            if args.intent_only:
                decision, raw = map_selector.call(case["message"], map_selector.EXPERIMENTAL_STATUS_PROMPT,
                                                 map_selector.STATUS_SCHEMA, map_selector.MODEL)
                trace = [raw]
                status = decision["status"]
                actual = status == "explicit" or (status == "context" and len(set(case["context_locations"])) == 1)
                passed = actual == case["requires_map"] if case["requires_map"] is not None else None
                assessment = {"passed": passed, "errors": [] if passed is not False else ["Map intent mismatch"]}
            else:
                actual, trace = map_selector.run(case["message"], case["context_locations"], args.model, experimental=True)
                if actual is not None:
                    validate(actual, MAP_SCHEMA)
                # View references and empty maps cannot earn a successful result-pin score.
                pins = {"visualization": "map", "locations": actual["locations"]} if actual and actual["locations"] else None
                if args.presence_only:
                    passed = (actual is not None) == (case["expected"] is not None)
                    assessment = {"passed": passed, "errors": [] if passed else ["Map/null mismatch"]}
                elif case.get("evaluation") == "review":
                    assessment = {"passed": None, "errors": []}
                elif case.get("evaluation") == "coordinates":
                    ref = case["expected"]["locations"][0]
                    passed = bool(pins and len(pins["locations"]) == 1 and distance_m(pins["locations"][0], ref) <= ref["tolerance_m"])
                    assessment = {"passed": passed, "errors": [] if passed else ["Missing or incorrect coordinate pin"]}
                else:
                    assessment = assess(case, pins)
                for field, records in [("locations", [p for t in trace for p in t.get("photon_candidates", []) + t.get("input_points", [])]),
                                       ("references", [p for t in trace for p in t.get("reference_candidates", [])])]:
                    assert all(any(all(p[k] == c[k] for k in ("name", "lat", "lng")) for c in records)
                               for p in (actual or {}).get(field, [])), "Unattributed coordinates"
        except Exception as error:
            assessment = {"passed": False, "errors": [f"{type(error).__name__}: {error}"]}
        row = {**case, "actual": actual, **assessment,
               "seconds": round(time.perf_counter() - start, 3), "trace": trace}
        report["results"].append(row)
        report["passed"] = sum(r["passed"] is True for r in report["results"])
        report["total"] = sum(r["passed"] is not None for r in report["results"])
        args.output.write_text(json.dumps(report, indent=2) + "\n")
        label = "SKIP" if row["passed"] is None else "PASS" if row["passed"] else "FAIL"
        print(f"{label} {case['id']}: {assessment}", flush=True)
    print(f"{report['passed']}/{report['total']}")
    raise SystemExit(0 if report["passed"] == report["total"] else 1)


if __name__ == "__main__":
    main()
