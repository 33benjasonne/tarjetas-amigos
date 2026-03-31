"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/lib/types"

export default function NuevaJuntadaPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [refereeId, setRefereeId] = useState("")
  const [assistantId, setAssistantId] = useState("")
  const [attendees, setAttendees] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchPlayers() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .order("name")

      if (data) {
        setPlayers(data)
        // Default referee to Joaquin Ibanez if found
        const joaquin = data.find((p) =>
          p.name.toLowerCase().includes("joaqu") && p.name.toLowerCase().includes("iba")
        )
        if (joaquin) setRefereeId(joaquin.id)
        // Select all players by default
        setAttendees(new Set(data.map((p) => p.id)))
      }
      setLoading(false)
    }

    fetchPlayers()
  }, [])

  const toggleAttendee = (id: string) => {
    setAttendees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setAttendees(new Set(players.map((p) => p.id)))
  }

  const selectNone = () => {
    setAttendees(new Set())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !refereeId) return

    setSubmitting(true)

    try {
      // Create gathering
      const { data: gathering, error: gatheringError } = await supabase
        .from("gatherings")
        .insert({
          name: name.trim(),
          date,
          referee_id: refereeId,
          assistant_id: assistantId || null,
          is_active: true,
        })
        .select()
        .single()

      if (gatheringError || !gathering) {
        console.error("Error creating gathering:", gatheringError)
        setSubmitting(false)
        return
      }

      // Create attendance records
      const attendanceRecords = Array.from(attendees).map((playerId) => ({
        gathering_id: gathering.id,
        player_id: playerId,
      }))

      if (attendanceRecords.length > 0) {
        const { error: attendanceError } = await supabase
          .from("attendance")
          .insert(attendanceRecords)

        if (attendanceError) {
          console.error("Error creating attendance:", attendanceError)
        }
      }

      router.push(`/juntada/${gathering.id}`)
    } catch (err) {
      console.error("Error:", err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">📋</div>
        <p className="text-gray-400 animate-pulse">Cargando jugadores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="pt-4">
        <Link href="/" className="text-gray-400 text-sm hover:text-gray-300 transition-colors">
          ← Volver
        </Link>
        <h1 className="text-2xl font-black mt-2">➕ Nueva Juntada Muchachera</h1>
        <p className="text-gray-400 text-sm mt-1">Arma la juntada y empieza a sacar tarjetas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Nombre de la juntada</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Semanal en Pacheco 53"
            required
            className="w-full bg-pitch-light border border-pitch-lighter rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-card-yellow transition-colors"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-pitch-light border border-pitch-lighter rounded-xl px-4 py-3 text-white focus:outline-none focus:border-card-yellow transition-colors"
          />
        </div>

        {/* Referee */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">🏟️ Arbitro</label>
          <select
            value={refereeId}
            onChange={(e) => setRefereeId(e.target.value)}
            required
            className="w-full bg-pitch-light border border-pitch-lighter rounded-xl px-4 py-3 text-white focus:outline-none focus:border-card-yellow transition-colors"
          >
            <option value="">Seleccionar arbitro...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assistant */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">🤝 Asistente (opcional)</label>
          <select
            value={assistantId}
            onChange={(e) => setAssistantId(e.target.value)}
            className="w-full bg-pitch-light border border-pitch-lighter rounded-xl px-4 py-3 text-white focus:outline-none focus:border-card-yellow transition-colors"
          >
            <option value="">Sin asistente</option>
            {players
              .filter((p) => p.id !== refereeId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
          </select>
        </div>

        {/* Attendees */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-300">
              👥 Quienes juegan ({attendees.size}/{players.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-card-yellow hover:underline"
              >
                Todos
              </button>
              <span className="text-gray-600">|</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-xs text-gray-400 hover:underline"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleAttendee(p.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                  attendees.has(p.id)
                    ? "bg-pitch-lighter border-card-yellow/50 text-white"
                    : "bg-pitch-light border-pitch-lighter text-gray-500"
                }`}
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="truncate">{p.name.split(" ")[0]}</span>
                {attendees.has(p.id) && <span className="ml-auto text-card-yellow">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !name.trim() || !refereeId}
          className="w-full bg-card-yellow text-black font-bold py-4 rounded-xl text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? (
            <span className="animate-pulse">Creando juntada...</span>
          ) : (
            "⚽ Crear Juntada"
          )}
        </button>
      </form>
    </div>
  )
}
