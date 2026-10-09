/* PromptCompare interface: all data stays in this browser. */
(function(){
'use strict';
const core=window.PromptCompareLogic,$=id=>document.getElementById(id),KEY='promptcompare.runs.v1';
const form=$('run-form'),left=$('compare-left'),right=$('compare-right');let runs=[];
function notify(s,error=false){const x=$('status');x.textContent=s;x.hidden=false;x.classList.toggle('error',error);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(runs));}catch(e){notify('Storage unavailable. Export JSON to keep a backup.',true);}}
function id(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);}
function el(tag,s,cls){const e=document.createElement(tag);if(s!==undefined)e.textContent=s;if(cls)e.className=cls;return e;}
function date(v){return new Date(v).toLocaleDateString();}
function choices(){
 const l=left.value,r=right.value;
 for(const select of [left,right]){select.replaceChildren(new Option('Choose a run',''));runs.forEach(run=>select.add(new Option(run.title+' · '+(run.variant||'No variant')+' · '+date(run.createdAt),run.id)));}
 left.value=runs.some(x=>x.id===l)?l:runs[0]?.id||'';
 right.value=runs.some(x=>x.id===r)?r:runs.find(x=>x.id!==left.value)?.id||'';
}
function compare(){
 const target=$('comparison');target.replaceChildren();
 if(runs.length<2){target.append(el('p','Save at least two experiments or load the examples to compare them.','empty-message'));return;}
 if(left.value===right.value){target.append(el('p','Choose two different runs.','empty-message'));return;}
 for(const value of [left.value,right.value]){
 const run=runs.find(x=>x.id===value),card=el('article',undefined,'compare-card');if(!run)continue;
 card.append(el('h3',run.title+(run.variant?' · '+run.variant:'')),el('p',(run.model||'No model')+' · '+(run.score?run.score+'/5 stars':'Not rated'),'card-meta'));
 for(const [name,content] of [['Prompt',run.prompt],['AI response',run.response],['Notes',run.notes]]){card.append(el('h4',name),el('p',content||'—','content-text'));}
 target.append(card);
 }
}
function library(){
 $('run-count').textContent=String(runs.length);const list=$('run-list');list.replaceChildren();
 if(!runs.length){list.append(el('p','No experiments saved yet.','empty-message'));return;}
 runs.forEach(run=>{
 const card=el('article',undefined,'library-card');card.append(el('span',run.variant||'Unlabeled','variant-tag'),el('h3',run.title),el('p',(run.model||'No model')+' · '+date(run.createdAt),'card-meta'),el('p',run.prompt,'snippet'));
 const footer=el('div',undefined,'library-card-footer');footer.append(el('span',run.score?run.score+' / 5 stars':'Not rated','card-meta'));
 const buttons=el('div'),pick=el('button','Compare','mini-button'),del=el('button','Delete','mini-button delete');pick.type=del.type='button';
 pick.onclick=()=>{left.value=run.id;if(right.value===run.id||!right.value)right.value=runs.find(x=>x.id!==run.id)?.id||'';compare();$('compare-title').scrollIntoView({behavior:'smooth'});};
 del.onclick=()=>{if(!confirm('Delete “'+run.title+'”?'))return;runs=runs.filter(x=>x.id!==run.id);save();render();notify('Experiment deleted.');};
 buttons.append(pick,document.createTextNode(' · '),del);footer.append(buttons);card.append(footer);list.append(card);
 });
}
function render(){choices();compare();library();}
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 if(runs.length>=core.MAX_RUNS){notify('Maximum 300 saved runs. Export and remove runs first.',true);return;}
 const v=Object.fromEntries(new FormData(form)),run=core.normalizeRun({...v,id:id(),createdAt:new Date().toISOString()});
 if(!run){notify('Enter a title and prompt.',true);return;}runs.unshift(run);save();render();form.reset();notify('Saved “'+run.title+'”.');
});
left.onchange=right.onchange=compare;
$('sample-button').onclick=()=>{
 if(runs.some(x=>x.id.startsWith('sample-'))){notify('Examples already loaded.');return;}
 if(runs.length>core.MAX_RUNS-2){notify('Remove a run first.',true);return;}
 const now=new Date().toISOString();runs.unshift(...[
 {id:'sample-'+id(),title:'Explain an API error',variant:'A',model:'Example (illustrative)',prompt:'Explain HTTP 429 to a developer.',response:'HTTP 429 means too many requests. Try again later.',score:3,notes:'Could mention backoff.',createdAt:now},
 {id:'sample-'+id(),title:'Explain an API error',variant:'B',model:'Example (illustrative)',prompt:'Explain HTTP 429 with a concrete retry tip.',response:'429 means rate-limited. Check Retry-After and use exponential backoff with jitter.',score:5,notes:'Clear, practical advice.',createdAt:now}
 ].map(core.normalizeRun));save();render();notify('Loaded illustrative examples, not actual API responses.');
};
$('export-button').onclick=()=>{
 const blob=new Blob([core.exportJson(runs)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='promptcompare-export.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('JSON export started.');
};
$('import-input').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{if(file.size>core.MAX_IMPORT_BYTES)throw Error('File too large.');const data=core.importJson(await file.text());if(!confirm('Replace all current runs with imported runs?'))return;runs=data;save();render();notify('Imported '+runs.length+' runs.');}
 catch(err){notify(err.message,true);}finally{e.target.value='';}
};
$('clear-button').onclick=()=>{if(!runs.length)return;if(!confirm('Delete ALL saved runs? Export a backup first.'))return;runs=[];save();render();notify('Library cleared.');};
try{const raw=localStorage.getItem(KEY);if(raw)runs=JSON.parse(raw).map(core.normalizeRun).filter(Boolean).slice(0,core.MAX_RUNS);}catch(e){notify('Could not load local browser storage.',true);}
render();
})();