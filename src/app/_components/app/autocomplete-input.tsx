"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/app/_components/ui/input";
import { cn } from "@/app/_lib/utils";

/** Lowercase, without accents: "Médico" and "medico" match. */
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Up to `limit` items whose text contains every word typed, in any order
 * ("10 corr" finds "Correr 10 km…"). Nothing until two letters are typed.
 */
export function matchSuggestions<T>(
  query: string,
  items: T[],
  text: (item: T) => string,
  limit = 5,
) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (normalize(query).trim().length < 2) return [];
  return items
    .filter((item) => words.every((w) => normalize(text(item)).includes(w)))
    .slice(0, limit);
}

/**
 * A text input with suggestions underneath as you type: the ARIA combobox
 * pattern (arrow keys move, Enter picks, Escape closes). Picking hands the
 * whole item back, so the form can fill more than this field.
 */
export function AutocompleteInput<T>({
  value,
  onValueChange,
  suggestions,
  getKey,
  renderSuggestion,
  onPick,
  listLabel,
  ...inputProps
}: Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** The items to offer for the current value, already filtered. */
  suggestions: T[];
  getKey: (item: T) => string;
  renderSuggestion: (item: T) => ReactNode;
  onPick: (item: T) => void;
  /** Accessible name for the list, e.g. "Sugerencias". */
  listLabel: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const showing = open && suggestions.length > 0;

  const pick = (item: T) => {
    onPick(item);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative">
      <Input
        {...inputProps}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={listId}
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        // let a tap on a suggestion land before the list closes
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!showing) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showing && (
        <ul
          id={listId}
          role="listbox"
          aria-label={listLabel}
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-1 shadow-xl shadow-black/50"
        >
          {suggestions.map((item, i) => (
            <li
              key={getKey(item)}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: it fires before the input's blur
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm",
                i === active ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              {renderSuggestion(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
