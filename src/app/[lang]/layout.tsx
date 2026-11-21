import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archivo_Narrow, Inter } from "next/font/google";

import { hasLocale, locales } from "@/app/_lib/i18n";
import { getDictionary } from "./dictionaries";
import "../globals.css";

// Variable font: weights 100–900 in one file; used by `font-sans`
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-sans",
});
// Variable font: weights 400–700 in one file; used by `font-condensed`
const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
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
        className={`${inter.variable} ${archivoNarrow.variable} font-sans antialiased dark`}
      >
        {children}
      </body>
    </html>
  );
}
