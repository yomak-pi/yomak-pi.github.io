/* Phase 4A: reactions (6 kinds), threaded comment replies, comment likes. Overrides the like/comment functions of the feed. */
const RX=[["like","👍","أعجبني"],["love","❤️","أحببته"],["care","🥰","أدعمه"],["haha","😂","أضحكني"],["wow","😮","واااو"],["sad","😢","أحزنني"],["angry","😡","أغضبني"]];
const RXM={};RX.forEach(r=>RXM[r[0]]=r);
fd.rx=fd.rx||{};fd.my=fd.my||{};fd.cl=fd.cl||{};let cmReply={};
function rxCount(e){const o=fd.rx[e]||{};return Object.keys(o).reduce((a,k)=>a+o[k],0)}
async function loadEngage(e){
  const t=e.map(e=>e.id).filter(e=>UUID_RE.test(e));if(!t.length)return;
  const s="in.("+t.join(",")+")",a=(cs()||{}).uid;
  try{
    const[r,c]=await Promise.all([sb("/rest/v1/post_reactions?select=post_id,user_id,kind&post_id="+s+"&limit=10000"),sb("/rest/v1/post_comments?select=post_id&post_id="+s+"&limit=5000")]);
    t.forEach(e=>{fd.lk[e]={n:0,me:!1};fd.cc[e]=0;fd.rx[e]={};delete fd.my[e]});
    (r||[]).forEach(x=>{const l=fd.lk[x.post_id];if(!l)return;l.n++;fd.rx[x.post_id][x.kind]=(fd.rx[x.post_id][x.kind]||0)+1;if(x.user_id===a){l.me=!0;fd.my[x.post_id]=x.kind}});
    (c||[]).forEach(x=>{x.post_id in fd.cc&&fd.cc[x.post_id]++});
  }catch(e){}
}
function likeDraw(e){
  document.querySelectorAll("#lk-"+e).forEach(b=>{
    const l=fd.lk[e]||{n:0,me:!1},k=fd.my[e],r=k&&RXM[k]?RXM[k]:null;
    const top=Object.entries(fd.rx[e]||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>RXM[x[0]]?RXM[x[0]][1]:"").join("");
    b.classList.toggle("on",l.me);
    if(!(b.nextElementSibling&&b.nextElementSibling.classList.contains("rxopen")))b.insertAdjacentHTML("afterend",'<button type="button" class="eb rxopen" aria-label="كل التفاعلات" onclick="showRxPicker(document.getElementById(\'lk-'+e+'\'))">☺ تفاعل</button>');
    b.innerHTML=(r?r[1]:"👍")+' <span>'+an(l.n)+'</span> '+(r?r[2]:"أعجبني")+(top&&l.n?' <i class="rxtop">'+top+'</i>':"");
  });
}
async function likeToggle(e,kind){
  e=UUID_RE.test(e)?e:"";const u=cs();if(!u||!e||banStop()){if(!u)authModal("login");return}
  hideRxPicker();
  const prev=fd.my[e],l=fd.lk[e]||(fd.lk[e]={n:0,me:!1});fd.rx[e]=fd.rx[e]||{};
  const next=kind?(kind===prev?null:kind):(prev?null:"like");
  const apply=(from,to)=>{if(from){fd.rx[e][from]=Math.max(0,(fd.rx[e][from]||1)-1);l.n=Math.max(0,l.n-1)}if(to){fd.rx[e][to]=(fd.rx[e][to]||0)+1;l.n++}l.me=!!to;if(to)fd.my[e]=to;else delete fd.my[e]};
  apply(prev,next);likeDraw(e);
  try{
    if(!next)await delRow("/rest/v1/post_reactions?post_id=eq."+e+"&user_id=eq."+u.uid);
    else await sb("/rest/v1/post_reactions?on_conflict=post_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=representation",body:{post_id:e,kind:next}});
  }catch(err){apply(next,prev);likeDraw(e);msg(sbErr(err).slice(0,80))}
}
/* reaction picker: long-press (touch) or hover (mouse) on the like button */
function hideRxPicker(){const p=document.getElementById("rxpick");if(p)p.remove()}
function rxPickerAt(r,onPick,cur){
  hideRxPicker();const p=document.createElement("div");
  p.id="rxpick";p.className="rxpick";
  p.innerHTML=RX.map(x=>'<button type="button" title="'+x[2]+'" aria-label="'+x[2]+'" data-k="'+x[0]+'"'+(cur===x[0]?' class="cur"':'')+'><b>'+x[1]+'</b><small>'+x[2]+'</small></button>').join("");
  document.body.appendChild(p);
  const w=p.offsetWidth;let left=Math.min(Math.max(6,r.left+r.width/2-w/2),window.innerWidth-w-6);
  p.style.left=left+"px";p.style.top=Math.max(8,r.top-74)+"px";
  p.addEventListener("click",ev=>{const b=ev.target.closest("button");if(b){ev.stopPropagation();hideRxPicker();onPick(b.dataset.k)}});
}
function showRxPicker(btn){const id=btn.id.slice(3);rxPickerAt(btn.getBoundingClientRect(),k=>likeToggle(id,k),fd.my[id])}
(function(){
  let timer=null,fired=false;
  const isLk=t=>t&&t.closest&&t.closest('button[id^="lk-"]');
  document.addEventListener("pointerdown",e=>{const b=isLk(e.target);if(!b)return;fired=false;if(e.pointerType==="mouse")return;timer=setTimeout(()=>{fired=true;showRxPicker(b)},450)},true);
  const cancel=()=>{clearTimeout(timer)};
  document.addEventListener("pointerup",cancel,true);document.addEventListener("pointercancel",cancel,true);document.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")cancel()},true);
  document.addEventListener("click",e=>{if(fired&&isLk(e.target)){e.stopPropagation();e.preventDefault();fired=false;return}if(!e.target.closest("#rxpick"))hideRxPicker()},true);
  document.addEventListener("contextmenu",e=>{if(isLk(e.target))e.preventDefault()});
  let hov=null;
  document.addEventListener("mouseover",e=>{const b=isLk(e.target);if(b&&!document.getElementById("rxpick")){clearTimeout(hov);hov=setTimeout(()=>showRxPicker(b),500)}},true);
  document.addEventListener("mouseout",e=>{if(isLk(e.target))clearTimeout(hov)},true);
})();
/* comments: threaded replies + comment likes */
async function cmLoad(e){
  try{
    const t=await sb("/rest/v1/post_comments?post_id=eq."+e+"&select=*&order=created_at.asc&limit=300");
    await loadPeople((t||[]).map(x=>x.user_id));
    fd.cm[e]=t||[];fd.cc[e]=fd.cm[e].length;
    const ids=fd.cm[e].map(x=>x.id).filter(x=>UUID_RE.test(x));
    if(ids.length){
      try{const L=await sb("/rest/v1/comment_likes?select=comment_id,user_id,kind&comment_id=in.("+ids.join(",")+")&limit=5000"),u=(cs()||{}).uid;ids.forEach(i=>fd.cl[i]={n:0,me:!1});(L||[]).forEach(x=>{const o=fd.cl[x.comment_id];if(o){o.n++;if(x.user_id===u){o.me=!0;o.k=x.kind}}})}catch(_){}
    }
    cmDraw(e);
  }catch(t){document.querySelectorAll("#cm-"+e).forEach(x=>x.textContent=sbErr(t))}
}
function cmDraw(e){
  const u=cs(),all=fd.cm[e]||[],post=allFeedPosts().find(x=>x.id===e),mine=post&&u&&post.user_id===u.uid;
  const byParent={};all.forEach(c=>{const p=c.parent_id&&all.some(x=>x.id===c.parent_id)?c.parent_id:"";(byParent[p]=byParent[p]||[]).push(c)});
  const one=(s,reply)=>{
    const a=cl.pp[s.user_id]||{id:s.user_id,name:""},me=u&&s.user_id===u.uid,c=UUID_RE.test(s.id)?s.id:"",lk=fd.cl[s.id]||{n:0,me:!1};
    return '<div class="cmt'+(reply?' cmrep':'')+'">'+avHtml({...a,id:s.user_id},reply?24:30)+'<div class="cmb"><b>'+esc(a.name||"مستخدم")+vfMark(a)+'</b> <span>'+esc(s.body)+'</span><small>'+agoAr(s.created_at)+
      ' · <a href="#" class="'+(lk.me?"cmlk on":"cmlk")+'" onclick="cmLike(\''+e+'\',\''+c+'\');return false">'+(lk.me?"❤️":"🤍")+(lk.n?" "+an(lk.n):"")+' أعجبني</a>'+
      ' · <a href="#" onclick="cmReplyTo(\''+e+'\',\''+c+'\');return false">رد</a>'+
      ' · <a href="#" onclick="copyItem(\'comment\',\''+c+'\');return false">نسخ</a>'+
      (me?' · <a href="#" onclick="editItem(\'comment\',\''+c+'\');return false">تعديل</a>':' · <a href="#" onclick="reportItem(\'comment\',\''+c+'\');return false">إبلاغ</a>')+
      (me||mine||cl.admin?' · <a href="#" onclick="cmDel(\''+e+'\',\''+c+'\');return false">حذف</a>':"")+
      (cl.admin&&!me?' · <a href="#" onclick="banModal(\''+(UUID_RE.test(s.user_id)?s.user_id:"")+'\');return false">حظر</a>':"")+'</small></div></div>';
  };
  const tree=(byParent[""]||[]).map(c=>one(c,false)+(byParent[c.id]||[]).map(r=>one(r,true)).join("")).join("")||'<p class="muted" style="margin:4px 0">كن أول من يعلّق</p>';
  const rp=cmReply[e],rpc=rp&&all.find(x=>x.id===rp),rpn=rpc?((cl.pp[rpc.user_id]||{}).name||"مستخدم"):"";
  const box=(rp&&rpc?'<div class="cmrpl">ردًا على <b>'+esc(rpn)+'</b> <a href="#" onclick="cmReplyTo(\''+e+'\',\'\');return false">إلغاء</a></div>':"")+
    '<div class="cmin"><input id="cmi-'+e+'" class="input" maxlength="500" placeholder="'+(rpc?"اكتب ردًا…":"اكتب تعليقًا…")+'" aria-label="تعليق" onkeydown="if(event.key===\'Enter\')cmSend(\''+e+'\')"><button class="pact" onclick="cmSend(\''+e+'\')">إرسال</button></div>';
  document.querySelectorAll("#cm-"+e).forEach(x=>{if(!x.classList.contains("hide"))x.innerHTML=tree+box});
  document.querySelectorAll("#cmn-"+e).forEach(t=>t.textContent=an(fd.cc[e]||0));
}
function cmReplyTo(e,c){cmReply[e]=UUID_RE.test(c)?c:"";cmDraw(e);const i=[...document.querySelectorAll("#cmi-"+e)].pop();if(i)i.focus()}
async function cmSend(e){
  e=UUID_RE.test(e)?e:"";const i=[...document.querySelectorAll("#cmi-"+e)].pop(),s=i?i.value.trim():"";
  if(!s||!e||banStop())return;
  try{
    await ensureProfile();
    const body={post_id:e,body:s.slice(0,500)},p=cmReply[e];if(p&&UUID_RE.test(p))body.parent_id=p;
    const t=await sb("/rest/v1/post_comments",{method:"POST",prefer:"return=representation",body});
    if(!t||!t.length)throw{message:"تعذر إرسال التعليق"};
    cmReply[e]="";await cmLoad(e);
  }catch(err){msg(sbErr(err).slice(0,90))}
}
async function cmLike(e,c){
  const u=cs();if(!u){authModal("login");return}if(!UUID_RE.test(c)||banStop())return;
  const o=fd.cl[c]||(fd.cl[c]={n:0,me:!1}),was=o.me;o.me=!was;o.n=Math.max(0,o.n+(was?-1:1));cmDraw(e);
  try{was?await delRow("/rest/v1/comment_likes?comment_id=eq."+c+"&user_id=eq."+u.uid):await sb("/rest/v1/comment_likes?on_conflict=comment_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{comment_id:c}})}
  catch(err){o.me=was;o.n=Math.max(0,o.n+(was?1:-1));cmDraw(e);msg(sbErr(err).slice(0,80))}
}
(function(){const s=document.createElement("style");s.textContent=".rxpick{position:fixed;z-index:9999;display:flex;gap:2px;background:#fff;border:1px solid var(--line,#ddd);border-radius:30px;padding:4px 6px;box-shadow:0 6px 24px rgba(0,0,0,.2)}.rxpick{max-width:calc(100vw - 12px)}.rxpick button{border:0;background:none;line-height:1;padding:4px 3px;border-radius:12px;transition:transform .12s;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:40px;min-height:52px;color:inherit}.rxpick button b{font-size:27px;font-weight:400}.rxpick button small{font-size:9px;margin-top:2px;white-space:nowrap}.rxpick button.cur{background:#e8f5ef}.rxopen{font-size:13px}.rxpick button:hover,.rxpick button:active{transform:scale(1.35)}.rxtop{font-style:normal;margin-inline-start:2px}.cmrep{margin-inline-start:34px}.cmlk.on{color:#c0392b;font-weight:700}.cmrpl{font-size:12px;color:var(--muted);margin:6px 2px 0}";document.head.appendChild(s)})();

/* comment reactions: all 7 kinds, long-press / hover / tap on the reaction link */
const _cmDraw=cmDraw;
cmDraw=function(e){
  _cmDraw(e);
  document.querySelectorAll("#cm-"+e+" a.cmlk").forEach(a=>{
    const m=(a.getAttribute("onclick")||"").match(/cmLike\('([^']*)','([^']*)'\)/);if(!m)return;
    a.dataset.pe=m[1];a.dataset.pc=m[2];const o=fd.cl[m[2]]||{},r=o.me&&RXM[o.k||"like"];
    if(r)a.innerHTML=r[1]+(o.n?" "+an(o.n):"")+" "+r[2];
    if(!a.nextElementSibling||!a.nextElementSibling.classList.contains("cmopen"))a.insertAdjacentHTML("afterend",' <a href="#" class="cmopen" onclick="cmPick(this.previousElementSibling);return false">☺</a>');
  });
};
function cmPick(a){if(!a||!a.dataset.pc)return;const o=fd.cl[a.dataset.pc]||{};rxPickerAt(a.getBoundingClientRect(),k=>cmReact(a.dataset.pe,a.dataset.pc,k),o.me?o.k:"")}
async function cmReact(e,c,k){
  const u=cs();if(!u){authModal("login");return}if(!UUID_RE.test(c)||banStop())return;
  const o=fd.cl[c]||(fd.cl[c]={n:0,me:!1}),was=o.me,wk=o.k;
  if(was&&wk===k){return cmLike(e,c)}
  o.me=!0;o.k=k;if(!was)o.n++;cmDraw(e);
  try{await sb("/rest/v1/comment_likes?on_conflict=comment_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{comment_id:c,kind:k}})}
  catch(err){o.me=was;o.k=wk;if(!was)o.n=Math.max(0,o.n-1);cmDraw(e);msg(sbErr(err).slice(0,80))}
}
(function(){
  let t=null,fired=false;const isC=x=>x&&x.closest&&x.closest("a.cmlk[data-pc]");
  document.addEventListener("pointerdown",e=>{const a=isC(e.target);if(!a||e.pointerType==="mouse")return;fired=false;t=setTimeout(()=>{fired=true;cmPick(a)},450)},true);
  ["pointerup","pointercancel"].forEach(n=>document.addEventListener(n,()=>clearTimeout(t),true));
  document.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")clearTimeout(t)},true);
  document.addEventListener("click",e=>{if(fired&&isC(e.target)){e.stopPropagation();e.preventDefault();fired=false}},true);
  document.addEventListener("contextmenu",e=>{if(isC(e.target))e.preventDefault()});
  let hv=null;document.addEventListener("mouseover",e=>{const a=isC(e.target);if(a&&!document.getElementById("rxpick")){clearTimeout(hv);hv=setTimeout(()=>cmPick(a),500)}},true);
  document.addEventListener("mouseout",e=>{if(isC(e.target))clearTimeout(hv)},true);
})();
