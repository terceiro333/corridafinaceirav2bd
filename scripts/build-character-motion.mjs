// Patch the motion source only, preserving the embedded asset, shirt hooks and adapters.
import fs from 'node:fs';import vm from 'node:vm';
const root=new URL('../',import.meta.url),p=new URL('js/gilbert-test.js',root),s=fs.readFileSync(p,'utf8'),motion=fs.readFileSync(new URL('js/character-motion.js',root),'utf8');
const start=s.indexOf('function createGilbertMotion('),match=s.slice(start).match(/\r?\n}\r?\n/);if(start<0||!match)throw Error('Motion section missing');
let result=s.slice(0,start)+motion.trimEnd()+'\n'+s.slice(start+match.index+match[0].length);
result=result.replace("motion.pose('slide',p,modelSpeed)","motion.pose('slide',1-sliding/2.72,modelSpeed,{runPhase:p})");
result=result.replace("motion.pose('slide',1-sliding/.72,modelSpeed,{runPhase:p})","motion.pose('slide',1-sliding/2.72,modelSpeed,{runPhase:p})");
result=result.replace('sliding,character})','sliding,character,slidePhase=1-sliding/2.72})');
result=result.replace("motion.pose('slide',1-sliding/2.72,modelSpeed,{runPhase:p})","motion.pose('slide',slidePhase,modelSpeed,{runPhase:p})");
new vm.Script(result);fs.writeFileSync(p,result);
