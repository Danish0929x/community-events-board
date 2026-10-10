"use client";

import { Check, CloudAlert, CloudCheck, Palette } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, type EventDto } from "@/lib/client";
import {
  CARD_THEMES,
  DEFAULT_CARD_DESIGN,
  MAX_STICKERS,
  STICKERS,
  type CardThemeId,
  type StickerId,
} from "@/lib/constants";
import { formatEventDate, formatPrice } from "@/lib/format";
import { useAuth } from "./auth-provider";
import { Spinner } from "./ui";

type Design = { theme: CardThemeId; stickers: StickerId[] };
type SaveState = "idle" | "saving" | "saved" | "error";

// Where the 1st, 2nd and 3rd sticker sit on the card.
const SLOTS = [
  { style: { top: "7%", right: "7%" }, rotate: 12 },
  { style: { top: "38%", right: "12%" }, rotate: -10 },
  { style: { bottom: "30%", right: "4%" }, rotate: 6 },
];

export function CardDesigner({ event }: { event: EventDto }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const loggedIn = status === "authenticated";

  const [design, setDesign] = useState<Design>(DEFAULT_CARD_DESIGN);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [changeCount, setChangeCount] = useState(0); // bumps on every user edit
  const latestRequest = useRef(0);

  // Load the saved design for this event.
  useEffect(() => {
    if (!loggedIn) return;
    const controller = new AbortController();
    api<{ design: Design }>(`/api/events/${event.id}/card-design`, { signal: controller.signal })
      .then((res) => setDesign(res.design))
      .catch((err: Error) => {
        if (err.name !== "AbortError") toast.error(`Couldn't load your saved card. ${err.message}`);
      })
      .finally(() => setLoaded(true));
    return () => controller.abort();
  }, [loggedIn, event.id]);

  const save = useCallback(
    async (next: Design) => {
      const requestId = ++latestRequest.current;
      setSaveState("saving");
      try {
        await api(`/api/events/${event.id}/card-design`, { method: "PUT", body: next });
        if (requestId === latestRequest.current) setSaveState("saved");
      } catch (err) {
        if (requestId === latestRequest.current) {
          setSaveState("error");
          toast.error(`Couldn't save your card. ${(err as Error).message}`);
        }
      }
    },
    [event.id],
  );

  // Save shortly after the last change, so quick taps become one request.
  useEffect(() => {
    if (!loggedIn || changeCount === 0) return;
    const t = setTimeout(() => save(design), 400);
    return () => clearTimeout(t);
  }, [changeCount, loggedIn, design, save]);

  function update(next: Design) {
    setDesign(next);
    setChangeCount((n) => n + 1);
  }

  function toggleSticker(id: StickerId) {
    if (design.stickers.includes(id)) {
      update({ ...design, stickers: design.stickers.filter((s) => s !== id) });
    } else if (design.stickers.length < MAX_STICKERS) {
      update({ ...design, stickers: [...design.stickers, id] });
    }
  }

  const theme = CARD_THEMES.find((t) => t.id === design.theme) ?? CARD_THEMES[0];
  const full = design.stickers.length >= MAX_STICKERS;

  return (
    <section aria-labelledby="designer-title" className="card p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="designer-title" className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Palette className="size-6 text-brand-600" aria-hidden /> Design your card
          </h2>
          <p className="mt-1 text-sm text-muted">Pick a background and add up to {MAX_STICKERS} stickers. Tap a sticker on the card to remove it.</p>
        </div>
        <SaveIndicator loggedIn={loggedIn} state={saveState} onRetry={() => save(design)} loginHref={`/login?next=${encodeURIComponent(pathname)}`} />
      </div>

      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-12">
        {/* Live preview */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-3xl shadow-2xl shadow-black/20">
          {CARD_THEMES.map((t) => (
            <motion.div
              key={t.id}
              className={`absolute inset-0 ${t.background}`}
              initial={false}
              animate={{ opacity: t.id === design.theme ? 1 : 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              aria-hidden
            />
          ))}
          <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-white/15" aria-hidden />
          <div className="absolute -top-10 left-1/3 size-32 rounded-full bg-white/10" aria-hidden />

          <div className={`relative flex h-full flex-col justify-end p-6 transition-colors duration-500 ${theme.text}`}>
            <span className="mb-auto w-fit rounded-full bg-white/25 px-3 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
              {event.category}
            </span>
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">You&apos;re going to</p>
            <h3 className="mt-1 text-3xl leading-tight font-extrabold">{event.title}</h3>
            <div className="mt-4 space-y-0.5 text-sm font-semibold opacity-90">
              <p>{formatEventDate(event.startsAt)}</p>
              <p>
                {event.city} · {formatPrice(event.price)}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {design.stickers.map((id, index) => {
              const sticker = STICKERS.find((s) => s.id === id)!;
              const slot = SLOTS[index];
              return (
                <motion.button
                  key={id}
                  type="button"
                  layout
                  onClick={() => toggleSticker(id)}
                  aria-label={`Remove ${sticker.label} sticker`}
                  className="absolute z-10 cursor-pointer text-5xl drop-shadow-lg select-none sm:text-6xl"
                  style={slot.style}
                  initial={{ scale: 0, rotate: -45, opacity: 0 }}
                  animate={{ scale: 1, rotate: slot.rotate, opacity: 1 }}
                  exit={{ scale: 0, rotate: 45, opacity: 0 }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                >
                  {sticker.emoji}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {loggedIn && !loaded && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/20 backdrop-blur-[2px]">
              <Spinner className="size-8 text-white" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <fieldset>
            <legend className="mb-3 text-sm font-bold">Background</legend>
            <div className="grid grid-cols-3 gap-3">
              {CARD_THEMES.map((t) => {
                const selected = t.id === design.theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => !selected && update({ ...design, theme: t.id })}
                    aria-pressed={selected}
                    className={`group rounded-2xl border-2 p-1.5 text-left transition ${
                      selected ? "border-brand-600" : "border-line hover:border-ink/25"
                    }`}
                  >
                    <span className={`relative block h-14 rounded-xl ${t.swatch}`}>
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-white text-brand-600 shadow">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block px-1 pb-0.5 text-xs font-semibold">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-bold">
              Stickers
              <span className={`text-xs font-semibold ${full ? "text-brand-700" : "text-muted"}`}>
                {design.stickers.length}/{MAX_STICKERS} added
              </span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {STICKERS.map((s) => {
                const selected = design.stickers.includes(s.id);
                const disabled = !selected && full;
                return (
                  <motion.button
                    key={s.id}
                    type="button"
                    whileTap={disabled ? undefined : { scale: 0.85 }}
                    onClick={() => toggleSticker(s.id)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`${selected ? "Remove" : "Add"} ${s.label} sticker`}
                    className={`relative grid size-14 place-items-center rounded-2xl border-2 text-3xl transition ${
                      selected ? "border-brand-600 bg-brand-50" : "border-line bg-surface hover:border-ink/25"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {s.emoji}
                    {selected && (
                      <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <p className="mt-3 min-h-5 text-xs text-muted">
              {full ? "That's the maximum. Remove a sticker to add another." : "Tap a sticker to add it to your card."}
            </p>
          </fieldset>
        </div>
      </div>
    </section>
  );
}

function SaveIndicator({
  loggedIn,
  state,
  onRetry,
  loginHref,
}: {
  loggedIn: boolean;
  state: SaveState;
  onRetry: () => void;
  loginHref: string;
}) {
  if (!loggedIn) {
    return (
      <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
        <Link href={loginHref} className="font-bold underline underline-offset-2">
          Log in
        </Link>{" "}
        to save your design
      </p>
    );
  }
  return (
    <p className="flex min-h-9 items-center gap-1.5 text-sm text-muted" aria-live="polite">
      {state === "saving" && (
        <>
          <Spinner /> Saving…
        </>
      )}
      {state === "saved" && (
        <>
          <CloudCheck className="size-4 text-emerald-600" aria-hidden /> Saved
        </>
      )}
      {state === "error" && (
        <>
          <CloudAlert className="size-4 text-red-500" aria-hidden /> Not saved.
          <button onClick={onRetry} className="font-semibold text-brand-700 underline underline-offset-2">
            Retry
          </button>
        </>
      )}
    </p>
  );
}
