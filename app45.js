/* Editions. Pi mode (yomak-pi site or ?edition=pi) follows the Pi Mainnet listing rules:
   Pi sign-in only, no redirects to external sites, no email/phone collection at sign-in.
   The public edition is untouched. */
(function(){
const HOSTPI=/^yomak-pi\./i.test(location.hostname)||/[?&]edition=pi\b/.test(location.search);
window.YOMAK_PI=HOSTPI;
if(!window.YOMAK_PI){
  /* Public edition: no Pi sign-in button. */
  const ob=window.oauthBtns;
  window.oauthBtns=function(){return ob().replace(/<button[^>]*piLogin\(\)[^>]*>[^<]*<\/button>/,"").replace(/<button[^>]*Pi Network[^>]*>[^<]*<\/button>/,"")};
  return;
}
document.documentElement.classList.add("pimode");
const st=document.createElement("style");
st.textContent='.pimode a[href^="mailto:"],.pimode a[href^="tel:"],.pimode a[href^="sms:"],.pimode a[href*="wa.me"],.pimode a[href*="openstreetmap.org"],.pimode a[href*="facebook.com"],.pimode a[href^="http"]:not([href*="yomak"]):not([href^="blob"]){display:none!important}.pimode [data-ext]{display:none!important}';
document.head.appendChild(st);
const piBtn='<div class="oauth"><button class="primary" type="button" onclick="piLogin()">🟣 الدخول بحساب Pi</button></div><p class="muted" style="margin:8px 2px">الدخول في نسخة Pi بحساب Pi فقط. مش بنطلب بريد ولا رقم موبايل.</p>';
window.oauthBtns=()=>piBtn;
const ag=window.authModal;
window.authModal=function(m){
  if(typeof openModal==="function")openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>تسجيل الدخول</h3>'+piBtn);
  else return ag.apply(this,arguments);
};
const gm=window.gateMode;
window.gateMode=function(){
  const t=el("gate");if(!t)return;
  t.innerHTML='<div class="gbox"><div class="onbrand">يومك <small>YOMAK</small></div><h1>أهلًا بيك</h1><p class="muted">سجّل دخولك بحساب Pi وابدأ.</p>'+piBtn+'</div>';
};

/* Pi mode asks for no phone number, website or email in forms. */
const HID=["sPhone","mPhone","jbPh","rgP","rqP","pgPhone","pgWeb","pgMail","sWa","mWa","rgW","jbCPh"];
function hideFields(){
  HID.forEach(id=>{const e=document.getElementById(id);if(!e||e.dataset.pihid)return;e.dataset.pihid=1;
    const l=document.querySelector('label[for="'+id+'"]');if(l)l.style.display="none";
    const p=e.closest("label.chkrow,label.chk,.chk");(p||e).style.display="none"});
}
new MutationObserver(hideFields).observe(document.documentElement,{childList:true,subtree:true});
/* No navigation to outside sites from inside the app. */
const wo=window.open;
const EXT=/^(mailto|tel|sms|whatsapp|intent|fb|geo):/i;
window.open=function(u){
  if(EXT.test(String(u))){if(window.msg)msg("الرابط ده خارج التطبيق وعشان كده متقفل في نسخة Pi");return null}
  try{const x=new URL(u,location.href);
    if(/^https?:$/.test(x.protocol)&&x.origin!==location.origin&&!/\.supabase\.co$/.test(x.hostname)){if(window.msg)msg("الرابط ده خارج التطبيق وعشان كده متقفل في نسخة Pi");return null}
  }catch(e){}
  return wo.apply(this,arguments);
};
document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest("a[href]");if(!a)return;
  if(EXT.test(a.getAttribute("href")||"")){e.preventDefault();e.stopPropagation();if(window.msg)msg("الرابط ده خارج التطبيق وعشان كده متقفل في نسخة Pi");return}
  let x;try{x=new URL(a.href,location.href)}catch(_){return}
  if(/^https?:$/.test(x.protocol)&&x.origin!==location.origin&&!/\.supabase\.co$/.test(x.hostname)){e.preventDefault();e.stopPropagation();if(window.msg)msg("الرابط ده خارج التطبيق وعشان كده متقفل في نسخة Pi")}
},true);
})();
