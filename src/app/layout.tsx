/**
 * Root layout: metadata, fonts and global design system.
 */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chalkovox — AI Whiteboard Tutor",
    template: "%s · Chalkovox",
  },
  description:
    "An AI tutor that explains ideas on an interactive whiteboard, answers follow-up questions, and listens to your voice.",
};

export const viewport: Viewport = {
  themeColor: "#fafafc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
