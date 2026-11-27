/* Polish: replace leftover placeholder wording. */
PAGES.calls={title:()=>"📞 المكالمات",render:()=>'<div class="card empty"><div style="font-size:34px">📞</div><b>المكالمات الصوتية شغالة</b><p class="muted">افتح شات أي صديق واضغط زرار الاتصال 📞 في الأعلى. الاتصال بين مصر والسعودية بيشتغل من التطبيق مباشرة.</p></div>'};
/* Page inbox: admins see one conversation per customer instead of one mixed thread. */
(function(){
const o=window.pgMsgs,os=window.pgSend;
window.pgMsgs=async function(id){
  const box=el("pgMsgs");if(!box)return;
  if(!pgAdm(id))return o.apply(this,arguments);
  const x=cl.pg.x[id];if(cl.pg.replyPage!==id){cl.pg.replyPage=id;cl.pg.replyTo=null}
  try{
    const m=await sb("/rest/v1/page_messages?select=*&page_id=eq."+id+"&order=created_at.asc&limit=500")||[];
    await loadPeople(m.map(r=>r.user_id));
    const rt=cl.pg.replyTo;
    if(!rt){
      const by={};m.forEach(r=>{by[r.user_id]=r});
      const us=Object.keys(by).sort((a,b)=>new Date(by[b].created_at)-new Date(by[a].created_at));
      box.innerHTML=us.length?'<div style="padding:4px 2px"><b>محادثات العملاء ('+an(us.length)+')</b></div>'+us.map(u=>{const r=by[u],p=cl.pp[u]||{id:u,name:"مستخدم"};
        return '<div class="card" style="display:flex;gap:10px;align-items:center;margin:6px 0" onclick="pgOpenCust(\''+u+'\','+id+')">'+avHtml(p,40)+'<div style="flex:1;min-width:0"><b>'+esc(p.name||"")+'</b>'+(r.from_page?"":' <span class="pill">بانتظار ردك</span>')+'<br><small class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">'+(r.from_page?"أنت: ":"")+esc((r.body||"").slice(0,60))+'</small></div><small class="muted">'+agoAr(r.created_at)+'</small></div>'}).join(""):'<p class="muted">لسه ما فيش رسائل من العملاء</p>';
      return;
    }
    const t=m.filter(r=>r.user_id===rt),p=cl.pp[rt]||{id:rt,name:"مستخدم"};
    box.innerHTML='<div style="display:flex;gap:8px;align-items:center;padding:4px 2px"><button class="chip" onclick="pgCustBack('+id+')">‹ كل المحادثات</button><b>'+esc(p.name||"")+'</b></div>'+
      (t.length?t.map(r=>'<div class="mrow '+(r.from_page?"me":"")+'"><div class="bub '+(r.from_page?"me":"")+'"><span class="sn">'+esc(r.from_page?x.page.name:p.name)+'</span>'+esc(r.body)+'</div></div>').join(""):'<p class="muted">ابدأ المحادثة</p>');
    box.scrollTop=box.scrollHeight;
  }catch(e){box.innerHTML='<p class="muted">'+esc(sbErr(e))+'</p>'}
};
window.pgOpenCust=(u,id)=>{cl.pg.replyTo=u;pgMsgs(id)};
window.pgCustBack=id=>{cl.pg.replyTo=null;pgMsgs(id)};
window.pgSend=function(id){
  if(pgAdm(id)&&!cl.pg.replyTo)return msg("اختار محادثة عميل الأول");
  return os.apply(this,arguments);
};
})();
(function(){const s=document.createElement("style");s.textContent="#pmB+.pact{white-space:nowrap;min-width:72px}";document.head.append(s)})();
/* Phones: stop the browser's own text-selection/callout from fighting the long-press menu on message bubbles. */
(function(){const s=document.createElement("style");s.textContent=".bub[data-mid]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}#rxpick,button[id^=lk-]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}";document.head.append(s)})();
