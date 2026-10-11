"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { ErrorState } from "@/components/ui";

// Catches unexpected crashes in any page so users see a friendly message, not a blank screen.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState message="This page hit an unexpected problem. Please try again." onRetry={retry} />;
}
