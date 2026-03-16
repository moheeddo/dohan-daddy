// 로컬 스토리지 기반 데이터 저장소
// Supabase 연동 전까지 로컬에서 동작하도록 구현
// 나중에 Supabase로 마이그레이션 가능

import type { DailyRecord, Meal, Exercise, Supplement, MedicalRecord, NtmArticle, User } from '@/types/database'

const STORAGE_KEYS = {
  USER: 'daddy_user',
  DAILY_RECORDS: 'daddy_daily_records',
  MEALS: 'daddy_meals',
  EXERCISES: 'daddy_exercises',
  SUPPLEMENTS: 'daddy_supplements',
  MEDICAL_RECORDS: 'daddy_medical_records',
  NTM_ARTICLES: 'daddy_ntm_articles',
} as const

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// User
export function getUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.USER, null)
}

export function setUser(user: User): void {
  setItem(STORAGE_KEYS.USER, user)
}

export function verifyPin(pin: string): User | null {
  const users = getUsers()
  return users.find(u => u.pin === pin) || null
}

export function getUsers(): User[] {
  return getItem<User[]>('daddy_users', [])
}

export function initializeDefaultUsers(): void {
  const users = getUsers()
  if (users.length === 0) {
    const defaultUsers: User[] = [
      { id: 'patient-1', name: '아버지', pin: '1959', role: 'patient', created_at: new Date().toISOString() },
      { id: 'caregiver-1', name: 'dohan', pin: '0000', role: 'caregiver', created_at: new Date().toISOString() },
    ]
    setItem('daddy_users', defaultUsers)
  }
}

// Daily Records
export function getDailyRecords(): DailyRecord[] {
  return getItem<DailyRecord[]>(STORAGE_KEYS.DAILY_RECORDS, [])
}

export function getDailyRecordByDate(date: string): DailyRecord | undefined {
  return getDailyRecords().find(r => r.date === date)
}

export function saveDailyRecord(record: DailyRecord): void {
  const records = getDailyRecords()
  const existingIndex = records.findIndex(r => r.date === record.date && r.user_id === record.user_id)
  if (existingIndex >= 0) {
    records[existingIndex] = { ...record, id: records[existingIndex].id }
  } else {
    record.id = crypto.randomUUID()
    record.created_at = new Date().toISOString()
    records.push(record)
  }
  setItem(STORAGE_KEYS.DAILY_RECORDS, records)
}

// Meals
export function getMealsByDate(date: string): Meal[] {
  return getItem<Meal[]>(STORAGE_KEYS.MEALS, []).filter(m => m.date === date)
}

export function saveMeal(meal: Meal): void {
  const meals = getItem<Meal[]>(STORAGE_KEYS.MEALS, [])
  const existingIndex = meals.findIndex(m => m.date === meal.date && m.meal_type === meal.meal_type && m.user_id === meal.user_id)
  if (existingIndex >= 0) {
    meals[existingIndex] = { ...meal, id: meals[existingIndex].id }
  } else {
    meal.id = crypto.randomUUID()
    meal.created_at = new Date().toISOString()
    meals.push(meal)
  }
  setItem(STORAGE_KEYS.MEALS, meals)
}

// Exercises
export function getExercisesByDate(date: string): Exercise[] {
  return getItem<Exercise[]>(STORAGE_KEYS.EXERCISES, []).filter(e => e.date === date)
}

export function saveExercise(exercise: Exercise): void {
  const exercises = getItem<Exercise[]>(STORAGE_KEYS.EXERCISES, [])
  exercise.id = crypto.randomUUID()
  exercise.created_at = new Date().toISOString()
  exercises.push(exercise)
  setItem(STORAGE_KEYS.EXERCISES, exercises)
}

export function deleteExercise(id: string): void {
  const exercises = getItem<Exercise[]>(STORAGE_KEYS.EXERCISES, [])
  setItem(STORAGE_KEYS.EXERCISES, exercises.filter(e => e.id !== id))
}

