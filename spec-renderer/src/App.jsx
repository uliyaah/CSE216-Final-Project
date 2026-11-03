import { useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import SpecRenderer from "./SpecRenderer";
import ChatView from "./ChatView";

export default function App() {
  const [visualization, setVisualization] = useState(null);

  function handleResponse(response) {
    setVisualization(response?.visualization === "map" ? response : null);
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">Location chat</Typography>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: visualization ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "start",
        }}>
          <ChatView onResponse={handleResponse} />
          {visualization && <SpecRenderer spec={visualization} showEmptyMap />}
        </Box>
      </Stack>
    </Container>
  );
}
