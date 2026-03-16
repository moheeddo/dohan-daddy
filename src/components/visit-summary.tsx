'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getRecentDailyRecords,
  getExercisesByDate,
  getSupplementsByDate,
  getTodayString,
} from '@/lib/store'

interface VisitSummaryProps {
  onBack: () => void
}

export function VisitSummary({ onBack }: VisitSummaryProps) {
  const [period] = useState(30)
  const records = getRecentDailyRecords(period)
  const today = getTodayString()

  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <header className="bg-blue-600 text-white px-5 py-4 flex items-center gap-3">
          <button className="text-xl py-1 px-2" onClick={onBack}>←</button>
          <h1 className="text-xl font-bold">진료 요약</h1>
        </header>
        <div className="p-8 text-center">
          <p className="text-6xl mb-4">📋</p>
          <p className="text-xl text-gray-600">아직 기록된 데이터가 없습니다</p>
          <p className="text-base text-gray-400 mt-2">건강 기록을 시작하면 진료 요약이 생성됩니다</p>
        </div>
      </div>
    )
  }

  // 기간 계산
  const firstDate = records[0].date
  const lastDate = records[records.length - 1].date
  const totalDays = Math.ceil(
    (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  // 평균 계산
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0
  const avgCough = avg(records.map(r => r.cough_level))
  const avgSputum = avg(records.map(r => r.sputum_amount))
  const avgBreathing = avg(records.map(r => r.breathing_difficulty))
  const avgFatigue = avg(records.map(r => r.fatigue_level))
  const avgCondition = avg(records.map(r => r.overall_condition))

  // 체중 변화
  const withWeight = records.filter(r => r.weight)
  const weightFirst = withWeight.length > 0 ? withWeight[0].weight! : null
  const weightLast = withWeight.length > 0 ? withWeight[withWeight.length - 1].weight! : null
  const weightChange = weightFirst && weightLast ? (weightLast - weightFirst) : null

  // 체온 이상
  const highTemp = records.filter(r => r.temperature && r.temperature >= 37.5)

  // 가래 색 통계
  const sputumColorCounts: Record<string, number> = {}
  records.forEach(r => {
    sputumColorCounts[r.sputum_color] = (sputumColorCounts[r.sputum_color] || 0) + 1
  })
  const sputumColorLabels: Record<string, string> = {
    clear: '투명', white: '흰색', yellow: '노란색', green: '녹색', bloody: '피섞임'
  }
  const bloodySputumDays = sputumColorCounts['bloody'] || 0

  // 덤핑 증상
  const dumpingDays = records.filter(r => r.dumping_symptom).length

  // 운동 통계
  let totalExerciseMinutes = 0
  let exerciseDays = 0
  records.forEach(r => {
    const exs = getExercisesByDate(r.date)
    const mins = exs.reduce((s, e) => s + e.duration_minutes, 0)
    if (mins > 0) {
      exerciseDays++
      totalExerciseMinutes += mins
    }
  })

  // 보충제 복용률
  const latestSupp = getSupplementsByDate(today)
  const suppNames = ['비타민D', '아연', '유산균', '오메가3']

  // 컨디션 분포
  const condGood = records.filter(r => r.overall_condition === 3).length
  const condOk = records.filter(r => r.overall_condition === 2).length
  const condBad = records.filter(r => r.overall_condition === 1).length

  // 주의 사항
  const warnings: string[] = []
  if (bloodySputumDays > 0) warnings.push(`혈담 ${bloodySputumDays}일 발생`)
  if (weightChange !== null && weightChange < -2) warnings.push(`체중 ${Math.abs(weightChange).toFixed(1)}kg 감소`)
  if (highTemp.length > 0) warnings.push(`37.5°C 이상 ${highTemp.length}회`)
  if (avgBreathing >= 5) warnings.push(`평균 호흡곤란 ${avgBreathing}/10`)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-blue-600 text-white px-5 py-4 flex items-center gap-3">
        <button className="text-xl py-1 px-2" onClick={onBack}>←</button>
        <h1 className="text-xl font-bold">진료 요약</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* 환자 정보 */}
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-500">서울아산병원 심태선 교수님 진료용</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">건강 기록 요약</h2>
              <p className="text-base text-gray-500 mt-1">
                {firstDate} ~ {lastDate} ({records.length}일 기록 / {totalDays}일)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 주의사항 */}
        {warnings.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-800">주의 사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-base text-red-700 flex items-center gap-2">
                    <span className="text-red-500">●</span> {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 컨디션 요약 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">전반적 컨디션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-3xl">😊</p>
                <p className="text-xl font-bold text-emerald-600">{condGood}일</p>
                <p className="text-sm text-gray-500">좋음</p>
              </div>
              <div>
                <p className="text-3xl">😐</p>
                <p className="text-xl font-bold text-amber-600">{condOk}일</p>
                <p className="text-sm text-gray-500">보통</p>
              </div>
              <div>
                <p className="text-3xl">😔</p>
                <p className="text-xl font-bold text-rose-600">{condBad}일</p>
                <p className="text-sm text-gray-500">안좋음</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 증상 평균 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">증상 평균 (기간 내)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: '기침', value: avgCough, color: 'bg-blue-500' },
              { label: '가래', value: avgSputum, color: 'bg-teal-500' },
              { label: '호흡곤란', value: avgBreathing, color: 'bg-orange-500' },
              { label: '피로', value: avgFatigue, color: 'bg-purple-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-base font-medium text-gray-700 w-16">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value * 10}%` }} />
                </div>
                <span className="text-base font-bold text-gray-700 w-12 text-right">{item.value}/10</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 가래 색 분포 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">가래 색 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sputumColorCounts).sort((a, b) => b[1] - a[1]).map(([color, count]) => (
                <span
                  key={color}
                  className={`px-3 py-1.5 rounded-full text-base font-medium ${
                    color === 'bloody' ? 'bg-red-100 text-red-700' :
                    color === 'green' ? 'bg-green-100 text-green-700' :
                    color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {sputumColorLabels[color]} {count}일
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 체중 변화 */}
        {weightFirst && weightLast && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">체중 변화</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-gray-500">시작</p>
                  <p className="text-xl font-bold">{weightFirst}kg</p>
                </div>
                <div className="text-2xl text-gray-300">→</div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">최근</p>
                  <p className="text-xl font-bold">{weightLast}kg</p>
                </div>
                <div className={`text-center px-3 py-1 rounded-xl ${
                  weightChange! > 0 ? 'bg-emerald-100 text-emerald-700' :
                  weightChange! < -1 ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <p className="text-lg font-bold">
                    {weightChange! > 0 ? '+' : ''}{weightChange!.toFixed(1)}kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 덤핑 증상 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">위절제 관련</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-gray-700">
              덤핑 증상 발생: <span className="font-bold">{dumpingDays}일</span> / {records.length}일
              {dumpingDays > 0 && <span className="text-orange-600 ml-1">({Math.round(dumpingDays / records.length * 100)}%)</span>}
            </p>
          </CardContent>
        </Card>

        {/* 운동 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">운동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{exerciseDays}</p>
                <p className="text-sm text-gray-500">운동한 날</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalExerciseMinutes}</p>
                <p className="text-sm text-gray-500">총 운동(분)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 고온 기록 */}
        {highTemp.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-700">발열 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {highTemp.map(r => (
                  <p key={r.date} className="text-base text-gray-700">
                    {r.date}: <span className="font-bold text-orange-600">{r.temperature}°C</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 안내 */}
        <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-200">
          <p className="text-sm text-blue-700">
            이 화면을 진료 시 의사에게 보여주세요
          </p>
          <p className="text-xs text-blue-500 mt-1">
            데이터는 환자가 직접 기록한 주관적 수치입니다
          </p>
        </div>
      </div>
    </div>
  )
}
