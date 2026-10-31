import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Paper, Typography } from "@mui/material";
import "leaflet/dist/leaflet.css";

export default function MapView({ points }) {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <MapContainer center={[lat, lng]} zoom={11} style={{ height: 360, width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <CircleMarker key={`${p.name}-${p.lat}-${p.lng}`} center={[p.lat, p.lng]} radius={9}>
            <Popup>
              <Typography variant="subtitle2">{p.name}</Typography>
              {p.label && <Typography variant="body2">{p.label}</Typography>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Paper>
  );
}
