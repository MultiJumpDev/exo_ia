import JSZip from "jszip"
import Phaser from "phaser" // Declare the Phaser variable
import type { HitCircle, BeatmapData } from "@/lib/types/GameTypes"
import { GameUtils } from "./GameUtils"

export class BeatmapParser {
  static async parseBeatmapFile(file: File): Promise<BeatmapData | null> {
    try {
      if (!file.name.endsWith(".osz")) {
        throw new Error("Invalid file format. Please select a .osz file.")
      }

      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)

      // Find .osu file
      const osuFiles = Object.keys(zipContent.files).filter((name) => name.endsWith(".osu"))
      if (osuFiles.length === 0) {
        throw new Error("No .osu file found in the beatmap.")
      }

      // Use the first .osu file found
      const osuFileName = osuFiles[0]
      const osuContent = await zipContent.files[osuFileName].async("text")

      // Parse the .osu file
      const beatmapData = this.parseOsuFile(osuContent)

      // Find audio file
      const audioFiles = Object.keys(zipContent.files).filter(
        (name) => name.endsWith(".mp3") || name.endsWith(".ogg") || name.endsWith(".wav"),
      )

      if (audioFiles.length > 0) {
        const audioFile = zipContent.files[audioFiles[0]]
        const audioBlob = await audioFile.async("blob")
        beatmapData.audioFile = URL.createObjectURL(audioBlob)
      }

      return beatmapData
    } catch (error) {
      console.error("Error parsing beatmap:", error)
      return null
    }
  }

  private static parseOsuFile(content: string): BeatmapData {
    const lines = content.split("\n").map((line) => line.trim())

    const beatmapData: BeatmapData = {
      title: "Unknown",
      artist: "Unknown",
      audioFile: "",
      hitObjects: [],
      bpm: 120,
    }

    let currentSection = ""
    const timingPoints: Array<{ time: number; bpm: number }> = []

    for (const line of lines) {
      if (line.startsWith("[") && line.endsWith("]")) {
        currentSection = line.slice(1, -1)
        continue
      }

      if (line.includes(":") && currentSection === "Metadata") {
        const [key, value] = line.split(":").map((s) => s.trim())
        switch (key) {
          case "Title":
            beatmapData.title = value
            break
          case "Artist":
            beatmapData.artist = value
            break
        }
      }

      if (line.includes(":") && currentSection === "General") {
        const [key, value] = line.split(":").map((s) => s.trim())
        if (key === "AudioFilename") {
          // Audio file will be loaded separately from the zip
        }
      }

      if (currentSection === "TimingPoints" && line.includes(",")) {
        const parts = line.split(",")
        if (parts.length >= 2) {
          const time = Number.parseFloat(parts[0])
          const beatLength = Number.parseFloat(parts[1])

          if (beatLength > 0) {
            const bpm = 60000 / beatLength
            timingPoints.push({ time, bpm })
            if (timingPoints.length === 1) {
              beatmapData.bpm = bpm
            }
          }
        }
      }

      if (currentSection === "HitObjects" && line.includes(",")) {
        const hitObject = this.parseHitObject(line)
        if (hitObject) {
          beatmapData.hitObjects.push(hitObject)
        }
      }
    }

    return beatmapData
  }

  private static parseHitObject(line: string): HitCircle | null {
    const parts = line.split(",")
    if (parts.length < 4) return null

    const x = Number.parseInt(parts[0])
    const y = Number.parseInt(parts[1])
    const time = Number.parseInt(parts[2])
    const type = Number.parseInt(parts[3])

    // Only handle hit circles (type & 1 === 1)
    // Ignore sliders (type & 2 === 2) and spinners (type & 8 === 8) for now
    if ((type & 1) === 1) {
      return {
        x: Math.max(60, Math.min(x, 964)), // Clamp to game area
        y: Math.max(60, Math.min(y, 708)), // Clamp to game area
        time,
        id: GameUtils.generateId(),
        radius: 60,
        clicked: false,
        missed: false,
      }
    }

    return null
  }

  static generateSampleBeatmap(): BeatmapData {
    const hitObjects: HitCircle[] = []
    const startTime = 2000
    const interval = 800

    // Generate a simple pattern
    const patterns = [
      { x: 200, y: 200 },
      { x: 400, y: 300 },
      { x: 600, y: 200 },
      { x: 800, y: 300 },
      { x: 600, y: 400 },
      { x: 400, y: 500 },
      { x: 200, y: 400 },
      { x: 400, y: 300 },
    ]

    for (let i = 0; i < 24; i++) {
      const pattern = patterns[i % patterns.length]
      const circle: HitCircle = {
        x: pattern.x + Phaser.Math.Between(-50, 50), // Use Phaser.Math.Between
        y: pattern.y + Phaser.Math.Between(-50, 50), // Use Phaser.Math.Between
        time: startTime + i * interval,
        id: GameUtils.generateId(),
        radius: 60,
        clicked: false,
        missed: false,
      }
      hitObjects.push(circle)
    }

    return {
      title: "Sample Beatmap",
      artist: "v0 Generated",
      audioFile: "",
      hitObjects,
      bpm: 150,
    }
  }
}
