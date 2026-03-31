"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Player, CardType } from "@/lib/types"

interface IssueCardModalProps {
  gatheringId: string
  players: Player[]
  issuerId: string
  onClose: () => void
  onCardIssued: (card: { player_id: string; type: CardType; reason: string | null }) => void
}

const cardTypes: { type: CardType; emoji: string; label: string; color: string; bg: string }[] = [
  { type: "yellow", emoji: "🟡", label: "Amarilla", color: "text-card-yellow", bg: "bg-card-yellow" },
  { type: "blue", emoji: "🔵", label: "Azul", color: "text-card-blue", bg: "bg-card-blue" },
  { type: "red", emoji: "🔴", label: "Roja", color: "text-card-red", bg: "bg-card-red" },
]

const quickReasons = [
  "Dijo una boludes",
  "Llegó tarde",
  "Se cree canchero",
  "Quemó la carne",
  "Habla de más",
  "Se fue al pasto",
  "Dijo algo de Messi",
  "No para de joder",
]

function playWhistle() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(1800, ctx.currentTime)
    oscillator.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.35)
  } catch {
    // Audio not supported, silently ignore
  }
}

export default function IssueCardModal({
  gatheringId,
  players,
  issuerId,
  onClose,
  onCardIssued,
}: IssueCardModalProps) {
  const [step, setStep] = useState<"player" | "type" | "reason">("player")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedType, setSelectedType] = useState<CardType | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedPlayer || !selectedType) return

    setSubmitting(true)

    const { error } = await supabase.from("cards").insert({
      gathering_id: gatheringId,
      player_id: selectedPlayer.id,
      issued_by: issuerId,
      type: selectedType,
      reason: reason.trim() || null,
    })

    if (!error) {
      playWhistle()
      onCardIssued({
        player_id: selectedPlayer.id,
        type: selectedType,
        reason: reason.trim() || null,
      })
    }

    setSubmitting(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-pitch-light w-full max-w-md rounded-t-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">
            {step === "player" && "👤 A quién?"}
            {step === "type" && "🃏 Qué tarjeta?"}
            {step === "reason" && "📝 Por qué?"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1">
          {["player", "type", "reason"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                ["player", "type", "reason"].indexOf(step) >= i
                  ? "bg-card-yellow"
                  : "bg-pitch-lighter"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Select player */}
        {step === "player" && (
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlayer(p)
                  setStep("type")
                }}
                className="flex items-center gap-2 bg-pitch border border-pitch-lighter rounded-xl px-3 py-3 hover:border-card-yellow transition-colors text-left"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-sm font-medium truncate">{p.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select card type */}
        {step === "type" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("player")}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              ← {selectedPlayer?.emoji} {selectedPlayer?.name}
            </button>

            <div className="grid grid-cols-3 gap-3">
              {cardTypes.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => {
                    setSelectedType(ct.type)
                    setStep("reason")
                  }}
                  className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-transparent hover:scale-105 transition-all card-${ct.type}`}
                >
                  <span className="text-4xl">{ct.emoji}</span>
                  <span className="text-white font-bold text-sm">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Reason */}
        {step === "reason" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("type")}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              ← Cambiar tarjeta
            </button>

            {/* Summary */}
            <div className="flex items-center gap-3 bg-pitch rounded-xl px-4 py-3">
              <span className="text-2xl">{selectedPlayer?.emoji}</span>
              <span className="font-semibold">{selectedPlayer?.name}</span>
              <span className="ml-auto text-2xl">
                {cardTypes.find((ct) => ct.type === selectedType)?.emoji}
              </span>
            </div>

            {/* Quick reasons */}
            <div className="flex flex-wrap gap-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(reason === r ? "" : r)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    reason === r
                      ? "border-card-yellow bg-card-yellow/20 text-card-yellow"
                      : "bg-pitch-lighter border-pitch-lighter text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Custom reason */}
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="O escribi la razon..."
              className="w-full bg-pitch border border-pitch-lighter rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-card-yellow transition-colors"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-card-yellow text-black font-bold py-4 rounded-xl text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {submitting ? "Sacando..." : "🃏 Sacar Tarjeta!"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
