/* YOMAK v17: install prompt (Android + iPhone steps) and invite/share (code only, no database) */
(function(){
const LS="yomak_inst";
const ua=navigator.userAgent||"",ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1),android=/Android/i.test(ua);
const standalone=()=>{try{return window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
let evt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();evt=e});
window.addEventListener("appinstalled",()=>{evt=null;try{localStorage.setItem(LS,JSON.stringify({done:1}))}catch(x){}try{msg("تم تثبيت يومك ✅")}catch(x){}});
const st=()=>{try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return{}}};
const link=()=>{let r="";try{const s=cs();r=s&&s.uid?("?ref="+String(s.uid).slice(0,8)):""}catch(e){}return "https://yomak-app.github.io/"+r};
const inviteText=()=>"جرّب تطبيق يومك 👋 مهامك وصلاتك ومصروفاتك وسوق مستعمل وجروبات للمصريين والعرب، كله في مكان واحد وببلاش. افتحه وثبّته على موبايلك:\n"+link();
function stepsHtml(){
  const a='<ol style="line-height:2;padding-inline-start:20px"><li>افتح الرابط في <b>Chrome</b></li><li>اضغط على النقط الثلاث <b>⋮</b> فوق</li><li>اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b></li><li>اضغط <b>تثبيت</b>، والأيقونة هتظهر عندك</li></ol>';
  const i='<ol style="line-height:2;padding-inline-start:20px"><li>افتح الرابط في <b>Safari</b> (مش داخل واتساب أو فيسبوك)</li><li>اضغط زر المشاركة <b>⬆️</b> تحت</li><li>انزل واختر <b>إضافة إلى الشاشة الرئيسية</b></li><li>اضغط <b>إضافة</b></li></ol><p class="muted">على الآيفون الإشعارات بتشتغل بعد التثبيت بالطريقة دي فقط.</p>';
  return {a,i}}
window.ykInstall=async function(){
  if(evt){try{evt.prompt();const r=await evt.userChoice;evt=null;if(r&&r.outcome==="accepted")msg("جاري التثبيت…");return}catch(e){}}
  ykSteps()};
window.ykSteps=function(tab){const s=stepsHtml(),t=tab||(ios?"i":"a");
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>📲 ثبّت يومك على موبايلك</h3><p class="muted">بتفتحه بضغطة من الشاشة الرئيسية زي أي تطبيق، وبيشتغل أسرع ومعاه الإشعارات.</p>'+
   '<div class="seg"><button class="'+(t==="a"?"on":"")+'" onclick="ykSteps(\'a\')">🤖 أندرويد</button><button class="'+(t==="i"?"on":"")+'" onclick="ykSteps(\'i\')">🍎 آيفون</button></div>'+s[t]+
   '<button class="secondary" onclick="ykInvite()">📤 ابعت الرابط لصاحبك</button>')};
window.ykInstDismiss=function(){try{localStorage.setItem(LS,JSON.stringify({...st(),until:Date.now()+7*864e5}))}catch(e){}try{render()}catch(e){}};
window.ykInvite=async function(){const text=inviteText();
  if(navigator.share){try{await navigator.share({title:"يومك YOMAK",text:text.split("\n")[0],url:link()});return}catch(e){if(e&&e.name==="AbortError")return}}
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>📤 ادعُ أصحابك</h3><div class="card" style="white-space:pre-wrap;overflow-wrap:anywhere" id="invTxt">'+esc(text)+'</div>'+
   '<a class="primary" style="display:block;text-align:center;text-decoration:none;line-height:20px" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(text)+'">واتساب</a>'+
   '<button class="secondary" style="margin-top:8px" onclick="ykCopy()">📋 نسخ الرسالة</button>')};
window.ykCopy=async function(){try{await navigator.clipboard.writeText(inviteText());msg("تم النسخ ✅")}catch(e){const r=document.createRange();r.selectNodeContents(document.getElementById("invTxt"));const s=getSelection();s.removeAllRanges();s.addRange(r);msg("حدد النص وانسخه")}};
function card(){
  const s=st();
  if(standalone())return '<div class="card row between"><span><b>📤 ادعُ أصحابك</b><small class="muted" style="display:block">كل ما زادوا، الجروبات والسوق بقوا أحلى</small></span><button class="chip on" onclick="ykInvite()">دعوة</button></div>';
  if(s.done||(s.until&&s.until>Date.now()))return "";
  return '<div class="card" style="border-color:var(--gold)"><div class="row between"><b>📲 ثبّت يومك على موبايلك</b><button class="close" style="float:none;width:36px;height:36px;font-size:18px" aria-label="لاحقًا" onclick="ykInstDismiss()">×</button></div>'+
   '<p class="muted" style="margin:6px 0">أيقونة على الشاشة الرئيسية، فتح أسرع، وإشعارات.</p><div class="row"><button class="primary" onclick="ykInstall()">تثبيت</button><button class="secondary" onclick="ykInvite()">دعوة صاحب</button></div></div>'}
const _fh=window.feedHome;
if(typeof _fh==="function")window.feedHome=function(){const h=_fh.apply(this,arguments);return card()+h};
const _pf=window.profile;
if(typeof _pf==="function")window.profile=function(){let h=_pf.apply(this,arguments);
  return h+'<div class="section"><h3>📲 التطبيق</h3></div><div class="fact">'+(standalone()?"":'<button class="fchip" onclick="ykInstall()">📲 تثبيت التطبيق</button>')+'<button class="fchip" onclick="ykInvite()">📤 ادعُ أصحابك</button></div>'};
if(typeof PAGES!=="undefined"&&PAGES.settings){const _r=PAGES.settings.render;
  PAGES.settings.render=function(){return _r.apply(this,arguments)+'<div class="card"><b>📲 التثبيت والدعوة</b><p class="muted">ثبّت يومك على الشاشة الرئيسية وادعُ أصحابك.</p>'+(standalone()?'<p class="muted">✅ التطبيق مثبّت</p>':'<button class="primary" onclick="ykInstall()">طريقة التثبيت</button>')+'<button class="secondary" style="margin-top:8px" onclick="ykInvite()">📤 ادعُ أصحابك</button></div>'}}
})();
