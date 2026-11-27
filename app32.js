/* Phase 4E4: profile about info (work, study, hometown, relationship, website), friend count, mutual friends. */
cl.pi={};
const piRel={single:"أعزب/عزباء",engaged:"مخطوب/ة",married:"متزوج/ة"};
async function piLoad(uid){
  try{const r=await sb("/rest/v1/profile_info?select=*&user_id=eq."+uid);cl.pi[uid]=(r||[])[0]||{};
    const n=await sb("/rest/v1/rpc/friend_count",{method:"POST",body:{u:uid}}).catch(()=>0);
    cl.pi[uid]._fr=new Array(Number(n)||0);
    cl.pi[uid]._mut=(cs()&&uid!==cs().uid)?((await sb("/rest/v1/rpc/mutual_friends",{method:"POST",body:{other:uid}}).catch(()=>[]))||[]).length:0;
  }catch(e){cl.pi[uid]={_fr:[]}}
  renderPage();
}
function piCard(uid){
  const me=(cs()||{}).uid,p=cl.pi[uid];if(!p){piLoad(uid);return""}
  const mine=uid===me,rows=[["💼",p.work],["🎓",p.study],["🏠",p.hometown],["❤️",piRel[p.relationship]],["🌐",p.website]].filter(r=>r[1]);
  const mutual=mine?0:(p._mut||0);
  return '<div class="card"><b>معلومات</b>'+(rows.length?rows.map(r=>'<div>'+r[0]+' '+esc(r[1])+'</div>').join(""):'<p class="muted">لا توجد معلومات</p>')+'<div class="muted" style="margin-top:6px">👥 '+an((p._fr||[]).length)+' صديق'+(mutual?' · '+an(mutual)+' مشترك':"")+'</div>'+(mine?'<button class="chip" onclick="piEdit()">✏️ تعديل المعلومات</button>':"")+'</div>';
}
function piEdit(){
  const me=cs().uid,p=cl.pi[me]||{};
  formModal("معلومات عني",inp("piWork","الشغل",p.work||"",{max:80})+inp("piStudy","الدراسة",p.study||"",{max:80})+inp("piHome","البلد الأصلية",p.hometown||"",{max:80})+'<label class="lbl">الحالة الاجتماعية</label><select id="piRel" class="input"><option value="">—</option>'+Object.keys(piRel).map(k=>'<option value="'+k+'"'+(p.relationship===k?" selected":"")+'>'+piRel[k]+'</option>').join("")+'</select>'+inp("piWeb","الموقع",p.website||"",{max:120}),async()=>{
    try{await ensureProfile();await sb("/rest/v1/profile_info?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{user_id:me,work:val("piWork"),study:val("piStudy"),hometown:val("piHome"),relationship:val("piRel")||null,website:val("piWeb"),updated_at:new Date().toISOString()}});closeModal();delete cl.pi[me];msg("تم ✅");renderPage()}catch(e){msg(sbErr(e).slice(0,90))}return!1},{save:"حفظ"});
}
const _pu2=PAGES.user.render;
PAGES.user.render=function(e){
  const h=_pu2.apply(this,arguments)+"";if(!e||!cs()||!cl.pp[e.id])return h;
  const i=h.indexOf('<div class="chips">');return i<0?h:h.slice(0,i)+piCard(e.id)+h.slice(i);
};
const _pf=window.profile;
if(typeof _pf==="function")window.profile=function(){
  const h=_pf.apply(this,arguments)+"",u=cs();if(!u)return h;
  const i=h.indexOf('<div class="fact"');return i<0?h:h.slice(0,i)+piCard(u.uid)+h.slice(i);
};
