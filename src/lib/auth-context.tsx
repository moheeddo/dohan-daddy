'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@/types/database'
import { getUser, setUser as storeUser, verifyPin, initializeDefaultUsers } from '@/lib/store'

interface AuthContextType {
  user: User | null
  login: (pin: string) => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeDefaultUsers()
    const stored = getUser()
    if (stored) setUserState(stored)
    setIsLoading(false)
  }, [])

  const login = (pin: string): boolean => {
    const found = verifyPin(pin)
    if (found) {
      setUserState(found)
      storeUser(found)
      return true
    }
    return false
  }

  const logout = () => {
    setUserState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('daddy_user')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
