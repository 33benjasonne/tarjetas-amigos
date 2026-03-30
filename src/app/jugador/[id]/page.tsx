"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Player, Card, Gathering, CardType } from "@/lib/types"

interface CardWithDetails extends Card {
  gathering?: Gathering
}

export default function JugadorPage() {
  const params = useParams()
  const id = params.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [cards, setCards] = useState<CardWithDetails[]>([])
  const [worstGathering, setWorstGathering] = useState<{ gathering: Gathering; count: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Fetch player
      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single()

      if (!playerData) {
        setLoading(false)
        return
      }

      setPlayer(playerData)

      // Fetch all cards for this player
      const { data: cardsData } = await supabase
        .from("cards")
        .select("*")
        .eq("player_id", id)
        .order("created_at", { ascending: false })

      if (cardsData && cardsData.length > 0) {
        // Fetch all related gatherings
        const gatheringIds = Array.from(new Set(cardsData.map((c: Record<string, string>) => c.gathering_id)))
        const { data: gatheringsData } = await supabase
          .from("gatherings")
          .select("*")
          .in("id", gatheringIds)

        const gatheringsMap = new Map((gatheringsData ?? []).map((g) => [g.id, g]))

        const enrichedCards: CardWithDetails[] = cardsData.map((c) => ({
          ...c,
          gathering: gatheringsMap.get(c.gathering_id),
        }))

        setCards(enrichedCards)

        // Find worst gathering
        const gatheringCounts = new Map<string, number>()
        cardsData.forEach((c) => {
          gatheringCounts.set(c.gathering_id, (gatheringCounts.get(c.gathering_id) ?? 0) + 1)
        })

        let maxId = ""
        let maxCount = 0
        gatheringCounts.forEach((count, gid) => {
          if (count > maxCount) {
            maxCount = count
            maxId = gid
          }
        })

        if (maxId && gatheringsMap.has(maxId)) {
          setWorstGathering({ gathering: gatheringsMap.get(maxId)!, count: maxCount })
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">👤</div>
        <p className="text-gray-400 animate-pulse">Cargando perfil...</p>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-5xl">🤷</p>
        <p className="text-gray-400">Jugador no encontrado</p>
        <Link href="/" className="text-card-yellow hover:underline text-sm">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const yellows = cards.filter((c) => c.type === "yellow").length
  const blues = cards.filter((c) => c.type === "blue").length
  const reds = cards.filter((c) => c.type === "red").length
  const totalPoints = yellows * 1 + blues * 3 + reds * 5

  const typeConfig: Record<CardType, { emoji: string; border: string; bg: string }> = {
    yellow: { emoji: "🟡", border: "border-card-yellow/30", bg: "bg-card-yellow/10" },
    blue: { emoji: "🔵", border: "border-card-blue/30", bg: "bg-card-blue/10" },
    red: { emoji: "🔴", border: "border-card-red/30", bg: "bg-card-red/10" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-6">
        <span className="text-7xl">{player.emoji}</span>
        <h1 className="text-2xl font-black mt-3">{player.name}</h1>
        {totalPoints > 0 && (
          <p className="text-gray-400 text-sm mt-1">
            {totalPoints} pts de infamia
          </p>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card-yellow/10 border border-card-yellow/20 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-card-yellow">{yellows}</p>
          <p className="text-[10px] text-gray-400">🟡 Amarillas</p>
        </div>
        <div className="bg-card-blue/10 border border-card-blue/20 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-card-blue">{blues}</p>
          <p className="text-[10px] text-gray-400">🔵 Azules</p>
        </div>
        <div className="bg-card-red/10 border border-card-red/20 rounded-xl p-3 text-center">
          <p className="text-3xl font-black text-card-red">{reds}</p>
          <p className="text-[10px] text-gray-400">🔴 Rojas</p>
        </div>
      </div>

      {/* Worst gathering */}
      {worstGathering && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            💀 Peor juntada
          </h2>
          <Link href={`/juntada/${worstGathering.gathering.id}`}>
            <div className="bg-card-red/5 border border-card-red/20 rounded-xl p-4 hover:border-card-red/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{worstGathering.gathering.name}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(worstGathering.gathering.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-card-red">{worstGathering.count}</p>
                  <p className="text-gray-600 text-[10px]">tarjetas</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Recent cards timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          📋 Ultimas tarjetas
        </h2>

        {cards.length === 0 ? (
          <div className="bg-pitch-light rounded-xl p-6 text-center">
            <p className="text-4xl mb-2">😇</p>
            <p className="text-gray-400 text-sm">Sin tarjetas todavia</p>
            <p className="text-gray-600 text-xs">Un ejemplo a seguir</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.slice(0, 20).map((card) => {
              const config = typeConfig[card.type]
              const date = new Date(card.created_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })

              return (
                <div
                  key={card.id}
                  className={`${config.bg} border ${config.border} rounded-xl px-4 py-3`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {card.gathering?.name ?? "Juntada desconocida"}
                      </p>
                      {card.reason && (
                        <p className="text-gray-400 text-xs italic mt-0.5 truncate">
                          &ldquo;{card.reason}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs shrink-0">{date}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="text-center pb-4">
        <Link href="/leaderboard" className="text-card-yellow hover:underline text-sm">
          ← Volver al ranking
        </Link>
      </div>
    </div>
  )
}
