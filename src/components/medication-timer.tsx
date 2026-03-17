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

interface MedSchedule {
  id: string
  label: string
  hour: number
  minute: number
}

const DEFAULT_MEDICATIONS: MedSchedule[] = [
  { id: 'morning', label: '아침 약', hour: 8, minute: 0 },
  { id: 'lunch', label: '점심 약', hour: 13, minute: 0 },
  { id: 'dinner', label: '저녁 약', hour: 19, minute: 0 },
]

function getMedSchedule(): MedSchedule[] {
  if (typeof window === 'undefined') return DEFAULT_MEDICATIONS
  try {
    const saved = localStorage.getItem('daddy_med_schedule')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return DEFAULT_MEDICATIONS
}

function saveMedSchedule(schedule: MedSchedule[]) {
  localStorage.setItem('daddy_med_schedule', JSON.stringify(schedule))
}

function getTodayKey() {
  return `med_taken_${new Date().toISOString().split('T')[0]}`
}

function loadTodayMeds(): MedTime[] {
  if (typeof window === 'undefined') return getMedSchedule().map(m => ({ ...m, taken: false }))
  try {
    const saved = localStorage.getItem(getTodayKey())
    if (saved) {
      const savedMeds: MedTime[] = JSON.parse(saved)
      // 스케줄과 병합 (새 약 추가 / 삭제된 약 제거)
      const schedule = getMedSchedule()
      return schedule.map(s => {
        const existing = savedMeds.find(m => m.id === s.id)
        return existing ? { ...s, taken: existing.taken, takenAt: existing.takenAt } : { ...s, taken: false }
      })
    }
  } catch { /* ignore */ }
  return getMedSchedule().map(m => ({ ...m, taken: false }))
}

function saveTodayMeds(meds: MedTime[]) {
  localStorage.setItem(getTodayKey(), JSON.stringify(meds))
}

export function MedicationTimer() {
  const [meds, setMeds] = useState<MedTime[]>(loadTodayMeds)
  const [now, setNow] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [editSchedule, setEditSchedule] = useState<MedSchedule[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [newHour, setNewHour] = useState('12')
  const [newMinute, setNewMinute] = useState('00')

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
      checkMedNotifications()
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const checkMedNotifications = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const currentMeds = loadTodayMeds()
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    currentMeds.forEach(med => {
      if (med.taken) return
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

  const openSettings = () => {
    setEditSchedule([...getMedSchedule()])
    setShowSettings(true)
  }

  const handleAddMed = () => {
    if (!newLabel.trim()) return
    const id = `med_${Date.now()}`
    setEditSchedule(prev => [...prev, {
      id,
      label: newLabel.trim(),
      hour: parseInt(newHour, 10),
      minute: parseInt(newMinute, 10),
    }])
    setNewLabel('')
    setNewHour('12')
    setNewMinute('00')
  }

  const handleDeleteMed = (id: string) => {
    setEditSchedule(prev => prev.filter(m => m.id !== id))
  }

  const handleSaveSchedule = () => {
    saveMedSchedule(editSchedule)
    setMeds(loadTodayMeds())
    setShowSettings(false)
    haptic('success')
  }

  // 주간 복용 통계
  const weekStats = (() => {
    const days: { day: string; taken: number; total: number }[] = []
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `med_taken_${d.toISOString().split('T')[0]}`
      let taken = 0, total = 0
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null
        if (saved) {
          const dayMeds: MedTime[] = JSON.parse(saved)
          total = dayMeds.length
          taken = dayMeds.filter(m => m.taken).length
        }
      } catch { /* ignore */ }
      days.push({ day: dayNames[d.getDay()], taken, total })
    }
    return days
  })()
  const weekTotalTaken = weekStats.reduce((s, d) => s + d.taken, 0)
  const weekTotalMeds = weekStats.reduce((s, d) => s + d.total, 0)

  const takenCount = meds.filter(m => m.taken).length
  const totalCount = meds.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-200">오늘의 약</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">{takenCount}/{totalCount} 복용</p>
          <button
            onClick={openSettings}
            className="text-sm text-blue-500 py-1 px-2 rounded-lg active:bg-blue-50"
          >
            설정
          </button>
        </div>
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
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                : isNear
                  ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-600 animate-pulse-slow'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{med.label}</span>
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

      {/* 주간 복용 통계 */}
      {weekTotalMeds > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">이번 주 복용률</p>
            <p className="text-sm font-bold text-blue-600">
              {weekTotalMeds > 0 ? Math.round((weekTotalTaken / weekTotalMeds) * 100) : 0}%
            </p>
          </div>
          <div className="flex justify-between gap-1">
            {weekStats.map((d, i) => {
              const isToday = i === weekStats.length - 1
              const rate = d.total > 0 ? d.taken / d.total : 0
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div className={`w-full h-6 rounded flex items-end overflow-hidden ${d.total > 0 ? 'bg-gray-100' : 'bg-transparent'}`}>
                    {d.total > 0 && (
                      <div
                        className={`w-full rounded transition-all ${rate === 1 ? 'bg-emerald-400' : rate > 0 ? 'bg-amber-400' : 'bg-gray-200'}`}
                        style={{ height: `${Math.max(rate * 100, rate > 0 ? 20 : 0)}%` }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] ${isToday ? 'font-bold text-blue-600' : 'text-gray-400'}`}>{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 약 스케줄 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 mx-4 max-w-sm w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">약 시간 설정</h3>

            {/* 기존 약 목록 */}
            <div className="space-y-2 mb-4">
              {editSchedule.map(med => (
                <div key={med.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className="text-base font-medium text-gray-800 flex-1">{med.label}</span>
                  <span className="text-base text-gray-500">
                    {String(med.hour).padStart(2, '0')}:{String(med.minute).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => handleDeleteMed(med.id)}
                    className="text-red-400 text-lg px-2 py-1 active:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 새 약 추가 */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">새 약 추가</p>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="약 이름 (예: 비타민D)"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base mb-2 focus:outline-none focus:border-blue-400"
              />
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={newHour}
                  onChange={e => setNewHour(e.target.value)}
                  className="flex-1 h-12 px-3 rounded-xl border border-gray-200 text-base text-center bg-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>
                  ))}
                </select>
                <span className="text-gray-400 text-xl">:</span>
                <select
                  value={newMinute}
                  onChange={e => setNewMinute(e.target.value)}
                  className="flex-1 h-12 px-3 rounded-xl border border-gray-200 text-base text-center bg-white"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMed}
                  disabled={!newLabel.trim()}
                  className="h-12 px-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-40 active:scale-95 transition"
                >
                  추가
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 h-14 rounded-2xl bg-gray-100 text-lg font-semibold text-gray-700 active:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex-1 h-14 rounded-2xl bg-blue-600 text-lg font-semibold text-white active:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
