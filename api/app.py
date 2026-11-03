from flask import Flask, request, jsonify
from jsonschema import validate, ValidationError
import sys

import map_selector

app = Flask(__name__)

LOCATIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {
            "type": "string",
        },
        "contextLocations": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": ["message"]
}

@app.post("/locations")
def map_locations():
    data = request.get_json()

    if data is None:
        return jsonify(error="Missing JSON body"), 400

    try:
        validate(instance=data, schema=LOCATIONS_SCHEMA)
    except ValidationError as e:
        return jsonify(
            error="Invalid JSON",
            message=e.message,
            field="/".join(str(p) for p in e.path) or "(root)",
        ), 422

    message = data.get("message")
    context_locations = data.get("contextLocations")

    locations_results = map_selector.select_map(message, context_locations, map_selector.MODEL)

    if locations_results is None:
        return jsonify(error="No locations found in message"), 404
    else:
        return locations_results, 200