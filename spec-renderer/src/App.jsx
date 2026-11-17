import { useState } from "react";
import {
  Alert, Box, Button, Chip, Container, Paper, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import SpecRenderer from "./SpecRenderer";
import { mapSpec, noMapSpec } from "./sampleSpec";

const specs = { map: mapSpec, none: noMapSpec };

export default function App() {
  const [which, setWhich] = useState("map");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f5" }}>
      <Box component="header" sx={{ bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl" sx={{ py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Jelly</Typography>
            <Typography variant="body2" color="text.secondary">Your dinner planning workspace</Typography>
          </Box>
          <Chip label="Frontend preview" size="small" variant="outlined" />
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This preview uses sample data. Chat and saving edits will be available when the dinner-planning API is connected.
        </Alert>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 360px) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
          <Paper component="section" aria-labelledby="chat-heading" variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Typography id="chat-heading" variant="h6" fontWeight={700}>Chat</Typography>
                <Typography variant="body2" color="text.secondary">Plan and make changes through conversation.</Typography>
              </Box>
              <Box sx={{ minHeight: 180, display: "grid", placeItems: "center", bgcolor: "grey.50", borderRadius: 2, p: 2 }}>
                <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
                  Your conversation will appear here once the backend is connected.
                </Typography>
              </Box>
              <TextField label="Message" placeholder="Ask about your dinner plan" multiline minRows={2} disabled fullWidth helperText="Chat is not connected yet." />
              <Button variant="contained" disabled>Send message</Button>
            </Stack>
          </Paper>

          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
              <Box>
                <Typography fontWeight={700}>Sample workspace</Typography>
                <Typography variant="body2" color="text.secondary">Switch samples to preview conditional maps.</Typography>
              </Box>
              <ToggleButtonGroup exclusive size="small" value={which} onChange={(_, value) => value && setWhich(value)} aria-label="Sample specification">
                <ToggleButton value="map">With locations</ToggleButton>
                <ToggleButton value="none">Without locations</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
            <SpecRenderer key={which} spec={specs[which]} />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
