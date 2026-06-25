import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0a0a0a 0%, #052e16 50%, #0a0a0a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#052e16",
            }}
          >
            M
          </div>
          <span style={{ fontSize: 36, fontWeight: 700 }}>{siteConfig.name}</span>
        </div>
        <p
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 900,
            margin: 0,
          }}
        >
          Turn ideas into master prompts
        </p>
        <p
          style={{
            fontSize: 24,
            lineHeight: 1.4,
            maxWidth: 820,
            marginTop: 24,
            color: "#a3a3a3",
          }}
        >
          Structured state-machine system prompts for AI agents
        </p>
      </div>
    ),
    { ...size }
  );
}
