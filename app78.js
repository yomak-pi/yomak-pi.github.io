/* v86: invite friends page with a personal link, referral counting (claim_referral / my_referrals), WhatsApp share (not on Pi). */
(function(){
if(typeof PAGES==="undefined")return;
const pi=()=>!!window.YOMAK_PI;
const code=()=>{try{const s=cs();return s&&s.uid?String(s.uid).slice(0,8):""}catch(e){return""}};
const base=()=>location.origin+location.pathname.replace(/[^\/]*$/,"");
const link=()=>base()+(code()?"?ref="+code():"");
const txt=()=>"جرّب يومك YOMAK 👋 مهامك ومصروفاتك وسوق وجروبات وشات، كله في مكان واحد وببلاش.\n"+link();
const S={list:null,busy:0};
async function claim(){
  try{
    if(!cs())return;const r=localStorage.getItem("yomak_ref");
    if(!r||localStorage.getItem("yomak_ref_done"))return;
    const ok=await sb("/rest/v1/rpc/claim_referral",{method:"POST",body:{code:String(r).toLowerCase()}});
    if(ok===true||ok===false)localStorage.setItem("yomak_ref_done","1");
  }catch(e){}
}
setTimeout(claim,7000);setTimeout(claim,40000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(claim,2000)});
async function load(){
  if(S.busy)return;S.busy=1;
  try{S.list=(await sb("/rest/v1/rpc/my_referrals",{method:"POST",body:{}}))||[]}catch(e){S.list=S.list||[]}
  S.busy=0;try{if(curPage()==="invite")renderPage()}catch(e){}
}
window.ykInvShare=async function(w){
  if(w==="copy"){copyText(link());return}
  if(w==="wa"){if(!pi())window.open("https://wa.me/?text="+encodeURIComponent(txt()),"_blank","noopener");return}
  try{await navigator.share({title:"يومك YOMAK",text:txt().split("\n")[0],url:link()})}catch(e){if(!e||e.name!=="AbortError")copyText(txt())}
};
const st=document.createElement("style");st.textContent=
".ykinv{text-align:center}.ykinv .big{font-size:42px;font-weight:800;color:var(--g,#155b50);line-height:1.1}.ykinv .lnk{direction:ltr;background:#f1f5f4;border:1px solid var(--line,#e3e8e6);border-radius:12px;padding:10px;font-size:13px;overflow-wrap:anywhere;margin:10px 0}"+
".ykinv .acts{display:grid;gap:8px}.ykinv .j{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid var(--line,#e3e8e6);font-size:14px}.ykinv .j:first-child{border-top:0}";
document.head.append(st);
PAGES.invite={title:()=>"ادعُ أصحابك",render:()=>{
  if(S.list===null)setTimeout(load,0);
  const n=(S.list||[]).length;
  return '<div class="card ykinv"><div class="big">'+(window.an?an(n):n)+'</div><div class="muted">صديق انضم بدعوتك</div><div class="lnk">'+esc(link())+'</div><div class="acts">'+
    (navigator.share?'<button class="primary" onclick="ykInvShare(\'sys\')">📤 شارك الرابط</button>':'')+
    (pi()?'':'<button class="primary" onclick="ykInvShare(\'wa\')">🟢 واتساب</button>')+
    '<button class="secondary" onclick="ykInvShare(\'copy\')">🔗 نسخ الرابط</button></div></div>'+
    '<div class="card ykinv" style="text-align:right"><b>اللي انضموا</b>'+(S.list===null?'<p class="muted">جاري التحميل…</p>':n?S.list.map(x=>'<div class="j"><span>'+esc(x.name||"مستخدم")+'</span><span class="muted">'+esc((x.joined||"").slice(0,10))+'</span></div>').join(""):'<p class="muted">لسه محدش. ابعت رابطك لأصحابك.</p>')+'</div>'}};
const _h=PAGES.hub&&PAGES.hub.render;
if(_h)PAGES.hub.render=function(){return '<button class="card" style="width:100%;display:flex;align-items:center;gap:10px;text-align:right;border:0" onclick="openPage(\'invite\')"><span style="font-size:24px">📤</span><span><b>ادعُ أصحابك</b><small class="muted" style="display:block">رابطك الشخصي وعدد اللي انضموا</small></span></button>'+_h.apply(this,arguments)};
})();
