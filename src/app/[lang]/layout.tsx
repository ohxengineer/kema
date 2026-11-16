import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Condensed, Inter } from "next/font/google";

import { hasLocale, locales } from "@/app/_lib/i18n";
import { getDictionary } from "./dictionaries";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const IBMPlexSansCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  variable: "--font-plex-condensed",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const { metadata } = await getDictionary(lang);
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang}>
      <body
        className={`${inter.variable} ${IBMPlexSansCondensed.variable} font-sans antialiased dark`}
      >
        {children}
      </body>
    </html>
  );
}
