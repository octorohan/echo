import React, { useState } from 'react'
import LandingScreen from './components/LandingScreen'
import MoodScreen from './components/MoodScreen'
import ChatScreen from './components/ChatScreen'
import type { MoodId } from '@echo/shared'

export type AppScreen = 'landing' | 'mood' | 'chat'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null)

  return (
    <>
      {screen === 'landing' && (
        <LandingScreen onStart={() => setScreen('mood')} />
      )}
      {screen === 'mood' && (
        <MoodScreen onMoodSelected={(mood) => { setSelectedMood(mood); setScreen('chat') }} />
      )}
      {screen === 'chat' && selectedMood && (
        <ChatScreen
          mood={selectedMood}
          onCancel={() => { setSelectedMood(null); setScreen('mood') }}
        />
      )}
    </>
  )
}
