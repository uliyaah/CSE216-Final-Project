import { entityName, entityLabel, resolveEntity } from "./specUtils.js";

const isPoint = (value) => value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
  && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;

function collectFromEntity(spec, entityType, instance, label, out, visited) {
  const attrs = spec.schema?.[entityType];
  if (!attrs || !instance || typeof instance !== "object" || visited.has(instance)) return;
  visited.add(instance);

  for (const [key, attr] of Object.entries(attrs)) {
    const value = instance[key];
    if (attr.render === "location" && isPoint(value)) {
      out.push({ name: label || key, label: value.label, lat: value.lat, lng: value.lng });
      continue;
    }

    const childType = entityName(attr.type) || (attr.type === "array" && entityName(attr.item?.type));
    if (!childType) continue;
    const ids = attr.type === "array" ? (Array.isArray(value) ? value : []) : [value];
    for (const id of ids) {
      const child = resolveEntity(spec, childType, id);
      collectFromEntity(spec, childType, child, child && entityLabel(spec, childType, child, id), out, visited);
    }
  }
}

export function collectLocations(spec) {
  if (!spec?.task) return [];
  const out = [];
  collectFromEntity(spec, spec.task, spec.data?.[spec.task], null, out, new Set());
  return out;
}
