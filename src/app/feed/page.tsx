import { Suspense } from "react";
import { EventGridSkeleton } from "@/components/ui";
import { FeedView } from "./feed-view";

export default function FeedPage() {
  return (
    <Suspense fallback={<EventGridSkeleton />}>
      <FeedView />
    </Suspense>
  );
}
