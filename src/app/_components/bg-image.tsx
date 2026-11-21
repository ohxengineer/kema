import effects from "../../../bg-effects.config.json";
import { cn } from "@/app/_lib/utils";

type Effects = {
  defaults: { focal: number[] };
  images: Record<string, { focal?: number[]; crop?: number[] }>;
};

/**
 * Where a background's processed files live, and the point it is cropped
 * around (`focal`): the image's `crop` point if it has one, else its focal
 * point.
 */
export type BgSource = { webp: string; jpg: string; focal: [number, number] };

/**
 * Resolves a source file name in public/images/bg (e.g. "cyclist.jpg") to
 * its processed version from scripts/process-bg.mjs and its crop point
 * from bg-effects.config.json. `crop` frames the photo without moving the
 * focal point, which process-bg.mjs also uses to keep the subject sharp.
 */
export function bgSource(src: string): BgSource {
  const { defaults, images } = effects as Effects;
  const [fx, fy] = images[src]?.crop ?? images[src]?.focal ?? defaults.focal;
  const base = `/images/bg/processed/${src.replace(/\.[^.]+$/, "")}`;
  return { webp: `${base}.webp`, jpg: `${base}.jpg`, focal: [fx, fy] };
}

/**
 * A background photo from public/images/bg, always served as its processed
 * version: WebP with a JPG fallback. It covers its positioned parent, cropped
 * around the image's focal point so the subject stays in frame on narrow
 * screens.
 */
export function BgImage({
  src,
  alt = "",
  priority = false,
  className,
}: {
  /** The source file name in public/images/bg, e.g. "cyclist.jpg". */
  src: string;
  /** Leave empty for a purely decorative background. */
  alt?: string;
  /** Load it first: for the image above the fold. */
  priority?: boolean;
  className?: string;
}) {
  const { webp, jpg, focal } = bgSource(src);

  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      {/* A plain img, not next/image: it is already sized and compressed at
          build time, so next/image would only encode it a second time. */}
      <img
        src={jpg}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={{ objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%` }}
        className={cn("absolute inset-0 size-full object-cover", className)}
      />
    </picture>
  );
}
