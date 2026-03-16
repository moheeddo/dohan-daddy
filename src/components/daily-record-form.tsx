'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { getDailyRecordByDate, saveDailyRecord, getMealsByDate, saveMeal, getExercisesByDate, saveExercise, deleteExercise, getSupplementsByDate, saveSupplement, getTodayString, getRecordStreak } from '@/lib/store'
import { haptic } from '@/lib/haptic'
import type { DailyRecord, SputumColor, MealType, ExerciseType } from '@/types/database'

const SPUTUM_COLORS: { value: SputumColor; label: string; color: string }[] = [
  { value: 'clear', label: '투명', color: 'bg-gray-100 border-gray-300' },
  { value: 'white', label: '흰색', color: 'bg-white border-gray-300' },
  { value: 'yellow', label: '노란색', color: 'bg-yellow-200 border-yellow-400' },
  { value: 'green', label: '녹색', color: 'bg-green-200 border-green-400' },
  { value: 'bloody', label: '피섞임', color: 'bg-red-200 border-red-400' },
]

const CONDITION_OPTIONS = [
  { value: 3, emoji: '😊', label: '좋음' },
  { value: 2, emoji: '😐', label: '보통' },
  { value: 1, emoji: '😔', label: '안좋음' },
]

const MOOD_OPTIONS = [
  { value: 5, emoji: '😊' },
  { value: 4, emoji: '🙂' },
  { value: 3, emoji: '😐' },
  { value: 2, emoji: '😔' },
  { value: 1, emoji: '😢' },
]

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '아침' },
  { value: 'lunch', label: '점심' },
  { value: 'dinner', label: '저녁' },
  { value: 'snack', label: '간식' },
]

const EXERCISE_TYPES: { value: ExerciseType; label: string; emoji: string }[] = [
  { value: 'walking', label: '걷기', emoji: '🚶' },
  { value: 'breathing', label: '호흡운동', emoji: '🌬️' },
  { value: 'stretching', label: '스트레칭', emoji: '🧘' },
  { value: 'other', label: '기타', emoji: '💪' },
]

const DEFAULT_SUPPLEMENTS = ['비타민D', '아연', '유산균', '오메가3']

// base-ui Slider onValueChange는 number | number[] 를 반환
const sliderChange = (setter: (v: number) => void) => (val: number | readonly number[]) => {
  setter(Array.isArray(val) ? val[0] : val as number)
}

interface DailyRecordFormProps {
  onSaved?: () => void
}

