/* Story replies: quick emoji reactions and a reply box inside the story viewer. Sent as a private message to the story owner. Story pauses while typing. */
(function(){
let hold=false;
const os=window.stStep;
if(typeof os==="function")window.stStep=function(d){if(hold&&d===1)return;return os.apply(this,arguments)};
async function chatWith(uid){
  const me=(cs()||{}).uid,[a,n]=me<uid?[me,uid]:[uid,me];
  await ensureProfile();
  let r=await sb("/rest/v1/dm_chats?select=id&user_a=eq."+a+"&user_b=eq."+n),id=r&&r[0]&&r[0].id;
  if(!id){r=await sb("/rest/v1/dm_chats",{method:"POST",prefer:"return=representation",body:{user_a:a,user_b:n}});id=r&&r[0]&&r[0].id}
  return id}
window.stReply=async function(uid,text,isEmoji){
  if(!cs())return authModal("login");if(banStop())return;
  text=(text||"").trim();if(!text)return;
  try{const c=await chatWith(uid);
    await sb("/rest/v1/dm_messages",{method:"POST",prefer:"return=minimal",body:{chat_id:c,body:(isEmoji?text+" تفاعل مع ستوريك":"↩️ رد على ستوريك: "+text).slice(0,1000)}});
    msg("اتبعت ✅");const i=document.getElementById("stRepIn");if(i)i.value=""}
  catch(e){msg(sbErr(e).slice(0,90))}};
function inject(){
  const m=document.getElementById("sheet")||document.getElementById("modal");if(!m||m.querySelector("#stRep"))return;
  const b=[...m.querySelectorAll("button")].find(x=>/closeModal\(\);startDm\('/.test(x.getAttribute("onclick")||""));if(!b)return;
  const uid=(/startDm\('([^']+)'/.exec(b.getAttribute("onclick"))||[])[1];if(!uid||!UUID_RE.test(uid))return;
  const w=document.createElement("div");w.id="stRep";w.style.cssText="margin-top:10px";
  w.innerHTML='<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px">'+["❤️","😂","😮","😢","👏","🔥"].map(e=>'<button type="button" class="chip" style="font-size:20px" data-e="'+e+'">'+e+'</button>').join("")+'</div><div style="display:flex;gap:6px"><input id="stRepIn" class="input" maxlength="500" placeholder="رد على الستوري…" style="flex:1;color:#222"><button type="button" class="chip on" id="stRepGo">إرسال</button></div>';
  b.closest(".row")?b.closest(".row").insertAdjacentElement("afterend",w):b.parentNode.appendChild(w);
  const i=w.querySelector("#stRepIn");i.onfocus=()=>{hold=true};i.onblur=()=>{hold=false};
  w.querySelectorAll("[data-e]").forEach(x=>x.onclick=()=>stReply(uid,x.dataset.e,true));
  w.querySelector("#stRepGo").onclick=()=>stReply(uid,i.value,false);
  i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();stReply(uid,i.value,false)}};
}
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
})();
