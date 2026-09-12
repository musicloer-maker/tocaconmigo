'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

interface Report {
  id: string
  created_at: string
  reason: string
  details: string
  reporter_id: string
  reported_user_id: string
  reporter?: { full_name: string; username: string }
  reported?: { full_name: string; username: string; avatar_url: string }
}

export default function AdminPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)

    // Obtener reportes
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar reportes:', error)
      setLoading(false)
      return
    }

    if (reportsData && reportsData.length > 0) {
      // Cargar información de perfiles para cada reporte
      const userIds = Array.from(
        new Set([
          ...reportsData.map((r) => r.reporter_id),
          ...reportsData.map((r) => r.reported_user_id),
        ])
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]))

      const formattedReports = reportsData.map((rep) => ({
        ...rep,
        reporter: profileMap.get(rep.reporter_id),
        reported: profileMap.get(rep.reported_user_id),
      }))

      setReports(formattedReports)
    } else {
      setReports([])
    }

    setLoading(false)
  }

  // Eliminar reporte (Marcar como resuelto)
  const handleDismissReport = async (reportId: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', reportId)
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } else {
      alert('Error al descartar reporte.')
    }
  }

  // Eliminar/Suspender perfil del usuario denunciado
  const handleDeleteUser = async (userId: string, reportId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este perfil de la plataforma?')) {
      return
    }

    // 1. Eliminar perfil de la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      alert('Error al eliminar perfil: ' + profileError.message)
      return
    }

    // 2. Limpiar reporte
    await handleDismissReport(reportId)
    alert('Usuario eliminado correctamente.')
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-6">
        <div className="flex justify-between items-center border-b border-stone-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">
              🛡️ Panel de Moderación y Denuncias
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Gestiona los reportes de incumplimiento de las normas de la comunidad TocaConmigo.
            </p>
          </div>
          <button
            onClick={fetchReports}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-2 rounded-xl border border-stone-700 font-semibold"
          >
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <p className="text-center py-12 text-stone-400">Cargando denuncias...</p>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-stone-900 border border-red-500/30 rounded-2xl p-5 shadow-xl space-y-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-stone-800 pb-3">
                  <div>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-2.5 py-1 rounded-md">
                      ⚠️ {report.reason}
                    </span>
                    <p className="text-[11px] text-stone-500 mt-2">
                      Fecha: {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-700"
                    >
                      Descartar Denuncia
                    </button>
                    <button
                      onClick={() => handleDeleteUser(report.reported_user_id, report.id)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      🚫 Eliminar Usuario
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Usuario Denunciado */}
                  <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                    <p className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      Usuario Denunciado
                    </p>
                    <p className="text-stone-200 font-bold text-sm">
                      {report.reported?.full_name || 'Usuario desconocido'}
                    </p>
                    <p className="text-amber-500">@{report.reported?.username}</p>
                  </div>

                  {/* Usuario Denunciante */}
                  <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                    <p className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      Reportado Por
                    </p>
                    <p className="text-stone-200 font-bold text-sm">
                      {report.reporter?.full_name || 'Usuario desconocido'}
                    </p>
                    <p className="text-amber-500">@{report.reporter?.username}</p>
                  </div>
                </div>

                {/* Detalles de la denuncia */}
                {report.details && (
                  <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                    <p className="text-[10px] uppercase font-bold text-stone-500 mb-1">
                      Detalles explicados por el denunciante:
                    </p>
                    <p className="text-stone-300 text-xs italic">
                      "{report.details}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <p className="text-emerald-400 font-bold text-lg">✨ Todo limpio</p>
            <p className="text-xs text-stone-400">
              No hay denuncias pendientes de revisión en este momento.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}