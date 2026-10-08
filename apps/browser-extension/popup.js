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
void refresh();
setInterval(()=>{void refresh();},1300);
