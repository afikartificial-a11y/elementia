import { blake3 } from '@noble/hashes/blake3.js';
import fs from 'fs'; import path from 'path';
const root=new URL('./dist/public', import.meta.url).pathname; const m={}; const files={};
const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f); if(fs.statSync(p).isDirectory()) walk(p); else {const c=fs.readFileSync(p); const ext=path.extname(p).slice(1); const h=Buffer.from(blake3(Buffer.from(c.toString('base64')+ext))).toString('hex').slice(0,32); const rel='/'+path.relative(root,p); m[rel]={hash:h,size:c.length}; files[h]=rel;}}};
walk(root); fs.writeFileSync('/tmp/manifest.json',JSON.stringify(m)); fs.writeFileSync('/tmp/hash2file.json',JSON.stringify(files));
console.log(Object.keys(m).length, JSON.stringify(m).length);
