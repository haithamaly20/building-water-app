/* ============================================================
   Service Worker — إدارة العمارات
   v1.0.0 — يجب تغيير CACHE_VERSION عند كل تحديث للتطبيق
   ============================================================ */
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME    = `edarat-cache-${CACHE_VERSION}`;

/* الملفات الأساسية التي تُخزَّن فور التثبيت */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

/* النطاقات الخارجية التي يجب أن تمر عبر الشبكة دائماً */
const NETWORK_ONLY_ORIGINS = [
  'script.google.com',
  'script.googleusercontent.com',
  'googleapis.com',
];

/* ─── Install ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())   /* تفعيل SW الجديد فوراً */
  );
});

/* ─── Activate ────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('edarat-cache-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))   /* حذف الكاشات القديمة */
      )
    ).then(() => self.clients.claim()) /* التحكم في جميع التبويبات فوراً */
  );
});

/* ─── Fetch ───────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* تجاهل طلبات غير GET */
  if (request.method !== 'GET') return;

  /* طلبات خارجية (Google Sheets وغيرها) → شبكة فقط */
  if (NETWORK_ONLY_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(fetch(request));
    return;
  }

  /* طلبات chrome-extension أو غير http → تجاهل */
  if (!url.protocol.startsWith('http')) return;

  /* استراتيجية: Network First → Cache Fallback
     مناسبة لتطبيق يحتاج آخر نسخة وعنده fallback offline */
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        /* نسخة ناجحة من الشبكة → حدّث الكاش */
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        }
        return networkResponse;
      })
      .catch(() =>
        /* الشبكة فشلت → ارجع للكاش */
        caches.match(request).then(cached =>
          cached || caches.match('./index.html') /* fallback للصفحة الرئيسية */
        )
      )
  );
});
