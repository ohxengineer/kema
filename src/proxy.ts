import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, hasLocale, localeCookie, locales } from "@/app/_lib/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

function getPreferredLocale(request: NextRequest) {
  const saved = request.cookies.get(localeCookie)?.value;
  if (saved && hasLocale(saved)) return saved;

  // e.g. "en-US,en;q=0.9,es;q=0.8" -> ["en", "en", "es"] ordered by q
  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  return accepted.find(({ lang }) => hasLocale(lang))?.lang ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const current = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  // Remember the locale the visitor is browsing in
  if (current) {
    const response = NextResponse.next();
    if (request.cookies.get(localeCookie)?.value !== current) {
      response.cookies.set(localeCookie, current, { path: "/", maxAge: ONE_YEAR });
    }
    return response;
  }

  request.nextUrl.pathname = `/${getPreferredLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (e.g. /KEMA.svg)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
