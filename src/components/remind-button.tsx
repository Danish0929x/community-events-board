"use client";

import { Bell, BellRing } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useAuth } from "./auth-provider";

type Props = { eventId: string; initialReminded: boolean; size?: "sm" | "lg" };

export function RemindButton({ eventId, initialReminded, size = "sm" }: Props) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [reminded, setReminded] = useState(initialReminded);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !reminded;
    setReminded(next); // optimistic: update the screen before the server answers
    setSaving(true);
    try {
      await api(`/api/events/${eventId}/reminder`, { method: next ? "PUT" : "DELETE" });
      toast.success(next ? "We'll remind you about this event" : "Reminder removed");
    } catch (err) {
      setReminded(!next); // roll back to what the server still has
      toast.error(`Couldn't update reminder. ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const Icon = reminded ? BellRing : Bell;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      aria-pressed={reminded}
      className={`btn relative z-10 ${size === "lg" ? "px-5 py-3 text-base" : "px-3 py-2"} ${
        reminded
          ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
          : "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
      } disabled:opacity-100`}
    >
      <Icon className={`size-4 ${reminded ? "animate-[ring_0.5s_ease-in-out]" : ""}`} aria-hidden />
      {reminded ? "Reminder set" : "Remind me"}
    </button>
  );
}
