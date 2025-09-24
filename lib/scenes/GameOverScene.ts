import Phaser from "phaser"
import { AudioManager } from "@/lib/utils/AudioManager"

interface GameOverData {
  score: number
  accuracy: number
  combo: number
  totalCircles: number
  hitCircles: number
}

export default class GameOverScene extends Phaser.Scene {
  private gameOverData!: GameOverData
  private audioManager!: AudioManager

  constructor() {
    super({ key: "GameOverScene" })
  }

  init(data: GameOverData) {
    this.gameOverData = data
  }

  create() {
    const { width, height } = this.cameras.main

    this.audioManager = AudioManager.getInstance()
    this.audioManager.stopBackgroundMusic()

    // Background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)

    // Particle effects for celebration or disappointment
    const particles = this.add.particles(0, 0, "circle", {
      x: { min: 0, max: width },
      y: { min: -50, max: 0 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 3000,
      frequency: 200,
      speedY: { min: 50, max: 150 },
      tint: this.gameOverData.accuracy > 80 ? [0x10b981, 0x34d399, 0x6ee7b7] : [0xef4444, 0xf87171, 0xfca5a5],
    })

    // Game Over Title
    const titleText =
      this.gameOverData.accuracy > 80 ? "EXCELLENT!" : this.gameOverData.accuracy > 60 ? "GOOD JOB!" : "GAME OVER"
    const titleColor =
      this.gameOverData.accuracy > 80 ? "#10b981" : this.gameOverData.accuracy > 60 ? "#f59e0b" : "#ef4444"

    this.add
      .text(width / 2, height / 4, titleText, {
        fontSize: "48px",
        color: titleColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // Results container
    const resultsY = height / 2 - 50
    const lineHeight = 40

    // Score
    this.add
      .text(width / 2, resultsY, `Final Score: ${this.gameOverData.score.toLocaleString()}`, {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    // Accuracy
    const accuracyColor = this.getAccuracyColor(this.gameOverData.accuracy)
    this.add
      .text(width / 2, resultsY + lineHeight, `Accuracy: ${this.gameOverData.accuracy.toFixed(1)}%`, {
        fontSize: "24px",
        color: accuracyColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    // Max Combo
    this.add
      .text(width / 2, resultsY + lineHeight * 2, `Max Combo: ${this.gameOverData.combo}x`, {
        fontSize: "24px",
        color: "#f59e0b",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    // Hit Statistics
    const missedCircles = this.gameOverData.totalCircles - this.gameOverData.hitCircles
    this.add
      .text(width / 2, resultsY + lineHeight * 3, `Hits: ${this.gameOverData.hitCircles} | Misses: ${missedCircles}`, {
        fontSize: "20px",
        color: "#e2e8f0",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)

    // Rank display
    const rank = this.calculateRank(this.gameOverData.accuracy)
    const rankColor = this.getRankColor(rank)
    this.add
      .text(width / 2, resultsY + lineHeight * 4.5, `Rank: ${rank}`, {
        fontSize: "32px",
        color: rankColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // Buttons
    const buttonY = height - 150

    // Play Again button
    const playAgainButton = this.add
      .text(width / 2 - 120, buttonY, "PLAY AGAIN", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#10b981",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("GameScene")
      })
      .on("pointerover", () => {
        playAgainButton.setScale(1.05)
        playAgainButton.setTint(0xdddddd)
      })
      .on("pointerout", () => {
        playAgainButton.setScale(1)
        playAgainButton.clearTint()
      })

    // Menu button
    const menuButton = this.add
      .text(width / 2 + 120, buttonY, "MAIN MENU", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#6366f1",
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MenuScene")
      })
      .on("pointerover", () => {
        menuButton.setScale(1.05)
        menuButton.setTint(0xdddddd)
      })
      .on("pointerout", () => {
        menuButton.setScale(1)
        menuButton.clearTint()
      })

    // Save high score (simplified - in a real game you'd use localStorage or a backend)
    this.saveHighScore()

    // Add some celebration effects for good performances
    if (this.gameOverData.accuracy > 90) {
      this.createCelebrationEffect()
    }

    // Keyboard shortcuts
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene")
    })

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MenuScene")
    })

    // Instructions
    this.add
      .text(width / 2, height - 50, "SPACE: Play Again | ESC: Menu", {
        fontSize: "16px",
        color: "#94a3b8",
        align: "center",
      })
      .setOrigin(0.5)
  }

  private getAccuracyColor(accuracy: number): string {
    if (accuracy >= 95) return "#10b981" // Green
    if (accuracy >= 85) return "#f59e0b" // Yellow
    if (accuracy >= 70) return "#f97316" // Orange
    return "#ef4444" // Red
  }

  private calculateRank(accuracy: number): string {
    if (accuracy >= 95) return "S"
    if (accuracy >= 90) return "A"
    if (accuracy >= 80) return "B"
    if (accuracy >= 70) return "C"
    if (accuracy >= 60) return "D"
    return "F"
  }

  private getRankColor(rank: string): string {
    switch (rank) {
      case "S":
        return "#ffd700" // Gold
      case "A":
        return "#10b981" // Green
      case "B":
        return "#3b82f6" // Blue
      case "C":
        return "#f59e0b" // Yellow
      case "D":
        return "#f97316" // Orange
      default:
        return "#ef4444" // Red
    }
  }

  private saveHighScore() {
    try {
      const currentHighScore = localStorage.getItem("osu-high-score")
      const highScore = currentHighScore ? Number.parseInt(currentHighScore) : 0

      if (this.gameOverData.score > highScore) {
        localStorage.setItem("osu-high-score", this.gameOverData.score.toString())
        localStorage.setItem("osu-high-accuracy", this.gameOverData.accuracy.toString())

        // Show new high score message
        const { width, height } = this.cameras.main
        const newHighScoreText = this.add
          .text(width / 2, height / 2 + 120, "NEW HIGH SCORE!", {
            fontSize: "20px",
            color: "#ffd700",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setAlpha(0)

        // Animate the new high score text
        this.tweens.add({
          targets: newHighScoreText,
          alpha: 1,
          scale: 1.2,
          duration: 500,
          ease: "Back.easeOut",
          yoyo: true,
          repeat: 2,
        })
      }
    } catch (error) {
      console.warn("Could not save high score:", error)
    }
  }

  private createCelebrationEffect() {
    const { width, height } = this.cameras.main

    // Create multiple particle bursts
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 200, () => {
        const x = Phaser.Math.Between(width * 0.2, width * 0.8)
        const y = Phaser.Math.Between(height * 0.3, height * 0.7)

        const burst = this.add.particles(x, y, "circle", {
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 800,
          speed: { min: 100, max: 200 },
          quantity: 15,
          emitting: false,
          tint: [0xffd700, 0xffa500, 0xff6347, 0x32cd32, 0x1e90ff],
        })

        burst.explode()

        // Clean up after animation
        this.time.delayedCall(1000, () => {
          burst.destroy()
        })
      })
    }

    // Screen flash effect
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.3)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        flash.destroy()
      },
    })
  }
}
