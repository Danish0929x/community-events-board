import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { page: number; totalPages: number; onChange: (page: number) => void };

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button className="btn-secondary px-3" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
      </button>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`size-10 rounded-xl text-sm font-semibold transition ${
              n === page ? "bg-ink text-white" : "text-muted hover:bg-black/5"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <button className="btn-secondary px-3" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
