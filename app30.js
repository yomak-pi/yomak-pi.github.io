/* Phase 4E2: stories (24h): friends/followers see them, text or photo, view counts, delete, reply by DM. */
cl.st={list:[],views:{},loaded:0,seen:{}};
const stMe=()=>(cs()||{}).uid;
const STBG=["#155b50","#b0352d","#2f5fa8","#8a5200","#5b3a8a","#222"];
async function stLoad(){
  const u=stMe();if(!u)return;
  try{
    const l=await sb("/rest/v1/stories?select=*&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&order=created_at.asc&limit=200")||[];
    cl.st.list=l;await loadPeople(l.map(s=>s.user_id));
    const v=await sb("/rest/v1/story_views?select=story_id,user_id").catch(()=>[]);cl.st.views={};cl.st.seen={};
    (v||[]).forEach(x=>{(cl.st.views[x.story_id]=cl.st.views[x.story_id]||[]).push(x.user_id);if(x.user_id===u)cl.st.seen[x.story_id]=1});
    cl.st.loaded=1;
  }catch(e){cl.st.err=sbErr(e);cl.st.loaded=1}
  if(curPage()==="stories")renderPage();
}
function stGroups(){const g={};cl.st.list.forEach(s=>(g[s.user_id]=g[s.user_id]||[]).push(s));return g}
PAGES.stories={title:()=>"الستوريز",render:()=>{
  if(!cs())return authCard();if(!cl.st.loaded){stLoad();return '<p class="muted">جاري التحميل…</p>'}
  const g=stGroups(),u=stMe(),ids=Object.keys(g).sort((a,b)=>(a===u?-1:b===u?1:0));
  let h='<div class="chips"><button class="chip on" onclick="stNew()">＋ ستوري جديدة</button></div>'+(cl.st.err?'<div class="card alertbox">'+esc(cl.st.err)+'</div>':"");
  h+=ids.length?ids.map(uid=>{const p=cl.pp[uid]||{id:uid,name:"مستخدم"},all=g[uid].every(s=>cl.st.seen[s.id]);return '<div class="person" onclick="stView(\''+uid+'\')"><span style="border:3px solid '+(all?"#ccc":"var(--gold)")+';border-radius:50%;display:inline-block">'+avHtml(p,44)+'</span><span class="pb"><b>'+(uid===u?"ستوريتي":esc(p.name||""))+'</b><small>'+an(g[uid].length)+' · '+agoAr(g[uid][g[uid].length-1].created_at)+'</small></span></div>'}).join(""):'<div class="card empty"><div style="font-size:34px">🖼️</div><b>لا توجد ستوريز</b><p class="muted">ستوريز أصدقائك ومن تتابعهم بتظهر هنا لمدة ٢٤ ساعة.</p></div>';
  return h;
}};
function stNew(){
  window._stBg=STBG[0];
  formModal("ستوري جديدة",'<textarea id="stBody" class="input" rows="3" maxlength="200" placeholder="اكتب ستوري نصية"></textarea><div class="chips">'+STBG.map(c=>'<button type="button" class="chip" style="background:'+c+';color:#fff" onclick="window._stBg=\''+c+'\'">لون</button>').join("")+'</div><label class="lbl">أو صورة</label><input id="stImg" type="file" accept="image/*" class="input">',()=>(stSave(),!1),{save:"نشر"});
}
async function stSave(){
  if(banStop())return;const t=(val("stBody")||"").trim(),f=el("stImg")&&el("stImg").files[0];if(!t&&!f)return msg("اكتب نص أو اختار صورة");
  try{await ensureProfile();let url=null;if(f){const u=await upImg(await gImgData(f));if(u&&u.startsWith("https://"))url=u}
    await sb("/rest/v1/stories",{method:"POST",prefer:"return=minimal",body:{user_id:stMe(),media_url:url,body:t||null,bg:window._stBg||STBG[0]}});closeModal();msg("تم نشر الستوري ✅");await stLoad()}catch(e){msg(sbErr(e).slice(0,90))}
}
let stI=0,stUid=null,stTm=null;
function stView(uid){
  stUid=uid;const l=(stGroups()[uid]||[]);stI=Math.max(0,l.findIndex(s=>!cl.st.seen[s.id]));stDraw();
}
function stDraw(){
  const l=stGroups()[stUid]||[],s=l[stI];clearTimeout(stTm);if(!s){closeModal();return}
  const u=stMe(),p=cl.pp[stUid]||{id:stUid,name:"مستخدم"},mine=stUid===u,vs=(cl.st.views[s.id]||[]).filter(x=>x!==u).length;
  openModal('<div style="background:'+esc(s.bg||"#155b50")+';color:#fff;border-radius:16px;min-height:60vh;padding:12px;position:relative"><div style="display:flex;gap:4px;margin-bottom:8px">'+l.map((x,i)=>'<span style="flex:1;height:3px;border-radius:2px;background:'+(i<=stI?"#fff":"#ffffff55")+'"></span>').join("")+'</div><div class="row between"><span class="row">'+avHtml(p,32)+' <b>'+esc(mine?"ستوريتي":p.name||"")+'</b> <small>'+agoAr(s.created_at)+'</small></span><button class="close" onclick="closeModal()">×</button></div>'+
   (s.media_url&&imgOk(s.media_url)?'<img src="'+esc(s.media_url)+'" alt="" style="width:100%;max-height:55vh;object-fit:contain;border-radius:10px;margin-top:8px">':"")+(s.body?'<p style="font-size:22px;text-align:center;margin:40px 8px;overflow-wrap:anywhere">'+esc(s.body)+'</p>':"")+
   '<div class="row between" style="margin-top:10px"><button class="chip" onclick="stStep(-1)">→ السابق</button>'+(mine?'<span>👁 '+an(vs)+'</span><button class="chip" onclick="stDel('+s.id+')">🗑</button>':'<button class="chip" onclick="closeModal();startDm(\''+stUid+'\')">💬 رد</button>')+'<button class="chip" onclick="stStep(1)">التالي ←</button></div></div>');
  if(!mine&&!cl.st.seen[s.id]){cl.st.seen[s.id]=1;sb("/rest/v1/story_views",{method:"POST",prefer:"return=minimal",body:{story_id:s.id,user_id:u}}).catch(()=>{})}
  stTm=setTimeout(()=>{if(stUid&&el("sheet")&&!el("modal").classList.contains("hide"))stStep(1)},7000);
}
function stStep(d){stI+=d;if(stI<0)stI=0;stDraw()}
async function stDel(id){if(!confirm("حذف الستوري؟"))return;try{await sb("/rest/v1/stories?id=eq."+id,{method:"DELETE",prefer:"return=minimal"});closeModal();await stLoad()}catch(e){msg(sbErr(e).slice(0,90))}}
const _gl4=window.gListHtml;
window.gListHtml=function(){return '<div class="card" onclick="openPage(\'stories\')" style="cursor:pointer"><b>🖼️ الستوريز</b><p class="muted">شوف ستوريز أصدقائك وانشر ستوريك.</p></div>'+_gl4.apply(this,arguments)};
