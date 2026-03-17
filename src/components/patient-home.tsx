'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { DailyRecordForm } from '@/components/daily-record-form'
import { AppointmentManager } from '@/components/appointment-manager'
import { InfoHub } from '@/components/info-hub'
import { VisitSummary } from '@/components/visit-summary'
import { DataBackup } from '@/components/data-backup'
import { MedicationTimer } from '@/components/medication-timer'
import { haptic } from '@/lib/haptic'
import { FontSizeSelector, ThemeSelector } from '@/components/font-size-control'
import { EmergencyCall } from '@/components/emergency-call'
import { StepCounter } from '@/components/step-counter'
import { WeatherHealthTip } from '@/components/weather-health-tip'
import { VisitChecklist } from '@/components/visit-checklist'
import { WaterTracker } from '@/components/water-tracker'
import {
  getDailyRecordByDate,
  getRecentDailyRecords,
  getExercisesByDate,
  getTodayString,
  getUpcomingAppointments,
  saveExercise,
  deleteExercise,
  getRecordStreak,
  hasYesterdayRecord,
  saveDailyRecord,
  getMonthRecordDates,
} from '@/lib/store'
import { expandedArticles } from '@/lib/ntm-knowledge'
import type { DailyRecord, ExerciseType } from '@/types/database'

