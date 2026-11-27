/* @mentions: pick a person while typing; they get a notification; the mention is a link. */
(function(){
const mn={map:{},box:null,t:0};
const osb=window.sb;
window.sb=function(u,o){
  if(o&&o.method==="POST"&&o.body&&typeof o.body==="object"&&/\/rest\/v1\/(service_posts|post_comments)\b/.test(u)&&typeof o.body.body==="string"){
    let b=o.body.body;Object.keys(mn.map).forEach(n=>{const k="@"+n;if(b.includes(k))b=b.split(k).join("@{"+mn.map[n]+"|"+n+"}")});o.body.body=b}
  return osb.apply(this,arguments)};
function hide(){if(mn.box){mn.box.remove();mn.box=null}}
document.addEventListener("input",e=>{
  const t=e.target;if(!t||!(t.tagName==="TEXTAREA"&&!/^(cBody|dBody)$/.test(t.id)||/^cmi-/.test(t.id)))return;
  const v=t.value,pos=t.selectionStart==null?v.length:t.selectionStart,m=v.slice(0,pos).match(/(?:^|\s)@([^\s@]{1,20})$/);
  clearTimeout(mn.t);if(!m||!cs()){hide();return}
  mn.t=setTimeout(async()=>{try{
    const r=await sb("/rest/v1/profiles?select=id,name&name=ilike.*"+encodeURIComponent(m[1])+"*&limit=5")||[];
    hide();if(!r.length)return;
    const b=document.createElement("div");b.style.cssText="position:absolute;z-index:99999;background:#fff;color:#123;border:1px solid #cdd;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.2);min-width:180px";
    r.forEach(p=>{const i=document.createElement("div");i.textContent="@"+(p.name||"مستخدم");i.style.cssText="padding:9px 12px;cursor:pointer";
      i.onmousedown=i.ontouchstart=ev=>{ev.preventDefault();const nm=(p.name||"مستخدم").replace(/[{}|]/g,"").slice(0,30);mn.map[nm]=p.id;
        const before=v.slice(0,pos).replace(/@[^\s@]{1,20}$/,"@"+nm+" ");t.value=before+v.slice(pos);t.focus();const c=before.length;try{t.setSelectionRange(c,c)}catch(_){}hide()};b.appendChild(i)});
    const rc=t.getBoundingClientRect();b.style.top=(window.scrollY+rc.bottom+2)+"px";b.style.left=Math.max(8,rc.left)+"px";document.body.appendChild(b);mn.box=b}catch(_){}},250)},true);
document.addEventListener("click",e=>{if(mn.box&&!mn.box.contains(e.target))hide()},true);
/* render tokens as links */
const RE=/@\{([0-9a-fA-F-]{36})\|([^}]{1,40})\}/g;
let busy=0;
function conv(){
  if(busy||!document.body||document.body.textContent.indexOf("@{")<0)return;busy=1;
  try{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),L=[];let n;while(n=w.nextNode()){if(n.nodeValue.indexOf("@{")>=0&&!/^(TEXTAREA|SCRIPT|STYLE)$/.test(n.parentNode.tagName))L.push(n)}
    L.forEach(n=>{const s=n.nodeValue,f=document.createDocumentFragment();let last=0,m;RE.lastIndex=0;
      while(m=RE.exec(s)){if(m.index>last)f.appendChild(document.createTextNode(s.slice(last,m.index)));
        const a=document.createElement("a");a.href="#";a.textContent="@"+m[2];a.style.cssText="color:var(--g,#155b50);font-weight:700";const id=m[1];a.onclick=ev=>{ev.preventDefault();ev.stopPropagation();openUser(id)};f.appendChild(a);last=RE.lastIndex}
      if(last<s.length)f.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(f,n)})}catch(e){}
  busy=0}
let t2=0;new MutationObserver(()=>{clearTimeout(t2);t2=setTimeout(conv,150)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setTimeout(conv,500);
})();
