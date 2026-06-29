import React, { useState } from 'react'
import { MOODS } from '@echo/shared'
import type { MoodId } from '@echo/shared'

interface Props { onMoodSelected: (mood: MoodId) => void }

export default function MoodScreen({ onMoodSelected }: Props) {
  const [hovered, setHovered] = useState<MoodId | null>(null)
  const [selected, setSelected] = useState<MoodId | null>(null)

  function handleSelect(mood: MoodId) {
    setSelected(mood)
    setTimeout(() => onMoodSelected(mood), 180)
  }

  return (
    <div className="mood">
      <p className="mood__prompt">how are you feeling right now?</p>
      <div className="mood__grid">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            className={`mood__item ${selected === mood.id ? 'mood__item--selected' : ''}`}
            onClick={() => handleSelect(mood.id)}
            onMouseEnter={() => setHovered(mood.id)}
            onMouseLeave={() => setHovered(null)}
            aria-label={mood.label}
          >
            <span className="mood__emoji">{mood.emoji}</span>
            {hovered === mood.id && <span className="mood__label">{mood.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
