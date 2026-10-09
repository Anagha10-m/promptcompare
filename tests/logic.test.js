const test=require('node:test'),assert=require('node:assert/strict');const {normalizeRun,exportJson,importJson,MAX_RUNS}=require('../logic.js');
const sample={id:'sample-1',title:'Test',variant:'A',model:'Any model',prompt:'Explain HTTP 429',response:'Rate limiting',score:4,notes:'',createdAt:'2026-01-01T00:00:00.000Z'};
test('accepts valid runs',()=>assert.deepEqual(normalizeRun(sample),sample));
test('requires id, title and prompt',()=>{for(const field of ['id','title','prompt'])assert.equal(normalizeRun({...sample,[field]:''}),null)});
test('bounds text and scores',()=>{const x=normalizeRun({...sample,notes:'x'.repeat(4000),score:99});assert.equal(x.notes.length,2000);assert.equal(x.score,0)});
test('roundtrip export import',()=>assert.deepEqual(importJson(exportJson([sample])),[sample]));
test('rejects invalid JSON and format',()=>{assert.throws(()=>importJson('not json'),/valid JSON/);assert.throws(()=>importJson('{"runs":[]}'),/PromptCompare version 1/)});
test('rejects invalid rows, duplicates, oversize',()=>{assert.throws(()=>importJson(exportJson([{...sample,id:''}])),/missing/);assert.throws(()=>importJson(exportJson([sample,sample])),/duplicate/);assert.throws(()=>importJson(exportJson(Array.from({length:MAX_RUNS+1},(_,i)=>({...sample,id:String(i)})))),/too many/);assert.throws(()=>importJson(' '.repeat(2000001)),/too large/)});
