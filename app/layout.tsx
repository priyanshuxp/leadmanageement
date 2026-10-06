import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LeadFlow AI — Event Lead Management",
  description: "Capture, organize, and follow up with business event leads using Gemini 2.0 Flash and 1-click Gmail outreach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
        {children}
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
