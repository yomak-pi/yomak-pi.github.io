/* Phase 4D3: group chat Messenger features: reactions, replies, voice, images, seen count, typing. */
cl.gmRx={};cl.gmSeen={};
const _dmIns=window.dmInsert;
window.dmInsert=async function(row){
  const g=curGroup();if(!g||curDm())return _dmIns.apply(this,arguments);
  if(banStop())return false;
  const body=Object.assign({group_id:g.id},row);if(dmReplyTo)body.reply_to=dmReplyTo.id+"";
  try{await sb("/rest/v1/messages",{method:"POST",prefer:"return=minimal",body});dmReplyTo=null;dmReplyBar();await loadMsgs(g.id);return true}
  catch(e){msg(sbErr(e).slice(0,90));return false}
};
const gmFind=id=>(cl.msgs||[]).find(m=>m.id+""===id+"");
async function gmMeta(id){
  try{
    const ids=(cl.msgs||[]).map(m=>m.id);
    const[r,x]=await Promise.all([sb("/rest/v1/group_reads?select=user_id,last_read_id&chat_id=eq."+id),ids.length?sb("/rest/v1/group_msg_reactions?select=message_id,user_id,emoji&message_id=in.("+ids.join(",")+")"):[]]);
    cl.gmSeen={};(r||[]).forEach(o=>cl.gmSeen[o.user_id]=Number(o.last_read_id)||0);
    cl.gmRx={};(x||[]).forEach(o=>{(cl.gmRx[o.message_id]=cl.gmRx[o.message_id]||{})[o.user_id]=o.emoji});
  }catch(e){}
}
let gmMarked=0;
async function gmMarkRead(id){
  const me=dmMeUid();if(!me||document.hidden||!cl.mine[id])return;
  const inc=(cl.msgs||[]).filter(m=>m.user_id!==me);if(!inc.length)return;
  const last=Number(inc[inc.length-1].id);if(last<=gmMarked)return;gmMarked=last;
  try{await sb("/rest/v1/group_reads?on_conflict=group_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{group_id:id,user_id:me,last_read_id:last}})}catch(e){}
}
const _lm=window.loadMsgs;
window.loadMsgs=async function(id){
  await _lm.apply(this,arguments);
  const sel="id,body,created_at,user_id,reply_to,kind,media_url,media_secs";
  try{const raw=await sb("/rest/v1/messages?group_id=eq."+encodeURIComponent(id)+"&select="+sel+"&order=id.desc&limit=50");const m={};(raw||[]).forEach(o=>m[o.id]=o);(cl.msgs||[]).forEach(o=>{if(m[o.id])Object.assign(o,m[o.id])})}catch(e){}
  await gmMeta(id);
  const c=el("msgs");if(c&&curGroup()){const near=c.scrollHeight-c.scrollTop-c.clientHeight<80;c.innerHTML=msgHtml();if(near)c.scrollTop=c.scrollHeight}
};
window.msgHtml=function(){
  const e=cs(),mod=typeof canMod==="function"&&canMod(curGroupObj()),me=e&&e.uid,seenBy=id=>Object.keys(cl.gmSeen).filter(u=>u!==me&&cl.gmSeen[u]>=Number(id)).length;
  return(cl.msgs||[]).map(s=>{
    const a=me&&s.user_id===me,n=cl.pp[s.user_id]||{id:s.user_id,name:s.profiles&&s.profiles.name},rep=s.reply_to?gmFind(s.reply_to):null,rx=cl.gmRx[s.id]||{},cnt={};
    Object.values(rx).forEach(x=>cnt[x]=(cnt[x]||0)+1);
    const chips=Object.keys(cnt).length?'<div class="dmrxs">'+Object.keys(cnt).map(x=>'<span>'+x+(cnt[x]>1?" "+an(cnt[x]):"")+'</span>').join("")+'</div>':"";
    return '<div class="mrow'+(a?" me":"")+'">'+(a?"":avHtml(n,30))+'<div class="bub'+(a?" me":"")+'" data-mid="'+esc(s.id)+'" onclick="gmSheet(\''+esc(s.id)+'\')">'+(a?"":'<span class="sn">'+esc(n.name||"")+vfMark(n)+'</span>')+
     (s.reply_to?'<div class="dmq">'+(rep?esc(rep.kind==="voice"?"🎤 رسالة صوتية":rep.kind==="image"?"📷 صورة":rep.body).slice(0,80):"رسالة محذوفة")+'</div>':"")+dmBody(s)+
     '<small class="tm">'+whenShort(s.created_at)+(a?" "+(seenBy(s.id)?'<span class="tick seen">✓✓ '+an(seenBy(s.id))+'</span>':'<span class="tick">✓</span>'):"")+'</small>'+chips+'</div></div>';
  }).join("")||'<p class="muted">ابدأ المحادثة…</p>';
};
function gmSheet(id){
  const m=gmFind(id);if(!m)return;const me=dmMeUid(),mine=m.user_id===me,mod=typeof canMod==="function"&&canMod(curGroupObj());
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><div class="chips" style="font-size:26px">'+DMRX.map(x=>'<button class="chip" title="'+DMRXL[x]+'" onclick="gmReact(\''+id+'\',\''+x+'\')">'+x+'<small style="display:block;font-size:9px">'+DMRXL[x]+'</small></button>').join("")+'</div><div class="list">'+
   '<button class="secondary" onclick="gmReply(\''+id+'\')">↩️ رد</button>'+(m.kind==="text"||!m.kind?'<button class="secondary" onclick="closeModal();copyText(gmFind(\''+id+'\').body)">📋 نسخ</button>':"")+
   '<button class="secondary" onclick="gmWho(\''+id+'\')">من تفاعل؟</button>'+(!mine?'<button class="secondary" onclick="closeModal();reportItem(\'message\',\''+id+'\')">🚩 إبلاغ</button>':"")+(mine||mod?'<button class="secondary" style="color:#b0352d" onclick="closeModal();delMsg(\''+id+'\')">🗑 حذف</button>':"")+'</div>');
}
function gmReply(id){const m=gmFind(id);if(!m)return;closeModal();dmReplyTo={id:m.id,text:m.kind==="voice"?"🎤 رسالة صوتية":m.kind==="image"?"📷 صورة":m.body};dmReplyBar();const i=el("dBody");i&&i.focus()}
async function gmReact(id,emoji){
  closeModal();const me=dmMeUid(),g=curGroup();if(!me||!g)return;const cur=(cl.gmRx[id]||{})[me];
  try{
    if(cur===emoji)await sb("/rest/v1/group_msg_reactions?message_id=eq."+id+"&user_id=eq."+me,{method:"DELETE",prefer:"return=minimal"});
    else await sb("/rest/v1/group_msg_reactions?on_conflict=message_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{message_id:id,user_id:me,emoji}});
    await gmMeta(g.id);const c=el("msgs");c&&(c.innerHTML=msgHtml());
  }catch(e){msg(sbErr(e).slice(0,90))}
}
async function gmWho(id){
  const rx=cl.gmRx[id]||{};await loadPeople(Object.keys(rx));
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>التفاعلات</h3>'+(Object.keys(rx).map(u=>'<div class="row between"><span>'+esc((cl.pp[u]||{}).name||"مستخدم")+'</span><span style="font-size:22px">'+rx[u]+'</span></div>').join("")||'<p class="muted">مفيش تفاعلات</p>'));
}
/* composer + typing */
function gmComposer(){return '<div id="dmTyping" class="dmtyping"></div><div id="dmReply" class="dmreply hide"></div><div id="dmRecBar" class="dmrec hide"></div><div class="dmcomp"><label class="pact dmatt" aria-label="صورة">📷<input type="file" accept="image/*" hidden onchange="dmPickImg(this)"></label><input id="dBody" class="input" maxlength="1000" placeholder="اكتب رسالة" aria-label="رسالة" oninput="dmToggleMic();dmTyped()" onkeydown="if(event.key===\'Enter\'){event.preventDefault();dmMicOrSend()}"><button id="dmMicBtn" class="pact" onclick="dmMicOrSend()" aria-label="إرسال">🎤</button></div>'}
const _pgr=PAGES.group.render,_pga=PAGES.group.after;
PAGES.group.render=function(e){
  const h=_pgr.apply(this,arguments)+"";
  if(cl.tab!=="chat")return h;
  const i=h.indexOf('<div class="row" style="display:flex;gap:6px;margin-top:8px"><input id="cBody"');
  if(i<0)return h;
  const j=h.indexOf("</div>",h.indexOf("</button>",i))+6;
  return h.slice(0,i)+gmComposer()+h.slice(j);
};
PAGES.group.after=function(e){
  _pga&&_pga.apply(this,arguments);
  if("chat"===cl.tab&&e&&cl.mine[e.id]){dmTypeStart("g"+e.id);const c=el("msgs");c&&(c.innerHTML=msgHtml())}
  else dmTypeClose();
};
