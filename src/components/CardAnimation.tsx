"use client"

import { useEffect, useState } from "react"
import type { CardType } from "@/lib/types"

interface CardAnimationProps {
  type: CardType
  playerName: string
  reason: string | null
  onClose: () => void
}

const cardConfig: Record<CardType, { bg: string; border: string; emoji: string; label: string }> = {
  yellow: { bg: "bg-card-yellow", border: "border-yellow-300", emoji: "🟡", label: "AMARILLA" },
  blue: { bg: "bg-card-blue", border: "border-blue-300", emoji: "🔵", label: "AZUL" },
  red: { bg: "bg-card-red", border: "border-red-300", emoji: "🔴", label: "ROJA" },
}

export default function CardAnimation({ type, playerName, reason, onClose }: CardAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "shake" | "idle" | "exit">("enter")
  const config = cardConfig[type]

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    timers.push(setTimeout(() => setPhase("shake"), 400))
    timers.push(setTimeout(() => setPhase("idle"), 800))
    timers.push(setTimeout(() => setPhase("exit"), 2700))
    timers.push(setTimeout(() => onClose(), 3000))
    return () => timers.forEach(clearTimeout)
  }, [onClose])

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100vh); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-3deg); }
          40% { transform: rotate(3deg); }
          60% { transform: rotate(-2deg); }
          80% { transform: rotate(2deg); }
        }
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .card-enter {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-shake {
          animation: shake 0.4s ease-in-out;
        }
        .card-exit {
          animation: slideDown 0.3s ease-in forwards;
        }
        .overlay-enter {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .overlay-exit {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${
          phase === "exit" ? "overlay-exit" : "overlay-enter"
        }`}
        onClick={onClose}
      >
        <div
          className={`${
            phase === "enter" ? "card-enter" : phase === "shake" ? "card-shake" : phase === "exit" ? "card-exit" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`${config.bg} ${config.border} border-4 rounded-2xl w-56 h-80 flex flex-col items-center justify-between p-6 shadow-2xl shadow-black/50`}
          >
            {/* Top: card type */}
            <div className="text-center">
              <span className="text-5xl">{config.emoji}</span>
              <p className="text-white font-black text-2xl mt-2 tracking-wider drop-shadow-lg">
                {config.label}
              </p>
            </div>

            {/* Middle: player name */}
            <div className="text-center">
              <p className="text-white font-bold text-xl leading-tight drop-shadow-md">
                {playerName}
              </p>
            </div>

            {/* Bottom: reason */}
            <div className="text-center min-h-[2.5rem]">
              {reason && (
                <p className="text-white/80 text-sm italic leading-snug">
                  &ldquo;{reason}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
