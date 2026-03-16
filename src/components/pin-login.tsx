'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export function PinLogin() {
  const { login } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      setError(false)

      if (newPin.length === 4) {
        const success = login(newPin)
        if (!success) {
          setError(true)
          setShake(true)
          setTimeout(() => {
            setPin('')
            setShake(false)
          }, 600)
        }
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-xs">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🫁</div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">아버지 건강 관리</h1>
          <p className="text-sm text-gray-400 mt-1">PIN 번호를 입력하세요</p>
        </div>

        {/* PIN 도트 */}
        <div className={`flex justify-center gap-5 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? error ? 'bg-red-500 scale-110' : 'bg-blue-600 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-500 text-sm mb-4">PIN이 올바르지 않습니다</p>
        )}

        {/* 숫자 패드 */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              className="h-16 rounded-2xl text-2xl font-medium text-gray-800 bg-gray-50 active:bg-gray-200 transition-colors"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            className="h-16 rounded-2xl text-2xl font-medium text-gray-800 bg-gray-50 active:bg-gray-200 transition-colors"
            onClick={() => handleNumberClick('0')}
          >
            0
          </button>
          <button
            className="h-16 rounded-2xl text-sm font-medium text-gray-400 active:bg-gray-100 transition-colors"
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          아버지 1959 · 관리자 0000
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.25s ease-in-out 2;
        }
      `}</style>
    </div>
  )
}
