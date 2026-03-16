'use client'

import { useAuth } from '@/lib/auth-context'
import { PinLogin } from '@/components/pin-login'
import { PatientHome } from '@/components/patient-home'
import { CaregiverHome } from '@/components/caregiver-home'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🫁</div>
          <p className="text-xl text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <PinLogin />
        <PwaInstallPrompt />
      </>
    )
  }

  if (user.role === 'patient') {
    return (
      <>
        <PatientHome />
        <PwaInstallPrompt />
      </>
    )
  }

  return (
    <>
      <CaregiverHome />
      <PwaInstallPrompt />
    </>
  )
}
