/* Phase 4B: Messenger-style DM: reactions, replies, seen, typing, voice notes, images, unsend. */
const DMRX=["👍","❤️","🥰","😂","😮","😢","😡"],DMRXL={"👍":"أعجبني","❤️":"أحببته","🥰":"أدعمه","😂":"أضحكني","😮":"واااو","😢":"أحزنني","😡":"أغضبني"};
cl.dmRx=cl.dmRx||{};cl.dmSeen=0;let dmReplyTo=null,dmTypingTimer=null,dmTypeCh=null,dmTypeKey="",dmTick=null,dmSig="",dmRec=null,dmLastType=0,dmMarked=0;
const dmNum=x=>Number(x)||0;
function dmMeUid(){return(cs()||{}).uid}
function dmFind(id){return(cl.dmMsgs||[]).find(m=>m.id+""===id+"")}
function dmTicks(m){return dmNum(cl.dmSeen)>=dmNum(m.id)?'<span class="tick seen" title="تمت المشاهدة">✓✓</span>':'<span class="tick" title="تم الإرسال">✓</span>'}
function dmBody(m){
  if(m.kind==="voice"&&m.media_url&&imgOkChat(m.media_url))return '<audio controls preload="none" src="'+esc(m.media_url)+'"></audio>'+(m.media_secs?'<small class="vsec">🎤 '+an(m.media_secs)+' ث</small>':"");
  if(m.kind==="image"&&m.media_url&&imgOkChat(m.media_url))return '<img class="dmimg" loading="lazy" src="'+esc(m.media_url)+'" alt="صورة" onclick="dmZoom(this.src)">';
  return '<div>'+esc(m.body)+'</div>';
}
function imgOkChat(u){return typeof u==="string"&&u.startsWith(SB_URL+"/storage/v1/object/public/chat-media/")}
function dmHtml(){
  const me=dmMeUid(),list=cl.dmMsgs||[];
  if(!list.length)return '<p class="muted">ابدأ المحادثة…</p>';
  return list.map(t=>{
    const mine=me&&t.user_id===me,rep=t.reply_to?dmFind(t.reply_to):null,rx=cl.dmRx[t.id]||{};
    const cnt={};Object.values(rx).forEach(e=>cnt[e]=(cnt[e]||0)+1);
    const chips=Object.keys(cnt).length?'<div class="dmrxs">'+Object.keys(cnt).map(e=>'<span>'+e+(cnt[e]>1?" "+an(cnt[e]):"")+'</span>').join("")+'</div>':"";
    return '<div class="mrow'+(mine?" me":"")+'"><div class="bub'+(mine?" me":"")+'" data-mid="'+esc(t.id)+'">'+
      (t.reply_to?'<div class="dmq">'+(rep?esc((rep.kind==="text"?rep.body:rep.kind==="voice"?"🎤 رسالة صوتية":"📷 صورة")).slice(0,80):"رسالة")+'</div>':"")+
      dmBody(t)+'<small class="tm">'+whenShort(t.created_at)+(mine?" "+dmTicks(t):"")+'</small>'+chips+'</div></div>';
  }).join("");
}
function dmRedraw(keepBottom){const c=el("dmsgs");if(!c)return;const near=c.scrollHeight-c.scrollTop-c.clientHeight<80;c.innerHTML=dmHtml();if(keepBottom||near)c.scrollTop=c.scrollHeight}
async function dmFetchMeta(chat){
  try{
    const[r,x]=await Promise.all([sb("/rest/v1/dm_reads?select=user_id,last_read_id&chat_id=eq."+encodeURIComponent(chat)),sb("/rest/v1/dm_reactions?select=message_id,user_id,emoji&chat_id=eq."+encodeURIComponent(chat)+"&limit=2000")]);
    const me=dmMeUid();let seen=0;(r||[]).forEach(o=>{if(o.user_id!==me)seen=Math.max(seen,dmNum(o.last_read_id))});
    const rx={};(x||[]).forEach(o=>{(rx[o.message_id]=rx[o.message_id]||{})[o.user_id]=o.emoji});
    const sig=seen+"|"+JSON.stringify(rx);
    cl.dmSeen=seen;cl.dmRx=rx;return sig;
  }catch(e){return dmSig}
}
async function dmMarkRead(chat){
  const me=dmMeUid();if(!me||document.hidden)return;
  const inc=(cl.dmMsgs||[]).filter(m=>m.user_id!==me);if(!inc.length)return;
  const last=dmNum(inc[inc.length-1].id);if(last<=dmMarked)return;
  dmMarked=last;
  try{await sb("/rest/v1/dm_reads?on_conflict=chat_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{chat_id:chat,last_read_id:last,updated_at:new Date().toISOString()}});delete cl.unread["d:"+chat]}catch(e){dmMarked=0}
}
async function loadDmMsgs(e,t,s){
  const a=cl.dmMsgs||[],n=s&&a.length?a[0].id:null;
  try{
    const q="/rest/v1/dm_messages?chat_id=eq."+encodeURIComponent(e)+"&select=id,body,created_at,user_id,reply_to,kind,media_url,media_secs&order=id.desc&limit=50"+(n?"&id=lt."+encodeURIComponent(n):"");
    const[raw,sig]=await Promise.all([sb(q),dmFetchMeta(e)]);dmSig=sig;
    const i=(raw||[]).reverse();
    cl.dmChatHasMore=50===i.length;
    cl.dmMsgs=s?i.concat(a):i.concat(a.filter(x=>!i.some(y=>y.id+""==x.id+""))).sort((x,y)=>Number(x.id)-Number(y.id));
    cl.dmLast=cl.dmMsgs.length?cl.dmMsgs[cl.dmMsgs.length-1].id:0;
    const c=el("dmsgs");
    if(c){const st=c.scrollTop,h=c.scrollHeight;c.innerHTML=dmHtml();const b=el("olderDmBtn");b&&(b.disabled=!1===cl.dmChatHasMore);c.scrollTop=s?st+(c.scrollHeight-h):c.scrollHeight}
    else if("dm"===curPage())refresh();
    dmMarkRead(e);
  }catch(err){t||msg(sbErr(err).slice(0,90))}
}
/* send */
async function dmInsert(row){
  const cur=curDm();if(!cur||banStop())return false;
  const body=Object.assign({chat_id:cur.id},row);if(dmReplyTo)body.reply_to=dmReplyTo.id+"";
  try{await sb("/rest/v1/dm_messages",{method:"POST",prefer:"return=minimal",body});dmReplyTo=null;dmReplyBar();await loadDmMsgs(cur.id);return true}
  catch(e){msg(sbErr(e).slice(0,90));return false}
}
async function sendDm(){const t=val("dBody");if(!t)return;const i=el("dBody");const ok=await dmInsert({body:t.slice(0,1000)});if(ok&&i){i.value=""}}
function dmReplyBar(){const b=el("dmReply");if(!b)return;if(!dmReplyTo){b.className="dmreply hide";b.innerHTML="";return}b.className="dmreply";b.innerHTML='<span>↩️ ردًا على: '+esc(dmReplyTo.text.slice(0,60))+'</span><button type="button" class="pact" onclick="dmReplyTo=null;dmReplyBar()" aria-label="إلغاء">×</button>'}
/* message actions sheet */
function dmSheet(id){
  const m=dmFind(id);if(!m)return;const me=dmMeUid(),mine=m.user_id===me,mid=esc(m.id+""),my=(cl.dmRx[m.id]||{})[me];
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><div class="dmsheet"><div class="dmrxrow">'+DMRX.map(e=>'<button type="button" title="'+DMRXL[e]+'" class="'+(my===e?"on":"")+'" onclick="dmReact(\''+mid+'\',\''+e+'\')">'+e+'<small style="display:block;font-size:9px">'+DMRXL[e]+'</small></button>').join("")+'</div>'+
    '<button class="chip" onclick="dmDoReply(\''+mid+'\')">↩️ رد</button>'+
    (m.kind==="text"?'<button class="chip" onclick="dmCopy(\''+mid+'\')">📋 نسخ</button>':"")+
    (mine&&m.kind==="text"?'<button class="chip" onclick="closeModal();editItem(\'dm\',\''+mid+'\')">✏️ تعديل</button>':"")+
    (mine?'<button class="chip" onclick="closeModal();delDmMsg(\''+mid+'\')">🗑 حذف للجميع</button>':'<button class="chip" onclick="closeModal();reportItem(\'dm\',\''+mid+'\')">🚩 إبلاغ</button>')+'</div>');
}
function dmDoReply(id){const m=dmFind(id);if(!m)return;closeModal();dmReplyTo={id:m.id,text:m.kind==="text"?m.body:m.kind==="voice"?"🎤 رسالة صوتية":"📷 صورة"};dmReplyBar();const i=el("dBody");i&&i.focus()}
function dmCopy(id){const m=dmFind(id);closeModal();m&&copyText(m.body)}
async function dmReact(id,emoji){
  closeModal();const cur=curDm(),me=dmMeUid();if(!cur||!me||banStop())return;
  const o=cl.dmRx[id]=cl.dmRx[id]||{},was=o[me];
  if(was===emoji)delete o[me];else o[me]=emoji;dmRedraw();
  try{
    if(was===emoji)await delRow("/rest/v1/dm_reactions?message_id=eq."+encodeURIComponent(id)+"&user_id=eq."+me);
    else await sb("/rest/v1/dm_reactions?on_conflict=message_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{chat_id:cur.id+"",message_id:id+"",emoji}});
  }catch(e){if(was)o[me]=was;else delete o[me];dmRedraw();msg(sbErr(e).slice(0,80))}
}
/* storage upload */
async function dmUpload(blob,ext,mime){
  const s=cs();if(!s)throw 0;if(s.exp-30<Date.now()/1e3)await sb("/rest/v1/profiles?id=eq."+s.uid+"&select=id");
  const u=cs(),path=u.uid+"/"+Date.now().toString(36)+Math.random().toString(36).slice(2,8)+"."+ext;
  const r=await fetch(SB_URL+"/storage/v1/object/chat-media/"+path,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+u.access,"Content-Type":mime},body:blob});
  if(!r.ok)throw 0;return SB_URL+"/storage/v1/object/public/chat-media/"+path;
}
async function dmPickImg(inp){
  const f=inp.files&&inp.files[0];inp.value="";if(!f||!/^image\//.test(f.type))return;
  try{
    msg("جاري رفع الصورة…");
    const bmp=await createImageBitmap(f),k=Math.min(1,1280/Math.max(bmp.width,bmp.height)),cv=document.createElement("canvas");cv.width=Math.round(bmp.width*k);cv.height=Math.round(bmp.height*k);cv.getContext("2d").drawImage(bmp,0,0,cv.width,cv.height);
    const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.82));
    const url=await dmUpload(blob,"jpg","image/jpeg");
    await dmInsert({body:"📷 صورة",kind:"image",media_url:url});
  }catch(e){msg("تعذّر رفع الصورة")}
}
function dmZoom(src){openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><img src="'+esc(src)+'" style="width:100%;border-radius:10px" alt="صورة">')}
/* voice notes */
async function dmMic(){
  if(dmRec){return dmRecStop(true)}
  if(!navigator.mediaDevices||!window.MediaRecorder)return msg("جهازك لا يدعم تسجيل الصوت");
  try{
    const st=await navigator.mediaDevices.getUserMedia({audio:true});
    const mt=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t))||"";
    const rec=new MediaRecorder(st,mt?{mimeType:mt}:{}),chunks=[];
    rec.ondataavailable=e=>e.data&&e.data.size&&chunks.push(e.data);
    dmRec={rec,st,chunks,t0:Date.now(),cancel:false,mt:rec.mimeType||mt||"audio/webm"};
    rec.onstop=async()=>{
      st.getTracks().forEach(t=>t.stop());const r=dmRec;dmRec=null;dmRecUi();
      if(!r||r.cancel)return;const secs=Math.round((Date.now()-r.t0)/1000);if(secs<1)return msg("التسجيل قصير");
      const blob=new Blob(r.chunks,{type:r.mt.split(";")[0]});if(blob.size>9.5*1048576)return msg("التسجيل كبير");
      try{const ext=/ogg/.test(r.mt)?"ogg":/mp4/.test(r.mt)?"m4a":"webm";const url=await dmUpload(blob,ext,r.mt.split(";")[0]);await dmInsert({body:"🎤 رسالة صوتية",kind:"voice",media_url:url,media_secs:secs})}catch(e){msg("تعذّر إرسال الصوت")}
    };
    rec.start();dmRecUi();dmRec.timer=setInterval(()=>{dmRecUi();if(dmRec&&Date.now()-dmRec.t0>180000)dmRecStop(true)},500);
  }catch(e){msg("اسمح بالميكروفون من المتصفح")}
}
function dmRecStop(send){const r=dmRec;if(!r)return;r.cancel=!send;clearInterval(r.timer);try{r.rec.stop()}catch(e){dmRec=null;dmRecUi()}}
function dmRecUi(){
  const b=el("dmRecBar"),m=el("dmMicBtn");if(!b)return;
  if(!dmRec){b.className="dmrec hide";b.innerHTML="";if(m)m.textContent="🎤";return}
  const s=Math.floor((Date.now()-dmRec.t0)/1000);b.className="dmrec";b.innerHTML='<span class="recdot">●</span> يسجّل… '+an(Math.floor(s/60))+":"+an(String(s%60).padStart(2,"0"))+' <button type="button" class="pact" onclick="dmRecStop(false)">إلغاء</button>';if(m)m.textContent="➤";
}
/* typing indicator (Supabase Realtime broadcast) */
function dmTypeStart(chat){
  if(dmTypeKey===chat+""&&dmTypeCh)return;dmTypeClose();
  const a=window.supabase,u=cs();if(!a||!u||typeof a.createClient!=="function")return;
  try{
    const n=a.createClient(SB_URL,SB_KEY,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}});u.access&&n.realtime.setAuth(u.access);
    dmTypeKey=chat+"";
    dmTypeCh=n.channel("yomak-typing-"+chat,{config:{broadcast:{self:false}}}).on("broadcast",{event:"typing"},p=>{
      if(!p||!p.payload||p.payload.uid===dmMeUid())return;const t=el("dmTyping");if(!t)return;t.textContent="يكتب الآن…";clearTimeout(dmTypingTimer);dmTypingTimer=setTimeout(()=>{const x=el("dmTyping");x&&(x.textContent="")},3500)
    }).subscribe();dmTypeCh._client=n;
  }catch(e){}
}
function dmTypeClose(){try{if(dmTypeCh&&dmTypeCh._client)dmTypeCh._client.removeChannel(dmTypeCh)}catch(e){}dmTypeCh=null;dmTypeKey=""}
function dmTyped(){const n=Date.now();if(!dmTypeCh||n-dmLastType<2500)return;dmLastType=n;try{dmTypeCh.send({type:"broadcast",event:"typing",payload:{uid:dmMeUid()}})}catch(e){}}
/* page */
const _dmAfter=PAGES.dm.after;
PAGES.dm.render=function(e){
  if(!cs())return authCard();
  return '<div id="dmsgs" class="msgs">'+(null===cl.dmMsgs?'<p class="muted">جاري التحميل…</p>':dmHtml())+'</div><div id="dmTyping" class="dmtyping"></div><div id="dmReply" class="dmreply hide"></div><div id="dmRecBar" class="dmrec hide"></div>'+
    '<div class="dmcomp"><label class="pact dmatt" aria-label="صورة">📷<input type="file" accept="image/*" hidden onchange="dmPickImg(this)"></label><input id="dBody" class="input" maxlength="1000" placeholder="اكتب رسالة" aria-label="رسالة" oninput="dmTyped();dmToggleMic()" onkeydown="if(event.key===\'Enter\')sendDm()"><button id="dmMicBtn" type="button" class="pact" aria-label="صوت" onclick="dmMicOrSend()">🎤</button></div>';
};
function dmToggleMic(){const b=el("dmMicBtn"),i=el("dBody");if(!b||dmRec)return;b.textContent=i&&i.value.trim()?"➤":"🎤"}
function dmMicOrSend(){if(dmRec)return dmRecStop(true);const i=el("dBody");if(i&&i.value.trim())return sendDm();dmMic()}
PAGES.dm.after=function(e){
  _dmAfter&&_dmAfter(e);
  if(!cs()||!e)return;
  if(dmMarked&&dmReplyTo&&dmReplyTo.chat!==e.id){dmReplyTo=null}
  dmTypeStart(e.id);dmReplyBar();
  clearInterval(dmTick);
  dmTick=setInterval(async()=>{
    const cur=curDm();if(!cur||"dm"!==curPage()){clearInterval(dmTick);dmTypeClose();dmMarked=0;return}
    if(document.hidden)return;
    const sig=await dmFetchMeta(cur.id);if(sig!==dmSig){dmSig=sig;dmRedraw()}
    dmMarkRead(cur.id);
  },5000);
};
document.addEventListener("click",ev=>{
  const b=ev.target.closest&&ev.target.closest("#dmsgs .bub[data-mid]");
  if(!b||ev.target.closest("audio,a,img,button"))return;
  dmSheet(b.dataset.mid);
});
document.addEventListener("dblclick",ev=>{const b=ev.target.closest&&ev.target.closest("#dmsgs .bub[data-mid]");if(b){closeModal&&0;dmReact(b.dataset.mid,"👍")}});
(function(){const s=document.createElement("style");s.textContent=".dmq{border-inline-start:3px solid #7aa89f;background:rgba(0,0,0,.06);border-radius:6px;padding:3px 6px;font-size:12px;margin-bottom:4px;opacity:.85}.tick{font-size:11px;color:#9aa;margin-inline-start:2px}.tick.seen{color:#1e90ff}.dmrxs{display:flex;gap:3px;margin-top:3px}.dmrxs span{background:#fff;border:1px solid #ddd;border-radius:12px;padding:0 6px;font-size:13px;color:#333}.dmcomp{display:flex;gap:6px;margin-top:8px;align-items:center}.dmcomp .input{flex:1;margin:0}.dmatt{cursor:pointer}.dmtyping{min-height:16px;font-size:12px;color:var(--muted);padding:2px 4px}.dmreply{display:flex;justify-content:space-between;align-items:center;gap:6px;background:#eef3f1;border-radius:8px;padding:4px 8px;font-size:12px;margin-top:4px}.dmrec{display:flex;gap:8px;align-items:center;background:#fdecea;border-radius:8px;padding:6px 10px;margin-top:4px;font-size:13px}.recdot{color:#d33;animation:blink 1s infinite}@keyframes blink{50%{opacity:.2}}.dmimg{max-width:220px;width:100%;border-radius:10px;display:block;cursor:zoom-in}.bub audio{max-width:220px;height:36px}.vsec{display:block;opacity:.7}.dmrxrow{display:flex;justify-content:center;gap:4px;margin-bottom:10px}.dmrxrow button{border:0;background:none;font-size:30px;padding:4px 6px;border-radius:50%}.dmrxrow button.on{background:#dff0e6}.dmsheet{display:flex;flex-direction:column;gap:8px;padding-top:6px}.bub[data-mid]{cursor:pointer}";document.head.appendChild(s)})();
