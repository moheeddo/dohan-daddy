'use client'

import { useState, useEffect, createContext, useContext } from 'react'

type FontSize = 'normal' | 'large' | 'xlarge'

const FONT_SIZES: { id: FontSize; label: string; scale: number }[] = [
  { id: 'normal', label: '보통', scale: 1 },
  { id: 'large', label: '크게', scale: 1.15 },
  { id: 'xlarge', label: '아주 크게', scale: 1.3 },
]

const FontSizeContext = createContext<{
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}>({ fontSize: 'normal', setFontSize: () => {} })

export function useFontSize() {
  return useContext(FontSizeContext)
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')

  useEffect(() => {
    const saved = localStorage.getItem('daddy_font_size') as FontSize | null
    if (saved && FONT_SIZES.some(f => f.id === saved)) {
      setFontSizeState(saved)
      applyScale(saved)
    }
  }, [])

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem('daddy_font_size', size)
    applyScale(size)
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  )
}

function applyScale(size: FontSize) {
  const scale = FONT_SIZES.find(f => f.id === size)?.scale || 1
  document.documentElement.style.fontSize = `${scale * 16}px`
}

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 flex-shrink-0">글자 크기</span>
      <div className="flex gap-1.5 flex-1">
        {FONT_SIZES.map(size => (
          <button
            key={size.id}
            onClick={() => setFontSize(size.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              fontSize === size.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  )
}
