/* Phase 4B part 2: chat list (unread, pin, mute, archive), forward, "who reacted". */
cl.prefs=cl.prefs||{};cl.unread=cl.unread||{};
const _lc0=window.loadConv;
window.loadConv=async function(){
  await _lc0.apply(this,arguments);
  const u=cs();if(!u)return;
  try{
    const[p,dr,gr,dm,gm]=await Promise.all([
      sb("/rest/v1/chat_prefs?select=chat_key,pinned,muted,archived"),
      sb("/rest/v1/dm_reads?select=chat_id,last_read_id&user_id=eq."+u.uid),
      sb("/rest/v1/group_reads?select=chat_id,last_read_id&user_id=eq."+u.uid),
      sb("/rest/v1/dm_messages?select=chat_id,id,user_id&order=id.desc&limit=600"),
      sb("/rest/v1/messages?select=group_id,id,user_id&order=id.desc&limit=600")]);
    cl.prefs={};(p||[]).forEach(x=>cl.prefs[x.chat_key]=x);
    const rd={},gd={};(dr||[]).forEach(x=>rd[x.chat_id]=Number(x.last_read_id));(gr||[]).forEach(x=>gd[x.chat_id]=Number(x.last_read_id));
    cl.unread={};
    (dm||[]).forEach(m=>{if(m.user_id!==u.uid&&Number(m.id)>(rd[m.chat_id]||0))cl.unread["d:"+m.chat_id]=(cl.unread["d:"+m.chat_id]||0)+1});
    (gm||[]).forEach(m=>{if(m.user_id!==u.uid&&cl.mine&&cl.mine[m.group_id]&&Number(m.id)>(gd[m.group_id]||0))cl.unread["g:"+m.group_id]=(cl.unread["g:"+m.group_id]||0)+1});
    const c=el("cList");if(c)c.innerHTML=cListHtml();
    window.dispatchEvent(new Event("yomak-unread"));
  }catch(e){}
};
function cKey(e){return e.t+":"+e.id}
function cListHtml(){
  const q=norm(cl.cq),f=cl.cf||"all";
  let items=convItems().filter(s=>{
    const pr=cl.prefs[cKey(s)]||{},un=cl.unread[cKey(s)]||0;
    if(f==="arch")return pr.archived;if(pr.archived)return false;
    if(f==="unread"&&!un)return false;
    if(f==="d"&&s.t!=="d")return false;if(f==="g"&&s.t!=="g")return false;
    return !q||norm(s.name+" "+s.last).includes(q)
  });
  items.sort((a,b)=>((cl.prefs[cKey(b)]||{}).pinned?1:0)-((cl.prefs[cKey(a)]||{}).pinned?1:0)||(b.ts+"").localeCompare(a.ts+""));
  if(!items.length)return '<div class="card empty" style="margin-top:8px"><div style="font-size:34px">💬</div><b>'+(q?"لا توجد نتائج":f==="arch"?"الأرشيف فاضي":f==="unread"?"مفيش رسائل غير مقروءة":"لا توجد محادثات بعد")+'</b><p class="muted">'+(q?"جرّب كلمة أخرى.":"اضغط ＋ لبدء محادثة خاصة، أو انضم لجروب من تبويب جروباتي.")+'</p></div>';
  return '<div class="clist">'+items.map(e=>{
    const k=cKey(e),pr=cl.prefs[k]||{},un=cl.unread[k]||0;
    return '<div class="convw"><button class="conv'+(un?" unr":"")+'" data-t="'+e.t+'" data-id="'+esc(e.id)+'" data-nm="'+esc(e.name)+'" data-pid="'+esc(e.pid)+'" onclick="openConv(this)">'+avHtml(e.p,48)+'<span class="cb"><b>'+(pr.pinned?"📌 ":"")+esc(e.name)+("d"===e.t?vfMark(e.p):"")+(pr.muted?" 🔕":"")+'</b><small>'+esc((e.last+"").slice(0,70))+'</small></span><span class="ct">'+(e.ts?whenShort(e.ts):"")+(un?'<i class="ubadge">'+an(un>99?"99+":un)+'</i>':"")+'</span></button><button class="convm" aria-label="خيارات" onclick="convMenu(\''+e.t+'\',\''+esc(e.id)+'\')">⋯</button></div>';
  }).join("")+'</div>';
}
function chatHtml(){
  if(!cs())return authCard();
  const chips=[["all","الكل"],["unread","غير مقروء"],["d","خاص"],["g","جروبات"],["arch","📦 الأرشيف"]];
  return whoBar()+'<input class="input" id="cSearchBox" placeholder="🔎 ابحث في المحادثات" aria-label="بحث في المحادثات" value="'+esc(cl.cq)+'" oninput="cSearch(this.value)"><div class="chips">'+chips.map(e=>'<button class="chip'+(cl.cf===e[0]?" on":"")+'" onclick="setCf(\''+e[0]+'\')">'+e[1]+'</button>').join("")+'</div>'+(cl.err?'<div class="card alertbox" style="overflow-wrap:anywhere">'+esc(cl.err)+'</div>':"")+(cl.conv?'<div id="cList">'+cListHtml()+'</div>':'<p class="muted">جاري التحميل…</p>');
}
function convMenu(t,id){
  const k=t+":"+id,p=cl.prefs[k]||{};
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><div class="dmsheet"><button class="chip" onclick="convPref(\''+k+'\',\'pinned\')">'+(p.pinned?"إلغاء التثبيت":"📌 تثبيت")+'</button><button class="chip" onclick="convPref(\''+k+'\',\'muted\')">'+(p.muted?"🔔 تشغيل الإشعارات":"🔕 كتم الإشعارات")+'</button><button class="chip" onclick="convPref(\''+k+'\',\'archived\')">'+(p.archived?"إلغاء الأرشفة":"📦 أرشفة")+'</button></div>');
}
async function convPref(k,field){
  closeModal();const u=cs();if(!u)return;
  const cur=cl.prefs[k]||{chat_key:k,pinned:!1,muted:!1,archived:!1},val=!cur[field],row={chat_key:k,pinned:cur.pinned,muted:cur.muted,archived:cur.archived};row[field]=val;
  cl.prefs[k]=Object.assign({},cur,row);const c=el("cList");c&&(c.innerHTML=cListHtml());
  try{await sb("/rest/v1/chat_prefs?on_conflict=user_id,chat_key",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:row})}catch(e){cl.prefs[k]=cur;c&&(c.innerHTML=cListHtml());msg(sbErr(e).slice(0,80))}
}
/* mark group chats read when the group chat loads */
const _lm0=window.loadMsgs;
window.loadMsgs=async function(g){
  const r=await _lm0.apply(this,arguments);
  try{const u=cs(),ms=cl.msgs||[];if(u&&ms.length&&!document.hidden){const last=Number(ms[ms.length-1].id)||0,gid=g+"";if(last&&(cl.gMark||{})[gid]!==last){(cl.gMark=cl.gMark||{})[gid]=last;sb("/rest/v1/group_reads?on_conflict=chat_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{chat_id:gid,last_read_id:last,updated_at:new Date().toISOString()}}).catch(()=>{});delete cl.unread["g:"+gid]}}}catch(e){}
  return r;
};
/* forward a DM message to another chat */
function dmForward(id){
  const m=dmFind(id);if(!m)return;closeModal();
  const chats=(cl.dm||[]);
  if(!chats.length)return msg("مفيش محادثات تحوّل ليها");
  window._fwd=m;
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>تحويل إلى…</h3><div class="dmsheet">'+chats.map(c=>'<button class="chip" onclick="dmForwardTo(\''+esc(c.id)+'\')">'+esc(dmName(c))+'</button>').join("")+'</div>');
}
async function dmForwardTo(chat){
  const m=window._fwd;closeModal();if(!m||banStop())return;
  const row={chat_id:chat,body:m.body,kind:m.kind||"text"};if(m.media_url)row.media_url=m.media_url;if(m.media_secs)row.media_secs=m.media_secs;
  try{await sb("/rest/v1/dm_messages",{method:"POST",prefer:"return=minimal",body:row});msg("تم التحويل ✅")}catch(e){msg(sbErr(e).slice(0,80))}
}
/* add a forward button to the message sheet */
const _dmSheet0=dmSheet;
dmSheet=function(id){_dmSheet0(id);const s=document.querySelector(".dmsheet");if(s){const b=document.createElement("button");b.className="chip";b.textContent="↪️ تحويل";b.onclick=()=>dmForward(id);s.appendChild(b)}};
/* who reacted to a post */
async function rxWho(id,ev){
  if(ev){ev.stopPropagation();ev.preventDefault()}
  if(!UUID_RE.test(id))return;
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>التفاعلات</h3><div id="rxWho"><p class="muted">جاري التحميل…</p></div>');
  try{
    const r=await sb("/rest/v1/post_reactions?select=user_id,kind&post_id=eq."+id+"&order=created_at.desc&limit=200");
    await loadPeople((r||[]).map(x=>x.user_id));
    const box=el("rxWho");if(!box)return;
    if(!r||!r.length){box.innerHTML='<p class="muted">لا توجد تفاعلات</p>';return}
    window._rxw=r;window.rxShow=function(k){const rows=(window._rxw||[]).filter(x=>!k||x.kind===k);el("rxWhoList").innerHTML=rows.map(x=>{const p=cl.pp[x.user_id]||{id:x.user_id,name:""};return '<div class="cmt" style="align-items:center" onclick="closeModal();openUser(\''+esc(x.user_id)+'\')">'+avHtml({...p,id:x.user_id},34)+'<b style="flex:1">'+esc(p.name||"مستخدم")+vfMark(p)+'</b><span style="font-size:20px">'+(RXM[x.kind]?RXM[x.kind][1]:"👍")+'</span></div>'}).join("")};
    const cnt={};r.forEach(x=>cnt[x.kind]=(cnt[x.kind]||0)+1);
    box.innerHTML='<div class="chips"><button class="chip on" onclick="rxShow(\'\')">الكل '+an(r.length)+'</button>'+RX.filter(x=>cnt[x[0]]).map(x=>'<button class="chip" onclick="rxShow(\''+x[0]+'\')">'+x[1]+' '+an(cnt[x[0]])+'</button>').join("")+'</div><div id="rxWhoList"></div>';
    rxShow("");
  }catch(e){const box=el("rxWho");box&&(box.textContent=sbErr(e))}
}
const _likeDraw0=likeDraw;
likeDraw=function(e){_likeDraw0(e);document.querySelectorAll("#lk-"+e+" .rxtop").forEach(i=>{i.setAttribute("role","button");i.onclick=ev=>rxWho(e,ev)})};
(function(){const s=document.createElement("style");s.textContent=".convw{display:flex;align-items:center;position:relative}.convw .conv{flex:1;min-width:0}.convm{border:0;background:none;font-size:20px;padding:8px 10px;color:var(--muted)}.ubadge{display:block;background:#d32f2f;color:#fff;border-radius:10px;font-style:normal;font-size:11px;padding:1px 6px;margin-top:4px;text-align:center}.conv.unr .cb b,.conv.unr .cb small{font-weight:800;color:#111}.rxtop{text-decoration:underline dotted}";document.head.appendChild(s)})();
