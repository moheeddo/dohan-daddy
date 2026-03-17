'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showFullGuide, setShowFullGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isSamsungBrowser, setIsSamsungBrowser] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isSamsung = /SamsungBrowser/i.test(ua)
    setIsIOS(isiOS)
    setIsSamsungBrowser(isSamsung)

    // 삼성 인터넷은 3시간마다, 나머지는 24시간마다 다시 표시
    const dismissCooldown = isSamsung ? 3 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      if (Date.now() - dismissedTime < dismissCooldown) return
    }

    // 방문 횟수 추적 (삼성 브라우저 첫 3회 방문 시 풀 가이드 바로 표시)
    const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10) + 1
    localStorage.setItem('pwa_visit_count', String(visitCount))

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (isiOS && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowBanner(true), 2000)
    }

    const fallbackTimer = setTimeout(() => {
      if (!isiOS && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true)
        // 삼성 브라우저 첫 3회 방문: 풀 가이드 자동 표시
        if (isSamsung && visitCount <= 3) {
          setShowFullGuide(true)
        }
      }
    }, 2000)

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
        setShowFullGuide(false)
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowFullGuide(false)
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  // 전체 화면 가이드 (삼성 인터넷 / 수동 안내)
  if (showFullGuide) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🫁</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">홈 화면에 추가하기</h1>
              <p className="text-lg text-gray-500 mt-2">아래 순서대로 따라해주세요</p>
            </div>

            {isSamsungBrowser ? (
              <div className="space-y-5">
                {/* 화면 아래쪽 화살표 안내 */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-lg font-bold text-amber-800">👇 화면 아래쪽을 보세요!</p>
                  <p className="text-base text-amber-600 mt-1">삼성 인터넷 메뉴 버튼이 있습니다</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">1</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">아래쪽 <span className="text-3xl">≡</span> 누르기</p>
                    <p className="text-base text-gray-500 mt-1">화면 맨 아래에 있는 <span className="font-bold">세 줄(≡) 버튼</span>을 누릅니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">2</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">&quot;현재 페이지 추가&quot; 누르기</p>
                    <p className="text-base text-gray-500 mt-1">메뉴에서 <span className="font-bold text-blue-600 text-lg">&quot;현재 페이지 추가&quot;</span>를 찾아 누릅니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">3</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">&quot;홈 화면&quot; 선택하면 끝!</p>
                    <p className="text-base text-gray-500 mt-1"><span className="font-bold text-emerald-600 text-lg">&quot;홈 화면&quot;</span>을 눌러 바로가기를 만듭니다</p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <p className="text-lg font-bold text-emerald-700">완료 후 바탕화면에 아이콘이 생겨요! 📲</p>
                </div>
              </div>
            ) : isIOS ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">공유 버튼(□↑) 누르기</p>
                    <p className="text-base text-gray-500 mt-1">화면 아래쪽의 공유 버튼을 누릅니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">&quot;홈 화면에 추가&quot; 누르기</p>
                    <p className="text-base text-gray-500 mt-1">아래로 스크롤해서 <span className="font-bold text-blue-600">&quot;홈 화면에 추가&quot;</span>를 찾아 누릅니다</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">메뉴(⋮) 누르기</p>
                    <p className="text-base text-gray-500 mt-1">화면 오른쪽 위의 점 세 개(⋮) 버튼을 누릅니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">&quot;홈 화면에 추가&quot; 누르기</p>
                    <p className="text-base text-gray-500 mt-1">메뉴에서 <span className="font-bold text-blue-600">&quot;홈 화면에 추가&quot;</span>를 찾아 누릅니다</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <p className="text-base text-blue-800 text-center leading-relaxed">
                추가하면 홈 화면에서 앱처럼 바로 열 수 있어요!<br />
                매번 주소를 입력할 필요가 없습니다
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-8 pt-3 bg-white border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="w-full h-14 bg-gray-100 text-gray-600 font-bold text-lg rounded-2xl active:bg-gray-200 transition"
          >
            나중에 하기
          </button>
        </div>
      </div>
    )
  }

  // iOS Safari 간단 배너
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up-banner">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900">홈 화면에 추가하기</p>
              <p className="text-sm text-gray-500 mt-1">매번 주소를 입력할 필요 없이 바로 열어요</p>
            </div>
            <button onClick={handleDismiss} className="text-gray-300 text-2xl leading-none p-1">×</button>
          </div>
          <button
            onClick={() => setShowFullGuide(true)}
            className="w-full mt-3 bg-blue-600 text-white font-bold text-lg py-3.5 rounded-xl active:bg-blue-700 transition-colors"
          >
            방법 보기
          </button>
        </div>
      </div>
    )
  }

  // Android / Chrome / Samsung 설치 유도
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up-banner">
      <div className="mx-3 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🫁</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900">바탕화면에 추가하기</p>
            <p className="text-base text-gray-500">매번 주소 입력 없이 바로 열어요</p>
          </div>
          <button onClick={handleDismiss} className="text-gray-300 text-2xl leading-none p-2 flex-shrink-0">×</button>
        </div>
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full mt-3 bg-blue-600 text-white font-bold text-lg py-4 rounded-xl active:bg-blue-700 active:scale-[0.98] transition-all"
          >
            홈 화면에 추가
          </button>
        ) : (
          <button
            onClick={() => setShowFullGuide(true)}
            className="w-full mt-3 bg-blue-600 text-white font-bold text-lg py-4 rounded-xl active:bg-blue-700 active:scale-[0.98] transition-all"
          >
            추가 방법 보기
          </button>
        )}
      </div>
    </div>
  )
}
