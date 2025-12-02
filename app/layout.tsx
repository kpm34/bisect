import type { Metadata } from "next";
import "./globals.css";

// Force dynamic rendering to avoid static generation issues with React context
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Bisect - 3D Editing. Zero Learning Curve.",
  description: "The fastest way to edit 3D scenes, apply materials, and export production-ready assets. AI-powered 3D editor with integrated texture and vector tools.",
  keywords: "3D editor, 3D scene editor, material editor, AI 3D, no-code 3D, GLB export, GLTF, PBR materials, texture generator, vector editor",
  authors: [{ name: "Bisect" }],
  openGraph: {
    title: "Bisect - 3D Editing. Zero Learning Curve.",
    description: "The fastest way to edit 3D scenes, apply materials, and export production-ready assets. No 3D experience required.",
    type: "website",
    siteName: "Bisect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bisect - 3D Editing. Zero Learning Curve.",
    description: "The fastest way to edit 3D scenes, apply materials, and export production-ready assets.",
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
