/* Link cards: a simple domain card under links in posts, comments and chats. No outside service is contacted. In the Pi edition the card is not clickable. */
(function(){
const RE=/https?:\/\/[^\s<>"')\]،]+/i;
const pi=()=>{try{return typeof inPi==="function"&&inPi()}catch(e){return false}};
function info(u){try{const x=new URL(u);if(!/^https?:$/.test(x.protocol))return null;
  const own=/(^|\.)yomak-(app|pi)\.github\.io$/.test(x.hostname);
  return {host:x.hostname.replace(/^www\./,""),path:(x.pathname+x.search).slice(0,40),own,href:x.href}}catch(e){return null}}
function card(u){const i=info(u);if(!i)return"";
  const label=i.own?"يوماك":i.host;
  const inner='<span style="font-size:20px">'+(i.own?"🏠":"🔗")+'</span><span style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(label)+'</b><small class="muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:start">'+esc(i.own?"رابط من يوماك":(i.path==="/"?"":i.path))+'</small></span>';
  const st='display:flex;align-items:center;gap:8px;margin-top:6px;padding:8px 10px;border:1px solid #d9e2df;border-radius:10px;background:#f6faf9;color:inherit;text-decoration:none';
  if(pi()&&!i.own)return '<div class="lkc" style="'+st+'">'+inner+'</div>';
  return '<a class="lkc" href="'+esc(i.href)+'" target="_blank" rel="noopener noreferrer nofollow" style="'+st+'">'+inner+'</a>'}
window.lkCard=card;
const od=window.dmBody;
if(typeof od==="function")window.dmBody=function(m){const h=od.apply(this,arguments);
  if(m&&(!m.kind||m.kind==="text")&&m.body){const u=(m.body.match(RE)||[])[0];if(u)return h+card(u)}return h};
function scan(){document.querySelectorAll(".fb:not([data-lk])").forEach(e=>{e.dataset.lk=1;const u=(e.textContent.match(RE)||[])[0];if(u&&!e.querySelector(".lkc"))e.insertAdjacentHTML("beforeend",card(u))})}
let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(scan,150)}).observe(document.documentElement,{childList:true,subtree:true});
})();
