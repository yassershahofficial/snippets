import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/shared/SessionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Snippets CMS",
  description: "A modular blog CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

