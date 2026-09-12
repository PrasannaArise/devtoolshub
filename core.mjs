export function encode64(text) { return btoa(Array.from(new TextEncoder().encode(text), b=>String.fromCharCode(b)).join('')); }
export function decode64(text) { const clean=text.replace(/\s/g,''); if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=?)?$/.test(clean)) throw Error('Invalid Base64 text.'); return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(clean),c=>c.charCodeAt(0))); }
function jwtPart(value) { return JSON.parse(decode64(value.replace(/-/g,'+').replace(/_/g,'/'))); }
export function cronRuns(expression, now=new Date()) {
 const fields=expression.trim().split(/\s+/); if(fields.length!==5) throw Error('Use exactly five cron fields.');
 const bounds=[[0,59],[0,23],[1,31],[1,12],[0,7]];
 const sets=fields.map((field,index)=> { const [min,max]=bounds[index], values=new Set();
  for(const part of field.split(',')) { if(!/^(?:\*|\d+(?:-\d+)?)(?:\/\d+)?$/.test(part)) throw Error('Unsupported cron field: '+field);
   const [range,stepText]=part.split('/'),step=stepText===undefined?1:Number(stepText); if(step<1||step>max-min+1) throw Error('Invalid cron step.');
   const limits=range==='*'?[min,max]:range.split('-').map(Number); let [a,b]=limits; if(b===undefined)b=stepText===undefined?a:max;
   if(a<min||b>max||a>b)throw Error('Cron value outside the allowed range.');
   for(let n=a;n<=b;n+=step) values.add(index===4&&n===7?0:n);
  } return values;
 });
 const result=[],d=new Date(now); d.setUTCSeconds(0,0);d.setUTCMinutes(d.getUTCMinutes()+1);
 for(let n=0;n<366*24*60*5&&result.length<5;n++,d.setUTCMinutes(d.getUTCMinutes()+1)) {
  const dom=sets[2].has(d.getUTCDate()),dow=sets[4].has(d.getUTCDay());
  const day=fields[2].startsWith('*')||fields[4].startsWith('*')?dom&&dow:dom||dow;
  if(sets[0].has(d.getUTCMinutes())&&sets[1].has(d.getUTCHours())&&sets[3].has(d.getUTCMonth()+1)&&day)result.push(d.toISOString());
 } if(!result.length)throw Error('No runs found in the next five years.'); return result;
}
export function formatSQL(input) {
 const tokens=input.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\[(?:\]\]|[^\]])*\]|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|\s+|[A-Za-z_][\w$]*|./g)||[];
 let out='',depth=0;
 const clauses=new Set(['SELECT','FROM','WHERE','HAVING','LIMIT','OFFSET','VALUES','SET','RETURNING','UNION']);
 const keywords=new Set([...clauses,'INSERT','INTO','UPDATE','DELETE','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','AS','ORDER','GROUP','BY','ASC','DESC','DISTINCT']);
 for(let i=0;i<tokens.length;i++){const t=tokens[i];if(/^\s+$/.test(t)){if(out&&!/\s$/.test(out))out+=' ';continue;}
  if(t.startsWith('--')){out=out.trimEnd()+'\n'+t.trimEnd()+'\n';continue;} if(t.startsWith('/*')){out+=t;continue;}
  const upper=t.toUpperCase(); if((clauses.has(upper)||['ORDER','GROUP','JOIN'].includes(upper))&&out.trim())out=out.trimEnd()+'\n'+'  '.repeat(depth);
  if(t==='(')depth++;if(t===')')depth=Math.max(0,depth-1);
  out+=keywords.has(upper)?upper:t; if(t===','&&depth===0)out=out.trimEnd()+'\n  ';
 }return out.trim();
}
export async function runTool(id,action,input,extra={}) {
 if(input.length>1000000)throw Error('Please use an input smaller than 1 million characters.');
 switch(id){
 case 'json': return JSON.stringify(JSON.parse(input),null,action==='Minify'?0:2);
 case 'base64':return action==='Encode'?encode64(input):decode64(input);
 case 'url':return action==='Encode'?encodeURIComponent(input):decodeURIComponent(input);
 case 'jwt': {const parts=input.trim().split('.');if(parts.length!==3||!parts.every(Boolean))throw Error('Expected three non-empty JWT parts separated by dots.');const header=jwtPart(parts[0]),payload=jwtPart(parts[1]);if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('JWT payload must be an object.');const exp=payload.exp;return JSON.stringify({warning:'Signature NOT verified',header,payload,expiration:typeof exp==='number'?(Date.now()/1000>=exp?'Expired':'Not expired'):'No numeric exp claim',expiresAt:typeof exp==='number'?new Date(exp*1000).toISOString():null},null,2);}
 case 'uuid':{const n=Number(input);if(!Number.isInteger(n)||n<1||n>100)throw Error('Choose a whole number from 1 to 100.');return Array.from({length:n},()=>crypto.randomUUID()).join('\n');}
 case 'timestamp':{let d;if(action==='Date to timestamp'){if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/i.test(input.trim()))throw Error('Use an ISO date with a time zone, such as 2023-11-14T22:13:20Z.');d=new Date(input);}else{if(!/^-?\d+(?:\.\d+)?$/.test(input.trim()))throw Error('Enter a numeric Unix timestamp.');d=new Date(Number(input)*(action==='Seconds to date'?1000:1));}if(!Number.isFinite(d.getTime()))throw Error('Invalid date or timestamp.');return 'UTC: '+d.toISOString()+'\nLocal: '+d.toString()+'\nSeconds: '+Math.floor(d.getTime()/1000)+'\nMilliseconds: '+d.getTime();}
 case 'cron':return cronRuns(input).join('\n');
 case 'regex':{if(!/^[dgimsuvy]*$/.test(extra.flags||''))throw Error('Unsupported JavaScript regex flags.');const re=new RegExp(extra.pattern,extra.flags||''),matches=[];let m;while((m=re.exec(input))&&matches.length<1000){matches.push({index:m.index,match:m[0],groups:m.slice(1)});if(!re.global&&!re.sticky)break;if(m[0]===''){const cp=input.codePointAt(re.lastIndex);re.lastIndex+=(re.unicode||re.unicodeSets)&&cp>65535?2:1;}}return JSON.stringify({matches,count:matches.length,limitReached:matches.length===1000},null,2);}
 case 'sql':return formatSQL(input);
 case 'hash':{if(!['SHA-256','SHA-384','SHA-512'].includes(action))throw Error('Unsupported hash algorithm.');const hash=await crypto.subtle.digest(action,new TextEncoder().encode(input));return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
 default:throw Error('Unknown tool.');}
}
