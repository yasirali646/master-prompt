import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { DataSync } from "@/components/DataSync";
import { JsonLd } from "@/components/JsonLd";
import { rootMetadata, softwareApplicationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <JsonLd data={[websiteJsonLd(), softwareApplicationJsonLd()]} />
        <AuthProvider>
          <WorkspaceProvider>
            <DataSync />
            <ThemeProvider>{children}</ThemeProvider>
          </WorkspaceProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
