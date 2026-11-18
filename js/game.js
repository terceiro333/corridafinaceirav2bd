/* Corrida Financeira — endless runner 3D sem backend */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!window.THREE) { $('loading').innerHTML='<p>Não foi possível carregar o motor 3D.<br>Verifique sua conexão e recarregue a página.</p>'; return; }
  const graphicsProfiles={
    normal:{
      cameraFar:260,fogNear:52,fogFar:185,shadowSize:1024,houseRatio:1.4,shopRatio:1.35,
      particles:8,lightPools:true
    },
    optimized:{
      cameraFar:168,fogNear:48,fogFar:145,shadowSize:512,houseRatio:.85,shopRatio:.85,
      worldRange:157,windRange:78,panelInterval:32,menuInterval:50,ratio:.75,maxRatio:.85,pixelBudget:1080000,
      particles:3,lightPools:true
    },
    'very-optimized':{
      cameraFar:128,fogNear:44,fogFar:104,shadowSize:0,houseRatio:.65,shopRatio:.65,
      worldRange:113,detailRange:58,windRange:39,panelInterval:48,menuInterval:83,ratio:.50,maxRatio:.60,pixelBudget:540000,
      particles:0,lightPools:false,simpleRoad:true,skipHiddenRunner:true
    }
  };
  const defaultGameSettings={musicVolume:1,sfxVolume:1,visualEffects:true,showFps:false,cursorTrail:true,graphicsMode:'normal'};
  let savedSettings={};
  try{savedSettings=JSON.parse(localStorage.getItem('corridaFinanceiraV2Settings')||'{}')||{}}catch(e){}
  const savedGraphicsMode=savedSettings.graphicsMode??(savedSettings.optimizedMode===true?'optimized':'normal');
  delete savedSettings.optimizedMode;
  let gameSettings={...defaultGameSettings,...savedSettings};
  gameSettings.graphicsMode=Object.hasOwn(graphicsProfiles,savedGraphicsMode)?savedGraphicsMode:defaultGameSettings.graphicsMode;
  gameSettings.musicVolume=Math.max(0,Math.min(1,Number(gameSettings.musicVolume)));
  gameSettings.sfxVolume=Math.max(0,Math.min(1,Number(gameSettings.sfxVolume)));
  let graphics=graphicsProfiles[gameSettings.graphicsMode];
  const music=$('music'),soundToggle=$('sound-toggle');let musicStarted=false;music.volume=gameSettings.musicVolume;music.muted=localStorage.getItem('corridaFinanceiraV2Muted')==='true';
  function updateSoundButton(){soundToggle.classList.toggle('muted',music.muted);$('sound-icon').textContent=music.muted?'×':'♪';$('sound-label').textContent=music.muted?'MUTADO':'MÚSICA';soundToggle.setAttribute('aria-label',music.muted?'Ativar música':'Mutar música');soundToggle.title=music.muted?'Ativar música':'Mutar música'}
  function startMusic(){if(!musicStarted&&!music.muted){musicStarted=true;music.play().catch(()=>{musicStarted=false})}}
  function toggleMusic(e){e.stopPropagation();music.muted=!music.muted;localStorage.setItem('corridaFinanceiraV2Muted',music.muted);if(!music.muted){musicStarted=true;music.play().catch(()=>{musicStarted=false})}updateSoundButton()}
  updateSoundButton();soundToggle.addEventListener('click',toggleMusic);addEventListener('pointerdown',startMusic,{once:true});addEventListener('keydown',startMusic,{once:true});
  function saveGameSettings(){localStorage.setItem('corridaFinanceiraV2Settings',JSON.stringify(gameSettings))}
  function updateSettingsUI(){$('graphics-mode').value=gameSettings.graphicsMode;music.volume=gameSettings.musicVolume;$('music-volume').value=Math.round(gameSettings.musicVolume*100);$('music-volume-value').textContent=`${Math.round(gameSettings.musicVolume*100)}%`;$('sfx-volume').value=Math.round(gameSettings.sfxVolume*100);$('sfx-volume-value').textContent=`${Math.round(gameSettings.sfxVolume*100)}%`;for(const [id,on] of [['visual-effects-toggle',gameSettings.visualEffects],['fps-toggle',gameSettings.showFps],['cursor-trail-toggle',gameSettings.cursorTrail]]){const button=$(id);button.classList.toggle('on',on);button.setAttribute('aria-pressed',String(on));button.querySelector('b').textContent=on?'ATIVADO':'DESATIVADO'}$('fps-counter').classList.toggle('hidden',!gameSettings.showFps)}
  function openSettings(){$('menu').classList.add('hidden');$('settings').classList.remove('hidden');updateSettingsUI()}
  function closeSettings(){closeProgressReset();$('settings').classList.add('hidden');$('menu').classList.remove('hidden')}
  $('open-settings').onclick=openSettings;$('close-settings').onclick=closeSettings;$('close-settings-top').onclick=closeSettings;$('music-volume').addEventListener('input',e=>{gameSettings.musicVolume=Number(e.target.value)/100;music.volume=gameSettings.musicVolume;$('music-volume-value').textContent=`${e.target.value}%`;saveGameSettings()});$('sfx-volume').addEventListener('input',e=>{gameSettings.sfxVolume=Number(e.target.value)/100;$('sfx-volume-value').textContent=`${e.target.value}%`;saveGameSettings()});$('visual-effects-toggle').onclick=()=>{gameSettings.visualEffects=!gameSettings.visualEffects;saveGameSettings();updateSettingsUI()};$('fps-toggle').onclick=()=>{gameSettings.showFps=!gameSettings.showFps;saveGameSettings();updateSettingsUI()};$('cursor-trail-toggle').onclick=()=>{gameSettings.cursorTrail=!gameSettings.cursorTrail;if(!gameSettings.cursorTrail){document.querySelectorAll('.cursor-trail').forEach(line=>line.remove());trailX=trailY=null}saveGameSettings();updateSettingsUI()};$('restore-settings').onclick=()=>{gameSettings={...defaultGameSettings};applyRenderQuality();saveGameSettings();updateSettingsUI()};
  $('graphics-mode').onchange=({target})=>{
    if(!Object.hasOwn(graphicsProfiles,target.value))return;
    gameSettings.graphicsMode=target.value;
    applyRenderQuality();
    saveGameSettings();
  };
  updateSettingsUI();
  const PROGRESS_PRESERVED_KEYS=new Set(['corridaFinanceiraV2Settings','corridaFinanceiraV2Muted','corridaFinanceiraV2Night']);
  function showResetStep(step){for(const id of ['reset-step-warning','reset-step-confirm','reset-step-success'])$(id).classList.toggle('hidden',id!==`reset-step-${step}`)}
  function openProgressReset(){$('reset-confirm-input').value='';$('confirm-progress-reset').disabled=true;showResetStep('warning');$('reset-progress-dialog').classList.remove('hidden')}
  function closeProgressReset(){$('reset-progress-dialog').classList.add('hidden');$('reset-confirm-input').value='';$('confirm-progress-reset').disabled=true}
  function resetAllProgress(){for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('corridaFinanceiraV2')&&!PROGRESS_PRESERVED_KEYS.has(key))localStorage.removeItem(key)}totalMoney=0;best=0;money=0;distance=0;ownedSkins=['default'];equippedSkin='default';betStats={totalBet:0,totalLost:0,count:0};houseLevel=1;houseSpent=0;selectedInvestment=null;pendingSkinPurchase=null;betInProgress=false;if(selectedCharacter!=='male')switchCharacter('male',false);selectedCharacter='male';previewCharacter='male';localStorage.setItem('corridaFinanceiraV2TotalMoney','0');localStorage.setItem('corridaFinanceiraV2Best','0');localStorage.setItem('corridaFinanceiraV2OwnedSkins','["default"]');localStorage.setItem('corridaFinanceiraV2EquippedSkin','default');localStorage.setItem('corridaFinanceiraV2SelectedCharacter','male');localStorage.setItem('corridaFinanceiraV2BetStats',JSON.stringify(betStats));localStorage.setItem('corridaFinanceiraV2HouseLevel','1');localStorage.setItem('corridaFinanceiraV2HouseSpent','0');applyPlayerSkin('default');$('best').textContent='0 m';$('money').textContent='R$ 0';$('distance').textContent='0 m';$('bet-value').value='';$('investment-value').value='';$('investment-form').classList.add('hidden');$('investment-result').classList.add('hidden');$('bet-result').classList.add('hidden');document.querySelectorAll('.investment-card').forEach(c=>c.classList.remove('selected'));updateBalances();renderShop();renderBetHistory();renderHouse();showResetStep('success')}
  $('open-progress-reset').onclick=openProgressReset;$('cancel-progress-reset').onclick=closeProgressReset;$('continue-progress-reset').onclick=()=>{showResetStep('confirm');setTimeout(()=>$('reset-confirm-input').focus(),50)};$('back-progress-reset').onclick=()=>showResetStep('warning');$('reset-confirm-input').addEventListener('input',e=>{$('confirm-progress-reset').disabled=e.target.value.trim().toUpperCase()!=='REDEFINIR'});$('confirm-progress-reset').onclick=resetAllProgress;$('finish-progress-reset').onclick=()=>{closeProgressReset();closeSettings()};
  let lastTrail=0,trailX=null,trailY=null;
  addEventListener('pointermove',e=>{if(!gameSettings.cursorTrail||e.pointerType==='touch'){trailX=trailY=null;return}if(trailX===null){trailX=e.clientX;trailY=e.clientY;return}if(performance.now()-lastTrail<16)return;lastTrail=performance.now();const dx=e.clientX-trailX,dy=e.clientY-trailY,length=Math.hypot(dx,dy);if(length>1&&length<120){const line=document.createElement('i');line.className='cursor-trail';line.style.left=`${(e.clientX+trailX)/2}px`;line.style.top=`${(e.clientY+trailY)/2}px`;line.style.width=`${length+4}px`;line.style.setProperty('--angle',`${Math.atan2(dy,dx)}rad`);$('game').appendChild(line);setTimeout(()=>line.remove(),590)}trailX=e.clientX;trailY=e.clientY});
  const DEV_CONSOLE_ENABLED=true,devCommands=new Map(),commandHistory=[];let commandHistoryIndex=0,commandDraft='',consolePreviousState='menu';
  function registerCommand(name,description,callback){devCommands.set(String(name).toLowerCase(),{description,callback})}
  function consolePrint(message,type='info'){const line=document.createElement('div');line.className=`console-line ${type}`;line.textContent=message;$('console-output').appendChild(line);while($('console-output').children.length>100)$('console-output').firstChild.remove();$('console-output').scrollTop=$('console-output').scrollHeight}
  function isConsoleYShortcut(e){return e.key.toLowerCase()==='y'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.isComposing}
  function toggleDevConsole(force){if(!DEV_CONSOLE_ENABLED)return;const consoleEl=$('dev-console'),opening=force===undefined?consoleEl.classList.contains('hidden'):force;if(opening){consolePreviousState=state;state='console';consoleEl.classList.remove('hidden');$('pause-button').classList.add('hidden');setTimeout(()=>$('console-input').focus(),0)}else{consoleEl.classList.add('hidden');state=consolePreviousState;if(state==='playing')$('pause-button').classList.remove('hidden');$('console-input').blur()}}
  function executeDevCommand(raw){const text=raw.trim();if(!text)return;commandHistory.push(text);if(commandHistory.length>50)commandHistory.shift();commandHistoryIndex=commandHistory.length;commandDraft='';consolePrint(`> ${text}`,'command');const [name,...args]=text.split(/\s+/),command=devCommands.get(name.toLowerCase());if(!command){consolePrint(`[ERRO] Comando "${name}" não encontrado.`,'error');return}try{command.callback(args)}catch(error){consolePrint('[ERRO] Não foi possível executar o comando.','error')}}
  registerCommand('givedinheiro','adiciona dinheiro ao jogador',args=>{const raw=args[0],amount=raw&&/^\d+(?:\.\d{1,2})?$/.test(raw)?Number(raw):NaN;if(args.length!==1||!Number.isFinite(amount)||amount<=0||amount>1000000){consolePrint('[ERRO] Uso correto: givedinheiro <quantidade> (máximo R$ 1.000.000)','error');return}totalMoney=Math.round((totalMoney+amount)*100)/100;saveBalance();consolePrint(`[SUCESSO] ${formatMoney(amount)} adicionados ao saldo. Saldo atual: ${formatMoney(totalMoney)}.`,'success')});
  registerCommand('removedinheiro','remove dinheiro do jogador',args=>{const raw=args[0],amount=raw&&/^\d+(?:\.\d{1,2})?$/.test(raw)?Number(raw):NaN;if(args.length!==1||!Number.isFinite(amount)||amount<=0||amount>1000000){consolePrint('[ERRO] Uso correto: removedinheiro <quantidade> (máximo R$ 1.000.000)','error');return}if(amount>totalMoney){consolePrint(`[ERRO] Saldo insuficiente. Saldo atual: ${formatMoney(totalMoney)}.`,'error');return}totalMoney=Math.round((totalMoney-amount)*100)/100;saveBalance();consolePrint(`[SUCESSO] ${formatMoney(amount)} removidos do saldo. Saldo atual: ${formatMoney(totalMoney)}.`,'success')});
  window.registerDevCommand=registerCommand;
  $('console-input').addEventListener('keydown',e=>{e.stopPropagation();if(isConsoleYShortcut(e)&&!e.target.value.trim()){e.preventDefault();if(!e.repeat)toggleDevConsole(false);return}if(e.key==='F8'||e.key==='Escape'){e.preventDefault();toggleDevConsole(false);return}if(e.key==='Enter'){e.preventDefault();executeDevCommand(e.target.value);e.target.value='';return}if(e.key==='ArrowUp'){e.preventDefault();if(commandHistoryIndex===commandHistory.length)commandDraft=e.target.value;if(commandHistoryIndex>0)commandHistoryIndex--;e.target.value=commandHistory[commandHistoryIndex]||'';requestAnimationFrame(()=>e.target.setSelectionRange(e.target.value.length,e.target.value.length))}else if(e.key==='ArrowDown'){e.preventDefault();if(commandHistoryIndex<commandHistory.length)commandHistoryIndex++;e.target.value=commandHistoryIndex===commandHistory.length?commandDraft:commandHistory[commandHistoryIndex]||''}});
  if(DEV_CONSOLE_ENABLED)consolePrint('[INFO] Console de desenvolvedor iniciado.','info');

  const canvas=$('scene'), renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.04;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x7cc9e8); scene.fog=new THREE.Fog(0x70b7cf,52,185);
  const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,260); camera.position.set(0,6.35,11.25);
  const hemisphere=new THREE.HemisphereLight(0xdff8ff,0x2e4d3b,2.3);scene.add(hemisphere);const sun=new THREE.DirectionalLight(0xfff2c2,2.4); sun.position.set(-18,28,15); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-22; sun.shadow.camera.right=22; sun.shadow.camera.top=25; sun.shadow.camera.bottom=-8; scene.add(sun);
  let nightMode=localStorage.getItem('corridaFinanceiraV2Night')==='true';
  const nightFill=new THREE.DirectionalLight(0xffe4c0,0),nightFillTarget=new THREE.Object3D();nightFill.position.set(-3,7,12);nightFill.target=nightFillTarget;nightFill.castShadow=false;scene.add(nightFill,nightFillTarget);
  let updateNightMaterials=null,renderDirty=true;
  function applyTimeMode(){renderDirty=true;const night=nightMode;scene.background.setHex(night?0x061321:0x7cc9e8);scene.fog.color.setHex(night?0x142d40:0x70b7cf);hemisphere.color.setHex(night?0xa3bddd:0xdff8ff);hemisphere.groundColor.setHex(night?0x465366:0x2e4d3b);hemisphere.intensity=night?1.85:2.3;sun.color.setHex(night?0xb9d2ed:0xfff2c2);sun.intensity=night?1.15:2.4;renderer.toneMappingExposure=night?1.06:1;nightFill.intensity=night?.95:0;if(updateNightMaterials)updateNightMaterials();$('time-toggle').classList.toggle('night',night);$('time-icon').textContent=night?'☾':'☀';$('time-label').textContent=night?'NOITE':'DIA';$('time-toggle').setAttribute('aria-label',night?'Ativar modo diurno':'Ativar modo noturno');$('time-toggle').title=night?'Ativar modo diurno':'Ativar modo noturno'}
  $('time-toggle').onclick=()=>{nightMode=!nightMode;localStorage.setItem('corridaFinanceiraV2Night',nightMode);applyTimeMode()};applyTimeMode();

  const MAT={road:new THREE.MeshStandardMaterial({color:0x1d2a31,roughness:.96,metalness:.035}),line:new THREE.MeshStandardMaterial({color:0xe8f1df,emissive:0x243226,emissiveIntensity:.16,roughness:.52}),sidewalk:new THREE.MeshStandardMaterial({color:0x9ba6a4,roughness:.86}),curb:new THREE.MeshStandardMaterial({color:0xd4d2c5,roughness:.74}),green:new THREE.MeshStandardMaterial({color:0x21bd75}),gold:new THREE.MeshStandardMaterial({color:0xffd447,emissive:0x5d4100,metalness:.35,roughness:.25}),red:new THREE.MeshStandardMaterial({color:0xef4860}),orange:new THREE.MeshStandardMaterial({color:0xff922f}),dark:new THREE.MeshStandardMaterial({color:0x102635,roughness:.67,metalness:.18}),skin:new THREE.MeshStandardMaterial({color:0xb96f4b}),shirt:new THREE.MeshStandardMaterial({color:0x29d98b}),pants:new THREE.MeshStandardMaterial({color:0x17314d}),white:new THREE.MeshStandardMaterial({color:0xf2f6ed}),trunk:new THREE.MeshStandardMaterial({color:0x6b4935}),leaf:new THREE.MeshStandardMaterial({color:0x1a9b67}),paint:new THREE.MeshStandardMaterial({color:0xe9ba4b,roughness:.68,metalness:.1})};
  const boxGeometries=new Map();
  function boxGeometry(w,h,d){
    const key=w+'|'+h+'|'+d;
    if(!boxGeometries.has(key))boxGeometries.set(key,new THREE.BoxGeometry(w,h,d));
    return boxGeometries.get(key);
  }
  const box=(w,h,d,mat,x=0,y=h/2,z=0)=>{const m=new THREE.Mesh(boxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m};
  let simpleRoadMaterial;
  const world=new THREE.Group(), scenery=[],trees=[]; scene.add(world); const road=box(15,.25,360,MAT.road,0,-.16,-140); road.receiveShadow=true; world.add(road);
  for(const x of [-2.5,2.5]) for(let z=15;z>-320;z-=10){const stripe=box(.12,.03,5,MAT.line,x,.01,z);stripe.userData.loopLength=340;world.add(stripe);scenery.push(stripe)}
  world.add(box(3,.35,360,MAT.sidewalk,-9,.02,-140),box(3,.35,360,MAT.sidewalk,9,.02,-140),box(.28,.28,360,MAT.curb,-7.63,.02,-140),box(.28,.28,360,MAT.curb,7.63,.02,-140));
  for(let z=14;z>-320;z-=12){for(const x of [-6.95,6.95]){const edge=box(.42,.018,4.8,MAT.paint,x,.022,z);edge.castShadow=false;world.add(edge);scenery.push(edge)}if(z%24===2){for(const x of [-9.75,9.75]){const tile=box(1.65,.022,.08,MAT.curb,x,.205,z);tile.castShadow=false;world.add(tile);scenery.push(tile)}}}

  const CITY_MAT={
    facades:[0x284d60,0x5b5960,0x82634f,0x3d5960,0x6f5149,0x4a566a].map(color=>new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.025})),
    concrete:new THREE.MeshStandardMaterial({color:0xa9adb0,roughness:.9}),brick:new THREE.MeshStandardMaterial({color:0x7d493b,roughness:1}),trim:new THREE.MeshStandardMaterial({color:0x182a32,roughness:.65}),
    glass:[new THREE.MeshStandardMaterial({color:0x78bbcf,emissive:0x183442,emissiveIntensity:.28,roughness:.18,metalness:.3}),new THREE.MeshStandardMaterial({color:0xf0c66e,emissive:0xa66019,emissiveIntensity:.75,roughness:.3,metalness:.1}),new THREE.MeshStandardMaterial({color:0x34596a,roughness:.22,metalness:.35})],
    door:new THREE.MeshStandardMaterial({color:0x26363b,roughness:.48,metalness:.28}),metal:new THREE.MeshStandardMaterial({color:0x68777b,roughness:.42,metalness:.55}),awning:[0xb94045,0xd39a3b,0x287b72].map(color=>new THREE.MeshStandardMaterial({color,roughness:.7})),sign:new THREE.MeshStandardMaterial({color:0xe9d58b,emissive:0x6e4d13,emissiveIntensity:.4,roughness:.55})
  };
  const cityPart=box;
  function batchBuilding(building){
    // Group identical opaque parts inside each lot, preserving every transform and material.
    const groups=new Map();
    for(const part of building.children){
      const key=part.geometry.id+'|'+part.material.id+'|'+part.castShadow+'|'+part.receiveShadow;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(part);
    }
    for(const parts of groups.values()){
      if(parts.length<2)continue;
      const first=parts[0],batch=new THREE.InstancedMesh(first.geometry,first.material,parts.length);
      batch.castShadow=first.castShadow;
      batch.receiveShadow=first.receiveShadow;
      parts.forEach((part,index)=>{
        part.updateMatrix();
        batch.setMatrixAt(index,part.matrix);
      });
      batch.computeBoundingSphere();
      building.remove(...parts);
      building.add(batch);
    }
  }
  function building(x,z,i,register=true){
    const g=new THREE.Group(),h=7+(i*7%18),w=5+(i%3),style=i%6,front=3.52;
    g.add(cityPart(w,h,7,CITY_MAT.facades[style],0,h/2,0));
    if(style===2||style===4){for(let y=1.25;y<h;y+=.72)g.add(cityPart(w+.03,.055,.08,CITY_MAT.brick,0,y,front+.015))}
    else for(let y=3.45;y<h-1;y+=3)g.add(cityPart(w+.05,.09,.11,CITY_MAT.concrete,0,y,front+.02));
    for(let y=2;y<h-1;y+=3)for(let xx=-w/2+1;xx<w/2;xx+=1.7){
      const lit=(i+Math.round(y)+Math.round(xx*2))%5===0,glass=CITY_MAT.glass[lit?1:(style+i)%2?0:2];
      g.add(cityPart(.82,1.02,.08,CITY_MAT.trim,xx,y,front+.045));
      const pane=cityPart(.64,.82,.055,glass,xx,y,front+.095);pane.castShadow=false;g.add(pane);
      g.add(cityPart(.045,.82,.04,CITY_MAT.metal,xx,y,front+.13));
      if((i+Math.round(xx*10)+Math.round(y))%7===0){g.add(cityPart(.58,.08,.16,CITY_MAT.metal,xx,y-.62,front+.12),cityPart(.42,.28,.2,CITY_MAT.metal,xx,y-.79,front+.15))}
    }
    const entranceX=style%2?Math.max(-w/2+.72,0):Math.min(w/2-.72,0);
    g.add(cityPart(1.18,2.05,.12,CITY_MAT.trim,entranceX,1.04,front+.05),cityPart(.88,1.8,.08,CITY_MAT.door,entranceX,.92,front+.13));
    if(style===0||style===3){
      const shopX=entranceX===0?-w*.25:w*.25;g.add(cityPart(Math.max(1.65,w*.42),1.45,.1,CITY_MAT.trim,shopX,.85,front+.06));
      const shopGlass=cityPart(Math.max(1.4,w*.36),1.14,.055,CITY_MAT.glass[0],shopX,.86,front+.13);shopGlass.castShadow=false;g.add(shopGlass);
      g.add(cityPart(Math.max(1.8,w*.46),.18,.72,CITY_MAT.awning[i%3],shopX,1.68,front+.33),cityPart(Math.max(1.25,w*.32),.32,.08,CITY_MAT.sign,shopX,2.08,front+.12));
    }else if(style===1||style===5){
      g.add(cityPart(w*.62,.16,.55,CITY_MAT.metal,0,3.65,front+.28),cityPart(w*.62,.07,.12,CITY_MAT.metal,0,3.12,front+.24));
      for(let bx=-w*.26;bx<=w*.26;bx+=w*.52)g.add(cityPart(.055,.55,.055,CITY_MAT.metal,bx,3.38,front+.45));
    }
    g.add(cityPart(w+.12,.28,7.12,CITY_MAT.concrete,0,h+.14,0));
    // Volumes e sombras rasas quebram a silhueta de bloco sem ocupar a rua.
    if(style===2||style===5){for(let y=4.25;y<h-1;y+=4.2){const balcony=cityPart(w*.48,.1,.72,CITY_MAT.metal,0,y,front+.32);g.add(balcony);for(const bx of [-w*.19,0,w*.19])g.add(cityPart(.045,.48,.045,CITY_MAT.metal,bx,y+.23,front+.58))}}
    if(style===1||style===4){for(let xx=-w*.38;xx<=w*.38;xx+=w*.76)g.add(cityPart(.25,h-.6,.11,CITY_MAT.concrete,xx,h*.5,front+.08))}
    if(i%3===0)g.add(cityPart(1.25,.7,1.15,CITY_MAT.metal,-w*.18,h+.49,.35),cityPart(.06,1.45,.06,CITY_MAT.metal,w*.2,h+.86,0),cityPart(.7,.035,.035,CITY_MAT.metal,w*.2,h+1.55,0));
    else if(i%3===1)g.add(cityPart(1.35,.35,1.2,CITY_MAT.trim,0,h+.32,-.15),cityPart(.9,.32,.8,CITY_MAT.metal,w*.2,h+.3,1.15));
    batchBuilding(g);
    g.position.set(x,0,z);g.userData.loopLength=300;if(register){world.add(g);scenery.push(g)}return g
  }
  const TREE_MAT={
    bark:[new THREE.MeshStandardMaterial({color:0x60412f,roughness:1}),new THREE.MeshStandardMaterial({color:0x73503a,roughness:.96}),new THREE.MeshStandardMaterial({color:0x4f372a,roughness:1})],
    leaves:[new THREE.MeshStandardMaterial({color:0x17643f,roughness:.94}),new THREE.MeshStandardMaterial({color:0x218052,roughness:.9}),new THREE.MeshStandardMaterial({color:0x2d9560,roughness:.86}),new THREE.MeshStandardMaterial({color:0x114d32,roughness:1})],
    ground:new THREE.MeshStandardMaterial({color:0x426b39,roughness:1}),fallen:new THREE.MeshStandardMaterial({color:0x7b6535,roughness:1})
  };
  const TREE_GEO={trunk:new THREE.CylinderGeometry(.72,1,1,8,2),branch:new THREE.CylinderGeometry(.62,1,1,7,1),leaf:new THREE.IcosahedronGeometry(1,1),root:new THREE.ConeGeometry(1,1,5)};
  function treeLimb(from,to,radius,mat,geometry=TREE_GEO.branch){const delta=new THREE.Vector3().subVectors(to,from),limb=new THREE.Mesh(geometry,mat);limb.position.copy(from).add(to).multiplyScalar(.5);limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());limb.scale.set(radius,delta.length(),radius);limb.castShadow=true;limb.receiveShadow=true;return limb}
  function tree(x,z){
    const g=new THREE.Group(),variant=(Math.abs(Math.round(x*7+z))%3),bark=TREE_MAT.bark[variant],trunkTop=new THREE.Vector3((variant-1)*.08,2.08,0);
    g.add(treeLimb(new THREE.Vector3(0,-.04,0),trunkTop,.28,bark,TREE_GEO.trunk));
    for(let r=0;r<4;r++){const root=new THREE.Mesh(TREE_GEO.root,bark);root.scale.set(.16,.72,.28);root.rotation.z=Math.PI/2;root.rotation.y=r*Math.PI/2+.35*variant;root.position.set(Math.cos(root.rotation.y)*.28,.08,Math.sin(root.rotation.y)*.28);root.castShadow=true;g.add(root)}
    const canopy=new THREE.Group(),branchTips=[new THREE.Vector3(-.72,2.63,.12),new THREE.Vector3(.72,2.72,-.08),new THREE.Vector3(-.2,3.06,-.5),new THREE.Vector3(.18,3.15,.42)];
    branchTips.forEach((tip,n)=>{const start=new THREE.Vector3(trunkTop.x*.7,1.62+n*.1,0);g.add(treeLimb(start,tip,.11-(n%2)*.018,bark));const twigEnd=tip.clone().add(new THREE.Vector3((n%2?1:-1)*.28,.3,(n<2?1:-1)*.16));g.add(treeLimb(tip,twigEnd,.06,bark))});
    const clusters=[[-.68,2.78,.08,.88,.74,.78],[.66,2.84,-.08,.82,.72,.76],[-.18,3.34,-.38,.82,.77,.76],[.2,3.38,.38,.86,.78,.78],[0,3.08,0,1.02,.82,.9],[-.45,3.18,.38,.62,.58,.65],[.46,3.12,-.42,.64,.6,.66]];
    clusters.forEach((c,n)=>{const leaves=new THREE.Mesh(TREE_GEO.leaf,TREE_MAT.leaves[n===4?3:(variant+n)%3]);leaves.position.set(c[0],c[1],c[2]);leaves.scale.set(c[3],c[4],c[5]);leaves.rotation.set(n*.31,variant+n*.47,n*.19);leaves.castShadow=n%2===0;leaves.receiveShadow=true;canopy.add(leaves)});
    g.add(canopy);
    const grass=new THREE.Mesh(new THREE.CylinderGeometry(.62,.72,.035,9),TREE_MAT.ground);grass.position.y=.015;grass.receiveShadow=true;g.add(grass);
    for(let n=0;n<3;n++){const leaf=cityPart(.18,.025,.09,TREE_MAT.fallen,Math.cos(n*2.1+variant)*.58,.035,Math.sin(n*2.1+variant)*.48);leaf.rotation.y=n*1.7;leaf.castShadow=false;g.add(leaf)}
    g.position.set(x,0,z);g.rotation.y=variant*.71;g.userData.loopLength=300;g.userData.canopy=canopy;g.userData.windPhase=variant*1.9+Math.abs(z)*.13;world.add(g);scenery.push(g);trees.push(g)
  }
  const URBAN_MAT={bench:new THREE.MeshStandardMaterial({color:0x704833,roughness:.82}),bin:new THREE.MeshStandardMaterial({color:0x314c52,roughness:.48,metalness:.38}),sign:new THREE.MeshStandardMaterial({color:0x1779aa,roughness:.35,metalness:.22}),white:new THREE.MeshStandardMaterial({color:0xf3f1dc,roughness:.56}),vehicle:new THREE.MeshStandardMaterial({color:0x2b778b,roughness:.38,metalness:.18}),vehicleAlt:new THREE.MeshStandardMaterial({color:0xb84d3f,roughness:.45,metalness:.14}),rubber:new THREE.MeshStandardMaterial({color:0x151a1c,roughness:.9})};
  // Reusable soft light pools give existing lamps presence without adding dynamic lights.
  const nightPools=[],poolCanvas=document.createElement('canvas');poolCanvas.width=poolCanvas.height=64;const poolContext=poolCanvas.getContext('2d'),poolGradient=poolContext.createRadialGradient(32,32,0,32,32,32);poolGradient.addColorStop(0,'rgba(255,211,139,.22)');poolGradient.addColorStop(.45,'rgba(255,211,139,.10)');poolGradient.addColorStop(1,'rgba(255,211,139,0)');poolContext.fillStyle=poolGradient;poolContext.fillRect(0,0,64,64);const poolTexture=new THREE.CanvasTexture(poolCanvas),poolGeometry=new THREE.PlaneGeometry(8,12),poolMaterial=new THREE.MeshBasicMaterial({map:poolTexture,color:0xffdaa0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false,blending:THREE.AdditiveBlending});
  updateNightMaterials=()=>{
    MAT.road.color.setHex(nightMode?0x34434d:0x1d2a31);
    MAT.line.emissiveIntensity=nightMode?.48:.16;
    if(simpleRoadMaterial)simpleRoadMaterial.color.copy(MAT.road.color);
    nightFill.visible=nightMode||graphics.lightPools;
    for(const pool of nightPools)pool.visible=nightMode&&graphics.lightPools;
  };
  updateNightMaterials();
  function lamp(x,z){const g=new THREE.Group(),pole=box(.13,4.2,.13,MAT.dark,0,2.1,0);g.add(pole,box(.76,.11,.12,MAT.dark,.31,4.02,0),box(.12,.12,.12,MAT.dark,.64,3.83,0));const fixture=box(.34,.16,.3,MAT.white,.66,3.74,0);fixture.material=new THREE.MeshStandardMaterial({color:0xffe5a5,emissive:0xffa938,emissiveIntensity:1.05,roughness:.38});fixture.castShadow=false;g.add(fixture);const pool=new THREE.Mesh(poolGeometry,poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(x>0?-1.9:1.9,.025,0);pool.visible=nightMode&&graphics.lightPools;pool.frustumCulled=true;g.add(pool);nightPools.push(pool);g.position.set(x,0,z);g.userData.loopLength=300;world.add(g);scenery.push(g)}
  function urbanProp(x,z,type,i){const g=new THREE.Group();if(type===0){g.add(cityPart(1.18,.11,.34,URBAN_MAT.bench,0,.68,0),cityPart(1.18,.11,.34,URBAN_MAT.bench,0,.42,0));for(const bx of [-.43,.43])g.add(cityPart(.09,.62,.1,URBAN_MAT.bin,bx,.33,0))}else if(type===1){g.add(cityPart(.48,.64,.48,URBAN_MAT.bin,0,.36,0),cityPart(.52,.07,.52,URBAN_MAT.dark,0,.7,0))}else if(type===2){g.add(cityPart(.08,1.55,.08,URBAN_MAT.bin,0,.78,0),cityPart(.72,.54,.06,URBAN_MAT.sign,0,1.52,0),cityPart(.45,.09,.02,URBAN_MAT.white,0,1.52,.04))}else{const body=i%2?URBAN_MAT.vehicle:URBAN_MAT.vehicleAlt;g.add(cityPart(1.65,.48,3.18,body,0,.43,0),cityPart(1.35,.38,1.52,body,0,.86,-.22),cityPart(1.1,.16,.035,URBAN_MAT.white,0,.88,1.595));for(const px of [-.62,.62])for(const pz of [-1.02,1.02]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.15,10),URBAN_MAT.rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(px,.25,pz);g.add(wheel)}}g.position.set(x,0,z);g.rotation.y=type===3?Math.PI:0;g.userData.loopLength=300;g.userData.visualDetail=true;world.add(g);scenery.push(g)}
  // Fixed-size pool: every 15-unit lot exists before asynchronous assets arrive.
  const urbanLots=[],urbanGround=[];
  const groundGeometry=new THREE.BoxGeometry(200,.24,30),groundMaterial=new THREE.MeshStandardMaterial({color:0x747e75,roughness:1});
  for(let z=60;z>-360;z-=30)for(const side of [-1,1]){const slab=new THREE.Mesh(groundGeometry,groundMaterial);slab.position.set(side*107.5,-.155,z);slab.receiveShadow=true;slab.userData={loopLength:420,recycleAt:90};world.add(slab);scenery.push(slab);urbanGround.push(slab)}
  function fitUrbanModel(root,side,desiredHeight){root.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0||size.x<=0||size.z<=0)throw new Error('Invalid urban model bounds');const scale=Math.min(desiredHeight/size.y,8/size.x,14/size.z);root.scale.multiplyScalar(scale);root.updateMatrixWorld(true);bounds.setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());root.position.x+=side<0?-11.15-bounds.max.x:11.15-bounds.min.x;root.position.y+=-.035-bounds.min.y;root.position.z-=center.z;root.updateMatrixWorld(true);return root}
  for(let i=0;i<20;i++)for(const side of [-1,1]){const lot=new THREE.Group();lot.position.z=15-i*15;lot.userData={loopLength:300,recycleAt:60,side,index:i};const variant=i*2+(side>0?1:0),fallback=building(0,0,variant,false);fallback.scale.x=13.8/(5+variant%3);fallback.rotation.y=side<0?Math.PI/2:-Math.PI/2;fitUrbanModel(fallback,side,7+(variant*7%18));lot.add(fallback);lot.userData.fallback=fallback;
    // Low street wall and paved parcel make the spaces between buildings intentional.
    lot.add(cityPart(10,.12,15,CITY_MAT.concrete,side*15.5,-.095,0),cityPart(.18,.65,15,CITY_MAT.brick,side*11,.29,0));world.add(lot);scenery.push(lot);urbanLots.push(lot)}
  for(let z=10,i=0;z>-290;z-=15,i++){if(i%2){tree(-9,z);tree(9,z-7);urbanProp(-9.7,z-6,i%3,i);urbanProp(10,z-11,3,i)}else{lamp(-7.8,z);lamp(7.8,z-7);urbanProp(-9.7,z-8,(i+1)%3,i);urbanProp(10,z-3,3,i)}}
  // Fintech-style archway gives the city a recognizable landmark.
  const arch=new THREE.Group(); arch.add(box(1,7,1,MAT.dark,-7,3.5,0),box(1,7,1,MAT.dark,7,3.5,0),box(15,1,1,MAT.dark,0,7,0)); arch.position.z=-75;arch.userData.loopLength=300;world.add(arch);scenery.push(arch);
  // Trecho demonstrativo: modelos GLB locais do City Kit (Commercial), de Kenney, CC0.
  const demoCityModels=[
    ['Large Building-ppwtREejXg.glb',-13.2,-36,17,0],['Low Building-AXFdNPAEc9.glb',13.1,-42,10,Math.PI],
    ['Skyscraper-obYD8hWLTZ.glb',-14,-62,25,0],['Large Building-3IhrYZp6tP.glb',13.4,-67,18,Math.PI],
    ['Small Building-gyjF60t7CG.glb',-13,-84,11,0],['Low Wide-DKgknsHjmr.glb',13,-88,9,Math.PI]
  ];
  let demoCityLoaded=false;
  const cityAssetStatus={loaded:0,failed:0};
  function placeDemoCityModel(model,[file,x,z,targetHeight,rotation]){const side=Math.sign(x),index=Math.round((15-z)/15),lot=urbanLots.find(item=>item.userData.side===side&&item.userData.index===index);if(!lot)throw new Error('Missing urban lot');const root=model.scene;root.rotation.y=rotation;fitUrbanModel(root,side,targetHeight);root.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;node.frustumCulled=true}});const fallback=lot.userData.fallback;lot.remove(fallback);fallback.traverse(node=>{if(node.isInstancedMesh)node.dispose()});delete lot.userData.fallback;lot.userData.model=file;lot.add(root);cityAssetStatus.loaded++;renderDirty=true}
  function loadDemoCityAssets(){if(demoCityLoaded||!window.CorridaFinanceiraV2GLTFLoader)return;demoCityLoaded=true;const loader=new window.CorridaFinanceiraV2GLTFLoader(),base='./assets/models/kenney-city-kit/';demoCityModels.forEach(spec=>loader.load(base+encodeURIComponent(spec[0]),gltf=>{try{placeDemoCityModel(gltf,spec)}catch(error){cityAssetStatus.failed++;console.warn('Urban fallback retained',spec[0],error)}},undefined,error=>{cityAssetStatus.failed++;console.warn(`Modelo urbano V2 indisponível; prédio de reserva mantido: ${spec[0]}`,error)}))}
  addEventListener('corrida-financeira-v2-gltf-ready',loadDemoCityAssets,{once:true});if(window.CorridaFinanceiraV2GLTFLoader)loadDemoCityAssets();

  let terceiroAtlas,terceiroReady,terceiroRainAtlas,terceiroRainReady=false;
  function createTerceiroAtlas(){
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=1024;
    const context=canvas.getContext('2d');
    context.fillStyle='#0d0d0e';
    context.fillRect(0,0,1024,1024);
    return canvas;
  }
  function loadTerceiroAtlas(){
    terceiroAtlas??=createTerceiroAtlas();
    return terceiroReady??=new Promise(resolve=>{
      // A relative image can taint a canvas when index.html is opened as file://.
      // Decode the same WebP as a data URL so the canvas can be uploaded to WebGL.
      const script=document.createElement('script');
      const fail=()=>{
        script.remove();
        terceiroReady=null;
        console.warn('Não foi possível carregar a textura da camisa Terceiro.');
        resolve(false);
      };
      script.onload=()=>{
        if(!window.CorridaTerceiroAtlasData){fail();return}
        script.remove();
        const image=new Image();
        image.onload=()=>{
          terceiroAtlas.getContext('2d').drawImage(image,0,0);
          resolve(true);
        };
        image.onerror=fail;
        image.src=window.CorridaTerceiroAtlasData;
      };
      script.onerror=fail;
      script.src='./assets/textures/terceiro-atlas.js';
      document.head.append(script);
    });
  }
  function updateTerceiroTexture(texture,apply){
    let disposed=false;
    texture.addEventListener('dispose',()=>{disposed=true});
    loadTerceiroAtlas().then(ready=>{if(ready&&!disposed){apply?.();texture.needsUpdate=true}});
    return texture;
  }
  function terceiroSource(){
    const canvas=document.createElement('canvas');
    canvas.width=256;
    canvas.height=384;
    canvas.jerseySkin='terceiro';
    const context=canvas.getContext('2d');
    context.fillStyle='#0d0d0e';
    context.fillRect(0,0,256,384);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    return updateTerceiroTexture(texture,()=>context.drawImage(terceiroAtlas,543,31,451,738,0,0,256,384));
  }
  // Both models share these atlas coordinates. Each keeps its own disposable texture.
  window.CorridaTerceiroAtlas=(source,character)=>{
    if(source?.image?.jerseySkin!=='terceiro')return null;
    loadTerceiroAtlas();
    if(character!=='rain')return updateTerceiroTexture(new THREE.CanvasTexture(terceiroAtlas));
    terceiroRainAtlas??=createTerceiroAtlas();
    return updateTerceiroTexture(new THREE.CanvasTexture(terceiroRainAtlas),()=>{
      if(terceiroRainReady)return;
      const context=terceiroRainAtlas.getContext('2d');
      context.drawImage(terceiroAtlas,0,0);
      // The rear-facing half of Rain's left sleeve samples the cuff artwork.
      // Replace the lime strip with leaves from farther in on the same sleeve.
      const rear=context.getImageData(215,839,164,89);
      const fabric=context.getImageData(51,839,164,89);
      for(let i=0;i<rear.data.length;i+=4){
        const greenExcess=rear.data[i+1]-rear.data[i+2];
        const blend=Math.min(1,Math.max(0,(greenExcess-4)/18));
        for(let c=0;c<3;c++)rear.data[i+c]+=(fabric.data[i+c]-rear.data[i+c])*blend;
      }
      context.putImageData(rear,215,839);
      // Rain's left cuff ends at U .385-.400, before the original black strip.
      context.fillStyle='#0c0c0d';
      context.fillRect(379,839,65,155);
      terceiroRainReady=true;
    });
  };
  // Shared by both rigged models, in the race and shop. Sleeve UV islands are independent of torso panels.
  window.CorridaJerseyDetails=(shirt,source)=>{
    const id=source?.image?.jerseySkin,kind=id==='england'?1:id==='croatia'?2:0,material=shirt.material;
    material.userData.nationKind=kind;
    if(!kind&&!material.userData.nationUniform)return;
    if(!material.userData.nationUniform){
      const uniform={value:kind};material.userData.nationUniform=uniform;
      material.onBeforeCompile=shader=>{shirt.geometry.computeBoundingBox();shader.uniforms.nationCollarY={value:shirt.geometry.boundingBox.max.y-(shirt.geometry.boundingBox.max.y<1.34?.04:.015)};shader.uniforms.nationKind=uniform;shader.vertexShader='varying vec2 nationUV;\nvarying vec3 nationPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnationUV=uv; nationPosition=position;');shader.fragmentShader='uniform float nationKind;\nuniform float nationCollarY;\nvarying vec2 nationUV;\nvarying vec3 nationPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(nationKind>0.5){bool sleeve=abs(nationPosition.x)>0.095 && nationPosition.y>1.15;if(sleeve)diffuseColor.rgb=nationKind<1.5?vec3(0.913,0.896,0.847):vec3(0.665,0.012,0.029);if(nationKind<1.5){if(!sleeve && abs(nationPosition.x)>0.045 && atan(abs(nationPosition.z-.005),abs(nationPosition.x))<.45 && nationPosition.y<nationCollarY-.12)diffuseColor.rgb=vec3(0.008,0.042,0.138);bool rainCut=nationCollarY<1.3;float neckRadius=length(vec2(nationPosition.x/(rainCut?.052:.047),(nationPosition.z-(rainCut?-.005:-.024))/(rainCut?.049:.058)));if(neckRadius>.82 && neckRadius<1.12 && nationPosition.y>nationCollarY-.04)diffuseColor.rgb=vec3(0.008,0.042,0.138);}}');};
      material.customProgramCacheKey=()=> 'nation-sleeves-v1';material.needsUpdate=true;
    }
    material.userData.nationUniform.value=kind;
    if(!shirt.userData.englandCollar&&kind===1){
      const T=THREE,g=shirt.geometry,p=g.attributes.position,idx=g.index,weights=g.attributes.skinWeight,joints=g.attributes.skinIndex,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');
      for(let i=0;i<idx.count;i+=3)for(const [a,b]of [[idx.getX(i),idx.getX(i+1)],[idx.getX(i+1),idx.getX(i+2)],[idx.getX(i+2),idx.getX(i)]]){const ka=key(a),kb=key(b),k=ka<kb?ka+'|'+kb:kb+'|'+ka;const edge=edges.get(k);if(edge)edge.count++;else edges.set(k,{a,b,count:1})}
      g.computeBoundingBox();const top=g.boundingBox.max.y,positions=[],skinWeights=[],skinIndices=[],indices=[];
      for(const e of edges.values())if(e.count===1){const x=(p.getX(e.a)+p.getX(e.b))/2,y=(p.getY(e.a)+p.getY(e.b))/2;if(Math.abs(x)>.09||y<top-.085)continue;const base=positions.length/3;for(const [i,drop]of [[e.a,0],[e.b,0],[e.a,.007],[e.b,.007]]){positions.push(p.getX(i)*1.015,p.getY(i)-drop,p.getZ(i)*1.015);for(let c=0;c<4;c++){skinWeights.push(weights.array[i*4+c]);skinIndices.push(joints.array[i*4+c])}}indices.push(base,base+1,base+2,base+2,base+1,base+3)}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeights,4));geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));geo.setIndex(indices);geo.computeVertexNormals();
      const collar=new T.SkinnedMesh(geo,new T.MeshStandardMaterial({color:0x163a68,roughness:.83,side:T.DoubleSide}));collar.skeleton=shirt.skeleton;collar.bindMatrix.copy(shirt.bindMatrix);collar.bindMatrixInverse.copy(shirt.bindMatrixInverse);collar.position.copy(shirt.position);collar.quaternion.copy(shirt.quaternion);collar.scale.copy(shirt.scale);collar.frustumCulled=false;shirt.parent.add(collar);shirt.userData.englandCollar=collar;
    }
    if(shirt.userData.englandCollar)shirt.userData.englandCollar.visible=kind===1;
  };
  function jerseyTexture(skin='default'){if(skin==='terceiro')return terceiroSource();const c=document.createElement('canvas');c.width=256;c.height=384;const q=c.getContext('2d'),designs={default:{bg:'#050505',accent:'#df0711',number:'10'},real:{bg:'#f5f3e9',accent:'#c9a227',number:'RM'},milan:{bg:'#080808',accent:'#d01927',number:'7'},psg:{bg:'#101d49',accent:'#e21d36',number:'10'},liverpool:{bg:'#c8102e',accent:'#f4ead5',number:'11'},palmeiras:{bg:'#07543b',accent:'#fff',number:'10'},corinthians:{bg:'#f1eee5',accent:'#111',number:'9'},flamengo:{bg:'#d7192d',accent:'#fff',number:'10'},saopaulo:{bg:'#f5f2e9',accent:'#111',number:'10'},santos:{bg:'#f5f3ea',accent:'#111',number:'10'},fluminense:{bg:'#7a1735',accent:'#fff',number:'10'},atletico:{bg:'#111',accent:'#d6ad46',number:'7'},brasil:{bg:'#ffdf32',accent:'#176f42',number:'10'},france:{bg:'#14275b',accent:'#fff',number:'10'},belgium:{bg:'#d71932',accent:'#f4d42d',number:'7'},england:{bg:'#f5f3ed',accent:'#173b69',number:'9'},germany:{bg:'#f4f2eb',accent:'#111',number:'8'},argentina:{bg:'#fff',accent:'#183d73',number:'10'},spain:{bg:'#c8172c',accent:'#f2c230',number:'10'},netherlands:{bg:'#ef6423',accent:'#182b52',number:'10'},croatia:{bg:'#fff',accent:'#173f86',number:'10'},italy:{bg:'#1261b2',accent:'#fff',number:'10'}},d=designs[skin]||designs.default;q.fillStyle=d.bg;q.fillRect(0,0,256,384);
    if(skin==='default'){q.strokeStyle='#282828';q.lineWidth=3;q.globalAlpha=.9;for(let n=0;n<13;n++){const x=(n*73)%280-15,y=(n*97)%410-20,flip=n%2?1:-1;q.save();q.translate(x,y);q.scale(flip,1);q.beginPath();q.moveTo(0,70);q.quadraticCurveTo(20,34,40,0);q.stroke();for(let i=1;i<6;i++){const yy=68-i*11;q.beginPath();q.moveTo(i*5,yy);q.quadraticCurveTo(25+i*4,yy-12,32+i*3,yy-23);q.moveTo(i*5,yy);q.quadraticCurveTo(-8+i*3,yy-9,-13+i*3,yy-20);q.stroke()}q.restore()}}
    if(skin==='real'){q.fillStyle='#d1aa34';q.fillRect(0,0,16,384);q.fillRect(240,0,16,384);q.strokeStyle='#c7c1ac';q.lineWidth=2;for(let y=20;y<380;y+=28){q.beginPath();q.moveTo(30,y);q.lineTo(226,y);q.stroke()}}
    if(skin==='milan'){for(let x=0;x<256;x+=48){q.fillStyle='#c91425';q.fillRect(x,0,24,384)}}
    if(skin==='psg'){q.fillStyle='#fff';q.fillRect(89,0,78,384);q.fillStyle='#dc1733';q.fillRect(99,0,58,384)}
    if(skin==='liverpool'){q.strokeStyle='#9f0a24';q.lineWidth=3;for(let x=15;x<256;x+=20){q.beginPath();q.moveTo(x,0);q.lineTo(x,384);q.stroke()}}
    if(skin==='brasil'){q.fillStyle='#168b45';q.fillRect(0,0,18,384);q.fillRect(238,0,18,384);q.fillStyle='#1d4f9b';q.beginPath();q.arc(128,65,28,0,Math.PI*2);q.fill()}
    if(skin==='france'){q.fillStyle='#fff';q.fillRect(175,0,15,384);q.fillStyle='#e21d36';q.fillRect(190,0,66,384)}
    if(skin==='belgium'){q.fillStyle='#151515';q.fillRect(0,0,30,384);q.fillStyle='#f4d42d';q.fillRect(30,0,12,384)}
    if(skin==='england'){/* Side stripes and collar are applied in garment space, outside sleeve UV islands. */}
    if(skin==='germany'){q.fillStyle='#111';q.fillRect(0,300,256,20);q.fillStyle='#d51f2e';q.fillRect(0,320,256,20);q.fillStyle='#e4bd28';q.fillRect(0,340,256,20)}
    if(skin==='argentina'){for(let x=0;x<256;x+=86){q.fillStyle='#70b8e4';q.fillRect(x,0,43,384)}q.fillStyle='#e5b52f';q.beginPath();q.arc(128,62,18,0,Math.PI*2);q.fill()}
    // The top 95px also map to shoulders/sleeves on both rigs: never use a contrasting top cap.
    if(skin==='palmeiras'){q.strokeStyle='#0f6b4e';q.lineWidth=3;for(let x=-380;x<300;x+=24){q.beginPath();q.moveTo(x,0);q.lineTo(x+384,384);q.stroke()}}
    if(skin==='corinthians'){q.fillStyle='#101010';q.fillRect(0,0,256,384);q.fillStyle='#f5f5f2';for(let x=26;x<256;x+=48)q.fillRect(x,0,12,384);d.accent='#fff'}
    if(skin==='flamengo'){for(let y=0;y<384;y+=48){q.fillStyle='#111';q.fillRect(0,y+24,256,24)}}
    if(skin==='saopaulo'){q.fillStyle='#d7192d';q.fillRect(0,128,256,26);q.fillStyle='#111';q.fillRect(0,154,256,26)}
    if(skin==='santos'){q.fillStyle='#111';for(let x=32;x<256;x+=64)q.fillRect(x,0,32,384)}
    if(skin==='fluminense'){for(let x=0;x<256;x+=64){q.fillStyle='#176447';q.fillRect(x+32,0,32,384);q.fillStyle='#fff';q.fillRect(x+29,0,3,384);q.fillRect(x+61,0,3,384)}}
    if(skin==='atletico'){for(let x=0;x<256;x+=48){q.fillStyle='#f4f1e8';q.fillRect(x+24,0,24,384)}}
    if(skin==='spain'){q.fillStyle='#f2c230';q.fillRect(0,0,15,384);q.fillRect(241,0,15,384);q.strokeStyle='#ad1023';q.lineWidth=2;for(let y=20;y<384;y+=28){q.beginPath();q.moveTo(20,y);q.lineTo(236,y);q.stroke()}}
    if(skin==='netherlands'){const grad=q.createLinearGradient(0,0,256,384);grad.addColorStop(0,'#fa7927');grad.addColorStop(1,'#df3f24');q.fillStyle=grad;q.fillRect(0,0,256,384);q.fillStyle='#182b52';q.fillRect(0,0,14,384);q.fillRect(242,0,14,384)}
    if(skin==='croatia'){const s=43;for(let yy=0;yy<9;yy++)for(let xx=0;xx<6;xx++)if((xx+yy)%2===0){q.fillStyle='#d51e32';q.fillRect(xx*s,yy*s,s,s)}q.fillStyle='#173f86';q.fillRect(0,0,12,384)}
    if(skin==='italy'){q.fillStyle='#178342';q.fillRect(0,0,12,384);q.fillStyle='#fff';q.fillRect(12,0,12,384);q.fillStyle='#d62d3d';q.fillRect(24,0,12,384)}
    q.globalAlpha=1;q.fillStyle=d.accent;q.strokeStyle=skin==='default'?'#6e0005':'#08131b';q.lineWidth=skin==='real'?2:5;q.font=`900 ${d.number.length>2?105:190}px Arial Black,Arial`;q.textAlign='center';q.textBaseline='middle';q.strokeText(d.number,128,220);q.fillText(d.number,128,220);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(["england","croatia","italy"].includes(skin))c.jerseySkin=skin;return t}
  function createMaleHairTexture(){const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d'),gradient=q.createRadialGradient(85,55,12,128,128,190);gradient.addColorStop(0,'#203743');gradient.addColorStop(.55,'#102631');gradient.addColorStop(1,'#071820');q.fillStyle=gradient;q.fillRect(0,0,256,256);q.lineCap='round';for(let n=0;n<140;n++){const x=(n*47)%264-4,y=(n*83)%264-4,r=3+(n%5);q.strokeStyle=n%4===0?'#304955':n%3===0?'#07151b':'#1a323d';q.globalAlpha=.24+(n%5)*.07;q.lineWidth=.8+(n%3)*.4;q.beginPath();q.arc(x,y,r,(n%6)*.42,Math.PI*1.6+(n%4)*.18);q.stroke()}q.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
  const maleHairTexture=createMaleHairTexture(),maleHairMaterials=[new THREE.MeshStandardMaterial({map:maleHairTexture,bumpMap:maleHairTexture,bumpScale:.018,color:0xc8d1d5,roughness:.72,metalness:.018}),new THREE.MeshStandardMaterial({map:maleHairTexture,bumpMap:maleHairTexture,bumpScale:.016,color:0x9facb2,roughness:.79,metalness:.01}),new THREE.MeshStandardMaterial({map:maleHairTexture,bumpMap:maleHairTexture,bumpScale:.02,color:0x788990,roughness:.86})],maleHairCurlGeometry=new THREE.IcosahedronGeometry(1,1),maleHairCapGeometry=new THREE.SphereGeometry(.42,18,12,0,Math.PI*2,0,Math.PI*.59);
  function addMaleHair(g){const hairGroup=new THREE.Group(),cap=new THREE.Mesh(maleHairCapGeometry,maleHairMaterials[2]);cap.position.set(0,3.55,.005);cap.scale.set(.92,.98,.95);cap.castShadow=true;cap.receiveShadow=true;hairGroup.add(cap);const addCurl=(x,y,z,size,index)=>{const curl=new THREE.Mesh(maleHairCurlGeometry,maleHairMaterials[index%3]);curl.position.set(x,y,z);curl.scale.set(size*(.92+(index%4)*.035),size*(.9+(index%5)*.028),size*(.94+(index%3)*.04));curl.rotation.set(index*.37,index*.61,index*.23);curl.castShadow=index%3===0;curl.receiveShadow=true;hairGroup.add(curl)};
    // Pequenos cachos sobrepostos cobrem toda a cabeça sem criar tiras ou espaços grandes.
    const rings=[[.16,4,.082],[.42,7,.084],[.69,9,.086],[.96,11,.088],[1.22,13,.086],[1.46,14,.082]];let curlIndex=0;
    rings.forEach(([theta,count,size],ring)=>{for(let n=0;n<count;n++){const phi=n/count*Math.PI*2+(ring%2)*.22,x=.405*Math.sin(theta)*Math.cos(phi),y=3.57+.425*Math.cos(theta),z=.42*Math.sin(theta)*Math.sin(phi);addCurl(x,y,z,size+(curlIndex%3-1)*.004,curlIndex++)}});
    // Uma última camada compacta preenche a parte traseira baixa, próxima à nuca.
    for(let n=-3;n<=3;n++){const x=n*.095,z=.315+(.03-Math.abs(n)*.006),y=3.43+Math.abs(n)*.012;addCurl(x,y,z,.078+(n%2)*.003,curlIndex++)}
    g.add(hairGroup)
  }
  function makePlayer(){const g=new THREE.Group(),blackShirt=new THREE.MeshStandardMaterial({color:0x070707,roughness:.86}),jerseyBack=new THREE.MeshStandardMaterial({map:jerseyTexture(),transparent:true,roughness:.8,side:THREE.DoubleSide}),redTrim=new THREE.MeshStandardMaterial({color:0xd80612,roughness:.72});
    const capsule=(radius,length,mat)=>new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,10),mat);
    // Tronco levemente afunilado, em vez do antigo corpo em bloco.
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.47,.58,1.32,10,1),blackShirt);torso.position.y=2.16;torso.scale.z=.72;g.add(torso);
    const jerseyPrint=new THREE.Mesh(new THREE.PlaneGeometry(.84,1.18),jerseyBack);jerseyPrint.position.set(0,2.16,.425);g.add(jerseyPrint);
    const shoulders=capsule(.16,.78,blackShirt);shoulders.rotation.z=Math.PI/2;shoulders.position.y=2.62;g.add(shoulders);const waist=new THREE.Mesh(new THREE.CylinderGeometry(.43,.39,.34,12),MAT.pants);waist.position.y=1.43;waist.scale.z=.78;g.add(waist);
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.22,.045,6,16,0,Math.PI),redTrim);collar.rotation.set(Math.PI/2,0,Math.PI);collar.position.set(0,2.8,.18);g.add(collar);
    const neck=capsule(.17,.12,MAT.skin);neck.position.y=2.94;g.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.43,20,16),MAT.skin);head.position.y=3.42;head.scale.set(.9,1.08,.92);g.add(head);
    addMaleHair(g);
    for(const x of [-.4,.4]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),MAT.skin);ear.position.set(x,3.43,0);ear.scale.set(.55,1,.7);g.add(ear)}
    const arms=[],lowerArms=[],legs=[],lowerLegs=[];
    for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.59,2.66,0);arm.rotation.z=side*-.06;const sleeve=capsule(.20,.32,blackShirt);sleeve.position.y=-.17;arm.add(sleeve);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.205,.18,.09,10),redTrim);cuff.position.y=-.43;arm.add(cuff);const elbow=new THREE.Mesh(new THREE.SphereGeometry(.14,12,9),MAT.skin);elbow.position.y=-.5;arm.add(elbow);const lower=new THREE.Group();lower.position.y=-.5;const forearm=capsule(.13,.4,MAT.skin);forearm.position.y=-.27;lower.add(forearm);const hand=new THREE.Mesh(new THREE.SphereGeometry(.145,12,9),MAT.skin);hand.position.y=-.57;hand.scale.set(.8,1.1,.75);lower.add(hand);arm.add(lower);g.add(arm);arms.push(arm);lowerArms.push(lower)}
    for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.27,1.48,0);const thigh=capsule(.205,.48,MAT.pants);thigh.position.y=-.33;leg.add(thigh);const knee=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),MAT.pants);knee.position.y=-.7;leg.add(knee);const lower=new THREE.Group();lower.position.y=-.7;const shin=capsule(.16,.4,MAT.pants);shin.position.y=-.28;lower.add(shin);const ankle=new THREE.Mesh(new THREE.SphereGeometry(.145,10,8),MAT.pants);ankle.position.y=-.56;lower.add(ankle);const shoe=new THREE.Mesh(new THREE.SphereGeometry(.24,14,10),MAT.white);shoe.position.set(0,-.69,-.16);shoe.scale.set(.9,.55,1.48);lower.add(shoe);const toe=new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),MAT.white);toe.position.set(0,-.71,-.48);toe.scale.set(.95,.5,1.25);lower.add(toe);leg.add(lower);g.add(leg);legs.push(leg);lowerLegs.push(lower)}
    g.userData={arms,lowerArms,legs,lowerLegs,shirtBody:blackShirt,shirtPrint:jerseyBack,shirtTrim:redTrim};g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
  function makeFemalePlayer(){const g=new THREE.Group(),shirtBody=new THREE.MeshStandardMaterial({color:0x070707,roughness:.84}),shirtPrint=new THREE.MeshStandardMaterial({map:jerseyTexture(),transparent:true,roughness:.78,side:THREE.DoubleSide}),shirtTrim=new THREE.MeshStandardMaterial({color:0xd80612,roughness:.7}),hairMat=new THREE.MeshStandardMaterial({color:0x251817,roughness:.92}),capsule=(r,l,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,l,5,10),m);
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.39,.52,1.28,12),shirtBody);torso.position.y=2.15;torso.scale.z=.7;g.add(torso);const jersey=new THREE.Mesh(new THREE.PlaneGeometry(.76,1.12),shirtPrint);jersey.position.set(0,2.15,.39);g.add(jersey);const shoulders=capsule(.135,.68,shirtBody);shoulders.rotation.z=Math.PI/2;shoulders.position.y=2.6;g.add(shoulders);const hips=new THREE.Mesh(new THREE.CylinderGeometry(.48,.43,.38,12),MAT.pants);hips.position.y=1.42;hips.scale.z=.76;g.add(hips);const collar=new THREE.Mesh(new THREE.TorusGeometry(.2,.04,6,16,0,Math.PI),shirtTrim);collar.rotation.set(Math.PI/2,0,Math.PI);collar.position.set(0,2.78,.17);g.add(collar);const neck=capsule(.145,.13,MAT.skin);neck.position.y=2.92;g.add(neck);const head=new THREE.Mesh(new THREE.SphereGeometry(.4,20,16),MAT.skin);head.position.y=3.38;head.scale.set(.88,1.08,.91);g.add(head);const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.425,20,14,0,Math.PI*2,0,Math.PI*.68),hairMat);hairCap.position.set(0,3.49,-.01);g.add(hairCap);for(const side of [-1,1]){const lock=capsule(.105,.62,hairMat);lock.position.set(side*.31,3.05,.08);lock.rotation.z=side*.12;g.add(lock)}const pony=capsule(.15,.48,hairMat);pony.position.set(0,3.15,-.39);pony.rotation.x=-.28;g.add(pony);for(const x of [-.36,.36]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),MAT.skin);ear.position.set(x,3.38,0);g.add(ear)}
    const arms=[],lowerArms=[],legs=[],lowerLegs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.53,2.6,0);arm.rotation.z=side*-.035;const sleeve=capsule(.17,.3,shirtBody);sleeve.position.y=-.17;arm.add(sleeve);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.175,.15,.075,10),shirtTrim);cuff.position.y=-.41;arm.add(cuff);const lower=new THREE.Group();lower.position.y=-.45;const forearm=capsule(.115,.42,MAT.skin);forearm.position.y=-.27;lower.add(forearm);const hand=new THREE.Mesh(new THREE.SphereGeometry(.13,12,9),MAT.skin);hand.position.y=-.57;hand.scale.set(.78,1.08,.73);lower.add(hand);arm.add(lower);g.add(arm);arms.push(arm);lowerArms.push(lower)}for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.25,1.46,0);const thigh=capsule(.19,.5,MAT.pants);thigh.position.y=-.34;leg.add(thigh);const knee=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),MAT.pants);knee.position.y=-.72;leg.add(knee);const lower=new THREE.Group();lower.position.y=-.72;const shin=capsule(.145,.4,MAT.pants);shin.position.y=-.28;lower.add(shin);const shoe=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),MAT.white);shoe.position.set(0,-.68,-.18);shoe.scale.set(.85,.52,1.5);lower.add(shoe);const toe=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),MAT.white);toe.position.set(0,-.7,-.48);toe.scale.set(.92,.48,1.28);lower.add(toe);leg.add(lower);g.add(leg);legs.push(leg);lowerLegs.push(lower)}g.userData={arms,lowerArms,legs,lowerLegs,shirtBody,shirtPrint,shirtTrim};g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
  let selectedCharacter=localStorage.getItem('corridaFinanceiraV2SelectedCharacter')==='female'?'female':'male',player=selectedCharacter==='female'?makeFemalePlayer():makePlayer();player.position.set(0,0,4);scene.add(player);
  const skinStyles={terceiro:{body:0x0d0d0e,trim:0x0d0d0e},default:{body:0x070707,trim:0xd80612},real:{body:0xf5f3e9,trim:0xc9a227},milan:{body:0x080808,trim:0xd01927},psg:{body:0x101d49,trim:0xe21d36},liverpool:{body:0xc8102e,trim:0xf4ead5},palmeiras:{body:0x07543b,trim:0xffffff},corinthians:{body:0xf1eee5,trim:0x111111},flamengo:{body:0xd7192d,trim:0x111111},saopaulo:{body:0xf5f2e9,trim:0xd7192d},santos:{body:0xf5f3ea,trim:0x111111},fluminense:{body:0x7a1735,trim:0x176447},atletico:{body:0x111111,trim:0xd6ad46},brasil:{body:0xffdf32,trim:0x168b45},france:{body:0x14275b,trim:0xe21d36},belgium:{body:0xd71932,trim:0x151515},england:{body:0xf5f3ed,trim:0x163a68},germany:{body:0xf4f2eb,trim:0x111111},argentina:{body:0x70b8e4,trim:0xffffff},spain:{body:0xc8172c,trim:0xf2c230},netherlands:{body:0xef6423,trim:0x182b52},croatia:{body:0xf5f3ed,trim:0x173f86},italy:{body:0x1261b2,trim:0xd6ad46}};
  // Corrected club cards use the exact same pattern as both 3D shirts, not a second CSS design.
  for(const id of ['palmeiras','corinthians','flamengo','saopaulo','santos','fluminense','atletico']){const thumbnail=document.querySelector(`.skin-card[data-skin="${id}"] .shirt-preview`);if(thumbnail){const texture=jerseyTexture(id);thumbnail.style.backgroundImage=`url("${texture.image.toDataURL('image/png')}")`;thumbnail.style.backgroundSize='100% 100%';thumbnail.style.backgroundRepeat='no-repeat';const number=thumbnail.querySelector('b');if(number)number.style.visibility='hidden';texture.dispose()}}
  let ownedSkins=['default'];try{ownedSkins=JSON.parse(localStorage.getItem('corridaFinanceiraV2OwnedSkins')||'["default"]')}catch(e){}if(!ownedSkins.includes('default'))ownedSkins.unshift('default');let equippedSkin=localStorage.getItem('corridaFinanceiraV2EquippedSkin')||'default';if(!ownedSkins.includes(equippedSkin))equippedSkin='default';
  function applyPlayerSkin(id){const style=skinStyles[id]||skinStyles.default;player.userData.shirtBody.color.setHex(style.body);if(player.userData.shirtBody.map){player.userData.shirtBody.map.dispose();player.userData.shirtBody.map=null;player.userData.shirtBody.needsUpdate=true}player.userData.shirtTrim.color.setHex(style.trim);if(player.userData.shirtPrint.map)player.userData.shirtPrint.map.dispose();player.userData.shirtPrint.map=jerseyTexture(id);player.userData.shirtPrint.needsUpdate=true;equippedSkin=id;localStorage.setItem('corridaFinanceiraV2EquippedSkin',id)}
  function switchCharacter(character,save=true){if(!['male','female'].includes(character)||character===selectedCharacter)return;const position=player.position.clone(),rotation=player.rotation.clone(),scale=player.scale.clone();scene.remove(player);selectedCharacter=character;player=character==='female'?makeFemalePlayer():makePlayer();player.position.copy(position);player.rotation.copy(rotation);player.scale.copy(scale);scene.add(player);applyPlayerSkin(equippedSkin);if(save)localStorage.setItem('corridaFinanceiraV2SelectedCharacter',character)}applyPlayerSkin(equippedSkin);
  const lanes=[-4.5,0,4.5], objects=[], particles=[];
  let state='menu',lane=1,targetX=0,jumpV=0,y=0,sliding=0,money=0,totalMoney=Number(localStorage.getItem('corridaFinanceiraV2TotalMoney')||0),distance=0,speed=18,best=Number(localStorage.getItem('corridaFinanceiraV2Best')||0),spawnZ=-70,runT=0,last=performance.now(),shake=0,selectedInvestment=null;
  // BEGIN GILBERT TEST — Gilbert is the default male visual; legacy model is fallback.
  let gilbertVisualTest=null;
  {
    const gilbertScript=document.createElement('script');gilbertScript.src='./js/gilbert-test.js';
    gilbertScript.onload=()=>{gilbertVisualTest=window.CorridaGilbertTest.create(scene);if(new URLSearchParams(location.search).get('gilbertTest')!=='1'){const debug=document.getElementById('gilbert-test-status');if(debug)debug.hidden=true}};
    gilbertScript.onerror=()=>console.warn('Teste Gilbert indisponível; personagem original mantido.');
    document.head.append(gilbertScript);
  }
  // END GILBERT TEST
  // BEGIN RAIN INTEGRATION — visual adapter only; legacy female remains the controller/fallback.
  let rainRuntimePromise=null,rainRace=null,rainRacePromise=null,rainShop=null,rainShopPromise=null,rainShopTexture=null;
  function loadRainRuntime(){if(window.CorridaRain)return Promise.resolve(window.CorridaRain);return rainRuntimePromise||(rainRuntimePromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./js/rain-character.js';s.onload=()=>resolve(window.CorridaRain);s.onerror=()=>reject(Error('Rain indisponível'));document.head.append(s)}).catch(e=>{rainRuntimePromise=null;throw e}))}
  function requestRainRace(){if(rainRacePromise)return;rainRacePromise=loadRainRuntime().then(api=>api.create()).then(actor=>{rainRace=actor;actor.root.rotation.y=Math.PI;actor.root.visible=false;scene.add(actor.root)}).catch(e=>{console.warn('Rain: usando feminina original.',e)})}
  function updateRainRace(dt){
    if(selectedCharacter==='female'&&!rainRacePromise)requestRainRace();
    if(!rainRace)return;rainRace.root.visible=selectedCharacter==='female';if(selectedCharacter!=='female')return;
    player.visible=false;rainRace.root.position.set(player.position.x,y,player.position.z);rainRace.root.rotation.set(state==='over'?.16:0,Math.PI,player.rotation.z);rainRace.setShirt(player.userData.shirtPrint.map);
    if(state==='playing'){const kind=sliding>0?'slide':y>.015||jumpV>0?'jump':'run';rainRace.update(dt,kind,speed,kind==='jump'?THREE.MathUtils.clamp((9.2-jumpV)/18.4,0,1):kind==='slide'?slideAnimationPhase():0)}else if(state==='menu')rainRace.update(dt,'idle');else if(state==='over')rainRace.update(dt,'collision');
    canvas.dataset.rainState=rainRace.root.userData.rainState;canvas.dataset.rainReady='true';
  }
  function requestRainShop(){if(rainShopPromise)return;rainShopPromise=loadRainRuntime().then(api=>api.create()).then(actor=>{rainShop=actor;if(previewCharacter==='female'&&!$('skin-shop').classList.contains('hidden'))refreshCharacterPreview()}).catch(e=>{console.warn('Prévia Rain: usando feminina original.',e)})}
  // END RAIN INTEGRATION
  let betStats={totalBet:0,totalLost:0,count:0};try{betStats={...betStats,...JSON.parse(localStorage.getItem('corridaFinanceiraV2BetStats')||'{}')}}catch(e){}let betInProgress=false,casinoAudio=null;
  $('best').textContent=`${best} m`;
  const formatMoney=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:Number(value)%1?2:0});
  const updateBalances=()=>{$('total-money').textContent=formatMoney(totalMoney);$('available-money').textContent=formatMoney(totalMoney);$('shop-balance').textContent=formatMoney(totalMoney);$('tiger-balance').textContent=formatMoney(totalMoney);$('house-balance').textContent=formatMoney(totalMoney)};
  updateBalances();
  const HOUSE_UPGRADE_COSTS=[5000,5000,5000,5000],HOUSE_LEVELS=[
    {name:'Casa Velha',description:'Uma casa antiga, com pintura gasta, telhado simples e poucos detalhes.'},
    {name:'Casa Simples',description:'Pintura renovada, jardim começando a crescer e uma aparência mais organizada.'},
    {name:'Casa Boa',description:'Fachada renovada, janelas modernas, móveis melhores e jardim bem cuidado.'},
    {name:'Casa Moderna',description:'Arquitetura moderna, garagem, varanda e materiais de qualidade superior.'},
    {name:'Casa Luxuosa',description:'Uma residência ampla e sofisticada, com piscina, garagem premium e paisagismo completo.'}
  ];
  let houseLevel=Math.max(1,Math.min(HOUSE_LEVELS.length,Number(localStorage.getItem('corridaFinanceiraV2HouseLevel')||1))),houseSpent=Math.max(0,Number(localStorage.getItem('corridaFinanceiraV2HouseSpent')||0));
  let houseRenderer;
  const houseCanvas=$('house-scene'),houseScene=new THREE.Scene(),houseCamera=new THREE.PerspectiveCamera(43,1,.1,100),houseRoot=new THREE.Group();houseScene.background=new THREE.Color(0x8ccce8);houseScene.fog=new THREE.Fog(0x8ccce8,24,48);houseScene.add(houseRoot,new THREE.HemisphereLight(0xdff6ff,0x435338,1.7));const houseSun=new THREE.DirectionalLight(0xffe4b0,2.8);houseSun.position.set(-9,15,11);houseSun.castShadow=true;houseSun.shadow.mapSize.set(1024,1024);houseSun.shadow.camera.left=-16;houseSun.shadow.camera.right=16;houseSun.shadow.camera.top=14;houseSun.shadow.camera.bottom=-8;houseScene.add(houseSun);houseCamera.position.set(11,7.2,15);
  function buildHouse3D(level){while(houseRoot.children.length){const old=houseRoot.children[0];houseRoot.remove(old);old.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry?.userData.houseOwned)o.geometry.dispose()})}houseRoot.add(window.CorridaHouseVisuals.build(THREE,level));houseRoot.scale.setScalar(.01);houseRoot.userData.reveal=0;if(houseRenderer)houseRenderer.shadowMap.needsUpdate=true}
  let houseYaw=.58,housePitch=.28,houseDragging=false,houseLastX=0,houseLastY=0;
  function resizeHouseRenderer(){
    if(!houseRenderer){
      houseRenderer=new THREE.WebGLRenderer({canvas:houseCanvas,antialias:true,powerPreference:'high-performance'});
      houseRenderer.toneMapping=THREE.ACESFilmicToneMapping;
      houseRenderer.toneMappingExposure=1.1;
      houseRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
      houseRenderer.outputColorSpace=THREE.SRGBColorSpace;
      configureHouseRenderer();
    }
    const w=Math.max(1,houseCanvas.clientWidth),h=Math.max(1,houseCanvas.clientHeight);if(houseCanvas.width!==Math.floor(w*houseRenderer.getPixelRatio())||houseCanvas.height!==Math.floor(h*houseRenderer.getPixelRatio())){houseRenderer.setSize(w,h,false);houseCamera.aspect=w/h;houseCamera.updateProjectionMatrix()}}
  function renderHouseScene(dt,t){if($('house').classList.contains('hidden'))return;resizeHouseRenderer();if(houseRoot.userData.reveal<1)houseRenderer.shadowMap.needsUpdate=true;houseRoot.userData.reveal=Math.min(1,(houseRoot.userData.reveal||0)+dt*2.6);const s=1-(1-houseRoot.userData.reveal)**3;houseRoot.scale.setScalar(s);const idle=Math.sin(t*.00035)*.035,targetYaw=houseYaw+(houseDragging?0:idle),radius=18;houseCamera.position.set(Math.sin(targetYaw)*radius,6.2+housePitch*4,Math.cos(targetYaw)*radius);houseCamera.lookAt(0,2,-.4);houseRenderer.render(houseScene,houseCamera)}
  houseCanvas.addEventListener('pointerdown',e=>{houseDragging=true;houseLastX=e.clientX;houseLastY=e.clientY;houseCanvas.setPointerCapture(e.pointerId)});houseCanvas.addEventListener('pointermove',e=>{if(!houseDragging)return;houseYaw=Math.max(-.95,Math.min(.95,houseYaw-(e.clientX-houseLastX)*.006));housePitch=Math.max(-.15,Math.min(.65,housePitch+(e.clientY-houseLastY)*.004));houseLastX=e.clientX;houseLastY=e.clientY});houseCanvas.addEventListener('pointerup',()=>{houseDragging=false});houseCanvas.addEventListener('pointercancel',()=>{houseDragging=false});
  function renderHouse(){const index=houseLevel-1,data=HOUSE_LEVELS[index],visual=$('house-visual'),max=houseLevel===HOUSE_LEVELS.length;visual.className=`house-visual level-${houseLevel}`;$('house-name').textContent=`Nível ${houseLevel} — ${data.name}`;$('house-description').textContent=data.description;$('house-level-copy').textContent=`NÍVEL ${houseLevel} / ${HOUSE_LEVELS.length}`;$('house-progress-percent').textContent=`${Math.round(houseLevel/HOUSE_LEVELS.length*100)}%`;$('house-progress-fill').style.width=`${houseLevel/HOUSE_LEVELS.length*100}%`;$('reset-house').classList.toggle('hidden',houseLevel===1);$('house-spent').textContent=`Total investido na casa: ${formatMoney(houseSpent)}`;$('house-next').classList.toggle('hidden',max);$('upgrade-house').classList.toggle('hidden',max);$('house-max-message').classList.toggle('hidden',!max);if(!max){$('house-upgrade-cost').textContent=formatMoney(HOUSE_UPGRADE_COSTS[index]);$('house-next-name').textContent=HOUSE_LEVELS[index+1].name}if(!$('house').classList.contains('hidden'))buildHouse3D(houseLevel);updateBalances()}
  function openHouse(){$('menu').classList.add('hidden');$('house').classList.remove('hidden');renderHouse();resizeHouseRenderer()}
  function closeHouse(){closeHouseReset(false);$('house').classList.add('hidden');$('house-message').classList.add('hidden');$('menu').classList.remove('hidden')}
  function showHouseMessage(title,text,success){$('house-message-title').textContent=title;$('house-message-text').textContent=text;$('house-message-icon').textContent=success?'✓':'!';$('house-message').classList.remove('hidden')}
  function upgradeHouse(){if(houseLevel>=HOUSE_LEVELS.length)return;const cost=HOUSE_UPGRADE_COSTS[houseLevel-1];if(totalMoney<cost){showHouseMessage('DINHEIRO INSUFICIENTE',`Você precisa de mais ${formatMoney(cost-totalMoney)} para melhorar sua casa.`,false);return}totalMoney-=cost;houseSpent+=cost;houseLevel++;localStorage.setItem('corridaFinanceiraV2HouseLevel',houseLevel);localStorage.setItem('corridaFinanceiraV2HouseSpent',houseSpent);saveBalance();renderHouse();const visual=$('house-visual');visual.classList.add('upgrading');setTimeout(()=>visual.classList.remove('upgrading'),950);playEffect('success');showHouseMessage('CASA MELHORADA!',`Sua casa agora está no nível ${houseLevel}: ${HOUSE_LEVELS[houseLevel-1].name}.`,true)}
  function openHouseReset(){if(houseLevel<=1)return;$('house-reset-dialog').classList.remove('hidden');document.querySelector('#house .house-panel').inert=true;$('house-reset-cancel').focus()}
  function closeHouseReset(restoreFocus=true){$('house-reset-dialog').classList.add('hidden');document.querySelector('#house .house-panel').inert=false;if(restoreFocus)$('reset-house').focus()}
  function resetHouseProgress(){if($('house-reset-dialog').classList.contains('hidden')||houseLevel<=1)return;houseLevel=1;houseSpent=0;localStorage.setItem('corridaFinanceiraV2HouseLevel','1');localStorage.setItem('corridaFinanceiraV2HouseSpent','0');closeHouseReset(false);renderHouse();$('upgrade-house').focus()}
  $('reset-house').onclick=openHouseReset;$('house-reset-cancel').onclick=()=>closeHouseReset();$('house-reset-confirm').onclick=resetHouseProgress;
  $('house-reset-dialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeHouseReset()}else if(e.key==='Tab'){e.preventDefault();const cancel=$('house-reset-cancel'),confirm=$('house-reset-confirm');(document.activeElement===cancel?confirm:cancel).focus()}});
  $('open-house').onclick=openHouse;$('close-house').onclick=closeHouse;$('upgrade-house').onclick=upgradeHouse;$('house-message-ok').onclick=()=>{$('house-message').classList.add('hidden')};renderHouse();

  function labelTexture(text,bg='#ffd447',fg='#082238'){const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d');q.fillStyle=bg;q.roundRect(5,5,246,118,22);q.fill();q.fillStyle=fg;q.font='900 58px Montserrat,Arial';q.textAlign='center';q.textBaseline='middle';q.fillText(text,128,68);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  const coinGeometry=new THREE.TorusGeometry(.55,.13,8,16);
  let coinLabel;
  function coin(x,z){const g=new THREE.Group();const ring=new THREE.Mesh(coinGeometry,MAT.gold);ring.rotation.y=Math.PI/2;g.add(ring);const sprite=new THREE.Sprite(coinLabel??=new THREE.SpriteMaterial({map:labelTexture('R$'),transparent:true}));sprite.scale.set(1.15,.58,1);g.add(sprite);g.position.set(x,1.4,z);g.userData={type:'money',phase:Math.random()*6};scene.add(g);objects.push(g)}
  const hazardYellow=new THREE.MeshStandardMaterial({color:0xe39a20,roughness:.78,metalness:.12}),hazardBlack=new THREE.MeshStandardMaterial({color:0x151a1c,roughness:.88,metalness:.18,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),hazardEdge=new THREE.MeshStandardMaterial({color:0xf2ad2d,roughness:.62,metalness:.22});
  function obstacle(type,x,z){const g=new THREE.Group();if(type==='barrier'){const board=box(3,.48,.32,MAT.red,0,.96,0);g.add(board);for(const px of [-1.08,1.08]){g.add(box(.2,.82,.2,MAT.dark,px,.41,0),box(.72,.1,.55,MAT.dark,px,.05,0));const brace=box(.11,.72,.12,MAT.dark,px*.72,.42,0);brace.rotation.z=px<0?-.48:.48;g.add(brace);for(const bx of [-.075,.075]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.025,8),MAT.gold);bolt.rotation.x=Math.PI/2;bolt.position.set(px+bx,.96,.18);bolt.castShadow=true;g.add(bolt)}}for(let i=0;i<5;i++){const stripe=box(.38,.23,.035,i%2?MAT.red:MAT.white,-1.02+i*.51,.96,.178);stripe.rotation.z=-.42;stripe.castShadow=false;g.add(stripe)}for(const lx of [-1.33,1.33]){const light=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.035,10),MAT.gold);light.rotation.x=Math.PI/2;light.position.set(lx,1.17,.19);g.add(light)}g.userData.height='low'}else if(type==='car'){const base=box(3.2,1.15,4.6,hazardYellow,0,.58,0),top=box(2.6,.75,2.3,hazardBlack,0,1.5,-.25);g.add(base,top,box(3.04,.82,.025,hazardYellow,0,.54,2.287),box(2.44,.035,2.12,hazardEdge,0,1.858,-.25));for(const sx of [-1.14,-.38,.38,1.14]){const stripe=box(.36,.84,.024,hazardBlack,sx,.54,2.286);stripe.rotation.z=-.48;stripe.castShadow=false;g.add(stripe)}for(const ex of [-1.54,1.54])g.add(box(.08,1.04,.06,hazardEdge,ex,.57,2.26));for(const mark of [[-1.34,.18],[.86,.92],[1.28,.33],[-.72,.76]]){const scuff=box(.18,.035,.018,hazardBlack,mark[0],mark[1],2.296);scuff.rotation.z=(mark[0]*.37)%1;scuff.castShadow=false;g.add(scuff)}for(const xx of [-1.25,1.25])for(const zz of [-1.45,1.45]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.25,12),MAT.dark);w.rotation.z=Math.PI/2;w.position.set(xx,.38,zz);g.add(w)}g.userData.height='block'}else if(type==='overhead'){g.add(box(.55,3.3,.55,MAT.dark,-1.55,1.65,0),box(.55,3.3,.55,MAT.dark,1.55,1.65,0),box(3.65,.7,.6,MAT.red,0,2.85,0));g.userData.height='high'}else{for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.42,1.1,12),MAT.orange);cone.position.set((i-1)*.85,.55,0);cone.castShadow=true;g.add(cone)}g.userData.height='low'}g.position.set(x,0,z);g.userData.type='obstacle';scene.add(g);objects.push(g)}
  function spawnRow(){spawnZ-=12+Math.random()*8;const safe=Math.floor(Math.random()*3),pattern=Math.random();if(pattern<.28){for(let l=0;l<3;l++)coin(lanes[l],spawnZ-l*2)}else{for(let l=0;l<3;l++)if(l!==safe&&Math.random()<.82)obstacle(['barrier','cone','car','overhead'][Math.floor(Math.random()*4)],lanes[l],spawnZ);for(let n=0;n<3;n++)coin(lanes[safe],spawnZ-n*3-3)}if(Math.random()<.35){spawnZ-=8;coin(lanes[Math.floor(Math.random()*3)],spawnZ)}}
  function reset(){objects.forEach(o=>scene.remove(o));objects.length=0;particles.forEach(o=>scene.remove(o));particles.length=0;lane=1;targetX=0;y=0;jumpV=0;sliding=0;money=0;distance=0;speed=18;spawnZ=-55;player.position.set(0,0,4);player.rotation.set(0,0,0);for(let i=0;i<16;i++)spawnRow();$('money').textContent='R$ 0';$('distance').textContent='0 m';$('tip').classList.remove('hidden');}
  function start(){reset();state='playing';$('menu').classList.add('hidden');$('gameover').classList.add('hidden');$('pause-screen').classList.add('hidden');$('hud').classList.remove('hidden');$('pause-button').classList.remove('hidden');}
  function move(dir){if(state!=='playing')return;lane=Math.max(0,Math.min(2,lane+dir));targetX=lanes[lane]}
  function jump(){if(state==='playing'&&y<.05&&!sliding){jumpV=9.2;playEffect('jump')}}
  const slideKeysDown=new Set();
  // Chronological time is independent of the remaining time and the clip cursor.
  // A released tap keeps its .72s deadline; only the exit section is remapped.
  let slideElapsed=0,slideEndAt=0,slideExitAt=0;
  function slide(){if(state==='playing'&&y<.1&&sliding<=0){slideElapsed=0;slideEndAt=2.72;slideExitAt=slideEndAt-.1656;sliding=slideEndAt}}
  function advanceSlide(dt){if(sliding<=0)return;slideElapsed=Math.min(slideEndAt,slideElapsed+dt);sliding=Math.max(0,slideEndAt-slideElapsed)}
  function slideAnimationPhase(){if(sliding<=0)return 1;const elapsed=slideElapsed<=slideExitAt?slideElapsed:2.72-.1656+.1656*Math.min(1,(slideElapsed-slideExitAt)/(slideEndAt-slideExitAt));return Math.min(1,elapsed/2.72)}
  function slidePoseWeight(){const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)},elapsed=slideAnimationPhase()*2.72;return sliding>0?smooth(elapsed/.1296)*smooth((2.72-elapsed)/.1656):0}
  function releaseSlide(){if(sliding<=0)return;const end=slideElapsed<.72?.72:Math.min(2.72,slideElapsed+.1656);if(end>=slideEndAt)return;slideEndAt=end;slideExitAt=Math.max(slideElapsed,end-.1656);sliding=Math.max(0,end-slideElapsed)}
  function burst(pos){
    const limit=graphics.particles;
    for(let i=0;i<8;i++){
      // Keep the random sequence for subsequent obstacle and coin generation.
      const vx=(Math.random()-.5)*4,vy=Math.random()*4,vz=(Math.random()-.5)*3;
      if(i>=limit)continue;
      const particle=new THREE.Mesh(boxGeometry(.09,.09,.09),MAT.gold);
      particle.position.copy(pos);
      particle.userData.vel=new THREE.Vector3(vx,vy,vz);
      scene.add(particle);
      particles.push(particle);
    }
  }
  function end(){state='over';shake=.55;playEffect('collision');$('pause-button').classList.add('hidden');const d=Math.floor(distance);best=Math.max(best,d);localStorage.setItem('corridaFinanceiraV2Best',best);$('final-distance').textContent=`${d} m`;$('final-money').textContent=`R$ ${money}`;$('final-best').textContent=`${best} m`;$('best').textContent=`${best} m`;setTimeout(()=>{$('hud').classList.add('hidden');$('gameover').classList.remove('hidden')},500)}
  function pauseGame(){if(state!=='playing')return;state='paused';music.pause();$('pause-button').classList.add('hidden');$('pause-screen').classList.remove('hidden')}
  function resumeGame(){if(state!=='paused')return;state='playing';$('pause-screen').classList.add('hidden');$('pause-button').classList.remove('hidden');if(!music.muted){musicStarted=true;music.play().catch(()=>{musicStarted=false})}}
  const tutorialPages=[...document.querySelectorAll('.tutorial-page')];let tutorialStep=0;
  function renderTutorial(){tutorialPages.forEach((page,i)=>page.classList.toggle('active',i===tutorialStep));$('tutorial-counter').textContent=`${tutorialStep+1}/${tutorialPages.length} — ${tutorialPages[tutorialStep].dataset.title}`;$('tutorial-dots').innerHTML=tutorialPages.map((_,i)=>`<i class="${i===tutorialStep?'active':''}"></i>`).join('');$('tutorial-prev').disabled=tutorialStep===0;$('tutorial-next').disabled=tutorialStep===tutorialPages.length-1}
  function openTutorial(){tutorialStep=0;$('menu').classList.add('hidden');$('tutorial').classList.remove('hidden');renderTutorial()}
  function closeTutorial(){$('tutorial').classList.add('hidden');$('menu').classList.remove('hidden')}
  function tutorialMove(direction){tutorialStep=Math.max(0,Math.min(tutorialPages.length-1,tutorialStep+direction));renderTutorial()}
  $('open-tutorial').onclick=openTutorial;$('close-tutorial').onclick=closeTutorial;$('close-tutorial-top').onclick=closeTutorial;$('tutorial-prev').onclick=()=>tutorialMove(-1);$('tutorial-next').onclick=()=>tutorialMove(1);renderTutorial();
  function input(e){const k=e.key.toLowerCase();if(k==='f8'||(isConsoleYShortcut(e)&&!e.repeat&&($('dev-console').classList.contains('hidden')||!$('console-input').value.trim())&&!e.target?.isContentEditable&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))){e.preventDefault();toggleDevConsole();return}if(!$('dev-console').classList.contains('hidden')){if(k==='escape'){e.preventDefault();toggleDevConsole(false)}return}if(!$('reset-progress-dialog').classList.contains('hidden')){if(k==='escape'&&!$('reset-step-success').classList.contains('hidden'))return;if(k==='escape'){closeProgressReset();e.preventDefault()}return}if(!$('house').classList.contains('hidden')){if(k==='escape'){closeHouse();e.preventDefault()}return}if(!$('settings').classList.contains('hidden')){if(k==='escape'){closeSettings();e.preventDefault()}return}if(!$('tutorial').classList.contains('hidden')){if(k==='escape')closeTutorial();if(k==='arrowleft')tutorialMove(-1);if(k==='arrowright')tutorialMove(1);if(['escape','arrowleft','arrowright'].includes(k))e.preventDefault();return}if(k==='escape'){e.preventDefault();state==='playing'?pauseGame():state==='paused'&&resumeGame();return}if(['arrowleft','arrowright','arrowup','arrowdown',' ','a','d','w','s'].includes(k))e.preventDefault();if(k==='arrowleft'||k==='a')move(-1);if(k==='arrowright'||k==='d')move(1);if(k==='arrowup'||k==='w'||k===' ')jump();if(k==='arrowdown'||k==='s'){const held=slideKeysDown.has(k);slideKeysDown.add(k);if(!held&&!e.repeat)slide()}}
  // Release tracking is captured even when a menu input consumes keyboard events.
  addEventListener('keyup',e=>{if(slideKeysDown.delete(e.key.toLowerCase())&&slideKeysDown.size===0)releaseSlide()},true);
  addEventListener('blur',()=>{slideKeysDown.clear();releaseSlide()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){slideKeysDown.clear();releaseSlide()}});
  addEventListener('keydown',input,{passive:false});let sx=0,sy=0;addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>25)move(dx>0?1:-1);else if(dy<-25)jump();else if(dy>25)slide()},{passive:true});
  function saveBalance(){totalMoney=Math.round(totalMoney*100)/100;localStorage.setItem('corridaFinanceiraV2TotalMoney',totalMoney);updateBalances()}
  function renderBetHistory(){$('total-bet').textContent=formatMoney(betStats.totalBet);$('total-lost').textContent=formatMoney(betStats.totalLost);$('loss-reminder').textContent=betStats.totalLost>0?`Você já perdeu ${formatMoney(betStats.totalLost)} em apostas. Se esse dinheiro tivesse sido guardado ou investido, ele ainda poderia fazer parte do seu patrimônio.`:'Apostar não deve ser tratado como investimento.'}
  function playEffect(kind='button'){if(gameSettings.sfxVolume<=0)return;try{casinoAudio=casinoAudio||new (window.AudioContext||window.webkitAudioContext)();const presets={button:[420,520,.018,.07],jump:[380,720,.025,.15],collision:[150,70,.06,.3],success:[520,880,.03,.22],fail:[260,130,.035,.25]},p=presets[kind]||presets.button,now=casinoAudio.currentTime,osc=casinoAudio.createOscillator(),gain=casinoAudio.createGain();osc.type=kind==='collision'?'sawtooth':'sine';osc.frequency.setValueAtTime(p[0],now);osc.frequency.exponentialRampToValueAtTime(p[1],now+p[3]);gain.gain.setValueAtTime(p[2]*gameSettings.sfxVolume,now);gain.gain.exponentialRampToValueAtTime(.001,now+p[3]);osc.connect(gain).connect(casinoAudio.destination);osc.start(now);osc.stop(now+p[3]+.01)}catch(e){}}
  function playCoinSound(){if(gameSettings.sfxVolume<=0)return;try{casinoAudio=casinoAudio||new (window.AudioContext||window.webkitAudioContext)();const now=casinoAudio.currentTime,osc=casinoAudio.createOscillator(),gain=casinoAudio.createGain();osc.type='sine';osc.frequency.setValueAtTime(760,now);osc.frequency.exponentialRampToValueAtTime(1120,now+.09);gain.gain.setValueAtTime(.022*gameSettings.sfxVolume,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);osc.connect(gain).connect(casinoAudio.destination);osc.start(now);osc.stop(now+.17)}catch(e){}}
  function playCasinoTone(lost=false){if(gameSettings.sfxVolume<=0)return;try{casinoAudio=casinoAudio||new (window.AudioContext||window.webkitAudioContext)();const now=casinoAudio.currentTime,notes=lost?[330,260,190]:[440,550,660];notes.forEach((freq,i)=>{const osc=casinoAudio.createOscillator(),gain=casinoAudio.createGain();osc.type='square';osc.frequency.value=freq;gain.gain.setValueAtTime(.035*gameSettings.sfxVolume,now+i*.12);gain.gain.exponentialRampToValueAtTime(.001,now+i*.12+.16);osc.connect(gain).connect(casinoAudio.destination);osc.start(now+i*.12);osc.stop(now+i*.12+.17)})}catch(e){}}
  document.addEventListener('click',e=>{if(e.target.closest('button'))playEffect('button')});
  function updatePromisedPrize(){const value=Number($('bet-value').value)||0;$('promised-prize').textContent=formatMoney(value*5);$('bet-error').textContent=value>totalMoney?'A aposta é maior do que seu saldo disponível.':''}
  function openTigrinho(){$('menu').classList.add('hidden');$('tigrinho').classList.remove('hidden');updateBalances();renderBetHistory();updatePromisedPrize()}
  function closeTigrinho(){if(betInProgress)return;$('tigrinho').classList.add('hidden');$('menu').classList.remove('hidden');$('bet-result').classList.add('hidden')}
  function placeBet(){const value=Math.round(Number($('bet-value').value)*100)/100;if(!Number.isFinite(value)||value<=0){$('bet-error').textContent='Informe um valor de aposta acima de R$ 0.';return}if(value>totalMoney){$('bet-error').textContent='Você não pode apostar mais do que seu saldo.';return}betInProgress=true;$('bet-button').disabled=true;$('bet-value').disabled=true;$('bet-error').textContent='';totalMoney-=value;betStats.totalBet=Math.round((betStats.totalBet+value)*100)/100;betStats.totalLost=Math.round((betStats.totalLost+value)*100)/100;betStats.count+=1;saveBalance();localStorage.setItem('corridaFinanceiraV2BetStats',JSON.stringify(betStats));renderBetHistory();playCasinoTone(false);const symbols=['💎','⭐','🍀','🍒','7️⃣','🔔'],reelEls=[...document.querySelectorAll('.reel')];$('reels').classList.add('spinning');const spin=setInterval(()=>reelEls.forEach(r=>r.textContent=symbols[Math.floor(Math.random()*symbols.length)]),90);setTimeout(()=>{clearInterval(spin);['💎','🍋','🍀'].forEach((s,i)=>reelEls[i].textContent=s);$('reels').classList.remove('spinning');playCasinoTone(true);$('bet-loss-text').textContent=`Você perdeu ${formatMoney(value)}.`;$('bet-result').classList.remove('hidden');$('bet-button').disabled=false;$('bet-value').disabled=false;$('bet-value').value='';updatePromisedPrize();betInProgress=false},1900)}
  $('open-tigrinho').onclick=openTigrinho;$('close-tigrinho').onclick=closeTigrinho;$('bet-value').addEventListener('input',updatePromisedPrize);$('bet-button').onclick=placeBet;$('bet-result-ok').onclick=()=>{$('bet-result').classList.add('hidden')};renderBetHistory();
  let characterRenderer;
  const characterCanvas=$('character-preview'),characterScene=new THREE.Scene(),characterCamera=new THREE.PerspectiveCamera(34,1,.1,30),characterStage=new THREE.Group();characterScene.add(characterStage,new THREE.HemisphereLight(0xdff8ff,0x183027,2.2));const characterLight=new THREE.DirectionalLight(0xffe5bb,2.5);characterLight.position.set(-3,7,5);characterScene.add(characterLight);characterCamera.position.set(0,2.3,8);characterCamera.lookAt(0,2,0);let previewCharacter=selectedCharacter,previewModel=null;
  // BEGIN GILBERT SHOP PREVIEW — visual only; purchases and saved state unchanged.
  let gilbertShopModel=null,gilbertShopPromise=null,gilbertRuntimePromise=null,femaleShopModel=null;
  function loadGilbertShopRuntime(){
    if(window.CorridaGilbertTest?.createShopModel)return Promise.resolve(window.CorridaGilbertTest);
    if(gilbertRuntimePromise)return gilbertRuntimePromise;
    gilbertRuntimePromise=new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src===new URL('./js/gilbert-test.js',location.href).href&&s.dataset.shopLoadFailed!=='true'),script=existing||document.createElement('script');
      script.addEventListener('load',()=>window.CorridaGilbertTest?.createShopModel?resolve(window.CorridaGilbertTest):reject(Error('Gilbert shop factory unavailable')),{once:true});
      script.addEventListener('error',()=>{script.dataset.shopLoadFailed='true';reject(Error('Gilbert bundle unavailable'))},{once:true});
      if(!existing){script.src='./js/gilbert-test.js';document.head.append(script)}
    }).catch(error=>{gilbertRuntimePromise=null;throw error});
    return gilbertRuntimePromise;
  }
  function requestGilbertShopModel(){
    if(gilbertShopPromise)return;
    characterCanvas.dataset.model='loading';$('character-description').textContent='Carregando Gilbert…';
    gilbertShopPromise=loadGilbertShopRuntime().then(api=>api.createShopModel()).then(actor=>{
      gilbertShopModel=actor;
      if(previewCharacter==='male'&&!$('skin-shop').classList.contains('hidden'))refreshCharacterPreview();
    }).catch(error=>{
      gilbertShopPromise=null;console.error('Gilbert shop preview',error);
      if(previewCharacter==='male'){characterCanvas.dataset.model='error';$('character-description').textContent='Não foi possível carregar o Gilbert. Reabra a loja para tentar novamente.'}
    });
  }
  function refreshCharacterPreview(){
    if($('skin-shop').classList.contains('hidden'))return;
    if(previewModel)characterStage.remove(previewModel);previewModel=null;
    if(previewCharacter==='male'){
      if(!gilbertShopModel){requestGilbertShopModel();return}
      previewModel=gilbertShopModel.root;
      if(gilbertShopModel.skin!==equippedSkin){const source=jerseyTexture(equippedSkin);gilbertShopModel.setShirt(source,equippedSkin);source.dispose()}
      $('character-description').textContent='Gilbert · o mesmo modelo 3D da corrida.';
      characterCanvas.dataset.model='gilbert';characterCanvas.dataset.shirtRevision=String(gilbertShopModel.revision);characterCanvas.dataset.modelParses=String(gilbertShopModel.parseCount);
    }else{
      if(!rainShop)requestRainShop();
      if(rainShop){previewModel=rainShop.root;if(rainShopTexture!==equippedSkin){const texture=jerseyTexture(equippedSkin);rainShop.setShirt(texture);texture.dispose();rainShopTexture=equippedSkin}characterCanvas.dataset.model='rain';characterCanvas.dataset.modelParses=String(rainShop.parseCount);characterCanvas.dataset.shirtRevision=String(rainShop.revision);$('character-description').textContent='Rain · Blender Studio · CC BY 4.0';}
      else {
      previewModel=femaleShopModel||(femaleShopModel=makeFemalePlayer());
      const style=skinStyles[equippedSkin]||skinStyles.default;previewModel.userData.shirtBody.color.setHex(style.body);previewModel.userData.shirtTrim.color.setHex(style.trim);
      if(previewModel.userData.shirtPrint.map)previewModel.userData.shirtPrint.map.dispose();previewModel.userData.shirtPrint.map=jerseyTexture(equippedSkin);previewModel.userData.shirtPrint.needsUpdate=true;
      characterCanvas.dataset.model='female';
      }
    }
    characterCanvas.dataset.skin=equippedSkin;previewModel.rotation.y=.24;characterStage.add(previewModel);
  }
  function renderCharacterChoice(){const female=previewCharacter==='female',selected=previewCharacter===selectedCharacter,button=$('select-character');$('character-name').textContent=female?'FEMININO':'MASCULINO';$('character-description').textContent=female?'Corredora feminina com modelo e silhueta próprios.':'Gilbert · o mesmo modelo 3D da corrida.';button.textContent=selected?'✓ SELECIONADO':'SELECIONAR';button.classList.toggle('selected',selected);button.disabled=selected;refreshCharacterPreview()}
  // END GILBERT SHOP PREVIEW
  function changeCharacterPreview(direction){previewCharacter=previewCharacter==='male'?'female':'male';renderCharacterChoice()}
  function renderCharacterPreview(dt,t){if($('skin-shop').classList.contains('hidden')||!previewModel)return;
    if(!characterRenderer){
      characterRenderer=new THREE.WebGLRenderer({canvas:characterCanvas,antialias:true,alpha:true,powerPreference:'high-performance'});
      characterRenderer.outputColorSpace=THREE.SRGBColorSpace;
      setPanelRatio(characterRenderer,graphics.shopRatio);
    }
    const w=Math.max(1,characterCanvas.clientWidth),h=Math.max(1,characterCanvas.clientHeight);if(characterCanvas.width!==Math.floor(w*characterRenderer.getPixelRatio())||characterCanvas.height!==Math.floor(h*characterRenderer.getPixelRatio())){characterRenderer.setSize(w,h,false);characterCamera.aspect=w/h;characterCamera.updateProjectionMatrix()}previewModel.position.y=Math.sin(t*.002)*.025;previewModel.rotation.y=.24+Math.sin(t*.0007)*.12;if(previewCharacter==='male'){characterRenderer.toneMapping=THREE.ACESFilmicToneMapping;characterRenderer.toneMappingExposure=1.04;gilbertShopModel.idle(dt)}else if(rainShop&&previewModel===rainShop.root){characterRenderer.toneMapping=THREE.ACESFilmicToneMapping;characterRenderer.toneMappingExposure=1.04;rainShop.update(dt,'idle')}else{characterRenderer.toneMapping=THREE.NoToneMapping;previewModel.userData.arms[0].rotation.x=Math.sin(t*.002)*.08;previewModel.userData.arms[1].rotation.x=-Math.sin(t*.002)*.08}characterRenderer.render(characterScene,characterCamera)}
  $('character-prev').onclick=()=>changeCharacterPreview(-1);$('character-next').onclick=()=>changeCharacterPreview(1);$('select-character').onclick=()=>{switchCharacter(previewCharacter);renderCharacterChoice();playEffect('success')};
  let pendingSkinPurchase=null;
  function renderShop(){updateBalances();document.querySelectorAll('.skin-card').forEach(card=>{const id=card.dataset.skin,owned=ownedSkins.includes(id),equipped=id===equippedSkin,button=card.querySelector('.skin-action');card.classList.toggle('equipped',equipped);button.textContent=equipped?'EQUIPADA ✓':owned?'EQUIPAR':'COMPRAR';button.disabled=equipped});renderCharacterChoice()}
  function openShop(){$('menu').classList.add('hidden');$('skin-shop').classList.remove('hidden');renderShop()}
  function closeShop(){$('skin-shop').classList.add('hidden');$('menu').classList.remove('hidden');$('shop-dialog').classList.add('hidden')}
  function showShopMessage(title,text,icon='!'){pendingSkinPurchase=null;$('shop-dialog-title').textContent=title;$('shop-dialog-text').textContent=text;$('shop-dialog-icon').textContent=icon;$('shop-confirm-actions').classList.add('hidden');$('shop-dialog-ok').classList.remove('hidden');$('shop-dialog').classList.remove('hidden')}
  function chooseSkin(id){const card=document.querySelector(`.skin-card[data-skin="${id}"]`),name=card.querySelector('h3').textContent,price=Number(card.dataset.price);if(id===equippedSkin)return;if(ownedSkins.includes(id)){applyPlayerSkin(id);renderShop();return}if(totalMoney<price){showShopMessage('SALDO INSUFICIENTE',`Você precisa de ${formatMoney(price)} para comprar esta skin.`,'×');return}pendingSkinPurchase={id,price};$('shop-dialog-title').textContent=name;$('shop-dialog-text').textContent=`Deseja comprar esta skin por ${formatMoney(price)}?`;$('shop-dialog-icon').textContent='?';$('shop-confirm-actions').classList.remove('hidden');$('shop-dialog-ok').classList.add('hidden');$('shop-dialog').classList.remove('hidden')}
  function confirmSkinPurchase(){if(!pendingSkinPurchase)return;const {id,price}=pendingSkinPurchase;if(totalMoney<price){showShopMessage('SALDO INSUFICIENTE',`Você precisa de ${formatMoney(price)} para comprar esta skin.`,'×');return}totalMoney-=price;ownedSkins.push(id);localStorage.setItem('corridaFinanceiraV2OwnedSkins',JSON.stringify(ownedSkins));saveBalance();applyPlayerSkin(id);renderShop();showShopMessage('SKIN DESBLOQUEADA!','A nova camisa foi comprada e já está equipada.','✓')}
  document.querySelectorAll('.skin-card').forEach(card=>card.querySelector('.skin-action').onclick=()=>chooseSkin(card.dataset.skin));$('open-shop').onclick=openShop;$('close-shop').onclick=closeShop;$('cancel-purchase').onclick=()=>{$('shop-dialog').classList.add('hidden');pendingSkinPurchase=null};$('confirm-purchase').onclick=confirmSkinPurchase;$('shop-dialog-ok').onclick=()=>{$('shop-dialog').classList.add('hidden')};
  function showInvestments(){$('menu').classList.add('hidden');$('investments').classList.remove('hidden');updateBalances()}
  function closeInvestments(){$('investments').classList.add('hidden');$('menu').classList.remove('hidden');$('investment-form').classList.add('hidden');document.querySelectorAll('.investment-card').forEach(c=>c.classList.remove('selected'));selectedInvestment=null}
  function selectInvestment(card){document.querySelectorAll('.investment-card').forEach(c=>c.classList.toggle('selected',c===card));selectedInvestment={name:card.dataset.name,rate:Number(card.dataset.rate),kind:card.dataset.kind};$('selected-investment').textContent=selectedInvestment.name;$('investment-value').value='';$('potential-return').textContent=formatMoney(0);$('investment-error').textContent='';$('investment-form').classList.remove('hidden');$('investment-value').focus()}
  function updatePotential(){const value=Number($('investment-value').value)||0;$('potential-return').textContent=formatMoney(value*(selectedInvestment?.rate||0));$('investment-error').textContent=value>totalMoney?'O valor é maior do que seu saldo disponível.':''}
  function finishInvestment(transaction){localStorage.removeItem('corridaFinanceiraV2PendingInvestment');const success=transaction.success===true||(transaction.kind==='savings'&&transaction.success!==false),message=$('investment-message');message.classList.toggle('failed',!success);$('result-icon').textContent=success?'✓':'!';$('result-title').textContent=success?'INVESTIMENTO CONCLUÍDO':'INVESTIMENTO FRACASSOU';if(success){const returned=Math.round(transaction.value*transaction.rate*100)/100;totalMoney+=returned;saveBalance();const profit=returned-transaction.value;$('result-text').textContent=`Seu investimento de ${formatMoney(transaction.value)} rendeu ${formatMoney(profit)}.`;$('result-balance').textContent=`Novo saldo: ${formatMoney(totalMoney)}`}else{$('result-text').textContent=`A EMPRESA FALIU! Você perdeu ${formatMoney(transaction.value)}.`;$('result-balance').textContent=`Saldo disponível: ${formatMoney(totalMoney)}`}const record={success,name:transaction.name,value:transaction.value,balance:totalMoney,date:Date.now()};localStorage.setItem('corridaFinanceiraV2LastInvestment',JSON.stringify(record));let history=[];try{history=JSON.parse(localStorage.getItem('corridaFinanceiraV2InvestmentHistory')||'[]')}catch(e){}history.push(record);localStorage.setItem('corridaFinanceiraV2InvestmentHistory',JSON.stringify(history.slice(-50)));$('investment-loader').classList.add('hidden');message.classList.remove('hidden')}
  function invest(){if(!selectedInvestment)return;const value=Math.round(Number($('investment-value').value)*100)/100;if(!Number.isFinite(value)||value<=0){$('investment-error').textContent='Informe um valor válido para investir.';return}if(value>totalMoney){$('investment-error').textContent='Você não pode investir mais do que seu saldo.';return}const transaction={...selectedInvestment,value,success:selectedInvestment.kind==='savings'||Math.random()<.1};totalMoney-=value;saveBalance();localStorage.setItem('corridaFinanceiraV2PendingInvestment',JSON.stringify(transaction));$('investment-result').classList.remove('hidden');$('investment-loader').classList.remove('hidden');$('investment-message').classList.add('hidden');setTimeout(()=>finishInvestment(transaction),1500)}
  document.querySelectorAll('.investment-card').forEach(card=>card.onclick=()=>selectInvestment(card));$('investment-value').addEventListener('input',updatePotential);$('invest').onclick=invest;$('open-investments').onclick=showInvestments;$('close-investments').onclick=closeInvestments;$('result-ok').onclick=()=>{$('investment-result').classList.add('hidden');$('investment-form').classList.add('hidden');document.querySelectorAll('.investment-card').forEach(c=>c.classList.remove('selected'));selectedInvestment=null};
  // Se a página foi atualizada durante a animação, conclui a operação sem duplicar valores.
  const pendingInvestment=localStorage.getItem('corridaFinanceiraV2PendingInvestment');if(pendingInvestment){try{finishInvestment(JSON.parse(pendingInvestment));$('investment-result').classList.add('hidden')}catch(e){localStorage.removeItem('corridaFinanceiraV2PendingInvestment')}}
  $('pause-button').onclick=pauseGame;$('resume-game').onclick=resumeGame;$('play').onclick=start;$('restart').onclick=start;$('back').onclick=()=>{$('gameover').classList.add('hidden');$('pause-button').classList.add('hidden');$('menu').classList.remove('hidden');state='menu'};
  const speedIndicators=[...document.querySelectorAll('#speed i')];
  let lastSpeedLevel=0,lastWorldFrame=-Infinity,lastVisualState;
  let lastPanelFrame=-Infinity,panelTime=0,activePanel=null;
  function renderPanels(dt,t){
    if(!graphics.panelInterval){
      renderHouseScene(dt,t);
      renderCharacterPreview(dt,t);
      return;
    }
    const panel=!$('house').classList.contains('hidden')?'house':!$('skin-shop').classList.contains('hidden')?'shop':null;
    if(panel!==activePanel){
      activePanel=panel;
      lastPanelFrame=-Infinity;
      panelTime=0;
    }
    if(!panel)return;
    panelTime+=dt;
    if(t-lastPanelFrame<graphics.panelInterval)return;
    if(panel==='house')renderHouseScene(panelTime,t);
    else renderCharacterPreview(panelTime,t);
    lastPanelFrame=t;
    panelTime=0;
  }
  function update(dt,t){runT+=dt;if(state==='playing'){speed=Math.min(39,18+distance/120);distance+=speed*dt*.52;player.position.x+=(targetX-player.position.x)*Math.min(1,dt*12);jumpV-=22*dt;y=Math.max(0,y+jumpV*dt);if(y===0&&jumpV<0)jumpV=0;advanceSlide(dt);const runBob=y===0?Math.abs(Math.sin(runT*speed*.68))*.045:0;player.position.y=y+runBob;player.scale.y+=( (sliding? .48:1)-player.scale.y)*Math.min(1,dt*18);player.rotation.x+=((sliding?.34:-.055)-player.rotation.x)*dt*10;player.rotation.z+=( (targetX-player.position.x)*-.045-player.rotation.z)*dt*12;
      if(!graphics.skipHiddenRunner||player.visible){
        const gait=Math.sin(runT*speed*.68),{arms,lowerArms,legs,lowerLegs}=player.userData;
        arms[0].rotation.x=gait*.72;
        arms[1].rotation.x=-gait*.72;
        lowerArms[0].rotation.x=.38+Math.max(0,-gait)*.42;
        lowerArms[1].rotation.x=.38+Math.max(0,gait)*.42;
        legs[0].rotation.x=-gait*.58;
        legs[1].rotation.x=gait*.58;
        lowerLegs[0].rotation.x=-Math.max(0,gait)*.82;
        lowerLegs[1].rotation.x=-Math.max(0,-gait)*.82;
        if(y>.1){
          arms.forEach(arm=>arm.rotation.x-=.28);
          legs.forEach(leg=>leg.rotation.x+=.18);
          lowerLegs.forEach(leg=>leg.rotation.x=-.55);
        }
      }
      // Move e recicla a cidade junto com a pista para reforçar a sensação de corrida.
      scenery.forEach(item=>{item.position.z+=speed*dt;const length=item.userData.loopLength||336,limit=item.userData.recycleAt??25;while(item.position.z>limit)item.position.z-=length;if(graphics.worldRange)syncRenderRange(world,item)});
      for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.position.z+=speed*dt;if(graphics.worldRange)syncRenderRange(scene,o);if(o.userData.type==='money'){o.rotation.y+=dt*2.8;o.position.y=1.4+Math.sin(t*.004+o.userData.phase)*.18;if(Math.abs(o.position.z-4)<1.15&&Math.abs(o.position.x-player.position.x)<1.1&&y<2.2){money+=10;totalMoney+=10;saveBalance();playCoinSound();$('money').textContent=formatMoney(money);if(gameSettings.visualEffects){burst(o.position);$('flash').classList.remove('collect-flash');void $('flash').offsetWidth;$('flash').classList.add('collect-flash')}scene.remove(o);objects.splice(i,1);continue}}else if(Math.abs(o.position.z-4)<1.15&&Math.abs(o.position.x-player.position.x)<1.45){const h=o.userData.height,hit=h==='block'||(h==='low'&&y<1.15)||(h==='high'&&slidePoseWeight()<.8);if(hit){end();break}}if(o.position.z>18){scene.remove(o);objects.splice(i,1)}}
      while(spawnZ>-230)spawnRow();spawnZ+=speed*dt;const distanceLabel=`${Math.floor(distance)} m`;if($('distance').textContent!==distanceLabel)$('distance').textContent=distanceLabel;const level=Math.min(5,1+Math.floor((speed-18)/4.5));if(level!==lastSpeedLevel){lastSpeedLevel=level;speedIndicators.forEach((e,i)=>e.classList.toggle('on',i<level))}
    }
    if(state!=='paused')particles.forEach((p,i)=>{p.userData.vel.y-=9*dt;p.position.addScaledVector(p.userData.vel,dt);p.rotation.x+=dt*6;if(p.position.y<0){scene.remove(p);particles.splice(i,1)}});
    camera.position.x+=(player.position.x*.3-camera.position.x)*dt*4;camera.position.y+=(6.2+y*.22-camera.position.y)*dt*5;const runningCameraDistance=state==='playing'||state==='paused'?12.65:11.25;camera.position.z+=(runningCameraDistance-camera.position.z)*dt*3;if(shake>0){shake-=dt;camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake}
    const animateBackdrop=state==='menu'&&!$('menu').classList.contains('hidden')&&t-lastWorldFrame>=graphics.menuInterval;
    if(!graphics.menuInterval||renderDirty||state!==lastVisualState||state==='playing'||(state==='over'&&shake>0)||animateBackdrop){
      for(const tree of trees){
        if(graphics.windRange&&(tree.position.z< -graphics.windRange||tree.position.z>24))continue;
        const breeze=t*.00045+tree.userData.windPhase;
        tree.userData.canopy.rotation.z=Math.sin(breeze)*.012;
        tree.userData.canopy.rotation.x=Math.sin(breeze*.73)*.006;
      }
    // BEGIN GILBERT TEST — consumes existing state without changing it.
      if(gilbertVisualTest)gilbertVisualTest.update({player,state,speed,dt,verticalPosition:y,verticalVelocity:jumpV,sliding,slidePhase:slideAnimationPhase(),character:selectedCharacter});
    // END GILBERT TEST
      updateRainRace(dt);
      if(nightMode){nightFill.position.set(player.position.x-3,7+y*.25,12);nightFillTarget.position.set(player.position.x,1.7+y*.25,2)}
      camera.lookAt(player.position.x*.18,1.45,-8);
      renderer.render(scene,camera);
      renderDirty=false;
      lastWorldFrame=t;
      lastVisualState=state;
    }
    renderPanels(dt,t);
  }
  let fpsFrames=0,fpsTimestamp=performance.now();function loop(now){const dt=Math.min(.04,(now-last)/1000);last=now;update(dt,now);fpsFrames++;if(now-fpsTimestamp>=500){if(gameSettings.showFps)$('fps-counter').textContent=`FPS: ${Math.round(fpsFrames*1000/(now-fpsTimestamp))}`;fpsFrames=0;fpsTimestamp=now}requestAnimationFrame(loop)}
  function syncRenderRange(parent,item){
    // Detach distant groups from rendering while the original simulation keeps moving them.
    const range=(item.userData.visualDetail&&graphics.detailRange)||graphics.worldRange;
    const visible=!range||(item.position.z>=-range&&item.position.z<=44);
    if(visible&&item.parent!==parent)parent.add(item);
    else if(!visible&&item.parent===parent)parent.remove(item);
  }
  function configureShadow(renderer,light,size){
    if(renderer)renderer.shadowMap.enabled=size>0;
    light.castShadow=size>0;
    if(!size){
      light.shadow.map?.dispose();
      light.shadow.map=null;
      return;
    }
    light.shadow.mapSize.set(size,size);
    light.shadow.map?.setSize(size,size);
  }
  function setPanelRatio(renderer,limit){
    if(!renderer)return;
    const ratio=Math.min(devicePixelRatio,limit);
    if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
  }
  function configureHouseRenderer(){
    configureShadow(houseRenderer,houseSun,graphics.shadowSize);
    if(!houseRenderer)return;
    houseRenderer.shadowMap.autoUpdate=!graphics.panelInterval;
    houseRenderer.shadowMap.needsUpdate=true;
    setPanelRatio(houseRenderer,graphics.houseRatio);
  }
  function applyRenderQuality(){
    graphics=graphicsProfiles[gameSettings.graphicsMode];
    $('game').dataset.graphicsMode=gameSettings.graphicsMode;
    camera.far=graphics.cameraFar;
    scene.fog.near=graphics.fogNear;
    scene.fog.far=graphics.fogFar;
    configureShadow(renderer,sun,graphics.shadowSize);
    configureHouseRenderer();
    setPanelRatio(characterRenderer,graphics.shopRatio);
    if(graphics.simpleRoad){
      simpleRoadMaterial??=new THREE.MeshLambertMaterial({color:MAT.road.color});
      road.material=simpleRoadMaterial;
    }else road.material=MAT.road;
    updateNightMaterials();
    for(const item of scenery)syncRenderRange(world,item);
    for(const item of objects)syncRenderRange(scene,item);
    lastPanelFrame=-Infinity;
    panelTime=0;
    resize();
  }
  function resize(){
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    const originalRatio=Math.min(devicePixelRatio,1.6);
    const ratio=graphics.ratio
      ?Math.min(originalRatio*graphics.ratio,graphics.maxRatio,Math.sqrt(graphics.pixelBudget/(innerWidth*innerHeight)))
      :originalRatio;
    renderer.setDrawingBufferSize(innerWidth,innerHeight,ratio);
    renderDirty=true;
  }
  addEventListener('resize',resize);
  applyRenderQuality();
  // Wait for the first rendered frame, then reveal the menu.
  renderer.compile(scene,camera);requestAnimationFrame(()=>{$('loading').classList.add('hidden');$('menu').classList.remove('hidden');requestAnimationFrame(loop)});
})();
