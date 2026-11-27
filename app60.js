/* Default audience for new posts (public / friends / only me). Stored locally; applied to every new service_posts insert. Per-post edit stays in the post menu. */
(function(){
const K="yv_vis",get=()=>{try{return localStorage.getItem(K)||"public"}catch(e){return"public"}};
const oldSb=window.sb;
if(typeof oldSb==="function"){window.sb=function(u,o){
  try{const v=get();
    if(v!=="public"&&o&&o.method==="POST"&&/\/rest\/v1\/service_posts(\?|$)/.test(u)&&o.body&&typeof o.body==="object"&&!Array.isArray(o.body)&&!o.body.visibility)o.body=Object.assign({},o.body,{visibility:v})}catch(e){}
  return oldSb.apply(this,arguments)};
  try{sb=window.sb}catch(e){}}
const lbl={public:"🌍 الكل",friends:"👥 الأصدقاء فقط",me:"🔒 أنا فقط"};
const oldR=PAGES.settings&&PAGES.settings.render;
if(oldR)PAGES.settings.render=function(){
  const v=get();
  return oldR()+'<div class="card"><b>🔐 جمهور منشوراتك الجديدة</b><p class="muted">أي منشور جديد هيتشاف حسب الاختيار ده. وتقدر تغيّر كل منشور لوحده من قائمته.</p><div style="display:flex;gap:6px;flex-wrap:wrap">'+
  Object.keys(lbl).map(k=>'<button class="chip'+(v===k?" on":"")+'" onclick="yvVis(\''+k+'\')">'+lbl[k]+'</button>').join("")+'</div></div>'};
window.yvVis=function(k){try{localStorage.setItem(K,k)}catch(e){}msg("جمهور منشوراتك الجديدة: "+lbl[k]);if(curPage()==="settings")renderPage()};
})();
