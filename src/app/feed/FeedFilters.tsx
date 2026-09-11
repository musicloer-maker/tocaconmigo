'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function FeedFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get('q') || ''
  const currentInstrument = searchParams.get('instrument') || ''
  const currentZone = searchParams.get('zone') || ''

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      router.push(`/feed?${params.toString()}`)
    })
  }

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex flex-wrap gap-4 items-center">
      {/* Búsqueda por Nombre / Bio */}
      <input
        type="text"
        placeholder="Buscar por nombre o bio..."
        defaultValue={currentSearch}
        onChange={(e) => updateFilter('q', e.target.value)}
        className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 flex-1 min-w-[200px] focus:outline-none focus:border-indigo-500 placeholder-slate-400"
      />

      {/* Filtro por Instrumento */}
      <input
        type="text"
        placeholder="Instrumento (ej. Guitarra)"
        defaultValue={currentInstrument}
        onChange={(e) => updateFilter('instrument', e.target.value)}
        className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 w-48 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
      />

      {/* Filtro por Zona */}
      <input
        type="text"
        placeholder="Zona o Ciudad"
        defaultValue={currentZone}
        onChange={(e) => updateFilter('zone', e.target.value)}
        className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 w-48 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
      />

      {isPending && (
        <span className="text-sm text-indigo-400 animate-pulse font-medium">
          Buscando...
        </span>
      )}
    </div>
  )
}