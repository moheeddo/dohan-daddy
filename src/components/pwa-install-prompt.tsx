'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 이미 설치된 경우 (standalone 모드)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // 사용자가 이미 배너를 닫았는지 확인 (24시간 내)
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) return
    }

    // iOS Safari 감지
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isiOS)

    // Android/Chrome: beforeinstallprompt 이벤트
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // iOS인 경우 Safari에서 수동 안내
    if (isiOS && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowBanner(true), 2000)
    }

    // Android에서 beforeinstallprompt가 안 뜰 경우 (이미 설치 가능한 상태)
    // 3초 후에도 이벤트가 없으면 안내 배너 표시
    const fallbackTimer = setTimeout(() => {
      if (!isiOS && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShowBanner(false)
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  // iOS Safari 안내
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up-banner">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900">홈 화면에 추가하기</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                하단의 <span className="inline-block text-blue-600 font-bold">공유 버튼</span> (□↑) 을 누른 뒤<br />
                <span className="font-semibold">&quot;홈 화면에 추가&quot;</span>를 눌러주세요
              </p>
            </div>
            <button onClick={handleDismiss} className="text-gray-300 text-xl leading-none p-1">×</button>
          </div>
        </div>
      </div>
    )
  }

  // Android / Chrome 설치 유도
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up-banner">
      <div className="mx-3 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🫁</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900">바로가기 만들기</p>
            <p className="text-sm text-gray-500">홈 화면에서 바로 열 수 있어요</p>
          </div>
          <button onClick={handleDismiss} className="text-gray-300 text-xl leading-none p-1 flex-shrink-0">×</button>
        </div>
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full mt-3 bg-blue-600 text-white font-bold text-base py-3 rounded-xl active:bg-blue-700 transition-colors"
          >
            홈 화면에 추가
          </button>
        ) : (
          <div className="mt-3 bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              브라우저 메뉴(⋮)에서 <span className="font-semibold">&quot;홈 화면에 추가&quot;</span>를 눌러주세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
