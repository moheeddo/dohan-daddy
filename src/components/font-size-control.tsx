'use client'

import { useState, useEffect, createContext, useContext } from 'react'

type FontSize = 'normal' | 'large' | 'xlarge'
type ThemeMode = 'light' | 'dark' | 'auto'

const FONT_SIZES: { id: FontSize; label: string; scale: number }[] = [
  { id: 'normal', label: '보통', scale: 1 },
  { id: 'large', label: '크게', scale: 1.15 },
  { id: 'xlarge', label: '아주 크게', scale: 1.3 },
]

const FontSizeContext = createContext<{
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}>({ fontSize: 'normal', setFontSize: () => {}, theme: 'light', setTheme: () => {} })

export function useFontSize() {
  return useContext(FontSizeContext)
}

function applyScale(size: FontSize) {
  const scale = FONT_SIZES.find(f => f.id === size)?.scale || 1
  document.documentElement.style.fontSize = `${scale * 16}px`
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // auto: 시스템 설정 따라가기
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const savedSize = localStorage.getItem('daddy_font_size') as FontSize | null
    if (savedSize && FONT_SIZES.some(f => f.id === savedSize)) {
      setFontSizeState(savedSize)
      applyScale(savedSize)
    }

    const savedTheme = localStorage.getItem('daddy_theme') as ThemeMode | null
    if (savedTheme) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    }

    // auto 모드일 때 시스템 변경 감지
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = localStorage.getItem('daddy_theme') as ThemeMode | null
      if (current === 'auto') applyTheme('auto')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem('daddy_font_size', size)
    applyScale(size)
  }

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    localStorage.setItem('daddy_theme', t)
    applyTheme(t)
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, theme, setTheme }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">글자 크기</span>
      <div className="flex gap-1.5 flex-1">
        {FONT_SIZES.map(size => (
          <button
            key={size.id}
            onClick={() => setFontSize(size.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              fontSize === size.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200'
            }`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ThemeSelector() {
  const { theme, setTheme } = useFontSize()
  const options: { id: ThemeMode; label: string; emoji: string }[] = [
    { id: 'light', label: '밝게', emoji: '☀️' },
    { id: 'dark', label: '어둡게', emoji: '🌙' },
    { id: 'auto', label: '자동', emoji: '⚙️' },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">화면 모드</span>
      <div className="flex gap-1.5 flex-1">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              theme === opt.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200'
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
