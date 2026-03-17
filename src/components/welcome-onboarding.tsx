'use client'

import { useState, useEffect } from 'react'

export function WelcomeOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      emoji: '🫁',
      title: '아버지 건강 관리',
      subtitle: '매일 건강을 기록하고\n치료 여정을 함께 합니다',
      bg: 'from-blue-600 to-blue-700',
    },
    {
      emoji: '📝',
      title: '간편한 건강 기록',
      subtitle: '컨디션, 증상, 약 복용을\n터치 한번으로 기록해요',
      bg: 'from-emerald-600 to-emerald-700',
    },
    {
      emoji: '📱',
      title: '홈 화면에 추가하세요',
      subtitle: '바탕화면에 추가하면\n매번 주소 입력 없이 바로 열어요',
      bg: 'from-indigo-600 to-indigo-700',
      highlight: true,
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className={`fixed inset-0 z-[200] bg-gradient-to-b ${current.bg} flex flex-col transition-all duration-300`}>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center animate-fade-in" key={step}>
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">{current.emoji}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">{current.title}</h1>
          <p className="text-xl text-white/80 leading-relaxed whitespace-pre-line">{current.subtitle}</p>

          {current.highlight && (
            <div className="mt-6 bg-white/15 backdrop-blur rounded-2xl px-6 py-4 text-left">
              <p className="text-lg text-white/90 font-medium mb-2">Samsung 브라우저:</p>
              <p className="text-base text-white/70">1. 아래 메뉴(≡) → 2. 현재 페이지 추가 → 3. 홈 화면</p>
              <p className="text-lg text-white/90 font-medium mt-3 mb-2">Chrome 브라우저:</p>
              <p className="text-base text-white/70">1. 메뉴(⋮) → 2. 홈 화면에 추가</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="px-8 pb-12">
        {/* 점 인디케이터 */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            if (isLast) {
              localStorage.setItem('daddy_onboarding_done', 'true')
              onComplete()
            } else {
              setStep(step + 1)
            }
          }}
          className="w-full h-16 bg-white text-blue-700 font-bold text-xl rounded-2xl active:scale-[0.98] transition-transform shadow-lg"
        >
          {isLast ? '시작하기' : '다음'}
        </button>

        {!isLast && (
          <button
            onClick={() => {
              localStorage.setItem('daddy_onboarding_done', 'true')
              onComplete()
            }}
            className="w-full mt-3 text-white/50 text-base py-2"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  )
}
