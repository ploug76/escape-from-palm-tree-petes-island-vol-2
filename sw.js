/* auto-update: HTML/JS/CSS/JSON always revalidated with the server (no stale copies); cache is the offline fallback */
const __NC=r=>{try{const u=new URL(r.url);return u.origin==location.origin&&(r.mode=='navigate'||/(\/|\.html?|\.m?js|\.css|\.json)$/.test(u.pathname))?{cache:'no-cache'}:{}}catch(e){return {}}};
const CACHE='esc2-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./", "index.html", "kit.js?v=1", "game.js?v=1", "manifest.json", "icon-192.png", "fonts/lilita.woff2", "logo589.webp", "art/bg1.webp", "art/bg2.webp", "art/bg3.webp", "art/bg4.webp", "art/bg5.webp", "icon-512.png"])).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request,__NC(e.request)).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match(e.request,{ignoreSearch:true}))))});
