/** Two films. Keel is a sample product. Linear uses a real public site for the logo and colour. */
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
    id: "linear",
    name: "Linear",
    problem: "Issues sit in a list all week.",
    features: ["Finds the issue", "Flips the state"],
    url: "https://linear.app",
    accent: "#5E6AD2",
    audience: "Teams",
    goal: "feature",
    tone: "quiet",
    length: 15,
    sample: true,
    live: true,
  },
];

export const SAMPLE_BRIEF = SAMPLES[0];
