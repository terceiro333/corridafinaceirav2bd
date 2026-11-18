/* Rain Rig (CC) Blender Foundation | studio.blender.org — CC BY 4.0.
   Approved Phase A adaptation; shared immutable asset, independent rigs/mixers. */
window.CorridaRain=(()=>{
 let templatePromise,parseCount=0;
 function load(){return templatePromise||(templatePromise=new Promise((resolve,reject)=>{
  parseCount++;new GLTFLoader().parse(Uint8Array.from(atob(MODEL_BASE64),c=>c.charCodeAt(0)).buffer,'',g=>{
   try{const model=g.scene;model.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(model);model.scale.multiplyScalar(1.8/(b.max.y-b.min.y));model.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(model);const c=b.getCenter(new THREE.Vector3());model.position.add(new THREE.Vector3(-c.x,-b.min.y,-c.z));const space=new THREE.Group();space.add(model);space.updateMatrixWorld(true);
    const motion=createGilbertMotion(THREE,model,{stride:.66,hipDrop:.09,swingHeight:.20}),clips=new Map();
    for(const speed of [18,27,39]){const set=motion.clips(speed/(3.95/1.8));clips.set('run'+speed,set.get('run'));if(speed===18)for(const name of ['idle','jump','slide'])clips.set(name,set.get(name))}
    const times=[0,.12,.28,.4],data=new Map();model.traverse(b=>{if(b.isBone)data.set(b,{q:[],p:[]})});
    for(const t of times){motion.pose('run',.12,motion.nominalSpeed);const f=t/.4;for(const [b,d]of data){if(b.name.replaceAll(':','')==='mixamorigHips'){b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.22*f));b.position.y-=.04*f}d.q.push(...b.quaternion.toArray());d.p.push(...b.position.toArray())}}
    const tracks=[];for(const[b,d]of data){tracks.push(new THREE.QuaternionKeyframeTrack(b.uuid+'.quaternion',times,d.q));if(b.name.replaceAll(':','')==='mixamorigHips')tracks.push(new THREE.VectorKeyframeTrack(b.uuid+'.position',times,d.p))}clips.set('collision',new THREE.AnimationClip('collision',.4,tracks));
    motion.reset();resolve({model,clips});
   }catch(e){reject(e)}
  },reject);
 }).catch(e=>{templatePromise=null;throw e}))}
 async function create(){const template=await load(),model=template.model.clone(true),map=new Map(),uuids=new Map();
  function pair(a,b){map.set(a,b);uuids.set(a.uuid,b.uuid);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i])}pair(template.model,model);
  template.model.traverse(a=>{if(!a.isMesh)return;const b=map.get(a);b.material=a.material.clone();b.castShadow=b.receiveShadow=true;if(a.isSkinnedMesh){b.skeleton=a.skeleton.clone();b.skeleton.bones=a.skeleton.bones.map(x=>map.get(x));b.bindMatrix.copy(a.bindMatrix);b.bind(b.skeleton,b.bindMatrix)}});
  const root=new THREE.Group();root.name='RainVisual';root.add(model);root.scale.setScalar(3.95/1.8);let shirt;model.traverse(o=>{if(o.name==='Jersey_Separate')shirt=o});
  const mixer=new THREE.AnimationMixer(model),actions=new Map();for(const [name,clip]of template.clips){const copy=clip.clone();for(const track of copy.tracks){const at=track.name.indexOf('.');track.name=uuids.get(track.name.slice(0,at))+track.name.slice(at)}actions.set(name,mixer.clipAction(copy))}
  let current=null,lastTexture=null,ownedTexture=null,revision=0;
  function setShirt(source){if(!source?.image||source===lastTexture)return;lastTexture=source;window.CorridaJerseyDetails?.(shirt,source);const c=document.createElement('canvas');c.width=c.height=1024;const q=c.getContext('2d');q.fillStyle='#101820';q.fillRect(0,0,1024,1024);for(const x of [30.72,542.72])q.drawImage(source.image,0,0,256,384,x,30.72,450.56,737.28);q.drawImage(source.image,0,0,256,95,0,849,1024,134);const t=window.CorridaTerceiroAtlas?.(source,'rain')??new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.anisotropy=4;shirt.material.map=t;shirt.material.color.setHex(0xffffff);shirt.material.needsUpdate=true;ownedTexture?.dispose();ownedTexture=t;revision++}
  function play(name){const next=actions.get(name);if(next===current)return;next.reset().setEffectiveWeight(1);if(name==='slide'){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;next.timeScale=0}if(name==='collision'){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true}next.play();if(current)next.crossFadeFrom(current,.10,false);current=next}
  function update(dt,kind='idle',speed=18,phase=0){let name=kind;if(kind==='run'){const bank=speed<22.5?18:speed<33?27:39;name='run'+bank;actions.get(name).timeScale=speed/bank}play(name);if(kind==='jump'||kind==='slide')current.time=phase*current.getClip().duration;mixer.update(dt);root.userData.rainRevision=revision;root.userData.rainState=kind}
  update(0);return {root,mixer,setShirt,update,get parseCount(){return parseCount},get revision(){return revision}};
 }
 return {create};
})();
