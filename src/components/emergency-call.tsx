'use client'

import { useState } from 'react'
import { haptic } from '@/lib/haptic'

const EMERGENCY_CONTACTS = [
  { id: 'hospital', label: '서울아산병원', phone: '1688-7575', emoji: '🏥', color: 'bg-blue-600' },
  { id: 'son', label: '아들 (도한)', phone: '', emoji: '👨‍👦', color: 'bg-emerald-600', editable: true },
  { id: 'emergency', label: '응급전화 119', phone: '119', emoji: '🚑', color: 'bg-red-600' },
]

function getStoredPhone(id: string): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(`emergency_phone_${id}`) || ''
}

function saveStoredPhone(id: string, phone: string) {
  localStorage.setItem(`emergency_phone_${id}`, phone)
}

export function EmergencyCall() {
  const [confirmCall, setConfirmCall] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPhone, setEditPhone] = useState('')

  const handleCall = (phone: string, label: string) => {
    haptic('medium')
    setConfirmCall(null)
    window.location.href = `tel:${phone.replace(/-/g, '')}`
  }

  const handleEditSave = (id: string) => {
    saveStoredPhone(id, editPhone)
    setEditingId(null)
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {EMERGENCY_CONTACTS.map(contact => {
          const phone = contact.editable ? getStoredPhone(contact.id) || contact.phone : contact.phone
          const hasPhone = !!phone

          return (
            <button
              key={contact.id}
              onClick={() => {
                if (contact.editable && !hasPhone) {
                  setEditingId(contact.id)
                  setEditPhone('')
                  return
                }
                haptic('light')
                setConfirmCall(contact.id)
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 ${
                hasPhone ? `${contact.color} text-white` : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="text-2xl">{contact.emoji}</span>
              <span className="text-xs font-bold leading-tight text-center">{contact.label}</span>
              {contact.editable && !hasPhone && (
                <span className="text-[10px] opacity-70">번호 등록</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 전화 확인 다이얼로그 */}
      {confirmCall && (() => {
        const contact = EMERGENCY_CONTACTS.find(c => c.id === confirmCall)
        if (!contact) return null
        const phone = contact.editable ? getStoredPhone(contact.id) || contact.phone : contact.phone
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setConfirmCall(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 mx-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <p className="text-5xl text-center mb-3">{contact.emoji}</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-1">{contact.label}</h3>
              <p className="text-lg text-gray-500 dark:text-gray-400 text-center mb-5">{phone}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCall(null)}
                  className="flex-1 h-14 rounded-2xl bg-gray-100 text-lg font-semibold text-gray-700 active:bg-gray-200 transition"
                >
                  취소
                </button>
                <button
                  onClick={() => handleCall(phone, contact.label)}
                  className={`flex-1 h-14 rounded-2xl text-lg font-semibold text-white active:scale-95 transition ${contact.color}`}
                >
                  📞 전화하기
                </button>
              </div>
              {contact.editable && (
                <button
                  onClick={() => { setConfirmCall(null); setEditingId(contact.id); setEditPhone(phone) }}
                  className="w-full mt-2 text-sm text-gray-400 py-2"
                >
                  번호 변경
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* 번호 편집 다이얼로그 */}
      {editingId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setEditingId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 mx-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">전화번호 등록</h3>
            <input
              type="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full h-14 px-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xl text-center focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 h-14 rounded-2xl bg-gray-100 text-lg font-semibold text-gray-700"
              >
                취소
              </button>
              <button
                onClick={() => handleEditSave(editingId)}
                disabled={!editPhone.trim()}
                className="flex-1 h-14 rounded-2xl bg-blue-600 text-lg font-semibold text-white disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