// ─── 증상 추세 미니 차트 (2주) ──────────────────
function SymptomTrendChart({ records }: { records: DailyRecord[] }) {
  if (records.length < 3) return null

  const metrics = [
    { key: 'cough_level' as const, label: '기침', color: '#f59e0b' },
    { key: 'sputum_amount' as const, label: '가래', color: '#10b981' },
    { key: 'fatigue_level' as const, label: '피로', color: '#8b5cf6' },
  ]

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  const w = 280, h = 80, px = 8, py = 8
  const plotW = w - px * 2, plotH = h - py * 2
  const step = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW

  const makePath = (key: 'cough_level' | 'sputum_amount' | 'fatigue_level') => {
    return sorted.map((r, i) => {
      const x = px + i * step
      const y = py + plotH - (r[key] / 10) * plotH
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }

  // 평균 계산
  const avgCough = (sorted.reduce((s, r) => s + r.cough_level, 0) / sorted.length).toFixed(1)
  const avgSputum = (sorted.reduce((s, r) => s + r.sputum_amount, 0) / sorted.length).toFixed(1)
  const avgFatigue = (sorted.reduce((s, r) => s + r.fatigue_level, 0) / sorted.length).toFixed(1)

  // 추세 (최근 3일 vs 이전)
  const recent3 = sorted.slice(-3)
  const earlier = sorted.slice(0, -3)
  const getTrend = (key: 'cough_level' | 'sputum_amount' | 'fatigue_level') => {
    if (earlier.length === 0) return '→'
    const recentAvg = recent3.reduce((s, r) => s + r[key], 0) / recent3.length
    const earlierAvg = earlier.reduce((s, r) => s + r[key], 0) / earlier.length
    const diff = recentAvg - earlierAvg
    if (diff < -0.5) return '↓' // 개선
    if (diff > 0.5) return '↑' // 악화
    return '→'
  }

  return (
    <div>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">증상 추세 ({sorted.length}일)</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
        {/* 배경 가이드라인 */}
        <line x1={px} y1={py + plotH * 0.5} x2={w - px} y2={py + plotH * 0.5} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
        {metrics.map(m => (
          <path key={m.key} d={makePath(m.key)} fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        {[
          { label: '기침', avg: avgCough, trend: getTrend('cough_level'), color: 'text-amber-600' },
          { label: '가래', avg: avgSputum, trend: getTrend('sputum_amount'), color: 'text-emerald-600' },
          { label: '피로', avg: avgFatigue, trend: getTrend('fatigue_level'), color: 'text-violet-600' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1 text-sm">
            <span className={`font-bold ${item.color}`}>{item.label}</span>
            <span className="text-gray-500 dark:text-gray-400">{item.avg}</span>
            <span className={item.trend === '↓' ? 'text-emerald-500' : item.trend === '↑' ? 'text-red-500' : 'text-gray-400'}>
              {item.trend}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1">↓개선 →유지 ↑주의 · 진료 시 보여주세요</p>
    </div>
  )
}

// ─── 월간 기록 달력 ──────────────────
function MonthlyCalendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const recordDates = getMonthRecordDates(year, month)
  const today = getTodayString()

  const monthName = `${month + 1}월`
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <p className="text-base font-semibold text-gray-700 mb-2">{year}년 {monthName} 기록</p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayLabels.map(d => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasRecord = recordDates.has(dateStr)
          const isToday = dateStr === today
          const isFuture = dateStr > today
          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${
                isToday
                  ? 'bg-blue-600 text-white font-bold'
                  : hasRecord
                    ? 'bg-emerald-100 text-emerald-700'
                    : isFuture
                      ? 'text-gray-300'
                      : 'text-gray-400'
              }`}
            >
              {hasRecord && !isToday ? '✓' : day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 justify-center">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 bg-emerald-100 rounded" /> 기록함
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 bg-blue-600 rounded" /> 오늘
        </span>
      </div>
    </div>
  )
}

// ─── 주간 컨디션 차트 (클릭 가능) ──────────────────
function WeeklyChart({ records, onTap }: { records: DailyRecord[]; onTap: () => void }) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  return (
    <button onClick={onTap} className="w-full text-left active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-end gap-1.5">
        {last7.map((dateStr) => {
          const record = records.find(r => r.date === dateStr)
          const date = new Date(dateStr)
          const dayName = days[date.getDay()]
          const isToday = dateStr === getTodayString()
          const h = record ? (record.overall_condition / 3) * 100 : 0
          const emoji = record
            ? record.overall_condition === 3 ? '😊' : record.overall_condition === 2 ? '😐' : '😔'
            : ''

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-lg leading-none">{emoji}</span>
              <div className="w-full bg-gray-100 rounded-lg h-10 flex flex-col justify-end overflow-hidden">
                {record && (
                  <div
                    className={`rounded-lg transition-all ${
                      record.overall_condition === 3 ? 'bg-emerald-400' :
                      record.overall_condition === 2 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                )}
              </div>
              <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                {dayName}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-gray-500 text-center mt-2">탭하여 오늘 기록하기</p>
    </button>
  )
}

// ─── 빠른 메모 (음성 입력 지원) ──────────────────
function QuickMemo({ userId }: { userId: string }) {
  const [memo, setMemo] = useState('')
  const [saved, setSaved] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false)
  const today = getTodayString()

  useEffect(() => {
    setHasSpeechAPI('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  const handleSave = () => {
    if (!memo.trim()) return
    const existing = getDailyRecordByDate(today)
    if (existing) {
      const newNotes = existing.notes ? `${existing.notes}\n${memo.trim()}` : memo.trim()
      saveDailyRecord({ ...existing, notes: newNotes })
    } else {
      saveDailyRecord({
        user_id: userId,
        date: today,
        overall_condition: 2,
        cough_level: 3,
        sputum_amount: 3,
        sputum_color: 'clear',
        breathing_difficulty: 2,
        fatigue_level: 3,
        dumping_symptom: false,
        mood: 3,
        notes: memo.trim(),
      })
    }
    haptic('light')
    setSaved(true)
    setMemo('')
    setTimeout(() => setSaved(false), 1500)
  }

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognitionCtor) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any
    recognition.lang = 'ko-KR'
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string
      setMemo(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    haptic('light')
    setIsListening(true)
    recognition.start()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder={isListening ? '듣고 있어요...' : '메모하세요 (🎤 말로도 가능)'}
        className={`flex-1 h-12 px-4 rounded-2xl bg-white dark:bg-gray-800 border text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none shadow-sm ${
          isListening ? 'border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-200 dark:border-gray-600 focus:border-blue-400'
        }`}
      />
      {hasSpeechAPI && (
        <button
          onClick={startVoice}
          disabled={isListening}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl active:scale-95 transition flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          🎤
        </button>
      )}
      <button
        onClick={handleSave}
        disabled={!memo.trim()}
        className={`h-12 px-5 rounded-2xl text-base font-bold transition-all active:scale-95 flex-shrink-0 ${
          saved
            ? 'bg-emerald-500 text-white'
            : memo.trim()
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-300'
        }`}
      >
        {saved ? '✓' : '저장'}
      </button>
    </div>
  )
}

// ─── 빠른 운동 입력 바텀시트 ──────────────────
const QUICK_EXERCISES: { type: ExerciseType; label: string; emoji: string }[] = [
  { type: 'walking', label: '걷기', emoji: '🚶' },
  { type: 'breathing', label: '호흡운동', emoji: '🌬️' },
  { type: 'stretching', label: '스트레칭', emoji: '🧘' },
  { type: 'other', label: '기타', emoji: '💪' },
]

function QuickExerciseSheet({
  open,
  onClose,
  userId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  userId: string
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<ExerciseType | null>(null)
  const [duration, setDuration] = useState(30)
  const [saved, setSaved] = useState(false)

  const today = getTodayString()
  const todayExercises = getExercisesByDate(today)
  const totalMinutes = todayExercises.reduce((s, e) => s + e.duration_minutes, 0)

  if (!open) return null

  const handleSave = () => {
    if (!selected) return
    saveExercise({
      user_id: userId,
      date: today,
      exercise_type: selected,
      duration_minutes: duration,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setSelected(null)
      setDuration(30)
      onSaved()
    }, 800)
  }

  const handleDelete = (id: string) => {
    deleteExercise(id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">오늘의 운동</h2>

        {/* 기존 기록 */}
        {todayExercises.length > 0 && (
          <div className="mb-4 space-y-2">
            {todayExercises.map(e => {
              const ex = QUICK_EXERCISES.find(q => q.type === e.exercise_type)
              return (
                <div key={e.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
                  <span className="text-base font-medium">{ex?.emoji} {ex?.label} {e.duration_minutes}분</span>
                  <button className="text-sm text-gray-400 py-1 px-2" onClick={() => handleDelete(e.id!)}>삭제</button>
                </div>
              )
            })}
            <p className="text-right text-base font-semibold text-blue-600">총 {totalMinutes}분</p>
          </div>
        )}

        {/* 운동 선택 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_EXERCISES.map(ex => (
            <button
              key={ex.type}
              onClick={() => setSelected(ex.type)}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${
                selected === ex.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <span className="text-2xl">{ex.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{ex.label}</span>
            </button>
          ))}
        </div>

        {/* 시간 선택 */}
        {selected && (
          <>
            <div className="flex items-center justify-center gap-2.5 mb-5">
              {[10, 20, 30, 45, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`px-4 py-2.5 rounded-full text-base font-medium transition-all ${
                    duration === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {m}분
                </button>
              ))}
            </div>
            <Button
              onClick={handleSave}
              className={`w-full h-14 text-lg font-bold rounded-2xl ${
                saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saved ? '저장 완료!' : '추가하기'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── 하단 탭 네비게이션 ──────────────────
const TAB_ITEMS = [
  { id: 'home' as const, label: '홈', icon: '🏠' },
  { id: 'record' as const, label: '기록', icon: '📝' },
  { id: 'info' as const, label: '치료정보', icon: '💊' },
  { id: 'appointment' as const, label: '진료', icon: '🏥' },
  { id: 'more' as const, label: '더보기', icon: '⋯' },
]

function BottomTabBar({ activeTab, onTabChange }: { activeTab: ViewType; onTabChange: (tab: ViewType) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex">
        {TAB_ITEMS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); haptic('light') }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors select-none active:scale-95 ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="text-[1.7rem] leading-none">{tab.icon}</span>
            <span className={`text-[11px] font-medium ${activeTab === tab.id ? 'font-bold' : ''}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// ─── 메인 ──────────────────────────────
type ViewType = 'home' | 'record' | 'info' | 'appointment' | 'summary' | 'backup' | 'more'

export function PatientHome() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<ViewType>('home')
  const [exerciseOpen, setExerciseOpen] = useState(false)
  const [todayRecord, setTodayRecord] = useState<DailyRecord | undefined>()
  const [recentRecords, setRecentRecords] = useState<DailyRecord[]>([])
  const [todayExerciseMinutes, setTodayExerciseMinutes] = useState(0)
  const [nextApptDate, setNextApptDate] = useState<string | null>(null)
  const [nextApptHospital, setNextApptHospital] = useState<string>('')
  const [streak, setStreak] = useState(0)
  const [yesterdayMissed, setYesterdayMissed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [quickSaved, setQuickSaved] = useState(false)
  const [showBackupReminder, setShowBackupReminder] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // 기본 true로 → PWA 설치 버튼 숨김


  const loadData = () => {
    const today = getTodayString()
    setTodayRecord(getDailyRecordByDate(today))
    setRecentRecords(getRecentDailyRecords(7))
    const exs = getExercisesByDate(today)
    setTodayExerciseMinutes(exs.reduce((s, e) => s + e.duration_minutes, 0))
    const upcoming = getUpcomingAppointments()
    if (upcoming.length > 0) {
      setNextApptDate(upcoming[0].date)
      setNextApptHospital(upcoming[0].hospital)
    } else {
      setNextApptDate(null)
    }
    setStreak(getRecordStreak())
    setYesterdayMissed(!hasYesterdayRecord())
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  // 알림 권한 요청 + 진료일 리마인더
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // 자동 백업 리마인더 (7일마다)
  useEffect(() => {
    const lastBackup = localStorage.getItem('daddy_last_backup')
    if (!lastBackup) {
      // 백업한 적 없으면 리마인더
      const records = getRecentDailyRecords(3)
      if (records.length >= 3) setShowBackupReminder(true)
    } else {
      const daysSince = Math.floor((Date.now() - parseInt(lastBackup, 10)) / (1000 * 60 * 60 * 24))
      if (daysSince >= 7) setShowBackupReminder(true)
    }
  }, [])

  // 진료일이 오늘이면 알림
  useEffect(() => {
    if (!nextApptDate) return
    const today = getTodayString()
    if (nextApptDate === today && 'Notification' in window && Notification.permission === 'granted') {
      const shown = sessionStorage.getItem('appt_notif_shown')
      if (!shown) {
        new Notification('오늘 진료 예정입니다', {
          body: `${nextApptHospital} 방문 예정이에요. 진료 요약을 확인해주세요!`,
          icon: '/icon-192.png',
        })
        sessionStorage.setItem('appt_notif_shown', 'true')
      }
    }
  }, [nextApptDate, nextApptHospital])

  // 뷰 전환 시 스크롤 위치 초기화
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  // 빠른 컨디션 입력 (홈에서 바로 3초 기록)
  const handleQuickCondition = (condition: number) => {
    if (!user) return
    haptic('success')
    const today = getTodayString()
    const existing = getDailyRecordByDate(today)
    saveDailyRecord({
      user_id: user.id,
      date: today,
      overall_condition: condition,
      cough_level: existing?.cough_level ?? 3,
      sputum_amount: existing?.sputum_amount ?? 3,
      sputum_color: existing?.sputum_color ?? 'clear',
      breathing_difficulty: existing?.breathing_difficulty ?? 2,
      fatigue_level: existing?.fatigue_level ?? 3,
      dumping_symptom: existing?.dumping_symptom ?? false,
      mood: existing?.mood ?? 3,
    })
    setQuickSaved(true)
    setTimeout(() => setQuickSaved(false), 1500)
    loadData()
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '좋은 저녁이에요'
  const daysUntil = nextApptDate
    ? Math.ceil((new Date(nextApptDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const todayArticle = expandedArticles[now.getDate() % expandedArticles.length]
  const catLabels: Record<string, string> = {
    new_drug: '신약', phage: '파지치료', clinical_trial: '임상시험',
    research: '연구', news: '뉴스', immunity: '면역력',
  }

  // ─── 서브 화면들 ───
  if (view === 'record') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <header className="bg-blue-600 text-white px-5 py-4 flex items-center gap-3">
          <button className="text-xl py-1 px-2" onClick={() => { setView('home'); loadData() }}>←</button>
          <h1 className="text-xl font-bold">오늘의 건강 기록</h1>
        </header>
        <div className="max-w-lg mx-auto p-4">
          <DailyRecordForm onSaved={loadData} />
        </div>
        <BottomTabBar activeTab={view} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }
  if (view === 'info') {
    return (
      <div className="pb-20">
        <InfoHub onBack={() => setView('home')} isPatientView />
        <BottomTabBar activeTab={view} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }
  if (view === 'appointment') {
    return (
      <div className="pb-20">
        <AppointmentManager onBack={() => { setView('home'); loadData() }} />
        <BottomTabBar activeTab={view} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }
  if (view === 'summary') {
    return (
      <div className="pb-20">
        <VisitSummary onBack={() => { setView('home'); loadData() }} />
        <BottomTabBar activeTab={'appointment'} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }
  if (view === 'backup') {
    return (
      <div className="pb-20">
        <DataBackup onBack={() => { setView('more'); loadData() }} />
        <BottomTabBar activeTab={'more'} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }
  if (view === 'more') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white px-5 pt-6 pb-6 rounded-b-[2rem]">
          <h1 className="text-2xl font-bold">더보기</h1>
          <p className="text-gray-300 text-base mt-1">설정, 도구, 정보</p>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-3 space-y-3">
          {/* 긴급 연락처 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">긴급 연락처</p>
            <EmergencyCall />
          </div>

          {/* 진료 요약 */}
          <button
            onClick={() => setView('summary')}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800 px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
          >
            <span className="text-3xl">📋</span>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">진료 요약 보기</p>
              <p className="text-sm text-gray-500">기록을 정리해서 의사에게 보여주세요</p>
            </div>
            <span className="text-gray-300 text-xl">→</span>
          </button>

          {/* 오늘의 희망 카드 */}
          <Card className="shadow-sm border-l-4 border-l-blue-500 overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="secondary" className="text-sm">{catLabels[todayArticle.category]}</Badge>
                <span className="text-sm text-gray-500">{todayArticle.published_at}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1.5">{todayArticle.title_ko}</h3>
              <p className="text-base text-gray-600 leading-relaxed">{todayArticle.summary_ko}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">희망</span>
                <Progress value={todayArticle.hope_score} className="flex-1 h-2" />
                <span className="text-sm font-bold text-blue-600">{todayArticle.hope_score}%</span>
              </div>
            </CardContent>
          </Card>

          {/* 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">설정</p>
            <FontSizeSelector />
            <ThemeSelector />
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <button
                onClick={() => setView('backup')}
                className="w-full flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 transition text-left rounded-xl px-1 py-2"
              >
                <span className="text-xl">💾</span>
                <span className="text-base font-medium text-gray-700 dark:text-gray-200 flex-1">데이터 백업</span>
                <span className="text-gray-300 text-lg">→</span>
              </button>
              {!isStandalone && (
                <button
                  onClick={() => {
                    // PWA 배너 다시 표시하도록 dismissed 삭제
                    localStorage.removeItem('pwa_install_dismissed')
                    window.location.reload()
                  }}
                  className="w-full flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 transition text-left rounded-xl px-1 py-2 mt-1"
                >
                  <span className="text-xl">📲</span>
                  <span className="text-base font-medium text-gray-700 dark:text-gray-200 flex-1">홈 화면에 추가</span>
                  <span className="text-gray-300 text-lg">→</span>
                </button>
              )}
            </div>
          </div>

          {/* 격려 메시지 */}
          {(() => {
            const messages = [
              { emoji: '💪', main: '위암 3기도 이기신 분,\n이것도 반드시 이겨내실 수 있습니다', sub: '전 세계에서 M. abscessus 치료법이 빠르게 발전하고 있습니다' },
              { emoji: '🌅', main: '오늘도 건강을 위한\n한 걸음을 내딛으셨습니다', sub: '꾸준한 기록이 치료에 큰 도움이 됩니다' },
              { emoji: '🌿', main: '면역력은 매일매일\n조금씩 좋아지고 있습니다', sub: '규칙적인 운동과 영양이 가장 좋은 약입니다' },
              { emoji: '⭐', main: '아버지의 노력을\n온 가족이 응원합니다', sub: '건강 기록을 통해 의사 선생님도 더 정확한 진료를 할 수 있습니다' },
              { emoji: '🏔️', main: '산을 오르듯\n한 발짝씩 나아가고 계십니다', sub: 'NTM 치료는 시간이 걸리지만, 포기하지 않는 것이 중요합니다' },
              { emoji: '🌻', main: '오늘 하루도\n감사하며 시작해봐요', sub: '긍정적인 마음이 면역력 향상에 도움이 됩니다' },
              { emoji: '🤝', main: '혼자가 아닙니다\n함께 이겨낼 수 있습니다', sub: '심태선 교수님과 함께하는 치료, 꼭 좋은 결과가 있을 것입니다' },
            ]
            const dayIndex = now.getDate() % messages.length
            const msg = messages[dayIndex]
            return (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl px-5 py-5 text-center border border-emerald-100">
                <p className="text-4xl mb-2">{msg.emoji}</p>
                <p className="text-lg font-semibold text-emerald-800 leading-snug whitespace-pre-line">{msg.main}</p>
                <p className="text-sm text-emerald-700 mt-1.5">{msg.sub}</p>
              </div>
            )
          })()}

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="w-full text-center text-gray-400 text-base py-3"
          >
            로그아웃
          </button>
        </div>
        <BottomTabBar activeTab={view} onTabChange={(tab) => { setView(tab); loadData() }} />
      </div>
    )
  }

  // ─── 홈 ───
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 pt-6 pb-10 rounded-b-[2rem]">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-blue-200 text-base">{now.getMonth() + 1}월 {now.getDate()}일 · {greeting}</p>
            <h1 className="text-3xl font-bold tracking-tight">{user?.name}님</h1>
          </div>
          <button className="text-white/50 text-base py-2 px-3" onClick={() => setView('more')}>더보기</button>
        </div>
        {todayRecord ? (
          <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-3xl">
              {todayRecord.overall_condition === 3 ? '😊' : todayRecord.overall_condition === 2 ? '😐' : '😔'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-white/90">오늘의 컨디션</p>
              <p className="text-sm text-blue-200">
                기침 {todayRecord.cough_level} · 가래 {todayRecord.sputum_amount} · 피로 {todayRecord.fatigue_level}
                {todayRecord.oxygen_saturation ? ` · SpO2 ${todayRecord.oxygen_saturation}%` : ''}
              </p>
            </div>
          </div>
        ) : quickSaved ? (
          <div className="bg-emerald-500/30 backdrop-blur rounded-2xl px-4 py-4 text-center">
            <p className="text-lg font-bold text-white">기록 완료!</p>
          </div>
        ) : (
          <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-4">
            <p className="text-base text-white/80 text-center mb-3">오늘 컨디션은 어떠세요?</p>
            <div className="flex justify-center gap-4">
              {[
                { value: 3, emoji: '😊', label: '좋음' },
                { value: 2, emoji: '😐', label: '보통' },
                { value: 1, emoji: '😔', label: '안좋음' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleQuickCondition(opt.value)}
                  className="flex flex-col items-center gap-1 bg-white/15 rounded-2xl px-6 py-3 active:bg-white/30 transition"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-sm font-medium text-white/90">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-5 space-y-3">
        {/* 백업 리마인더 */}
        {showBackupReminder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">💾</span>
            <div className="flex-1">
              <p className="text-base font-medium text-amber-800">데이터 백업을 해주세요</p>
              <p className="text-sm text-amber-600">소중한 건강 기록을 안전하게 보관합니다</p>
            </div>
            <button
              onClick={() => { setView('backup'); setShowBackupReminder(false) }}
              className="text-sm font-bold text-amber-700 bg-amber-200 px-3 py-1.5 rounded-xl active:bg-amber-300 flex-shrink-0"
            >
              백업
            </button>
          </div>
        )}

        {/* 어제 미기록 안내 (부드러운 톤) */}
        {yesterdayMissed && !todayRecord && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-base text-amber-800">어제 기록이 비어있어요. 지금 오늘 기록을 남겨볼까요?</p>
          </div>
        )}

        {/* 스트릭 카운터 + 기록 버튼 */}
        <div className="flex gap-3">
          {streak > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center px-5 py-3 flex-shrink-0">
              <p className="text-2xl font-bold text-blue-600">{streak}</p>
              <p className="text-xs font-medium text-gray-500">연속 기록</p>
            </div>
          )}
          <Button
            onClick={() => setView('record')}
            className="flex-1 h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg rounded-2xl transition-transform"
          >
            {todayRecord ? '기록 수정하기' : '오늘의 건강 기록하기'}
          </Button>
        </div>

        {/* 빠른 메모 */}
        <QuickMemo userId={user?.id || ''} />

        {/* 건강 지표 대시보드 (기록이 있을 때만) */}
        {todayRecord && (todayRecord.temperature || todayRecord.oxygen_saturation || todayRecord.weight) && (
          <div className="grid grid-cols-3 gap-2">
            {todayRecord.temperature && (
              <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-3 text-center ${
                todayRecord.temperature >= 37.5 ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'
              }`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">체온</p>
                <p className={`text-xl font-bold mt-0.5 ${todayRecord.temperature >= 37.5 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {todayRecord.temperature}°
                </p>
              </div>
            )}
            {todayRecord.oxygen_saturation && (
              <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-3 text-center ${
                todayRecord.oxygen_saturation < 95 ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'
              }`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">SpO2</p>
                <p className={`text-xl font-bold mt-0.5 ${todayRecord.oxygen_saturation < 95 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {todayRecord.oxygen_saturation}%
                </p>
              </div>
            )}
            {todayRecord.weight && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">체중</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{todayRecord.weight}<span className="text-sm font-normal">kg</span></p>
              </div>
            )}
          </div>
        )}

        {/* 이번 주 컨디션 (클릭 → 기록) */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">이번 주 컨디션</p>
            <WeeklyChart records={recentRecords} onTap={() => setView('record')} />
          </CardContent>
        </Card>

        {/* 약 복용 타이머 - 가장 중요해서 위로 */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <MedicationTimer />
          </CardContent>
        </Card>

        {/* 월간 기록 달력 - 접기 가능 */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <details>
              <summary className="text-base font-semibold text-gray-700 cursor-pointer select-none list-none flex items-center justify-between">
                <span>{new Date().getMonth() + 1}월 기록 달력</span>
                <span className="text-sm text-gray-400">탭하여 펼치기</span>
              </summary>
              <div className="mt-3">
                <MonthlyCalendar />
              </div>
            </details>
          </CardContent>
        </Card>

        {/* 증상 추세 차트 (3일 이상 기록 시) */}
        {recentRecords.length >= 3 && (
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <SymptomTrendChart records={getRecentDailyRecords(14)} />
            </CardContent>
          </Card>
        )}

        {/* 걸음수 + 수분 */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <StepCounter />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <WaterTracker />
            </CardContent>
          </Card>
        </div>

        {/* 운동 / 진료 */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
            onClick={() => setExerciseOpen(true)}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl leading-none">🏃</p>
              <p className="text-2xl font-bold text-gray-900 mt-1.5">{todayExerciseMinutes}<span className="text-base font-normal text-gray-500">분</span></p>
              <p className="text-sm text-gray-500 mt-0.5">탭하여 운동 기록</p>
            </CardContent>
          </Card>
          <Card
            className="shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
            onClick={() => setView('appointment')}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-3xl leading-none">🏥</p>
              {daysUntil !== null ? (
                <>
                  <p className="text-xl font-bold text-blue-600 mt-1.5">D-{daysUntil}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{nextApptHospital}</p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-orange-600 mt-1.5">일정 등록</p>
                  <p className="text-sm text-gray-500 mt-0.5">탭하여 등록</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 진료 전 체크리스트 (D-3부터 표시) */}
        {nextApptDate && (
          <VisitChecklist appointmentDate={nextApptDate} hospital={nextApptHospital} />
        )}

        {/* 오늘의 건강 팁 */}
        <WeatherHealthTip />
      </div>

      {/* 운동 바텀시트 */}
      <QuickExerciseSheet
        open={exerciseOpen}
        onClose={() => { setExerciseOpen(false); loadData() }}
        userId={user?.id || ''}
        onSaved={loadData}
      />

      {/* 로그아웃 확인 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 mx-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">나가시겠어요?</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-5">로그인 화면으로 돌아갑니다</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-14 rounded-2xl bg-gray-100 text-lg font-semibold text-gray-700 active:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={logout}
                className="flex-1 h-14 rounded-2xl bg-red-500 text-lg font-semibold text-white active:bg-red-600 transition"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭 네비게이션 */}
      <BottomTabBar activeTab={view} onTabChange={(tab) => { setView(tab); loadData() }} />

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
