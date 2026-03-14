import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSortBy: string
  currentSortOrder: 'asc' | 'desc'
  onSort: (key: string) => void
}

export default function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortableHeaderProps) {
  const active = currentSortBy === sortKey
  const Icon = active ? (currentSortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      className="text-left px-4 py-3 text-[10px] font-mono text-nexus-500 tracking-widest uppercase cursor-pointer select-none hover:text-nexus-300 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={12} className={active ? 'text-cyan-glow' : 'text-nexus-600'} />
      </span>
    </th>
  )
}
