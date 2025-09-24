"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import MenuScene from "@/lib/scenes/MenuScene"
import GameScene from "@/lib/scenes/GameScene"
import GameOverScene from "@/lib/scenes/GameOverScene"
import VictoryScene from "@/lib/scenes/VictoryScene"

export default function Home() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: "game-container",
        backgroundColor: "#1a1a2e",
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [MenuScene, GameScene, GameOverScene, VictoryScene],
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
      }

      gameRef.current = new Phaser.Game(config)
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full h-screen">
      <div id="game-container" className="w-full h-full" />
    </div>
  )
}
