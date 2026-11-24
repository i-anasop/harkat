/** Clearly fake products. Each one forces a different template. */
export const SAMPLES = [
  {
    id: "northstar",
    template: "launch",
    sample: true,
    name: "Northstar",
    problem: "Launch posts take a week and still look generic.",
    features: ["Brand-matched drafts", "One shared board", "Approval before anything goes live"],
    accent: "#0E7C66",
    url: "https://northstar.example",
  },
  {
    id: "lumen",
    template: "holo",
    sample: true,
    name: "Lumen",
    problem: "Follow-ups sit in the inbox until the week is gone.",
    features: ["Drafts the reply", "Finds the right thread", "Asks before it sends"],
    accent: "#3D4BDB",
    url: "https://lumen.example",
  },
  {
    id: "relay",
    template: "workflow",
    sample: true,
    name: "Relay",
    problem: "Handoffs between tools still happen by hand.",
    features: ["A trigger when mail arrives", "A draft in your voice", "A check before it sends", "A log of what ran"],
    accent: "#0E7490",
    url: "https://relay.example",
  },
];

export const SAMPLE_BRIEF = SAMPLES[0];
