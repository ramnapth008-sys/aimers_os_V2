// Read-only bridge to the local development dashboard. Never accept credentials or writes.
chrome.runtime.onMessageExternal.addListener((message,sender,sendResponse)=>{
  const source=sender.url;
  if(source!=="http://localhost:5183/" && !/^http:\/\/localhost:5183\/(?:[^?#]*)?(?:[?#].*)?$/.test(source||""))return false;
  if(sender.frameId!==undefined && sender.frameId!==0)return false;
  if(!message || Object.keys(message).length!==1 || message.kind!=="AIMERS_LECTURE_SNAPSHOT_V1")return false;
  chrome.storage.local.get("aimersLectureSummary").then(({aimersLectureSummary:s})=>{
    const snap=s && typeof s.sessionId==="string" && typeof s.measuredAt==="string" ? {
      sessionId:s.sessionId, measuredAt:s.measuredAt, startedAt:s.startedAt,
      title:s.title, platform:s.platform, videoLengthSeconds:s.videoLengthSeconds,
      elapsedSeconds:s.elapsedSeconds, playSeconds:s.playSeconds,
      positionSeconds:s.positionSeconds, pauses:s.pauses, rewinds:s.rewinds,
      state:s.state
    }:null;
    sendResponse({kind:"AIMERS_LECTURE_SNAPSHOT_V1",snapshot:snap});
  }).catch(()=>sendResponse({kind:"AIMERS_LECTURE_SNAPSHOT_V1",snapshot:null}));
  return true;
});