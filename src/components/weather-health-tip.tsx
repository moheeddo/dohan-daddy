'use client'

import { useState, useEffect } from 'react'

interface HealthTip {
  emoji: string
  title: string
  tip: string
  color: string
}

// 계절/시간 기반 NTM 환자 맞춤 건강 팁
function getSeasonalTips(): HealthTip[] {
  const month = new Date().getMonth() + 1
  const hour = new Date().getHours()
  const tips: HealthTip[] = []

  // 계절 기반
  if (month >= 3 && month <= 5) {
    // 봄
    tips.push(
      { emoji: '🌸', title: '봄철 황사 주의', tip: '황사/미세먼지 시 외출을 삼가고, 외출 시 KF94 마스크를 착용하세요', color: 'bg-amber-50 border-amber-200' },
      { emoji: '💧', title: '건조한 봄', tip: '실내 습도 50-60%를 유지하면 기관지 건강에 좋습니다', color: 'bg-blue-50 border-blue-200' },
    )
  } else if (month >= 6 && month <= 8) {
    // 여름
    tips.push(
      { emoji: '🌡️', title: '여름철 체온 관리', tip: '더운 날에는 시원한 실내에서 운동하세요. 탈수에 주의하세요', color: 'bg-red-50 border-red-200' },
      { emoji: '💦', title: '수분 섭취', tip: '하루 1.5L 이상 물을 마시면 가래 배출에 도움이 됩니다', color: 'bg-cyan-50 border-cyan-200' },
      { emoji: '🦠', title: '습한 환경 주의', tip: '장마철 곰팡이는 NTM에 좋지 않아요. 환기를 자주 해주세요', color: 'bg-amber-50 border-amber-200' },
    )
  } else if (month >= 9 && month <= 11) {
    // 가을
    tips.push(
      { emoji: '🍂', title: '환절기 건강 관리', tip: '일교차가 크니 따뜻한 옷을 겹쳐 입으세요', color: 'bg-orange-50 border-orange-200' },
      { emoji: '💉', title: '독감 예방', tip: '면역이 약한 분은 독감 예방접종을 꼭 맞으세요', color: 'bg-purple-50 border-purple-200' },
    )
  } else {
    // 겨울
    tips.push(
      { emoji: '🧣', title: '겨울철 호흡기 관리', tip: '찬 공기에 직접 노출을 피하고 마스크를 착용하세요', color: 'bg-blue-50 border-blue-200' },
      { emoji: '🏠', title: '실내 운동 권장', tip: '추운 날에는 실내에서 스트레칭과 호흡운동을 해주세요', color: 'bg-emerald-50 border-emerald-200' },
      { emoji: '💧', title: '가습기 사용', tip: '난방으로 건조해지면 기관지에 안 좋아요. 습도를 관리하세요', color: 'bg-cyan-50 border-cyan-200' },
    )
  }

  // 시간 기반
  if (hour >= 6 && hour < 10) {
    tips.push({ emoji: '🌅', title: '아침 운동', tip: '아침에 가벼운 산책을 하면 폐 기능 향상에 도움됩니다', color: 'bg-amber-50 border-amber-200' })
  } else if (hour >= 21) {
    tips.push({ emoji: '🌙', title: '숙면 준비', tip: '잠들기 1시간 전 스마트폰을 내려놓으면 수면의 질이 좋아집니다', color: 'bg-indigo-50 border-indigo-200' })
  }

  // 항상 표시
  tips.push(
    { emoji: '🥦', title: '면역력 식품', tip: '브로콜리, 시금치, 견과류는 면역력 강화에 좋습니다', color: 'bg-green-50 border-green-200' },
    { emoji: '🫁', title: '호흡 운동', tip: '복식호흡을 하루 3회, 10분씩 하면 폐활량이 늘어납니다', color: 'bg-blue-50 border-blue-200' },
  )

  return tips
}

export function WeatherHealthTip() {
  const [tip, setTip] = useState<HealthTip | null>(null)

  useEffect(() => {
    const tips = getSeasonalTips()
    // 날짜+시간으로 다양한 팁 표시
    const now = new Date()
    const idx = (now.getDate() * 3 + now.getHours()) % tips.length
    setTip(tips[idx])
  }, [])

  if (!tip) return null

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${tip.color}`}>
      <span className="text-2xl flex-shrink-0 mt-0.5">{tip.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-gray-800">{tip.title}</p>
        <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{tip.tip}</p>
      </div>
    </div>
  )
}
