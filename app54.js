/* Stickers in private chats: a picker next to the message box. Art is made here (system emoji on coloured cards), nothing licensed. Sent as kind "sticker", body "🥳 مبروك". */
(function(){
const S=[["🥳","مبروك","#ff8a5c,#ffbe55"],["🙏","شكرًا","#4fb286,#8fd3a6"],["❤️","بحبك","#ef5b7b,#ff9bb0"],["😂","ههههه","#f5b83d,#ffe07a"],["😍","يا سلام","#e86aa6,#ffb3d4"],["👍","تمام","#4a90d9,#8cc0f0"],
["🌞","صباح الخير","#ffb347,#ffe08a"],["🌙","مساء الخير","#4a5fb0,#8a9de0"],["😴","تصبح على خير","#6b5fb5,#a99ee6"],["👋","سلام","#35a7a0,#7fd6cf"],["😢","زعلان","#5b8fd6,#a3c4ee"],["😡","غضبان","#e0523f,#f59a8c"],
["😮","ياااه","#a86fd1,#d4aef0"],["🤝","اتفقنا","#3f8f6b,#8bcba6"],["🎉","ألف مبروك","#e8527a,#ffb25b"],["🤲","الله يسلمك","#2f7f74,#7cc5b9"],["✨","ما شاء الله","#d9a520,#ffe27a"],["🕌","جمعة مباركة","#2e8b6f,#9adbbf"],
["☕","قهوة؟","#8d5a3b,#d1a07a"],["🍽️","الغدا جاهز","#e07a3a,#f7b97f"],["🏃","جاي","#4a90d9,#a2cdf4"],["⏳","لحظة","#7a7f8a,#c3c7d0"],["🙈","إحراج","#d9825b,#f6c1a6"],["💪","هنعملها","#c85a3a,#f2a58a"]];
const css=document.createElement("style");
css.textContent='.stkb{border:0;background:none;font-size:22px;min-width:38px;min-height:44px;padding:0 4px}.stkp{position:fixed;left:0;right:0;bottom:0;z-index:9998;background:#fff;border-top:1px solid #ddd;box-shadow:0 -6px 24px rgba(0,0,0,.15);max-height:46vh;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border-radius:18px 18px 0 0}.stk{border:0;border-radius:18px;padding:10px 4px;color:#fff;font-weight:800;font-size:13px;text-shadow:0 1px 2px #0005;display:flex;flex-direction:column;align-items:center;gap:2px}.stk b{font-size:44px;line-height:1.1;text-shadow:none}.stkm{display:inline-flex;flex-direction:column;align-items:center;gap:2px;border-radius:22px;padding:12px 22px;color:#fff;font-weight:800;font-size:14px;text-shadow:0 1px 2px #0005;min-width:110px}.stkm b{font-size:64px;line-height:1.1;text-shadow:none}.mrow:has(.stkm) .bub{background:none!important;box-shadow:none!important;padding:2px!important}';
document.head.appendChild(css);
const find=cap=>S.find(x=>x[1]===cap);
window.stkHtml=body=>{const e=(body||"").split(" "),em=e[0],cap=e.slice(1).join(" "),s=S.find(x=>x[0]===em&&x[1]===cap);
  if(!s)return '<div>'+esc(body)+'</div>';
  const c=s[2].split(",");return '<div class="stkm" style="background:linear-gradient(135deg,'+c[0]+','+c[1]+')"><b>'+s[0]+'</b>'+esc(s[1])+'</div>'};
const odb=window.dmBody;
window.dmBody=function(m){return m&&m.kind==="sticker"?stkHtml(m.body):odb.apply(this,arguments)};
function close(){const p=document.querySelector(".stkp");if(p)p.remove()}
window.stkOpen=function(){
  if(document.querySelector(".stkp"))return close();
  const p=document.createElement("div");p.className="stkp";
  p.innerHTML=S.map((s,i)=>{const c=s[2].split(",");return '<button type="button" class="stk" data-i="'+i+'" style="background:linear-gradient(135deg,'+c[0]+','+c[1]+')"><b>'+s[0]+'</b>'+s[1]+'</button>'}).join("");
  p.onclick=async e=>{const b=e.target.closest(".stk");if(!b)return;const s=S[+b.dataset.i];close();
    if(typeof dmInsert==="function")await dmInsert({body:s[0]+" "+s[1],kind:"sticker"})};
  document.body.appendChild(p)};
function inject(){document.querySelectorAll(".dmcomp:not([data-stk])").forEach(c=>{c.dataset.stk=1;
  const b=document.createElement("button");b.type="button";b.className="stkb";b.setAttribute("aria-label","ملصقات");b.textContent="🙂";b.onclick=stkOpen;
  const i=c.querySelector("#dBody");if(i)c.insertBefore(b,i);else c.appendChild(b)})}
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("click",e=>{if(!e.target.closest(".stkp,.stkb"))close()},true);
})();
