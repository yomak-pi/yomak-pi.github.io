/* Calls v2: echo hardening, minimise-to-bar (Messenger style), volume control. Audio-only 1:1 calls. */
(function(){
/* ---- 1. mic constraints + verification + software echo guard ---- */
const md=navigator.mediaDevices;
if(md&&md.getUserMedia&&!md.__yk){
  md.__yk=1;const orig=md.getUserMedia.bind(md);
  md.getUserMedia=async function(c){
    const isCall=!!(c&&c.audio&&typeof c.audio==="object"&&"googEchoCancellation" in c.audio&&!c.video);
    if(!isCall)return orig(c);
    const a=Object.assign({},typeof c.audio==="object"?c.audio:{},{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1,voiceIsolation:true,latency:{ideal:.02}});
    let s=await orig({audio:a,video:false});
    const t=s.getAudioTracks()[0];let st={};try{st=t.getSettings()}catch(e){}
    window.__callAudio={aec:st.echoCancellation,ns:st.noiseSuppression,agc:st.autoGainControl};
    if(st.echoCancellation===false){try{await t.applyConstraints({echoCancellation:true,noiseSuppression:true,autoGainControl:true});st=t.getSettings();window.__callAudio.aec=st.echoCancellation}catch(e){}}
    if(st.echoCancellation===false){try{return guard(s)}catch(e){}}
    return s;
  };
}
/* Fallback only when the browser cannot do echo cancellation: duck our mic while the other side is talking. */
function guard(raw){
  const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();ac.resume&&ac.resume();
  const src=ac.createMediaStreamSource(raw),g=ac.createGain(),dest=ac.createMediaStreamDestination();src.connect(g);g.connect(dest);
  const out=dest.stream,ot=out.getAudioTracks()[0],os=ot.stop.bind(ot);
  ot.stop=function(){os();try{raw.getTracks().forEach(x=>x.stop())}catch(e){}try{ac.close()}catch(e){}clearInterval(iv)};
  window.__callAudio.guard=1;let an=null,buf=null,cur=null;
  const iv=setInterval(()=>{
    try{const a=document.getElementById("callAudio");if(!a||!a.srcObject){return}
      if(cur!==a.srcObject){cur=a.srcObject;const rs=ac.createMediaStreamSource(cur);an=ac.createAnalyser();an.fftSize=512;rs.connect(an);buf=new Uint8Array(an.fftSize)}
      an.getByteTimeDomainData(buf);let m=0;for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]-128)/128;if(v>m)m=v}
      const t=ac.currentTime;g.gain.setTargetAtTime(m>.06?.12:1,t,m>.06?.02:.25)}catch(e){}
  },80);
  return out;
}
/* ---- 2. volume + minimise ---- */
const VOL=[["عالي",1],["متوسط",.6],["واطي",.3]];let vi=0;
window.callVol=function(){vi=(vi+1)%VOL.length;const a=document.getElementById("callAudio");if(a)a.volume=VOL[vi][1];try{typeof msg==="function"&&msg("الصوت: "+VOL[vi][0])}catch(e){}const e=document.getElementById("callUI");if(e){const b=e.querySelector("[data-vol]");if(b)b.textContent="🔉 "+VOL[vi][0]}};
function inject(e){
  if(!e||!e.querySelector("#callT")||e.querySelector("[data-vol]"))return;
  const end=[...e.querySelectorAll("button")].find(b=>/callEnd\(\)/.test(b.getAttribute("onclick")||""));if(!end)return;
  const v=document.createElement("button");v.setAttribute("data-vol","1");v.setAttribute("onclick","callVol()");v.style.cssText=end.style.cssText;v.style.background="#3b6b62";v.textContent="🔉 "+VOL[vi][0];end.parentNode.insertBefore(v,end);
}
function styleLogs(){document.querySelectorAll(".mrow:not([data-cl]) .bub").forEach(b=>{const t=b.textContent||"";if(/مكالمة صوتية · مدتها|مكالمة فائتة|مكالمة مرفوضة/.test(t)&&t.length<80){b.closest(".mrow").setAttribute("data-cl","1")}})}
const mo=new MutationObserver(()=>{styleLogs();const e=document.getElementById("callUI");inject(e);const a=document.getElementById("callAudio");if(a&&a.volume!==VOL[vi][1])a.volume=VOL[vi][1]});
mo.observe(document.documentElement,{childList:true,subtree:true});
const css=document.createElement("style");css.textContent=`
.mrow[data-cl]{justify-content:center!important}.mrow[data-cl] .bub{background:#e3ece8!important;color:#335!important;border-radius:20px!important;font-size:13px!important;margin:4px auto!important;text-align:center!important;max-width:80%!important}.mrow[data-cl] .bub small,.mrow[data-cl] .mcdots{display:none!important}
#callUI[data-min]{inset:auto!important;top:max(8px,env(safe-area-inset-top))!important;left:8px!important;right:8px!important;height:auto!important;flex-direction:row!important;flex-wrap:wrap;justify-content:space-between!important;align-items:center!important;gap:6px!important;padding:6px 12px!important;border-radius:26px;background:#123c3af2!important;box-shadow:0 6px 22px rgba(0,0,0,.35);z-index:99998!important}
#callUI[data-min]>div:first-child,#callUI[data-min] small,#callUI[data-min] #callBadge:empty{display:none!important}
#callUI[data-min] h2{font-size:14px!important;margin:0!important}
#callUI[data-min] #callT{font-size:14px!important}
#callUI[data-min] div[style*="display:flex"]{gap:5px!important}
#callUI[data-min] button{min-width:0!important;min-height:34px!important;font-size:12px!important;padding:0 10px!important}
#callMin{position:fixed;top:max(10px,env(safe-area-inset-top));left:12px;z-index:99999;border:0;border-radius:20px;background:#ffffff26;color:#fff;font-size:14px;font-weight:800;padding:8px 14px}`;
document.head.appendChild(css);
const mb=document.createElement("button");mb.id="callMin";mb.textContent="⌄ تصغير";mb.style.display="none";document.body.appendChild(mb);
mb.onclick=()=>{const e=document.getElementById("callUI");if(e)e.setAttribute("data-min","1")};
document.addEventListener("click",ev=>{const e=document.getElementById("callUI");if(e&&e.hasAttribute("data-min")&&!ev.target.closest("button")&&e.contains(ev.target)){e.removeAttribute("data-min")}},true);
setInterval(()=>{const e=document.getElementById("callUI");const on=!!(e&&e.querySelector("#callT"));
  mb.style.display=(e&&on&&!e.hasAttribute("data-min"))?"block":"none"},400);
})();
