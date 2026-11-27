/* Video buttons inside the call screen (camera on/off, flip) + look while video is on. */
(function(){
const css=document.createElement("style");
css.textContent='html.callvid #callUI{background:transparent!important;justify-content:flex-end!important}html.callvid #callUI>div:first-child{display:none!important}html.callvid #callUI h2,html.callvid #callUI #callT,html.callvid #callUI #callBadge{text-shadow:0 1px 6px #000}html.callvid #callUI[data-min]~#callVidR,html.callvid #callUI[data-min]~#callVidL{display:none}';
document.head.appendChild(css);
function inject(e){
  if(!e||!e.querySelector("#callT")||e.querySelector("[data-cam]"))return;
  const end=[...e.querySelectorAll("button")].find(b=>/callEnd\(\)/.test(b.getAttribute("onclick")||""));if(!end)return;
  const mk=(a,t,f,bg)=>{const v=document.createElement("button");v.setAttribute(a,"1");v.setAttribute("onclick",f);v.style.cssText=end.style.cssText;v.style.background=bg;v.textContent=t;end.parentNode.insertBefore(v,end)};
  mk("data-cam","📹 كاميرا","callCam()","#3b6b62");
  mk("data-flip","🔄 قلب","callFlip()","#3b6b62");
}
new MutationObserver(()=>inject(document.getElementById("callUI"))).observe(document.documentElement,{childList:true,subtree:true});
})();
