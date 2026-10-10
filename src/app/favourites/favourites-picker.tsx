"use client";

import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import { CATEGORIES, type Category } from "@/lib/constants";
import { useApi } from "@/lib/use-api";

const EMOJI: Record<Category, string> = { Music: "🎶", Workshop: "🛠️", Food: "🍛", Sports: "🏏", Kids: "🧸" };

export function FavouritesPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, setSession } = useAuth();
  const current = useApi<{ categories: Category[] }>("/api/me/favourites");
  const [picked, setPicked] = useState<Category[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (current.error) return <ErrorState message={current.error} onRetry={current.reload} />;
  const selected = picked ?? current.data?.categories ?? [];

  function toggle(c: Category) {
    setPicked(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ categories: Category[] }>("/api/me/favourites", { method: "PUT", body: { categories: selected } });
      if (session) setSession({ ...session, favourites: res.categories });
      const next = searchParams.get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/feed");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="What do you enjoy?" subtitle="Pick your favourite categories and we'll build My Feed around them." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              disabled={current.loading}
              aria-pressed={on}
              className={`card relative flex flex-col items-center gap-2 p-5 font-bold transition ${
                on ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600" : "hover:border-ink/25"
              } disabled:animate-pulse`}
            >
              <span className="text-4xl" aria-hidden>
                {EMOJI[c]}
              </span>
              {c}
              {on && (
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-brand-600 text-white">
                  <Check className="size-4" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{selected.length} selected</p>
        <button onClick={save} disabled={saving || current.loading} className="btn-primary">
          {saving && <Spinner />} Save and see my feed
        </button>
      </div>
    </div>
  );
}
