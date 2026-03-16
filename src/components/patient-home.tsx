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
        className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold text-gray-900 mb-4">오늘의 운동</h2>

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
]

function BottomTabBar({ activeTab, onTabChange }: { activeTab: ViewType; onTabChange: (tab: ViewType) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex">
        {TAB_ITEMS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors select-none ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          >
            <span className="text-2xl leading-none">{tab.icon}</span>
            <span className={`text-xs font-medium ${activeTab === tab.id ? 'font-bold' : ''}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// ─── 메인 ──────────────────────────────
type ViewType = 'home' | 'record' | 'info' | 'appointment'

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

  // 빠른 컨디션 입력 (홈에서 바로 3초 기록)
  const handleQuickCondition = (condition: number) => {
    if (!user) return
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
      <div className="min-h-screen bg-gray-50 pb-24">
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

  // ─── 홈 ───
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 pt-6 pb-10 rounded-b-[2rem]">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-blue-200 text-base">{now.getMonth() + 1}월 {now.getDate()}일 · {greeting}</p>
            <h1 className="text-3xl font-bold tracking-tight">{user?.name}님</h1>
          </div>
          <button className="text-white/50 text-base py-2 px-3" onClick={handleLogout}>나가기</button>
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
        {/* 어제 미기록 안내 (부드러운 톤) */}
        {yesterdayMissed && !todayRecord && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-base text-amber-800">어제 기록이 비어있어요. 지금 오늘 기록을 남겨볼까요?</p>
          </div>
        )}

        {/* 스트릭 카운터 + 기록 버튼 */}
        <div className="flex gap-3">
          {streak > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center px-5 py-3 flex-shrink-0">
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

        {/* 이번 주 컨디션 (클릭 → 기록) */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-base font-semibold text-gray-700 mb-3">이번 주 컨디션</p>
            <WeeklyChart records={recentRecords} onTap={() => setView('record')} />
          </CardContent>
        </Card>

        {/* 월간 기록 달력 */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <MonthlyCalendar />
          </CardContent>
        </Card>

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

        {/* 격려 메시지 */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl px-5 py-5 text-center border border-emerald-100">
          <p className="text-4xl mb-2">💪</p>
          <p className="text-lg font-semibold text-emerald-800 leading-snug">
            위암 3기도 이기신 분,<br />이것도 반드시 이겨내실 수 있습니다
          </p>
          <p className="text-sm text-emerald-700 mt-1.5">
            전 세계에서 M. abscessus 치료법이 빠르게 발전하고 있습니다
          </p>
        </div>
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
          <div className="relative bg-white rounded-3xl p-6 mx-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">나가시겠어요?</h3>
            <p className="text-base text-gray-500 text-center mb-5">로그인 화면으로 돌아갑니다</p>
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
