"use client"

import dynamic from "next/dynamic"

const GameComponent = dynamic(() => import("@/components/GameComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Loading OSU! Game...</div>
    </div>
  ),
})

export default function Home() {
  return <GameComponent />
}
