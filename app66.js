/* Chat list safety net: when the list comes back empty, retry once, and show a small status line (account, counts, last error) with a reload button. */
(function(){
let retried=0;
const och=window.chatHtml;
if(typeof och!=="function")return;
function empty(){return cl.conv&&!(cl.dm||[]).length&&!(cl.groups||[]).some(g=>cl.mine&&cl.mine[g.id])}
async function reload(){
  try{cl.partialErr="";cl.err="";await loadConv();}catch(e){cl.err=(e&&e.message)||String(e)}
  if(typeof renderPage==="function"&&curPage()==="chat")renderPage()}
window.chatReload=reload;
window.chatHtml=function(){
  const h=och.apply(this,arguments)+"";
  if(!cs()||!cl.conv)return h;
  if(!empty()){retried=0;return h}
  if(!retried){retried=1;setTimeout(reload,2500)}
  const u=cs(),acc=(u.name||"")+" · "+String(u.uid).slice(0,8);
  const info='<div class="card muted" style="margin:8px 0;font-size:13px;overflow-wrap:anywhere">لا توجد محادثات ظاهرة.<br>الحساب: '+esc(acc)+'<br>محادثات خاصة: '+an((cl.dm||[]).length)+' · جروبات: '+an((cl.groups||[]).filter(g=>cl.mine&&cl.mine[g.id]).length)+(cl.err||cl.partialErr?'<br>خطأ: '+esc(cl.err||cl.partialErr):"")+'<br><button class="chip on" onclick="chatReload()">🔄 إعادة تحميل</button></div>';
  return h.replace('<div id="cList">',info+'<div id="cList">')};
})();
