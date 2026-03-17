'use client'

import { useState, useEffect } from 'react'
import { haptic } from '@/lib/haptic'

interface CheckItem {
  id: string
  label: string
  emoji: string
}

const CHECKLIST_ITEMS: CheckItem[] = [
  { id: 'summary', label: '진료 요약 확인하기', emoji: '📋' },
  { id: 'questions', label: '의사에게 물어볼 것 정리', emoji: '❓' },
  { id: 'meds', label: '현재 복용 중인 약 목록 확인', emoji: '💊' },
  { id: 'insurance', label: '의료보험증/신분증 준비', emoji: '💳' },
  { id: 'records', label: '최근 건강 기록 앱에서 확인', emoji: '📱' },
  { id: 'transport', label: '병원 가는 교통편 확인', emoji: '🚗' },
]

function getChecklistKey(appointmentDate: string) {
  return `daddy_visit_checklist_${appointmentDate}`
}

function loadChecked(appointmentDate: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const saved = localStorage.getItem(getChecklistKey(appointmentDate))
    return saved ? new Set(JSON.parse(saved)) : new Set()
  } catch { return new Set() }
}

function saveChecked(appointmentDate: string, checked: Set<string>) {
  localStorage.setItem(getChecklistKey(appointmentDate), JSON.stringify([...checked]))
}

export function VisitChecklist({ appointmentDate, hospital }: { appointmentDate: string; hospital: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    setChecked(loadChecked(appointmentDate))
  }, [appointmentDate])

  const toggleItem = (id: string) => {
    haptic('light')
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      saveChecked(appointmentDate, next)
      return next
    })
  }

  const daysUntil = Math.ceil(
    (new Date(appointmentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const progress = (checked.size / CHECKLIST_ITEMS.length) * 100

  if (daysUntil > 3 || daysUntil < 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-base font-bold text-blue-800">
            {daysUntil === 0 ? '오늘 진료!' : `진료 D-${daysUntil}`}
          </p>
          <p className="text-sm text-blue-600">{hospital} 방문 준비</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-700">{checked.size}/{CHECKLIST_ITEMS.length}</p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full bg-blue-100 rounded-full h-2 mb-3">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] ${
              checked.has(item.id)
                ? 'bg-blue-100/50 text-blue-400'
                : 'bg-white text-gray-800'
            }`}
          >
            <span className={`text-xl flex-shrink-0 ${checked.has(item.id) ? 'opacity-50' : ''}`}>
              {checked.has(item.id) ? '✅' : item.emoji}
            </span>
            <span className={`text-base font-medium ${checked.has(item.id) ? 'line-through' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {checked.size === CHECKLIST_ITEMS.length && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
          <p className="text-base font-bold text-emerald-700">준비 완료! 화이팅!</p>
        </div>
      )}
    </div>
  )
}
