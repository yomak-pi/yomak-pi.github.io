/* Item 1: smoother setup, nothing skipped, plus password reset.
   - Country, region, city, name and sign-in all stay required.
   - The likely country is suggested (highlighted) but the user still taps it.
   - Login keeps a typed password. "نسيت كلمة السر؟" emails a reset link
     (Supabase /auth/v1/recover) and the link opens a "set new password" screen. */
(function(){
  var E=function(i){return document.getElementById(i)};
  /* ---- 1. suggestion + focus on setup steps ---- */
  try{
    var orig=drawStep;
    var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
    var sug=/Riyadh|Kuwait|Qatar|Bahrain|Dubai|Muscat|Aden/.test(tz)?"SA":(/Cairo/.test(tz)?"EG":"");
    window.drawStep=drawStep=function(){
      orig.apply(this,arguments);
      try{
        var c=E("onContent");if(!c)return;
        if(step===1&&sug&&!d.country){
          var b=c.querySelector("button[onclick=\"pickCountry('"+sug+"')\"]");
          if(b&&!b.querySelector(".sug")){b.insertAdjacentHTML("beforeend","<br><small class=\"sug\">مقترح لك</small>");b.style.outline="2px solid #f2a54a"}
        }
        var i=c.querySelector("input");if(i&&step>=2)setTimeout(function(){try{i.focus()}catch(e){}},50);
      }catch(e){}
    };
    var ob=E("onboard");if(ob&&!ob.classList.contains("hide"))drawStep();
  }catch(e){console.warn("setup-smooth",e)}
  /* ---- 2. forgot password ---- */
  try{
    var gm=gateMode;
    window.gateMode=gateMode=function(m){
      gm.apply(this,arguments);
      try{
        var g=E("gate");if(!g||m==="signup")return;
        var btn=g.querySelector("button.primary");
        if(btn&&!g.querySelector(".forgot")){
          var a=document.createElement("button");a.type="button";a.className="secondary forgot";a.style.marginTop="8px";a.textContent="نسيت كلمة السر؟";a.onclick=gateForgot;
          btn.insertAdjacentElement("afterend",a);
        }
      }catch(e){}
    };
    window.gateForgot=function(){
      var g=E("gate");if(!g)return;
      g.innerHTML='<div class="gbox"><div class="onbrand">يومك <small>YOMAK</small></div><h1>استرجاع كلمة السر</h1><p class="muted">اكتب بريدك المسجّل وهنبعتلك رسالة فيها لينك تختار منه كلمة سر جديدة.</p>'+inp("aMail","البريد الإلكتروني",val("aMail"),{type:"email",mode:"email",max:120})+'<button class="primary" style="margin-top:10px" onclick="sendReset()">ابعت لينك الاسترجاع</button><button class="secondary" type="button" style="margin-top:8px" onclick="gateMode(\'login\')">رجوع</button><p class="muted" style="font-size:12px;margin-top:10px">لو الرسالة ما وصلتش شوف الـ Spam، وجرّب بعد دقائق.</p></div>';
    };
    window.sendReset=async function(){
      var m=val("aMail");
      if(!/^\S+@\S+\.\S+$/.test(m))return msg("اكتب بريد صحيح");
      msg("جاري الإرسال…");
      try{
        await sbRaw("/auth/v1/recover?redirect_to="+encodeURIComponent(location.origin+location.pathname),{method:"POST",body:{email:m}});
        msg("لو البريد مسجّل هتوصلك رسالة دلوقتي");
      }catch(e){msg((e&&e.message)||"تعذّر الإرسال، جرّب بعد شوية")}
    };
  }catch(e){console.warn("forgot",e)}
  /* ---- 3. set new password after opening the emailed link ---- */
  try{
    var h=window.__yhash||"";
    if(/type=recovery/.test(h)){
      var p=new URLSearchParams(h.replace(/^#/,"")),tok=p.get("access_token");
      if(tok){
        var s=document.createElement("div");s.id="recbox";s.className="gate";s.setAttribute("role","dialog");s.style.zIndex=9;
        s.innerHTML='<div class="gbox"><div class="onbrand">يومك <small>YOMAK</small></div><h1>كلمة سر جديدة</h1><p class="muted">اكتب كلمة السر الجديدة (٦ أحرف على الأقل).</p>'+inp("rPass","كلمة السر الجديدة","",{type:"password",max:72})+'<button class="primary" style="margin-top:10px" id="rGo">حفظ</button></div>';
        document.body.appendChild(s);
        E("rGo").onclick=async function(){
          var v=E("rPass").value;
          if(v.length<6)return msg("كلمة السر قصيرة");
          try{await sbRaw("/auth/v1/user",{method:"PUT",token:tok,body:{password:v}});s.remove();msg("اتغيرت كلمة السر")}
          catch(e){msg((e&&e.message)||"فشل التغيير، اطلب لينك جديد")}
        };
      }
    }
  }catch(e){console.warn("recovery",e)}
})();
