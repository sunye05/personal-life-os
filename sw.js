// Service Worker - 离线缓存
const CACHE_VERSION = 'v1';
const CORE_CACHE = `zixuan-core-${CACHE_VERSION}`;
const RUNTIME_CACHE = `zixuan-runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/api.js',
  '/js/app.js',
  '/manifest.webmanifest',
  '/img/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CORE_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 跳过：API 请求（保证在线获取最新数据）
  if (url.pathname.startsWith('/api/')) return;
  // 跳过：管理后台（保持在线）
  if (url.pathname.startsWith('/admin/')) return;

  // 图片走 cache-first
  if (req.destination === 'image' || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // HTML/JS/CSS：network-first，回退到缓存
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok && (req.destination === 'document' || req.destination === 'script' || req.destination === 'style')) {
        const clone = res.clone();
        caches.open(CORE_CACHE).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
});
