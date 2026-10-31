// Hand-written stand-in for backend output.
// Follows the annotation format from Cao et al. (2025):
// each attribute has { type, function, render, editable }.

export const mapSpec = {
  task: "DINNER_PLAN",
  schema: {
    DINNER_PLAN: {
      id: { type: "string", function: "privateIdentifier", render: "hidden", editable: false },
      title: { type: "string", function: "publicIdentifier", render: "shortText", editable: true },
      date: { type: "string", function: "display", render: "time", editable: true },
      restaurants: {
        type: "array",
        function: "display",
        render: "expanded",
        editable: true,
        item: { type: "__RESTAURANT__", thumbnail: ["name"] },
      },
    },
    RESTAURANT: {
      id: { type: "string", function: "privateIdentifier", render: "hidden", editable: false },
      name: { type: "string", function: "publicIdentifier", render: "shortText", editable: true },
      address: { type: "string", function: "display", render: "location", editable: true },
    },
  },
  data: {
    DINNER_PLAN: {
      id: "plan-1",
      title: "Friday dinner",
      date: "2026-11-06",
      restaurants: ["r1", "r2", "r3"],
    },
    RESTAURANT: {
      r1: { id: "r1", name: "Pizzeria Mozza", address: { label: "La Jolla, CA", lat: 32.8328, lng: -117.2713 } },
      r2: { id: "r2", name: "Born and Raised", address: { label: "Little Italy, San Diego", lat: 32.7223, lng: -117.1683 } },
      r3: { id: "r3", name: "Sushi Ota", address: { label: "Pacific Beach, San Diego", lat: 32.8002, lng: -117.2352 } },
    },
  },
};

// Same task, no location attributes. The renderer should draw nothing.
export const noMapSpec = {
  task: "NOTE",
  schema: {
    NOTE: {
      id: { type: "string", function: "privateIdentifier", render: "hidden", editable: false },
      text: { type: "string", function: "publicIdentifier", render: "paragraph", editable: true },
    },
  },
  data: { NOTE: { id: "n1", text: "Buy napkins" } },
};
