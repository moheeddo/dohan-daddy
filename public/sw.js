const CACHE_NAME = 'daddy-health-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// 설치: 기본 정적 자산 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 네트워크 우선, 실패 시 캐시 (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답은 캐시에 저장
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // 오프라인: 캐시에서 제공
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // 네비게이션 요청이면 메인 페이지 반환
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
          return new Response('오프라인 상태입니다', { status: 503 })
        })
      })
  )
})
