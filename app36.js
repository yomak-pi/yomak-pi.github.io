/* Phase 6: Messenger-style message controls (DM + group chat): menu, unsend, remove for you, edit, pin, forward, select,
   reply jump, seen line, link cards, message requests, block, disappearing messages, delete conversation. */
cl.hid={d:new Set(),g:new Set()};cl.blocks=new Set();cl.sel=null;cl.sent=new Set();cl.friendIds=new Set();
const mcEsc=esc,mcN=x=>Number(x)||0;
function mcK(){return curDm()?"d":(curGroup()&&cl.tab==="chat"?"g":"")}
function mcList(k){return(k==="d"?cl.dmMsgs:cl.msgs)||[]}
function mcBox(k){return el(k==="d"?"dmsgs":"msgs")}
function mcFind(k,id){return mcList(k).find(m=>m.id+""===id+"")}
function mcPref(k){const c=k==="d"?curDm():null;return c?(cl.prefs["d:"+c.id]||{}):{}}
function mcOther(){const c=curDm();if(!c)return"";const r=(cl.dm||[]).find(x=>x.id===c.id);return r?dmOther(r):""}
function mcIsReq(chatId){
  const pr=cl.prefs["d:"+chatId]||{};if(pr.accepted||cl.sent.has(chatId))return false;
  const r=(cl.dm||[]).find(x=>x.id===chatId);if(!r)return false;
  const l=cl.lastD&&cl.lastD[chatId];if(!l||l.user_id===dmMeUid())return false;
  return !cl.friendIds.has(dmOther(r));
}
function mcDeleted(chatId){const pr=cl.prefs["d:"+chatId]||{},l=cl.lastD&&cl.lastD[chatId];return!!(pr.cleared_upto&&(!l||mcN(l.id)<=mcN(pr.cleared_upto)))}
function mcExpired(m){return m.expires_at&&new Date(m.expires_at).getTime()<Date.now()}
function mcUnsent(m){return !!m.unsent_at||(m.body==="·"&&(m.kind||"text")==="text")}
function mcName(k,m){return m.user_id===dmMeUid()?"أنت":((cl.pp[m.user_id]||{}).name||(k==="d"?(curDm()||{}).name:"")||"مستخدم")}
const mcQuote=(k,r)=>!r?"رسالة غير متاحة":mcUnsent(r)?"🚫 رسالة ملغاة":r.kind==="voice"?"🎤 رسالة صوتية":r.kind==="image"?"📷 صورة":(r.body||"").slice(0,80);
function mcLink(t){return mcEsc(t).replace(/https?:\/\/[^\s<>"']+/g,u=>'<a href="'+u+'" target="_blank" rel="noopener noreferrer" dir="ltr">'+u+'</a>')}
function mcDisText(secs){secs=mcN(secs);return secs<=0?"إيقاف":secs<172800?"24 ساعة":secs<1209600?"7 أيام":"90 يوم"}
function mcDay(d){const t=new Date(d),n=new Date;if(t.toDateString()===n.toDateString())return"اليوم";const y=new Date(n-864e5);if(t.toDateString()===y.toDateString())return"امبارح";return t.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"})}
function mcFull(d){return new Date(d).toLocaleString("ar-EG",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
function mcHtml(k){
  const me=dmMeUid(),cur=k==="d"?curDm():null,clr=k==="d"&&cur?mcN((cl.prefs["d:"+cur.id]||{}).cleared_upto):0;
  const vis=mcList(k).filter(m=>!cl.hid[k].has(mcN(m.id))&&!mcExpired(m)&&mcN(m.id)>clr);
  if(!vis.length)return '<p class="muted">ابدأ المحادثة…</p>';
  let day="",out="";const lastMine=[...vis].reverse().find(m=>m.user_id===me&&(m.kind||"text")!=="system"&&!mcUnsent(m));
  vis.forEach(t=>{
    const dd=new Date(t.created_at).toDateString();
    if(dd!==day){day=dd;out+='<div class="mcday">'+mcDay(t.created_at)+'</div>'}
    const mine=t.user_id===me,id=mcEsc(t.id);
    if((t.kind||"text")==="system"){
      const s=(t.body||"").split(":")[1];
      out+='<div class="mcsys">⏳ '+mcEsc(mcName(k,t))+(mcN(s)>0?" فعّل الرسائل المؤقتة: "+mcDisText(s):" أوقف الرسائل المؤقتة")+'</div>';return;
    }
    const sel=cl.sel,chk=sel?'<span class="mcchk'+(sel.has(id)?" on":"")+'" aria-hidden="true">'+(sel.has(id)?"✓":"")+'</span>':"";
    if(mcUnsent(t)){
      out+='<div class="mrow'+(mine?" me":"")+'">'+chk+'<div class="bub mcun" data-mid="'+id+'">🚫 '+(mine?"أنت ألغيت إرسال رسالة":mcEsc(mcName(k,t))+" ألغى إرسال رسالة")+'</div><button class="mcdots" data-mid="'+id+'" aria-label="خيارات">⋯</button></div>';return;
    }
    const n=cl.pp[t.user_id]||{id:t.user_id,name:(t.profiles&&t.profiles.name)||""},rep=t.reply_to?mcFind(k,t.reply_to):null;
    const rx=(k==="d"?cl.dmRx:cl.gmRx)[t.id]||{},cnt={};Object.values(rx).forEach(e=>cnt[e]=(cnt[e]||0)+1);
    const chips=Object.keys(cnt).length?'<div class="dmrxs">'+Object.keys(cnt).map(e=>'<span>'+e+(cnt[e]>1?" "+an(cnt[e]):"")+'</span>').join("")+'</div>':"";
    let body=dmBody(t);if((t.kind||"text")==="text"){body='<div>'+mcLink(t.body)+'</div>';const u=(t.body||"").match(/https?:\/\/[^\s<>"']+/);if(u&&window.lkCard)body+=lkCard(u[0])}
    const pin=t.pinned_at?'<span class="mcpinm">📌</span>':"";
    out+='<div class="mrow'+(mine?" me":"")+'" data-row="'+id+'">'+chk+(k==="g"&&!mine?avHtml(n,30):"")+
      '<div class="bub'+(mine?" me":"")+(cl.tmOpen===id+""?" tmopen":"")+'" data-mid="'+id+'">'+
      (k==="g"&&!mine?'<span class="sn">'+mcEsc(n.name||"")+(typeof vfMark==="function"?vfMark(n):"")+'</span>':"")+
      (t.forwarded?'<small class="mcfwd">↪ تم تحويلها</small>':"")+
      (t.reply_to?'<div class="dmq" onclick="event.stopPropagation();mcJump(\''+mcEsc(t.reply_to)+'\')">'+mcEsc(mcQuote(k,rep))+'</div>':"")+
      body+'<small class="tm">'+mcFull(t.created_at)+(t.edited_at?" · تم التعديل":"")+'</small>'+(t.edited_at?'<small class="mcedit">تم التعديل</small>':"")+pin+chips+'</div>'+
      '<button class="mcdots" data-mid="'+id+'" aria-label="خيارات الرسالة">⋯</button></div>';
    if(lastMine&&lastMine.id===t.id){
      if(k==="d")out+='<div class="mcseen">'+(mcN(cl.dmSeen)>=mcN(t.id)?"✓✓ تمت المشاهدة":"✓ تم الإرسال")+'</div>';
      else{const c=Object.keys(cl.gmSeen||{}).filter(u=>u!==me&&mcN(cl.gmSeen[u])>=mcN(t.id)).length;out+='<div class="mcseen">'+(c?"✓✓ شاهدها "+an(c):"✓ تم الإرسال")+'</div>'}
    }
  });
  return out;
}
window.dmHtml=()=>mcHtml("d");window.msgHtml=()=>mcHtml("g");
window.dmTicks=()=>"";
function mcRedraw(keep){const k=mcK();if(!k)return;const c=mcBox(k);if(!c)return;const near=c.scrollHeight-c.scrollTop-c.clientHeight<80;c.innerHTML=mcHtml(k);if(keep||near)c.scrollTop=c.scrollHeight;mcTop();mcSelBar()}
/* top strip: pinned banner + chat options (DM) + request banner */
function mcTop(){
  const k=mcK(),t=el("mcTop");if(!t||!k)return;
  const pins=mcList(k).filter(m=>m.pinned_at&&!mcUnsent(m)).sort((a,b)=>new Date(b.pinned_at)-new Date(a.pinned_at));
  let h="";
  if(k==="d"){
    const c=curDm(),r=(cl.dm||[]).find(x=>x.id===c.id),secs=r&&r.disappear_secs,o=mcOther();
    h+='<div class="mcbar"><span class="muted">'+(secs?"⏳ رسائل مؤقتة: "+mcDisText(secs):"")+(cl.blocks.has(o)?" 🚫 محظور":"")+((cl.prefs["d:"+c.id]||{}).muted?" 🔕":"")+'</span><button class="pact mcopt" onclick="mcChatMenu()" aria-label="خيارات المحادثة">⋯ خيارات</button></div>';
    if(mcIsReq(c.id))h+='<div class="card mcreq"><b>📨 طلب رسالة</b><p class="muted">'+mcEsc(c.name||"")+' مش في أصدقائك. مش هيعرف إنك شفت الرسالة إلا لما تقبل.</p><div class="row" style="gap:6px"><button class="primary" onclick="mcAccept()">قبول</button><button class="secondary" onclick="mcDeleteChat()">حذف</button><button class="secondary" onclick="mcBlock()">حظر</button></div></div>';
  }
  if(pins.length)h+='<div class="mcpin" onclick="'+(pins.length>1?"mcPins()":"mcJump('"+mcEsc(pins[0].id)+"')")+'"><span>📌</span><span class="mcpt">'+mcEsc(mcQuote(k,pins[0]))+'</span>'+(pins.length>1?'<small>'+an(pins.length)+' مثبتة</small>':"")+'</div>';
  t.innerHTML=h;
}
function mcPins(){
  const k=mcK();closeModal();
  const pins=mcList(k).filter(m=>m.pinned_at&&!mcUnsent(m)).sort((a,b)=>new Date(b.pinned_at)-new Date(a.pinned_at));
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>الرسائل المثبتة</h3><div class="mcmenu">'+pins.map(m=>'<button onclick="closeModal();mcJump(\''+mcEsc(m.id)+'\')"><b>'+mcEsc(mcName(k,m))+'</b> <span class="muted">'+mcEsc(mcQuote(k,m))+'</span></button>').join("")+'</div>');
}
function mcJump(id){
  const k=mcK();if(!k)return;const r=mcBox(k)&&mcBox(k).querySelector('[data-row="'+id+'"]');
  if(!r)return msg("الرسالة قديمة، اسحب لفوق لتحميل الأقدم");
  r.scrollIntoView({block:"center",behavior:"smooth"});r.classList.add("mchl");setTimeout(()=>r.classList.remove("mchl"),1600);
}
/* ---------- menu ---------- */
function mcOpen(id){
  const k=mcK();if(!k)return;const m=mcFind(k,id);if(!m)return;
  if(cl.sel){return mcToggleSel(id)}
  const me=dmMeUid(),mine=m.user_id===me,un=mcUnsent(m),q=mcEsc(id),isText=(m.kind||"text")==="text";
  const mod=k==="g"&&typeof canMod==="function"&&canMod(curGroupObj());
  const age=Date.now()-new Date(m.created_at).getTime(),canEdit=mine&&isText&&!un&&age<15*60*1000&&mcN(m.edit_count)<5;
  const rx=(k==="d"?cl.dmRx:cl.gmRx)[m.id]||{},my=rx[me],rf=k==="d"?"dmReact":"gmReact";
  const it=(ic,tx,fn,cls)=>'<button'+(cls?' class="'+cls+'"':"")+' onclick="'+fn+'"><span>'+ic+'</span>'+tx+'</button>';
  let h='<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><div class="mcrx">'+(un?"":DMRX.map(e=>'<button type="button" title="'+DMRXL[e]+'" class="'+(my===e?"on":"")+'" onclick="'+rf+'(\''+q+'\',\''+e+'\')">'+e+'<small>'+DMRXL[e]+'</small></button>').join(""))+'</div><div class="mcmenu">';
  if(!un){
    h+=it("↩️","رد","closeModal();mcReply('"+q+"')");
    h+=it("↪️","تحويل","mcForward(['"+q+"'])");
    if(isText)h+=it("📋","نسخ","closeModal();copyText(mcFind('"+k+"','"+q+"').body)");
    h+=it("📌",m.pinned_at?"إلغاء التثبيت":"تثبيت","mcPin('"+q+"',"+(m.pinned_at?"false":"true")+")");
    if(canEdit)h+=it("✏️","تعديل (لمدة 15 دقيقة)","mcEdit('"+q+"')");
    if(Object.keys(rx).length&&k==="g")h+=it("😊","من تفاعل؟","gmWho('"+q+"')");
    h+=it("☑️","تحديد","mcSelStart('"+q+"')");
  }
  h+=it("🗑","إزالة من عندي","mcHide('"+q+"')");
  if(mine&&!un)h+=it("🚫","إلغاء الإرسال للجميع","mcUnsendAsk('"+q+"')","mcdanger");
  else if(mod&&!mine)h+=it("🚫","حذف للجميع (مشرف)","closeModal();delMsg('"+q+"')","mcdanger");
  if(!mine&&!un)h+=it("🚩","إبلاغ","closeModal();reportItem('"+(k==="d"?"dm":"message")+"','"+q+"')");
  openModal(h+'</div>');
}
window.dmSheet=id=>mcOpen(id);window.gmSheet=id=>mcOpen(id);
function mcReply(id){const k=mcK(),m=mcFind(k,id);if(!m)return;dmReplyTo={id:m.id,text:mcQuote(k,m)};dmReplyBar();const i=el("dBody");i&&i.focus()}
async function mcRefresh(){const k=mcK();if(k==="d"){const c=curDm();c&&await loadDmMsgs(c.id)}else if(k==="g"){const g=curGroup();g&&await loadMsgs(g.id)}mcRedraw()}
async function mcPin(id,flag){
  closeModal();const k=mcK();
  try{await sb("/rest/v1/rpc/msg_pin",{method:"POST",body:{k,mid:Number(id),flag}});const m=mcFind(k,id);if(m)m.pinned_at=flag?new Date().toISOString():null;mcRedraw();msg(flag?"تم التثبيت 📌":"تم إلغاء التثبيت");mcRefresh()}catch(e){msg(sbErr(e).slice(0,90))}
}
function mcEdit(id){
  closeModal();const k=mcK(),m=mcFind(k,id);if(!m)return;
  formModal("✏️ تعديل الرسالة",inp("mcEd","النص",m.body,{area:1,max:1e3,rows:4})+'<p class="muted">تقدر تعدّل لحد 15 دقيقة من الإرسال وحتى 5 مرات.</p>',()=>(mcEditSave(id),!1),{save:"حفظ"});
}
async function mcEditSave(id){
  const k=mcK(),t=val("mcEd");if(!t)return;
  try{await sb("/rest/v1/rpc/msg_edit",{method:"POST",body:{k,mid:Number(id),txt:t}});closeModal();await mcRefresh();msg("تم التعديل ✅")}
  catch(e){msg(/window|edit/i.test(sbErr(e))?"انتهت مدة التعديل (15 دقيقة)":sbErr(e).slice(0,90))}
}
function mcUnsendAsk(id){
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>إلغاء إرسال الرسالة؟</h3><p class="muted">هتتشال لكل الناس في المحادثة وهتظهر "ألغيت إرسال رسالة". ممكن يكونوا شافوها قبل كده.</p><button class="primary mcdanger" onclick="mcUnsend(\''+mcEsc(id)+'\')">إلغاء الإرسال للجميع</button><button class="secondary" style="margin-top:8px" onclick="mcHide(\''+mcEsc(id)+'\')">إزالة من عندي بس</button>');
}
async function mcUnsend(id){
  closeModal();const k=mcK();
  try{await sb("/rest/v1/rpc/msg_unsend",{method:"POST",body:{k,mid:Number(id)}});const m=mcFind(k,id);if(m){m.unsent_at=new Date().toISOString();m.body="·";m.kind="text";m.media_url=null;m.pinned_at=null}mcRedraw();mcRefresh()}catch(e){msg(sbErr(e).slice(0,90))}
}
async function mcHide(id,quiet){
  if(!quiet)closeModal();const k=mcK();
  try{await sb("/rest/v1/message_hides?on_conflict=user_id,kind,msg_id",{method:"POST",prefer:"resolution=ignore-duplicates,return=minimal",body:{kind:k,msg_id:Number(id)}});cl.hid[k].add(Number(id));mcRedraw();if(!quiet)msg("تمت الإزالة من عندك فقط")}
  catch(e){msg(sbErr(e).slice(0,90))}
}
/* ---------- select mode ---------- */
function mcSelStart(id){closeModal();cl.sel=new Set([id+""]);mcRedraw()}
function mcToggleSel(id){id=id+"";if(cl.sel.has(id))cl.sel.delete(id);else cl.sel.add(id);if(!cl.sel.size)cl.sel=null;mcRedraw()}
function mcSelEnd(){cl.sel=null;mcRedraw()}
function mcSelBar(){
  let b=el("mcSelBar");
  if(!cl.sel){b&&b.remove();return}
  if(!b){b=document.createElement("div");b.id="mcSelBar";b.className="mcselbar";document.body.appendChild(b)}
  const k=mcK(),me=dmMeUid(),ids=[...cl.sel],ms=ids.map(i=>mcFind(k,i)).filter(Boolean),allMine=ms.length&&ms.every(m=>m.user_id===me);
  b.innerHTML='<b>'+an(ids.length)+' محدد</b><button onclick="mcSelAct(\'fwd\')">↪️ تحويل</button><button onclick="mcSelAct(\'copy\')">📋 نسخ</button><button onclick="mcSelAct(\'hide\')">🗑 إزالة</button>'+(allMine?'<button class="mcdanger" onclick="mcSelAct(\'unsend\')">🚫 إلغاء إرسال</button>':"")+'<button onclick="mcSelEnd()" aria-label="إلغاء التحديد">×</button>';
}
async function mcSelAct(a){
  const k=mcK(),ids=[...cl.sel].sort((x,y)=>mcN(x)-mcN(y)),ms=ids.map(i=>mcFind(k,i)).filter(Boolean);
  if(a==="copy"){copyText(ms.filter(m=>(m.kind||"text")==="text"&&!mcUnsent(m)).map(m=>m.body).join("\n"));return mcSelEnd()}
  if(a==="fwd"){const ok=ms.filter(m=>!mcUnsent(m)).map(m=>m.id+"");mcSelEnd();return ok.length?mcForward(ok):void 0}
  if(a==="hide"){for(const i of ids)await mcHide(i,true);msg("تمت الإزالة من عندك");return mcSelEnd()}
  if(a==="unsend"){if(!confirm("إلغاء إرسال "+ids.length+" رسالة للجميع؟"))return;for(const i of ids){try{await sb("/rest/v1/rpc/msg_unsend",{method:"POST",body:{k,mid:Number(i)}})}catch(e){}}mcSelEnd();await mcRefresh()}
}
/* ---------- forward ---------- */
function mcForward(ids){
  closeModal();window._mcFwd=ids;const k=mcK();
  const dms=(cl.dm||[]).filter(c=>!(k==="d"&&curDm()&&c.id===curDm().id)),gs=(cl.groups||[]).filter(g=>cl.mine[g.id]);
  if(!dms.length&&!gs.length)return msg("مفيش محادثات تحوّل ليها");
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>تحويل إلى…</h3><div class="mcmenu">'+dms.map(c=>'<button onclick="mcFwdTo(\'d\',\''+mcEsc(c.id)+'\')"><span>💬</span>'+mcEsc(dmName(c))+'</button>').join("")+gs.map(g=>'<button onclick="mcFwdTo(\'g\',\''+mcEsc(g.id)+'\')"><span>👥</span>'+mcEsc(g.name)+'</button>').join("")+'</div>');
}
async function mcFwdTo(tk,target){
  closeModal();const k=mcK(),ids=window._mcFwd||[];if(banStop())return;let n=0;
  for(const id of ids.slice().sort((a,b)=>mcN(a)-mcN(b))){
    const m=mcFind(k,id);if(!m||mcUnsent(m))continue;
    const row={body:m.body,kind:m.kind||"text",forwarded:true};if(m.media_url)row.media_url=m.media_url;if(m.media_secs)row.media_secs=m.media_secs;
    if(tk==="d")row.chat_id=target;else row.group_id=target;
    try{await sb("/rest/v1/"+(tk==="d"?"dm_messages":"messages"),{method:"POST",prefer:"return=minimal",body:row});n++}catch(e){msg(sbErr(e).slice(0,90));break}
  }
  if(n)msg("تم التحويل ✅");
}
/* ---------- DM chat options ---------- */
function mcChatMenu(){
  const c=curDm();if(!c)return;const o=mcOther(),p=cl.prefs["d:"+c.id]||{},r=(cl.dm||[]).find(x=>x.id===c.id),secs=r&&r.disappear_secs,np=mcList("d").filter(m=>m.pinned_at&&!mcUnsent(m)).length;
  const it=(ic,tx,fn,cls)=>'<button'+(cls?' class="'+cls+'"':"")+' onclick="'+fn+'"><span>'+ic+'</span>'+tx+'</button>';
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>'+mcEsc(c.name||"المحادثة")+'</h3><div class="mcmenu">'+
    it(p.muted?"🔔":"🔕",p.muted?"تشغيل الإشعارات":"كتم الإشعارات","closeModal();convPref('d:"+c.id+"','muted');setTimeout(mcTop,300)")+
    it("⏳","الرسائل المؤقتة: "+(secs?mcDisText(secs):"متوقفة"),"mcDisMenu()")+
    (np?it("📌","الرسائل المثبتة ("+an(np)+")","mcPins()"):"")+
    it("🚫",cl.blocks.has(o)?"إلغاء الحظر":"حظر","mcBlock()","mcdanger")+
    it("🗑","حذف المحادثة (من عندي)","mcDeleteChat()","mcdanger")+'</div>');
}
function mcDisMenu(){
  closeModal();const c=curDm();
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>⏳ الرسائل المؤقتة</h3><p class="muted">الرسائل الجديدة بس هتتمسح تلقائيًا بعد المدة دي. أي حد في المحادثة يقدر يغيّرها وبيظهر إشعار للطرفين.</p><div class="mcmenu">'+[["إيقاف",0],["24 ساعة",86400],["7 أيام",604800],["90 يوم",7776000]].map(x=>'<button onclick="mcSetDis('+x[1]+')">'+x[0]+'</button>').join("")+'</div>');
}
async function mcSetDis(s){
  closeModal();const c=curDm();if(!c)return;
  try{await sb("/rest/v1/rpc/dm_set_disappear",{method:"POST",body:{chat:c.id,secs:s||null}});const r=(cl.dm||[]).find(x=>x.id===c.id);if(r)r.disappear_secs=s||null;await mcRefresh();msg(s?"تم تفعيل الرسائل المؤقتة ⏳":"تم الإيقاف")}
  catch(e){msg(sbErr(e).slice(0,90))}
}
async function mcBlock(){
  closeModal();const o=mcOther(),c=curDm();if(!o)return;
  if(cl.blocks.has(o)){try{await delRow("/rest/v1/user_blocks?blocked=eq."+o);cl.blocks.delete(o);mcRedraw();msg("تم إلغاء الحظر")}catch(e){msg(sbErr(e).slice(0,90))}return}
  if(!confirm("حظر "+(c.name||"هذا الشخص")+"؟ مش هتقدروا تبعتوا رسائل لبعض في المحادثة دي."))return;
  try{await sb("/rest/v1/user_blocks?on_conflict=blocker,blocked",{method:"POST",prefer:"resolution=ignore-duplicates,return=minimal",body:{blocked:o}});cl.blocks.add(o);mcRedraw();msg("تم الحظر 🚫")}catch(e){msg(sbErr(e).slice(0,90))}
}
async function mcAccept(){
  const c=curDm();if(!c)return;const k="d:"+c.id;
  try{await sb("/rest/v1/chat_prefs?on_conflict=user_id,chat_key",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{chat_key:k,accepted:true}});(cl.prefs[k]=cl.prefs[k]||{chat_key:k}).accepted=true;mcTop();msg("تم قبول الطلب ✅")}catch(e){msg(sbErr(e).slice(0,90))}
}
async function mcDeleteChat(){
  closeModal();const c=curDm();if(!c)return;
  if(!confirm("حذف المحادثة من عندك؟ الطرف التاني هتفضل المحادثة عنده."))return;
  const l=(mcList("d").slice(-1)[0])||{},last=mcN(l.id)||mcN((cl.lastD[c.id]||{}).id),k="d:"+c.id;
  try{await sb("/rest/v1/chat_prefs?on_conflict=user_id,chat_key",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{chat_key:k,cleared_upto:last}});(cl.prefs[k]=cl.prefs[k]||{chat_key:k}).cleared_upto=last;msg("تم حذف المحادثة");backBtn()}
  catch(e){msg(sbErr(e).slice(0,90))}
}
/* ---------- data loading ---------- */
async function mcExtra(k){
  const list=mcList(k);if(!list.length)return;
  const ids=list.map(m=>m.id).join(",");
  try{
    const raw=await sb("/rest/v1/"+(k==="d"?"dm_messages":"messages")+"?select=id,unsent_at,forwarded,pinned_at,edit_count"+(k==="d"?",edited_at,expires_at":",edited_at")+"&id=in.("+ids+")");
    const m={};(raw||[]).forEach(o=>m[o.id]=o);list.forEach(o=>{if(m[o.id])Object.assign(o,m[o.id])});
    const alive=new Set((raw||[]).map(o=>o.id+""));
  }catch(e){}
}
async function mcInit(){
  const k=mcK();if(!k||!cs())return;
  try{
    const[h,b]=await Promise.all([sb("/rest/v1/message_hides?select=kind,msg_id&limit=5000"),sb("/rest/v1/user_blocks?select=blocked")]);
    cl.hid={d:new Set(),g:new Set()};(h||[]).forEach(x=>cl.hid[x.kind]&&cl.hid[x.kind].add(mcN(x.msg_id)));
    cl.blocks=new Set((b||[]).map(x=>x.blocked));
  }catch(e){}
  await mcExtra(k);mcRedraw();
}
const mc_ldm=window.loadDmMsgs;
window.loadDmMsgs=async function(){const r=await mc_ldm.apply(this,arguments);await mcExtra("d");if(mcK()==="d")mcRedraw();return r};
const mc_lgm=window.loadMsgs;
window.loadMsgs=async function(){const r=await mc_lgm.apply(this,arguments);await mcExtra("g");if(mcK()==="g")mcRedraw();return r};
const mc_dmr=window.dmMarkRead;
window.dmMarkRead=function(chat){if(mcIsReq(chat+""))return;return mc_dmr.apply(this,arguments)};
const mc_dmi=window.dmInsert;
window.dmInsert=async function(row){
  const o=mcK()==="d"?mcOther():"";
  if(o&&cl.blocks.has(o)){msg("حظرت الشخص ده. الغي الحظر الأول من خيارات المحادثة");return false}
  const c=curDm(),ok=await mc_dmi.apply(this,arguments);
  if(ok&&c&&!cl.sent.has(c.id)){cl.sent.add(c.id);mcTop()}
  return ok;
};
/* pages */
const mc_pdr=PAGES.dm.render,mc_pda=PAGES.dm.after;
PAGES.dm.render=function(){return(mc_pdr.apply(this,arguments)+"").replace('<div id="dmsgs"','<div id="mcTop"></div><div id="dmsgs"')};
PAGES.dm.after=function(){mc_pda&&mc_pda.apply(this,arguments);mcInit()};
const mc_pgr=PAGES.group.render,mc_pga=PAGES.group.after;
PAGES.group.render=function(){return(mc_pgr.apply(this,arguments)+"").replace('<div id="msgs"','<div id="mcTop"></div><div id="msgs"')};
PAGES.group.after=function(){mc_pga&&mc_pga.apply(this,arguments);if(cl.tab==="chat")setTimeout(mcInit,50)};
/* chat list: requests, deleted chats, unsent preview, sent/friends */
const mc_lc=window.loadConv;
window.loadConv=async function(){
  await mc_lc.apply(this,arguments);
  const u=cs();if(!u)return;
  try{
    const[pr,rows,fr]=await Promise.all([sb("/rest/v1/chat_prefs?select=chat_key,pinned,muted,archived,cleared_upto,accepted"),sb("/rest/v1/dm_messages?select=chat_id,id,user_id,body,created_at,kind,unsent_at&order=id.desc&limit=800"),sb("/rest/v1/friendships?select=requester,addressee&status=eq.accepted&limit=2000")]);
    (pr||[]).forEach(x=>{cl.prefs[x.chat_key]=Object.assign(cl.prefs[x.chat_key]||{},x)});
    cl.sent=new Set();const seen={};
    (rows||[]).forEach(m=>{if(m.user_id===u.uid)cl.sent.add(m.chat_id);if(!seen[m.chat_id]&&(m.kind||"text")!=="system"){seen[m.chat_id]=1;cl.lastD[m.chat_id]=m}});
    cl.friendIds=new Set();(fr||[]).forEach(f=>cl.friendIds.add(f.requester===u.uid?f.addressee:f.requester));
    const c=el("cList");if(c)c.innerHTML=cListHtml();
  }catch(e){}
};
const mc_ci=window.convItems;
window.convItems=function(){
  let a=mc_ci.apply(this,arguments).filter(x=>!(x.t==="d"&&mcDeleted(x.id)));
  a.forEach(x=>{if(x.last&&/(^|: )·$/.test(x.last))x.last="🚫 رسالة ملغاة"});
  return cl.cf==="req"?a.filter(x=>x.t==="d"&&mcIsReq(x.id)):a.filter(x=>!(x.t==="d"&&mcIsReq(x.id)));
};
const mc_ch=window.chatHtml;
window.chatHtml=function(){
  const h=mc_ch.apply(this,arguments)+"";
  const n=(cl.dm||[]).filter(c=>mcIsReq(c.id)&&!mcDeleted(c.id)).length;
  if(!n&&cl.cf!=="req")return h;
  return h.replace(/(📦 الأرشيف<\/button>)/,'$1<button class="chip'+(cl.cf==="req"?" on":"")+'" onclick="setCf(\'req\')">📨 طلبات الرسائل'+(n?" ("+an(n)+")":"")+'</button>');
};
/* gestures: long-press, right-click, tap for time, dots button */
(function(){
  let tm=null,sx=0,sy=0,fired=0;
  const find=t=>t&&t.closest?t.closest(".bub[data-mid],.mcdots[data-mid]"):null;
  document.addEventListener("pointerdown",e=>{
    const b=find(e.target);if(!b||b.classList.contains("mcdots")||!mcK())return;
    sx=e.clientX;sy=e.clientY;fired=0;clearTimeout(tm);
    tm=setTimeout(()=>{fired=1;window.mcQuiet=Date.now()+500;try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}mcOpen(b.dataset.mid)},420);
  },true);
  const cancel=()=>clearTimeout(tm);
  document.addEventListener("pointermove",e=>{if(Math.abs(e.clientX-sx)>8||Math.abs(e.clientY-sy)>8)cancel()},true);
  ["pointerup","pointercancel","scroll"].forEach(n=>document.addEventListener(n,cancel,true));document.addEventListener("pointerup",()=>setTimeout(()=>{fired=0},350),true);
  document.addEventListener("contextmenu",e=>{const b=find(e.target);if(b&&mcK()){e.preventDefault();cancel();fired=1;mcOpen(b.dataset.mid)}},true);
  document.addEventListener("click",e=>{
    if(window.mcQuiet&&Date.now()<window.mcQuiet){e.preventDefault();e.stopPropagation();return}
    const b=find(e.target);if(!b||!mcK())return;
    if(fired){fired=0;e.preventDefault();e.stopPropagation();return}
    if(b.classList.contains("mcdots")){e.stopPropagation();return mcOpen(b.dataset.mid)}
    if(cl.sel)return mcToggleSel(b.dataset.mid);
    if(e.target.closest("a,audio,img,button,.dmq"))return;
    const id=b.dataset.mid;cl.tmOpen=cl.tmOpen===id?null:id;b.classList.toggle("tmopen");document.querySelectorAll(".bub.tmopen").forEach(x=>{if(x!==b)x.classList.remove("tmopen")});
  },true);
})();
(function(){const s=document.createElement("style");s.textContent=
".msgs .bub{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;cursor:pointer}.msgs .bub .tm{display:none;font-size:10px;opacity:.75;margin-top:2px}.msgs .bub.tmopen .tm{display:block}"+
".mcdots{border:0;background:none;color:var(--muted);font-size:20px;min-width:34px;min-height:44px;align-self:center;border-radius:50%;padding:0 4px;line-height:1}@media(hover:hover){.mrow .mcdots{opacity:0}.mrow:hover .mcdots{opacity:1}}.mrow.me{flex-direction:row}"+
".mcday{text-align:center;font-size:11px;color:var(--muted);margin:10px 0 4px}.mcsys{text-align:center;font-size:12px;color:var(--muted);margin:8px 0;background:#ffffff;border-radius:12px;padding:5px 10px}"+
".mcun{background:transparent!important;border:1px dashed #b5c2bd!important;color:var(--muted)!important;font-size:12.5px;box-shadow:none!important}"+
".mcfwd{display:block;font-size:11px;opacity:.8;font-style:italic}.mcedit{display:block;font-size:10px;opacity:.7}.mcseen{text-align:left;font-size:11px;color:var(--muted);margin:2px 8px 6px}.mcpinm{font-size:11px;float:left}"+
".mchl .bub{outline:3px solid var(--gold);transition:outline .3s}.mcbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 8px}.mcopt{min-height:40px!important;font-size:13px!important}"+
".mcpin{display:flex;align-items:center;gap:8px;background:#fff7ea;border:1px solid var(--gold);border-radius:12px;padding:8px 10px;margin:0 0 8px;cursor:pointer;font-size:13px}.mcpt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".mcreq{background:#eef6ff;border-color:#bcd8f5}.mcreq .row{margin-top:8px}.mcreq button{flex:1}"+
".mcrx{display:flex;gap:2px;justify-content:space-between;background:#f3f6f4;border-radius:30px;padding:6px;margin:34px 0 10px}.mcrx button{border:0;background:none;font-size:25px;min-width:38px;min-height:48px;border-radius:14px;padding:0 2px;display:grid;justify-items:center}.mcrx button small{font-size:8.5px;color:var(--muted)}.mcrx button.on{background:var(--mint)}"+
".mcmenu{display:grid;gap:2px}.mcmenu button{display:flex;align-items:center;gap:12px;border:0;background:none;text-align:right;min-height:48px;padding:6px 8px;border-radius:12px;font:inherit;font-size:15px;color:var(--dark)}.mcmenu button:active{background:var(--mint)}.mcmenu button span{width:28px;text-align:center;font-size:19px}.mcdanger{color:#b0352d!important}.primary.mcdanger{background:#b0352d;color:#fff!important}"+
".mcselbar{position:fixed;left:0;right:0;bottom:0;max-width:520px;margin:auto;z-index:7;background:var(--dark);color:#fff;display:flex;gap:4px;align-items:center;padding:8px 10px calc(8px + env(safe-area-inset-bottom));overflow-x:auto}.mcselbar b{flex:1;white-space:nowrap}.mcselbar button{border:0;background:#ffffff22;color:#fff;border-radius:10px;min-height:44px;padding:0 10px;white-space:nowrap}"+
".mcchk{width:22px;height:22px;border-radius:50%;border:2px solid var(--g);display:grid;place-items:center;font-size:13px;flex-shrink:0;align-self:center;color:#fff}.mcchk.on{background:var(--g)}";
document.head.appendChild(s)})();
