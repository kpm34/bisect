import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified 3D Creator - No-Code 3D Platform",
  description: "Create 3D scenes, vector graphics, and textures with zero learning curve",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
