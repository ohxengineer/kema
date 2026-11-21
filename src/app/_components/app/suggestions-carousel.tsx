"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarbellIcon, BrainIcon } from "@phosphor-icons/react";

import { ringColors } from "@/app/_components/app/activity-rings";
import { badge, secondary } from "@/app/_components/app/okr-badge";
import { BgImage } from "@/app/_components/bg-image";
import { Badge } from "@/app/_components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/app/_components/ui/carousel";
import type { GoalKind } from "@/app/_lib/app-sample";
import { cn } from "@/app/_lib/utils";

export type SuggestionsLabels = {
  title: string;
  cta: string;
  /** e.g. "Sugerencia {n} de {total}" */
  goTo: string;
  items: { eyebrow: string; title: string; meta: string; krs: string[] }[];
};

/** Each slide's photo (from public/images/bg) and kind; its text is in the labels. */
const slides: { photo: string; kind: GoalKind }[] = [
  { photo: "cyclist.jpg", kind: "physical" },
  { photo: "swimmer.jpg", kind: "physical" },
  { photo: "reading.jpg", kind: "mental" },
  { photo: "piano.jpg", kind: "mental" },
  { photo: "runner.jpg", kind: "physical" },
];

/**
 * Suggested objectives, one per slide, like Fitness+'s featured card: a
 * full-bleed photo, the kind in the ring's colour, the objective, how long
 * it runs and its key results, a wide glass button to add it, and a dot per
 * slide. Swipe, or tap a dot.
 */
export function SuggestionsCarousel({ labels }: { labels: SuggestionsLabels }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    // starts on slide 0, so only later selections need syncing
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const count = Math.min(slides.length, labels.items.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.title}
      className="flex flex-col gap-2"
    >
      <div className="relative overflow-hidden rounded-xl border bg-neutral-900">
        <Carousel setApi={setApi} opts={{ loop: true }}>
          <CarouselContent className="ml-0">
            {slides.slice(0, count).map(({ photo, kind }, i) => {
              const item = labels.items[i];
              return (
                <CarouselItem
                  key={photo}
                  aria-roledescription="slide"
                  aria-label={labels.goTo
                    .replace("{n}", String(i + 1))
                    .replace("{total}", String(count))}
                  className="relative aspect-[4/5] pl-0"
                >
                  <BgImage src={photo} />
                  {/* darken towards the bottom so the text and button read */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/10"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 px-5 pb-5 text-left">
                    {/* the kind as its icon alone, in the ring's colour */}
                    <span className="mb-1 flex" style={{ color: ringColors[kind] }}>
                      {kind === "physical" ? (
                        <BarbellIcon weight="fill" className="size-7" aria-hidden />
                      ) : (
                        <BrainIcon weight="fill" className="size-7" aria-hidden />
                      )}
                      <span className="sr-only">{item.eyebrow}</span>
                    </span>
                    <h3 className="text-2xl leading-tight font-semibold text-balance">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-300">{item.meta}</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {item.krs.map((kr, k) => (
                        // the badge in its own column, so wrapped lines align with the text
                        <li key={kr} className="flex text-sm leading-snug text-neutral-100">
                          <Badge
                            className={cn(badge, "shrink-0")}
                            style={secondary(ringColors[kind])}
                          >
                            KR{k + 1}
                          </Badge>
                          <span>{kr}</span>
                        </li>
                      ))}
                    </ul>
                    {/* 48pt tall: comfortably over the 44pt minimum (Apple HIG) */}
                    <button
                      type="button"
                      className="mt-4 h-12 w-full rounded-full bg-white/15 text-base font-semibold backdrop-blur-md transition-colors hover:bg-white/25"
                    >
                      {labels.cta}
                    </button>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* the Kema logo and BETA badge up top, like the landing header */}
        <div className="pointer-events-none absolute top-5 left-5 flex items-center gap-2">
          <Image src="/KEMA.svg" width={80} height={17} alt="Kema" className="h-auto" />
          <Badge>BETA</Badge>
        </div>
      </div>

      {/* a dot per slide, under the card; each is a 24pt-tall tap area */}
      <div className="flex justify-center">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={labels.goTo.replace("{n}", String(i + 1)).replace("{total}", String(count))}
            aria-current={i === current ? "true" : undefined}
            className="flex h-6 w-5 items-center justify-center"
          >
            <span
              className={cn(
                "size-2 rounded-full transition-colors",
                i === current ? "bg-white" : "bg-white/40",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
