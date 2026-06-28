import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberShield AI — Prevent Cybercrime Before It Happens",
  description:
    "AI-powered digital public safety platform that protects citizens and helps law enforcement uncover organized cybercrime networks through intelligent threat analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF9] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
