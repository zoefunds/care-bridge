import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Care Bridge — Medical Intelligence Platform",
  description:
    "GenLayer-powered health intelligence. Upload lab results, check symptoms, track your health — with multi-model AI consensus.",
  keywords: "health intelligence, lab results, AI health, medical analysis, GenLayer",
  openGraph: {
    title: "Care Bridge",
    description: "AI-powered health intelligence platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
