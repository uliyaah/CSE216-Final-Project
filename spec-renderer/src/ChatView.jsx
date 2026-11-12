import { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

export default function ChatView({ onResponse }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [messages, isSending]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    setMessages((previous) => [...previous, { role: "You", text: message }]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await response.text();
      let text = body;
      let data = null;
      try {
        data = JSON.parse(body);
        text = JSON.stringify(data, null, 2);
      } catch {
        // Plain-text responses are displayed as received.
      }

      if (!response.ok) {
        throw new Error(`Request failed (${response.status}).\n${text || response.statusText}`);
      }

      onResponse(data);
      setMessages((previous) => [
        ...previous,
        { role: "Response", text: text || "The server returned an empty response." },
      ]);
    } catch (error) {
      onResponse(null);
      setMessages((previous) => [
        ...previous,
        {
          role: "Error",
          text: error instanceof TypeError
            ? "Could not reach the server. Check that the API is running on localhost:5000 and try again."
            : error.message,
        },
      ]);
      setDraft((current) => current || message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack
        ref={historyRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        spacing={2}
        sx={{ p: { xs: 2, sm: 3 }, height: "50vh", minHeight: 240, overflowY: "auto" }}
      >
        {messages.length === 0 && (
          <Typography color="text.secondary">
            Ask about a location to get started. Try “Find restaurants near Union Station.”
          </Typography>
        )}
        {messages.map((message, index) => (
          <Box key={index} sx={{
            p: 2,
            alignSelf: message.role === "You" ? "flex-end" : "flex-start",
            maxWidth: "100%",
            boxSizing: "border-box",
            bgcolor: "grey.100",
            color: message.role === "Error" ? "error.main" : "text.primary",
            borderRadius: 1,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{message.role}</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.text}</Typography>
          </Box>
        ))}
        {isSending && (
          <Typography role="status" color="text.secondary">Waiting for response…</Typography>
        )}
      </Stack>
      <Box component="form" onSubmit={sendMessage} sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Stack spacing={2}>
          <TextField
            label="Message"
            placeholder="Ask about a location…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.target.form?.requestSubmit();
              }
            }}
            multiline
            minRows={2}
            maxRows={6}
            fullWidth
            helperText="Enter to send · Shift+Enter for a new line"
          />
          <Button type="submit" variant="contained" disabled={isSending || !draft.trim()} sx={{ alignSelf: "flex-end" }}>
            {isSending ? "Sending…" : "Send"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
