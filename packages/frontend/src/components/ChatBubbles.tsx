import React, { useState, useEffect } from 'react'

interface Bubble {
  id: string
  text: string
  isMine: boolean
  expiresAt: number
}

interface Props {
  sendData: (payload: object) => boolean
  onDataMessage: (fn: (data: unknown) => void) => () => void
  isOpen: boolean
}

export default function ChatBubbles({ sendData, onDataMessage, isOpen }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(b => b.filter(bubble => bubble.expiresAt > Date.now()))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unsub = onDataMessage((data: unknown) => {
      const d = data as Record<string, unknown>
      if (d.type === 'chat' && typeof d.text === 'string') {
        addBubble(d.text, false)
      }
    })
    return unsub
  }, [onDataMessage])

  function addBubble(text: string, isMine: boolean) {
    const wordCount = text.trim().split(/\s+/).length
    const readingMs = Math.max(5000, (wordCount / 3) * 1000)
    const duration = isMine ? readingMs * 1.5 : readingMs
    setBubbles(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text, isMine,
      expiresAt: Date.now() + duration,
    }])
  }

  function sendMessage() {
    if (!draft.trim()) return
    const sent = sendData({ type: 'chat', text: draft.trim() })
    if (sent) {
      addBubble(draft.trim(), true)
      setDraft('')
    }
  }

  return (
    <div className="bubbles">
      <div className="bubbles__stack">
        {bubbles.map(bubble => (
          <div
            key={bubble.id}
            className={`bubbles__bubble ${bubble.isMine ? 'bubbles__bubble--mine' : 'bubbles__bubble--theirs'}`}
          >
            {bubble.text}
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="bubbles__input-wrap">
          <input
            className="bubbles__input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
            autoFocus
            placeholder="say something..."
          />
        </div>
      )}
    </div>
  )
}