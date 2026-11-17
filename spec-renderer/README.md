# Jelly frontend preview

Run `npm install` and `npm run dev` from this directory. Use `npm run build`,
`npm run lint`, and `npm test` to validate the frontend.

The preview renders the local examples in `src/sampleSpec.js`. Toggle between
the dinner plan and a specification without locations. The Home panel displays
the root task's visible attributes; entity references and arrays open Entity
panels, with Back navigation. A map appears when reachable location attributes
contain valid coordinates. Short text, paragraph, number, time, location,
references, and arrays are supported.

Chat and edits are deliberately disabled. The existing `/locations` endpoint
only returns place names, but we need a dinner-plan specification or update operations,
and is not connected to this preview. Backend contract, coordinate lookup,
and update endpoints needed before the UI can load and save real plans.
