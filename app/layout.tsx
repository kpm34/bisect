import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bisect - No-Code 3D Platform",
  description: "Connecting creative domains: 3D scenes, vector graphics, and textures with zero learning curve",
  keywords: "3D editor, vector graphics, texture generation, SVG editor, MatCap, PBR textures, AI tools",
  authors: [{ name: "Bisect" }],
  openGraph: {
    title: "Bisect - No-Code 3D Platform",
    description: "Connecting creative domains: 3D scenes, vector graphics, and textures",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-body bg-warm-bg text-text-primary">
        {children}
      </body>
    </html>
  );
}
