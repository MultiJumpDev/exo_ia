import Phaser from "phaser"
import { AudioManager } from "@/lib/utils/AudioManager"

interface VictoryData {
  score: number
  accuracy: number
  combo: number
  totalCircles: number
  hitCircles: number
}

export default class VictoryScene extends Phaser.Scene {
  private victoryData!: VictoryData
  private audioManager!: AudioManager

  constructor() {
    super({ key: "VictoryScene" })
  }

  init(data: VictoryData) {
    this.victoryData = data
  }

  create() {
    const { width, height } = this.cameras.main

    this.audioManager = AudioManager.getInstance()
    this.audioManager.stopBackgroundMusic()

    // Background overlay with victory colors
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.9)

    // Victory particle effects - golden celebration
    const particles = this.add.particles(0, 0, "circle", {
      x: { min: 0, max: width },
      y: { min: -50, max: 0 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 4000,
      frequency: 100,
      speedY: { min: 30, max: 100 },
      tint: [0xffd700, 0xffa500, 0xff6347, 0x32cd32],
    })

    // Victory Title with animation
    const victoryTitle = this.add
      .text(width / 2, height / 4, "🎉 VICTOIRE! 🎉", {
        fontSize: "56px",
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0)

    // Animate title entrance
    this.tweens.add({
      targets: victoryTitle,
      scale: 1,
      duration: 800,
      ease: "Back.easeOut",
    })

    // Results container
    const resultsY = height / 2 - 80
    const lineHeight = 45

    // Score with golden color
    this.add
      .text(width / 2, resultsY, `Score Final: ${this.victoryData.score.toLocaleString()}`, {
        fontSize: "32px",
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // Accuracy
    this.add
      .text(width / 2, resultsY + lineHeight, `Précision: ${this.victoryData.accuracy.toFixed(1)}%`, {
        fontSize: "26px",
        color: "#10b981",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    // Max Combo
    this.add
      .text(width / 2, resultsY + lineHeight * 2, `Combo Maximum: ${this.victoryData.combo}x`, {
        fontSize: "26px",
        color: "#f59e0b",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    // Perfect completion message
    const missedCircles = this.victoryData.totalCircles - this.victoryData.hitCircles
    this.add
      .text(
        width / 2,
        resultsY + lineHeight * 3,
        `Cercles Réussis: ${this.victoryData.hitCircles}/${this.victoryData.totalCircles}`,
        {
          fontSize: "22px",
          color: "#e2e8f0",
          stroke: "#000000",
          strokeThickness: 1,
        },
      )
      .setOrigin(0.5)

    // Special victory rank
    const rank = this.calculateVictoryRank(this.victoryData.accuracy)
    const rankColor = this.getRankColor(rank)
    this.add
      .text(width / 2, resultsY + lineHeight * 4.5, `Rang: ${rank}`, {
        fontSize: "36px",
        color: rankColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // Victory message based on performance
    const victoryMessage = this.getVictoryMessage(this.victoryData.accuracy)
    this.add
      .text(width / 2, resultsY + lineHeight * 5.5, victoryMessage, {
        fontSize: "20px",
        color: "#a78bfa",
        fontStyle: "italic",
        align: "center",
      })
      .setOrigin(0.5)

    // Buttons
    const buttonY = height - 120

    // Play Again button
    const playAgainButton = this.add
      .text(width / 2 - 120, buttonY, "REJOUER", {
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
      .text(width / 2 + 120, buttonY, "MENU", {
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

    // Save high score
    this.saveHighScore()

    // Create spectacular celebration effect
    this.createVictoryCelebration()

    // Keyboard shortcuts
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene")
    })

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MenuScene")
    })

    // Instructions
    this.add
      .text(width / 2, height - 30, "ESPACE: Rejouer | ÉCHAP: Menu", {
        fontSize: "16px",
        color: "#94a3b8",
        align: "center",
      })
      .setOrigin(0.5)
  }

  private calculateVictoryRank(accuracy: number): string {
    if (accuracy >= 98) return "SS"
    if (accuracy >= 95) return "S"
    if (accuracy >= 90) return "A"
    if (accuracy >= 85) return "B"
    return "C"
  }

  private getRankColor(rank: string): string {
    switch (rank) {
      case "SS":
        return "#ffffff" // Platinum
      case "S":
        return "#ffd700" // Gold
      case "A":
        return "#10b981" // Green
      case "B":
        return "#3b82f6" // Blue
      default:
        return "#f59e0b" // Yellow
    }
  }

  private getVictoryMessage(accuracy: number): string {
    if (accuracy >= 98) return "Performance Parfaite!\nVous êtes un maître du rythme!"
    if (accuracy >= 95) return "Excellent travail!\nVotre précision est remarquable!"
    if (accuracy >= 90) return "Très bien joué!\nVous maîtrisez le jeu!"
    if (accuracy >= 85) return "Bonne performance!\nContinuez comme ça!"
    return "Victoire méritée!\nVous vous améliorez!"
  }

  private saveHighScore() {
    try {
      const currentHighScore = localStorage.getItem("osu-high-score")
      const highScore = currentHighScore ? Number.parseInt(currentHighScore) : 0

      if (this.victoryData.score > highScore) {
        localStorage.setItem("osu-high-score", this.victoryData.score.toString())
        localStorage.setItem("osu-high-accuracy", this.victoryData.accuracy.toString())

        // Show new high score message
        const { width, height } = this.cameras.main
        const newHighScoreText = this.add
          .text(width / 2, height / 2 + 140, "🏆 NOUVEAU RECORD! 🏆", {
            fontSize: "24px",
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
          scale: 1.3,
          duration: 600,
          ease: "Back.easeOut",
          yoyo: true,
          repeat: 3,
        })
      }
    } catch (error) {
      console.warn("Could not save high score:", error)
    }
  }

  private createVictoryCelebration() {
    const { width, height } = this.cameras.main

    // Create multiple spectacular particle bursts
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 150, () => {
        const x = Phaser.Math.Between(width * 0.1, width * 0.9)
        const y = Phaser.Math.Between(height * 0.2, height * 0.8)

        const burst = this.add.particles(x, y, "circle", {
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 1200,
          speed: { min: 150, max: 300 },
          quantity: 20,
          emitting: false,
          tint: [0xffd700, 0xffa500, 0xff6347, 0x32cd32, 0x1e90ff, 0xff69b4],
        })

        burst.explode()

        // Clean up after animation
        this.time.delayedCall(1500, () => {
          burst.destroy()
        })
      })
    }

    // Golden screen flash effect
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffd700, 0.2)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        flash.destroy()
      },
    })

    // Floating victory symbols
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 300, () => {
        const symbol = this.add
          .text(Phaser.Math.Between(50, width - 50), height + 50, "⭐", {
            fontSize: "40px",
          })
          .setAlpha(0.8)

        this.tweens.add({
          targets: symbol,
          y: -50,
          alpha: 0,
          duration: 3000,
          ease: "Power1",
          onComplete: () => {
            symbol.destroy()
          },
        })
      })
    }
  }
}
