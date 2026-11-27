/* Phase 4D4: super-admin escalation: reports for group posts, pages, page posts reach the admin dashboard; admin can delete them. */
KIND_AR.page="صفحة";KIND_AR.page_post="منشور صفحة";
const _fi=window.findItem;
window.findItem=function(kind,id){
  const s=id+"";
  if(kind==="post"){for(const g of Object.keys(cl.gx||{})){const p=((cl.gx[g]||{}).posts||[]).find(p=>p.id+""===s);if(p)return{author:p.user_id,snap:p.body,ref:g}}}
  if(kind==="page"){const p=(cl.pg.list||[]).find(p=>p.id+""===s)||((cl.pg.x[s]||{}).page);if(p)return{author:p.owner,snap:p.name+(p.about?" - "+p.about:""),ref:p.id}}
  if(kind==="page_post"){for(const k of Object.keys(cl.pg.x||{})){const x=cl.pg.x[k],q=((x||{}).posts||[]).find(q=>q.id+""===s);if(q)return{author:q.author,snap:q.body,ref:q.page_id}}}
  return _fi.apply(this,arguments);
};
const _rd=window.repDelete;
window.repDelete=async function(e){
  const t=(cl.rlist||[]).find(t=>Number(t.id)===Number(e));
  if(!t||(t.kind!=="page"&&t.kind!=="page_post"))return _rd.apply(this,arguments);
  if(!confirm("حذف هذا المحتوى نهائيًا؟"))return;
  try{await delRow("/rest/v1/"+(t.kind==="page"?"pages":"page_posts")+"?id=eq."+encodeURIComponent(t.target));await logAdmin("delete_content",t.author,KIND_AR[t.kind]+": "+((t.snapshot||"")+"").slice(0,120));msg("تم حذف المحتوى");await repClose(e,"done")}catch(x){msg(sbErr(x).slice(0,90))}
};
