import type { Metadata } from "next";
import PromptHome from "@/components/PromptHome";

export const metadata: Metadata = {
  title: "Make a launch film",
  description: "Describe your product. Harkat cuts a sample film in the browser — sound effects only, no music.",
};

export default function Home() {
  return <PromptHome />;
}
