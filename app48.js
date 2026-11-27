/* Polls in posts (2 to 4 options, one vote per person, live results). */
(function(){
const pl={votes:{},mine:{},t:0};
const osm=window.svcModal;
window.svcModal=function(){
  const r=osm.apply(this,arguments);
  try{const a=document.getElementById("sPrev");
    if(a&&!document.getElementById("plQ")&&!(arguments[0])){
      const h=document.createElement("details");h.className="more";
      h.innerHTML='<summary>📊 إضافة استطلاع</summary><input id="plQ" class="input" maxlength="100" placeholder="سؤال الاستطلاع" aria-label="سؤال الاستطلاع"><input id="plA" class="input" maxlength="40" placeholder="الاختيار ١" aria-label="اختيار 1"><input id="plB" class="input" maxlength="40" placeholder="الاختيار ٢" aria-label="اختيار 2"><input id="plC" class="input" maxlength="40" placeholder="الاختيار ٣ (اختياري)" aria-label="اختيار 3"><input id="plD" class="input" maxlength="40" placeholder="الاختيار ٤ (اختياري)" aria-label="اختيار 4">';
      a.parentNode.insertBefore(h,a.nextSibling)}}catch(e){}
  return r};
const osend=window.svcSend;
window.svcSend=async function(){
  window.__poll=null;
  const q=(document.getElementById("plQ")||{}).value,o=["plA","plB","plC","plD"].map(i=>((document.getElementById(i)||{}).value||"").trim()).filter(Boolean);
  if(q&&q.trim()||o.length){
    if(o.length<2){const e=document.getElementById("sErr");if(e)e.textContent="الاستطلاع محتاج اختيارين على الأقل";return}
    window.__poll=[(q||"").trim().slice(0,100)].concat(o.map(x=>x.slice(0,40)))}
  try{return await osend.apply(this,arguments)}finally{window.__poll=null}};
const osb=window.sb;
window.sb=function(u,o){
  if(window.__poll&&o&&/\/rest\/v1\/service_posts/.test(u)&&o.method==="POST"&&o.body&&typeof o.body==="object")o.body.poll=window.__poll;
  return osb.apply(this,arguments)};
function box(id,poll){
  const q=poll[0],opts=poll.slice(1),v=pl.votes[id]||{},m=pl.mine[id],tot=Object.values(v).reduce((a,b)=>a+b,0),done=m!=null;
  return '<div class="plbox card" data-pl="'+id+'" style="margin:8px 0;padding:10px;background:rgba(21,91,80,.06)"><b>📊 '+esc(q||"استطلاع")+'</b>'+opts.map((t,i)=>{const n=v[i]||0,p=tot?Math.round(n*100/tot):0;
    return '<button type="button" class="plo" onclick="plVote(\''+id+'\','+i+')" style="display:block;width:100%;text-align:right;margin-top:6px;padding:9px 10px;border-radius:10px;border:2px solid '+(m===i?"#155b50":"#d9e2de")+';background:linear-gradient(to left,rgba(21,91,80,.22) '+p+'%,transparent '+p+'%);color:inherit"><span>'+(m===i?"✔ ":"")+esc(t)+'</span><span style="float:left">'+(done||tot?an(p)+"%":"")+'</span></button>'}).join("")+'<small class="muted">'+an(tot)+' صوت'+(done?" · اضغط على صوتك تاني لسحبه":"")+'</small></div>'}
const osc=window.svcCard;
window.svcCard=function(e){
  let h=osc.apply(this,arguments);
  if(!e||!Array.isArray(e.poll)||e.poll.length<3||!/^[0-9a-f-]{36}$/i.test(e.id||""))return h;
  const pid=e.repost_of||e.id,b=box(pid,e.poll).replace(/data-pl="[^"]*"/,'data-pl="'+pid+'" data-poll="'+esc(JSON.stringify(e.poll))+'"');
  const k=h.indexOf('<div class="eng">');h=k>0?h.slice(0,k)+b+h.slice(k):h.replace(/<\/div>$/,b+"</div>");
  clearTimeout(pl.t);pl.t=setTimeout(load,250);return h};
async function load(){
  const els=[...document.querySelectorAll(".plbox[data-pl]")];if(!els.length||!cs())return;
  const ids=[...new Set(els.map(x=>x.dataset.pl))].filter(i=>/^[0-9a-f-]{36}$/i.test(i)).slice(0,60);if(!ids.length)return;
  try{const r=await sb("/rest/v1/rpc/poll_counts",{method:"POST",body:{ids}})||[];
    ids.forEach(i=>{pl.votes[i]={};pl.mine[i]=null});r.forEach(x=>{(pl.votes[x.post_id]=pl.votes[x.post_id]||{})[x.option_idx]=Number(x.n);if(x.mine)pl.mine[x.post_id]=x.option_idx});
    redraw()}catch(e){}}
function redraw(){document.querySelectorAll(".plbox[data-pl]").forEach(el0=>{let p;try{p=JSON.parse(el0.dataset.poll)}catch(e){return}const t=document.createElement("div");t.innerHTML=box(el0.dataset.pl,p);const n=t.firstChild;n.dataset.poll=el0.dataset.poll;el0.replaceWith(n)})}
window.plVote=async function(id,i){
  if(!cs())return authModal("signup");if(banStop())return;
  try{await ensureProfile();const was=pl.mine[id];
    if(was!=null){await sb("/rest/v1/post_poll_votes?post_id=eq."+id+"&user_id=eq."+cs().uid,{method:"DELETE",prefer:"return=minimal"});pl.votes[id][was]=Math.max(0,(pl.votes[id][was]||1)-1);pl.mine[id]=null}
    if(was!==i){await sb("/rest/v1/post_poll_votes",{method:"POST",prefer:"return=minimal",body:{post_id:id,option_idx:i}});pl.votes[id]=pl.votes[id]||{};pl.votes[id][i]=(pl.votes[id][i]||0)+1;pl.mine[id]=i}
    redraw()}catch(e){msg(sbErr(e).slice(0,80));load()}};
})();
