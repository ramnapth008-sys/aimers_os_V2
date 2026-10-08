import test from "node:test";
import assert from "node:assert/strict";
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DataConfidenceLevel } from "@aimers/database";
import { UpsertLectureProgressDto } from "./upsert-lecture-progress.dto";

const base={
 externalLectureId:"aimers-pw:session-abcd1234",platformName:"pw.live",
 lectureTitle:"Oxidation Number",totalDurationSeconds:6000,
 watchedSeconds:30,playbackPositionSeconds:45,
 collectorSessionId:"session-abcd1234",
 elapsedSeconds:50,pauseCount:2,rewindCount:1,
 trackingState:"PAUSED",
 confidence:DataConfidenceLevel.OBSERVED,
 startedAt:"2026-10-09T01:00:00.000Z",
 lastProgressAt:"2026-10-09T01:01:00.000Z"
};
async function errors(overrides:Record<string,unknown>){
 const model=plainToInstance(UpsertLectureProgressDto,{...base,...overrides});
 return validate(model);
}
test("a complete observed PW snapshot passes shape validation",async()=>{
 assert.equal((await errors({})).length,0);
});
test("rejects negative and oversized elapsed seconds",async()=>{
 assert.ok((await errors({elapsedSeconds:-1})).length>0);
 assert.ok((await errors({elapsedSeconds:999999999})).length>0);
});
test("rejects negative, fractional and excessively large pause/rewind counts",async()=>{
 for(const key of ["pauseCount","rewindCount"]){
   for(const invalid of [-1,0.25,999999999]){
     assert.ok((await errors({[key]:invalid})).length>0, key+" "+invalid);
   }
 }
});
test("rejects unknown playback states and malformed timestamps",async()=>{
 assert.ok((await errors({trackingState:"WATCHING"})).length>0);
 assert.ok((await errors({lastProgressAt:"yesterday"})).length>0);
});
test("rejects non-numeric playing time and invalid session identity types",async()=>{
 assert.ok((await errors({watchedSeconds:"nan"})).length>0);
 assert.ok((await errors({collectorSessionId:42})).length>0);
});
