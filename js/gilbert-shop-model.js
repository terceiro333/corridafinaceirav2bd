/* Included inside gilbert-test.js by scripts/build-gilbert-shop.mjs.
   Uses the race bundle's exact GLB, GLTFLoader and createGilbertMotion.
   No controller, economy, save access, or shared animation state. */
window.CorridaGilbertTest.createShopModel=(()=>{
 let templatePromise=null,parseCount=0;
 function loadTemplate(){
  if(!templatePromise)templatePromise=new Promise((resolve,reject)=>{
   const bytes=Uint8Array.from(atob(MODEL_BASE64),c=>c.charCodeAt(0));parseCount++;
   new GLTFLoader().parse(bytes.buffer,'',gltf=>{
    try{
     const model=gltf.scene;model.updateMatrixWorld(true);
     const initial=new THREE.Box3().setFromObject(model);model.scale.multiplyScalar(1.8/(initial.max.y-initial.min.y));model.updateMatrixWorld(true);
     const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3());model.position.add(new THREE.Vector3(-center.x,-box.min.y,-center.z));model.updateMatrixWorld(true);
     resolve(model);
    }catch(error){reject(error)}
   },reject);
  }).catch(error=>{templatePromise=null;throw error});
  return templatePromise;
 }
 function cloneRig(source){
  // Object3D.clone alone leaves SkinnedMesh skeletons pointing at the old bones.
  const copy=source.clone(true),copies=new Map();
  function pair(a,b){copies.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i])}
  pair(source,copy);
  source.traverse(original=>{
   if(!original.isMesh)return;
   const mesh=copies.get(original);
   mesh.material=Array.isArray(original.material)?original.material.map(m=>m.clone()):original.material.clone();
   if(original.isSkinnedMesh){
    mesh.skeleton=original.skeleton.clone();
    mesh.skeleton.bones=original.skeleton.bones.map(b=>{
     const cloned=copies.get(b);if(!cloned)throw Error('Gilbert: bone outside cloned hierarchy');return cloned;
    });
    mesh.bindMatrix.copy(original.bindMatrix);mesh.bind(mesh.skeleton,mesh.bindMatrix);
   }
   mesh.castShadow=mesh.receiveShadow=true;
  });
  return copy;
 }
 return async function createShopModel(){
  const model=cloneRig(await loadTemplate()),root=new THREE.Group();root.name='GilbertShopPreview';root.add(model);root.updateMatrixWorld(true);
  let shirt;model.traverse(o=>{if(o.name==='Jersey_Separate'&&o.isSkinnedMesh)shirt=o});
  if(!shirt)throw Error('Gilbert: missing skinned jersey');
  const motion=createGilbertMotion(THREE,model);root.scale.setScalar(3.95/1.8);
  let shirtTexture=null,lastSkin=null,idleTime=0,shirtRevision=0;
  function setShirt(source,id){
   if(!source?.image||id===lastSkin)return;window.CorridaJerseyDetails?.(shirt,source);
   // Identical front/back/sleeve atlas layout to the character in the race.
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const context=canvas.getContext('2d');
   context.fillStyle='#101820';context.fillRect(0,0,1024,1024);
   for(const x of [30.72,542.72])context.drawImage(source.image,0,0,256,384,x,30.72,450.56,737.28);
   context.drawImage(source.image,0,0,256,95,0,849,1024,134);
   const texture=window.CorridaTerceiroAtlas?.(source)??new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.anisotropy=4;
   shirt.material.map=texture;shirt.material.color.setHex(0xffffff);shirt.material.needsUpdate=true;
   shirtTexture?.dispose();shirtTexture=texture;lastSkin=id;shirtRevision++;
  }
  function idle(dt){idleTime+=Math.max(0,dt);motion.pose('idle',(idleTime%2.2)/2.2)}
  idle(0);
  return {root,setShirt,idle,get skin(){return lastSkin},get revision(){return shirtRevision},get parseCount(){return parseCount}};
 };
})();
