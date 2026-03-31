/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Gathering, Player, Card, CardType } from "@/lib/types"
import IssueCardModal from "@/components/IssueCardModal"
import CardFeed from "@/components/CardFeed"
import CardAnimation from "@/components/CardAnimation"

interface CardWithPlayers extends Card {
  player?: Player
  issued_by_player?: Player
}

interface PlayerWithCards extends Player {
  yellows: number
  blues: number
  reds: number
}

export default function JuntadaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [gathering, setGathering] = useState<Gathering | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [referee, setReferee] = useState<Player | null>(null)
  const [assistant, setAssistant] = useState<Player | null>(null)
  const [attendees, setAttendees] = useState<Player[]>([])
  const [cards, setCards] = useState<CardWithPlayers[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [animatingCard, setAnimatingCard] = useState<{
    type: CardType
    playerName: string
    reason: string | null
  } | null>(null)

  const fetchCards = useCallback(async () => {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("*")
      .eq("gathering_id", id)
      .order("created_at", { ascending: false })

    if (cardsData) {
      const playerIds = Array.from(new Set([...cardsData.map((c: Record<string, string>) => c.player_id), ...cardsData.map((c: Record<string, string>) => c.issued_by)]))
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .in("id", playerIds.length > 0 ? playerIds : ["none"])

      const playersMap = new Map((playersData ?? []).map((p) => [p.id, p]))

      const enriched: CardWithPlayers[] = cardsData.map((c) => ({
        ...c,
        player: playersMap.get(c.player_id),
        issued_by_player: playersMap.get(c.issued_by),
      }))

      setCards(enriched)
    }
  }, [id])

  useEffect(() => {
    async function fetchData() {
      // Fetch gathering
      const { data: g } = await supabase
        .from("gatherings")
        .select("*")
        .eq("id", id)
        .single()

      if (!g) {
        setLoading(false)
        return
      }

      setGathering(g)

      // Fetch referee, assistant, attendees in parallel
      const [refereeRes, assistantRes, attendanceRes] = await Promise.all([
        supabase.from("players").select("*").eq("id", g.referee_id).single(),
        g.assistant_id
          ? supabase.from("players").select("*").eq("id", g.assistant_id).single()
          : Promise.resolve({ data: null }),
        supabase.from("attendance").select("player_id").eq("gathering_id", id),
      ])

      setReferee(refereeRes.data)
      setAssistant(assistantRes.data)

      if (attendanceRes.data) {
        const playerIds = attendanceRes.data.map((a) => a.player_id)
        if (playerIds.length > 0) {
          const { data: playersData } = await supabase
            .from("players")
            .select("*")
            .in("id", playerIds)
            .order("name")
          setAttendees(playersData ?? [])
        }
      }

      await fetchCards()
      setLoading(false)
    }

    fetchData()
  }, [id, fetchCards])

  const handleCardIssued = async (card: { player_id: string; type: CardType; reason: string | null }) => {
    const player = attendees.find((p) => p.id === card.player_id)
    if (player) {
      setAnimatingCard({
        type: card.type,
        playerName: player.name,
        reason: card.reason,
      })
    }
    await fetchCards()
  }

  const handleDelete = async () => {
    if (!confirm("¿Seguro que querés eliminar esta juntada? Se pierden todas las tarjetas.")) return

    // Delete in order due to foreign keys: cards → attendance → gathering
    await supabase.from("cards").delete().eq("gathering_id", id)
    await supabase.from("attendance").delete().eq("gathering_id", id)
    await supabase.from("gatherings").delete().eq("id", id)

    router.push("/")
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const path = `${id}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("gathering-photos")
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error("Error uploading photo:", uploadError)
        setUploadingPhoto(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from("gathering-photos")
        .getPublicUrl(path)

      const photoUrl = urlData.publicUrl

      await supabase
        .from("gatherings")
        .update({ photo_url: photoUrl })
        .eq("id", id)

      setGathering((prev) => prev ? { ...prev, photo_url: photoUrl } : prev)
    } catch (err) {
      console.error("Error uploading photo:", err)
    }
    setUploadingPhoto(false)

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">🃏</div>
        <p className="text-gray-400 animate-pulse">Cargando juntada...</p>
      </div>
    )
  }

  if (!gathering) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-5xl">🤷</p>
        <p className="text-gray-400">Juntada no encontrada</p>
        <Link href="/" className="text-card-yellow hover:underline text-sm">
          Volver al inicio
        </Link>
      </div>
    )
  }

  // Stats
  const totalYellows = cards.filter((c) => c.type === "yellow").length
  const totalBlues = cards.filter((c) => c.type === "blue").length
  const totalReds = cards.filter((c) => c.type === "red").length

  // Player card counts for this gathering
  const playerCardCounts: PlayerWithCards[] = attendees.map((p) => {
    const playerCards = cards.filter((c) => c.player_id === p.id)
    return {
      ...p,
      yellows: playerCards.filter((c) => c.type === "yellow").length,
      blues: playerCards.filter((c) => c.type === "blue").length,
      reds: playerCards.filter((c) => c.type === "red").length,
    }
  })

  const formattedDate = new Date(gathering.date).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black">{gathering.name}</h1>
            <p className="text-gray-400 text-sm capitalize">{formattedDate}</p>
          </div>
          {gathering.is_active && (
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              EN VIVO
            </span>
          )}
        </div>

        {/* Referee & Assistant badges */}
        <div className="flex gap-2 mt-3">
          <div className="bg-pitch-light border border-pitch-lighter rounded-lg px-3 py-1.5 text-sm">
            🏟️ <span className="font-semibold">{referee?.name ?? "?"}</span>
          </div>
          {assistant && (
            <div className="bg-pitch-light border border-pitch-lighter rounded-lg px-3 py-1.5 text-sm">
              🤝 <span className="font-semibold">{assistant.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Photo section */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        {gathering.photo_url ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full relative group"
            disabled={uploadingPhoto}
          >
            <img
              src={gathering.photo_url}
              alt={`Foto de ${gathering.name}`}
              className="w-full rounded-xl object-cover max-h-64"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">📸 Cambiar foto</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-full bg-pitch-light border border-dashed border-pitch-lighter rounded-xl px-4 py-6 text-gray-500 hover:text-gray-400 hover:border-gray-500 transition-colors text-sm"
          >
            {uploadingPhoto ? (
              <span className="animate-pulse">Subiendo foto...</span>
            ) : (
              "📸 Subir foto de la juntada"
            )}
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card-yellow/10 border border-card-yellow/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-card-yellow">{totalYellows}</p>
          <p className="text-[10px] text-gray-400">🟡 Amarillas</p>
        </div>
        <div className="bg-card-blue/10 border border-card-blue/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-card-blue">{totalBlues}</p>
          <p className="text-[10px] text-gray-400">🔵 Azules</p>
        </div>
        <div className="bg-card-red/10 border border-card-red/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-card-red">{totalReds}</p>
          <p className="text-[10px] text-gray-400">🔴 Rojas</p>
        </div>
      </div>

      {/* Player grid */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          👥 Jugadores ({attendees.length})
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {playerCardCounts
            .sort((a, b) => (b.yellows + b.blues + b.reds) - (a.yellows + a.blues + a.reds))
            .map((p) => {
              const total = p.yellows + p.blues + p.reds
              return (
                <Link key={p.id} href={`/jugador/${p.id}`}>
                  <div className="bg-pitch-light border border-pitch-lighter rounded-xl px-3 py-2.5 hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <span className="font-medium text-sm truncate">{p.name.split(" ")[0]}</span>
                    </div>
                    {total > 0 && (
                      <div className="flex gap-2 mt-1 text-xs">
                        {p.yellows > 0 && <span className="text-card-yellow">🟡{p.yellows}</span>}
                        {p.blues > 0 && <span className="text-card-blue">🔵{p.blues}</span>}
                        {p.reds > 0 && <span className="text-card-red">🔴{p.reds}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
        </div>
      </div>

      {/* Card feed / timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          📋 Timeline
        </h2>
        <CardFeed cards={cards} />
      </div>

      {/* Close gathering button */}
      {gathering.is_active && (
        <div className="flex justify-center">
          <button
            onClick={async () => {
              if (confirm("¿Cerrar esta juntada? No se van a poder sacar más tarjetas.")) {
                await supabase.from("gatherings").update({ is_active: false }).eq("id", id)
                setGathering({ ...gathering, is_active: false })
              }
            }}
            className="text-sm text-gray-500 hover:text-red-400 border border-pitch-lighter rounded-xl px-4 py-2 transition-colors"
          >
            🔒 Cerrar juntada
          </button>
        </div>
      )}

      {/* Delete gathering button (only when closed) */}
      {!gathering.is_active && (
        <div className="flex justify-center">
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            🗑️ Eliminar juntada
          </button>
        </div>
      )}

      {/* Floating action button */}
      {gathering.is_active && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-4 left-4 max-w-md mx-auto bg-card-yellow text-black font-black py-4 rounded-2xl text-lg shadow-lg shadow-card-yellow/30 hover:scale-[1.02] active:scale-[0.98] transition-transform z-30"
        >
          🃏 SACAR TARJETA
        </button>
      )}

      {/* Closed state */}
      {!gathering.is_active && (
        <div className="fixed bottom-20 right-4 left-4 max-w-md mx-auto bg-pitch-lighter text-gray-400 font-bold py-4 rounded-2xl text-lg text-center z-30">
          🔒 Juntada cerrada
        </div>
      )}

      {/* Issue card modal */}
      {showModal && (
        <IssueCardModal
          gatheringId={id}
          players={attendees}
          issuerId={referee?.id ?? ""}
          onClose={() => setShowModal(false)}
          onCardIssued={handleCardIssued}
        />
      )}

      {/* Card animation overlay */}
      {animatingCard && (
        <CardAnimation
          type={animatingCard.type}
          playerName={animatingCard.playerName}
          reason={animatingCard.reason}
          onClose={() => setAnimatingCard(null)}
        />
      )}
    </div>
  )
}
