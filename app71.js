/* v78: home and navigation reorganised the Facebook way. One row of shortcuts, filters as a small chip, tools under "المزيد", bottom bar: home, chat, post, market, menu, account. */
(function(){
if(typeof PAGES==="undefined")return;
const st=document.createElement("style");st.textContent=
".fbtop{position:sticky;top:0;z-index:5;background:var(--bg,#f4f7f6);padding:6px 0;margin:0 0 6px}"+
".fbtop b{font-size:17px}.fbtop button{width:42px;height:42px;font-size:19px}"+
".ykq{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;margin:0 -2px}.ykq::-webkit-scrollbar{display:none}"+
".ykq button{flex:0 0 auto;display:flex;align-items:center;gap:6px;min-height:42px;padding:0 14px;border:1px solid var(--line,#e3e8e6);border-radius:22px;background:#fff;font:inherit;font-weight:700;font-size:14px;color:var(--ink,#16302c);white-space:nowrap}"+
".ykq button.more{background:#e3efec;color:var(--g,#155b50)}"+
".fbq{border-radius:14px;margin:0 0 10px}.fbq>summary{min-height:40px;font-size:14px;color:var(--muted,#556)}"+
".fbcomp,.card{border-radius:14px}.fbcomp .fbacts button{font-size:13px}"+
".stc{height:136px}.stc.add .top{height:82px}.stc.add .pl{bottom:30px}.nav button{font-size:11px}.nav button span{font-size:20px}"+
".ykhub{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ykhub button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:86px;border:1px solid var(--line,#e3e8e6);border-radius:14px;background:#fff;font:inherit;font-weight:700;font-size:13px;padding:8px 4px}.ykhub button span{font-size:26px}"+
".ykhub-t{margin:14px 2px 8px;font-size:13px;color:var(--muted,#667);font-weight:700}";
document.head.append(st);
const Q=[["👥","الأصدقاء","openPage('friends')"],["💬","الجروبات","go('groups')"],["🎬","ريلز","openReels()"],["🛍️","السوق","go('market')"],["💼","وظائف","openJobs()"],["📅","فعاليات","openPage('events')"],["📄","صفحات","openPage('pages')"],["🔖","المحفوظات","openPage('saved')"]];
const row='<div class="ykq">'+Q.filter(q=>{const m=q[2].match(/openPage\('(\w+)'\)/);return !m||PAGES[m[1]]}).map(q=>'<button onclick="'+q[2]+'">'+q[0]+" "+q[1]+'</button>').join("")+'<button class="more" onclick="openPage(\'hub\')">☰ المزيد</button></div>';
const _fh=window.feedHome;
window.feedHome=function(){
  const h=_fh.apply(this,arguments);if(!cs())return h;
  const a=h.indexOf('<details class="fbq"><summary>☀️'),b=h.indexOf('<details class="fbq"><summary>🔎');
  if(a<0||b<0||b<a)return h;
  const e1=h.indexOf("</details>",a)+10,e2=h.indexOf("</details>",b)+10;
  const tools=h.slice(a,e1).replace("☀️ يومك واختصاراتك","☰ أدوات يومك (المهام والصلاة والتقويم…)"),flt=h.slice(b,e2).replace("🔎 تصفية المنشورات","🔎 تصفية المنشورات");
  return h.slice(0,a)+row+flt+h.slice(e2)+tools;
};
/* bottom bar: swap "expenses" for the menu; expenses moves into the menu */
const nav=document.querySelector(".nav");
if(nav){const b=nav.querySelector('[data-t="expenses"]');if(b){b.dataset.t="hub";b.setAttribute("onclick","openPage('hub')");b.innerHTML="<span>☰</span>القائمة"}}
const _h=PAGES.hub.render;
PAGES.hub.render=function(){
  const mine=[["expenses","💰","مصروفاتي","closeAllLayers();go('expenses')"],["friends","👥","الأصدقاء","openPage('friends')"],["reels","🎬","ريلز","openReels()"],["events","📅","فعاليات","openPage('events')"],["pages","📄","صفحات","openPage('pages')"],["saved","🔖","المحفوظات","openPage('saved')"],["memories","🕰️","ذكريات","openPage('memories')"],["settings","⚙️","الإعدادات","openPage('settings')"]].filter(x=>x[0]==="expenses"||PAGES[x[0]]);
  return '<div class="ykhub-t">الأساسيات</div><div class="ykhub">'+mine.map(x=>'<button onclick="'+x[3]+'"><span>'+x[1]+'</span>'+x[2]+'</button>').join("")+'</div><div class="ykhub-t">كل الأقسام</div>'+_h.apply(this,arguments)};
})();
