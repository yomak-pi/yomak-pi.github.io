/* Phase 3: expenses: monthly report as PDF (print to PDF), category breakdown, month picker. */
window._xm=window._xm||new Date().toISOString().slice(0,7);
const xList=m=>d.expenses.filter(e=>(e.date||"").slice(0,7)===m);
function xCats(list){const c={};list.forEach(e=>c[e.cat]=(c[e.cat]||0)+Number(e.amount||0));return Object.entries(c).sort((a,b)=>b[1]-a[1])}
function xMonths(){const s=new Set(d.expenses.map(e=>(e.date||"").slice(0,7)).filter(Boolean));s.add(new Date().toISOString().slice(0,7));return[...s].sort().reverse()}
const _ex=window.expenses;
window.expenses=function(){
  const h=_ex.apply(this,arguments)+"",l=xList(window._xm),tot=l.reduce((s,e)=>s+Number(e.amount||0),0),cats=xCats(l);
  const box='<div class="card"><div class="row between"><b>تقرير الشهر</b><select class="input" style="width:auto;margin:0" onchange="window._xm=this.value;refresh()">'+xMonths().map(m=>'<option'+(m===window._xm?" selected":"")+'>'+m+'</option>').join("")+'</select></div><div class="big" style="margin:6px 0">'+cash(tot)+'</div>'+
   (cats.length?cats.map(c=>'<div class="muted" style="margin-top:6px">'+esc(c[0])+' · '+cash(c[1])+' ('+Math.round(c[1]/tot*100)+'%)</div><div class="progress" style="background:#e7efeb;margin:3px 0"><span style="width:'+Math.round(c[1]/tot*100)+'%;background:var(--g)"></span></div>').join(""):'<p class="muted">لا توجد مصروفات في الشهر ده</p>')+
   '<button class="primary" style="margin-top:10px" onclick="expPdf()">📄 PDF للشهر المختار</button></div>';
  const i=h.indexOf('<div class="section">');return i<0?h+box:h.slice(0,i)+box+h.slice(i);
};
function expPdf(){
  const m=window._xm,l=xList(m).sort((a,b)=>(a.date||"").localeCompare(b.date||"")),tot=l.reduce((s,e)=>s+Number(e.amount||0),0),cats=xCats(l),b=budgetVal();
  if(!l.length)return msg("لا توجد مصروفات في الشهر ده");
  const css='body{font-family:system-ui,Tahoma,Arial;direction:rtl;padding:24px;color:#123c3a}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border-bottom:1px solid #ddd;padding:7px;text-align:right;font-size:13px}th{background:#e8f5ef}.t{font-size:22px;font-weight:900}.bar{height:8px;background:#e7efeb;border-radius:4px}.bar i{display:block;height:8px;background:#155b50;border-radius:4px}small{color:#5d6965}@media print{button{display:none}}';
  const html='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تقرير مصروفات '+m+'</title><style>'+css+'</style><h1>يومك: تقرير المصروفات</h1><small>شهر '+m+'</small><div class="t">'+cash(tot)+'</div>'+(b?'<small>الميزانية: '+cash(b)+' · '+(tot>b?"تجاوزت بـ "+cash(tot-b):"متبقي "+cash(b-tot))+'</small>':"")+
   '<h3>حسب الفئة</h3>'+cats.map(c=>'<div>'+esc(c[0])+' · '+cash(c[1])+' ('+Math.round(c[1]/tot*100)+'%)<div class="bar"><i style="width:'+Math.round(c[1]/tot*100)+'%"></i></div></div>').join("")+
   '<h3>التفاصيل</h3><table><tr><th>التاريخ</th><th>الوصف</th><th>الفئة</th><th>المبلغ</th></tr>'+l.map(e=>'<tr><td>'+esc(e.date)+'</td><td>'+esc(e.title)+'</td><td>'+esc(e.cat)+'</td><td>'+cash(e.amount,e.currency)+'</td></tr>').join("")+'</table><button onclick="print()">طباعة / حفظ PDF</button><script>setTimeout(function(){print()},500)<\/script>';
  const w=window.open("","_blank");
  if(w){w.document.open();w.document.write(html);w.document.close()}
  else{const bl=new Blob([html],{type:"text/html;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(bl);a.target="_blank";document.body.appendChild(a);a.click();a.remove()}
}
