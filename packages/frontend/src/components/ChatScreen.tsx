import React, { useRef, useState, useEffect} from 'react'
import type { MoodId } from '@echo/shared'
import { MOODS } from '@echo/shared'
import { useSignaling } from '../hooks/useSignaling'
import { useWebRTC } from '../hooks/useWebRTC'
import ChatBubbles from './ChatBubbles'
import ControlBar from './ControlBar'
import ReactionOverlay from './ReactionOverlay'
import ActivityPanel from './ActivityPanel'

interface Props { mood: MoodId; onCancel: () => void }

export default function ChatScreen({ mood, onCancel }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [immersive, setImmersive] = useState(false)
  const [peerMood, setPeerMood] = useState<MoodId | null>(null)
  const [status, setStatus] = useState<'matching' | 'connected' | 'disconnected'>('matching')
const [chatOpen, setChatOpen] = useState(false)
  const [swapped, setSwapped] = useState(false)
  const [activity, setActivity] = useState<null | 'screenshare' | 'youtube'>(null)

  function handleSwap() {
    if (status !== 'connected') return  // only swap when actually connected
    const local = localVideoRef.current
    const remote = remoteVideoRef.current
    if (!local || !remote || !remote.srcObject) return
    const tmp = local.srcObject
    local.srcObject = remote.srcObject
    remote.srcObject = tmp
    setSwapped(s => !s)
  }

  // when a new match happens, reset swap state
  // so remote always starts on the main screen
  useEffect(() => {
    if (status === 'matching' && swapped) {
      setSwapped(false)
    }
  }, [status])

  const signaling = useSignaling({ mood, onPeerMood: setPeerMood, onStatusChange: setStatus })
  const webrtc = useWebRTC({ signaling, localVideoRef, remoteVideoRef, onStatusChange: setStatus })

  const peerMoodDef = peerMood ? MOODS.find(m => m.id === peerMood) : null

  return (
    <div className={`chat ${immersive ? 'chat--immersive' : ''}`}>
{/* main video — refs stay fixed, srcObject gets swapped */}
      <video
        ref={remoteVideoRef}
        className="chat__remote"
        autoPlay
        playsInline
        muted={swapped}
      />

      {!immersive && (
        <div
          className={`chat__local-wrap ${webrtc.cameraOff && !swapped ? 'chat__local-wrap--off' : ''}`}
          onClick={handleSwap}
          title="Click to swap"
        >
          <video
            ref={localVideoRef}
            className="chat__local"
            autoPlay
            playsInline
            muted={!swapped}
          />
          {webrtc.cameraOff && !swapped && (
            <div className="chat__local-off-label">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
                <path d="M12 7.5l5-2.5v8l-5-2.5"/>
                <line x1="1" y1="1" x2="17" y2="17"/>
              </svg>
            </div>
          )}
          {/* swap hint icon */}
          <div className="chat__local-swap-hint">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 9h16M13 5l4 4-4 4M5 5L1 9l4 4"/>
            </svg>
          </div>
        </div>
      )}
      
      {!immersive && peerMoodDef && status === 'connected' && (
        <div className="chat__peer-mood" title={peerMoodDef.label}>
          {peerMoodDef.emoji}
        </div>
      )}

      {status === 'matching' && (
        <div className="chat__matching-overlay">
          <p>finding someone...</p>
        </div>
      )}

      <ChatBubbles
        sendData={webrtc.sendData}
        onDataMessage={webrtc.onDataMessage}
        isOpen={chatOpen}
      />

      <ReactionOverlay onDataMessage={webrtc.onDataMessage} />

      {status === 'connected' && (
        <ActivityPanel
          activity={activity}
          onActivityChange={setActivity}
          sendData={webrtc.sendData}
          onDataMessage={webrtc.onDataMessage}
        />
      )}

      <ControlBar
        status={status}
        immersive={immersive}
        muted={webrtc.muted}
        cameraOff={webrtc.cameraOff}
        onToggleImmersive={() => setImmersive(i => !i)}
        onMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onSkip={webrtc.skip}
        onCancel={onCancel}
        onSendReaction={webrtc.sendReaction}
        onToggleChat={() => setChatOpen(o => !o)}
        activity={activity}
        onActivityChange={setActivity}
      />
    </div>
  )
}