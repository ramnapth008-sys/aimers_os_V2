import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory=dirname(fileURLToPath(import.meta.url));
const workerSource=readFileSync(join(directory,"background.js"),"utf8");
const payload={
 sessionId:"a-session-123",measuredAt:"2026-10-09T01:00:00.000Z",startedAt:"2026-10-09T00:59:00.000Z",
 title:"Physics Lecture",platform:"pw.live",videoLengthSeconds:120,elapsedSeconds:60,playSeconds:40,
 positionSeconds:28,pauses:3,rewinds:1,state:"PAUSED",secret:"should never leave extension storage"
};
function runWorker(stored=payload){
 let receive=null;
 const chrome={
   runtime:{onMessageExternal:{addListener(fn){receive=fn;}}},
   storage:{local:{get:async()=>({aimersLectureSummary:stored})}}
 };
 vm.runInNewContext(workerSource,{chrome});
 assert.equal(typeof receive,"function");
 return receive;
}
const request={kind:"AIMERS_LECTURE_SNAPSHOT_V1"};
const validSender={url:"http://localhost:5183/dashboard",frameId:0};
function send(listener, sender, message){
 return new Promise(resolve=>{
   let responded=false;
   const allowed=listener(message,sender,response=>{responded=true;resolve({allowed:true,response:JSON.parse(JSON.stringify(response))});});
   if(allowed===false)resolve({allowed:false,response:null});
   else setTimeout(()=>{if(!responded)resolve({allowed:!!allowed,response:null});},100);
 });
}

test("only the exact localhost:5183 top-level origin can query",async()=>{
 const listen=runWorker();
 for(const [sender,message] of [
   [{url:"http://localhost:5184/dashboard",frameId:0},request],
   [{url:"http://127.0.0.1:5183/dashboard",frameId:0},request],
   [{url:"https://evil.example",frameId:0},request],
   [{url:"http://localhost:5183/dashboard",frameId:1},request],
   [validSender,{kind:"READ_ALL_STORAGE"}],
   [validSender,{...request, extra:true}],
 ]){
   assert.equal((await send(listen,sender,message)).allowed,false);
 }
});
test("responds with a safe whitelist and no secret fields",async()=>{
 const reply=await send(runWorker(),validSender,request);
 assert.equal(reply.allowed,true);
 assert.equal(reply.response.kind,request.kind);
 assert.equal(reply.response.snapshot.sessionId,payload.sessionId);
 assert.equal(reply.response.snapshot.state,"PAUSED");
 assert.equal("secret" in reply.response.snapshot,false);
 assert.deepEqual(Object.keys(reply.response.snapshot).sort(),
  ["sessionId","measuredAt","startedAt","title","platform","videoLengthSeconds","elapsedSeconds","playSeconds","positionSeconds","pauses","rewinds","state"].sort());
});
test("no collector snapshot gives explicit null instead of an invented lecture",async()=>{
 const reply=await send(runWorker(null),validSender,request);
 assert.equal(reply.allowed,true);
 assert.equal(reply.response.snapshot,null);
});
