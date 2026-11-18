import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),preview=path.join(root,'previews/personagem-feminina');
const gilbert=fs.readFileSync(path.join(root,'js/gilbert-test.js'),'utf8'),prefix=gilbert.slice(0,gilbert.indexOf('const MODEL_BASE64='));
let motion=fs.readFileSync(path.join(root,'js/character-motion.js'),'utf8').replace('pose(kind,t,speed);','pose(kind,t,speed,{externalJump:true});');
const source=prefix+'const MODEL_BASE64='+JSON.stringify(fs.readFileSync(path.join(preview,'assets/rain-sports-preview.glb')).toString('base64'))+';\n'+motion+'\n'+fs.readFileSync(path.join(root,'js/rain-runtime.js'),'utf8')+'\n})();';
new vm.Script(source);fs.writeFileSync(path.join(root,'js/rain-character.js'),source);console.log('Rain bundle built; Gilbert unchanged.');
