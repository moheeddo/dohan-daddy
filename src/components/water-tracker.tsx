'use client'

import { useState, useEffect, useCallback } from 'react'
import { haptic } from '@/lib/haptic'

const WATER_GOAL = 1500 // ml (시니어 NTM 환자 권장량)
const CUP_SIZE = 200 // ml per cup

function getTodayWaterKey() {
  return `daddy_water_${new Date().toISOString().split('T')[0]}`
}

function getTodayWater(): number {
  if (typeof window === 'undefined') return 0
  try {
    return parseInt(localStorage.getItem(getTodayWaterKey()) || '0', 10)
  } catch { return 0 }
}

function saveTodayWater(ml: number) {
  localStorage.setItem(getTodayWaterKey(), String(ml))
}

export function WaterTracker() {
  const [water, setWater] = useState(0)

  useEffect(() => {
    setWater(getTodayWater())
  }, [])

  const handleAdd = useCallback((amount: number) => {
    haptic('light')
    const next = water + amount
    setWater(next)
    saveTodayWater(next)
  }, [water])

  const handleUndo = useCallback(() => {
    const next = Math.max(0, water - CUP_SIZE)
    setWater(next)
    saveTodayWater(next)
  }, [water])

  const progress = Math.min((water / WATER_GOAL) * 100, 100)
  const cups = Math.floor(water / CUP_SIZE)
  const goalReached = water >= WATER_GOAL

  // 물방울 아이콘 (8잔 기준)
  const totalCups = Math.ceil(WATER_GOAL / CUP_SIZE)
  const displayCups = Math.min(totalCups, 8)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-200">수분 섭취</p>
        <p className="text-sm text-gray-400">{water}ml / {WATER_GOAL}ml</p>
      </div>

      {/* 물방울 프로그레스 */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: displayCups }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-7 rounded-lg transition-all ${
              i < cups
                ? goalReached ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-blue-400 dark:bg-blue-500'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* 상태 메시지 */}
      <p className="text-sm text-center mb-2">
        {goalReached ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">목표 달성! 잘 하셨어요 💧</span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">{Math.round(WATER_GOAL - water)}ml 더 마시면 목표 달성!</span>
        )}
      </p>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAdd(CUP_SIZE)}
          className="flex-1 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-base active:scale-95 transition border border-blue-200 dark:border-blue-700"
        >
          💧 한 잔 ({CUP_SIZE}ml)
        </button>
        <button
          onClick={() => handleAdd(500)}
          className="flex-1 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-base active:scale-95 transition border border-blue-200 dark:border-blue-700"
        >
          🥤 500ml
        </button>
        {water > 0 && (
          <button
            onClick={handleUndo}
            className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 text-sm active:scale-95 transition flex items-center justify-center flex-shrink-0"
          >
            ↩
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center mt-1.5">
        가래 배출과 기관지 건강을 위해 하루 1.5L 이상 수분을 섭취하세요
      </p>
    </div>
  )
}
