"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import { CATEGORIES } from "@/lib/constants";
import { localInputToIso } from "@/lib/format";

export function EventForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api("/api/admin/events", {
        method: "POST",
        body: {
          title: f.get("title"),
          category: f.get("category"),
          city: f.get("city"),
          startsAt: f.get("startsAt") ? localInputToIso(String(f.get("startsAt"))) : "",
          price: Number(f.get("price")),
          description: f.get("description"),
          imageUrl: f.get("imageUrl"),
          isActive: f.get("isActive") === "on",
        },
      });
      toast.success("Event added");
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add an event" subtitle="Date and time are in IST." />
      <form onSubmit={onSubmit} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
        <Field label="Title" className="sm:col-span-2">
          <input name="title" required className="field" placeholder="Jazz & Blues Night" />
        </Field>
        <Field label="Category">
          <select name="category" required className="field">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input name="city" required className="field" placeholder="Coimbatore" />
        </Field>
        <Field label="Date and time">
          <input name="startsAt" type="datetime-local" required className="field" />
        </Field>
        <Field label="Price (₹, 0 for free)">
          <input name="price" type="number" min={0} step={1} required defaultValue={0} className="field" />
        </Field>
        <Field label="Image URL" className="sm:col-span-2">
          <input name="imageUrl" type="url" required className="field" placeholder="https://…" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea name="description" required rows={4} className="field" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input name="isActive" type="checkbox" defaultChecked className="size-4 accent-brand-600" /> Active (visible to visitors)
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <button type="button" onClick={() => router.push("/admin")} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Spinner />} Add event
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
