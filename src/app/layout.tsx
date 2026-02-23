import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { CookieBanner } from "@/components/ui/cookie-banner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Formulate — Professional CBT Tools for Clinicians",
  description:
    "A curated library of evidence-based CBT worksheets and clinical tools for therapists. Browse, use, and export professional worksheets for your practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
