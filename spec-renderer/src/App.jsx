import { useState } from "react";
import { Container, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import SpecRenderer from "./SpecRenderer";
import { mapSpec, noMapSpec } from "./sampleSpec";

const specs = { map: mapSpec, none: noMapSpec };

// Swap `specs[which]` for a fetch to the backend once the endpoint is ready.
export default function App() {
  const [which, setWhich] = useState("map");

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Spec renderer (test)</Typography>
        <ToggleButtonGroup exclusive size="small" value={which} onChange={(_, v) => v && setWhich(v)}>
          <ToggleButton value="map">Spec with locations</ToggleButton>
          <ToggleButton value="none">Spec without locations</ToggleButton>
        </ToggleButtonGroup>
        <SpecRenderer spec={specs[which]} />
      </Stack>
    </Container>
  );
}
