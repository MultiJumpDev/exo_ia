import Phaser from "phaser"
import { BeatmapParser } from "@/lib/utils/BeatmapParser"
import { GameGlobals } from "@/lib/utils/GameGlobals"
import { AudioManager } from "@/lib/utils/AudioManager"

export default class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text
  private importButton!: Phaser.GameObjects.Text
  private sampleButton!: Phaser.GameObjects.Text
  private titleText!: Phaser.GameObjects.Text
  private currentBeatmapText!: Phaser.GameObjects.Text
  private highScoreText!: Phaser.GameObjects.Text
  private audioManager!: AudioManager

  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    const { width, height } = this.cameras.main

    this.audioManager = AudioManager.getInstance()

    // Background particles
    const particles = this.add.particles(0, 0, "circle", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 3000,
      frequency: 100,
      tint: [0x6366f1, 0x8b5cf6, 0x06b6d4],
    })

    // Title
    this.titleText = this.add
      .text(width / 2, height / 4, "OSU! RHYTHM", {
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#6366f1",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // Subtitle
    this.add
      .text(width / 2, height / 4 + 80, "Click the circles to the beat!", {
        fontSize: "24px",
        color: "#e2e8f0",
        fontStyle: "italic",
      })
      .setOrigin(0.5)

    // Current beatmap display
    this.currentBeatmapText = this.add
      .text(width / 2, height / 2 - 50, "", {
        fontSize: "18px",
        color: "#f59e0b",
        align: "center",
      })
      .setOrigin(0.5)

    // High score display
    this.highScoreText = this.add
      .text(width / 2, height / 2 - 20, "", {
        fontSize: "16px",
        color: "#10b981",
        align: "center",
      })
      .setOrigin(0.5)

    // Start button
    this.startButton = this.add
      .text(width / 2, height / 2 + 30, "START GAME", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#6366f1",
        padding: { x: 30, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.startGame())
      .on("pointerover", () => this.startButton.setScale(1.1))
      .on("pointerout", () => this.startButton.setScale(1))

    // Import button
    this.importButton = this.add
      .text(width / 2, height / 2 + 100, "IMPORT BEATMAP (.osz)", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#8b5cf6",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.importBeatmap())
      .on("pointerover", () => this.importButton.setScale(1.05))
      .on("pointerout", () => this.importButton.setScale(1))

    // Sample beatmap button
    this.sampleButton = this.add
      .text(width / 2, height / 2 + 160, "LOAD SAMPLE BEATMAP", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#10b981",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.loadSampleBeatmap())
      .on("pointerover", () => this.sampleButton.setScale(1.05))
      .on("pointerout", () => this.sampleButton.setScale(1))

    // Audio settings button
    const audioButton = this.add
      .text(width / 2, height / 2 + 220, "AUDIO SETTINGS", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#10b981",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.showAudioSettings())
      .on("pointerover", () => audioButton.setScale(1.05))
      .on("pointerout", () => audioButton.setScale(1))

    // Instructions
    this.add
      .text(width / 2, height - 100, "Use mouse to click circles • Hit them at the right time!", {
        fontSize: "18px",
        color: "#94a3b8",
        align: "center",
      })
      .setOrigin(0.5)

    // Update UI with current state
    this.updateUI()
  }

  preload() {
    // Create simple circle texture
    this.load.image(
      "circle",
      "data:image/svg+xml;base64," +
        btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#6366f1" stroke="#ffffff" stroke-width="4"/>
      </svg>
    `),
    )

    // Create hit circle texture
    this.load.image(
      "hitcircle",
      "data:image/svg+xml;base64," +
        btoa(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="55" fill="#f59e0b" stroke="#ffffff" stroke-width="6"/>
        <circle cx="60" cy="60" r="35" fill="none" stroke="#ffffff" stroke-width="3"/>
      </svg>
    `),
    )
  }

  private updateUI() {
    const currentBeatmap = GameGlobals.getCurrentBeatmap()
    if (currentBeatmap) {
      this.currentBeatmapText.setText(
        `Current: ${currentBeatmap.title} - ${currentBeatmap.artist}\n${currentBeatmap.hitObjects.length} circles`,
      )
    } else {
      this.currentBeatmapText.setText("No beatmap loaded - using default")
    }

    // Show high score
    try {
      const highScore = localStorage.getItem("osu-high-score")
      const highAccuracy = localStorage.getItem("osu-high-accuracy")
      if (highScore) {
        const accuracy = highAccuracy ? Number.parseFloat(highAccuracy).toFixed(1) : "0.0"
        this.highScoreText.setText(`High Score: ${Number.parseInt(highScore).toLocaleString()} (${accuracy}%)`)
      }
    } catch (error) {
      console.warn("Could not load high score:", error)
    }
  }

  private startGame() {
    this.scene.start("GameScene")
  }

  private importBeatmap() {
    // Create file input element
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".osz"
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        this.handleBeatmapFile(file)
      }
    }
    input.click()
  }

  private async handleBeatmapFile(file: File) {
    try {
      // Show loading message
      const loadingText = this.add
        .text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Loading beatmap...", {
          fontSize: "24px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)

      const beatmapData = await BeatmapParser.parseBeatmapFile(file)

      loadingText.destroy()

      if (beatmapData) {
        GameGlobals.setCurrentBeatmap(beatmapData)
        this.updateUI()

        // Show success message
        const successText = this.add
          .text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Beatmap loaded successfully!", {
            fontSize: "20px",
            color: "#10b981",
            backgroundColor: "#000000",
            padding: { x: 15, y: 8 },
          })
          .setOrigin(0.5)

        this.time.delayedCall(2000, () => {
          successText.destroy()
        })
      } else {
        // Show error message
        const errorText = this.add
          .text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "Failed to load beatmap. Please try another file.",
            {
              fontSize: "18px",
              color: "#ef4444",
              backgroundColor: "#000000",
              padding: { x: 15, y: 8 },
            },
          )
          .setOrigin(0.5)

        this.time.delayedCall(3000, () => {
          errorText.destroy()
        })
      }
    } catch (error) {
      console.error("Error loading beatmap:", error)
    }
  }

  private loadSampleBeatmap() {
    const sampleBeatmap = BeatmapParser.generateSampleBeatmap()
    GameGlobals.setCurrentBeatmap(sampleBeatmap)
    this.updateUI()

    // Show confirmation
    const confirmText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Sample beatmap loaded!", {
        fontSize: "20px",
        color: "#10b981",
        backgroundColor: "#000000",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)

    this.time.delayedCall(1500, () => {
      confirmText.destroy()
    })
  }

  private showAudioSettings() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Create a simple audio settings overlay
    const overlay = this.add.rectangle(width / 2, height / 2, 400, 300, 0x000000, 0.8)

    const title = this.add
      .text(width / 2, height / 2 - 100, "Audio Settings", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Master volume slider (simplified)
    const masterText = this.add
      .text(width / 2, height / 2 - 50, "Master Volume: 70%", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // Music volume slider (simplified)
    const musicText = this.add
      .text(width / 2, height / 2 - 10, "Music Volume: 50%", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // SFX volume slider (simplified)
    const sfxText = this.add
      .text(width / 2, height / 2 + 30, "SFX Volume: 80%", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // Close button
    const closeButton = this.add
      .text(width / 2, height / 2 + 80, "CLOSE", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#ef4444",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        overlay.destroy()
        title.destroy()
        masterText.destroy()
        musicText.destroy()
        sfxText.destroy()
        closeButton.destroy()
      })
  }
}
