/* v91: achievements / badges computed from the user's own activity (posts, comments, friends, invites). */
(function(){
if(typeof PAGES==="undefined")return;
const B={n:null};
const DEF=[
 ["post","✍️","أول منشور","posts",1],["post5","📝","كاتب نشيط","posts",10],["post50","📚","صاحب محتوى","posts",50],
 ["cm","💬","أول تعليق","comments",1],["cm25","🗨️","متفاعل","comments",25],
 ["fr","🤝","أول صديق","friends",1],["fr10","👥","اجتماعي","friends",10],["fr50","🌟","محبوب","friends",50],
 ["inv","📨","دعوت صاحب","invites",1],["inv5","🎯","سفير يومك","invites",5]];
async function cnt(path){try{const r=await sb(path);return Array.isArray(r)?r.length:0}catch(e){return 0}}
async function load(){
  const u=cs().uid;
  const [p,c,f,i]=await Promise.all([
    cnt("/rest/v1/posts?select=id&user_id=eq."+u+"&limit=100"),
    cnt("/rest/v1/post_comments?select=id&user_id=eq."+u+"&limit=100"),
    cnt("/rest/v1/friendships?select=id&status=eq.accepted&or=(requester.eq."+u+",addressee.eq."+u+")&limit=100"),
    (async()=>{try{return((await sb("/rest/v1/rpc/my_referrals",{method:"POST",body:{}}))||[]).length}catch(e){return 0}})()]);
  B.n={posts:p,comments:c,friends:f,invites:i};try{if(curPage()==="badges")renderPage()}catch(e){}}
PAGES.badges={title:()=>"إنجازاتي",render:()=>{
  if(!cs())return authCard();
  if(B.n===null){setTimeout(load,0);return '<p class="muted">جاري التحميل…</p>'}
  const got=DEF.filter(d=>B.n[d[3]]>=d[4]).length;
  return '<div class="card" style="text-align:center"><b>'+got+' من '+DEF.length+'</b><div style="height:8px;background:#e3ece9;border-radius:6px;margin-top:8px"><div style="height:8px;border-radius:6px;background:#0f7a63;width:'+Math.round(got*100/DEF.length)+'%"></div></div></div>'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+DEF.map(d=>{const ok=B.n[d[3]]>=d[4];return '<div class="card" style="text-align:center;margin:0;'+(ok?'':'opacity:.45')+'"><div style="font-size:30px;'+(ok?'':'filter:grayscale(1)')+'">'+d[1]+'</div><b>'+d[2]+'</b><div class="muted" style="font-size:12px">'+(ok?'تم ✓':Math.min(B.n[d[3]],d[4])+' / '+d[4])+'</div></div>'}).join("")+'</div>'}};
const _s=PAGES.settings&&PAGES.settings.render;
if(_s)PAGES.settings.render=function(){let h=_s.apply(this,arguments);
  if(cs())h+='<div class="card"><b>🏅 إنجازاتي</b><p class="muted">شارات على نشاطك في يومك.</p><button class="secondary" onclick="B_open()">عرض</button></div>';return h};
window.B_open=function(){B.n=null;openPage("badges")};
})();
