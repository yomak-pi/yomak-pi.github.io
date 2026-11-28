/* v83: admin hide-post and server-side admin delete log */
(function(){
  var _log=window.logAdmin;
  if(typeof _log==="function"){window.logAdmin=function(a,t,d){if(a==="delete_content"||a==="delete_group")return Promise.resolve();return _log.apply(this,arguments)}}
  window.repHide=async function(id){
    try{
      var r=(window.cl&&cl.rlist||[]).find(function(x){return Number(x.id)===Number(id)});
      if(!r||r.kind!=="post"||!/^[0-9a-f-]{36}$/i.test(r.target+""))return msg("هدف البلاغ غير صالح");
      if(!confirm("إخفاء المنشور عن الناس؟ (صاحبه والأدمن يشوفوه، وتقدر ترجعه)"))return;
      await sb("/rest/v1/rpc/admin_hide_post",{method:"POST",body:{pid:r.target,hide:true}});
      msg("تم إخفاء المنشور");
      await repClose(id,"done");
    }catch(e){msg((window.sbErr?sbErr(e):String(e)).slice(0,90))}
  };
})();
