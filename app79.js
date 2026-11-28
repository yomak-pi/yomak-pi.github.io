/* v87: share links for profile and office pages (?u=, ?o=), open them after login, share buttons. */
(function(){
if(typeof PAGES==="undefined")return;
const OK=/^[0-9a-f-]{36}$/i,pi=()=>!!window.YOMAK_PI;
const base=()=>location.origin+location.pathname.replace(/[^\/]*$/,"");
const ref=()=>{try{const s=cs();return s&&s.uid?"&ref="+String(s.uid).slice(0,8):""}catch(e){return""}};
window.ykShareLink=function(k,id,title){
  const u=base()+"?"+k+"="+id+ref(),t=(title?title+" على يومك YOMAK":"يومك YOMAK");
  if(navigator.share){navigator.share({title:"يومك",text:t,url:u}).catch(function(){});return}
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>مشاركة</h3><div class="card" style="direction:ltr;overflow-wrap:anywhere;font-size:13px">'+esc(u)+'</div>'+
    (pi()?"":'<a class="primary" style="display:block;text-align:center;text-decoration:none;line-height:20px;margin-bottom:8px" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(t+"\n"+u)+'">🟢 واتساب</a>')+
    '<button class="secondary" style="width:100%" onclick="copyText(\''+u.replace(/'/g,"")+'\');closeModal()">🔗 نسخ الرابط</button>');
};
const btn=(k,id,t)=>'<button class="secondary" style="margin:0 0 10px;width:100%" onclick="ykShareLink(\''+k+'\',\''+id+'\',\''+String(t||"").replace(/['"\\<>]/g,"")+'\')">🔗 مشاركة</button>';
const _u=PAGES.user&&PAGES.user.render;
if(_u)PAGES.user.render=function(e){const h=_u.apply(this,arguments);if(!e||!OK.test(e.id||""))return h;const p=(window.cl&&cl.pp&&cl.pp[e.id])||{};return h+'<div style="margin-top:12px">'+btn("u",e.id,p.name)+'</div>'};
const _o=PAGES.office&&PAGES.office.render;
if(_o)PAGES.office.render=function(e){const h=_o.apply(this,arguments);if(!e||!OK.test(e.id||""))return h;const o=((window.es&&es.offices)||[]).find(function(x){return x.id===e.id})||{};return h+'<div style="margin-top:12px">'+btn("o",e.id,o.name)+'</div>'};
/* open a shared link; if the visitor is not signed in yet, remember it and open it after sign-in */
let tries=0;
function open(){
  let k="",id="";
  try{const q=new URLSearchParams(location.search);if(!cs()&&OK.test(q.get("post")||"")){localStorage.setItem("yk_pend","p:"+q.get("post"));history.replaceState(null,"",location.pathname)}if(OK.test(q.get("u")||"")){k="u";id=q.get("u")}else if(OK.test(q.get("o")||"")){k="o";id=q.get("o")}}catch(e){}
  if(k){try{localStorage.setItem("yk_pend",k+":"+id)}catch(e){}try{history.replaceState(null,"",location.pathname)}catch(e){}}
  let p="";try{p=localStorage.getItem("yk_pend")||""}catch(e){}
  if(!p)return;
  if(!cs()){if(++tries<40)setTimeout(open,3000);return}
  try{localStorage.removeItem("yk_pend")}catch(e){}
  const a=p.split(":");
  if(a[0]==="p"){location.replace(base()+"?post="+a[1]);return}
  setTimeout(function(){try{if(a[0]==="u")openUser(a[1]);else if(a[0]==="o"){(typeof loadOfficesQuiet==="function"?loadOfficesQuiet():Promise.resolve()).then(function(){openOffice(a[1])})}}catch(e){}},300);
}
open();setTimeout(open,2500);
})();
