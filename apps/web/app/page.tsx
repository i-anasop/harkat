import type { Metadata } from "next";
import HomeBoundary from "@/components/HomeBoundary";
import PromptHome from "@/components/PromptHome";

const TITLE = "Harkat — AI launch films for startups";
const DESCRIPTION = "Describe a product. Harkat cuts a sample 2D launch film in the browser — sound effects only, never music. A person finishes the film you hire.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <HomeBoundary>
      <PromptHome />
    </HomeBoundary>
  );
}
