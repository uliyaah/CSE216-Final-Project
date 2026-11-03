import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Paper, Typography } from "@mui/material";
import "leaflet/dist/leaflet.css";

function MapViewport({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView([20, 0], 2, { animate: false });
    } else {
      map.fitBounds(points.map((point) => [point.lat, point.lng]), {
        padding: [30, 30], maxZoom: 13, animate: false,
      });
    }
  }, [map, points]);

  return null;
}

export default function MapView({ points }) {
  return (
    <Paper component="section" aria-label="Map visualization" variant="outlined" sx={{ overflow: "hidden" }}>
      {points.length === 0 && (
        <Typography sx={{ p: 2 }} color="text.secondary">
          No coordinates were returned, so there are no markers to display yet.
        </Typography>
      )}
      <MapContainer center={[20, 0]} zoom={2} style={{ height: 360, width: "100%" }}>
        <MapViewport points={points} />
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