// Supplements
export function getSupplementsByDate(date: string): Supplement[] {
  return getItem<Supplement[]>(STORAGE_KEYS.SUPPLEMENTS, []).filter(s => s.date === date)
}

export function saveSupplement(supplement: Supplement): void {
  const supplements = getItem<Supplement[]>(STORAGE_KEYS.SUPPLEMENTS, [])
  const existingIndex = supplements.findIndex(
    s => s.date === supplement.date && s.supplement_name === supplement.supplement_name && s.user_id === supplement.user_id
  )
  if (existingIndex >= 0) {
    supplements[existingIndex] = { ...supplement, id: supplements[existingIndex].id }
  } else {
    supplement.id = crypto.randomUUID()
    supplements.push(supplement)
  }
  setItem(STORAGE_KEYS.SUPPLEMENTS, supplements)
}

// Medical Records
export function getMedicalRecords(): MedicalRecord[] {
  return getItem<MedicalRecord[]>(STORAGE_KEYS.MEDICAL_RECORDS, [])
}

export function saveMedicalRecord(record: MedicalRecord): void {
  const records = getMedicalRecords()
  record.id = crypto.randomUUID()
  record.created_at = new Date().toISOString()
  records.push(record)
  setItem(STORAGE_KEYS.MEDICAL_RECORDS, records)
}

// NTM Articles
export function getNtmArticles(): NtmArticle[] {
  return getItem<NtmArticle[]>(STORAGE_KEYS.NTM_ARTICLES, [])
}

export function saveNtmArticle(article: NtmArticle): void {
  const articles = getNtmArticles()
  article.id = crypto.randomUUID()
  article.fetched_at = new Date().toISOString()
  articles.push(article)
  setItem(STORAGE_KEYS.NTM_ARTICLES, articles)
}

// Appointments (진료 일정)
export interface Appointment {
  id?: string
  user_id: string
  date: string
  hospital: string
  doctor: string
  department: string
  purpose: string
  notes?: string
  completed: boolean
  created_at?: string
}

export function getAppointments(): Appointment[] {
  return getItem<Appointment[]>('daddy_appointments', [])
}

export function getUpcomingAppointments(): Appointment[] {
  const today = getTodayString()
  return getAppointments()
    .filter(a => a.date >= today && !a.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getPastAppointments(): Appointment[] {
  const today = getTodayString()
  return getAppointments()
    .filter(a => a.date < today || a.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function saveAppointment(appointment: Appointment): void {
  const appointments = getAppointments()
  if (appointment.id) {
    const idx = appointments.findIndex(a => a.id === appointment.id)
    if (idx >= 0) {
      appointments[idx] = appointment
      setItem('daddy_appointments', appointments)
      return
    }
  }
  appointment.id = crypto.randomUUID()
  appointment.created_at = new Date().toISOString()
  appointments.push(appointment)
  setItem('daddy_appointments', appointments)
}

export function deleteAppointment(id: string): void {
  const appointments = getAppointments()
  setItem('daddy_appointments', appointments.filter(a => a.id !== id))
}

// 최근 N일간의 데이터 가져오기
export function getRecentDailyRecords(days: number): DailyRecord[] {
  const records = getDailyRecords()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return records.filter(r => r.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date))
}

// 오늘 날짜 문자열
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// 연속 기록 스트릭 계산
export function getRecordStreak(): number {
  const records = getDailyRecords()
  if (records.length === 0) return 0

  const recordDates = new Set(records.map(r => r.date))
  let streak = 0
  const d = new Date()

  // 오늘부터 거꾸로 세기
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    if (recordDates.has(dateStr)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// 어제 기록 여부 확인
export function hasYesterdayRecord(): boolean {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const yesterday = d.toISOString().split('T')[0]
  return getDailyRecordByDate(yesterday) !== undefined
}
