import MapView from "./MapView";
import { collectLocations } from "./collectLocations";

// Rule: if the spec has location data, render a map. Otherwise render nothing.
// The renderer makes no layout choices beyond this rule.
export default function SpecRenderer({ spec }) {
  const points = collectLocations(spec);
  if (points.length === 0) return null;
  return <MapView points={points} />;
}
