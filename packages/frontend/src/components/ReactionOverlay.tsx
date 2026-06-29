import React, { useState, useEffect } from 'react'

interface FloatingReaction {
  id: string
  emoji: string
  startX: number   // horizontal position as % of screen width
  createdAt: number
}

const ANIMATION_DURATION = 3000 // ms — how long the reaction floats up

interface Props {
  onDataMessage: (fn: (data: unknown) => void) => () => void
}

export default function ReactionOverlay({ onDataMessage }: Props) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([])

  useEffect(() => {
    const unsub = onDataMessage((data: unknown) => {
      const d = data as Record<string, unknown>
      if (d.type === 'reaction' && typeof d.emoji === 'string') {
        setReactions(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          emoji: d.emoji as string,
          // randomise horizontal position slightly so multiple reactions don't stack
          startX: 45 + Math.random() * 10,
          createdAt: Date.now(),
        }])
      }
    })
    return unsub
  }, [onDataMessage])

  // clean up finished animations
  useEffect(() => {
    const interval = setInterval(() => {
      setReactions(r => r.filter(rx => Date.now() - rx.createdAt < ANIMATION_DURATION + 200))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="reactions-overlay">
      {reactions.map(rx => (
        <span
          key={rx.id}
          className="reactions-overlay__item"
          style={{ left: `${rx.startX}%` }}
        >
          {rx.emoji}
        </span>
      ))}
    </div>
  )
}