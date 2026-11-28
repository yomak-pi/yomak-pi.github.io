/* v89: moderation: staff roles (moderator, support), appeals, blocked-words list, staff page. Account deletion also removes the user's uploaded files. */
(function(){
if(typeof PAGES==="undefined")return;
const T={role:undefined,appeals:null,mine:null,reports:null,words:null,found:null,tab:"reports"};
async function role(){
  if(!cs()){T.role=null;return null}
  if(T.role!==undefined)return T.role;
  try{T.role=(await sb("/rest/v1/rpc/staff_role",{method:"POST",body:{}}))||null}catch(e){T.role=null}
  return T.role;
}
setTimeout(role,4000);
const E=(x)=>esc(x==null?"":String(x));
const RN={admin:"مدير",moderator:"مشرف محتوى",support:"دعم"};
/* user side: appeal */
PAGES.appeal={title:()=>"اعتراض على قرار",render:()=>{
  if(!cs())return authCard();
  if(T.mine===null)setTimeout(loadMine,0);
  const L=(T.mine||[]).map(a=>'<div class="card"><b>'+({ban:"حظر",content:"محتوى",other:"أخرى"}[a.kind]||"")+'</b> · <span class="muted">'+({open:"قيد المراجعة",accepted:"تم القبول",rejected:"مرفوض"}[a.status]||"")+'</span><p style="margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere">'+E(a.body)+'</p>'+(a.response?'<p class="muted">رد الفريق: '+E(a.response)+'</p>':"")+'</div>').join("");
  return '<div class="card"><p class="muted">لو شايف إن قرار حظر أو حذف محتوى غلط، اكتب اعتراضك وفريق الدعم هيراجعه ويرد عليك هنا.</p><select class="input" id="apK"><option value="ban">حظر على حسابي</option><option value="content">حذف أو إخفاء محتوى</option><option value="other">حاجة تانية</option></select><textarea class="input" id="apB" rows="4" maxlength="1000" placeholder="اشرح الموضوع…" style="margin-top:8px"></textarea><button class="primary" style="margin-top:8px" onclick="ykApSend()">إرسال الاعتراض</button></div>'+(T.mine===null?'<p class="muted">جاري التحميل…</p>':L)}};
async function loadMine(){try{T.mine=(await sb("/rest/v1/appeals?select=*&order=id.desc&limit=20"))||[]}catch(e){T.mine=[]}try{if(curPage()==="appeal")renderPage()}catch(e){}}
window.ykApSend=async function(){
  const b=((document.getElementById("apB")||{}).value||"").trim(),k=(document.getElementById("apK")||{}).value||"other";
  if(b.length<5)return msg("اكتب تفاصيل أكتر");
  try{await sb("/rest/v1/appeals",{method:"POST",prefer:"return=minimal",body:{kind:k,body:b}});msg("وصل اعتراضك");T.mine=null;renderPage()}catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
/* staff page */
PAGES.staff={title:()=>"فريق الإشراف",render:()=>{
  const r=T.role;if(!r)return '<p class="muted">مش متاح لحسابك.</p>';
  const tabs=[];if(r==="admin"||r==="moderator")tabs.push(["reports","البلاغات"]);if(r==="admin"||r==="support")tabs.push(["appeals","الاعتراضات"]);if(r==="admin")tabs.push(["team","الفريق"],["words","الكلمات"]);
  if(!tabs.some(x=>x[0]===T.tab))T.tab=tabs[0][0];
  setTimeout(loadTab,0);
  return '<div class="chips" style="margin-bottom:10px">'+tabs.map(x=>'<button class="chip'+(T.tab===x[0]?" on":"")+'" onclick="ykStTab(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div><div id="ykStBody">'+body()+'</div>'}};
window.ykStTab=function(t){T.tab=t;T[t==="reports"?"reports":t==="appeals"?"appeals":t==="words"?"words":"found"]=t==="team"?[]:null;renderPage()};
async function loadTab(){
  try{
    if(T.tab==="reports"&&T.reports===null)T.reports=(await sb("/rest/v1/reports?select=id,kind,target,reason,snapshot,created_at,status&status=eq.open&order=id.desc&limit=30"))||[];
    if(T.tab==="appeals"&&T.appeals===null)T.appeals=(await sb("/rest/v1/appeals?select=*&status=eq.open&order=id.asc&limit=30"))||[];
    if(T.tab==="words"&&T.words===null)T.words=(await sb("/rest/v1/blocked_words?select=word&order=word"))||[];
  }catch(e){T[T.tab]=[]}
  const b=document.getElementById("ykStBody");if(b)b.innerHTML=body();
}
function body(){
  if(T.tab==="reports"){if(T.reports===null)return '<p class="muted">جاري التحميل…</p>';if(!T.reports.length)return '<p class="muted">مفيش بلاغات مفتوحة.</p>';
    return T.reports.map(r=>'<div class="card"><b>'+E(r.kind)+'</b> <span class="muted">'+E((r.created_at||"").slice(0,10))+'</span><p style="white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0">'+E(r.snapshot||r.reason||"")+'</p><div class="chips">'+(r.kind==="post"&&/^[0-9a-f-]{36}$/i.test(r.target||"")?'<button class="chip" onclick="ykRepAct('+Number(r.id)+',\'hide\')">🙈 إخفاء المنشور</button>':"")+'<button class="chip" onclick="ykRepAct('+Number(r.id)+',\'done\')">✔ تمت</button><button class="chip" onclick="ykRepAct('+Number(r.id)+',\'dismissed\')">تجاهل</button></div></div>').join("")}
  if(T.tab==="appeals"){if(T.appeals===null)return '<p class="muted">جاري التحميل…</p>';if(!T.appeals.length)return '<p class="muted">مفيش اعتراضات مفتوحة.</p>';
    return T.appeals.map(a=>'<div class="card"><b>'+({ban:"حظر",content:"محتوى",other:"أخرى"}[a.kind]||"")+'</b> <span class="muted">'+E((a.created_at||"").slice(0,10))+'</span><p style="white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0">'+E(a.body)+'</p><input class="input" id="apN'+a.id+'" placeholder="ردك على المستخدم" maxlength="400"><div class="chips" style="margin-top:6px"><button class="chip" onclick="ykApAct('+Number(a.id)+',true)">قبول</button><button class="chip" onclick="ykApAct('+Number(a.id)+',false)">رفض</button></div></div>').join("")}
  if(T.tab==="team"){return '<div class="card"><input class="input" id="tmQ" placeholder="ابحث باسم المستخدم" oninput="ykTmFind(this.value)"><div id="tmL">'+tmList()+'</div></div>'}
  if(T.tab==="words"){if(T.words===null)return '<p class="muted">جاري التحميل…</p>';return '<div class="card"><p class="muted">أي منشور أو تعليق أو رسالة فيها واحدة من الكلمات دي بيترفض (الفريق مستثنى).</p><div class="row"><input class="input" id="bwN" maxlength="40" placeholder="كلمة جديدة" style="flex:1"><button class="chip on" onclick="ykBwAdd()">إضافة</button></div><div class="chips" style="margin-top:8px;flex-wrap:wrap">'+T.words.map(w=>'<button class="chip" onclick="ykBwDel(this.dataset.w)" data-w="'+E(w.word)+'">'+E(w.word)+' ✕</button>').join("")+'</div></div>'}
  return"";
}
const tmList=()=>(T.found||[]).map(p=>'<div class="card" style="margin:8px 0"><b>'+E(p.name)+'</b> <span class="muted">'+E(p.city||"")+'</span><div class="chips" style="margin-top:6px"><button class="chip" onclick="ykTmSet(\''+p.id+'\',\'moderator\')">مشرف</button><button class="chip" onclick="ykTmSet(\''+p.id+'\',\'support\')">دعم</button><button class="chip" onclick="ykTmSet(\''+p.id+'\',\'none\')">إزالة</button></div></div>').join("");
let tq=0;
window.ykTmFind=function(q){clearTimeout(tq);tq=setTimeout(async function(){q=(q||"").trim().replace(/[%*,()]/g,"");if(q.length<2){T.found=[];const l=document.getElementById("tmL");if(l)l.innerHTML="";return}try{T.found=(await sb("/rest/v1/profiles?select=id,name,city&name=ilike.*"+encodeURIComponent(q)+"*&limit=8"))||[]}catch(e){T.found=[]}const l=document.getElementById("tmL");if(l)l.innerHTML=tmList()},350)};
window.ykTmSet=async function(id,r){try{await sb("/rest/v1/rpc/admin_set_staff",{method:"POST",body:{uid:id,r:r}});msg(r==="none"?"تمت الإزالة":"تم التعيين")}catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
window.ykRepAct=async function(id,a){
  try{
    const r=(T.reports||[]).find(x=>Number(x.id)===Number(id));
    if(a==="hide"&&r){if(!confirm("إخفاء المنشور عن الناس؟"))return;await sb("/rest/v1/rpc/admin_hide_post",{method:"POST",body:{pid:r.target,hide:true}})}
    await sb("/rest/v1/reports?id=eq."+Number(id),{method:"PATCH",prefer:"return=minimal",body:{status:a==="dismissed"?"dismissed":"done"}});
    T.reports=null;renderPage();msg("تم")
  }catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
window.ykApAct=async function(id,ok){
  const n=((document.getElementById("apN"+id)||{}).value||"").trim();
  try{await sb("/rest/v1/rpc/resolve_appeal",{method:"POST",body:{aid:id,accept:ok,note:n}});T.appeals=null;renderPage();msg(ok?"تم القبول":"تم الرفض")}catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
window.ykBwAdd=async function(){const w=((document.getElementById("bwN")||{}).value||"").trim().toLowerCase();if(w.length<2)return;try{await sb("/rest/v1/blocked_words?on_conflict=word",{method:"POST",prefer:"resolution=ignore-duplicates,return=minimal",body:{word:w}});T.words=null;renderPage()}catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
window.ykBwDel=async function(w){try{await sb("/rest/v1/blocked_words?word=eq."+encodeURIComponent(w),{method:"DELETE",prefer:"return=minimal"});T.words=null;renderPage()}catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}};
/* entry points */
const _s=PAGES.settings&&PAGES.settings.render;
if(_s)PAGES.settings.render=function(){let h=_s.apply(this,arguments);
  if(cs())h+='<div class="card"><b>📨 اعتراض على قرار</b><p class="muted">حظر أو حذف محتوى حصل غلط؟</p><button class="secondary" onclick="openPage(\'appeal\')">قدّم اعتراض</button></div>';
  if(T.role)h+='<div class="card"><b>🛡 فريق الإشراف ('+(RN[T.role]||"")+')</b><button class="secondary" style="margin-top:8px" onclick="openPage(\'staff\')">فتح</button></div>';
  return h};
/* account deletion also removes uploaded files */
const _d=window.ykDelGo;
window.ykDelGo=async function(){
  const v=((document.getElementById("ykDelIn")||{}).value||"").trim();if(v!=="حذف")return msg("اكتب كلمة حذف للتأكيد");
  try{const u=cs().uid;
    for(const b of ["post-images","chat-media","cvs","reels"]){
      try{
        const l=(await sb("/storage/v1/object/list/"+b,{method:"POST",body:{prefix:u,limit:1000}}))||[];
        const p=l.filter(x=>x&&x.name).map(x=>u+"/"+x.name);
        if(p.length)await sb("/storage/v1/object/"+b,{method:"DELETE",body:{prefixes:p}});
      }catch(e){}
    }
  }catch(e){}
  return _d?_d.apply(this,arguments):0;
};
})();
