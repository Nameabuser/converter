const V='converter-v3';
const FILES=['./','index.html','style.css','app.js','manifest.webmanifest','lib/pdf.min.js','lib/pdf.worker.min.js','lib/jspdf.umd.min.js','lib/heic2any.min.js','icons/icon48.png','icons/icon128.png','icons/icon192.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>r.ok?c.put(f,r):null).catch(()=>null)))));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{if(res.status===200){const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp)).catch(()=>{});}return res;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
