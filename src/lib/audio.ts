// Audio manager using Web Audio API
// Provides simple synthesized sound effects without external files

type SoundName = "complete" | "achievement" | "timer" | "click" | "delete" | "flag"

class AudioManager {
  private context: AudioContext | null = null
  private enabled: boolean = true

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  private getContext(): AudioContext | null {
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch {
        return null
      }
    }
    return this.context
  }

  play(sound: SoundName) {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume()
    }

    switch (sound) {
      case "complete":
        this.playComplete(ctx)
        break
      case "achievement":
        this.playAchievement(ctx)
        break
      case "timer":
        this.playTimer(ctx)
        break
      case "click":
        this.playClick(ctx)
        break
      case "delete":
        this.playDelete(ctx)
        break
      case "flag":
        this.playFlag(ctx)
        break
    }
  }

  private playComplete(ctx: AudioContext) {
    // Pleasant ascending chime: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.3)
    })
  }

  private playAchievement(ctx: AudioContext) {
    // Triumphant ascending arpeggio: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "triangle"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.5)
    })
  }

  private playTimer(ctx: AudioContext) {
    // Gentle bell tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.0)

    // Second softer ring
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = "sine"
    osc2.frequency.value = 880
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.3)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3)
    osc2.start(ctx.currentTime + 0.3)
    osc2.stop(ctx.currentTime + 1.3)
  }

  private playClick(ctx: AudioContext) {
    // Short click/tap
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 600
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  }

  private playDelete(ctx: AudioContext) {
    // Descending tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  private playFlag(ctx: AudioContext) {
    // Quick ping
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }
}

// Singleton instance
export const audioManager = new AudioManager()
