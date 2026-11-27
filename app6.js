/* YOMAK v8: 1:1 voice calls (WebRTC, signaling through Supabase table call_signals) */
(function(){
const ICE=[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"},{urls:"stun:stun.cloudflare.com:3478"}].concat(window.YOMAK_TURN||[]);
const MIC={echoCancellation:{ideal:true},noiseSuppression:{ideal:true},autoGainControl:{ideal:true},channelCount:{ideal:1},googEchoCancellation:true,googNoiseSuppression:true,googAutoGainControl:true,googHighpassFilter:true};
// opus tuned for voice over weak mobile links: mono, FEC on, DTX on, ~24 kbps
function tune(sdp){return sdp.replace(/a=fmtp:(\d+) ([^\r\n]*useinbandfec[^\r\n]*)/g,(m,pt,p)=>"a=fmtp:"+pt+" "+p.replace(/;?(stereo|sprop-stereo|usedtx|maxaveragebitrate|cbr)=\d+/g,"")+";stereo=0;usedtx=1;maxaveragebitrate=24000;cbr=0")}
let rc=null,chan=null,rtClient=null,pollT=null,live=false,call=null,lastSeen=0,authSeen="";
const uuid=()=>crypto.randomUUID();
const C=()=>document.getElementById("callUI");
function ui(html){let e=C();if(!e){e=document.createElement("div");e.id="callUI";e.style.cssText="position:fixed;inset:0;z-index:20;background:#123c3aee;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center";document.body.append(e)}e.innerHTML=html}
function uiClose(){const e=C();if(e)e.remove();const a=document.getElementById("callAudio");if(a)a.remove()}
function btn(label,fn,bg){return `<button onclick="${fn}" style="border:0;border-radius:40px;min-width:110px;min-height:56px;font-size:18px;font-weight:800;color:#fff;background:${bg||"#155b50"};padding:0 22px">${label}</button>`}
function dmInfo(chatId){return (cl.dm||[]).find(x=>String(x.id)===String(chatId))}
function nameOf(uid){const p=(cl.pp||{})[uid];if(p&&p.name)return p.name;const x=(cl.dm||[]).find(x=>dmOther(x)===uid);return x?dmName(x):"مستخدم"}
async function send(kind,payload){
  if(!call)return;
  await sb("/rest/v1/call_signals",{method:"POST",body:{call_id:call.id,to_uid:call.peer,kind,payload:payload||null}});
}
function cleanup(notify){
  stopTone();keepAwake(false);
  if(call&&notify){try{send("hangup")}catch(e){}}
  if(call){clearTimeout(call.t);clearTimeout(call.dc);clearInterval(call.wd);clearInterval(call.tick);try{call.pc&&call.pc.close()}catch(e){}try{call.stream&&call.stream.getTracks().forEach(t=>t.stop())}catch(e){}}
  call=null;uiClose();
}
let turnTried=0;
async function loadTurn(){
  if(turnTried||!window.YOMAK_TURN_URL)return;turnTried=1;
  try{const r=await fetch(window.YOMAK_TURN_URL);const j=await r.json();if(Array.isArray(j))j.forEach(x=>ICE.push(x))}catch(e){}
}
async function mkPc(){await loadTurn();
  const pc=new RTCPeerConnection({iceServers:ICE,iceCandidatePoolSize:4,bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});
  call.pc=pc;call.pendingIce=[];
  pc.onicecandidate=e=>{if(e.candidate&&call)send("ice",e.candidate.toJSON()).catch(()=>{})};
  pc.ontrack=e=>{let a=document.getElementById("callAudio");if(!a){a=document.createElement("audio");a.id="callAudio";a.autoplay=true;a.setAttribute("playsinline","");document.body.append(a)}a.srcObject=e.streams[0];a.play&&a.play().catch(()=>{})};
  pc.onconnectionstatechange=()=>{
    if(!call)return;
    const st=pc.connectionState;
    if(st==="connected"){clearTimeout(call.dc);call.retry=0;connected();setBadge("")}
    else if(st==="disconnected"){setBadge("⚠️ الاتصال ضعيف… بنحاول نرجّعه");clearTimeout(call.dc);call.dc=setTimeout(()=>reconnect("disc"),2500)}
    else if(st==="failed"){reconnect("failed")}
  };
  pc.oniceconnectionstatechange=()=>{if(call&&pc.iceConnectionState==="failed")reconnect("ice")};
  call.stream=await navigator.mediaDevices.getUserMedia({audio:MIC,video:false});
  call.stream.getTracks().forEach(t=>pc.addTrack(t,call.stream));
  return pc;
}
// ---- tones (WebAudio, no files): ringtone for the callee, ringback for the caller ----
let AC=null,toneT=null,wl=null;
function tone(kind){
  stopTone();
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume&&AC.resume()}catch(e){return}
  const beep=(f,dur)=>{try{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type="sine";g.gain.value=.0001;o.connect(g);g.connect(AC.destination);const t=AC.currentTime;g.gain.exponentialRampToValueAtTime(.25,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur+.05)}catch(e){}};
  const ring=()=>{if(kind==="in"){beep(880,.35);setTimeout(()=>beep(660,.35),400);try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}else{beep(440,.9)}};
  ring();toneT=setInterval(ring,kind==="in"?2200:3000);
}
function stopTone(){clearInterval(toneT);toneT=null}
async function keepAwake(on){try{if(on&&navigator.wakeLock){wl=await navigator.wakeLock.request("screen")}else if(wl){await wl.release();wl=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&call&&call.on)keepAwake(true)});
// mic/headset changed during a call (plug/unplug, bluetooth): grab the new default mic and swap the track
let devT=null;
if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener)navigator.mediaDevices.addEventListener("devicechange",()=>{
  clearTimeout(devT);devT=setTimeout(async()=>{
    if(!call||!call.pc||!call.stream)return;
    try{const ns=await navigator.mediaDevices.getUserMedia({audio:MIC,video:false});const nt=ns.getAudioTracks()[0];const snd=call.pc.getSenders().find(x=>x.track&&x.track.kind==="audio");
      if(snd&&nt){nt.enabled=!call.muted;await snd.replaceTrack(nt);call.stream.getTracks().forEach(t=>t.stop());call.stream=ns}}catch(e){}
  },700);
});
function setBadge(t){const b=document.getElementById("callBadge");if(b)b.textContent=t||""}
// caller restarts ICE (new offer with iceRestart); callee only waits. Gives up after ~35 s.
async function reconnect(why){
  if(!call||!call.pc)return;
  if(call.dir!=="out"){call.dc=setTimeout(()=>{if(call&&call.pc.connectionState!=="connected"){msg("انقطعت المكالمة");cleanup(true)}},30000);return}
  call.retry=(call.retry||0)+1;
  if(call.retry>6){msg("انقطعت المكالمة بسبب الشبكة");cleanup(true);return}
  try{
    setBadge("🔄 إعادة الاتصال ("+call.retry+"/6)");
    const off=await call.pc.createOffer({iceRestart:true});await call.pc.setLocalDescription(off);
    await send("offer",{type:off.type,sdp:tune(off.sdp),restart:true});
  }catch(e){}
  clearTimeout(call.dc);call.dc=setTimeout(()=>{if(call&&call.pc.connectionState!=="connected")reconnect("retry")},6000);
}
// keepalive: if no audio bytes arrive for 9 s while "connected", restart ICE
function watch(){
  clearInterval(call.wd);let last=-1,still=0;
  call.wd=setInterval(async()=>{
    if(!call||!call.pc||!call.on)return;
    try{const r=await call.pc.getStats();let b=0;r.forEach(x=>{if(x.type==="inbound-rtp"&&x.kind==="audio")b+=x.bytesReceived||0});
      if(b===last)still++;else{still=0;last=b}
      let rtt=0,lost=0,rec=0;r.forEach(x=>{if(x.type==='candidate-pair'&&x.nominated&&x.currentRoundTripTime)rtt=x.currentRoundTripTime*1000;if(x.type==='inbound-rtp'&&x.kind==='audio'){lost+=x.packetsLost||0;rec+=x.packetsReceived||0}});
      const lp=(call.pl!==undefined&&rec>call.pr)?(lost-call.pl)/Math.max(1,(rec-call.pr)+(lost-call.pl)):0;call.pl=lost;call.pr=rec;
      if(!call.retry)setBadge(rtt>600||lp>.1?'📶 الاتصال ضعيف':'')
      if(still>=3&&!call.muted2){still=0;reconnect("stall")}}catch(e){}
  },3000);
}
window.addEventListener("online",()=>{if(call&&call.on)reconnect("online")});
function connected(){
  if(!call||call.on)return;call.on=true;stopTone();keepAwake(true);clearTimeout(call.t);call.t0=Date.now();watch();
  const draw=()=>{const s=Math.floor((Date.now()-call.t0)/1000);ui(`<div style="font-size:42px">🎙️</div><h2>${esc(nameOf(call.peer))}</h2><div id="callBadge" style="min-height:20px;font-size:13px;color:#ffd9a0"></div><div id="callT" style="font-size:22px">${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}</div><div style="display:flex;gap:12px">${btn(call.muted?"🔇 تشغيل":"🎙️ كتم","callMute()","#3b6b62")}${btn("🔊 "+(call.spkLabel||"الصوت"),"callSpk()","#3b6b62")}${btn("⛔ إنهاء","callEnd()","#b0352d")}</div><small style="opacity:.8">لو سامع صدى: استخدم سماعة أو قلل صوت السماعة</small>`)};
  draw();call.tick=setInterval(()=>{if(call)draw()},1000);
}
window.callMute=()=>{if(!call||!call.stream)return;call.muted=!call.muted;call.stream.getAudioTracks().forEach(t=>t.enabled=!call.muted)};
window.callEnd=()=>cleanup(true);window.callSpk=async function(){
  const a=document.getElementById("callAudio");
  if(!a||typeof a.setSinkId!=="function"||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return msg("متصفحك مش بيسمح باختيار السماعة. غيّرها من زراير الصوت في الموبايل أو من البلوتوث.");
  try{
    const ds=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audiooutput");
    if(ds.length<2)return msg("مفيش غير مخرج صوت واحد متاح دلوقتي.");
    const cur=ds.findIndex(d=>d.deviceId===(a.sinkId||"default")),n=ds[(cur+1)%ds.length];
    await a.setSinkId(n.deviceId);
    const lb=(n.label||"").trim()||("مخرج "+((cur+1)%ds.length+1));
    if(call)call.spkLabel=lb.slice(0,14);msg("الصوت: "+lb);
  }catch(e){msg("ماقدرتش أغير السماعة")}
};
window.callStart=async function(peerUid){
  if(!cs())return authModal("login");
  if(typeof banStop==="function"&&banStop())return;
  if(call)return msg("أنت في مكالمة بالفعل");
  if(!window.RTCPeerConnection||!navigator.mediaDevices)return msg("المتصفح لا يدعم المكالمات");
  call={id:uuid(),peer:peerUid,dir:"out"};
  ui(`<div style="font-size:42px">📞</div><h2>${esc(nameOf(peerUid))}</h2><p>جاري الاتصال…</p>${btn("⛔ إلغاء","callEnd()","#b0352d")}`);tone("out");
  try{
    const pc=await mkPc(),off=await pc.createOffer({offerToReceiveAudio:true});
    await pc.setLocalDescription(off);
    await send("offer",{type:off.type,sdp:tune(off.sdp)});
    call.t=setTimeout(()=>{msg("لم يرد");cleanup(true)},45000);
    startPoll();
  }catch(e){const m=e&&e.name==="NotAllowedError"?"اسمح للميكروفون من إعدادات المتصفح":sbErr(e)||"تعذر بدء المكالمة";cleanup(false);msg(m.slice(0,90))}
};
async function incoming(s){
  if(call){await sb("/rest/v1/call_signals",{method:"POST",body:{call_id:s.call_id,to_uid:s.from_uid,kind:"busy"}}).catch(()=>{});return}
  call={id:s.call_id,peer:s.from_uid,dir:"in",offer:s.payload};
  tone("in");
  ui(`<div style="font-size:42px">📞</div><h2>${esc(nameOf(s.from_uid))}</h2><p>مكالمة واردة…</p><div style="display:flex;gap:12px">${btn("✅ رد","callAccept()","#1b7a63")}${btn("⛔ رفض","callDecline()","#b0352d")}</div>`);
  call.t=setTimeout(()=>cleanup(false),45000);
  startPoll();
}
window.callDecline=()=>{stopTone();if(!call)return;send("decline").catch(()=>{});cleanup(false)};
window.callAccept=async()=>{
  if(!call||!call.offer)return;stopTone();clearTimeout(call.t);
  ui(`<div style="font-size:42px">📞</div><h2>${esc(nameOf(call.peer))}</h2><p>جاري التوصيل…</p>${btn("⛔ إنهاء","callEnd()","#b0352d")}`);
  try{
    const pc=await mkPc();
    await pc.setRemoteDescription(call.offer);
    for(const c of call.pendingIce)await pc.addIceCandidate(c).catch(()=>{});call.pendingIce=[];
    const an=await pc.createAnswer();await pc.setLocalDescription(an);
    await send("answer",{type:an.type,sdp:tune(an.sdp)});
    call.t=setTimeout(()=>{if(call&&!call.on){msg("تعذر الاتصال");cleanup(true)}},30000);
  }catch(e){const m=e&&e.name==="NotAllowedError"?"اسمح للميكروفون من إعدادات المتصفح":"تعذر الرد";cleanup(true);msg(m)}
};
async function onSignal(s){
  if(!s||s.id<=lastSeen&&s.id)return;if(s.id)lastSeen=Math.max(lastSeen,s.id);
  const age=Date.now()-Date.parse(s.created_at);
  try{sb("/rest/v1/call_signals?id=eq."+s.id,{method:"DELETE"}).catch(()=>{})}catch(e){}
  if(age>90000)return;
  if(s.kind==="offer"&&call&&call.id===s.call_id&&call.pc&&s.payload){
    try{await call.pc.setRemoteDescription(s.payload);const an=await call.pc.createAnswer();await call.pc.setLocalDescription(an);await send("answer",{type:an.type,sdp:tune(an.sdp)})}catch(e){}return}
  if(s.kind==="offer"){return incoming(s)}
  if(!call||call.id!==s.call_id)return;
  if(s.kind==="answer"&&call.pc){await call.pc.setRemoteDescription(s.payload).catch(()=>{});for(const c of call.pendingIce)await call.pc.addIceCandidate(c).catch(()=>{});call.pendingIce=[]}
  else if(s.kind==="ice"){if(call.pc&&call.pc.remoteDescription)await call.pc.addIceCandidate(s.payload).catch(()=>{});else call.pendingIce&&call.pendingIce.push(s.payload)}
  else if(s.kind==="hangup"){msg("انتهت المكالمة");cleanup(false)}
  else if(s.kind==="decline"){msg("تم رفض المكالمة");cleanup(false)}
  else if(s.kind==="busy"){msg("الطرف الآخر في مكالمة");cleanup(false)}
}
async function poll(){
  const me=cs();if(!me||document.hidden||!navigator.onLine)return;
  try{
    const since=new Date(Date.now()-90000).toISOString();
    const r=await sb("/rest/v1/call_signals?select=*&to_uid=eq."+me.uid+"&created_at=gt."+encodeURIComponent(since)+"&order=id.asc&limit=50");
    for(const s of r||[])await onSignal(s);
  }catch(e){}
}
let tickN=0;function startPoll(){}
setInterval(()=>{tickN++;if(call||!live||tickN%5===0)poll()},2000);
function connect(){
  const me=cs();
  if(!me||!window.supabase||!window.supabase.createClient)return;
  if(rtClient&&authSeen===me.access)return;
  try{
    if(chan&&rtClient)rtClient.removeChannel(chan);
    authSeen=me.access;live=false;
    rtClient=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    rtClient.realtime.setAuth(me.access);
    chan=rtClient.channel("yomak-calls-"+me.uid).on("postgres_changes",{event:"INSERT",schema:"public",table:"call_signals",filter:"to_uid=eq."+me.uid},p=>onSignal(p.new)).subscribe(st=>{live=st==="SUBSCRIBED";if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"||st==="CLOSED"){authSeen="";setTimeout(connect,1500)}});
  }catch(e){}
}
// DM page: call button
const dmPage=PAGES.dm;
dmPage.act=p=>{const x=p&&dmInfo(p.id);return x?`<button class="pact" aria-label="اتصال صوتي" onclick="callStart('${esc(dmOther(x))}')">📞</button>`:""};
// hook the placeholder provider
try{CALL_PROVIDER.ready=true;CALL_PROVIDER.start=()=>msg("افتح محادثة خاصة واضغط 📞")}catch(e){}
setInterval(()=>{if(!live)authSeen="";connect()},10000);window.addEventListener("online",()=>{authSeen="";connect();poll()});
setTimeout(()=>{connect();poll()},2500);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){connect();poll()}});
})();
