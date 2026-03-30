import Link from "next/link"
import type { Player } from "@/lib/types"
import CardBadge from "./CardBadge"

interface PlayerCardProps {
  player: Player
  stats: { yellows: number; blues: number; reds: number }
  onClick?: () => void
}

export default function PlayerCard({ player, stats, onClick }: PlayerCardProps) {
  const totalCards = stats.yellows + stats.blues + stats.reds

  return (
    <Link href={`/jugador/${player.id}`} onClick={onClick}>
      <div className="bg-pitch-light border border-pitch-lighter rounded-xl p-4 hover:bg-pitch-lighter transition-colors cursor-pointer active:scale-95">
        {/* Player identity */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{player.emoji}</span>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{player.name}</p>
            <p className="text-gray-500 text-xs">
              {totalCards === 0
                ? "Sin tarjetas"
                : `${totalCards} tarjeta${totalCards !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Card badges */}
        <div className="flex gap-2 flex-wrap">
          {stats.yellows > 0 && <CardBadge type="yellow" count={stats.yellows} />}
          {stats.blues > 0 && <CardBadge type="blue" count={stats.blues} />}
          {stats.reds > 0 && <CardBadge type="red" count={stats.reds} />}
        </div>
      </div>
    </Link>
  )
}
