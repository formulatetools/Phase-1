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
  metadataBase: new URL("https://formulatetools.co.uk"),
  title: {
    default: "Formulate — Professional CBT Tools for Clinicians",
    template: "%s | Formulate",
  },
  description:
    "A curated library of evidence-based CBT worksheets and clinical tools for therapists. Browse, use, and export professional worksheets for your practice.",
  keywords: [
    "CBT worksheets",
    "cognitive behavioural therapy",
    "clinical tools",
    "therapist resources",
    "thought record",
    "behavioural activation",
    "formulation",
  ],
  authors: [{ name: "Formulate" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Formulate",
    title: "Formulate — Professional CBT Tools for Clinicians",
    description:
      "A curated library of evidence-based CBT worksheets and clinical tools for therapists.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Formulate — Professional CBT Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formulate — Professional CBT Tools for Clinicians",
    description:
      "A curated library of evidence-based CBT worksheets and clinical tools for therapists.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Formulate",
              url: "https://formulatetools.co.uk",
              logo: "https://formulatetools.co.uk/og-image.png",
              description:
                "Professional CBT worksheets and clinical tools for therapists.",
            }),
          }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
