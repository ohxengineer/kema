import Image from "next/image";
import { notFound } from "next/navigation";

import { BgImage, bgSource } from "@/app/_components/bg-image";
import { BgSlideshow } from "@/app/_components/bg-slideshow";
import Header from "@/app/_components/landing/header";
import FloatingNav from "@/app/_components/landing/floating-nav";
import LocaleSwitcher from "@/app/_components/landing/locale-switcher";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "./dictionaries";

/** The hero's photos, in order; the first one is in the HTML. */
const heroPhotos = ["cyclist.jpg", "reading.jpg", "swimmer.jpg", "piano.jpg", "runner.jpg"];
const heroSlides = heroPhotos.map(bgSource);

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <>
      <Header dict={dict} />
      <FloatingNav lang={lang} labels={dict.nav} />
      <main>
        <section className="min-h-dvh tracking-tight p-4 pt-20 pb-24 md:pb-[74px] flex flex-col-reverse gap-3 md:justify-end m-auto md:flex-col">
          <h2 className="uppercase font-black text-4xl md:text-6xl lg:text-7xl hidden md:block">
            {dict.hero.headlineTop} <br /> {dict.hero.headlineBottom}
          </h2>
          <div className="relative overflow-hidden border rounded-xl h-[49vh] flex items-end">
            <BgSlideshow slides={heroSlides}>
              <BgImage src={heroPhotos[0]} priority />
            </BgSlideshow>
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-3/5 backdrop-blur-lg bg-linear-to-t from-neutral-950/90 via-neutral-950/50 to-transparent mask-[linear-gradient(to_top,black_45%,transparent)]"
            />
            <div className="relative md:w-4/6 lg:w-4/5 leading-tight font-semibold text-xl md:text-4xl mt-10 p-3">
              <h1 className="inline">Kema</h1>{" "}
              <h2 className="inline">{dict.hero.description}</h2>
            </div>
          </div>
        </section>
      </main>
      <footer className="px-4 pb-24 md:pb-[74px] flex flex-col gap-3">
        <Image src="/KEMA.svg" className="w-full h-auto animate-pulse" width={96} height={20} alt="Kema" />
        <div className="text-neutral-500 font-condensed uppercase flex items-center gap-4 text-xs justify-between md:text-sm">
          <div className="flex items-center gap-4">
            <p className="whitespace-nowrap">© Kema. {new Date().getFullYear()}</p>
            <LocaleSwitcher current={lang} label={dict.header.language} />
          </div>
          <p className="text-right text-balance">{dict.footer.credits}</p>
        </div>
      </footer>
    </>
  );
}
