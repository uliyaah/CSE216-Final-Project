// Walks the spec and returns every point that should appear on a map.
// A map is shown only when at least one attribute has render === "location"
// and the data for it contains coordinates.

const entityName = (type) => {
  const m = /^__(.+)__$/.exec(type || "");
  return m ? m[1] : null;
};

const isPoint = (v) => v && typeof v.lat === "number" && typeof v.lng === "number";

function collectFromEntity(spec, entityType, instance, label, out) {
  const attrs = spec.schema?.[entityType];
  if (!attrs || !instance) return;

  for (const [key, attr] of Object.entries(attrs)) {
    const value = instance[key];

    if (attr.render === "location" && isPoint(value)) {
      out.push({ name: label || key, label: value.label, lat: value.lat, lng: value.lng });
      continue;
    }

    // Follow arrays of entity references one level down.
    if (attr.type === "array" && Array.isArray(value)) {
      const childType = entityName(attr.item?.type);
      if (!childType) continue;
      for (const id of value) {
        const child = spec.data?.[childType]?.[id];
        collectFromEntity(spec, childType, child, child?.name, out);
      }
    }
  }
}

export function collectLocations(spec) {
  if (!spec?.task) return [];
  const out = [];
  collectFromEntity(spec, spec.task, spec.data?.[spec.task], null, out);
  return out;
}
