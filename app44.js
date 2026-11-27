/* Video in normal posts: uses the reels bucket (30 MB, 60 s). */
(function(){
const MAXB=30*1048576,MAXS=60;let pv=null;
const osm=window.svcModal;
window.svcModal=function(){
  pv=null;const r=osm.apply(this,arguments);
  try{const sp=document.getElementById("sPrev");
    if(sp&&!document.getElementById("pvFile")){
      const h=document.createElement("div");
      h.innerHTML='<label class="lbl" for="pvFile">🎬 فيديو (اختياري، حتى '+an(MAXS)+' ثانية)</label><input type="file" accept="video/*" id="pvFile" class="input"><video id="pvVid" controls playsinline style="display:none;max-width:100%;border-radius:10px;margin-top:6px"></video><p id="pvInfo" class="muted"></p>';
      sp.parentNode.insertBefore(h,sp.nextSibling);
      document.getElementById("pvFile").onchange=function(){
        const f=this.files[0],v=document.getElementById("pvVid"),i=document.getElementById("pvInfo");pv=null;if(!f){v.style.display="none";i.textContent="";return}
        if(f.size>MAXB){i.textContent="⚠️ الفيديو أكبر من 30 ميجا";this.value="";v.style.display="none";return}
        v.style.display="block";v.src=URL.createObjectURL(f);
        v.onloadedmetadata=()=>{const s=Math.round(v.duration||0);if(s>MAXS){i.textContent="⚠️ الفيديو "+an(s)+" ثانية. الحد "+an(MAXS)+" ثانية.";document.getElementById("pvFile").value="";v.style.display="none"}else{pv=f;i.textContent="✅ "+an(s)+" ثانية · "+an((f.size/1048576).toFixed(1))+" ميجا"}};
        v.onerror=()=>{i.textContent="⚠️ الجهاز ما قدرش يقرأ الفيديو ده. جرّب MP4."};
      };
    }}catch(e){}
  return r;
};
const osend=window.svcSend;
window.svcSend=async function(){
  const f=pv;
  if(f){
    try{
      const i=document.getElementById("pvInfo");if(i)i.textContent="⏳ جاري رفع الفيديو…";
      await ensureProfile();const t=cs();if(t.exp-30<Date.now()/1e3)await sb("/rest/v1/profiles?id=eq."+t.uid+"&select=id");const s=cs();
      const ext=/webm/.test(f.type)?"webm":/quicktime/.test(f.type)?"mov":"mp4";
      window.__pvUrl=await rlUpload(f,s.uid+"/"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+"."+ext,s.access);
    }catch(e){const i=document.getElementById("pvInfo");if(i)i.textContent="⚠️ "+(e.message||"رفع الفيديو فشل");return}
  }
  try{return await osend.apply(this,arguments)}finally{window.__pvUrl=null;pv=null}
};
const osb=window.sb;
window.sb=function(u,o){
  if(window.__pvUrl&&o&&/\/rest\/v1\/service_posts/.test(u)&&(o.method==="POST"||o.method==="PATCH")&&o.body&&typeof o.body==="object")o.body.video_url=window.__pvUrl;
  return osb.apply(this,arguments);
};
const osc=window.svcCard;
window.svcCard=function(e){
  let h=osc.apply(this,arguments);
  if(e&&e.video_url&&/^https:\/\/thdmlbmhloebkghmciyq\.supabase\.co\/storage\/v1\/object\/public\/reels\//.test(e.video_url)){
    const v='<video src="'+esc(e.video_url)+'" controls playsinline preload="metadata" style="width:100%;max-height:420px;background:#000;border-radius:10px;margin-top:8px"></video>';
    const k=h.indexOf('<div class="eng">');h=k>0?h.slice(0,k)+v+h.slice(k):h.replace(/<\/div>$/,v+"</div>");
  }
  return h;
};
})();
