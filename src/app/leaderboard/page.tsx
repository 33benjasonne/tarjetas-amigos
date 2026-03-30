"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { PlayerStats } from "@/lib/types"

export default function LeaderboardPage() {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [playersRes, cardsRes] = await Promise.all([
        supabase.from("players").select("*"),
        supabase.from("cards").select("*"),
      ])

      const players = playersRes.data ?? []
      const cards = cardsRes.data ?? []

      const playerStats: PlayerStats[] = players.map((p) => {
        const playerCards = cards.filter((c) => c.player_id === p.id)
        const yellows = playerCards.filter((c) => c.type === "yellow").length
        const blues = playerCards.filter((c) => c.type === "blue").length
        const reds = playerCards.filter((c) => c.type === "red").length
        const total = yellows * 1 + blues * 3 + reds * 5

        return { player: p, yellows, blues, reds, total }
      })

      playerStats.sort((a, b) => b.total - a.total)
      setStats(playerStats)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">🏆</div>
        <p className="text-gray-400 animate-pulse">Calculando ranking...</p>
      </div>
    )
  }

  const rankEmoji = (i: number) => {
    if (i === 0) return "🥇"
    if (i === 1) return "🥈"
    if (i === 2) return "🥉"
    return `${i + 1}.`
  }

  const topBorder = (i: number) => {
    if (i === 0) return "border-card-yellow/50 bg-card-yellow/5"
    if (i === 1) return "border-gray-400/30 bg-gray-400/5"
    if (i === 2) return "border-orange-600/30 bg-orange-600/5"
    return "border-pitch-lighter"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-black">Hall de la Infamia 🏆</h1>
        <p className="text-gray-400 text-sm mt-1">Ranking historico de tarjetas</p>
        <p className="text-gray-600 text-xs mt-0.5">
          🟡 = 1pt · 🔵 = 3pts · 🔴 = 5pts
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="bg-pitch-light rounded-xl p-8 text-center">
          <p className="text-5xl mb-3">😇</p>
          <p className="text-gray-300 font-semibold">Nadie tiene tarjetas todavia</p>
          <p className="text-gray-500 text-sm mt-1">Son todos unos santos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stats.map((s, i) => (
            <Link key={s.player.id} href={`/jugador/${s.player.id}`}>
              <div
                className={`bg-pitch-light border rounded-xl px-4 py-3 hover:scale-[1.01] transition-transform cursor-pointer ${topBorder(i)}`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className={`text-xl font-black w-8 text-center ${i < 3 ? "text-2xl" : "text-gray-500 text-sm"}`}>
                    {rankEmoji(i)}
                  </span>

                  {/* Player */}
                  <span className="text-2xl">{s.player.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${i === 0 ? "text-card-yellow" : ""}`}>
                      {s.player.name}
                    </p>
                    <div className="flex gap-3 text-xs mt-0.5">
                      {s.yellows > 0 && <span className="text-card-yellow">🟡 {s.yellows}</span>}
                      {s.blues > 0 && <span className="text-card-blue">🔵 {s.blues}</span>}
                      {s.reds > 0 && <span className="text-card-red">🔴 {s.reds}</span>}
                    </div>
                  </div>

                  {/* Total points */}
                  <div className="text-right">
                    <p className={`text-2xl font-black ${i === 0 ? "text-card-yellow" : "text-gray-300"}`}>
                      {s.total}
                    </p>
                    <p className="text-gray-600 text-[10px]">pts</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
