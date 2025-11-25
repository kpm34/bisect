import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bisect - No-Code 3D Platform",
  description: "Connecting creative domains: 3D scenes, vector graphics, and textures with zero learning curve",
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
