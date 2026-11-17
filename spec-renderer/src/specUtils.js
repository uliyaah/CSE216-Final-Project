export function entityName(type) {
  return typeof type === "string" ? /^__(.+)__$/.exec(type)?.[1] ?? null : null;
}

export function fieldLabel(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function resolveEntity(spec, type, id) {
  if (id == null || (typeof id !== "string" && typeof id !== "number")) return null;
  return spec?.data?.[type]?.[id] ?? null;
}

export function entityLabel(spec, type, entity, fallback) {
  const attrs = spec?.schema?.[type] ?? {};
  const key = Object.keys(attrs).find((name) => attrs[name].function === "publicIdentifier");
  const label = key && entity?.[key];
  return typeof label === "string" && label.trim() ? label : String(fallback);
}
