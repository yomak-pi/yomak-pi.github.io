/* Phase 4E5: link cards in posts (host, favicon-free, no external fetch) + video in page posts. */
const lkCard=u=>{try{const x=new URL(u);if(!/^https?:$/.test(x.protocol))return"";return '<a class="card" style="display:block;text-decoration:none;color:inherit;margin:6px 0" href="'+esc(x.href)+'" target="_blank" rel="noopener noreferrer"><small class="muted">🔗 '+esc(x.hostname.replace(/^www\./,""))+'</small><div class="ft" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" dir="ltr">'+esc(x.pathname.length>1?x.pathname.slice(0,60):x.href.slice(0,60))+'</div></a>'}catch(e){return""}};
const lkAdd=(h,text)=>{const m=(text||"").match(/https?:\/\/[^\s<>"']+/);return m?h+lkCard(m[0]):h};
const _sc2=window.svcCard;
window.svcCard=function(e){const h=_sc2.apply(this,arguments)+"";const m=(e.body||"").match(/https?:\/\/[^\s<>"']+/);if(!m)return h;const i=h.lastIndexOf('<div class="fact"');return i<0?h:h.slice(0,i)+lkCard(m[0])+h.slice(i)};