export function DailyRecordForm({ onSaved }: DailyRecordFormProps) {
  const { user } = useAuth()
  const today = getTodayString()

  // 증상/컨디션
  const [condition, setCondition] = useState(2)
  const [coughLevel, setCoughLevel] = useState(3)
  const [sputumAmount, setSputumAmount] = useState(3)
  const [sputumColor, setSputumColor] = useState<SputumColor>('clear')
  const [breathingDifficulty, setBreathingDifficulty] = useState(2)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [temperature, setTemperature] = useState('')
  const [weight, setWeight] = useState('')
  const [dumpingSymptom, setDumpingSymptom] = useState(false)
  const [mood, setMood] = useState(3)
  const [notes, setNotes] = useState('')

  // 식단
  const [meals, setMeals] = useState<Record<MealType, string>>({
    breakfast: '', lunch: '', dinner: '', snack: ''
  })

  // 운동
  const [exercises, setExercises] = useState<{ type: ExerciseType; duration: number }[]>([])
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('walking')
  const [newExerciseDuration, setNewExerciseDuration] = useState('30')

  // 영양보충제
  const [supplements, setSupplements] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_SUPPLEMENTS.map(s => [s, false]))
  )

  const [activeTab, setActiveTab] = useState<'condition' | 'meal' | 'exercise'>('condition')
  const [saved, setSaved] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // 기존 데이터 로드
  useEffect(() => {
    const existing = getDailyRecordByDate(today)
    if (existing) {
      setCondition(existing.overall_condition)
      setCoughLevel(existing.cough_level)
      setSputumAmount(existing.sputum_amount)
      setSputumColor(existing.sputum_color)
      setBreathingDifficulty(existing.breathing_difficulty)
      setFatigueLevel(existing.fatigue_level)
      if (existing.temperature) setTemperature(String(existing.temperature))
      if (existing.weight) setWeight(String(existing.weight))
      setDumpingSymptom(existing.dumping_symptom)
      setMood(existing.mood)
      if (existing.notes) setNotes(existing.notes)
    }

    const existingMeals = getMealsByDate(today)
    const mealMap: Record<MealType, string> = { breakfast: '', lunch: '', dinner: '', snack: '' }
    existingMeals.forEach(m => { mealMap[m.meal_type] = m.description })
    setMeals(mealMap)

    const existingExercises = getExercisesByDate(today)
    setExercises(existingExercises.map(e => ({ type: e.exercise_type, duration: e.duration_minutes })))

    const existingSupplements = getSupplementsByDate(today)
    const suppMap = Object.fromEntries(DEFAULT_SUPPLEMENTS.map(s => [s, false]))
    existingSupplements.forEach(s => { suppMap[s.supplement_name] = s.taken })
    setSupplements(suppMap)
  }, [today])

  const handleSave = () => {
    if (!user) return

    // 일일 기록 저장
    const record: DailyRecord = {
      user_id: user.id,
      date: today,
      overall_condition: condition,
      cough_level: coughLevel,
      sputum_amount: sputumAmount,
      sputum_color: sputumColor,
      breathing_difficulty: breathingDifficulty,
      fatigue_level: fatigueLevel,
      temperature: temperature ? parseFloat(temperature) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      dumping_symptom: dumpingSymptom,
      mood,
      notes: notes || undefined,
    }
    saveDailyRecord(record)

    // 식단 저장
    Object.entries(meals).forEach(([type, desc]) => {
      if (desc) {
        saveMeal({ user_id: user.id, date: today, meal_type: type as MealType, description: desc })
      }
    })

    // 운동 저장 (기존 것 삭제 후 재저장)
    const existingExercises = getExercisesByDate(today)
    existingExercises.forEach(e => { if (e.id) deleteExercise(e.id) })
    exercises.forEach(ex => {
      saveExercise({ user_id: user.id, date: today, exercise_type: ex.type, duration_minutes: ex.duration })
    })

    // 영양보충제 저장
    Object.entries(supplements).forEach(([name, taken]) => {
      saveSupplement({ user_id: user.id, date: today, supplement_name: name, taken })
    })

    haptic('success')
    setSaved(true)
    setShowCelebration(true)
    setTimeout(() => {
      setSaved(false)
      setShowCelebration(false)
    }, 2500)
    onSaved?.()
  }

  const addExercise = () => {
    const duration = parseInt(newExerciseDuration)
    if (duration > 0) {
      setExercises([...exercises, { type: newExerciseType, duration }])
      setNewExerciseDuration('30')
    }
  }

  // 시니어 친화적 슬라이더: +/- 버튼 포함
  const SliderWithButtons = ({ label, value, setValue, max = 10, minLabel = '없음', maxLabel = '심함' }: {
    label: string; value: number; setValue: (v: number) => void; max?: number; minLabel?: string; maxLabel?: string
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium text-gray-700">{label}</span>
        <span className="text-lg font-bold text-blue-600">{value}/{max}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setValue(Math.max(0, value - 1))}
          className="w-12 h-12 rounded-xl bg-gray-100 text-xl font-bold text-gray-600 active:bg-gray-200 flex items-center justify-center flex-shrink-0 select-none"
        >
          −
        </button>
        <div className="flex-1">
          <Slider value={[value]} onValueChange={sliderChange(setValue)} max={max} step={1} />
        </div>
        <button
          onClick={() => setValue(Math.min(max, value + 1))}
          className="w-12 h-12 rounded-xl bg-gray-100 text-xl font-bold text-gray-600 active:bg-gray-200 flex items-center justify-center flex-shrink-0 select-none"
        >
          +
        </button>
      </div>
      <div className="flex justify-between px-14">
        <span className="text-sm text-gray-400">{minLabel}</span>
        <span className="text-sm text-gray-400">{maxLabel}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2">
        {[
          { id: 'condition' as const, label: '증상', emoji: '🩺' },
          { id: 'meal' as const, label: '식단', emoji: '🍚' },
          { id: 'exercise' as const, label: '운동', emoji: '🏃' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            className={`flex-1 h-14 text-lg ${activeTab === tab.id ? 'bg-blue-600' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.emoji} {tab.label}
          </Button>
        ))}
      </div>

      {/* 증상/컨디션 탭 */}
      {activeTab === 'condition' && (
        <div className="space-y-4">
          {/* 오늘의 컨디션 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">오늘의 컨디션은요?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 justify-center">
                {CONDITION_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={condition === opt.value ? 'default' : 'outline'}
                    className={`flex-1 h-20 text-2xl flex-col gap-1 ${
                      condition === opt.value ? 'bg-blue-600 ring-2 ring-blue-300' : ''
                    }`}
                    onClick={() => setCondition(opt.value)}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-base">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 증상 슬라이더 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">증상 체크</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderWithButtons label="기침 정도" value={coughLevel} setValue={setCoughLevel} />
              <SliderWithButtons label="가래 양" value={sputumAmount} setValue={setSputumAmount} minLabel="없음" maxLabel="많음" />

              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">가래 색</p>
                <div className="flex flex-wrap gap-2">
                  {SPUTUM_COLORS.map(sc => (
                    <Button
                      key={sc.value}
                      variant={sputumColor === sc.value ? 'default' : 'outline'}
                      className={`h-14 px-5 text-base ${
                        sputumColor === sc.value ? 'bg-blue-600' : sc.color
                      }`}
                      onClick={() => setSputumColor(sc.value)}
                    >
                      {sc.label}
                    </Button>
                  ))}
                </div>
              </div>

              <SliderWithButtons label="호흡 곤란" value={breathingDifficulty} setValue={setBreathingDifficulty} />
              <SliderWithButtons label="피로도" value={fatigueLevel} setValue={setFatigueLevel} />
            </CardContent>
          </Card>

          {/* 체온/체중/덤핑 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">기본 측정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-lg font-medium text-gray-700 block mb-1">체온</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={temperature}
                      onChange={e => setTemperature(e.target.value)}
                      className="h-14 text-xl text-center"
                    />
                    <span className="text-lg text-gray-500">°C</span>
                  </div>
                </div>
                <div>
                  <label className="text-lg font-medium text-gray-700 block mb-1">체중</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="65.0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="h-14 text-xl text-center"
                    />
                    <span className="text-lg text-gray-500">kg</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">덤핑증상</p>
                <div className="flex gap-3">
                  <Button
                    variant={!dumpingSymptom ? 'default' : 'outline'}
                    className={`flex-1 h-14 text-lg ${!dumpingSymptom ? 'bg-green-600' : ''}`}
                    onClick={() => setDumpingSymptom(false)}
                  >
                    없었다
                  </Button>
                  <Button
                    variant={dumpingSymptom ? 'default' : 'outline'}
                    className={`flex-1 h-14 text-lg ${dumpingSymptom ? 'bg-orange-500' : ''}`}
                    onClick={() => setDumpingSymptom(true)}
                  >
                    있었다
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기분 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">오늘의 기분</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2">
                {MOOD_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={mood === opt.value ? 'default' : 'ghost'}
                    className={`h-16 w-16 text-3xl ${mood === opt.value ? 'bg-blue-600 ring-2 ring-blue-300' : ''}`}
                    onClick={() => setMood(opt.value)}
                  >
                    {opt.emoji}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 메모 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">특이사항 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="오늘 특이사항이 있으면 적어주세요..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-24 p-3 text-lg border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 식단 탭 */}
      {activeTab === 'meal' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">오늘의 식단</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MEAL_TYPES.map(mt => (
                <div key={mt.value}>
                  <label className="text-lg font-medium text-gray-700 block mb-1">{mt.label}</label>
                  <Input
                    placeholder={`${mt.label}에 뭐 드셨나요?`}
                    value={meals[mt.value]}
                    onChange={e => setMeals({ ...meals, [mt.value]: e.target.value })}
                    className="h-14 text-lg"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 영양보충제 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">영양보충제</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_SUPPLEMENTS.map(name => (
                  <Button
                    key={name}
                    variant={supplements[name] ? 'default' : 'outline'}
                    className={`h-14 text-lg ${supplements[name] ? 'bg-green-600' : ''}`}
                    onClick={() => setSupplements({ ...supplements, [name]: !supplements[name] })}
                  >
                    {supplements[name] ? '✅' : '⬜'} {name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 운동 탭 */}
      {activeTab === 'exercise' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">오늘의 운동</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 운동 추가 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {EXERCISE_TYPES.map(et => (
                  <Button
                    key={et.value}
                    variant={newExerciseType === et.value ? 'default' : 'outline'}
                    className={`h-12 text-base ${newExerciseType === et.value ? 'bg-blue-600' : ''}`}
                    onClick={() => setNewExerciseType(et.value)}
                  >
                    {et.emoji} {et.label}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="30"
                  value={newExerciseDuration}
                  onChange={e => setNewExerciseDuration(e.target.value)}
                  className="h-14 text-xl text-center w-24"
                />
                <span className="text-lg text-gray-500">분</span>
                <Button onClick={addExercise} className="h-14 text-lg bg-blue-600 flex-1">
                  추가
                </Button>
              </div>

              {/* 운동 목록 */}
              {exercises.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-lg font-medium text-gray-700">오늘 한 운동:</p>
                  {exercises.map((ex, i) => {
                    const et = EXERCISE_TYPES.find(t => t.value === ex.type)
                    return (
                      <div key={i} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <span className="text-lg">
                          {et?.emoji} {et?.label} - {ex.duration}분
                        </span>
                        <Button
                          variant="ghost"
                          className="text-red-500 text-lg"
                          onClick={() => setExercises(exercises.filter((_, j) => j !== i))}
                        >
                          삭제
                        </Button>
                      </div>
                    )
                  })}
                  <div className="text-right">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      총 {exercises.reduce((sum, e) => sum + e.duration, 0)}분
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 저장 버튼 - 큰 터치 영역 + 강한 피드백 */}
      <Button
        onClick={handleSave}
        className={`w-full h-18 text-xl font-bold transition-all rounded-2xl ${
          saved
            ? 'bg-green-600 hover:bg-green-600 scale-[1.02]'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.97]'
        }`}
        style={{ minHeight: '4.5rem' }}
      >
        {saved ? '저장 완료!' : '오늘의 기록 저장'}
      </Button>

      {/* 축하 오버레이 */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none animate-celebration">
          <div className="bg-white/95 backdrop-blur rounded-3xl p-8 mx-8 max-w-sm w-full text-center shadow-2xl pointer-events-auto">
            <p className="text-6xl mb-3 animate-bounce-once">🎉</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">잘하셨어요!</p>
            <p className="text-lg text-gray-600">오늘도 건강 기록 완료</p>
            {getRecordStreak() > 1 && (
              <p className="text-base text-blue-600 font-bold mt-2">
                🔥 {getRecordStreak()}일 연속 기록 중!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
