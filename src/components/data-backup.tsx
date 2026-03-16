'use client'

import { useState } from 'react'

const BACKUP_KEYS = [
  'daddy_daily_records',
  'daddy_meals',
  'daddy_exercises',
  'daddy_supplements',
  'daddy_medical_records',
  'daddy_appointments',
  'daddy_users',
]

export function DataBackup({ onBack }: { onBack: () => void }) {
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('daddy_last_backup')
  })

  const handleExport = () => {
    const data: Record<string, unknown> = {}
    BACKUP_KEYS.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        try { data[key] = JSON.parse(item) } catch { data[key] = item }
      }
    })

    const blob = new Blob(
      [JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data })],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `건강기록_백업_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    const now = new Date().toISOString()
    localStorage.setItem('daddy_last_backup', now)
    setLastBackup(now)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string)
          if (!json.data || !json.version) {
            setRestoreStatus('error')
            return
          }
          Object.entries(json.data).forEach(([key, value]) => {
            if (BACKUP_KEYS.includes(key)) {
              localStorage.setItem(key, JSON.stringify(value))
            }
          })
          setRestoreStatus('success')
          setTimeout(() => window.location.reload(), 1500)
        } catch {
          setRestoreStatus('error')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // 기록 통계
  let recordCount = 0
  let exerciseCount = 0
  let appointmentCount = 0
  try {
    const records = localStorage.getItem('daddy_daily_records')
    if (records) recordCount = JSON.parse(records).length
    const exercises = localStorage.getItem('daddy_exercises')
    if (exercises) exerciseCount = JSON.parse(exercises).length
    const appointments = localStorage.getItem('daddy_appointments')
    if (appointments) appointmentCount = JSON.parse(appointments).length
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="bg-blue-600 text-white px-5 py-4 flex items-center gap-3">
        <button className="text-xl py-1 px-2" onClick={onBack}>←</button>
        <h1 className="text-xl font-bold">데이터 백업</h1>
      </header>

      <div className="max-w-lg mx-auto p-5 space-y-5">
        {/* 현재 데이터 현황 */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
          <p className="text-lg font-bold text-blue-900 mb-3">현재 저장된 데이터</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{recordCount}</p>
              <p className="text-sm text-gray-600">건강 기록</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{exerciseCount}</p>
              <p className="text-sm text-gray-600">운동 기록</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{appointmentCount}</p>
              <p className="text-sm text-gray-600">진료 일정</p>
            </div>
          </div>
        </div>

        {/* 백업하기 */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">💾</span>
            <div>
              <p className="text-lg font-bold text-gray-900">백업하기</p>
              <p className="text-sm text-gray-500">기록을 파일로 저장합니다</p>
            </div>
          </div>
          {lastBackup && (
            <p className="text-sm text-gray-400 mb-3">
              마지막 백업: {new Date(lastBackup).toLocaleDateString('ko-KR')}
            </p>
          )}
          <button
            onClick={handleExport}
            className="w-full h-14 bg-blue-600 text-white text-lg font-bold rounded-2xl active:bg-blue-700 active:scale-[0.98] transition-all"
          >
            파일로 백업하기
          </button>
        </div>

        {/* 복원하기 */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📂</span>
            <div>
              <p className="text-lg font-bold text-gray-900">복원하기</p>
              <p className="text-sm text-gray-500">백업 파일에서 기록을 불러옵니다</p>
            </div>
          </div>
          {restoreStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 text-center">
              <p className="text-base font-bold text-emerald-700">복원 완료! 새로고침합니다...</p>
            </div>
          )}
          {restoreStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-center">
              <p className="text-base font-bold text-red-700">파일을 읽을 수 없습니다</p>
            </div>
          )}
          <button
            onClick={handleImport}
            className="w-full h-14 bg-gray-100 text-gray-700 text-lg font-bold rounded-2xl active:bg-gray-200 active:scale-[0.98] transition-all"
          >
            백업 파일 선택
          </button>
        </div>

        {/* 안내 */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <p className="text-base font-semibold text-amber-800 mb-2">왜 백업이 필요한가요?</p>
          <ul className="space-y-1.5 text-sm text-amber-700">
            <li>• 폰을 바꾸거나 브라우저 데이터를 지우면 기록이 사라질 수 있어요</li>
            <li>• 백업 파일이 있으면 언제든 복원할 수 있어요</li>
            <li>• 진료 전에 백업해두시면 안심이에요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
