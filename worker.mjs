import {runTool} from './core.mjs';
self.onmessage=async({data})=>{try{self.postMessage({result:await runTool(data.id,data.action,data.input,data.extra)});}catch(error){self.postMessage({error:error.message});}};
