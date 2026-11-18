import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),bundlePath=path.join(root,'js/gilbert-test.js');
const begin='/* BEGIN GILBERT SHOP MODEL */',end='/* END GILBERT SHOP MODEL */';
let bundle=fs.readFileSync(bundlePath,'utf8');
const from=bundle.indexOf(begin),to=bundle.indexOf(end);
if(from>=0){if(to<from)throw Error('Incomplete shop model block');bundle=bundle.slice(0,from)+bundle.slice(to+end.length+1)}
const close=bundle.lastIndexOf('})();');if(close<0)throw Error('Race bundle closure not found');
const source=fs.readFileSync(path.join(root,'js/gilbert-shop-model.js'),'utf8');
bundle=bundle.slice(0,close)+begin+'\n'+source+'\n'+end+'\n'+bundle.slice(close);
new vm.Script(bundle,{filename:'gilbert-test.js'});fs.writeFileSync(bundlePath,bundle);
console.log('Gilbert shop factory included; race implementation preserved.');
