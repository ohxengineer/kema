/**
 * O / KR badges (shadcn Badge): small, inline at the start of a line of
 * text. O is the primary style (solid ring colour, black text), KR the
 * secondary one (a faint tint of the ring colour, ring-coloured text).
 */
export const badge =
  "mr-2 inline-flex h-5 items-center rounded-[0.5rem] px-1.5 align-[0.1em] font-condensed text-[11px] leading-none font-semibold";
export const primary = (color: string) => ({ backgroundColor: color, color: "#0a0a0a" });
export const secondary = (color: string) => ({ backgroundColor: `${color}26`, color }); // 15% tint
