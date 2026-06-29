export type MoodId =
  | 'happy' | 'laughing' | 'thoughtful' | 'chill'
  | 'debate' | 'listening' | 'venting' | 'hyped'

export interface Mood {
  id: MoodId
  emoji: string
  label: string
  compatibleWith: MoodId[]
}

export const MOODS: Mood[] = [
  { id: 'happy',      emoji: '😊', label: 'Happy & social',     compatibleWith: ['happy', 'laughing', 'hyped', 'listening'] },
  { id: 'laughing',   emoji: '😂', label: 'Here to laugh',      compatibleWith: ['laughing', 'happy', 'hyped'] },
  { id: 'thoughtful', emoji: '🤔', label: 'Deep & thoughtful',  compatibleWith: ['thoughtful', 'debate', 'chill'] },
  { id: 'chill',      emoji: '😴', label: 'Chill & low energy', compatibleWith: ['chill', 'happy', 'thoughtful'] },
  { id: 'debate',     emoji: '🗣️', label: 'Want to debate',     compatibleWith: ['debate', 'thoughtful'] },
  { id: 'listening',  emoji: '🤗', label: 'Want to listen',     compatibleWith: ['venting', 'happy'] },
  { id: 'venting',    emoji: '😢', label: 'Need to vent',       compatibleWith: ['listening'] },
  { id: 'hyped',      emoji: '🎉', label: 'Hyped & energetic',  compatibleWith: ['hyped', 'laughing', 'happy'] },
]

export const MOOD_ADJACENCY: Record<MoodId, MoodId[]> = {
  happy:      ['laughing', 'hyped', 'chill', 'listening'],
  laughing:   ['happy', 'hyped'],
  thoughtful: ['chill', 'debate'],
  chill:      ['happy', 'thoughtful'],
  debate:     ['thoughtful'],
  listening:  ['happy', 'venting'],
  venting:    ['listening'],
  hyped:      ['happy', 'laughing'],
}
