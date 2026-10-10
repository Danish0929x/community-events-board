import { Suspense } from "react";
import { EventDetail, EventDetailSkeleton } from "./event-detail";

export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetail params={params} />
    </Suspense>
  );
}
