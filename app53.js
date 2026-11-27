/* Visible reaction buttons: posts get "☺ تفاعل", Messenger bubbles get a small ☺. (Long-press still works everywhere.) */
(function(){
const st=document.createElement("style");
st.textContent='.mcrxb{border:0;background:#0000000d;color:#555;font-size:16px;width:30px;height:30px;min-width:30px;min-height:30px;align-self:center;border-radius:50%;padding:0;line-height:1;flex:none;margin:0 2px}.mrow .mcrxb:active{background:#0000001f}.mcrxp{position:fixed;z-index:9999;display:flex;gap:2px;background:#fff;border:1px solid #ddd;border-radius:30px;padding:4px 6px;box-shadow:0 6px 24px rgba(0,0,0,.2);max-width:calc(100vw - 12px)}.mcrxp button{border:0;background:none;font-size:26px;line-height:1;padding:4px 5px;border-radius:12px}.mcrxp button.on{background:#e6f2ef}';
document.head.appendChild(st);
const osc=window.svcCard;
window.svcCard=function(e){
  let h=osc.apply(this,arguments);if(!e||!/^[0-9a-f-]{36}$/i.test(e.id||""))return h;
  const k=h.indexOf('<button class="eb" onclick="cmToggle(');
  return k>0?h.slice(0,k)+'<button class="eb" onclick="pcRx(this,\''+e.id+'\')">☺ تفاعل</button>'+h.slice(k):h};
window.pcRx=function(b,id){if(!cs())return authModal("login");rxPickerAt(b.getBoundingClientRect(),k=>likeToggle(id,k),(fd.my||{})[id])};
const omc=window.mcHtml;
if(typeof omc==="function")window.mcHtml=function(k){
  let h=omc.apply(this,arguments);
  return h.replace(/<button class="mcdots" data-mid="([^"]+)"/g,'<button class="mcrxb" data-mid="$1" aria-label="تفاعل">☺</button><button class="mcdots" data-mid="$1"')};
function hide(){const p=document.querySelector(".mcrxp");if(p)p.remove()}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest(".mcrxb");
  if(!b){if(!(e.target.closest&&e.target.closest(".mcrxp")))hide();return}
  e.preventDefault();e.stopPropagation();hide();
  const id=b.dataset.mid,kk=typeof mcK==="function"?mcK():"d",me=dmMeUid(),rx=((kk==="d"?cl.dmRx:cl.gmRx)||{})[id]||{},my=rx[me],fn=kk==="d"?"dmReact":"gmReact";
  const p=document.createElement("div");p.className="mcrxp";
  p.innerHTML=DMRX.map(x=>'<button type="button" title="'+DMRXL[x]+'" aria-label="'+DMRXL[x]+'" data-e="'+x+'"'+(my===x?' class="on"':"")+'>'+x+'</button>').join("");
  document.body.appendChild(p);
  const r=b.getBoundingClientRect(),w=p.offsetWidth;p.style.left=Math.min(Math.max(6,r.left+r.width/2-w/2),innerWidth-w-6)+"px";p.style.top=Math.max(8,r.top-52)+"px";
  p.onclick=ev=>{const x=ev.target.closest("button");if(!x)return;ev.stopPropagation();hide();try{window[fn](id,x.dataset.e)}catch(er){}};
},true);
})();
