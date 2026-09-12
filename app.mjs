const $=id=>document.getElementById(id);
const tool=document.body.dataset.tool;
let worker,timer;
function cancel(){if(worker)worker.terminate();clearTimeout(timer);worker=null;document.querySelectorAll('[data-action]').forEach(b=>b.disabled=false);}
if(tool){
 const input=$('input'),output=$('output'),status=$('status');
 function execute(action){cancel();output.value='';status.textContent='Working…';status.className='status';document.querySelectorAll('[data-action]').forEach(b=>b.disabled=true);
 worker=new Worker('/worker.mjs',{type:'module'});timer=setTimeout(()=>{cancel();status.textContent='Stopped: operation took too long. Try a smaller input or simpler expression.';status.className='status error';},5000);
 worker.onmessage=({data})=>{cancel();if(data.error){status.textContent=data.error;status.className='status error';}else{output.value=data.result;status.textContent='Done. Result ready to copy.';}};
 worker.onerror=()=>{cancel();status.textContent='Unable to run this tool in this browser.';status.className='status error';};
 worker.postMessage({id:tool,action,input:input.value,extra:{pattern:$('pattern')?.value,flags:$('flags')?.value}});
 }
 document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>execute(b.dataset.action)));
 $('sample').addEventListener('click',()=>{cancel();input.value=JSON.parse($('sample').dataset.value);output.value='';status.textContent='Example loaded. Choose an action to run it.';});
 $('clear').addEventListener('click',()=>{cancel();input.value='';output.value='';status.textContent='Cleared.';input.focus();});
 $('copy').addEventListener('click',async()=>{if(!output.value){status.textContent='Run the tool to create a result first.';return;}try{await navigator.clipboard.writeText(output.value);status.textContent='Copied to clipboard.';}catch{output.focus();output.select();status.textContent='Select and copy the result using your keyboard.';}});
}
const search=$('search');if(search)search.addEventListener('input',()=>{let count=0;document.querySelectorAll('[data-card]').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(search.value.toLowerCase());if(!card.hidden)count++;});$('search-status').textContent=count+' tools found';});
