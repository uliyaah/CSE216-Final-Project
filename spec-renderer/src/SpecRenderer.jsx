import MapView from "./MapView";
import { collectLocations } from "./collectLocations";

// Annotated specs render only when they contain coordinates.
// Chat can also request an empty map when the backend returns names only.
export default function SpecRenderer({ spec, showEmptyMap = false }) {
  const points = collectLocations(spec);
  if (points.length === 0 && !showEmptyMap) return null;
  return <MapView points={points} />;
}
