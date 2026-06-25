import type { Metadata } from "next";
import { MasterPromptApp } from "@/components/MasterPromptApp";
import { JsonLd } from "@/components/JsonLd";
import { createPageMetadata, siteConfig } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "AI Prompt Generator for State-Machine System Prompts",
  description: siteConfig.description,
  path: "/",
  keywords: siteConfig.keywords,
});

function homePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: siteConfig.name,
    description: siteConfig.description,
    isPartOf: { "@type": "WebSite", name: siteConfig.name },
  };
}

export default function Home() {
  return (
    <>
      <JsonLd data={homePageJsonLd()} />
      <MasterPromptApp />
    </>
  );
}
