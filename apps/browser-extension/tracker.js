// AIMERS local-only lecture observer.
// Only injected after a student clicks "Start on this tab" in popup.
// Does not read browser history, page text, searches, messages, or passwords.
(async () => {
  if (globalThis.__aimersLecturePilot || !/^\/watch\/?$/.test(location.pathname)) return;
  // PW and other SPAs may create video tags after the page has loaded.
  // Inspect only this document, never cross-origin embedded content.
  const findPlayer = () => [...document.querySelectorAll("video")]
    .find(v => v instanceof HTMLVideoElement && (v.currentSrc || v.readyState > 0 || v.duration > 0))
    || document.querySelector("video");
  let player = findPlayer();
  if (!player) {
    player = await new Promise(resolve => {
      const observer = new MutationObserver(() => {
        const found = findPlayer();
        if (found) { observer.disconnect(); clearTimeout(timeout); resolve(found); }
      });
      observer.observe(document.documentElement, {childList:true, subtree:true});
      const timeout = setTimeout(() => { observer.disconnect(); resolve(null); }, 20000);
    });
  }
  if (!player) return;
  if (globalThis.__aimersLecturePilot) return;
  const started = Date.now();
  const sessionId = crypto.randomUUID();
  const info = {
    sessionId, measuredAt: new Date(started).toISOString(), state: player.paused ? "PAUSED" : "PLAYING",
    title: document.title.slice(0,180),
    platform: location.hostname,
    videoLengthSeconds: Number.isFinite(player.duration) ? Math.round(player.duration) : null,
    elapsedSeconds:0, playSeconds:0, positionSeconds:Math.round(player.currentTime || 0),
    pauses:0, rewinds:0, startedAt:new Date(started).toISOString(), active:true
  };
  let lastPosition = player.currentTime || 0;
  let priorSeekPosition = null;
  let playedOnce = !player.paused;
  let lastTick = performance.now();
  let lastSaved = 0;
  let disposed = false;
  const save = () => { info.measuredAt = new Date().toISOString(); return chrome.storage.local.set({aimersLectureSummary:{...info}}).catch(() => {}); };
  const update = () => {
    if (disposed) return;
    const now = performance.now();
    const delta = Math.min(Math.max(0,(now-lastTick)/1000),5);
    lastTick = now;
    if (!player.paused && !player.ended) info.playSeconds += delta;
    info.state = player.ended ? "STOPPED" : player.paused ? "PAUSED" : "PLAYING";
    info.elapsedSeconds = Math.round((Date.now()-started)/1000);
    info.positionSeconds = Math.round(player.currentTime || 0);
    if (Number.isFinite(player.duration)) info.videoLengthSeconds=Math.round(player.duration);
    lastPosition = player.currentTime || 0;
    if(now-lastSaved>1000){lastSaved=now;void save();}
  };
  const onPlay=()=>{update();playedOnce=true;void save();};
  const onPause=()=>{update();if(playedOnce&&!player.ended)info.pauses++;void save();};
  const onSeeking=()=>{priorSeekPosition=lastPosition;};
  const onSeeked=()=>{update();if(priorSeekPosition!==null && player.currentTime < priorSeekPosition-2) info.rewinds++;priorSeekPosition=null;void save();};
  const onMeta=()=>{update();void save();};
  const onEnd=()=>{update();void save();};
  const dispose=()=>{
    if(disposed)return;
    update();disposed=true;info.active=false;info.state="STOPPED";clearInterval(timer);
    player.removeEventListener("play",onPlay);
    player.removeEventListener("pause",onPause);
    player.removeEventListener("seeking",onSeeking);
    player.removeEventListener("seeked",onSeeked);
    player.removeEventListener("loadedmetadata",onMeta);
    player.removeEventListener("ended",onEnd);
    chrome.runtime.onMessage.removeListener(receive);
    delete globalThis.__aimersLecturePilot;
    void save();
  };
  function receive(message,_sender,sendResponse){
    if(message?.kind==="AIMERS_STATUS"){update();sendResponse({...info});return false;}
    if(message?.kind==="AIMERS_STOP"){dispose();sendResponse({stopped:true});return false;}
    return false;
  }
  player.addEventListener("play",onPlay);
  player.addEventListener("pause",onPause);
  player.addEventListener("seeking",onSeeking);
  player.addEventListener("seeked",onSeeked);
  player.addEventListener("loadedmetadata",onMeta);
  player.addEventListener("ended",onEnd);
  chrome.runtime.onMessage.addListener(receive);
  const timer=setInterval(update,1000);
  globalThis.__aimersLecturePilot={stop:dispose};
  addEventListener("pagehide",dispose,{once:true});
  void save();
})();