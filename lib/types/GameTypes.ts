export interface HitCircle {
  x: number
  y: number
  time: number
  id: string
  radius: number
  clicked: boolean
  missed: boolean
}

export interface GameState {
  score: number
  combo: number
  lives: number
  maxLives: number
  isPlaying: boolean
  currentTime: number
}

export interface BeatmapData {
  title: string
  artist: string
  audioFile: string
  hitObjects: HitCircle[]
  bpm: number
}

export interface ScoreResult {
  score: number
  combo: number
  accuracy: number
  perfect: number
  good: number
  missed: number
}

export interface GameGlobals {
  currentBeatmap?: BeatmapData
}
