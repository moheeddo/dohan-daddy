export type SputumColor = 'clear' | 'white' | 'yellow' | 'green' | 'bloody'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type UserRole = 'patient' | 'caregiver'
export type ExerciseType = 'walking' | 'breathing' | 'stretching' | 'other'
export type ArticleCategory = 'new_drug' | 'phage' | 'clinical_trial' | 'research' | 'news' | 'immunity'

export interface User {
  id: string
  name: string
  pin: string
  role: UserRole
  created_at: string
}

export interface DailyRecord {
  id?: string
  user_id: string
  date: string
  overall_condition: number // 1=안좋음, 2=보통, 3=좋음
  cough_level: number // 0-10
  sputum_amount: number // 0-10
  sputum_color: SputumColor
  breathing_difficulty: number // 0-10
  fatigue_level: number // 0-10
  temperature?: number
  weight?: number
  dumping_symptom: boolean
  mood: number // 1-5
  notes?: string
  created_at?: string
}

export interface Meal {
  id?: string
  user_id: string
  date: string
  meal_type: MealType
  description: string
  photo_url?: string
  created_at?: string
}

export interface Exercise {
  id?: string
  user_id: string
  date: string
  exercise_type: ExerciseType
  duration_minutes: number
  notes?: string
  created_at?: string
}

export interface Supplement {
  id?: string
  user_id: string
  date: string
  supplement_name: string
  taken: boolean
}

export interface MedicalRecord {
  id?: string
  user_id: string
  date: string
  hospital: string
  doctor: string
  exam_types: string[]
  results_summary?: string
  photo_urls?: string[]
  doctor_notes?: string
  next_appointment?: string
  created_at?: string
}

export interface NtmArticle {
  id?: string
  source: string
  source_id?: string
  title_original: string
  title_ko: string
  summary_original?: string
  summary_ko: string
  hope_score: number // 0-100
  relevance_score: number // 0-100
  category: ArticleCategory
  published_at: string
  fetched_at?: string
  url: string
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<User> }
      daily_records: { Row: DailyRecord; Insert: DailyRecord; Update: Partial<DailyRecord> }
      meals: { Row: Meal; Insert: Meal; Update: Partial<Meal> }
      exercises: { Row: Exercise; Insert: Exercise; Update: Partial<Exercise> }
      supplements: { Row: Supplement; Insert: Supplement; Update: Partial<Supplement> }
      medical_records: { Row: MedicalRecord; Insert: MedicalRecord; Update: Partial<MedicalRecord> }
      ntm_articles: { Row: NtmArticle; Insert: NtmArticle; Update: Partial<NtmArticle> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
