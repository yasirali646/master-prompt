import type { Metadata } from "next";

export const siteConfig = {
  name: "Master Prompt",
  tagline: "Turn ideas into structured, state-machine master prompts for AI agents.",
  description:
    "Generate production-ready state-machine system prompts from a one-line idea. Multi-provider AI, refine loop, export formats, quality scoring, and share links.",
  keywords: [
    "AI prompt generator",
    "system prompt",
    "state machine prompt",
    "LLM prompt builder",
    "master prompt",
    "OpenAI prompts",
    "Anthropic Claude prompts",
    "AI agent prompts",
    "structured prompts",
    "prompt engineering",
  ],
  locale: "en_US",
  twitterHandle: undefined as string | undefined,
};

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
  keywords?: string[];
};

export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const url = absoluteUrl(options.path);
  const title = options.title;

  return {
    title,
    description: options.description,
    keywords: options.keywords ?? siteConfig.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: options.ogType ?? "website",
      url,
      title,
      description: options.description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: options.description,
      ...(siteConfig.twitterHandle ? { site: siteConfig.twitterHandle } : {}),
    },
    robots: options.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: getSiteUrl(),
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: getSiteUrl(),
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: getSiteUrl(),
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: getSiteUrl(),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function sharedPromptJsonLd(idea: string, id: string, createdAt: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: idea,
    description: `Shared AI system prompt generated with ${siteConfig.name}.`,
    url: absoluteUrl(`/p/${id}`),
    datePublished: createdAt,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };
}

export const indexableRoutes = ["/", "/privacy", "/terms"] as const;

export const noIndexRoutes = ["/login", "/workspaces", "/history", "/usage"] as const;
