import { LoaderCircle, TriangleAlert, RefreshCw } from "lucide-react";
import type { Category } from "@/lib/constants";

const CATEGORY_STYLES: Record<Category, string> = {
  Music: "bg-violet-100 text-violet-800",
  Workshop: "bg-sky-100 text-sky-800",
  Food: "bg-amber-100 text-amber-800",
  Sports: "bg-emerald-100 text-emerald-800",
  Kids: "bg-pink-100 text-pink-800",
};

export function CategoryBadge({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLES[category]} ${className}`}>
      {category}
    </span>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden />;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  message,
  action,
}: {
  emoji: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-brand-50 text-3xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <TriangleAlert className="mb-3 size-8 text-red-500" aria-hidden />
      <h2 className="font-bold">Something went wrong</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5">
          <RefreshCw className="size-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="aspect-[16/10] animate-pulse bg-line/70" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-line" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-16 animate-pulse rounded bg-line" />
          <div className="h-9 w-28 animate-pulse rounded-xl bg-line" />
        </div>
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading events">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
