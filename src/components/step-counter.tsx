'use client'

import { useState, useEffect, useCallback } from 'react'
import { haptic } from '@/lib/haptic'

const STEP_GOAL = 6000 // 시니어 권장 걸음수

function getTodayStepKey() {
  return `daddy_steps_${new Date().toISOString().split('T')[0]}`
}

function getStepHistory(): { date: string; steps: number }[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('daddy_step_history')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveStepHistory(history: { date: string; steps: number }[]) {
  localStorage.setItem('daddy_step_history', JSON.stringify(history))
}

function getTodaySteps(): number {
  if (typeof window === 'undefined') return 0
  try {
    return parseInt(localStorage.getItem(getTodayStepKey()) || '0', 10)
  } catch { return 0 }
}

function saveTodaySteps(steps: number) {
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem(getTodayStepKey(), String(steps))
  // 히스토리에도 저장
  const history = getStepHistory()
  const idx = history.findIndex(h => h.date === today)
  if (idx >= 0) {
    history[idx].steps = steps
  } else {
    history.push({ date: today, steps })
  }
  // 최근 30일만 보관
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  saveStepHistory(history.filter(h => h.date >= cutoffStr))
}

export function StepCounter() {
  const [steps, setSteps] = useState(0)
  const [inputMode, setInputMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [weekHistory, setWeekHistory] = useState<{ day: string; steps: number }[]>([])

  useEffect(() => {
    setSteps(getTodaySteps())
    // 주간 히스토리 로드
    const history = getStepHistory()
    const week: { day: string; steps: number }[] = []
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = history.find(h => h.date === dateStr)
      week.push({ day: dayNames[d.getDay()], steps: entry?.steps || 0 })
    }
    setWeekHistory(week)
  }, [])

  const handleQuickAdd = useCallback((amount: number) => {
    haptic('light')
    const newSteps = steps + amount
    setSteps(newSteps)
    saveTodaySteps(newSteps)
  }, [steps])

  const handleManualInput = useCallback(() => {
    const val = parseInt(inputValue, 10)
    if (val > 0) {
      haptic('success')
      setSteps(val)
      saveTodaySteps(val)
      setInputMode(false)
      setInputValue('')
    }
  }, [inputValue])

  const progress = Math.min((steps / STEP_GOAL) * 100, 100)
  const goalReached = steps >= STEP_GOAL

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold text-gray-700">오늘의 걸음수</p>
        <p className="text-sm text-gray-400">목표 {STEP_GOAL.toLocaleString()}보</p>
      </div>

      {/* 걸음수 프로그레스 원형 */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke={goalReached ? '#10b981' : '#3b82f6'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">{goalReached ? '🎉' : '🚶'}</span>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-3xl font-bold ${goalReached ? 'text-emerald-600' : 'text-gray-900'}`}>
            {steps.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {goalReached
              ? '목표 달성! 대단해요!'
              : `${(STEP_GOAL - steps).toLocaleString()}보 남았어요`
            }
          </p>
        </div>
      </div>

      {/* 주간 미니 차트 */}
      <div className="flex justify-between items-end gap-1 h-12">
        {weekHistory.map((d, i) => {
          const isToday = i === weekHistory.length - 1
          const h = d.steps > 0 ? Math.max((d.steps / STEP_GOAL) * 100, 10) : 0
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="w-full bg-gray-100 rounded h-8 flex flex-col justify-end overflow-hidden">
                {d.steps > 0 && (
                  <div
                    className={`rounded transition-all ${d.steps >= STEP_GOAL ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    style={{ height: `${Math.min(h, 100)}%` }}
                  />
                )}
              </div>
              <span className={`text-[10px] ${isToday ? 'font-bold text-blue-600' : 'text-gray-400'}`}>{d.day}</span>
            </div>
          )
        })}
      </div>

      {/* 걸음수 입력 */}
      {inputMode ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualInput()}
            placeholder="걸음수 입력"
            className="flex-1 h-12 px-4 rounded-2xl border border-gray-200 text-lg text-center focus:outline-none focus:border-blue-400"
            autoFocus
          />
          <button
            onClick={handleManualInput}
            className="h-12 px-5 rounded-2xl bg-blue-600 text-white font-bold active:scale-95 transition"
          >
            저장
          </button>
          <button
            onClick={() => setInputMode(false)}
            className="h-12 px-3 rounded-2xl bg-gray-100 text-gray-500 active:scale-95 transition"
          >
            취소
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickAdd(1000)}
            className="flex-1 h-11 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm active:scale-95 transition border border-blue-200"
          >
            +1,000보
          </button>
          <button
            onClick={() => handleQuickAdd(3000)}
            className="flex-1 h-11 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm active:scale-95 transition border border-blue-200"
          >
            +3,000보
          </button>
          <button
            onClick={() => setInputMode(true)}
            className="flex-1 h-11 rounded-xl bg-gray-50 text-gray-600 font-medium text-sm active:scale-95 transition border border-gray-200"
          >
            직접입력
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        📱 삼성 헬스/건강 앱에서 확인한 걸음수를 입력해주세요
      </p>
    </div>
  )
}
