'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import {
  getUpcomingAppointments,
  getPastAppointments,
  saveAppointment,
  deleteAppointment,
  getTodayString,
  type Appointment,
} from '@/lib/store'
import { visitPrepGuide } from '@/lib/ntm-knowledge'

interface AppointmentManagerProps {
  onBack?: () => void
  compact?: boolean // 컴팩트 모드 (대시보드 내장용)
}

export function AppointmentManager({ onBack, compact }: AppointmentManagerProps) {
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [past, setPast] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPrepGuide, setShowPrepGuide] = useState(false)

  // 폼 상태
  const [date, setDate] = useState('')
  const [hospital, setHospital] = useState('서울아산병원')
  const [doctor, setDoctor] = useState('심태선 교수')
  const [department, setDepartment] = useState('호흡기내과')
  const [purpose, setPurpose] = useState('정기 검진')
  const [notes, setNotes] = useState('')

  const loadData = () => {
    setUpcoming(getUpcomingAppointments())
    setPast(getPastAppointments())
  }

  useEffect(() => { loadData() }, [])

  const handleSave = () => {
    if (!user || !date) return
    saveAppointment({
      user_id: user.id,
      date,
      hospital,
      doctor,
      department,
      purpose,
      notes: notes || undefined,
      completed: false,
    })
    setShowForm(false)
    setDate('')
    setNotes('')
    loadData()
  }

  const handleComplete = (id: string) => {
    const appts = getUpcomingAppointments()
    const appt = appts.find(a => a.id === id)
    if (appt) {
      saveAppointment({ ...appt, completed: true })
      loadData()
    }
  }

  const handleDelete = (id: string) => {
    deleteAppointment(id)
    loadData()
  }

  const today = getTodayString()
  const nextAppt = upcoming[0]
  const daysUntil = nextAppt
    ? Math.ceil((new Date(nextAppt.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // 컴팩트 모드: 대시보드에 심플하게 표시
  if (compact) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="text-lg font-bold">다음 진료</span>
            </div>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                전체 보기
              </Button>
            )}
          </div>
          {nextAppt ? (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    D-{daysUntil !== null && daysUntil >= 0 ? daysUntil : '?'}
                  </p>
                  <p className="text-lg font-medium mt-1">{nextAppt.date}</p>
                  <p className="text-gray-600">{nextAppt.hospital} · {nextAppt.doctor}</p>
                  <p className="text-gray-500 text-sm">{nextAppt.purpose}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{nextAppt.department}</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">등록된 진료 일정이 없습니다</p>
              <Button
                onClick={() => onBack?.()}
                className="bg-blue-600"
              >
                진료 일정 등록
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" className="text-white text-xl p-2" onClick={onBack}>
            ← 뒤로
          </Button>
        )}
        <h1 className="text-xl font-bold">진료 일정 관리</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* D-day 카드 */}
        {nextAppt && (
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-5xl font-bold mb-2">
                D-{daysUntil !== null && daysUntil >= 0 ? daysUntil : '?'}
              </p>
              <p className="text-xl">{nextAppt.date}</p>
              <p className="text-blue-100 text-lg mt-1">{nextAppt.hospital} · {nextAppt.doctor}</p>
              <p className="text-blue-200">{nextAppt.department} · {nextAppt.purpose}</p>
              {nextAppt.notes && (
                <p className="text-blue-100 mt-2 text-sm">메모: {nextAppt.notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 진료 준비 가이드 버튼 */}
        {nextAppt && (
          <Button
            variant="outline"
            className="w-full h-14 text-lg border-blue-200"
            onClick={() => setShowPrepGuide(!showPrepGuide)}
          >
            📋 진료 준비 질문 가이드 {showPrepGuide ? '접기' : '보기'}
          </Button>
        )}

        {/* 진료 준비 질문 가이드 */}
        {showPrepGuide && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                심태선 교수님께 물어볼 질문들
              </CardTitle>
              <p className="text-sm text-gray-500">
                진료 전에 미리 준비하면 더 알찬 상담이 됩니다
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {visitPrepGuide.map((category, i) => (
                <div key={i}>
                  <p className="font-bold text-blue-700 mb-2">{category.category}</p>
                  <ul className="space-y-2">
                    {category.questions.map((q, j) => (
                      <li key={j} className="flex gap-2 text-gray-700">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span className="text-base">{q}</span>
                      </li>
                    ))}
                  </ul>
                  {i < visitPrepGuide.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 일정 추가 폼 */}
        {showForm ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">새 진료 일정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">진료 날짜</label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={today}
                  className="h-14 text-lg"
                />
              </div>
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">병원</label>
                <Input
                  value={hospital}
                  onChange={e => setHospital(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">담당의</label>
                <Input
                  value={doctor}
                  onChange={e => setDoctor(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">진료과</label>
                <Input
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">진료 목적</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['정기 검진', 'CT 촬영', '객담 검사', '혈액 검사', '상담'].map(p => (
                    <Button
                      key={p}
                      variant={purpose === p ? 'default' : 'outline'}
                      className={`text-base ${purpose === p ? 'bg-blue-600' : ''}`}
                      onClick={() => setPurpose(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-base font-medium text-gray-700 block mb-1">메모 (선택)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="추가 메모..."
                  className="w-full h-20 p-3 text-base border rounded-lg resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!date}
                  className="flex-1 h-14 text-lg bg-blue-600"
                >
                  저장
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="h-14 text-lg"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full h-14 text-lg bg-blue-600"
          >
            ➕ 새 진료 일정 추가
          </Button>
        )}

        {/* 예정된 진료 목록 */}
        {upcoming.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">예정된 진료</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map(appt => {
                const d = Math.ceil((new Date(appt.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={appt.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">D-{d >= 0 ? d : '?'}</Badge>
                        <span className="font-medium">{appt.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{appt.hospital} · {appt.doctor} · {appt.purpose}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleComplete(appt.id!)}>
                        완료
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(appt.id!)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* 지난 진료 */}
        {past.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-500">지난 진료</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {past.slice(0, 5).map(appt => (
                <div key={appt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-gray-600">{appt.date}</span>
                    <p className="text-sm text-gray-400">{appt.hospital} · {appt.purpose}</p>
                  </div>
                  <Badge variant="secondary">완료</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
