/** Two fake products. Different goal, length, and vignettes. */
export const SAMPLES = [
  {
    id: "keel",
    name: "Keel",
    problem: "Reviews stall before the launch ships.",
    features: ["Types the change", "Finds the bug", "Shows the diff"],
    url: "https://keel.example",
    accent: "#0E7C66",
    audience: "Developers",
    goal: "launch",
    tone: "plain",
    length: 30,
    proof: "Up to 98%",
    sample: true,
  },
  {
    id: "northwind",
    name: "Northwind",
    problem: "Approvals sit in the queue all week.",
    features: ["Drafts the reply", "Flips the approval"],
    url: "https://northwind.example",
    accent: "#2E4BDB",
    audience: "Operators",
    goal: "feature",
    tone: "quiet",
    length: 15,
    sample: true,
  },
];

export const SAMPLE_BRIEF = SAMPLES[0];
