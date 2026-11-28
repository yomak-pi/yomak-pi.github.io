/* v88: community standards + minors + terms page (in app), delete-my-account (server function delete_my_account). */
(function(){
if(typeof PAGES==="undefined")return;
const H=(t)=>'<h3 style="margin:16px 0 6px;color:var(--g,#155b50)">'+t+'</h3>',P=(t)=>'<p style="margin:4px 0;line-height:1.9">'+t+'</p>',U=(a)=>'<ul style="margin:4px 0;padding-inline-start:20px;line-height:1.9">'+a.map(x=>'<li>'+x+'</li>').join("")+'</ul>';
PAGES.community={title:()=>"معايير المجتمع والشروط",render:()=>'<div class="card">'+
 H("إحنا هنا لإيه")+P("يومك مكان لأهلنا وأصحابنا ومجتمعنا. عشان يفضل آمن ومحترم، ده المسموح والممنوع.")+
 H("ممنوع")+U(["التحرش والتنمر والتهديد وخطاب الكراهية","المحتوى الجنسي أو العنيف الصادم","الاحتيال والنصب وإعلانات وهمية أو منتجات مخالفة للقانون","انتحال شخصية حد أو نشر بياناته الخاصة بدون إذنه","السبام والروابط المضللة والحسابات المزيفة","أي محتوى يستغل الأطفال، وده بنبلّغ عنه فوراً"])+
 H("حماية القاصرين")+U(["الحد الأدنى لاستخدام يومك 13 سنة. لو أقل من كده لازم حساب باشراف ولي الأمر أو ماتسجلش.","أي محتوى جنسي يخص قاصرين بيتحذف والحساب بيتحظر دائماً.","لو حد غريب بيتواصل مع طفل بشكل مريب: بلّغ عنه من زر الإبلاغ، ويقدر المشرف يوقفه فوراً.","ولي الأمر يقدر يطلب حذف حساب ابنه في أي وقت."])+
 H("الإبلاغ والإشراف")+P("كل منشور أو رسالة أو حساب فيه زر إبلاغ. المشرفون بيراجعوا البلاغات ويقدروا يخفوا المحتوى أو يحذفوه أو يوقفوا الحساب. كل إجراء إداري بيتسجل.")+
 H("الرسائل الخاصة")+P("رسائلك الخاصة مش بتتراجع. المشرف يقرأ فقط الرسائل اللي حد بلّغ عنها، وبس في حدود البلاغ.")+
 H("لو شايف قرار غلط")+P("لو حسابك أو محتواك اتأثر وإنت شايف إن القرار غلط، ابعت للدعم على omarkhaleel432@gmail.com واذكر اسم حسابك، وهنراجعه.")+
 H("الشروط")+P("استخدامك للتطبيق معناه موافقتك على الالتزام بالمعايير دي. أنت مسؤول عن اللي بتنشره وعن تعاملك مع غيرك، ويومك وسيط عرض ولا يضمن أي صفقة. ممكن نحذف أي محتوى أو حساب مخالف.")+
 H("حذف حسابك")+P("تقدر تحذف حسابك وبياناتك نهائياً من الإعدادات.")+'</div>'};
window.ykDelAcc=function(){
  openModal('<button class="close" aria-label="إغلاق" onclick="closeModal()">×</button><h3>🗑 حذف الحساب نهائياً</h3><p class="muted">هيتمسح حسابك وكل منشوراتك ورسائلك وصداقاتك وبياناتك السحابية (المصروفات والدخل وغيرها) من السيرفر. مش هينفع نرجعهم.</p><p>اكتب كلمة <b>حذف</b> للتأكيد:</p><input class="input" id="ykDelIn" autocomplete="off"><button class="primary" style="margin-top:10px;background:#b3261e" onclick="ykDelGo()">حذف حسابي نهائياً</button>')};
window.ykDelGo=async function(){
  const v=((document.getElementById("ykDelIn")||{}).value||"").trim();
  if(v!=="حذف")return msg("اكتب كلمة حذف للتأكيد");
  try{
    await sb("/rest/v1/rpc/delete_my_account",{method:"POST",body:{}});
    try{localStorage.removeItem("yomak_sb");localStorage.removeItem("yk_fin")}catch(e){}
    msg("تم حذف حسابك");setTimeout(function(){location.reload()},1200);
  }catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}
};
const _s=PAGES.settings&&PAGES.settings.render;
if(_s)PAGES.settings.render=function(){
  let h=_s.apply(this,arguments);
  h+='<div class="card"><b>⚖️ المعايير والخصوصية</b><div class="row" style="margin-top:8px"><button class="secondary" onclick="openPage(\'community\')">معايير المجتمع والشروط</button></div></div>';
  if(cs())h+='<div class="card"><b>🗑 حذف الحساب</b><p class="muted">حذف نهائي لحسابك وبياناتك من السيرفر.</p><button class="secondary" style="color:#b3261e" onclick="ykDelAcc()">حذف حسابي</button></div>';
  return h};
})();
