'use client'

import { useState, useEffect, useCallback } from 'react'
import { haptic } from '@/lib/haptic'

interface MedTime {
  id: string
  label: string
  hour: number
  minute: number
  taken: boolean
  takenAt?: string
}

const DEFAULT_MEDICATIONS: Omit<MedTime, 'taken' | 'takenAt'>[] = [
  { id: 'morning', label: '아침 약', hour: 8, minute: 0 },
  { id: 'lunch', label: '점심 약', hour: 13, minute: 0 },
  { id: 'dinner', label: '저녁 약', hour: 19, minute: 0 },
]

function getTodayKey() {
  return `med_taken_${new Date().toISOString().split('T')[0]}`
}

function loadTodayMeds(): MedTime[] {
  if (typeof window === 'undefined') return DEFAULT_MEDICATIONS.map(m => ({ ...m, taken: false }))
  try {
    const saved = localStorage.getItem(getTodayKey())
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return DEFAULT_MEDICATIONS.map(m => ({ ...m, taken: false }))
}

function saveTodayMeds(meds: MedTime[]) {
  localStorage.setItem(getTodayKey(), JSON.stringify(meds))
}

export function MedicationTimer() {
  const [meds, setMeds] = useState<MedTime[]>(loadTodayMeds)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
      // 매 분마다 약 복용 알림 체크
      checkMedNotifications()
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // 약 복용 시간에 브라우저 알림
  const checkMedNotifications = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const currentMeds = loadTodayMeds()
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    currentMeds.forEach(med => {
      if (med.taken) return
      // 정확히 약 복용 시간이거나 5분 후일 때 알림
      if (med.hour === currentHour && (currentMinute === med.minute || currentMinute === med.minute + 5)) {
        const notifKey = `med_notif_${med.id}_${now.toISOString().split('T')[0]}_${currentMinute}`
        if (!sessionStorage.getItem(notifKey)) {
          new Notification(`💊 ${med.label} 시간이에요!`, {
            body: '지금 약을 복용해주세요',
            icon: '/icon-192.png',
            tag: med.id,
          })
          sessionStorage.setItem(notifKey, 'true')
        }
      }
    })
  }, [])

  const handleTaken = useCallback((id: string) => {
    haptic('success')
    setMeds(prev => {
      const next = prev.map(m =>
        m.id === id ? { ...m, taken: true, takenAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) } : m
      )
      saveTodayMeds(next)
      return next
    })
  }, [])

  const handleUndo = useCallback((id: string) => {
    setMeds(prev => {
      const next = prev.map(m =>
        m.id === id ? { ...m, taken: false, takenAt: undefined } : m
      )
      saveTodayMeds(next)
      return next
    })
  }, [])

  const takenCount = meds.filter(m => m.taken).length
  const totalCount = meds.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold text-gray-700">오늘의 약</p>
        <p className="text-sm text-gray-400">{takenCount}/{totalCount} 복용</p>
      </div>
      {meds.map(med => {
        const medTime = new Date()
        medTime.setHours(med.hour, med.minute, 0, 0)
        const isPast = now > medTime
        const isNear = !med.taken && isPast && (now.getTime() - medTime.getTime()) < 2 * 60 * 60 * 1000

        return (
          <div
            key={med.id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
              med.taken
                ? 'bg-emerald-50 border border-emerald-200'
                : isNear
                  ? 'bg-orange-50 border-2 border-orange-300 animate-pulse-slow'
                  : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">{med.label}</span>
                <span className="text-sm text-gray-400">
                  {String(med.hour).padStart(2, '0')}:{String(med.minute).padStart(2, '0')}
                </span>
              </div>
              {med.taken && med.takenAt && (
                <p className="text-sm text-emerald-600 mt-0.5">{med.takenAt}에 복용 완료</p>
              )}
              {isNear && (
                <p className="text-sm text-orange-600 font-medium mt-0.5">약 먹을 시간이에요!</p>
              )}
            </div>
            {med.taken ? (
              <button
                onClick={() => handleUndo(med.id)}
                className="w-14 h-14 rounded-full bg-emerald-500 text-white text-2xl flex items-center justify-center active:scale-90 transition-transform"
              >
                ✓
              </button>
            ) : (
              <button
                onClick={() => handleTaken(med.id)}
                className={`w-14 h-14 rounded-full text-white text-lg font-bold flex items-center justify-center active:scale-90 transition-transform ${
                  isNear ? 'bg-orange-500' : 'bg-blue-500'
                }`}
              >
                복용
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
