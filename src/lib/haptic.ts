// 햅틱 피드백 유틸리티 (모바일 진동)
export function haptic(type: 'light' | 'medium' | 'success' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  switch (type) {
    case 'light': navigator.vibrate(10); break
    case 'medium': navigator.vibrate(25); break
    case 'success': navigator.vibrate([10, 50, 10]); break
  }
}
