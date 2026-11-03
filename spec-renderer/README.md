# Spec renderer

The main view is a Material UI chat. Send a message with the Send button or
Enter (Shift+Enter adds a new line). Responses appear as text, with JSON formatted
for readability. A response with `"visualization": "map"` displays a map beside
the chat (below it on small screens). Each response replaces the current map;
responses without a map visualization, including errors, clear it.

The current backend returns location names without coordinates. These appear
in the chat response beside a world map. Locations with numeric `lat` and `lng` fields appear as
markers, and the map fits the latest response's coordinates automatically.

Start the Flask API from the repository root in the configured Python environment
(Ollama must also be running):

```sh
python -m flask --app api.app run --port 5000
```

Start the frontend from this directory:

```sh
npm install
npm run dev
```

The chat sends `POST /locations` with JSON `{ "message": "your message" }`.
Vite proxies it to `http://localhost:5000/locations` to avoid browser CORS issues.
A deployed build needs its host to provide the same `/locations` proxy.
Messages are kept in memory until the page is reloaded.

Run `npm run lint` and `npm run build` to check the frontend.
