import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { EditEvent } from "./edit-event";

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
  return (
    <Suspense fallback={<FormLoading />}>
      <EditEvent params={params} />
    </Suspense>
  );
}

function FormLoading() {
  return (
    <div className="card mx-auto grid max-w-2xl place-items-center p-16" role="status" aria-label="Loading event">
      <Spinner className="size-6" />
    </div>
  );
}
