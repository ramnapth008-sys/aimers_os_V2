import { useAuth } from "@aimers/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { grantConsent, updatePrivacyPreferences } from "../settings/settings.service";
import type { ConsentWorkspace, PrivacyPreference } from "../settings/settings.types";
import type { LectureSession } from "../digital-activity/digital-activity.types";

export interface PwSnapshot {
  sessionId: string;
  measuredAt: string;
  startedAt: string;
  title: string;
  platform: string;
  videoLengthSeconds: number | null;
  elapsedSeconds: number;
  playSeconds: number;
  positionSeconds: number;
  pauses: number;
  rewinds: number;
  state: "PLAYING" | "PAUSED" | "STOPPED";
}
type BridgeAnswer = {kind:"AIMERS_LECTURE_SNAPSHOT_V1";snapshot:PwSnapshot|null};
const extensionId = import.meta.env.VITE_AIMERS_LECTURE_EXTENSION_ID as string | undefined;
const storageKey = (id:string) => "aimers:pw-account-sync:v1:"+id;
const getSyncPermissions = async (apiFetch: ReturnType<typeof useAuth>["apiFetch"]) => {
  const [consent, privacy] = await Promise.all([
    apiFetch<ConsentWorkspace>("/consent"), apiFetch<PrivacyPreference>("/privacy"),
  ]);
  return {consent,privacy};
};
type BridgeResult={connected:boolean;snapshot:PwSnapshot|null};
function receiveFromExtension():Promise<BridgeResult>{
  const missing:BridgeResult={connected:false,snapshot:null};
  if(!extensionId || !/^[a-p]{32}$/.test(extensionId))return Promise.resolve(missing);
  const runtime=(window as unknown as {chrome?:{runtime?:{sendMessage:(id:string,message:object,cb:(r?:BridgeAnswer)=>void)=>void;lastError?:{message?:string}}}}).chrome?.runtime;
  if(!runtime?.sendMessage)return Promise.resolve(missing);
  return new Promise(resolve=>{
    let resolved=false;
    const finish=(value:BridgeResult)=>{if(!resolved){resolved=true;resolve(value);}};
    const timeout=window.setTimeout(()=>finish(missing),1800);
    try{runtime.sendMessage(extensionId,{kind:"AIMERS_LECTURE_SNAPSHOT_V1"},answer=>{
      clearTimeout(timeout);
      if(runtime.lastError || answer?.kind!=="AIMERS_LECTURE_SNAPSHOT_V1")return finish(missing);
      const s=answer.snapshot;
      if(!s)return finish({connected:true,snapshot:null});
      if(!/^[A-Za-z0-9_-]{8,100}$/.test(s.sessionId)||s.platform!=="pw.live"||!Number.isFinite(Date.parse(s.measuredAt))||!Number.isFinite(Date.parse(s.startedAt)))return finish({connected:true,snapshot:null});
      const values=[s.elapsedSeconds,s.playSeconds,s.positionSeconds,s.pauses,s.rewinds];
      if(values.some(v=>!Number.isFinite(v)||v<0))return finish({connected:true,snapshot:null});
      return finish({connected:true,snapshot:s});
    });}catch{clearTimeout(timeout);finish(missing);}
  });
}
export function usePwLectureSync(){
  const {apiFetch,user,status}=useAuth();
  const userId=user?.id??null;
  const [enabled,setEnabled]=useState(false);
  const [busy,setBusy]=useState(false);
  const [reviewed,setReviewed]=useState(false);
  const [state,setState]=useState("Not connected");
  const [live,setLive]=useState<PwSnapshot|null>(null);
  const [saved,setSaved]=useState<LectureSession|null>(null);
  const [savedAt,setSavedAt]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [isUploader,setUploader]=useState(false);
  const identityRef=useRef(userId);
  identityRef.current=userId;
  const savedRequestRef=useRef(0);
  const ack=useRef("");
  const apiRef=useRef(apiFetch);
  apiRef.current=apiFetch;

  const loadSaved=useCallback(async()=>{
    if(!userId || status!=="authenticated")return;
    const requestId=++savedRequestRef.current;
    try{const sessions=await apiFetch<LectureSession[]>("/activity/lectures");
      if(identityRef.current!==userId || savedRequestRef.current!==requestId)return;
      setSaved(sessions.find(x=>x.platformName==="pw.live" && x.externalLectureId?.startsWith("aimers-pw:"))??null);
    }catch{ /* Latest live data remains visible on temporary network failures. */ }
  },[apiFetch,userId,status]);

  useEffect(()=>{
    savedRequestRef.current++;
    ack.current="";
    setLive(null);setSaved(null);setSavedAt(null);setError("");setReviewed(false);
    setEnabled(Boolean(userId && Number(localStorage.getItem(storageKey(userId)))>0));
    void loadSaved();
  },[userId,loadSaved]);

  const connect=useCallback(async()=>{
    if(!userId || status!=="authenticated" || !reviewed)return;
    setBusy(true);setError("");setState("Checking extension and account permissions…");
    try{
      if(!extensionId || !/^[a-p]{32}$/.test(extensionId))throw Error("Configure the installed Chrome extension ID in VITE_AIMERS_LECTURE_EXTENSION_ID first.");
      const extension=await receiveFromExtension();
      if(!extension.connected)throw Error("AIMERS cannot reach this Chrome extension. Check the extension ID, reload it, and open localhost:5183 in the same browser.");
      const settings=await getSyncPermissions(apiFetch);
      if(identityRef.current!==userId)return;
      for(const scope of ["CROSS_DEVICE_SYNC","DIGITAL_ACTIVITY_MONITORING","LECTURE_PROGRESS"] as const){
        if(identityRef.current!==userId)return;
        const active=settings.consent.grants.some(grant=>grant.scope===scope && grant.status==="ACTIVE" && !grant.revokedAt && (!grant.expiresAt || Date.parse(grant.expiresAt)>Date.now()));
        if(!active)await grantConsent(apiFetch,scope);
      }
      if(identityRef.current!==userId)return;
      await updatePrivacyPreferences(apiFetch,{monitoringEnabled:true,crossDeviceSync:true});
      if(identityRef.current!==userId)return;
      localStorage.setItem(storageKey(userId),String(Date.now()));
      setEnabled(true);setState("Connected · waiting for a PW lecture");
    }catch(e){const message=e instanceof Error?e.message:"Unable to enable PW account sync.";setError(message);setState("Connection failed: "+message);}
    finally{setBusy(false);}
  },[apiFetch,userId,status,reviewed]);
  const disconnect=useCallback(()=>{
    if(userId)localStorage.removeItem(storageKey(userId));
    setEnabled(false);setLive(null);setState("Disconnected");
  },[userId]);

  useEffect(()=>{
    if(!enabled || !userId || status!=="authenticated")return;
    let cancelled=false;
    let release:()=>void=()=>{};
    let timer:number|undefined;
    let inFlight=false;
    let lastSave=0;
    let lastConsentCheck=0;
    let authorized=false;
    let lastSession="";
    const controller=new AbortController();
    const poll=async()=>{
      if(cancelled||inFlight)return;
      inFlight=true;
      try{
        const now=Date.now();
        if(now-lastConsentCheck>7000){
          const settings=await getSyncPermissions(apiRef.current);
          if(cancelled)return;
          authorized=Boolean(settings.privacy.monitoringEnabled && settings.privacy.crossDeviceSync && !settings.privacy.pausedAt &&
            ["DIGITAL_ACTIVITY_MONITORING","LECTURE_PROGRESS","CROSS_DEVICE_SYNC"].every(scope=>settings.consent.grants.some(g=>g.scope===scope && g.status==="ACTIVE" && !g.revokedAt && (!g.expiresAt || Date.parse(g.expiresAt)>Date.now()))));
          lastConsentCheck=now;
          if(!authorized){setState("Monitoring disabled or consent revoked");setEnabled(false);localStorage.removeItem(storageKey(userId));return;}
        }
        const bridge=await receiveFromExtension();
        if(cancelled)return;
        if(!bridge.connected){setLive(null);setState("Extension unreachable · check Chrome extension ID and local site access");return;}
        const snapshot=bridge.snapshot;
        if(!snapshot){setLive(null);setState("Extension connected · waiting for a supported PW lecture");return;}
        const consentedSince=Number(localStorage.getItem(storageKey(userId)))||0;
        if(snapshot && (Date.parse(snapshot.startedAt)<consentedSince || Date.parse(snapshot.measuredAt)<consentedSince)){setLive(null);setState("Waiting for a new lecture after account connection");return;}
        if(!snapshot || now-Date.parse(snapshot.measuredAt)>10000){setLive(null);setState("Disconnected · waiting for a fresh lecture snapshot");return;}
        setLive(snapshot);
        if(!authorized)return;
        if(lastSession!==snapshot.sessionId){lastSession=snapshot.sessionId;ack.current="";lastSave=0;}
        const revision=snapshot.sessionId+":"+snapshot.measuredAt;
        if(revision===ack.current){setState(snapshot.state==="PAUSED"?"Paused · saved":"Live · saved to your account");return;}
        setState("Waiting to sync");
        if(Date.now()-lastSave<3500)return;
        lastSave=Date.now();
        const result=await apiRef.current<{success:boolean;lecture:LectureSession}>("/activity/lectures/progress",{
          method:"POST",signal:controller.signal,body:JSON.stringify({
            externalLectureId:"aimers-pw:"+snapshot.sessionId,
            platformName:"pw.live",lectureTitle:snapshot.title.slice(0,300),
            totalDurationSeconds:snapshot.videoLengthSeconds??undefined,
            watchedSeconds:Math.round(snapshot.playSeconds),
            playbackPositionSeconds:Math.round(snapshot.positionSeconds),
            elapsedSeconds:Math.round(snapshot.elapsedSeconds),
            pauseCount:Math.round(snapshot.pauses),rewindCount:Math.round(snapshot.rewinds),
            collectorSessionId:snapshot.sessionId,trackingState:snapshot.state,
            confidence:"OBSERVED",startedAt:snapshot.startedAt,lastProgressAt:snapshot.measuredAt
          })
        });
        if(cancelled)return;
        ack.current=revision;setSaved(result.lecture);setSavedAt(new Date().toISOString());setError("");
        setState(snapshot.state==="PAUSED"?"Paused · saved to your account":"Live · saved to your account");
      }catch(e){
        if(cancelled)return;
        const message=e instanceof Error?e.message:"Unable to sync";
        setError(message);setState("Waiting to sync · "+message);
        if(/consent|monitoring|forbidden|403|privacy/i.test(message)){setEnabled(false);localStorage.removeItem(storageKey(userId));}
      }finally{inFlight=false;}
    };
    // Hold the tab-level exclusive lock for the entire upload session.
    if(!navigator.locks){setState("This browser does not support safe multi-tab syncing");return;}
    void navigator.locks.request("aimers-pw-sync:"+userId,{mode:"exclusive",ifAvailable:true},async lock=>{
      if(!lock || cancelled){setUploader(false);return;}
      setUploader(true);
      timer=window.setInterval(()=>{void poll();},2000);
      void poll();
      await new Promise<void>(resolve=>{release=()=>resolve();});
      if(timer!==undefined)clearInterval(timer);
      setUploader(false);
    });
    return ()=>{cancelled=true;controller.abort();release();if(timer!==undefined)clearInterval(timer);setUploader(false);};
  },[enabled,userId,status,loadSaved]);

  // Every authenticated dashboard reads account data, even when this device isn't uploading.
  useEffect(()=>{
    if(!userId || status!=="authenticated")return;
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible")void loadSaved();
    },8000);
    const onFocus=()=>{void loadSaved();};
    window.addEventListener("focus",onFocus);
    return ()=>{clearInterval(timer);window.removeEventListener("focus",onFocus);};
  },[userId,status,loadSaved]);

  return {enabled,busy,reviewed,setReviewed,state,live,saved,savedAt,error,isUploader,connect,disconnect,configured:Boolean(extensionId && /^[a-p]{32}$/.test(extensionId)),loadSaved};
}
