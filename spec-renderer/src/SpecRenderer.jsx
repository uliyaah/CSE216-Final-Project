import { useState } from "react";
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import MapView from "./MapView";
import { collectLocations } from "./collectLocations";
import { entityName, entityLabel, fieldLabel, resolveEntity } from "./specUtils";

function Reference({ spec, type, id, onOpen }) {
  const entity = resolveEntity(spec, type, id);
  if (!entity) return <Alert severity="warning">Cannot find {fieldLabel(type)} reference: {String(id)}</Alert>;
  return (
    <Button variant="outlined" onClick={() => onOpen(type, id)} sx={{ justifyContent: "space-between", textAlign: "left" }}>
      {entityLabel(spec, type, entity, id)} <span aria-hidden="true">→</span>
    </Button>
  );
}

function Field({ spec, name, attr, value, onOpen }) {
  const label = fieldLabel(name);
  if (attr.render === "hidden") return null;

  const referenceType = entityName(attr.type);
  const itemType = entityName(attr.item?.type);
  if (referenceType) {
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2">{label}</Typography>
        {value == null || value === "" ? <Typography color="text.secondary">Not set</Typography> :
          <Reference spec={spec} type={referenceType} id={value} onOpen={onOpen} />}
        {attr.editable && <Typography variant="caption" color="text.secondary">Editing will be available when the API is connected.</Typography>}
      </Stack>
    );
  }
  if (attr.type === "array") {
    if (value != null && !Array.isArray(value)) return <Alert severity="warning">{label} must be an array.</Alert>;
    const items = value ?? [];
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2">{label}</Typography>
        {items.length === 0 && <Typography color="text.secondary">No items yet</Typography>}
        {items.map((item, index) => itemType ?
          <Reference key={`${String(item)}-${index}`} spec={spec} type={itemType} id={item} onOpen={onOpen} /> :
          <Typography key={index} variant="body2">{typeof item === "object" ? JSON.stringify(item) : String(item)}</Typography>)}
        {attr.editable && <Typography variant="caption" color="text.secondary">Editing will be available when the API is connected.</Typography>}
      </Stack>
    );
  }

  if (attr.render === "location") {
    const location = value && typeof value === "object" ? value.label || (
      typeof value.lat === "number" && typeof value.lng === "number" ? `${value.lat}, ${value.lng}` : ""
    ) : value;
    return <TextField label={label} value={location ?? ""} fullWidth slotProps={{ input: { readOnly: true } }} helperText={attr.editable ? "Editing will be available when the API is connected." : "Read only"} />;
  }

  const supported = ["shortText", "paragraph", "number", "time"];
  if (!supported.includes(attr.render)) return <Alert severity="warning">Unsupported render type for {label}: {attr.render || "(missing)"}</Alert>;
  if (value != null && typeof value === "object") return <Alert severity="warning">Invalid value for {label}.</Alert>;
  return (
    <TextField
      label={label}
      value={value ?? ""}
      type={attr.render === "number" ? "number" : "text"}
      multiline={attr.render === "paragraph"}
      minRows={attr.render === "paragraph" ? 3 : undefined}
      fullWidth
      slotProps={{ input: { readOnly: true } }}
      helperText={attr.editable ? "Editing will be available when the API is connected." : "Read only"}
    />
  );
}

export default function SpecRenderer({ spec }) {
  const [path, setPath] = useState([]);
  const rootType = spec?.task;
  const root = spec?.data?.[rootType];
  const current = path.at(-1);
  const type = current?.type || rootType;
  const entity = current ? resolveEntity(spec, type, current.id) : root;
  const attrs = spec?.schema?.[type];

  if (!rootType || !root || !attrs || !entity) {
    return <Alert severity="error">This specification is missing its task, schema, or data.</Alert>;
  }

  const points = collectLocations(spec);
  const title = current ? entityLabel(spec, type, entity, current.id) : entityLabel(spec, type, entity, fieldLabel(type));
  const openEntity = (nextType, id) => setPath((previous) => [...previous, { type: nextType, id }]);

  return (
    <Stack spacing={2}>
      <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="overline" color="text.secondary">{current ? "Entity panel" : "Home panel"}</Typography>
              <Chip size="small" label={fieldLabel(type)} />
            </Stack>
            <Typography variant="h5" fontWeight={700}>{title}</Typography>
            {current && <Button size="small" onClick={() => setPath((previous) => previous.slice(0, -1))} sx={{ mt: 1, ml: -1 }}>
              ← Back
            </Button>}
          </Box>
          <Divider />
          {Object.entries(attrs).map(([name, attr]) => (
            <Field key={name} spec={spec} name={name} attr={attr} value={entity[name]} onOpen={openEntity} />
          ))}
        </Stack>
      </Paper>
      {points.length > 0 && (
        <Box component="section" aria-label="Locations map">
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Locations</Typography>
          <MapView points={points} />
        </Box>
      )}
    </Stack>
  );
}
