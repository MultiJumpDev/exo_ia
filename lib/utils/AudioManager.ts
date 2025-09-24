export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private backgroundMusic: HTMLAudioElement | null = null
  private hitSounds: HTMLAudioElement[] = []
  private missSounds: HTMLAudioElement[] = []
  private volume = 0.7
  private musicVolume = 0.5
  private sfxVolume = 0.8

  private constructor() {
    this.initializeAudio()
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.createDefaultSounds()
    } catch (error) {
      console.warn("Audio context not supported:", error)
    }
  }

  private createDefaultSounds() {
    // Create hit sound
    const hitSound = new Audio()
    hitSound.src = this.generateHitSoundDataURL()
    hitSound.volume = this.sfxVolume
    this.hitSounds.push(hitSound)

    // Create miss sound
    const missSound = new Audio()
    missSound.src = this.generateMissSoundDataURL()
    missSound.volume = this.sfxVolume
    this.missSounds.push(missSound)
  }

  private generateHitSoundDataURL(): string {
    // Generate a simple hit sound using Web Audio API
    if (!this.audioContext) return ""

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.1 // 100ms
    const samples = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, samples, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a pleasant "ding" sound
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate
      const frequency = 800 // 800Hz tone
      const envelope = Math.exp(-t * 10) // Exponential decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
    }

    return this.bufferToDataURL(buffer)
  }

  private generateMissSoundDataURL(): string {
    // Generate a "miss" sound
    if (!this.audioContext) return ""

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.2 // 200ms
    const samples = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, samples, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a lower, more dissonant sound
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate
      const frequency = 200 // 200Hz tone
      const envelope = Math.exp(-t * 5) // Slower decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2
    }

    return this.bufferToDataURL(buffer)
  }

  private bufferToDataURL(buffer: AudioBuffer): string {
    // Convert AudioBuffer to WAV data URL
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    const data = buffer.getChannelData(0)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * 2, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    const blob = new Blob([arrayBuffer], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  }

  playHitSound() {
    if (this.hitSounds.length > 0) {
      const sound = this.hitSounds[0].cloneNode() as HTMLAudioElement
      sound.volume = this.sfxVolume
      sound.play().catch((e) => console.warn("Could not play hit sound:", e))
    }
  }

  playMissSound() {
    if (this.missSounds.length > 0) {
      const sound = this.missSounds[0].cloneNode() as HTMLAudioElement
      sound.volume = this.sfxVolume
      sound.play().catch((e) => console.warn("Could not play miss sound:", e))
    }
  }

  playBackgroundMusic(audioFile?: string | ArrayBuffer) {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
    }

    if (audioFile) {
      this.backgroundMusic = new Audio()
      if (typeof audioFile === "string") {
        this.backgroundMusic.src = audioFile
      } else {
        const blob = new Blob([audioFile], { type: "audio/mpeg" })
        this.backgroundMusic.src = URL.createObjectURL(blob)
      }
      this.backgroundMusic.volume = this.musicVolume
      this.backgroundMusic.loop = false
      this.backgroundMusic.play().catch((e) => console.warn("Could not play background music:", e))
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
    }
  }

  setMasterVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume * this.volume
    }
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  private updateVolumes() {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume * this.volume
    }
  }

  getCurrentMusicTime(): number {
    return this.backgroundMusic ? this.backgroundMusic.currentTime * 1000 : 0
  }

  isMusicPlaying(): boolean {
    return this.backgroundMusic ? !this.backgroundMusic.paused : false
  }

  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume()
    }
  }
}
