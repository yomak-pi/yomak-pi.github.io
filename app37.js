/* Phase 5: bottom nav (home | chat+groups | + | market | expenses | account) and a Facebook-style home. */
(function(){
const st=document.createElement("style");
st.textContent=
".seg2{display:flex;gap:6px;background:#e8eeec;border-radius:14px;padding:4px;margin:2px 0 10px}.seg2 button{flex:1;border:0;background:none;min-height:40px;border-radius:11px;font:inherit;font-weight:700;color:var(--muted,#667)}.seg2 button.on{background:#fff;color:var(--g,#155b50);box-shadow:0 1px 4px #0002}"+
".fbtop{display:flex;align-items:center;gap:8px;margin:2px 0 8px}.fbtop b{flex:1;font-size:20px;color:var(--g,#155b50)}.fbtop button{width:40px;height:40px;border-radius:50%;border:0;background:#e8eeec;font-size:18px;position:relative}"+
".fbcomp{padding:10px 12px}.fbcomp .fh{display:flex;gap:8px;align-items:center}.fbcomp .cbtn{flex:1;text-align:right;border:0;background:#eef2f1;border-radius:22px;min-height:42px;padding:0 14px;font:inherit;color:var(--muted,#667)}"+
".fbsep{height:1px;background:var(--line,#e3e8e6);margin:10px 0 6px}.fbacts{display:flex;justify-content:space-around}.fbacts button{border:0;background:none;font:inherit;font-weight:700;font-size:13px;min-height:40px;padding:0 6px;color:#445}"+
".fbst{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}.fbst::-webkit-scrollbar{display:none}"+
".stc{flex:0 0 96px;height:164px;border-radius:14px;position:relative;overflow:hidden;color:#fff;background:#155b50 center/cover;cursor:pointer;border:0;padding:0;text-align:right}"+
".stc .ring{position:absolute;top:8px;right:8px;border:3px solid var(--gold,#e0a030);border-radius:50%;display:inline-block;background:#fff}.stc.seen .ring{border-color:#ccc}"+
".stc .nm{position:absolute;bottom:0;left:0;right:0;padding:18px 6px 6px;font-size:12px;font-weight:700;background:linear-gradient(transparent,#000a)}"+
".stc.add{background:#fff;color:#222;border:1px solid var(--line,#e3e8e6)}.stc.add .pl{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:var(--g,#155b50);color:#fff;font-size:22px;display:grid;place-items:center;border:3px solid #fff}.stc.add .nm{background:none;color:#222;text-align:center}.stc.add .top{height:100px;background:#e8eeec;display:grid;place-items:center}"+
".fbq{margin:0 0 10px;background:#fff;border:1px solid var(--line,#e3e8e6);border-radius:16px;padding:0 12px}.fbq>summary{min-height:44px;display:flex;align-items:center;font-weight:700;cursor:pointer}.fbq[open]{padding-bottom:6px}"+
".sugg{background:#fff;border:1px solid var(--line,#e3e8e6);border-radius:16px;padding:10px 0 4px;margin:10px 0}.sugg h4{margin:0 12px 8px;font-size:15px}.sugg .rw{display:flex;gap:8px;overflow-x:auto;padding:0 12px 8px;scrollbar-width:none}.sugg .rw::-webkit-scrollbar{display:none}"+
".sgc{flex:0 0 138px;border:1px solid var(--line,#e3e8e6);border-radius:14px;padding:10px 8px;text-align:center;position:relative;background:#fafcfb}.sgc b{display:block;font-size:13px;margin:6px 0 2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.sgc small{display:block;color:var(--muted,#667);font-size:11px;min-height:15px}.sgc .go{margin-top:8px;width:100%;border:0;border-radius:10px;min-height:34px;background:var(--g,#155b50);color:#fff;font:inherit;font-weight:700;font-size:13px}.sgc .x{position:absolute;top:2px;left:4px;border:0;background:none;font-size:16px;color:#889}"+
".sgc .gi{width:56px;height:56px;border-radius:14px;background:#d6ebe4;display:grid;place-items:center;font-size:26px;margin:0 auto}";
document.head.append(st);

/* ---------- bottom nav ---------- */
const nav=document.querySelector(".nav");
if(nav){
  const old=nav.querySelector('[data-t="chat"] i,[data-t="chat"] .badge,[data-t="chat"] .nb');
  nav.innerHTML='<button data-t="home" onclick="go(\'home\')"><span>⌂</span>الرئيسية</button>'+
   '<button data-t="chat" onclick="go(\'chat\')"><span>💬</span>الدردشة</button>'+
   '<button data-t="post" class="plus" aria-label="انشر إعلان" onclick="newPost()"><span>＋</span>انشر</button>'+
   '<button data-t="market" onclick="go(\'market\')"><span>🛍️</span>السوق</button>'+
   '<button data-t="expenses" onclick="go(\'expenses\')"><span>💰</span>مصروفاتي</button>'+
   '<button data-t="profile" onclick="go(\'profile\')"><span>♙</span>حسابي</button>';
}
const MAP2={groups:"chat",day:"home",services:"home",orders:"profile"};
function mark2(){const t=MAP2[current]||current;document.querySelectorAll(".nav button").forEach(b=>{const on=b.dataset.t===t;b.classList.toggle("active",on);b.setAttribute("aria-current",on?"page":"false")})}
const _go=window.go;
window.go=function(t){const r=_go.apply(this,arguments);mark2();return r};

/* ---------- chat + groups as one tab ---------- */
const seg=t=>'<div class="seg2" role="tablist"><button role="tab" class="'+(t==="groups"?"on":"")+'" onclick="go(\'groups\')">👥 جروباتي</button><button role="tab" class="'+(t==="chat"?"on":"")+'" onclick="go(\'chat\')">💬 الشات</button></div>';
const stripSwitch=(h,t)=>h.replace(t==="chat"?/<button[^>]*onclick="go\('groups'\)"[^>]*>[^<]*<\/button>/:/<button[^>]*onclick="go\('chat'\)"[^>]*>[^<]*<\/button>/,"");
const _ct=window.chatTab,_gt=window.groupsTab;
window.chatTab=function(){return seg("chat")+stripSwitch(_ct.apply(this,arguments),"chat")};
window.groupsTab=function(){return seg("groups")+stripSwitch(_gt.apply(this,arguments),"groups")};

/* ---------- Facebook-style home ---------- */
const fbs={dis:{},sug:null,sgBusy:0,grp:null};
async function fbLoadSug(){
  if(fbs.sgBusy||!cs())return;fbs.sgBusy=1;
  try{
    if(!cl.fr||!cl.fr.loaded)await frLoad();
    const rows=await sb("/rest/v1/profiles?select=id,name,username,avatar,city,country,verified&limit=40")||[];
    const u=cs().uid,known=new Set([u]);((cl.fr&&cl.fr.rows)||[]).forEach(r=>{known.add(r.requester);known.add(r.addressee)});
    fbs.sug=rows.filter(p=>!known.has(p.id)&&p.name).slice(0,12);fbs.sug.forEach(p=>cl.pp[p.id]=cl.pp[p.id]||p);
  }catch(e){fbs.sug=[]}
  if(!cl.groups||!cl.groups.length){try{await loadGroups()}catch(e){}}
  fbs.grp=(cl.groups||[]).filter(g=>!(cl.mine||{})[g.id]).slice(0,10);
  fbs.sgBusy=0;if(current==="home")render();
}
function fbSugPeople(){
  const l=(fbs.sug||[]).filter(p=>!fbs.dis[p.id]);if(!l.length)return"";
  return '<div class="sugg"><h4>👋 أشخاص قد تعرفهم</h4><div class="rw">'+l.map(p=>'<div class="sgc"><button class="x" aria-label="إخفاء" onclick="fbHide(\''+p.id+'\')">×</button><div onclick="openPage(\'user\',{id:\''+p.id+'\'})">'+avHtml(p,64)+'<b>'+esc(p.name)+(typeof vfMark==="function"?vfMark(p):"")+'</b><small>'+esc(p.city||"")+'</small></div><button class="go" onclick="fbAdd(\''+p.id+'\')">＋ إضافة صديق</button></div>').join("")+'</div></div>';
}
function fbSugGroups(){
  const l=(fbs.grp||[]).filter(g=>!fbs.dis["g"+g.id]);if(!l.length)return"";
  return '<div class="sugg"><h4>👥 جروبات قد تهمك</h4><div class="rw">'+l.map(g=>'<div class="sgc"><button class="x" aria-label="إخفاء" onclick="fbHide(\'g'+g.id+'\')">×</button><div onclick="openGroup(\''+g.id+'\')"><div class="gi">👥</div><b>'+esc(g.name)+'</b><small>'+an((cl.cnt||{})[g.id]||0)+' عضو</small></div><button class="go" onclick="fbJoin(\''+g.id+'\')">انضمام</button></div>').join("")+'</div></div>';
}
window.fbHide=k=>{fbs.dis[k]=1;if(current==="home")render()};
window.fbAdd=async uid=>{await frAdd(uid);fbs.dis[uid]=1;if(current==="home")render()};
window.fbJoin=async id=>{await joinGroup(id);fbs.dis["g"+id]=1;if(current==="home")render()};
window.fbPhoto=()=>{newPost();const f=document.querySelector("#sheet input[type=file]");if(f)try{f.click()}catch(e){}};
function fbStories(){
  const g=stGroups(),u=cs().uid,ids=Object.keys(g).sort((a,b)=>(a===u?-1:b===u?1:0));
  const me=cl.me||{name:cs().name,id:u};
  let h='<div class="fbst"><button class="stc add" onclick="stNew()" aria-label="ستوري جديدة"><div class="top">'+avHtml({...me,id:u},60)+'</div><span class="pl">＋</span><span class="nm">أنشئ ستوري</span></button>';
  ids.forEach(id=>{
    const p=cl.pp[id]||{id,name:"مستخدم"},l=g[id],last=l[l.length-1],all=l.every(s=>cl.st.seen[s.id]);
    const bg=last.media_url&&/^https:\/\//.test(last.media_url)?"background-image:url('"+esc(last.media_url)+"')":"background:"+esc(last.bg||"#155b50");
    h+='<button class="stc'+(all?" seen":"")+'" style="'+bg+'" onclick="stView(\''+id+'\')"><span class="ring">'+avHtml(p,34)+'</span>'+(!last.media_url&&last.body?'<span style="position:absolute;top:56px;left:6px;right:6px;font-size:12px;line-height:1.3;max-height:70px;overflow:hidden">'+esc(String(last.body).slice(0,60))+'</span>':"")+'<span class="nm">'+(id===u?"ستوريتي":esc((p.name||"").split(" ")[0]))+'</span></button>';
  });
  return h+'</div>';
}
const _fh=window.feedHome;
window.feedHome=function(){
  const h=_fh.apply(this,arguments);
  if(!cs())return h;
  if(!cl.st.loaded&&!cl.st._ld){cl.st._ld=1;stLoad().then(()=>{cl.st._ld=0;if(current==="home")render()})}
  if(fbs.sug===null&&!fbs.sgBusy)setTimeout(fbLoadSug,60);
  const box=document.createElement("div");box.innerHTML=h;
  const kids=[...box.children],ci=kids.findIndex(k=>k.classList.contains("composer"));
  if(ci<0)return h;
  const fi=kids.findIndex((k,i)=>i>ci&&k.classList.contains("fchips"));
  const bell=kids.find(k=>k.classList.contains("nbar"));
  const legacy=kids.filter((k,i)=>k!==bell&&k!==kids[ci]&&(i<ci||(fi<0||i<fi)&&i>ci));
  const chips=fi<0?[]:kids.slice(fi).filter(k=>k.classList.contains("fchips"));
  const feed=fi<0?kids.slice(ci+1).filter(k=>!legacy.includes(k)):kids.slice(fi).filter(k=>!k.classList.contains("fchips"));
  const me=cl.me||{name:cs().name},first=(me.name||cs().name||"").split(" ")[0];
  const unread=cl.nunread?'<i class="nbadge">'+(cl.nunread>99?"99+":an(cl.nunread))+'</i>':"";
  const top='<div class="fbtop"><b>يومك</b><button aria-label="بحث" onclick="openPage(\'search\')">🔎</button><button aria-label="الإشعارات" onclick="openPage(\'notif\')">🔔'+unread+'</button><button aria-label="الدردشة" onclick="go(\'chat\')">💬</button></div>';
  const comp='<div class="card fbcomp"><div class="fh">'+avHtml({...me,id:cs().uid},40)+'<button class="cbtn" onclick="newPost()">بم تفكر يا '+esc(first)+'؟</button></div><div class="fbsep"></div><div class="fbacts"><button onclick="openReels()">🎬 ريلز</button><button onclick="fbPhoto()">🖼️ صورة</button><button onclick="openJobs()">💼 وظائف</button><button onclick="newPost()">😊 شعور</button></div></div>';
  const det='<details class="fbq"><summary>☀️ يومك واختصاراتك</summary>'+legacy.map(k=>k.outerHTML).join("")+'</details>';
  const flt='<details class="fbq"><summary>🔎 تصفية المنشورات</summary>'+chips.map(k=>k.outerHTML).join("")+'</details>';
  let out=top+comp+fbStories()+det+flt,n=0,did1=0,did2=0;
  feed.forEach(k=>{
    out+=k.outerHTML;
    if(k.classList.contains("card")&&!k.classList.contains("empty")&&k.querySelector(".eng,.fact,.av")){n++;
      if(n===2&&!did1){did1=1;out+=fbSugPeople()}
      if(n===4&&!did2){did2=1;out+=fbSugGroups()}}
  });
  if(!did1)out+=fbSugPeople();if(!did2)out+=fbSugGroups();
  return out;
};

/* ---------- market tab hook (the module itself is app38.js) ---------- */
const _render=window.render;
window.render=function(){
  if(current==="market"&&typeof window.mkTab==="function"){
    document.body.classList.add("comm");el("main").innerHTML=window.mkTab();
    if(window.mkAfter)setTimeout(window.mkAfter,0);return;
  }
  return _render.apply(this,arguments);
};
mark2();
})();
