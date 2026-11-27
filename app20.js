/* Phase 1: services marketplace (يسر وتيسير). Worker sign-up, search by category/city/text,
   worker page with reviews, service requests. Tables: service_providers, service_reviews, service_requests. */
(function(){
  var CATS=[["plumber","🔧","سباكة"],["electric","💡","كهرباء"],["ac","❄️","تكييف وتبريد"],["carpentry","🪚","نجارة"],["paint","🎨","نقاشة ودهانات"],["clean","🧹","تنظيف"],["moving","🚚","نقل عفش"],["delivery","🛵","توصيل"],["car","🚗","صيانة سيارات"],["appliance","🔌","صيانة أجهزة"],["tutor","📚","دروس خصوصية"],["beauty","✂️","تجميل وحلاقة"],["tailor","🧵","خياطة"],["cooking","🍲","أكل بيت"],["design","💻","تصميم وبرمجة"],["photo","📷","تصوير"],["events","🎉","مناسبات"],["health","🩺","رعاية صحية"],["garden","🌿","حدائق"],["other","➕","أخرى"]];
  var CM={};CATS.forEach(function(c){CM[c[0]]=c});
  var S={cat:"",q:"",city:"",list:null,busy:false,err:"",provider:null,reviews:null,mine:undefined,rv:5};
  var cur=function(){return d.country==="SA"?"ريال":"جنيه"};
  var stars=function(a,n){return n?("⭐ "+an(Number(a).toFixed(1))+" ("+an(n)+")"):"جديد"};
  var clean=function(q){return (q||"").replace(/[,()*%\\:"']/g," ").trim().slice(0,40)};
  async function load(){
    S.busy=true;S.err="";S.list=null;draw();
    try{
      var f=["select=*","active=eq.true","country=eq."+(d.country==="SA"?"SA":"EG"),"order=verified.desc,rating_avg.desc,created_at.desc","limit=40"];
      if(S.cat)f.push("category=eq."+S.cat);
      if(S.city)f.push("city=ilike.*"+encodeURIComponent(clean(S.city))+"*");
      var q=clean(S.q);if(q){var e=encodeURIComponent(q);f.push("or=("+["name","title","bio","areas"].map(function(k){return k+".ilike.*"+e+"*"}).join(",")+")")}
      S.list=await sbRaw("/rest/v1/service_providers?"+f.join("&"));
    }catch(e){S.err=(e&&e.message)||"تعذّر التحميل"}
    S.busy=false;draw();
  }
  function draw(){try{if(curPage()==="svcs"||curPage()==="svc"||curPage()==="svcreg")renderPage()}catch(e){}}
  function card(p){
    var c=CM[p.category]||CM.other;
    return '<div class="card office" onclick="svcOpen(\''+esc(p.id)+'\')"><div class="row"><span class="icon">'+c[1]+'</span><span style="flex:1;min-width:0"><b>'+esc(p.name)+(p.verified?' <span class="vb">✔</span>':'')+'</b><small>'+esc(p.title||c[2])+' · '+esc(p.city||"")+'</small></span><span class="pill">'+stars(p.rating_avg,p.rating_count)+'</span></div>'+
      (p.price_from!=null?'<div class="fprice">ابتداءً من '+an(Number(p.price_from))+' '+esc(p.price_unit||cur())+'</div>':'')+'</div>';
  }
  PAGES.svcs={title:function(){return "خدمات يسر 🛠️"},render:function(){
    var h='<div class="search" style="background:#fff;border:1px solid var(--line)"><input id="svQ" class="input" style="border:0;margin:0" placeholder="ابحث عن خدمة أو صنايعي" value="'+esc(S.q)+'" onkeydown="if(event.key===\'Enter\')svcFind()"><button onclick="svcFind()">بحث</button></div>';
    h+='<input id="svCity" class="input" placeholder="المدينة (اختياري)" value="'+esc(S.city)+'" onkeydown="if(event.key===\'Enter\')svcFind()">';
    h+='<div class="fchips"><button class="fchip '+(S.cat?"":"on")+'" onclick="svcCat(\'\')">الكل</button>'+CATS.map(function(c){return '<button class="fchip '+(S.cat===c[0]?"on":"")+'" onclick="svcCat(\''+c[0]+'\')">'+c[1]+' '+c[2]+'</button>'}).join("")+'</div>';
    h+='<button class="secondary" onclick="svcReg()">🧰 أنا صاحب خدمة — سجّل خدمتي</button>';
    if(S.busy)h+='<div class="empty">جاري التحميل…</div>';
    else if(S.err)h+='<div class="card empty">'+esc(S.err)+'<br><button class="secondary" onclick="svcFind()">إعادة المحاولة</button></div>';
    else if(S.list&&!S.list.length)h+='<div class="card empty">مفيش نتائج لسه. لو بتشتغل في المجال ده سجّل خدمتك وتبقى أول واحد.</div>';
    else if(S.list)h+='<div class="list" style="margin-top:10px">'+S.list.map(card).join("")+'</div>';
    return h;
  },after:function(){if(S.list===null&&!S.busy&&!S.err)load()}};
  window.svcOpen=function(){var id=arguments[0];S.provider=(S.list||[]).find(function(p){return p.id===id})||null;S.reviews=null;S.rv=5;if(S.provider)openPage("svc",id)};
  window.svcCat=function(c){S.cat=c;load()};
  window.svcFind=function(){S.q=val("svQ");S.city=val("svCity");load()};
  async function loadRev(id){try{S.reviews=await sbRaw("/rest/v1/service_reviews?select=*&provider_id=eq."+id+"&order=created_at.desc&limit=30")}catch(e){S.reviews=[]}draw()}
  PAGES.svc={title:function(){return S.provider?S.provider.name:"خدمة"},render:function(){
    var p=S.provider;if(!p)return '<div class="empty">الخدمة غير متاحة</div>';
    var c=CM[p.category]||CM.other,me=cs(),mine=me&&me.uid===p.user_id,ph=p.phone?String(p.phone).replace(/[^\d]/g,""):"";
    var h='<div class="card"><div class="row"><span class="icon">'+c[1]+'</span><span><b>'+esc(p.name)+(p.verified?' <span class="vb">✔ موثّق</span>':'')+'</b><small>'+esc(p.title||c[2])+'</small></span></div>'+
      '<p>'+esc(p.bio||"")+'</p><div class="muted">📍 '+esc([p.city,p.areas].filter(Boolean).join(" — "))+'</div>'+
      (p.price_from!=null?'<div class="fprice">ابتداءً من '+an(Number(p.price_from))+' '+esc(p.price_unit||cur())+'</div>':'')+
      '<div class="muted">'+stars(p.rating_avg,p.rating_count)+'</div>'+
      '<div class="fact">'+(ph&&p.whatsapp?'<a class="fb-wa" href="https://wa.me/'+ph+'" target="_blank" rel="noopener noreferrer">🟢 واتساب</a>':'')+(ph?'<a class="fb-call" href="tel:+'+ph+'">📞 اتصال</a>':'')+(mine?'':'<button class="fb-chat" onclick="svcChat(\''+esc(p.user_id)+'\')">💬 رسالة</button>')+'</div></div>';
    if(!mine)h+='<button class="primary" onclick="svcAsk()">📨 اطلب الخدمة دي</button>';
    else h+='<button class="secondary" onclick="svcReg()">✏️ عدّل خدمتي</button>';
    h+='<div class="sub2">التقييمات</div>';
    if(S.reviews===null){h+='<div class="empty">جاري التحميل…</div>'}
    else if(!S.reviews.length)h+='<div class="muted">لسه مفيش تقييمات.</div>';
    else h+=S.reviews.map(function(r){return '<div class="card"><b>'+"⭐".repeat(r.rating)+'</b><p class="muted">'+esc(r.comment||"")+'</p></div>'}).join("");
    if(!mine)h+='<div class="card"><b>قيّم الخدمة</b><div class="chips">'+[5,4,3,2,1].map(function(n){return '<button class="chip '+(S.rv===n?"on":"")+'" onclick="S_rv('+n+')">'+n+' ⭐</button>'}).join("")+'</div>'+inp("rvC","تعليقك (اختياري)","",{max:300})+'<button class="secondary" onclick="svcRate()">إرسال التقييم</button></div>';
    return h;
  },after:function(id){if(S.reviews===null&&S.provider)loadRev(S.provider.id)}};
  window.S_rv=function(n){S.rv=n;draw()};
  window.svcRate=async function(){
    if(!cs())return authModal("login");
    try{await sb("/rest/v1/service_reviews?on_conflict=provider_id,user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{provider_id:S.provider.id,rating:S.rv,comment:val("rvC").slice(0,300)||null}});msg("شكرًا على تقييمك ✅");S.reviews=null;draw()}
    catch(e){msg((e&&e.message)||"تعذّر الإرسال")}
  };
  window.svcAsk=function(){
    if(!cs())return authModal("login");
    formModal("اطلب الخدمة",'<p class="muted">اكتب المطلوب وهيوصل لصاحب الخدمة، وهو هيتواصل معاك.</p>'+inp("rqD","المطلوب بالتفصيل","",{area:1,max:600,rows:4})+inp("rqP","رقم تواصل (اختياري)","",{type:"tel",max:20}),async function(){
      var t=val("rqD");if(t.length<3)return msg("اكتب تفاصيل الطلب");
      var ph=val("rqP"),n=ph?normPhone(ph,d.country==="SA"?"SA":"EG"):"";if(ph&&!n)return msg("رقم غير صحيح");
      try{await sb("/rest/v1/service_requests",{method:"POST",prefer:"return=minimal",body:{provider_id:S.provider.id,category:S.provider.category,city:S.provider.city,details:t,phone:n||null}});closeModal();msg("اتبعت الطلب لصاحب الخدمة ✅")}
      catch(e){msg((e&&e.message)||"تعذّر الإرسال")}
    },{save:"إرسال الطلب"});
  };
  async function loadMine(){
    var me=cs();if(!me){S.mine=null;return}
    try{var r=await sb("/rest/v1/service_providers?select=*&user_id=eq."+me.uid);S.mine=r[0]||null}catch(e){S.mine=null}
    draw();
  }
  window.svcReg=function(){if(!cs()){authModal("signup");return}S.mine=undefined;openPage("svcreg")};
  PAGES.svcreg={title:function(){return "سجّل خدمتك"},render:function(){
    if(S.mine===undefined)return '<div class="empty">جاري التحميل…</div>';
    var m=S.mine||{},cat=m.category||"plumber";
    return '<p class="muted">بياناتك دي هتظهر للناس اللي بتدور على خدمتك. رقمك بيظهر بس لو دخلته.</p>'+
      inp("rgN","الاسم الظاهر",m.name||d.name||"",{max:60})+
      '<label class="lbl">التخصص</label><select id="rgC" class="input">'+CATS.map(function(c){return '<option value="'+c[0]+'"'+(c[0]===cat?" selected":"")+'>'+c[1]+" "+c[2]+'</option>'}).join("")+'</select>'+
      inp("rgT","عنوان مهنتك (مثال: سباك معتمد)",m.title||"",{max:80})+
      inp("rgB","نبذة عن خبرتك وأسعارك",m.bio||"",{area:1,max:900,rows:4})+
      inp("rgCity","المدينة",m.city||d.city||"",{max:40})+
      inp("rgA","مناطق الخدمة",m.areas||"",{max:180})+
      inp("rgP","رقم الموبايل",m.phone?("+"+m.phone.replace(/^\+/,"")):"",{type:"tel",max:20})+
      '<label class="chkrow"><input id="rgW" type="checkbox"'+(m.whatsapp?" checked":"")+'> يتواصلوا معايا على واتساب</label>'+
      inp("rgPr","السعر يبدأ من (رقم)",m.price_from!=null?m.price_from:"",{type:"number",max:12})+
      inp("rgU","الوحدة (مثال: للزيارة، للساعة)",m.price_unit||"",{max:20})+
      '<button class="primary" onclick="svcSave()">'+(S.mine?"حفظ التعديلات":"نشر خدمتي")+'</button>'+
      (S.mine?'<button class="secondary" style="margin-top:8px" onclick="svcDelMine()">🗑️ حذف خدمتي</button>':'');
  },after:function(){if(S.mine===undefined)loadMine()}};
  window.svcSave=async function(){
    var name=val("rgN");if(name.length<2)return msg("اكتب اسمك");
    var ph=val("rgP"),n=ph?normPhone(ph,d.country==="SA"?"SA":"EG"):"";if(ph&&!n)return msg("رقم غير صحيح");
    if(!n&&!window.YOMAK_PI)return msg("اكتب رقم موبايل يتواصل عليه الناس");
    var pr=val("rgPr");
    var body={name:name,category:el("rgC").value,title:val("rgT")||null,bio:val("rgB")||null,city:val("rgCity")||null,areas:val("rgA")||null,phone:n||null,whatsapp:!!el("rgW").checked,country:d.country==="SA"?"SA":"EG",price_from:pr?Number(pr):null,price_unit:val("rgU")||null};
    try{
      if(S.mine)await sb("/rest/v1/service_providers?id=eq."+S.mine.id,{method:"PATCH",prefer:"return=minimal",body:body});
      else await sb("/rest/v1/service_providers",{method:"POST",prefer:"return=minimal",body:body});
      msg("تم الحفظ ✅");S.mine=undefined;S.list=null;backBtn();
    }catch(e){msg((e&&e.message)||"تعذّر الحفظ")}
  };
  window.svcDelMine=async function(){
    if(!S.mine||!confirm("تحذف خدمتك؟"))return;
    try{await sb("/rest/v1/service_providers?id=eq."+S.mine.id,{method:"DELETE"});S.mine=undefined;S.list=null;msg("اتحذفت");backBtn()}catch(e){msg((e&&e.message)||"تعذّر الحذف")}
  };
  /* entry points: all-sections grid and a card on the home feed */
  try{if(Array.isArray(HUB)&&!HUB.some(function(h){return h[0]==="svcs"}))HUB.unshift(["svcs","🛠️","خدمات يسر"])}catch(e){}
  try{
    var fh=feedHome;
    window.feedHome=feedHome=function(){
      var h=fh.apply(this,arguments);
      var card='<div class="card tour" style="cursor:pointer" onclick="openPage(\'svcs\')"><div class="row"><span class="icon">🛠️</span><span><b>خدمات يسر</b><small>دوّر على سباك أو كهربائي أو مدرس… أو سجّل خدمتك</small></span></div></div>';
      var i=h.indexOf('class="daystrip"');
      if(i>=0){var j=h.indexOf("</div></div>",i);if(j>=0)return h.slice(0,j+12)+card+h.slice(j+12)}
      return card+h;
    };
  }catch(e){console.warn("svcs entry",e)}
})();
