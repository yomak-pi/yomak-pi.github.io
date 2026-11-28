/* v90: two-step login (TOTP authenticator app) via Supabase MFA: enroll/remove in settings, code prompt at sign-in when enabled. */
(function(){
if(typeof PAGES==="undefined")return;
const E=(x)=>esc(x==null?"":String(x));
const jwt=(t)=>{try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch(e){return {}}};
const M={f:undefined,enr:null};
async function tok(){const s=cs();if(!s)return null;if(s.exp-30<Date.now()/1e3){try{await sb("/rest/v1/rpc/staff_role",{method:"POST",body:{}})}catch(e){}}const n=cs();return n?n.access:null}
async function factors(){const t=await tok();if(!t)return[];try{const u=await sbRaw("/auth/v1/user",{token:t});return(u.factors||[]).filter(f=>f.factor_type==="totp"&&f.status==="verified")}catch(e){return[]}}
/* gate */
let lastTok="",busy=false;
async function gate(){
  const s=cs();if(!s||busy||s.access===lastTok)return;
  const c=jwt(s.access);if(c.aal==="aal2"){lastTok=s.access;return}
  busy=true;const f=await factors();busy=false;lastTok=cs()?cs().access:"";
  if(f.length)prompt(f[0].id)}
function prompt(fid){
  if(document.getElementById("ykMfa"))return;
  const d=document.createElement("div");d.id="ykMfa";d.style.cssText="position:fixed;inset:0;z-index:99999;background:#0f302d;display:flex;align-items:center;justify-content:center;padding:20px";
  d.innerHTML='<div class="card" style="max-width:340px;width:100%;text-align:center"><b style="font-size:18px">تسجيل الدخول بخطوتين</b><p class="muted">اكتب الكود المكوّن من 6 أرقام من تطبيق المصادقة.</p><input class="input" id="mfaC" inputmode="numeric" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:20px"><button class="primary" style="margin-top:10px;width:100%" onclick="ykMfaGo(\''+fid+'\')">تأكيد</button><button class="secondary" style="margin-top:8px;width:100%" onclick="ykMfaOut()">خروج</button></div>';
  document.body.appendChild(d)}
window.ykMfaOut=function(){try{setCs(null)}catch(e){}location.reload()};
window.ykMfaGo=async function(fid){
  const code=((document.getElementById("mfaC")||{}).value||"").trim();if(!/^\d{6}$/.test(code))return msg("الكود 6 أرقام");
  try{const t=await tok();
    const ch=await sbRaw("/auth/v1/factors/"+fid+"/challenge",{method:"POST",token:t,body:{}});
    const r=await sbRaw("/auth/v1/factors/"+fid+"/verify",{method:"POST",token:t,body:{challenge_id:ch.id,code:code}});
    const old=cs();saveSess(r,old&&old.name);lastTok=cs().access;
    const el=document.getElementById("ykMfa");if(el)el.remove();msg("تم")
  }catch(e){msg("الكود غلط، جرّب تاني")}};
setInterval(gate,3000);setTimeout(gate,1200);
/* settings page */
PAGES.mfa={title:()=>"تسجيل الدخول بخطوتين",render:()=>{
  if(!cs())return authCard();
  if(M.f===undefined){setTimeout(load,0);return '<p class="muted">جاري التحميل…</p>'}
  if(M.enr)return '<div class="card" style="text-align:center"><p>1) افتح تطبيق مصادقة (Google Authenticator أو غيره) وامسح الكود، أو اكتب المفتاح يدويًا.</p><img alt="" src="'+E(M.enr.qr)+'" style="width:200px;height:200px;background:#fff;padding:6px;border-radius:12px"><p class="muted" style="overflow-wrap:anywhere;direction:ltr">'+E(M.enr.secret)+'</p><p>2) اكتب الكود اللي ظهر في التطبيق:</p><input class="input" id="mfaE" inputmode="numeric" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px"><button class="primary" style="margin-top:10px;width:100%" onclick="ykMfaOn()">تفعيل</button></div>';
  if(M.f.length)return '<div class="card"><b>✅ مفعّل</b><p class="muted">بيتطلب كود من التطبيق كل ما تسجل دخول من جهاز جديد.</p><button class="secondary" onclick="ykMfaOff(\''+M.f[0].id+'\')">إيقاف</button></div>';
  return '<div class="card"><p class="muted">حمي حسابك بخطوة تانية: كود يتغير كل 30 ثانية من تطبيق على موبايلك. مجاني.</p><button class="primary" onclick="ykMfaStart()">تفعيل</button></div>'}};
async function load(){M.f=await factors();try{if(curPage()==="mfa")renderPage()}catch(e){}}
window.ykMfaStart=async function(){try{const t=await tok();
  const old=(await sbRaw("/auth/v1/user",{token:t})).factors||[];for(const f of old)if(f.status!=="verified")try{await sbRaw("/auth/v1/factors/"+f.id,{method:"DELETE",token:t})}catch(e){}
  const r=await sbRaw("/auth/v1/factors",{method:"POST",token:t,body:{factor_type:"totp",friendly_name:"Yomak "+Date.now()}});
  M.enr={id:r.id,qr:r.totp.qr_code,secret:r.totp.secret};renderPage()}catch(e){msg("مش متاح دلوقتي")}};
window.ykMfaOn=async function(){const code=((document.getElementById("mfaE")||{}).value||"").trim();if(!/^\d{6}$/.test(code))return msg("الكود 6 أرقام");
  try{const t=await tok();const ch=await sbRaw("/auth/v1/factors/"+M.enr.id+"/challenge",{method:"POST",token:t,body:{}});
  const r=await sbRaw("/auth/v1/factors/"+M.enr.id+"/verify",{method:"POST",token:t,body:{challenge_id:ch.id,code:code}});
  const old=cs();saveSess(r,old&&old.name);M.enr=null;M.f=undefined;msg("اتفعّل");renderPage()}catch(e){msg("الكود غلط")}};
window.ykMfaOff=async function(id){if(!confirm("إيقاف الخطوتين؟"))return;
  try{const t=await tok();await sbRaw("/auth/v1/factors/"+id,{method:"DELETE",token:t});M.f=undefined;msg("اتوقف");renderPage()}catch(e){msg("لازم تدخل بالكود الأول (حاول تسجّل خروج وتدخل)")}};
const _s=PAGES.settings&&PAGES.settings.render;
if(_s)PAGES.settings.render=function(){let h=_s.apply(this,arguments);
  if(cs())h+='<div class="card"><b>🔐 تسجيل الدخول بخطوتين</b><p class="muted">حماية إضافية لحسابك.</p><button class="secondary" onclick="openPage(\'mfa\')">فتح</button></div>';return h};
})();
