export type CardType = 'yellow' | 'blue' | 'red'

export interface Player {
  id: string
  name: string
  emoji: string
  created_at: string
}

export interface Gathering {
  id: string
  name: string
  date: string
  referee_id: string
  assistant_id: string | null
  is_active: boolean
  created_at: string
  referee?: Player
  assistant?: Player
}

export interface Card {
  id: string
  gathering_id: string
  player_id: string
  issued_by: string
  type: CardType
  reason: string | null
  created_at: string
  player?: Player
  issued_by_player?: Player
}

export interface Attendance {
  id: string
  gathering_id: string
  player_id: string
}

export interface PlayerStats {
  player: Player
  yellows: number
  blues: number
  reds: number
  total: number
}

export interface GatheringStats {
  total_cards: number
  total_yellows: number
  total_blues: number
  total_reds: number
  mvp: Player | null // most cards
}

// Supabase generated types (simplified)
export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Player>
      }
      gatherings: {
        Row: Gathering
        Insert: Omit<Gathering, 'id' | 'created_at' | 'is_active'> & { id?: string; created_at?: string; is_active?: boolean }
        Update: Partial<Gathering>
      }
      cards: {
        Row: Card
        Insert: Omit<Card, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Card>
      }
      attendance: {
        Row: Attendance
        Insert: Omit<Attendance, 'id'> & { id?: string }
        Update: Partial<Attendance>
      }
    }
  }
}
