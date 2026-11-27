/* Call quality indicator: samples WebRTC stats every 3s while a call screen is open and shows a signal badge. */
(function(){
let t=null,last={lost:0,recv:0};
const lab=(rtt,loss)=>{if(rtt==null&&loss==null)return["📶 …","#8a8a8a"];
  if((rtt!=null&&rtt>0.6)||loss>0.12)return["📶 ضعيفة","#c0392b"];
  if((rtt!=null&&rtt>0.25)||loss>0.04)return["📶 متوسطة","#d68910"];return["📶 ممتازة","#1e8449"]};
async function tick(){
  const ui=document.getElementById("callUI"),pc=window.__pc;
  if(!ui||!pc||pc.connectionState==="closed"){stop();return}
  let rtt=null,loss=null;
  try{const st=await pc.getStats();let lost=0,recv=0;
    st.forEach(r=>{
      if(r.type==="candidate-pair"&&(r.nominated||r.state==="succeeded")&&r.currentRoundTripTime!=null)rtt=r.currentRoundTripTime;
      if(r.type==="inbound-rtp"){lost+=r.packetsLost||0;recv+=r.packetsReceived||0}});
    const dl=lost-last.lost,dr=recv-last.recv;last={lost,recv};
    if(dl+dr>20)loss=Math.max(0,dl)/(dl+dr)}catch(e){}
  let b=ui.querySelector("[data-q]");
  if(!b){b=document.createElement("div");b.setAttribute("data-q","1");b.style.cssText="position:absolute;top:10px;inset-inline-start:12px;padding:4px 10px;border-radius:14px;color:#fff;font:700 13px sans-serif;z-index:3";ui.appendChild(b)}
  const [tx,bg]=lab(rtt,loss);b.textContent=tx;b.style.background=bg;
}
function start(){if(t)return;last={lost:0,recv:0};t=setInterval(tick,3000);setTimeout(tick,1200)}
function stop(){if(t){clearInterval(t);t=null}}
new MutationObserver(()=>{if(document.getElementById("callUI"))start();else stop()}).observe(document.documentElement,{childList:true,subtree:true});
window.__qualLabel=lab;
})();
