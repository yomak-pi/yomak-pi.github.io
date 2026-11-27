/* Item 2: invites. Remember who invited (?ref=), and add the app link to shared posts. */
(function(){
  try{
    var r=new URLSearchParams(location.search).get("ref");
    if(r&&/^[A-Za-z0-9-]{4,40}$/.test(r)&&!localStorage.getItem("yomak_ref"))localStorage.setItem("yomak_ref",r);
  }catch(e){}
  try{
    if(typeof sharePost==="function"){
      window.sharePost=sharePost=function(id){
        var t=allFeedPosts().find(function(x){return x.id===id});if(!t)return;
        var ref="";try{var s=cs();ref=s&&s.uid?"?ref="+String(s.uid).slice(0,8):""}catch(e){}
        var link="https://yomak-app.github.io/"+ref;
        var txt=(t.title?t.title+"\n":"")+(t.body||"")+(t.phone?"\n📞 +"+t.phone:"")+"\n— يومك YOMAK\n"+link;
        try{if(navigator.share)return void navigator.share({text:txt}).catch(function(){})}catch(e){}
        copyText(txt);
      };
    }
  }catch(e){console.warn("invite",e)}
})();
