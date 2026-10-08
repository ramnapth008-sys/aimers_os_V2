const el=id=>document.getElementById(id);
const status=message=>{el("status").textContent=message;};
const pretty=n=> n==null||!Number.isFinite(n)?"—":Math.floor(Math.max(0,n)/60)+"m "+String(Math.round(Math.max(0,n)%60)).padStart(2,"0")+"s";
const fill=s=>{
  el("title").textContent=s?.title || "No lecture selected";
  el("length").textContent=pretty(s?.videoLengthSeconds);
  el("elapsed").textContent=pretty(s?.elapsedSeconds);
  el("watched").textContent=pretty(s?.playSeconds);
  el("pauses").textContent=s?.pauses ?? "—";
  el("rewinds").textContent=s?.rewinds ?? "—";
  el("position").textContent=pretty(s?.positionSeconds);
};
async function tab(){
  const [active]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!active?.id)throw Error("No active tab");
  return active;
}
async function message(active,kind){
  try{return await chrome.tabs.sendMessage(active.id,{kind});}catch{return null;}
}
async function refresh(){
  try{
    const active=await tab();
    const current=await message(active,"AIMERS_STATUS");
    if(current?.active){status("Tracking this tab only · Stop at any time");fill(current);el("stop").disabled=false;el("start").disabled=true;return;}
    el("stop").disabled=true;el("start").disabled=false;
    const saved=(await chrome.storage.local.get("aimersLectureSummary")).aimersLectureSummary;
    fill(saved);
    status(saved?"Not tracking · Previous local lecture summary":"Not tracking · Click Start on a lecture with a video");
  }catch(e){status(e.message);}
}
el("start").addEventListener("click",async()=>{
  try{
    const active=await tab();
    if(!/^https?:\/\//.test(active.url||""))throw Error("Open an ordinary webpage containing a video first");
    const existing=await message(active,"AIMERS_STATUS");
    if(!existing?.active){
      status("Looking for a lecture video in this page (up to 20 seconds)…");
      el("start").disabled=true;
      await chrome.scripting.executeScript({target:{tabId:active.id},files:["tracker.js"]});
    }
    const check=await message(active,"AIMERS_STATUS");
    if(!check?.active)throw Error("No video was exposed by this page. Open an actual lecture rather than pw.live homepage. Embedded or DRM players may be inaccessible.");
    fill(check);status("Tracking this tab only · Local data · No upload");el("stop").disabled=false;el("start").disabled=true;
  }catch(e){status(e.message);el("start").disabled=false;}
});
el("stop").addEventListener("click",async()=>{
  try{const active=await tab();await message(active,"AIMERS_STOP");await refresh();}catch(e){status(e.message);}
});
el("clear").addEventListener("click",async()=>{
  try{const active=await tab();await message(active,"AIMERS_STOP");await chrome.storage.local.remove("aimersLectureSummary");fill(null);status("Local lecture summary cleared");el("start").disabled=false;el("stop").disabled=true;}catch(e){status(e.message);}
});

const PW_ORIGINS=["https://pw.live/*"];
const PW_SCRIPT_ID="aimers-pw-video-optin";
const PW_MATCHES=["https://pw.live/watch*"];
async function siteState(){
  const approved=await chrome.permissions.contains({origins:PW_ORIGINS});
  const registered=(await chrome.scripting.getRegisteredContentScripts({ids:[PW_SCRIPT_ID]})).length>0;
  el("site-state").textContent=approved&&registered?"Enabled on pw.live. Reload the lecture, then check metrics.":approved?"PW site access granted, but content script not registered.":"PW access not granted. Click Enable on PW and approve the Chrome prompt.";
  el("enable").disabled=approved&&registered;
  el("disable").disabled=!approved&&!registered;
}
el("enable").addEventListener("click",async()=>{
  // A direct click triggers the browser's own site permission dialog.
  try{
    // Request only the actual lecture host, avoiding an unnecessary second host.\n    const granted=await chrome.permissions.request({origins:PW_ORIGINS});
    if(!granted){status("Chrome permission was not granted; no automatic tracking.");await siteState();return;}
    await chrome.scripting.unregisterContentScripts({ids:[PW_SCRIPT_ID]}).catch(()=>{});
    await chrome.scripting.registerContentScripts([{
      id:PW_SCRIPT_ID,matches:PW_MATCHES,js:["tracker.js"],
      runAt:"document_idle",persistAcrossSessions:true,allFrames:false
    }]);
    await chrome.storage.local.set({aimersPwAutoEnabled:true});
    status("PW access granted. Auto-detection registered; reload an open lecture. If metrics remain blank, the player may be embedded.");
    await siteState();
  }catch(error){status("Couldn't enable PW: "+error.message);await siteState();}
});
el("disable").addEventListener("click",async()=>{
  try{
    await chrome.scripting.unregisterContentScripts({ids:[PW_SCRIPT_ID]}).catch(()=>{});
    // End any current tracked lecture on authorized PW pages before revoking permission.
    const tabs=await chrome.tabs.query({url:PW_ORIGINS}).catch(()=>[]);
    await Promise.all(tabs.map(t=>t.id?chrome.tabs.sendMessage(t.id,{kind:"AIMERS_STOP"}).catch(()=>{}):Promise.resolve()));
    await chrome.storage.local.set({aimersPwAutoEnabled:false});
    await chrome.permissions.remove({origins:PW_ORIGINS});
    status("PW auto-tracking disabled. Existing local summary can be cleared separately.");
    await siteState();
  }catch(error){status("Couldn't disable PW: "+error.message);}
});

void siteState();
void refresh();
setInterval(()=>{void refresh();},1300);
