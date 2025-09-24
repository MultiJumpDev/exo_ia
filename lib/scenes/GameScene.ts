import Phaser from "phaser"
import type { HitCircle, GameState } from "@/lib/types/GameTypes"
import { GameUtils } from "@/lib/utils/GameUtils"
import { AudioManager } from "@/lib/utils/AudioManager"
import { GameGlobals } from "@/lib/utils/GameGlobals"

export default class GameScene extends Phaser.Scene {
  private gameState!: GameState
  private hitCircles: HitCircle[] = []
  private activeCircles: Phaser.GameObjects.Group
  private approachCircles: Phaser.GameObjects.Group
  private scoreText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private healthBarBg!: Phaser.GameObjects.Rectangle
  private healthBarFill!: Phaser.GameObjects.Rectangle
  private healthText!: Phaser.GameObjects.Text
  private gameStartTime!: number
  private beatmapData: HitCircle[] = []
  private audioManager!: AudioManager
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: "GameScene" })
  }

  create() {
    const { width, height } = this.cameras.main

    this.audioManager = AudioManager.getInstance()
    this.audioManager.resumeAudioContext()

    // Initialize game state
    this.gameState = {
      score: 0,
      combo: 0,
      lives: 100, // Now represents health percentage (0-100)
      maxLives: 100,
      isPlaying: true,
      currentTime: 0,
    }

    // Create groups for game objects
    this.activeCircles = this.add.group()
    this.approachCircles = this.add.group()

    // Create particle system for hit effects
    this.particles = this.add.particles(0, 0, "circle", {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      speed: { min: 50, max: 150 },
      quantity: 8,
      emitting: false,
      tint: [0xf59e0b, 0xfbbf24, 0xfde047],
    })

    // Create UI
    this.createUI()

    // Generate default beatmap
    this.generateDefaultBeatmap()

    // Set up input
    this.input.on("pointerdown", this.handleClick, this)

    // Start the game
    this.gameStartTime = this.time.now
    this.startGameLoop()

    // Add pause functionality
    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.pause()
      this.scene.launch("PauseScene")
    })
  }

  preload() {
    // No need to load sounds here as AudioManager handles it
  }

  private createUI() {
    const { width, height } = this.cameras.main

    // Score display
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    })

    // Combo display
    this.comboText = this.add
      .text(width / 2, 50, "", {
        fontSize: "32px",
        color: "#f59e0b",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // Health bar background
    this.healthBarBg = this.add.rectangle(width - 20 - 100, 20 + 10, 200, 20, 0x333333).setStrokeStyle(2, 0xffffff)

    // Health bar fill
    this.healthBarFill = this.add.rectangle(width - 20 - 100, 20 + 10, 200, 20, 0x22c55e)

    // Health text
    this.healthText = this.add
      .text(width - 20 - 100, 20 + 10, "100%", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Back button
    const backButton = this.add
      .text(20, height - 50, "BACK TO MENU", {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#6366f1",
        padding: { x: 15, y: 8 },
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.start("MenuScene")
      })
  }

  private generateDefaultBeatmap() {
    const customBeatmap = GameGlobals.getCurrentBeatmap()
    if (customBeatmap) {
      this.beatmapData = [...customBeatmap.hitObjects]

      // Start background music if available
      if (customBeatmap.audioFile) {
        this.audioManager.playBackgroundMusic(customBeatmap.audioFile)
      }
      return
    }

    const { width, height } = this.cameras.main
    const startTime = 2000 // Start after 2 seconds
    const interval = 1000 // 1 second between circles
    const numCircles = 20

    for (let i = 0; i < numCircles; i++) {
      const circle: HitCircle = {
        x: Phaser.Math.Between(100, width - 100),
        y: Phaser.Math.Between(100, height - 100),
        time: startTime + i * interval,
        id: GameUtils.generateId(),
        radius: 60,
        clicked: false,
        missed: false,
      }
      this.beatmapData.push(circle)
    }
  }

  private startGameLoop() {
    // Main game update loop
    this.time.addEvent({
      delay: 16, // ~60 FPS
      callback: this.updateGame,
      callbackScope: this,
      loop: true,
    })
  }

  private updateGame() {
    if (!this.gameState.isPlaying) return

    this.gameState.currentTime = this.time.now - this.gameStartTime

    // Spawn new circles
    this.spawnCircles()

    // Update existing circles
    this.updateCircles()

    // Check for missed circles
    this.checkMissedCircles()

    // Update UI
    this.updateUI()

    // Check game over condition (health depleted)
    if (this.gameState.lives <= 0) {
      this.gameOver(false) // false = defeat
    }

    const allCirclesCompleted = this.beatmapData.every((circle) => circle.clicked || circle.missed)
    const hasRemainingHealth = this.gameState.lives > 0

    if (allCirclesCompleted && hasRemainingHealth) {
      this.gameOver(true) // true = victory
    }
  }

  private spawnCircles() {
    const spawnWindow = 2000 // Spawn circles 2 seconds before they should be hit

    this.beatmapData.forEach((circleData) => {
      if (!circleData.clicked && !circleData.missed) {
        const timeUntilHit = circleData.time - this.gameState.currentTime

        if (timeUntilHit <= spawnWindow && timeUntilHit > 0) {
          // Check if circle is already spawned
          const existingCircle = this.activeCircles.children.entries.find(
            (child: any) => child.circleId === circleData.id,
          )

          if (!existingCircle) {
            this.createHitCircle(circleData)
          }
        }
      }
    })
  }

  private createHitCircle(circleData: HitCircle) {
    // Create the main hit circle
    const hitCircle = this.add
      .image(circleData.x, circleData.y, "hitcircle")
      .setScale(0.8)
      .setInteractive({ useHandCursor: true })

    // Store circle data
    ;(hitCircle as any).circleData = circleData
    ;(hitCircle as any).circleId = circleData.id

    // Create approach circle (shrinking circle that indicates timing)
    const approachCircle = this.add
      .circle(circleData.x, circleData.y, circleData.radius * 2, 0x6366f1, 0)
      .setStrokeStyle(4, 0xffffff)

    // Add to groups
    this.activeCircles.add(hitCircle)
    this.approachCircles.add(approachCircle)

    // Animate approach circle
    const timeUntilHit = circleData.time - this.gameState.currentTime
    this.tweens.add({
      targets: approachCircle,
      radius: circleData.radius * 0.8,
      duration: timeUntilHit,
      ease: "Linear",
    })

    // Store reference for cleanup
    ;(hitCircle as any).approachCircle = approachCircle
  }

  private updateCircles() {
    this.activeCircles.children.entries.forEach((circle: any) => {
      const circleData = circle.circleData
      const timeUntilHit = circleData.time - this.gameState.currentTime

      // Remove circles that are too late
      if (timeUntilHit < -500) {
        // 500ms grace period
        if (!circleData.clicked && !circleData.missed) {
          this.missCircle(circleData)
        }
        this.removeCircle(circle)
      }
    })
  }

  private checkMissedCircles() {
    const missWindow = 200 // 200ms window for hitting

    this.beatmapData.forEach((circleData) => {
      if (!circleData.clicked && !circleData.missed) {
        const timeDiff = this.gameState.currentTime - circleData.time

        if (timeDiff > missWindow) {
          this.missCircle(circleData)
        }
      }
    })
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    let hitAnyCircle = false

    this.activeCircles.children.entries.forEach((circle: any) => {
      if (hitAnyCircle) return

      const circleData = circle.circleData
      if (circleData.clicked || circleData.missed) return

      // Check if click is within circle bounds
      if (
        GameUtils.isCircleClicked(
          { x: circle.x, y: circle.y, radius: circleData.radius },
          { x: pointer.x, y: pointer.y },
        )
      ) {
        const timeDiff = Math.abs(this.gameState.currentTime - circleData.time)
        const hitWindow = 150 // 150ms hit window

        if (timeDiff <= hitWindow) {
          this.hitCircle(circleData, circle, timeDiff)
          hitAnyCircle = true
        }
      }
    })
  }

  private hitCircle(circleData: HitCircle, circle: any, timeDiff: number) {
    circleData.clicked = true

    // Calculate score based on timing and combo
    const baseScore = timeDiff < 50 ? 300 : timeDiff < 100 ? 200 : 100
    const scoreGain = GameUtils.calculateScore(this.gameState.combo, baseScore)

    this.gameState.score += scoreGain
    this.gameState.combo++

    this.gameState.lives = Math.min(this.gameState.maxLives, this.gameState.lives + 2)

    this.audioManager.playHitSound()

    // Create hit effect
    this.particles.setPosition(circle.x, circle.y)
    this.particles.explode()

    // Animate circle disappearing
    this.tweens.add({
      targets: circle,
      scale: 1.2,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        this.removeCircle(circle)
      },
    })
  }

  private missCircle(circleData: HitCircle) {
    circleData.missed = true
    this.gameState.combo = 0
    this.gameState.lives = Math.max(0, this.gameState.lives - 10)

    this.audioManager.playMissSound()

    // Screen shake effect
    this.cameras.main.shake(200, 0.01)
  }

  private removeCircle(circle: any) {
    if (circle.approachCircle) {
      circle.approachCircle.destroy()
    }
    circle.destroy()
  }

  private updateUI() {
    this.scoreText.setText(`Score: ${this.gameState.score.toLocaleString()}`)

    const healthPercentage = this.gameState.lives / this.gameState.maxLives
    const healthBarWidth = 200

    // Update health bar fill width and color
    this.healthBarFill.width = healthBarWidth * healthPercentage

    // Change color based on health level
    if (healthPercentage > 0.6) {
      this.healthBarFill.fillColor = 0x22c55e // Green
    } else if (healthPercentage > 0.3) {
      this.healthBarFill.fillColor = 0xf59e0b // Yellow
    } else {
      this.healthBarFill.fillColor = 0xef4444 // Red
    }

    // Update health text
    this.healthText.setText(`${Math.round(this.gameState.lives)}%`)

    if (this.gameState.combo > 1) {
      this.comboText.setText(`${this.gameState.combo}x COMBO!`)
      this.comboText.setVisible(true)
    } else {
      this.comboText.setVisible(false)
    }
  }

  private gameOver(isVictory = false) {
    this.gameState.isPlaying = false

    // Calculate final stats
    const totalCircles = this.beatmapData.length
    const hitCircles = this.beatmapData.filter((c) => c.clicked).length
    const accuracy = totalCircles > 0 ? (hitCircles / totalCircles) * 100 : 0

    const gameData = {
      score: this.gameState.score,
      accuracy: accuracy,
      combo: this.gameState.combo,
      totalCircles: totalCircles,
      hitCircles: hitCircles,
    }

    if (isVictory) {
      this.scene.start("VictoryScene", gameData)
    } else {
      this.scene.start("GameOverScene", gameData)
    }
  }
}
