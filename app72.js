/* v79: visual design pass. Tajawal font (self-hosted in fonts.css), new palette and cards, floating tab bar with SVG icons, coloured shortcuts, story rings, tile menu, light motion, infinite scroll and a back-to-top button. Pure CSS + small JS, free, respects reduced motion. */
(function(){
const st=document.createElement("style");st.id="ykdesign";st.textContent=`
:root{--g:#0f6b5c;--dark:#10302d;--mint:#e6f4ef;--gold:#f4a93b;--bg:#f1f5f3;--line:#e2ebe7;--muted:#5b6b66;--ykg:linear-gradient(135deg,#0b4f46 0%,#128068 100%);--ykgold:linear-gradient(135deg,#f7b84b,#ee8a2b);--sh1:0 1px 2px #0d2b2810,0 6px 20px #0d2b2810;--sh2:0 10px 34px #0d2b2822}
body,button,input,textarea,select{font-family:'Tajawal',system-ui,Tahoma,Arial}
body{background:linear-gradient(#e9f2ee,#f1f5f3 240px) fixed,var(--bg);-webkit-tap-highlight-color:transparent}
header{background:var(--ykg)!important;border-radius:0 0 26px 26px!important;box-shadow:0 8px 28px #0b4f4630}
.brand{font-weight:800;letter-spacing:.2px}.brand small{color:var(--gold)!important;font-weight:700;letter-spacing:2px}
.loc{border-radius:20px!important;background:#ffffff1f!important;backdrop-filter:blur(6px)}
.card{border:0!important;border-radius:20px!important;box-shadow:var(--sh1)!important}
button{transition:transform .12s ease,background-color .2s,box-shadow .2s}
button:active{transform:scale(.96)}
.primary,button.primary{background:var(--ykg)!important;box-shadow:0 6px 16px #0f6b5c40;border-radius:14px}
.fbtop{background:#f1f5f3ee!important;backdrop-filter:blur(8px);margin:0 -4px 8px!important;padding:8px 4px!important}
.fbtop b{font-size:22px!important;font-weight:800;background:var(--ykg);-webkit-background-clip:text;background-clip:text;color:transparent}
.fbtop button{background:#fff!important;box-shadow:var(--sh1);width:44px!important;height:44px!important}
.fbcomp{padding:14px!important}
.fbcomp .cbtn{background:#eef4f1!important;min-height:46px!important;font-weight:500}
.fbcomp .fbacts{display:grid!important;grid-template-columns:repeat(4,1fr);gap:6px}
.fbcomp .fbacts button{border-radius:12px;background:#f5f9f7;padding:9px 2px;font-weight:700;font-size:12.5px}
.stc{border-radius:18px!important;box-shadow:var(--sh1)}
.stc .ring{border:0!important;padding:2px;background:conic-gradient(#f4a93b,#e8556d,#7b5cf0,#12a88a,#f4a93b)!important}
.stc.seen .ring{background:#cfd8d4!important}
.stc.add{border:0!important}
.ykq{padding:4px 2px 12px!important}
.ykq button{border:0!important;box-shadow:var(--sh1);border-radius:24px!important;padding:0 14px 0 12px!important;font-weight:700}
.ykq button i{font-style:normal;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;font-size:15px;background:var(--c,#e6f4ef)}
.ykq button.more{background:var(--ykg)!important;color:#fff!important}
.fbq{border:0!important;box-shadow:var(--sh1);border-radius:16px!important}
.sugg{border:0!important;box-shadow:var(--sh1);border-radius:20px!important}
.sgc{border-radius:16px!important;border-color:#e8f0ec!important}
.sgc .go{background:var(--ykg)!important;color:#fff!important}
/* tab bar */
.nav{left:12px!important;right:12px!important;bottom:calc(12px + env(safe-area-inset-bottom))!important;max-width:496px;border:0!important;border-radius:28px!important;background:#ffffffee!important;backdrop-filter:blur(14px) saturate(1.4);box-shadow:var(--sh2)!important;padding:6px 6px!important;grid-template-columns:repeat(6,1fr)!important}
.nav button{position:relative;isolation:isolate;min-height:54px!important;font-size:10.5px!important;font-weight:700;border-radius:20px;gap:2px!important;color:#6b7a75}
.nav button svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s cubic-bezier(.3,1.6,.5,1)}
.nav button.active{color:var(--g)!important}
.nav button.active::before{content:"";position:absolute;inset:3px 6px;background:var(--mint);border-radius:18px;z-index:-1;animation:ykpop .28s ease}
.nav button.active svg{transform:translateY(-1px) scale(1.12);stroke-width:2.2}
.nav .plus{color:#fff!important;transform:translateY(-16px)}
.nav .plus svg{width:26px;height:26px;stroke:#fff;stroke-width:2.4}
.nav .plus::after{content:"";position:absolute;top:2px;left:50%;width:52px;height:52px;margin-left:-26px;border-radius:50%;background:var(--ykgold);box-shadow:0 8px 20px #ee8a2b66;z-index:-1}
.nav .plus.active::before{display:none}
.nav .plus span{position:relative}
.nav .plus{overflow:visible}
body{padding-bottom:108px!important}
.nav .nbadge,.nav i.nb{position:absolute;top:4px}
@keyframes ykpop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
/* hub tiles */
.ykhub button,.hub button{border:0!important;box-shadow:var(--sh1);border-radius:18px!important;font-weight:700}
.ykhub button span,.hub button span{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;font-size:24px;background:var(--c,#e6f4ef);margin:0 auto 4px}
.hub button:nth-child(6n+1) span,.ykhub button:nth-child(6n+1) span{--c:#e3f4ee}.hub button:nth-child(6n+2) span,.ykhub button:nth-child(6n+2) span{--c:#fdeed6}.hub button:nth-child(6n+3) span,.ykhub button:nth-child(6n+3) span{--c:#e7ecfb}.hub button:nth-child(6n+4) span,.ykhub button:nth-child(6n+4) span{--c:#fbe4ea}.hub button:nth-child(6n+5) span,.ykhub button:nth-child(6n+5) span{--c:#ece6fa}.hub button:nth-child(6n) span,.ykhub button:nth-child(6n) span{--c:#e1f3f8}
/* page header bar */
.pagebar,.ph{background:var(--ykg)!important}
/* motion */
.fbcomp,.ykq,.fbst{animation:ykin .4s ease both}
@keyframes ykin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#yktop{position:fixed;left:16px;bottom:104px;width:44px;height:44px;border-radius:50%;border:0;background:#fff;box-shadow:var(--sh2);display:none;place-items:center;z-index:4;color:var(--g);font-size:20px}
#yktop.on{display:grid;animation:ykpop .25s ease}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
document.head.append(st);
/* nav icons */
const I={home:'<path d="M3 11l9-7.5 9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',chat:'<path d="M20.5 12a8 8 0 01-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1120.5 12z"/>',plus:'<path d="M12 5v14M5 12h14"/>',market:'<path d="M4 8h16l-1.2 11.2a1 1 0 01-1 .8H6.2a1 1 0 01-1-.8L4 8z"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8"/>',hub:'<path d="M4 7h16M4 12h16M4 17h16"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>'};
function icons(){const nav=document.querySelector(".nav");if(!nav)return;nav.querySelectorAll("button").forEach(b=>{const t=b.dataset.t,k=I[t==="post"?"plus":t];if(!k)return;const s=b.querySelector("span");if(s&&!s.querySelector("svg")){s.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+k+'</svg>'}})}
icons();setTimeout(icons,600);setTimeout(icons,2500);
new MutationObserver(icons).observe(document.querySelector(".nav")||document.body,{childList:true,subtree:false});
/* coloured shortcut icons */
const C={"👥":"#e3f4ee","💬":"#e7ecfb","🎬":"#fbe4ea","🛍️":"#fdeed6","💼":"#e1f3f8","📅":"#ece6fa","📄":"#e3f4ee","🔖":"#fdeed6"};
function chips(){document.querySelectorAll(".ykq button:not(.more):not([data-y])").forEach(b=>{b.dataset.y=1;const m=b.textContent.trim().match(/^(\S+)\s(.*)$/);if(m)b.innerHTML='<i style="--c:'+(C[m[1]]||"#e6f4ef")+'">'+m[1]+'</i>'+m[2]})}
/* infinite scroll + back to top */
const top=document.createElement("button");top.id="yktop";top.setAttribute("aria-label","لفوق");top.textContent="↑";top.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});document.body.append(top);
let busy=0;
function tick(){chips();const y=window.scrollY;top.classList.toggle("on",y>900);
  const b=document.querySelector('#main button[onclick="feedMore()"]');
  if(b&&!busy&&b.getBoundingClientRect().top<innerHeight+500){busy=1;try{b.click()}catch(e){}setTimeout(()=>busy=0,1500)}}
addEventListener("scroll",tick,{passive:true});setInterval(tick,1200);
})();
