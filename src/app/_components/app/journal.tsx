"use client";

import { useState } from "react";
import { SmileyIcon, SmileyMehIcon, SmileySadIcon, SmileyWinkIcon } from "@phosphor-icons/react";

import type { JournalEntry, Mood } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";

type Labels = {
  title: string;
  prompt: string;
  placeholder: string;
  save: string;
  entries: string;
  moods: Record<Mood, string>;
};

const moods = [
  { id: "great", Icon: SmileyWinkIcon },
  { id: "good", Icon: SmileyIcon },
  { id: "meh", Icon: SmileyMehIcon },
  { id: "hard", Icon: SmileySadIcon },
] as const;

/** The journal: a quick entry for today, then what came before. */
export function Journal({
  lang,
  entries: initial,
  labels,
}: {
  lang: Locale;
  entries: JournalEntry[];
  labels: Labels;
}) {
  const [entries, setEntries] = useState(initial);
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState("");
  const day = new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short" });

  const save = () => {
    if (!mood || !text.trim()) return;
    const now = new Date();
    setEntries((prev) => [
      { id: String(now.getTime()), date: now.toISOString().slice(0, 10), mood, text: text.trim() },
      ...prev,
    ]);
    setMood(null);
    setText("");
  };

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl border bg-neutral-900 p-4">
        <h2 className="font-condensed text-sm font-semibold uppercase">{labels.prompt}</h2>
        <div role="radiogroup" aria-label={labels.prompt} className="grid grid-cols-4 gap-2">
          {moods.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mood === id}
              onClick={() => setMood(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-full py-2 font-condensed text-xs uppercase transition-colors",
                mood === id
                  ? "bg-rose-500/20 text-rose-500"
                  : "bg-white/5 text-neutral-400 hover:text-white",
              )}
            >
              <Icon weight="fill" className="size-6" aria-hidden />
              {labels.moods[id]}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          className="resize-none rounded-lg bg-white/5 p-3 text-sm placeholder:text-neutral-500 focus:ring-2 focus:ring-rose-500/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={!mood || !text.trim()}
          className="h-10 rounded-full bg-rose-500 font-condensed text-sm font-semibold text-neutral-950 uppercase transition-colors hover:bg-rose-400 disabled:bg-white/10 disabled:text-neutral-500"
        >
          {labels.save}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-condensed text-sm font-semibold uppercase">{labels.entries}</h2>
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const { Icon } = moods.find((m) => m.id === entry.mood)!;
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-2 rounded-xl border bg-neutral-900 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-condensed text-xs text-neutral-400 uppercase">
                    {day.format(new Date(`${entry.date}T12:00`))}
                  </span>
                  <span className="flex items-center gap-1 font-condensed text-xs text-rose-500 uppercase">
                    <Icon weight="fill" className="size-4" aria-hidden />
                    {labels.moods[entry.mood]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-neutral-200">{entry.text}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
