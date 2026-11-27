/* Free TURN relay (Metered Open Relay, free 500MB/month plan, hard stop at quota, no card). Used only when a direct P2P path fails. */
(function(){var u="522516c751034803f9838e51",c="swZwEumeO8PIl0pW",h="global.relay.metered.ca";
window.YOMAK_TURN=[{urls:"stun:stun.relay.metered.ca:80"},{urls:"turn:"+h+":80",username:u,credential:c},{urls:"turn:"+h+":80?transport=tcp",username:u,credential:c},{urls:"turn:"+h+":443",username:u,credential:c},{urls:"turns:"+h+":443?transport=tcp",username:u,credential:c}];})();
