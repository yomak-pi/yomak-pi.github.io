/* Phase 6: Reels (short vertical videos). Free-tier sized: max 30 MB and 60 s per video, stored in the "reels" bucket. */
const rl={list:[],likes:{},mine:{},cc:{},end:0,busy:0,muted:true,io:null,viewed:{}};
const RL_MAX=30*1024*1024,RL_SEC=60;
KIND_AR.reel="ريل";
const rlCss=document.createElement("style");
rlCss.textContent=".rlbox{margin:-14px -15px -40px;height:calc(100dvh - 64px);background:#000;position:relative}.rlsc{height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none}.rlsc::-webkit-scrollbar{display:none}"+
".rlc{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;background:#000;overflow:hidden}.rlc video{width:100%;height:100%;object-fit:contain;background:#000}"+
".rlg{position:absolute;inset:auto 0 0 0;height:45%;background:linear-gradient(transparent,#000b);pointer-events:none}"+
".rlside{position:absolute;bottom:90px;left:10px;display:flex;flex-direction:column;gap:14px;align-items:center;z-index:2}.rlside button{border:0;background:#0006;color:#fff;width:48px;height:48px;border-radius:50%;font-size:22px;display:grid;place-items:center;line-height:1}.rlside small{color:#fff;font-size:12px;margin-top:-10px;text-shadow:0 1px 3px #000}.rlside .on{background:#d32f2f}"+
".rlinfo{position:absolute;bottom:20px;right:12px;left:76px;color:#fff;z-index:2;text-shadow:0 1px 4px #000}.rlinfo .who{display:flex;align-items:center;gap:8px;font-weight:800}.rlinfo p{margin:6px 0 0;font-size:14px;line-height:1.4;max-height:60px;overflow:hidden}"+
".rlmute{position:absolute;top:10px;left:10px;border:0;background:#0006;color:#fff;border-radius:18px;padding:6px 12px;font:inherit;z-index:3}.rlnew{position:absolute;top:10px;right:10px;border:0;background:var(--gold,#e0a030);color:#222;border-radius:18px;padding:6px 14px;font:inherit;font-weight:800;z-index:3}"+
".rlpp{position:absolute;inset:0;display:none;place-items:center;font-size:64px;color:#fffd;pointer-events:none;z-index:1}.rlc.paused .rlpp{display:grid}"+
".rlemp{height:100%;display:grid;place-items:center;color:#fff;text-align:center;padding:24px}.rlemp button{margin-top:12px}"+
".rlcm{max-height:46vh;overflow:auto;margin:8px 0}.rlcm .c{display:flex;gap:8px;margin:8px 0}.rlcm .c div{flex:1;background:#f1f4f3;border-radius:12px;padding:6px 10px}.rlcm small{color:var(--muted,#667)}";
document.head.append(rlCss);
async function rlLoad(more){
  if(rl.busy||(more&&rl.end))return;rl.busy=1;
  try{
    let u="/rest/v1/reels?select=*&order=id.desc&limit=8";if(more&&rl.list.length)u+="&id=lt."+rl.list[rl.list.length-1].id;
    const r=await sb(u)||[];if(r.length<8)rl.end=1;
    if(r.length){
      const ids=r.map(x=>x.id).join(",");
      const[lk,cm]=await Promise.all([sb("/rest/v1/reel_likes?select=reel_id,user_id&reel_id=in.("+ids+")").catch(()=>[]),sb("/rest/v1/reel_comments?select=reel_id&reel_id=in.("+ids+")").catch(()=>[])]);
      const me=(cs()||{}).uid;(lk||[]).forEach(l=>{rl.likes[l.reel_id]=(rl.likes[l.reel_id]||0)+1;if(l.user_id===me)rl.mine[l.reel_id]=1});
      (cm||[]).forEach(c=>rl.cc[c.reel_id]=(rl.cc[c.reel_id]||0)+1);
      try{await loadPeople(r.map(x=>x.user_id))}catch(e){}
      rl.list=rl.list.concat(r);
    }
  }catch(e){rl.err=sbErr(e);rl.end=1}
  rl.busy=0;rlDraw(more);
}
function rlCard(x){
  const p=cl.pp[x.user_id]||{id:x.user_id,name:"مستخدم"},me=(cs()||{}).uid===x.user_id;
  return '<section class="rlc" data-id="'+x.id+'"><video src="'+esc(x.video_url)+'" playsinline loop '+(rl.muted?"muted":"")+' preload="none"></video><div class="rlpp">▶</div><div class="rlg"></div>'+
   '<div class="rlside"><button class="'+(rl.mine[x.id]?"on":"")+'" aria-label="إعجاب" onclick="rlLike('+x.id+',this)">❤</button><small id="rll'+x.id+'">'+an(rl.likes[x.id]||0)+'</small>'+
   '<button aria-label="تعليقات" onclick="rlComments('+x.id+')">💬</button><small id="rlc'+x.id+'">'+an(rl.cc[x.id]||0)+'</small>'+
   '<button aria-label="مشاركة" onclick="rlShare('+x.id+')">↗</button>'+(me||cl.admin?'<button aria-label="حذف" onclick="rlDel('+x.id+')">🗑</button>':'<button aria-label="إبلاغ" onclick="reportItem(\'reel\',\''+x.id+'\')">🚩</button>')+'</div>'+
   '<div class="rlinfo"><div class="who" onclick="openPage(\'user\',{id:\''+x.user_id+'\'})">'+avHtml(p,36)+'<span>'+esc(p.name||"")+'</span></div>'+(x.caption?'<p>'+esc(x.caption)+'</p>':"")+'</div></section>';
}
function rlDraw(more){
  const sc=el("rlSc");if(!sc)return;
  if(!rl.list.length){sc.innerHTML='<div class="rlemp"><div><div style="font-size:48px">🎬</div><b>'+(rl.err?esc(rl.err):"لسه مفيش ريلز")+'</b><br><button class="primary" onclick="rlNew()">＋ انشر أول ريل</button></div></div>';return}
  if(more){const keep=sc.scrollTop;sc.insertAdjacentHTML("beforeend",rl.list.slice(sc.querySelectorAll(".rlc").length).map(rlCard).join(""));sc.scrollTop=keep}
  else sc.innerHTML=rl.list.map(rlCard).join("");
  rlObserve();
}
function rlObserve(){
  const sc=el("rlSc");if(!sc)return;if(rl.io)rl.io.disconnect();
  rl.io=new IntersectionObserver(es=>{es.forEach(e=>{
    const c=e.target,v=c.querySelector("video"),id=c.dataset.id;
    if(e.isIntersecting&&e.intersectionRatio>.6){
      v.muted=rl.muted;v.preload="auto";const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{});c.classList.remove("paused");
      if(!rl.viewed[id]){rl.viewed[id]=1;sb("/rest/v1/rpc/reel_view",{method:"POST",body:{rid:Number(id)}}).catch(()=>{})}
      const all=[...sc.querySelectorAll(".rlc")],i=all.indexOf(c);if(all[i+1])all[i+1].querySelector("video").preload="metadata";
      if(i>=all.length-2)rlLoad(true);
    }else{try{v.pause()}catch(x){}}
  })},{root:sc,threshold:[0,.6,.9]});
  sc.querySelectorAll(".rlc").forEach(c=>{rl.io.observe(c);const v=c.querySelector("video");v.onclick=()=>{if(v.paused){v.play();c.classList.remove("paused")}else{v.pause();c.classList.add("paused")}}});
}
PAGES.reels={title:()=>"🎬 ريلز",render:()=>{
  if(!cs())return authCard();
  return '<div class="rlbox"><button class="rlnew" onclick="rlNew()">＋ ريل</button><button class="rlmute" id="rlMu" onclick="rlMute()">'+(rl.muted?"🔇 صوت":"🔊")+'</button><div class="rlsc" id="rlSc"><div class="rlemp">جارِ التحميل…</div></div></div>';
},after:()=>{if(!cs())return;if(!rl.list.length&&!rl.busy){rl.end=0;rl.err="";rlLoad(false)}else rlDraw(false)}};
window.rlMute=()=>{rl.muted=!rl.muted;document.querySelectorAll(".rlc video").forEach(v=>v.muted=rl.muted);const b=el("rlMu");if(b)b.textContent=rl.muted?"🔇 صوت":"🔊"};
window.openReels=()=>{rl.list=[];rl.end=0;rl.likes={};rl.mine={};rl.cc={};openPage("reels")};
window.rlLike=async(id,b)=>{
  if(!cs())return authModal("signup");
  const on=!rl.mine[id];rl.mine[id]=on?1:0;rl.likes[id]=Math.max(0,(rl.likes[id]||0)+(on?1:-1));b.classList.toggle("on",!!on);el("rll"+id).textContent=an(rl.likes[id]);
  try{if(on)await sb("/rest/v1/reel_likes",{method:"POST",prefer:"return=minimal",body:{reel_id:id,user_id:cs().uid}});else await sb("/rest/v1/reel_likes?reel_id=eq."+id,{method:"DELETE",prefer:"return=minimal"})}
  catch(e){rl.mine[id]=on?0:1;rl.likes[id]=Math.max(0,(rl.likes[id]||0)+(on?-1:1));b.classList.toggle("on",!on);el("rll"+id).textContent=an(rl.likes[id]);msg(sbErr(e).slice(0,70))}
};
window.rlShare=id=>{const x=rl.list.find(r=>r.id===id),t=(x&&x.caption)||"ريل على يومك",u=location.origin+location.pathname;try{navigator.share?navigator.share({title:t,url:u}):(copyText(t+" - "+u),msg("اتنسخ ✅"))}catch(e){}};
window.rlDel=async id=>{
  if(!confirm("حذف الريل؟"))return;
  try{await sb("/rest/v1/reels?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});rl.list=rl.list.filter(r=>r.id!==id);msg("تم الحذف");rlDraw(false)}catch(e){msg(sbErr(e).slice(0,80))}
};
window.rlComments=async id=>{
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>💬 التعليقات</h3><div class="rlcm" id="rlCm"><p class="muted">جارِ التحميل…</p></div><div class="row"><input id="rlIn" class="input" maxlength="500" placeholder="اكتب تعليق…" style="flex:1"><button class="primary" style="flex:0 0 auto;width:auto;padding:0 18px" onclick="rlSend('+id+')">إرسال</button></div>');
  rlCmDraw(id);
};
async function rlCmDraw(id){
  try{
    const l=await sb("/rest/v1/reel_comments?select=*&reel_id=eq."+id+"&order=id.asc&limit=100")||[];
    try{await loadPeople(l.map(c=>c.user_id))}catch(e){}
    const me=(cs()||{}).uid,b=el("rlCm");if(!b)return;
    b.innerHTML=l.length?l.map(c=>{const p=cl.pp[c.user_id]||{id:c.user_id,name:"مستخدم"};return'<div class="c">'+avHtml(p,32)+'<div><b>'+esc(p.name||"")+'</b> <small>'+agoAr(c.created_at)+'</small><br>'+esc(c.body)+((c.user_id===me||cl.admin)?' <button class="pact" onclick="rlCmDel('+c.id+','+id+')">🗑</button>':"")+'</div></div>'}).join(""):'<p class="muted">لسه مفيش تعليقات. كن أول واحد.</p>';
    rl.cc[id]=l.length;const n=el("rlc"+id);if(n)n.textContent=an(l.length);
  }catch(e){const b=el("rlCm");if(b)b.innerHTML='<p class="muted">'+esc(sbErr(e))+'</p>'}
}
window.rlSend=async id=>{
  if(!cs())return authModal("signup");if(banStop())return;const t=val("rlIn");if(!t)return;
  try{await ensureProfile();await sb("/rest/v1/reel_comments",{method:"POST",prefer:"return=minimal",body:{reel_id:id,user_id:cs().uid,body:t.slice(0,500)}});el("rlIn").value="";rlCmDraw(id)}catch(e){msg(sbErr(e).slice(0,80))}
};
window.rlCmDel=async(cid,id)=>{try{await sb("/rest/v1/reel_comments?id=eq."+cid,{method:"DELETE",prefer:"return=minimal"});rlCmDraw(id)}catch(e){msg(sbErr(e).slice(0,80))}};
/* create */
window.rlNew=function(){
  if(!cs())return authModal("signup");if(banStop())return;
  formModal("🎬 ريل جديد",'<label class="lbl">الفيديو (حتى '+an(RL_SEC)+' ثانية و ٣٠ ميجا)</label><input id="rlFile" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" class="input" onchange="rlPick(this)"><video id="rlPrev" playsinline muted controls style="display:none;width:100%;max-height:38vh;border-radius:12px;margin-top:8px;background:#000"></video><p id="rlInfo" class="muted"></p>'+
   inp("rlCap","وصف (اختياري)","",{area:1,max:200,rows:2})+'<div id="rlProg" style="height:6px;background:#e3e8e6;border-radius:4px;display:none"><div id="rlBar" style="height:100%;width:0;background:var(--g,#155b50);border-radius:4px"></div></div><p id="rlErr" class="muted" style="color:#b0352d"></p>',
   ()=>(rlPublish(),!1),{save:"نشر"});
};
rl.dur=0;
window.rlPick=inpEl=>{
  const f=inpEl.files&&inpEl.files[0],info=el("rlInfo"),pv=el("rlPrev");rl.dur=0;if(!f)return;
  if(f.size>RL_MAX){info.textContent="⚠️ الفيديو أكبر من ٣٠ ميجا. قصّه أو صغّر الجودة.";inpEl.value="";return}
  pv.style.display="block";pv.src=URL.createObjectURL(f);
  pv.onloadedmetadata=()=>{rl.dur=Math.round(pv.duration||0);if(rl.dur>RL_SEC){info.textContent="⚠️ الفيديو "+an(rl.dur)+" ثانية. الحد "+an(RL_SEC)+" ثانية.";inpEl.value="";pv.style.display="none";rl.dur=0}else info.textContent="✅ "+an(rl.dur)+" ثانية · "+an((f.size/1048576).toFixed(1))+" ميجا"};
  pv.onerror=()=>{info.textContent="⚠️ الجهاز ما قدرش يقرأ الفيديو ده. جرّب MP4.";};
};
function rlUpload(f,path,tok){
  return new Promise((ok,no)=>{
    const x=new XMLHttpRequest();x.open("POST",SB_URL+"/storage/v1/object/reels/"+path);
    x.setRequestHeader("apikey",SB_KEY);x.setRequestHeader("Authorization","Bearer "+tok);x.setRequestHeader("Content-Type",f.type||"video/mp4");
    x.upload.onprogress=e=>{if(e.lengthComputable){const b=el("rlBar");if(b)b.style.width=Math.round(e.loaded/e.total*100)+"%"}};
    x.onload=()=>x.status>=200&&x.status<300?ok(SB_URL+"/storage/v1/object/public/reels/"+path):no(new Error("رفع الفيديو فشل ("+x.status+")"));
    x.onerror=()=>no(new Error("مشكلة في الاتصال أثناء الرفع"));x.send(f);
  });
}
async function rlPublish(){
  const f=(el("rlFile")||{}).files&&el("rlFile").files[0];if(!f)return msg("اختار فيديو");
  if(f.size>RL_MAX)return msg("الفيديو أكبر من ٣٠ ميجا");if(!rl.dur)return msg("استنى الفيديو يتحمّل أو اختار فيديو تاني");
  const er=el("rlErr");if(er)er.textContent="";el("rlProg").style.display="block";
  try{
    await ensureProfile();const t=cs();if(t.exp-30<Date.now()/1e3)await sb("/rest/v1/profiles?id=eq."+t.uid+"&select=id");const s=cs();
    const ext=/webm/.test(f.type)?"webm":/quicktime/.test(f.type)?"mov":"mp4";
    const url=await rlUpload(f,s.uid+"/"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+"."+ext,s.access);
    await sb("/rest/v1/reels",{method:"POST",prefer:"return=minimal",body:{video_url:url,caption:val("rlCap").slice(0,200)||null,duration_s:Math.max(1,Math.min(90,rl.dur)),country:d.country==="SA"?"SA":"EG"}});
    closeModal();msg("تم نشر الريل 🎬");rl.list=[];rl.end=0;if(curPage()==="reels")rlLoad(false);
  }catch(e){if(er)er.textContent="⚠️ "+(e.message||sbErr(e));el("rlProg").style.display="none"}
}
(function(){const f=window.findItem;window.findItem=function(k,id){if(k==="reel"){const x=rl.list.find(r=>String(r.id)===String(id));if(x)return{author:x.user_id,snap:x.caption||"ريل",ref:String(x.id)}}return f.apply(this,arguments)}})();
