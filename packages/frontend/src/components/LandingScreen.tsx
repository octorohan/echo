import React from 'react'

interface Props { onStart: () => void }

export default function LandingScreen({ onStart }: Props) {
  return (
    <div className="landing">
      <h1 className="landing__title">echo</h1>
      <p className="landing__subtitle">meet someone. say something. disappear.</p>
      <button className="landing__start" onClick={onStart}>Start</button>
    </div>
  )
}
