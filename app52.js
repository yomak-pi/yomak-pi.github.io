/* One share sheet per post (own page, WhatsApp, Telegram, copy link, any app) + opening a shared post link + call media session. */
(function(){
const OKID=/^[0-9a-f-]{36}$/i;
const link=id=>location.origin+location.pathname.replace(/[^\/]*$/,"")+"?post="+id;
const txt=p=>((p&&p.title?p.title+"\n":"")+(p&&p.body?p.body.slice(0,200):"")).trim();
window.sharePost=function(id){
  const p=allFeedPosts().find(x=>x.id===id);if(!p)return;
  const pi=!!window.YOMAK_PI,b=(t,f,st)=>'<button class="secondary" style="display:block;width:100%;margin:6px 0;text-align:right;font-size:16px;'+(st||"")+'" onclick="'+f+'">'+t+'</button>';
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>مشاركة المنشور</h3>'+
    b("🔁 شارك على صفحتي في يومك","closeModal();svcRepost('"+id+"')")+
    (pi?"":b("🟢 واتساب","pcShare('"+id+"','wa')")+b("✈️ تيليجرام","pcShare('"+id+"','tg')"))+
    b("🔗 نسخ الرابط","pcShare('"+id+"','copy')")+
    (navigator.share?b("📤 تطبيقات تانية","pcShare('"+id+"','sys')"):""))};
window.pcShare=function(id,w){
  const p=allFeedPosts().find(x=>x.id===id)||{},u=link(id),t=txt(p);
  if(w==="copy"){copyText(u);closeModal();return}
  if(w==="sys"){try{navigator.share({title:"يومك",text:t,url:u}).catch(()=>{})}catch(e){}closeModal();return}
  const h=w==="wa"?"https://wa.me/?text="+encodeURIComponent((t?t+"\n":"")+u):"https://t.me/share/url?url="+encodeURIComponent(u)+"&text="+encodeURIComponent(t);
  closeModal();window.open(h,"_blank","noopener")};
/* open ?post=ID */
async function openShared(){
  let id;try{id=new URLSearchParams(location.search).get("post")}catch(e){}
  if(!id||!OKID.test(id))return;
  try{const r=await sb("/rest/v1/service_posts?id=eq."+id+"&select=*&limit=1");const p=r&&r[0];
    if(!p){msg("المنشور مش موجود أو مش متاح ليك");return}
    try{await loadPeople([p.user_id])}catch(e){}
    fd.u=fd.u||{id:"",list:null};fd.u.list=(fd.u.list||[]).filter(x=>x.id!==p.id).concat([p]);
    openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button>'+svcCard(p));
    try{history.replaceState(null,"",location.pathname)}catch(e){}
  }catch(e){msg(sbErr(e).slice(0,80))}}
setTimeout(openShared,2200);
/* call: show it in the phone's media controls so the system keeps the audio alive longer */
const mo=new MutationObserver(()=>{
  const on=!!document.getElementById("callT");
  if(on===mo.on)return;mo.on=on;
  try{if(!("mediaSession" in navigator))return;
    if(on){navigator.mediaSession.metadata=new MediaMetadata({title:"مكالمة يومك",artist:"مكالمة صوتية جارية",artwork:[{src:"icons/icon-192.png",sizes:"192x192",type:"image/png"}]});
      navigator.mediaSession.setActionHandler("hangup",()=>{try{callEnd()}catch(e){}})}
    else navigator.mediaSession.metadata=null}catch(e){}});
mo.observe(document.documentElement,{childList:true,subtree:true});
})();
