import React, { useEffect, useRef, useState } from 'react'

interface Props {
  activity: null | 'screenshare' | 'youtube'
  onActivityChange: (a: null | 'screenshare' | 'youtube') => void
  sendData: (payload: object) => boolean
  onDataMessage: (fn: (data: unknown) => void) => () => void
}

export default function ActivityPanel({ activity, onActivityChange, sendData, onDataMessage }: Props) {
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [isSharer, setIsSharer] = useState(false)
  const playerRef = useRef<YT.Player | null>(null)
  const isSharerRef = useRef(false)
  const playerReadyRef = useRef(false)
  const pendingSeekRef = useRef<number | null>(null)

  // listen for activity control messages from peer
  useEffect(() => {
    const unsub = onDataMessage((data: unknown) => {
      const d = data as Record<string, unknown>
      if (d.type === 'activity:start') {
        onActivityChange(d.activity as 'screenshare' | 'youtube')
      }
      if (d.type === 'activity:stop') {
        onActivityChange(null)
      }
      if (d.type === 'youtube:load' && typeof d.videoId === 'string') {
        setYoutubeId(d.videoId)
        setIsSharer(false)
        isSharerRef.current = false
      }
      if (d.type === 'youtube:play') {
        playerRef.current?.playVideo()
      }
      if (d.type === 'youtube:pause') {
        playerRef.current?.pauseVideo()
      }
      if (d.type === 'youtube:seek' && typeof d.time === 'number') {
        if (playerReadyRef.current) {
          playerRef.current?.seekTo(d.time, true)
        } else {
          pendingSeekRef.current = d.time
        }
      }
    })
    return unsub
  }, [onDataMessage, onActivityChange])

  // screen share
  useEffect(() => {
    if (activity !== 'screenshare') {
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
      return
    }

    async function startScreenShare() {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = stream
        setIsSharer(true)
        if (screenVideoRef.current) screenVideoRef.current.srcObject = stream
        sendData({ type: 'activity:start', activity: 'screenshare' })

        stream.getVideoTracks()[0].onended = () => {
          onActivityChange(null)
          sendData({ type: 'activity:stop' })
        }
      } catch {
        onActivityChange(null)
      }
    }

    startScreenShare()

    return () => {
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
    }
  }, [activity])

  // load YouTube IFrame API
  useEffect(() => {
    if (activity !== 'youtube') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }, [activity])

  // create YouTube player when videoId is set
  useEffect(() => {
    if (!youtubeId || activity !== 'youtube') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any

    function createPlayer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YTAny = (window as any).YT
      if (!YTAny?.Player) return

      playerRef.current = new YTAny.Player('yt-player', {
        videoId: youtubeId,
        playerVars: { autoplay: 1, controls: 1, rel: 0 },
        events: {
          onReady: () => {
            playerReadyRef.current = true
            if (pendingSeekRef.current !== null) {
              playerRef.current?.seekTo(pendingSeekRef.current, true)
              pendingSeekRef.current = null
            }
          },
          onStateChange: (event: { data: number }) => {
            if (!isSharerRef.current) return
            const playing = YTAny.PlayerState?.PLAYING
            const paused = YTAny.PlayerState?.PAUSED
            if (event.data === playing) {
              sendData({ type: 'youtube:play' })
              sendData({ type: 'youtube:seek', time: playerRef.current?.getCurrentTime() ?? 0 })
            }
            if (event.data === paused) {
              sendData({ type: 'youtube:pause' })
            }
          },
        },
      })
    }

    if (win.YT?.Player) {
      createPlayer()
    } else {
      win.onYouTubeIframeAPIReady = createPlayer
    }

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
      playerReadyRef.current = false
    }
  }, [youtubeId, activity])

  function extractYouTubeId(input: string): string | null {
    try {
      const url = new URL(input)
      if (url.hostname === 'youtu.be') return url.pathname.slice(1)
      return url.searchParams.get('v')
    } catch {
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim()
      return null
    }
  }

  function handleYoutubeSubmit() {
    const id = extractYouTubeId(youtubeUrl)
    if (!id) return
    setYoutubeId(id)
    setIsSharer(true)
    isSharerRef.current = true
    sendData({ type: 'activity:start', activity: 'youtube' })
    sendData({ type: 'youtube:load', videoId: id })
  }

  if (activity === 'screenshare') {
    return (
      <div className="activity">
        {isSharer ? (
          <>
            <video ref={screenVideoRef} className="activity__screen" autoPlay playsInline muted />
            <div className="activity__screen-label">You are sharing your screen</div>
          </>
        ) : (
          <div className="activity__waiting">
            <p>Peer is sharing their screen...</p>
          </div>
        )}
      </div>
    )
  }

  if (activity === 'youtube') {
    if (!youtubeId) {
      return (
        <div className="activity activity--youtube-input">
          <p className="activity__label">Paste a YouTube URL</p>
          <div className="activity__url-row">
            <input
              className="activity__url-input"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleYoutubeSubmit() }}
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
            />
            <button className="activity__url-btn" onClick={handleYoutubeSubmit}>
              Watch
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="activity activity--youtube">
        <div id="yt-player" className="activity__yt-player" />
      </div>
    )
  }

  return null
}