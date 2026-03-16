'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import {
  getRecentDailyRecords,
  getDailyRecordByDate,
  getMealsByDate,
  getExercisesByDate,
  getSupplementsByDate,
  getMedicalRecords,
  getTodayString,
} from '@/lib/store'
import { AppointmentManager } from '@/components/appointment-manager'
import { InfoHub } from '@/components/info-hub'
import { getUpcomingAppointments } from '@/lib/store'
import type { DailyRecord } from '@/types/database'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts'

// 관리자용 약 복용 현황 (읽기 전용)
function MedicationStatus() {
  const todayKey = `med_taken_${new Date().toISOString().split('T')[0]}`
  let meds: { id: string; label: string; hour: number; minute: number; taken: boolean; takenAt?: string }[] = []
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(todayKey) : null
    if (saved) meds = JSON.parse(saved)
  } catch { /* ignore */ }

  if (meds.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-2">아직 약 복용 기록이 없습니다</p>
  }

  const takenCount = meds.filter(m => m.taken).length
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${takenCount === meds.length ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${(takenCount / meds.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-700">{takenCount}/{meds.length}</span>
      </div>
      {meds.map(med => (
        <div key={med.id} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className={med.taken ? 'text-emerald-500' : 'text-gray-300'}>{med.taken ? '✓' : '○'}</span>
            <span className={med.taken ? 'text-gray-700' : 'text-gray-400'}>{med.label}</span>
          </span>
          <span className="text-gray-400">
            {med.taken && med.takenAt ? med.takenAt : `${String(med.hour).padStart(2, '0')}:${String(med.minute).padStart(2, '0')}`}
          </span>
        </div>
      ))}
    </div>
  )
}

type ViewType = 'dashboard' | 'trends' | 'timeline' | 'articles' | 'appointments' | 'info'

function AlertBanner({ records }: { records: DailyRecord[] }) {
  const alerts: string[] = []
  const today = getTodayString()
  const todayRecord = records.find(r => r.date === today)

  if (!todayRecord) {
    alerts.push('오늘 아버지의 건강 기록이 아직 없습니다')
  } else {
    if (todayRecord.cough_level >= 7) alerts.push(`기침 수준이 높습니다 (${todayRecord.cough_level}/10)`)
    if (todayRecord.breathing_difficulty >= 7) alerts.push(`호흡곤란 수준이 높습니다 (${todayRecord.breathing_difficulty}/10)`)
    if (todayRecord.sputum_color === 'bloody') alerts.push('가래에 피가 섞여 있습니다')
    if (todayRecord.temperature && todayRecord.temperature >= 37.5) alerts.push(`체온이 높습니다 (${todayRecord.temperature}°C)`)
    if (todayRecord.overall_condition === 1) alerts.push('오늘 컨디션이 안 좋습니다')
  }

  // 체중 변화 감지 (최근 7일)
  const recentWithWeight = records.filter(r => r.weight).slice(-7)
  if (recentWithWeight.length >= 2) {
    const first = recentWithWeight[0].weight!
    const last = recentWithWeight[recentWithWeight.length - 1].weight!
    const diff = last - first
    if (diff < -2) alerts.push(`최근 체중 ${Math.abs(diff).toFixed(1)}kg 감소 주의`)
  }

  if (alerts.length === 0) return null

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-red-800 mb-1">주의 알림</p>
            {alerts.map((alert, i) => (
              <p key={i} className="text-red-700">• {alert}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CaregiverHome() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<ViewType>('dashboard')
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [period, setPeriod] = useState<7 | 14 | 30>(7)

  useEffect(() => {
    setRecords(getRecentDailyRecords(period))
  }, [period])

  const today = getTodayString()
  const todayRecord = getDailyRecordByDate(today)
  const todayMeals = getMealsByDate(today)
  const todayExercises = getExercisesByDate(today)
  const todaySupplements = getSupplementsByDate(today)
  const medicalRecords = getMedicalRecords()

  // 차트 데이터
  const chartData = useMemo(() => {
    return records.map(r => ({
      date: r.date.slice(5), // MM-DD
      기침: r.cough_level,
      가래: r.sputum_amount,
      호흡곤란: r.breathing_difficulty,
      피로: r.fatigue_level,
      컨디션: r.overall_condition * 3.3,
      체중: r.weight || null,
    }))
  }, [records])

  const exerciseChartData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const exs = getExercisesByDate(dateStr)
      return {
        date: dateStr.slice(5),
        분: exs.reduce((sum, e) => sum + e.duration_minutes, 0),
      }
    })
    return last7
  }, [])

  // 치료 타임라인
  const treatmentTimeline = [
    { date: '2009', event: '위암 3기 절제술', type: 'surgery', detail: '수술 후 완치 판정' },
    { date: '2022.12', event: 'NTM 치료 시작', type: 'treatment', detail: '지스로맥스 + 라프렌 + 아미카신 주사 (주3회)' },
    { date: '2023.02', event: '주사 빈도 변경', type: 'treatment', detail: '아미카신 주사 주2회로 변경' },
    { date: '2024.02', event: '치료 중단', type: 'stop', detail: '멸균 실패, 내성 우려로 약물 치료 중단' },
    { date: '2024.02~', event: '면역력 강화 집중', type: 'current', detail: '6개월마다 아산병원 검진, 운동/영양 관리' },
  ]

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">관리자 대시보드</h1>
            <p className="text-indigo-200">{user?.name}님</p>
          </div>
          <button className="text-white/50 text-base py-2 px-3" onClick={() => setShowLogoutConfirm(true)}>
            나가기
          </button>
        </div>
      </div>

      {/* 상단 탭 네비게이션 */}
      <div className="flex overflow-x-auto border-b bg-white sticky top-0 z-10">
        {([
          { id: 'dashboard' as const, label: '현황' },
          { id: 'trends' as const, label: '트렌드' },
          { id: 'timeline' as const, label: '타임라인' },
          { id: 'appointments' as const, label: '진료일정' },
          { id: 'info' as const, label: '치료정보' },
        ]).map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex-shrink-0 rounded-none h-12 px-4 ${view === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* 대시보드 뷰 */}
        {view === 'dashboard' && (
          <>
            <AlertBanner records={records} />

            {/* 오늘의 상태 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>오늘의 상태</span>
                  <span className="text-sm text-gray-400">{today}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayRecord ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-500">컨디션</p>
                        <p className="text-3xl">{todayRecord.overall_condition === 3 ? '😊' : todayRecord.overall_condition === 2 ? '😐' : '😔'}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-500">기분</p>
                        <p className="text-3xl">{['😢', '😔', '😐', '🙂', '😊'][todayRecord.mood - 1]}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">기침</p>
                        <p className={`text-lg font-bold ${todayRecord.cough_level >= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                          {todayRecord.cough_level}/10
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">가래</p>
                        <p className={`text-lg font-bold ${todayRecord.sputum_amount >= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                          {todayRecord.sputum_amount}/10
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">호흡곤란</p>
                        <p className={`text-lg font-bold ${todayRecord.breathing_difficulty >= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                          {todayRecord.breathing_difficulty}/10
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">피로</p>
                        <p className={`text-lg font-bold ${todayRecord.fatigue_level >= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                          {todayRecord.fatigue_level}/10
                        </p>
                      </div>
                    </div>
                    {todayRecord.temperature && (
                      <p className="text-sm text-gray-600">체온: {todayRecord.temperature}°C</p>
                    )}
                    {todayRecord.weight && (
                      <p className="text-sm text-gray-600">체중: {todayRecord.weight}kg</p>
                    )}
                    {todayRecord.dumping_symptom && (
                      <Badge variant="destructive">덤핑증상 있음</Badge>
                    )}
                    {todayRecord.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">메모:</p>
                        <p className="text-gray-800">{todayRecord.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-3xl mb-2">📋</p>
                    <p>오늘 아직 기록이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 오늘의 식단 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>오늘의 식단</CardTitle>
              </CardHeader>
              <CardContent>
                {todayMeals.length > 0 ? (
                  <div className="space-y-2">
                    {todayMeals.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <Badge variant="outline">
                          {m.meal_type === 'breakfast' ? '아침' :
                           m.meal_type === 'lunch' ? '점심' :
                           m.meal_type === 'dinner' ? '저녁' : '간식'}
                        </Badge>
                        <span>{m.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">식단 기록 없음</p>
                )}
              </CardContent>
            </Card>

            {/* 약 복용 현황 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span>💊</span>
                  <span>오늘 약 복용</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MedicationStatus />
              </CardContent>
            </Card>

            {/* 운동 & 보충제 */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">운동</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayExercises.length > 0 ? (
                    <div className="space-y-1">
                      {todayExercises.map((e, i) => (
                        <p key={i} className="text-sm">{e.exercise_type} {e.duration_minutes}분</p>
                      ))}
                      <p className="text-sm font-bold text-blue-600 mt-2">
                        총 {todayExercises.reduce((s, e) => s + e.duration_minutes, 0)}분
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">기록 없음</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">보충제</CardTitle>
                </CardHeader>
                <CardContent>
                  {todaySupplements.length > 0 ? (
                    <div className="space-y-1">
                      {todaySupplements.map((s, i) => (
                        <p key={i} className="text-sm">
                          {s.taken ? '✅' : '❌'} {s.supplement_name}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">기록 없음</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 진료 일정 미니카드 */}
            <AppointmentManager compact onBack={() => setView('appointments')} />
          </>
        )}

        {/* 진료일정 뷰 */}
        {view === 'appointments' && (
          <AppointmentManager onBack={() => setView('dashboard')} />
        )}

        {/* 치료정보 뷰 */}
        {view === 'info' && (
          <InfoHub onBack={() => setView('dashboard')} isPatientView={false} />
        )}

        {/* 트렌드 뷰 */}
        {view === 'trends' && (
          <>
            {/* 기간 선택 */}
            <div className="flex gap-2">
              {([7, 14, 30] as const).map(p => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  className={`flex-1 ${period === p ? 'bg-indigo-600' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}일
                </Button>
              ))}
            </div>

            {/* 증상 트렌드 차트 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>증상 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={[0, 10]} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="기침" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="가래" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="호흡곤란" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="피로" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-8">데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* 체중 트렌드 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>체중 변화</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.filter(d => d.체중).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData.filter(d => d.체중)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="체중" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-8">체중 데이터가 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* 운동량 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>주간 운동량</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={exerciseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="분" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* 타임라인 뷰 */}
        {view === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>치료 타임라인</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                {treatmentTimeline.map((item, i) => (
                  <div key={i} className="relative pl-10 pb-8 last:pb-0">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      item.type === 'current' ? 'bg-blue-600 border-blue-600 animate-pulse' :
                      item.type === 'surgery' ? 'bg-red-500 border-red-500' :
                      item.type === 'stop' ? 'bg-orange-500 border-orange-500' :
                      'bg-green-500 border-green-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{item.date}</span>
                        <Badge variant={
                          item.type === 'current' ? 'default' :
                          item.type === 'surgery' ? 'destructive' :
                          item.type === 'stop' ? 'secondary' : 'outline'
                        }>
                          {item.event}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* 검사 기록 */}
              <h3 className="font-bold text-gray-800 mb-3">검사 기록</h3>
              {medicalRecords.length > 0 ? (
                <div className="space-y-3">
                  {medicalRecords.sort((a, b) => b.date.localeCompare(a.date)).map((mr, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{mr.date}</span>
                        <span className="text-sm text-gray-500">{mr.hospital}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {mr.exam_types.map(et => (
                          <Badge key={et} variant="outline" className="text-xs">{et}</Badge>
                        ))}
                      </div>
                      {mr.results_summary && <p className="text-sm text-gray-600">{mr.results_summary}</p>}
                      {mr.doctor_notes && <p className="text-sm text-gray-500 italic">"{mr.doctor_notes}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">검사 기록을 추가해주세요</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 최신 정보 뷰 - InfoHub로 대체됨 (info 탭 참조) */}
      </div>

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
    </div>
  )
}
