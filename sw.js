const V='yomak-v19',FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// الشبكة أولًا (علشان التحديثات تظهر فورًا)، وعند عدم وجود نت يُقدَّم المحفوظ
// الصفحة الرئيسية: الشبكة أولًا. ملفات التطبيق (js/صور): من الذاكرة فورًا ثم تحديث في الخلفية، ولو الملف اتغير الصفحة تتحدّث مرة واحدة.
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const stat=/\.(js|png|css|json)$/.test(u.pathname)&&!/sw\.js$/.test(u.pathname);
  if(!stat){e.respondWith(fetch(e.request).then(n=>{if(n.ok){const c=n.clone();caches.open(V).then(ch=>ch.put(e.request,c))}return n}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));return}
  e.respondWith(caches.open(V).then(ch=>ch.match(e.request,{ignoreSearch:true}).then(old=>{
    const net=fetch(e.request).then(n=>{if(n.ok){const c=n.clone();ch.put(e.request,c);
      if(old&&(old.headers.get('etag')||old.headers.get('content-length'))!==(n.headers.get('etag')||n.headers.get('content-length'))&&/\.js$/.test(u.pathname))self.clients.matchAll({type:'window'}).then(l=>l.forEach(w=>w.postMessage({yomakUpdated:u.pathname})))}return n}).catch(()=>old);
    return old||net})))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./index.html')))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'يومك',{body:d.body||'',icon:'icons/icon-192.png',tag:d.tag||'yomak',dir:'rtl',lang:'ar',data:{url:d.url||'./index.html'}}))});
