import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative flex-1 max-w-lg ${className}`}>
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-500" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field pl-11 w-full"
      />
    </div>
  )
}
