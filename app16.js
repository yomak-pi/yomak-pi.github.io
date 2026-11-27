// Sign in with Pi Network. Inside Pi Browser: Pi.authenticate. In a normal browser: Pi Sign-in (OAuth) once PI_CLIENT_ID is set.
(function(){
  var PI_CLIENT_ID="rHU8OBzAds4prB0d7YNJL-HWUIHzTKO1fenUQC9kBK8"; // public OAuth client id from the Pi Developer Portal (Pi Sign-in section). Empty = only Pi Browser route.
  var PI_SANDBOX=/[?&]sandbox=1\b/.test(location.search); // true only when opened with ?sandbox=1 (Pi developer sandbox run)
  var inPi=function(){return /PiBrowser/i.test(navigator.userAgent||"")||PI_SANDBOX};
  function loadSdk(){return new Promise(function(ok,no){
    if(window.Pi)return ok();
    var s=document.createElement("script");s.src="https://sdk.minepi.com/pi-sdk.js";s.onload=ok;s.onerror=function(){no(new Error("sdk"))};document.head.appendChild(s)})}
  async function finish(token){
    msg("جاري الدخول بحساب Pi…");
    var r=await fetch(SB_URL+"/functions/v1/pi-login",{method:"POST",headers:{"Content-Type":"application/json",apikey:SB_KEY},body:JSON.stringify({token:token})});
    var j=await r.json().catch(function(){return{}});
    if(!r.ok||!j.token_hash)throw new Error(j.error||"فشل التحقق من Pi");
    var s=await sbRaw("/auth/v1/verify",{method:"POST",body:{type:"magiclink",token_hash:j.token_hash}});
    if(!s||!s.access_token||!s.user)throw new Error("فشل إنشاء الجلسة");
    var name=(j.name||"مستخدم Pi").slice(0,40);
    var c=saveSess(s,name);
    try{var p=await sb("/rest/v1/profiles?id=eq."+c.uid+"&select=name");if(p&&p[0]&&p[0].name)name=p[0].name}catch(e){}
    c.name=name;setCs(c);
    try{await sb("/rest/v1/profiles",{method:"POST",prefer:"resolution=merge-duplicates",body:{id:c.uid,name:name,country:(typeof d!=="undefined"&&d.country)||""}})}catch(e){}
    cl.groups=null;cl.conv=!1;cl.meTs=0;cl.me=null;cl.pp={};
    var a=el("app");a&&!a.classList.contains("hide")&&go("chat");
    msg("أهلًا "+name);
  }
  window.piLogin=async function(){
    try{
      if(inPi()){
        await loadSdk();
        await Pi.init({version:"2.0",sandbox:PI_SANDBOX});
        var r=await Pi.authenticate(["username"],function(){});
        return await finish(r.accessToken);
      }
      if(PI_CLIENT_ID){
        var st=(crypto.randomUUID&&crypto.randomUUID())||String(Math.random()).slice(2);
        sessionStorage.setItem("pi_oauth_state",st);
        var u=new URL("https://accounts.pinet.com/oauth/authorize");
        u.searchParams.set("response_type","token");u.searchParams.set("client_id",PI_CLIENT_ID);
        u.searchParams.set("redirect_uri",location.origin+location.pathname.replace(/[^\/]*$/,"")+"pi-callback.html");
        u.searchParams.set("scope","username");u.searchParams.set("state",st);
        location.href=u.toString();return;
      }
      msg("افتح يومك من متصفح Pi (Pi Browser) للدخول بحساب Pi");
    }catch(e){msg(("تعذر الدخول بـ Pi: "+((e&&e.message)||e)).slice(0,90))}
  };
  // Return from the Pi Sign-in redirect (pi-callback.html stores the token for us).
  async function piReturn(){
    var t=sessionStorage.getItem("pi_tok");if(!t)return;
    sessionStorage.removeItem("pi_tok");
    try{await finish(t)}catch(e){msg(("تعذر الدخول بـ Pi: "+((e&&e.message)||e)).slice(0,90))}
  }
  // Swap the "coming soon" Pi button for the real one.
  var o=window.oauthBtns;
  if(typeof o==="function")window.oauthBtns=function(){
    return o().replace(/onclick="msg\('Pi Network[^"]*"[^>]*>[^<]*/,'onclick="piLogin()">🟣 المتابعة بحساب Pi');
  };
  setTimeout(piReturn,600);
})();
