'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { PinLogin } from '@/components/pin-login'
import { PatientHome } from '@/components/patient-home'
import { CaregiverHome } from '@/components/caregiver-home'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { OfflineIndicator } from '@/components/offline-indicator'
import { WelcomeOnboarding } from '@/components/welcome-onboarding'

export default function Home() {
  const { user, isLoading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem('daddy_onboarding_done')
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      if (!done && !isStandalone) {
        setShowOnboarding(true)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-700">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">🫁</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">아버지 건강 관리</h1>
          <p className="text-blue-200 text-base mt-2">건강한 하루를 시작해요</p>
          <div className="mt-6 flex justify-center gap-1.5">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <OfflineIndicator />
      {showOnboarding && (
        <WelcomeOnboarding onComplete={() => setShowOnboarding(false)} />
      )}
      {!user ? (
        <PinLogin />
      ) : user.role === 'patient' ? (
        <PatientHome />
      ) : (
        <CaregiverHome />
      )}
      <PwaInstallPrompt />
    </>
  )
}
