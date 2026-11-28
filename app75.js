/* v82: cloud sync of expenses, income, category budgets, monthly budget and recurring items (table user_fin, one private row per user). Merge by id, deletions are remembered, newest edit wins. Safe to run on every device. */
(function(){
if(!window.ykFin)return;
const T="/rest/v1/user_fin";let busy=0,again=0,timer=0;
const uniq=a=>[...new Set(a)];
function pick(l,r,eu,reu,kind,del){const m=new Map();(l||[]).forEach(x=>m.set(x.id,x));(r||[]).forEach(x=>{const o=m.get(x.id);if(!o)m.set(x.id,x);else if((reu[kind+x.id]||0)>(eu[kind+x.id]||0))m.set(x.id,x)});return [...m.values()].filter(x=>!del.includes(kind+x.id))}
async function sync(){
  if(busy){again=1;return}if(!cs())return;busy=1;
  try{
    const F=ykFin.get(),rows=await sb(T+"?select=data");const rem=(rows&&rows[0]&&rows[0].data)||null;
    let out=F;
    if(rem){
      const del=uniq((F.del||[]).concat(rem.del||[])).slice(-500),eu={...(rem.eu||{}),...(F.eu||{})};
      Object.keys(rem.eu||{}).forEach(k=>{eu[k]=Math.max(eu[k]||0,rem.eu[k]||0)});
      const leu={},reu={};Object.keys(F.eu||{}).forEach(k=>{leu["out"+k]=F.eu[k];leu["in"+k]=F.eu[k]});Object.keys(rem.eu||{}).forEach(k=>{reu["out"+k]=rem.eu[k];reu["in"+k]=rem.eu[k]});
      const exp=pick(d.expenses,rem.exp,leu,reu,"out",del),inc=pick(F.inc,rem.inc,leu,reu,"in",del);
      const rm=new Map();(F.rec||[]).concat(rem.rec||[]).forEach(r=>{const o=rm.get(r.id);if(!o||String(r.last||"")>String(o.last||""))rm.set(r.id,{...(o||{}),...r})});
      const rec=[...rm.values()].filter(r=>!del.includes("rec"+r.id));
      const newer=(rem.ts||0)>(F.ts||0);
      const cb=newer?(rem.cb||{}):F.cb;
      const changed=JSON.stringify(exp)!==JSON.stringify(d.expenses)||JSON.stringify(inc)!==JSON.stringify(F.inc)||JSON.stringify(rec)!==JSON.stringify(F.rec)||newer;
      if(changed){
        tx(()=>{d.expenses=exp;if(newer&&rem.bud&&typeof rem.bud==="object"){d.budgets={...d.budgets,...rem.bud}}});
        out={...F,inc,rec,cb,del,eu,ts:Math.max(F.ts||0,rem.ts||0)};ykFin.set(out);ykFin.save();
        if(typeof current!=="undefined"&&current==="expenses")try{render()}catch(e){}
      }
    }
    const snap={exp:d.expenses,inc:out.inc,cb:out.cb,rec:out.rec,del:out.del||[],eu:out.eu||{},bud:d.budgets,ts:out.ts||0};
    if(!rem||JSON.stringify(snap)!==JSON.stringify(rem)){
      await sb(T+"?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates,return=minimal",body:{data:snap,updated_at:new Date().toISOString()}});
    }
  }catch(e){console.warn("fin sync",e)}
  busy=0;if(again){again=0;setTimeout(sync,2000)}
}
window.ykFinChanged=()=>{clearTimeout(timer);timer=setTimeout(sync,3000)};
/* budget saved from the old dialog also counts as a change */
const _sb=window.saveBudget;if(_sb)window.saveBudget=function(){const r=_sb.apply(this,arguments);setTimeout(()=>{try{ykFin.touch()}catch(e){}},200);return r};
const _de=window.deleteExpense;if(_de)window.deleteExpense=function(id){const had=d.expenses.some(e=>e.id===id);const r=_de.apply(this,arguments);if(had&&!d.expenses.some(e=>e.id===id)){const F=ykFin.get();F.del.push("out"+id);ykFin.touch()}return r};
setTimeout(sync,4500);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(sync,800)});
})();
