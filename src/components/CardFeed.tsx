"use client"

import type { Card, Player, CardType } from "@/lib/types"

interface CardFeedProps {
  cards: (Card & { player?: Player; issued_by_player?: Player })[]
}

const typeConfig: Record<CardType, { emoji: string; label: string; border: string; bg: string }> = {
  yellow: { emoji: "🟡", label: "Amarilla", border: "border-card-yellow/30", bg: "bg-card-yellow/10" },
  blue: { emoji: "🔵", label: "Azul", border: "border-card-blue/30", bg: "bg-card-blue/10" },
  red: { emoji: "🔴", label: "Roja", border: "border-card-red/30", bg: "bg-card-red/10" },
}

export default function CardFeed({ cards }: CardFeedProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-2">😇</p>
        <p className="text-gray-500 text-sm">Todavia no se sacaron tarjetas</p>
        <p className="text-gray-600 text-xs">Seguro no dura mucho...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {cards.map((card, i) => {
        const config = typeConfig[card.type]
        const time = new Date(card.created_at).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })

        return (
          <div
            key={card.id}
            className={`${config.bg} border ${config.border} rounded-xl px-4 py-3 animate-card-appear`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.player?.emoji}</span>
                  <span className="font-bold text-sm">{card.player?.name ?? "?"}</span>
                </div>
                {card.reason && (
                  <p className="text-gray-400 text-xs italic mt-0.5 truncate">
                    &ldquo;{card.reason}&rdquo;
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-gray-500 text-xs">{time}</p>
                <p className="text-gray-600 text-[10px]">
                  por {card.issued_by_player?.name?.split(" ")[0] ?? "?"}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
