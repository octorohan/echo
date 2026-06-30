// Minimal type declarations for YouTube IFrame API
interface Window {
  YT: typeof YT
  onYouTubeIframeAPIReady: () => void
}

declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getCurrentTime(): number
    destroy(): void
  }

  interface PlayerOptions {
    videoId: string
    playerVars?: Record<string, unknown>
    events?: {
      onReady?: () => void
      onStateChange?: (event: OnStateChangeEvent) => void
    }
  }

  interface OnStateChangeEvent {
    data: number
  }

  const PlayerState: {
    PLAYING: number
    PAUSED: number
    ENDED: number
  }
}