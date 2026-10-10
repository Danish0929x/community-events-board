import type { Metadata } from "next";
import { Suspense } from "react";
import { EventGridSkeleton, PageHeader } from "@/components/ui";
import { EventsBrowser } from "./events-browser";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <>
      <PageHeader title="What's on near you" subtitle="Music nights, workshops, food fairs and more. Nearest dates first." />
      {/* The browser reads filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<EventGridSkeleton />}>
        <EventsBrowser />
      </Suspense>
    </>
  );
}
