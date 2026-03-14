import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationFooterProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  /** Extra wrapper classes (e.g. "px-6" when inside a card) */
  className?: string
}

export default function PaginationFooter({
  page,
  totalPages,
  total,
  onPageChange,
  className = '',
}: PaginationFooterProps) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-xs font-mono text-nexus-500">
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="btn-ghost p-2 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-ghost p-2 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
