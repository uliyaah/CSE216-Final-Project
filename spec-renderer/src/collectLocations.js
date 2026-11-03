// Supports both backend locations and annotated specs with coordinates.

const entityName = (type) => {
  const m = /^__(.+)__$/.exec(type || "");
  return m ? m[1] : null;
};

const isPoint = (v) => v && Number.isFinite(v.lat) && Number.isFinite(v.lng)
  && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180;

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
  if (Array.isArray(spec?.locations)) {
    return spec.locations.filter(isPoint);
  }
  if (!spec?.task) return [];
  const out = [];
  collectFromEntity(spec, spec.task, spec.data?.[spec.task], null, out);
  return out;
}
