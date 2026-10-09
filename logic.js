/* PromptCompare: local-only, dependency-free data tools. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PromptCompareLogic=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_RUNS=300,MAX_IMPORT_BYTES=2000000;
const limits={title:100,variant:40,model:80,prompt:10000,response:30000,notes:2000};
function boundedString(v,n){return typeof v==='string'?v.trim().slice(0,n):'';}
function normalizeRun(v){
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const id=boundedString(v.id,100),title=boundedString(v.title,limits.title),prompt=boundedString(v.prompt,limits.prompt);
 if(!id||!title||!prompt)return null;
 const rating=Number(v.score),score=Number.isInteger(rating)&&rating>=0&&rating<=5?rating:0;
 const createdAt=typeof v.createdAt==='string'&&!Number.isNaN(Date.parse(v.createdAt))?new Date(v.createdAt).toISOString():new Date().toISOString();
 return {id,title,variant:boundedString(v.variant,limits.variant),model:boundedString(v.model,limits.model),prompt,response:boundedString(v.response,limits.response),score,notes:boundedString(v.notes,limits.notes),createdAt};
}
function exportJson(runs){return JSON.stringify({format:'promptcompare',version:1,exportedAt:new Date().toISOString(),runs},null,2);}
function importJson(text){
 if(typeof text!=='string'||text.length>MAX_IMPORT_BYTES)throw Error('File is too large. Maximum is 2 MB.');
 let p;try{p=JSON.parse(text)}catch(_){throw Error('This is not valid JSON.')}
 if(!p||p.format!=='promptcompare'||p.version!==1||!Array.isArray(p.runs))throw Error('Choose a PromptCompare version 1 JSON export.');
 if(p.runs.length>MAX_RUNS)throw Error('File has too many runs (maximum 300).');
 const runs=p.runs.map(normalizeRun);if(runs.some(v=>v===null))throw Error('One or more runs are missing a title, ID, or prompt.');
 if(new Set(runs.map(v=>v.id)).size!==runs.length)throw Error('Export contains duplicate run IDs.');
 return runs;
}
return {MAX_RUNS,MAX_IMPORT_BYTES,normalizeRun,exportJson,importJson};
});