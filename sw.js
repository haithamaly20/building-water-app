/* Service Worker — نظام إدارة مياه العمارات
   بيخزن ملفات التطبيق الأساسية عشان يشتغل حتى من غير إنترنت بعد أول
   فتحة ناجحة. البيانات نفسها متخزنة في localStorage جوه المتصفح
   (زي ما هي دايماً) ومش من مسؤولية الـ Service Worker ده. */

const CACHE = 'water-app-v1';
const CORE = [
  './',
  './نظام_إدارة_العمارات.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* شبكة أولاً مع رجوع للنسخة المخزنة عند انقطاع الإنترنت — يضمن إنك
   دايماً تاخد أحدث نسخة من التطبيق لما يكون فيه اتصال، ويشتغل برضو
   من غير نت باستخدام آخر نسخة محفوظة */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
