const V='yomak-v22',FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>{const old=k.some(x=>x!==V);return Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))).then(()=>self.clients.claim()).then(()=>old?self.clients.matchAll({type:'window'}):[]).then(l=>l.forEach(c=>{try{c.navigate(c.url)}catch(x){}}))}))});
// الشبكة أولًا (علشان التحديثات تظهر فورًا)، وعند عدم وجود نت يُقدَّم المحفوظ
// الصفحة الرئيسية: الشبكة أولًا. ملفات التطبيق (js/صور): من الذاكرة فورًا ثم تحديث في الخلفية، ولو الملف اتغير الصفحة تتحدّث مرة واحدة.
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const stat=/\.(js|png|css|json)$/.test(u.pathname)&&!/sw\.js$/.test(u.pathname);
  if(!stat){e.respondWith(fetch(e.request).then(n=>{if(n.ok){const c=n.clone();caches.open(V).then(ch=>ch.put(e.request,c))}return n}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));return}
  // js/css/png: network first (3.5s), then the saved copy. New versions show up on the first open.
  e.respondWith(caches.open(V).then(ch=>{
    const net=fetch(e.request,{cache:'no-cache'}).then(n=>{if(n.ok)ch.put(e.request,n.clone());return n});
    const to=new Promise(r=>setTimeout(r,3500,null));
    return Promise.race([net.catch(()=>null),to]).then(n=>n||ch.match(e.request,{ignoreSearch:true}).then(o=>o||net))}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./index.html')))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'يومك',{body:d.body||'',icon:'icons/icon-192.png',tag:d.tag||'yomak',renotify:true,requireInteraction:d.tag==='call',vibrate:d.tag==='call'?[400,200,400,200,400,200,400]:[100],dir:'rtl',lang:'ar',data:{url:d.url||'./index.html'}}))});
