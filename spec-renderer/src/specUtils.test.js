import test from "node:test";
import assert from "node:assert/strict";
import { collectLocations } from "./collectLocations.js";
import { entityName, entityLabel, fieldLabel, resolveEntity } from "./specUtils.js";
import { mapSpec, noMapSpec } from "./sampleSpec.js";

test("resolves and labels typed references", () => {
  assert.equal(entityName("__RESTAURANT__"), "RESTAURANT");
  assert.equal(entityName("string"), null);
  assert.equal(fieldLabel("preferredRestaurant"), "Preferred Restaurant");
  const restaurant = resolveEntity(mapSpec, "RESTAURANT", "r1");
  assert.equal(entityLabel(mapSpec, "RESTAURANT", restaurant, "r1"), "Pizzeria Mozza");
  assert.equal(resolveEntity(mapSpec, "RESTAURANT", "missing"), null);
  assert.equal(resolveEntity(mapSpec, "RESTAURANT", {}), null);
});

test("collects locations once from referenced entities and omits the map for a non-location spec", () => {
  const points = collectLocations(mapSpec);
  assert.equal(points.length, 3);
  assert.deepEqual(points[0], { name: "Pizzeria Mozza", label: "La Jolla, CA", lat: 32.8328, lng: -117.2713 });
  assert.deepEqual(collectLocations(noMapSpec), []);
  assert.deepEqual(collectLocations(null), []);
});

test("follows nested references without looping and rejects invalid coordinates", () => {
  const spec = {
    task: "PLAN",
    schema: {
      PLAN: { child: { type: "__PLACE__" } },
      PLACE: {
        name: { function: "publicIdentifier" },
        location: { render: "location" },
        next: { type: "__PLACE__" },
      },
    },
    data: {
      PLAN: { child: "a" },
      PLACE: {
        a: { name: "A", location: { lat: 1, lng: 2 }, next: "b" },
        b: { name: "B", location: { lat: 91, lng: 0 }, next: "a" },
      },
    },
  };
  assert.deepEqual(collectLocations(spec), [{ name: "A", label: undefined, lat: 1, lng: 2 }]);
});
