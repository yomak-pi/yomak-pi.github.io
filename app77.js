/* v84: home glow-up: hero greeting, discover tiles, people carousel, empty state, story rings, motion. */
(function(){
if(typeof feedHome!=="function")return;
const st=document.createElement("style");st.textContent=
"@keyframes ykUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes ykPop{0%{transform:scale(.9);opacity:0}100%{transform:none;opacity:1}}@keyframes ykFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes ykShine{0%{background-position:200% 0}100%{background-position:-200% 0}}"+
"#main>.card,.ykdisc,.ykpeo,.ykempty{animation:ykUp .45s cubic-bezier(.2,.8,.2,1) both}#main>.card:nth-child(2){animation-delay:.05s}#main>.card:nth-child(3){animation-delay:.1s}#main>.card:nth-child(4){animation-delay:.15s}"+
".daystrip{position:relative;overflow:hidden;border:0!important;color:#fff!important;border-radius:22px!important;padding:18px 18px!important;background:linear-gradient(135deg,#0f4f45 0%,#1a8a73 55%,#e0a030 130%)!important;box-shadow:0 12px 28px #0f4f4540!important}"+
".daystrip *{color:#fff!important}.daystrip b{font-size:21px!important;line-height:1.35}.daystrip small{opacity:.9;font-size:13px!important}.daystrip>span{background:#ffffff2e;padding:8px 14px;border-radius:20px;font-weight:700}"+
".daystrip:before{content:'';position:absolute;width:170px;height:170px;border-radius:50%;left:-50px;top:-70px;background:radial-gradient(#ffffff35,transparent 70%)}.daystrip:after{content:'';position:absolute;width:120px;height:120px;border-radius:50%;right:-30px;bottom:-60px;background:radial-gradient(#e0a03066,transparent 70%)}"+
".ykt{margin:16px 2px 8px;display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:17px}.ykt small{font-weight:700;color:var(--g,#155b50);font-size:13px}"+
".ykdisc{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ykdisc button{border:0;border-radius:18px;min-height:92px;padding:12px;color:#fff;font:inherit;font-weight:800;font-size:15px;text-align:right;position:relative;overflow:hidden;box-shadow:0 8px 20px #0002;transition:transform .15s}.ykdisc button:active{transform:scale(.96)}"+
".ykdisc button i{font-style:normal;position:absolute;left:10px;bottom:4px;font-size:44px;opacity:.28;transform:rotate(-12deg)}.ykdisc button small{display:block;font-weight:600;font-size:12px;opacity:.9;margin-top:4px}"+
"#main{overflow-x:hidden}.ykpeo{width:100%;box-sizing:border-box;display:flex;gap:10px;overflow-x:auto;padding:2px 2px 12px;scrollbar-width:none}.ykpeo::-webkit-scrollbar{display:none}.ykp{flex:0 0 128px;background:#fff;border-radius:20px;padding:14px 8px 12px;text-align:center;box-shadow:0 6px 18px #0f3c3a14;border:0;font:inherit;transition:transform .15s}.ykp:active{transform:scale(.96)}"+
".ykp .av{width:64px;height:64px;border-radius:50%;margin:0 auto 8px;display:grid;place-items:center;font-size:26px;font-weight:800;color:#fff;background:linear-gradient(135deg,#1a8a73,#e0a030);padding:3px}.ykp .av img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #fff}.ykp b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ykp small{display:block;color:var(--muted,#667);font-size:12px;margin:2px 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ykp span{display:block;background:#e3efec;color:var(--g,#155b50);border-radius:14px;padding:7px 0;font-weight:800;font-size:13px}"+
".ykempty{text-align:center;padding:26px 16px!important}.ykempty svg{width:150px;height:120px;animation:ykFloat 3.2s ease-in-out infinite}.ykempty h3{margin:8px 0 4px;font-size:19px}.ykempty p{margin:0 0 14px;color:var(--muted,#667)}.ykempty .row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}"+
".stc{border-radius:20px!important;box-shadow:0 6px 16px #0003}.stc .ring{border:0!important;padding:3px;background:conic-gradient(#e0a030,#e5457a,#7a4cd8,#1a8a73,#e0a030)!important}.stc.seen .ring{background:#cfd6d4!important}"+
".card button:active,.chip:active,.fchip:active{transform:scale(.96)}";
document.head.append(st);
const T=[["#1a8a73","#0f4f45","🛍️","السوق","بيع واشتري قريب منك","go('market')"],["#e5457a","#a02a5a","🎬","ريلز","فيديوهات قصيرة","openReels()"],["#4c7be0","#2a4fa8","💼","وظائف","فرص وسيرة ذاتية","openJobs()"],["#e0a030","#b06f10","📅","فعاليات","اللي بيحصل حواليك","openPage('events')"]];
const disc='<div class="ykt"><span>اكتشف</span></div><div class="ykdisc">'+T.map(t=>'<button style="background:linear-gradient(135deg,'+t[0]+','+t[1]+')" onclick="'+t[5]+'"><span>'+t[3]+'</span><small>'+t[4]+'</small><i>'+t[2]+'</i></button>').join("")+'</div>';
const art='<svg viewBox="0 0 150 120" aria-hidden="true"><defs><linearGradient id="yg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#1a8a73"/><stop offset="1" stop-color="#e0a030"/></linearGradient></defs><circle cx="75" cy="62" r="46" fill="#e3efec"/><rect x="38" y="34" width="74" height="52" rx="12" fill="url(#yg)"/><circle cx="58" cy="52" r="7" fill="#fff"/><rect x="70" y="47" width="30" height="5" rx="2.5" fill="#fff"/><rect x="70" y="58" width="22" height="5" rx="2.5" fill="#ffffffaa"/><rect x="48" y="72" width="54" height="5" rx="2.5" fill="#ffffff88"/><circle cx="118" cy="30" r="5" fill="#e0a030"/><circle cx="28" cy="88" r="4" fill="#1a8a73"/></svg>';
const empty='<div class="card ykempty">'+art+'<h3>الساحة مستنياك</h3><p>مفيش منشورات لسه. ابدأ بمنشور، أو دوّر على ناس وجروبات.</p><div class="row"><button class="primary" onclick="newPost()">＋ انشر الآن</button><button class="secondary" onclick="openPage(\'friends\')">👥 دوّر على أصدقاء</button></div></div>';
let pe={t:0,list:null,busy:0};
async function loadPeo(){
  if(pe.busy||(pe.list&&Date.now()-pe.t<3e5))return;pe.busy=1;
  try{
    const u=(cs()||{}).uid;const mp=(window.cl&&cl.pp&&cl.pp[u])||{};
    let q="/rest/v1/profiles?select=id,name,username,avatar,city,verified&order=created_at.desc&limit=24";
    const r=(await sb(q))||[];
    const mine=new Set([u]);((window.cl&&cl.fr&&cl.fr.rows)||[]).forEach(x=>{mine.add(x.requester);mine.add(x.addressee)});
    pe.list=r.filter(p=>!mine.has(p.id)&&UUID_RE.test(p.id)).sort((a,b)=>(a.city===mp.city?-1:0)-(b.city===mp.city?-1:0)).slice(0,10);
    pe.t=Date.now();
  }catch(e){pe.list=pe.list||[]}
  pe.busy=0;paint();
}
function peoHtml(){
  if(!pe.list||!pe.list.length)return"";
  return '<div class="ykt"><span>أشخاص قد تعرفهم</span><small onclick="openPage(\'friends\')">الكل ›</small></div><div class="ykpeo">'+pe.list.map(p=>'<button class="ykp" onclick="openUser(\''+p.id+'\')"><div class="av">'+(p.avatar&&/^https:/.test(p.avatar)?'<img loading="lazy" alt="" src="'+esc(p.avatar)+'">':esc((p.name||"؟").trim().charAt(0)))+'</div><b>'+esc(p.name||"مستخدم")+'</b><small>'+esc(p.city||"")+'&nbsp;</small><span>عرض الملف</span></button>').join("")+'</div>';
}
function paint(){const b=document.getElementById("ykPeo");if(b)b.innerHTML=peoHtml()}
const _fh=window.feedHome;
window.feedHome=function(){
  let h=_fh.apply(this,arguments);if(!cs())return h;
  const i=h.indexOf('<div class="ykh">');
  const ph='<div id="ykPeo">'+peoHtml()+'</div>';
  if(i>0)h=h.slice(0,i)+disc+ph+h.slice(i);
  h=h.replace(/<div class="card"><b>لسه مفيش منشورات هنا<\/b>[\s\S]*?<\/button><\/div>/,empty);
  setTimeout(loadPeo,200);
  return h;
};
})();
