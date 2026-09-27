import type { Metadata } from "next";
import { homeFontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snippets",
  description:
    "Short pieces of thinking: ideas worth keeping, lessons learned, and practical thoughts on work.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${homeFontVariables} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
