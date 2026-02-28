import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aether: The Graveyard of Voices",
  description: "Anonymous real-time séance — reanimate the voices of the past.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="terminal">
      <body>{children}</body>
    </html>
  );
}
