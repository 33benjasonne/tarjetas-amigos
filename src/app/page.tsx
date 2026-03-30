"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Gathering, Player } from "@/lib/types"

interface GatheringWithDetails extends Gathering {
  referee?: Player
  assistant?: Player
  card_count: number
}

export default function Home() {
  const [gatherings, setGatherings] = useState<GatheringWithDetails[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Fetch recent gatherings
      const { data: gatheringsData } = await supabase
        .from("gatherings")
        .select("*")
        .order("date", { ascending: false })
        .limit(10)

      if (gatheringsData) {
        // Fetch referee/assistant details and card counts
        const enriched: GatheringWithDetails[] = await Promise.all(
          gatheringsData.map(async (g) => {
            const [refereeRes, assistantRes, cardsRes] = await Promise.all([
              supabase.from("players").select("*").eq("id", g.referee_id).single(),
              g.assistant_id
                ? supabase.from("players").select("*").eq("id", g.assistant_id).single()
                : Promise.resolve({ data: null }),
              supabase.from("cards").select("id", { count: "exact" }).eq("gathering_id", g.id),
            ])

            return {
              ...g,
              referee: refereeRes.data ?? undefined,
              assistant: assistantRes.data ?? undefined,
              card_count: cardsRes.count ?? 0,
            }
          })
        )
        setGatherings(enriched)
      }

      // Total cards all time
      const { count } = await supabase.from("cards").select("*", { count: "exact", head: true })
      setTotalCards(count ?? 0)

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">⚽</div>
        <p className="text-gray-400 animate-pulse">Cargando juntadas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-black">⚽ Tarjetas</h1>
        <p className="text-gray-400 text-sm mt-1">Sistema de tarjetas entre amigos</p>
      </div>

      {/* Active gathering highlight */}
      {gatherings.filter((g) => g.is_active).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-card-yellow uppercase tracking-wider">
            🔴 En vivo
          </h2>
          {gatherings
            .filter((g) => g.is_active)
            .map((g) => (
              <Link key={g.id} href={`/juntada/${g.id}`}>
                <div className="bg-pitch-light border-2 border-card-yellow rounded-xl p-4 animate-pulse-glow cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{g.name}</p>
                      <p className="text-gray-400 text-sm">
                        🏟️ {g.referee?.name ?? "Sin árbitro"}
                        {g.assistant && ` + ${g.assistant.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-card-yellow/20 text-card-yellow text-xs font-bold px-2 py-1 rounded-full">
                        ACTIVA
                      </span>
                      <p className="text-gray-400 text-xs mt-1">
                        🃏 {g.card_count} tarjetas
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}

      {/* Recent gatherings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Juntadas recientes
        </h2>

        {gatherings.length === 0 ? (
          <div className="bg-pitch-light rounded-xl p-8 text-center">
            <p className="text-5xl mb-3">🏜️</p>
            <p className="text-gray-300 font-semibold">No hay juntadas todavia</p>
            <p className="text-gray-500 text-sm mt-1">
              Dale, crea la primera y empeza a sacar tarjetas
            </p>
            <Link
              href="/juntada/nueva"
              className="inline-block mt-4 bg-card-yellow text-black font-bold px-6 py-2 rounded-full hover:scale-105 transition-transform"
            >
              + Nueva Juntada
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {gatherings
              .filter((g) => !g.is_active)
              .map((g) => (
                <Link key={g.id} href={`/juntada/${g.id}`}>
                  <div className="bg-pitch-light border border-pitch-lighter rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-gray-500 text-xs">
                          📅 {new Date(g.date).toLocaleDateString("es-AR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}🏟️ {g.referee?.name ?? "?"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm font-mono">
                          🃏 {g.card_count}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      {totalCards > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Estadisticas rapidas
          </h2>
          <div className="bg-pitch-light border border-pitch-lighter rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-black text-card-yellow">{totalCards}</p>
                <p className="text-gray-500 text-xs">Tarjetas totales</p>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-300">{gatherings.length}</p>
                <p className="text-gray-500 text-xs">Juntadas</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
