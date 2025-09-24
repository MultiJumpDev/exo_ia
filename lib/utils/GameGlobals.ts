import type { BeatmapData } from "@/lib/types/GameTypes"

class GameGlobalsManager {
  private static instance: GameGlobalsManager
  private currentBeatmap?: BeatmapData

  private constructor() {}

  static getInstance(): GameGlobalsManager {
    if (!GameGlobalsManager.instance) {
      GameGlobalsManager.instance = new GameGlobalsManager()
    }
    return GameGlobalsManager.instance
  }

  setCurrentBeatmap(beatmap: BeatmapData) {
    this.currentBeatmap = beatmap
  }

  getCurrentBeatmap(): BeatmapData | undefined {
    return this.currentBeatmap
  }

  clearCurrentBeatmap() {
    this.currentBeatmap = undefined
  }
}

export const GameGlobals = GameGlobalsManager.getInstance()
