import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      emoji="🧭"
      title="Page not found"
      message="The page you're looking for doesn't exist or has moved."
      action={
        <Link href="/events" className="btn-primary">
          Browse events
        </Link>
      }
    />
  );
}
