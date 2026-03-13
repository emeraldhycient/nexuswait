import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderOpen, Users, Plug, Loader2, X } from 'lucide-react'
import { useSearch } from '../api/hooks'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: results, isLoading } = useSearch(query)

  const hasResults =
    results &&
    (results.projects.length > 0 || results.subscribers.length > 0 || results.integrations.length > 0)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSelect(path: string) {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  return (
    <div className="relative flex items-center gap-3 flex-1 max-w-md">
      <Search size={16} className="text-nexus-500 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search projects, subscribers... (⌘K)"
        className="bg-transparent border-none outline-none text-sm text-nexus-200 placeholder:text-nexus-500 flex-1"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setOpen(false) }}
          className="text-nexus-500 hover:text-nexus-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}

      {open && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-3 w-full min-w-[380px] max-h-[420px] flex flex-col bg-nexus-800 border border-cyan-glow/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="animate-spin text-nexus-500" />
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-10 text-nexus-500">
              <Search size={24} className="mb-2 opacity-30" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-mono font-bold text-nexus-500 tracking-widest uppercase">Projects</span>
                  </div>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(`/dashboard/project/${p.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors text-left"
                    >
                      <FolderOpen size={14} className="text-cyan-glow flex-shrink-0" />
                      <span className="text-sm text-nexus-200 truncate">{p.name}</span>
                      <span className={`ml-auto text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        p.status === 'active' ? 'bg-emerald-glow/10 text-emerald-glow' : 'bg-nexus-600/20 text-nexus-500'
                      }`}>
                        {p.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Subscribers */}
              {results.subscribers.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 border-t border-cyan-glow/[0.04]">
                    <span className="text-[10px] font-mono font-bold text-nexus-500 tracking-widest uppercase">Subscribers</span>
                  </div>
                  {results.subscribers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(`/dashboard/project/${s.projectId}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors text-left"
                    >
                      <Users size={14} className="text-violet-glow flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-nexus-200 truncate block">{s.email}</span>
                        {s.name && <span className="text-[11px] text-nexus-500 truncate block">{s.name}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Integrations */}
              {results.integrations.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 border-t border-cyan-glow/[0.04]">
                    <span className="text-[10px] font-mono font-bold text-nexus-500 tracking-widest uppercase">Integrations</span>
                  </div>
                  {results.integrations.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => handleSelect('/dashboard/form-integrations')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-nexus-700/30 transition-colors text-left"
                    >
                      <Plug size={14} className="text-amber-glow flex-shrink-0" />
                      <span className="text-sm text-nexus-200 truncate">{i.displayName}</span>
                      <span className="ml-auto text-[9px] font-mono text-nexus-500 tracking-wider uppercase">{i.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
