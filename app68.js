/* v74: first-run welcome (3 slides) + light visual polish. No external fonts, images or links. */
(function(){
const KEY="yk_welcome";
const css=document.createElement("style");
css.textContent=`
.card{box-shadow:0 8px 24px #123c3a0f;transition:box-shadow .2s,transform .15s}
button,.chip{transition:transform .12s,opacity .15s}
button:active,.chip:active{transform:scale(.96)}
.nav button.on span,.nav button.active span{transform:translateY(-1px)}
.primary{box-shadow:0 6px 16px #155b5033}
#ykw{position:fixed;inset:0;z-index:100001;background:linear-gradient(160deg,#0f3330,#1b6557 70%,#2a8a74);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:28px 24px calc(24px + env(safe-area-inset-bottom));font-family:inherit;direction:rtl;overflow:hidden}
#ykw .sk{align-self:flex-start;background:#ffffff1f;border:0;color:#fff;border-radius:20px;padding:8px 16px;font-size:14px}
#ykw .sl{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;max-width:420px;animation:ykin .35s}
#ykw .ill{width:176px;height:176px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#ffffff40,#ffffff12);display:grid;place-items:center;box-shadow:0 20px 50px #0004,inset 0 0 0 2px #ffffff30}
#ykw h2{margin:6px 0 0;font-size:26px;line-height:1.35}
#ykw p{margin:0;font-size:16px;line-height:1.7;opacity:.88}
#ykw .dots{display:flex;gap:8px;margin:6px 0 16px}
#ykw .dots i{width:8px;height:8px;border-radius:8px;background:#ffffff55;transition:all .25s}
#ykw .dots i.on{width:26px;background:#f2a54a}
#ykw .go{width:100%;max-width:420px;border:0;border-radius:16px;padding:15px;font-size:17px;font-weight:700;background:#f2a54a;color:#123c3a}
@keyframes ykin{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}
`;
document.head.appendChild(css);
const svg={
 chat:'<svg width="96" height="96" viewBox="0 0 96 96" fill="none"><rect x="8" y="14" width="60" height="42" rx="14" fill="#fff"/><path d="M22 56v14l16-14z" fill="#fff"/><rect x="36" y="36" width="52" height="38" rx="14" fill="#f2a54a"/><path d="M76 74v12l-14-12z" fill="#f2a54a"/><circle cx="26" cy="35" r="4" fill="#1b6557"/><circle cx="38" cy="35" r="4" fill="#1b6557"/><circle cx="50" cy="35" r="4" fill="#1b6557"/></svg>',
 people:'<svg width="96" height="96" viewBox="0 0 96 96" fill="none"><circle cx="48" cy="30" r="14" fill="#fff"/><path d="M20 78c0-16 12-26 28-26s28 10 28 26z" fill="#fff"/><circle cx="20" cy="38" r="10" fill="#f2a54a"/><path d="M2 76c0-12 8-20 18-20 4 0 7 1 10 3-6 5-9 12-9 17z" fill="#f2a54a"/><circle cx="76" cy="38" r="10" fill="#f2a54a"/><path d="M94 76c0-12-8-20-18-20-4 0-7 1-10 3 6 5 9 12 9 17z" fill="#f2a54a"/></svg>',
 shop:'<svg width="96" height="96" viewBox="0 0 96 96" fill="none"><path d="M18 34h60l-5 44a8 8 0 0 1-8 7H31a8 8 0 0 1-8-7z" fill="#fff"/><path d="M34 34v-6a14 14 0 0 1 28 0v6" stroke="#f2a54a" stroke-width="7" stroke-linecap="round"/><path d="M38 56l8 8 14-16" stroke="#1b6557" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
const slides=[
 {i:"people",t:"يومك: مكانك مع ناسك",p:"اعرف أخبار أهلك وأصحابك، وانشر وشارك صورك وأفكارك في مكان واحد."},
 {i:"chat",t:"كلّمهم في أي وقت",p:"رسائل ومكالمات صوت وفيديو وجروبات، من غير ما تحتاج تطبيق تاني."},
 {i:"shop",t:"سوق وخدمات حواليك",p:"اشتري وبيع وادّور على شغل وعقارات وخدمات في مدينتك، وكمان مصروفاتك ومهامك وصلاتك."}];
function show(){
  if(document.getElementById("ykw"))return;
  let n=0;const w=document.createElement("div");w.id="ykw";
  function draw(){
    const s=slides[n],last=n===slides.length-1;
    w.innerHTML='<button class="sk" type="button">تخطّي</button><div class="sl" key="'+n+'"><div class="ill">'+svg[s.i]+'</div><h2>'+s.t+'</h2><p>'+s.p+'</p></div><div class="dots">'+slides.map((_,i)=>'<i class="'+(i===n?"on":"")+'"></i>').join("")+'</div><button class="go" type="button">'+(last?"يلا نبدأ":"التالي")+'</button>';
    w.querySelector(".sk").onclick=done;w.querySelector(".go").onclick=()=>{if(last)done();else{n++;draw()}}}
  function done(){try{localStorage.setItem(KEY,"1")}catch(e){}w.remove()}
  draw();document.body.appendChild(w)}
function sess(){try{return !!localStorage.getItem("yomak_sb")}catch(e){return true}}
function check(){
  try{if(localStorage.getItem(KEY))return;
    if(sess()){localStorage.setItem(KEY,"1");return}
    const ob=document.getElementById("onboard");if(ob&&!ob.classList.contains("hide"))show();else localStorage.setItem(KEY,"1")}catch(e){}}
setTimeout(check,400);
// footer text on the first screen
setTimeout(()=>{try{document.querySelectorAll("#onboard *").forEach(e=>{if(e.children.length===0&&/نسخة اختبار/.test(e.textContent))e.textContent="يومك · كل يومك أسهل"})}catch(e){}},900);
})();
