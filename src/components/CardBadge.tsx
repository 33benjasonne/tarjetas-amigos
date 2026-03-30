import type { CardType } from "@/lib/types"

interface CardBadgeProps {
  type: CardType
  count: number
}

const badgeConfig: Record<CardType, { emoji: string; bg: string; text: string }> = {
  yellow: { emoji: "🟡", bg: "bg-card-yellow/20", text: "text-card-yellow" },
  blue: { emoji: "🔵", bg: "bg-card-blue/20", text: "text-card-blue" },
  red: { emoji: "🔴", bg: "bg-card-red/20", text: "text-card-red" },
}

export default function CardBadge({ type, count }: CardBadgeProps) {
  const config = badgeConfig[type]

  return (
    <span
      className={`${config.bg} ${config.text} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold`}
    >
      <span>{config.emoji}</span>
      <span>{count}</span>
    </span>
  )
}
