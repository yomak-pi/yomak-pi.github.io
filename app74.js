/* v81: home refinement. Compact app bar, greeting row with the three icons, composer, one stories row, shortcuts, then a clearly titled feed. Empty states are small and friendly. */
(function(){
const st=document.createElement("style");st.textContent=`
header{padding:10px 16px 12px!important;border-radius:0 0 22px 22px!important}
header .brand{font-size:21px}header .brand small{display:inline-block;margin-right:8px;font-size:9px}
header .top{min-height:44px}.loc{min-height:38px!important;padding:4px 12px!important;font-size:13px}
body{padding-top:10px!important}
.ykbar{display:flex;align-items:center;gap:8px;margin:4px 0 12px}
.ykbar .hi{flex:1;min-width:0}.ykbar .hi small{display:block;color:var(--muted);font-size:12px}.ykbar .hi b{display:block;font-size:20px;font-weight:800;color:var(--dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ykbar button{position:relative;width:44px;height:44px;border:0;border-radius:15px;background:#fff;box-shadow:var(--sh1);font-size:19px}
.ykbar .nbadge{position:absolute;top:-4px;left:-4px;min-width:18px;height:18px;border-radius:9px;background:#e8556d;color:#fff;font-size:10px;font-style:normal;display:grid;place-items:center;padding:0 4px}
.fbtop{display:none!important}
.stc{flex:0 0 88px!important;height:128px!important}
.stc.add .top{height:76px!important}.stc.add .top .av,.stc.add .top img{width:52px!important;height:52px!important}
.stc.add .top>*{width:52px!important;height:52px!important;font-size:22px!important;line-height:52px}.stc.add .pl{bottom:28px!important;width:30px!important;height:30px!important;font-size:19px!important}
.stc .nm{font-size:11.5px!important}
.ykh{display:flex;align-items:center;justify-content:space-between;margin:14px 2px 8px}.ykh b{font-size:17px;font-weight:800}
.ykh details{margin:0!important;background:none!important;box-shadow:none!important;padding:0!important;position:relative}
.ykh details>summary{min-height:36px!important;background:#fff;border-radius:18px;padding:0 14px;box-shadow:var(--sh1);font-size:13px!important;list-style:none;color:var(--dark)!important}
.ykh details>summary::-webkit-details-marker{display:none}
.ykh details[open]{position:static}
.ykh details>*:not(summary){margin-top:8px}
.card.empty{padding:18px!important;text-align:center}.card.empty b{font-size:16px}
.fbq{margin-top:8px!important}
.ygtl{margin:14px 2px 6px;font-size:15px;font-weight:800;display:flex;justify-content:space-between;align-items:center}
`;document.head.append(st);
const _fh=window.feedHome;
window.feedHome=function(){
  let h=_fh.apply(this,arguments);if(!cs())return h;
  /* app bar: replace the old title row */
  const a=h.indexOf('<div class="fbtop">');if(a<0)return h;const e=h.indexOf("</div>",a)+6;
  const me=cl.me||{name:cs().name},first=((me.name||cs().name||"").split(" ")[0]);
  const unread=cl.nunread?'<i class="nbadge">'+(cl.nunread>99?"99+":an(cl.nunread))+'</i>':"";
  const bar='<div class="ykbar"><div class="hi"><small>'+(typeof greet==="function"?greet():"أهلاً")+'</small><b>'+esc(first)+' 👋</b></div><button aria-label="بحث" onclick="openPage(\'search\')">🔎</button><button aria-label="الإشعارات" onclick="openPage(\'notif\')">🔔'+unread+'</button><button aria-label="الدردشة" onclick="go(\'chat\')">💬</button></div>';
  h=h.slice(0,a)+bar+h.slice(e);
  /* feed header: title + compact filter */
  const f1=h.indexOf('<details class="fbq"><summary>🔎');
  if(f1>=0){const f2=h.indexOf("</details>",f1)+10;let flt=h.slice(f1,f2).replace('<summary>🔎 تصفية المنشورات','<summary>🔎 تصفية');h=h.slice(0,f1)+'<div class="ykh"><b>آخر المنشورات</b>'+flt+'</div>'+h.slice(f2)}
  return h;
};
})();
