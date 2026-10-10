const V='converter-v1';
const FILES=['./','index.html','style.css','app.js','manifest.webmanifest','lib/pdf.min.js','lib/pdf.worker.min.js','lib/jspdf.umd.min.js','lib/heic2any.min.js','icons/icon48.png','icons/icon128.png','icons/icon192.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
