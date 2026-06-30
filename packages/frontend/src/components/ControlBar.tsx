import React, { useState } from 'react'

const Icons = {
  close: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/>
    </svg>
  ),
  micOn: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="1" width="6" height="9" rx="3"/>
      <path d="M3 9a6 6 0 0 0 12 0"/><line x1="9" y1="15" x2="9" y2="17"/><line x1="6" y1="17" x2="12" y2="17"/>
    </svg>
  ),
  micOff: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="1" width="6" height="9" rx="3"/>
      <path d="M3 9a6 6 0 0 0 12 0"/><line x1="9" y1="15" x2="9" y2="17"/><line x1="6" y1="17" x2="12" y2="17"/>
      <line x1="2" y1="2" x2="16" y2="16"/>
    </svg>
  ),
  cameraOn: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
      <path d="M12 7.5l5-2.5v8l-5-2.5"/>
    </svg>
  ),
  cameraOff: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
      <path d="M12 7.5l5-2.5v8l-5-2.5"/>
      <line x1="1" y1="1" x2="17" y2="17"/>
    </svg>
  ),
  reaction: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="7.5"/>
      <path d="M6 11s1 1.5 3 1.5 3-1.5 3-1.5"/>
      <circle cx="6.5" cy="7.5" r="0.75" fill="currentColor" stroke="none"/>
      <circle cx="11.5" cy="7.5" r="0.75" fill="currentColor" stroke="none"/>
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l3 3 3-3h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
    </svg>
  ),
  skip: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3,3 12,9 3,15" fill="currentColor" stroke="none" opacity="0.6"/>
      <line x1="14" y1="3" x2="14" y2="15"/>
    </svg>
  ),
  expand: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="1,6 1,1 6,1"/><polyline points="12,1 17,1 17,6"/>
      <polyline points="17,12 17,17 12,17"/><polyline points="6,17 1,17 1,12"/>
    </svg>
  ),
  screenshare: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="16" height="11" rx="1"/>
      <line x1="6" y1="17" x2="12" y2="17"/>
      <line x1="9" y1="13" x2="9" y2="17"/>
      <polyline points="6,8 9,5 12,8"/>
      <line x1="9" y1="5" x2="9" y2="11"/>
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="16" height="12" rx="2"/>
      <polygon points="7,6 13,9 7,12" fill="currentColor" stroke="none" opacity="0.7"/>
    </svg>
  ),
}

const REACTIONS = ['😂', '❤️', '😮', '👏', '😢', '🔥']

interface Props {
  status: 'matching' | 'connected' | 'disconnected'
  immersive: boolean
  muted: boolean
  cameraOff: boolean
  activity: null | 'screenshare' | 'youtube'
  onToggleImmersive: () => void
  onMute: () => void
  onToggleCamera: () => void
  onSkip: () => void
  onCancel: () => void
  onSendReaction: (emoji: string) => void
  onToggleChat: () => void
  onActivityChange: (a: null | 'screenshare' | 'youtube') => void
}

export default function ControlBar({
  status, immersive, muted, cameraOff, activity,
  onToggleImmersive, onMute, onToggleCamera,
  onSkip, onCancel, onSendReaction, onToggleChat, onActivityChange
}: Props) {
  const [showReactions, setShowReactions] = useState(false)

  if (immersive) {
    return (
      <button className="control-bar__immersive-exit" onClick={onToggleImmersive} aria-label="Exit immersive">
        {Icons.close}
      </button>
    )
  }

  return (
    <div className="control-bar">
      <button className="control-bar__btn" onClick={onCancel} aria-label="Leave" title="Leave">
        {Icons.close}
      </button>

      <button
        className={`control-bar__btn ${muted ? 'control-bar__btn--active' : ''}`}
        onClick={onMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? Icons.micOff : Icons.micOn}
      </button>

      <button
        className={`control-bar__btn ${cameraOff ? 'control-bar__btn--active' : ''}`}
        onClick={onToggleCamera}
        aria-label={cameraOff ? 'Camera off' : 'Camera on'}
        title={cameraOff ? 'Camera off' : 'Camera on'}
      >
        {cameraOff ? Icons.cameraOff : Icons.cameraOn}
      </button>

      <div className="control-bar__reactions-wrap">
        {showReactions && (
          <div className="control-bar__reactions">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                className="control-bar__reaction-btn"
                onClick={() => { onSendReaction(emoji); setShowReactions(false) }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button
          className={`control-bar__btn ${showReactions ? 'control-bar__btn--active' : ''}`}
          onClick={() => setShowReactions(r => !r)}
          aria-label="React"
          title="Send reaction"
        >
          {Icons.reaction}
        </button>
      </div>

      <button className="control-bar__btn" onClick={onToggleChat} aria-label="Chat" title="Chat">
        {Icons.chat}
      </button>

      {status === 'connected' && (
        <>
          <button
            className={`control-bar__btn ${activity === 'screenshare' ? 'control-bar__btn--active' : ''}`}
            onClick={() => onActivityChange(activity === 'screenshare' ? null : 'screenshare')}
            aria-label="Screen share"
            title="Share screen"
          >
            {Icons.screenshare}
          </button>
          <button
            className={`control-bar__btn ${activity === 'youtube' ? 'control-bar__btn--active' : ''}`}
            onClick={() => onActivityChange(activity === 'youtube' ? null : 'youtube')}
            aria-label="Watch together"
            title="Watch YouTube together"
          >
            {Icons.youtube}
          </button>
        </>
      )}

      {status === 'connected' && (
        <button className="control-bar__btn control-bar__btn--skip" onClick={onSkip} aria-label="Skip" title="Skip">
          {Icons.skip}
        </button>
      )}

      <button className="control-bar__btn" onClick={onToggleImmersive} aria-label="Immersive mode" title="Immersive mode">
        {Icons.expand}
      </button>
    </div>
  )
}