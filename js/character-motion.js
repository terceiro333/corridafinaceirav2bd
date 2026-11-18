function createGilbertMotion(THREE,model,profile={}){
 const space=model.parent,bones=[],named={},rest=new Map(),V=THREE.Vector3,Q=THREE.Quaternion;
 model.traverse(o=>{if(o.isBone){bones.push(o);named[o.name.replaceAll(':','')]=o;rest.set(o,{q:o.quaternion.clone(),p:o.position.clone(),s:o.scale.clone()})}});
 const bone=name=>named['mixamorig'+name];
 for(const name of ['Hips','Head','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase'])if(!bone(name))throw Error('Gilbert rig incomplete: '+name);
 function update(){space.updateMatrixWorld(true)}
 function point(b){return space.worldToLocal(b.getWorldPosition(new V()))}
 function restore(){for(const b of bones){const r=rest.get(b);b.quaternion.copy(r.q);b.position.copy(r.p);b.scale.copy(r.s)}update()}
 restore();
 const hipsRest=point(bone('Hips')),legs={};
 for(const side of ['Left','Right']){
  const hip=point(bone(side+'UpLeg')),knee=point(bone(side+'Leg')),ankle=point(bone(side+'Foot')),toe=point(bone(side+'ToeBase'));
  legs[side]={hip,knee,ankle,toeDir:toe.sub(ankle).normalize(),upper:hip.distanceTo(knee),lower:knee.distanceTo(ankle)};
 }
 const stride=profile.stride??.84,nominalSpeed=18/(3.95/1.8);
 let phase=0,lastInfo={};
 function gait(speed){const s=Math.max(.1,speed),period=THREE.MathUtils.clamp(.50-(s-nominalSpeed)*.016,.36,.55);return {speed:s,period,stance:THREE.MathUtils.clamp(stride/(s*period),.10,.40)}}
 function trajectory(side,p,speed){const g=gait(speed),f=((p%1)+1)%1,r=legs[side],front=stride/2;let z,y=0,contact=f<g.stance;
  if(contact){z=front-g.speed*g.period*f}
  else{const u=(f-g.stance)/(1-g.stance),u2=u*u,u3=u2*u,m=-Math.min(1.1,stride*(1-g.stance)/g.stance);z=(2*u3-3*u2+1)*(-front)+(u3-2*u2+u)*m+(-2*u3+3*u2)*front+(u3-u2)*m;y=(profile.swingHeight??.25)*Math.sin(Math.PI*u)}
  return {target:new V(r.ankle.x,r.ankle.y+.004+y,r.ankle.z+z),contact,progress:f,...g};
 }
 function rotateWorld(b,q){const w=b.getWorldQuaternion(new Q()),parent=b.parent.getWorldQuaternion(new Q());b.quaternion.copy(parent.invert().multiply(q.clone().multiply(w)));update()}
 function aim(name,child,dir){const b=bone(name),c=bone(child);if(!b||!c)return;const axis=c.getWorldPosition(new V()).sub(b.getWorldPosition(new V())).normalize(),target=dir.clone().transformDirection(space.matrixWorld);rotateWorld(b,new Q().setFromUnitVectors(axis,target))}
 function lift(y){const hips=bone('Hips'),p=hipsRest.clone();p.y+=y;space.localToWorld(p);hips.position.copy(hips.parent.worldToLocal(p));update()}
 function lean(angle){rotateWorld(bone('Hips'),new Q().setFromAxisAngle(new V(1,0,0).transformDirection(space.matrixWorld),angle))}
 function solveLeg(side,target){const r=legs[side],hip=point(bone(side+'UpLeg')),direction=target.clone().sub(hip),requested=direction.length(),d=THREE.MathUtils.clamp(requested,Math.abs(r.upper-r.lower)+.002,r.upper+r.lower-.001);direction.normalize();
  const bend=new V(0,0,1).addScaledVector(direction,-direction.z).normalize(),along=(r.upper*r.upper-r.lower*r.lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,r.upper*r.upper-along*along));
  const knee=hip.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  aim(side+'UpLeg',side+'Leg',knee.clone().sub(hip));
  aim(side+'Leg',side+'Foot',target.clone().sub(point(bone(side+'Leg'))));
  aim(side+'Foot',side+'ToeBase',r.toeDir);
  return requested<=r.upper+r.lower-.001;
 }
 function arms(side,angle,elbow){const s=side==='Left'?1:-1;aim(side+'Arm',side+'ForeArm',new V(s*.20,-Math.cos(angle),Math.sin(angle)));aim(side+'ForeArm',side+'Hand',new V(s*.10,-Math.cos(angle+elbow),Math.sin(angle+elbow)))}
 function pose(kind,p,speed=nominalSpeed,options={}){
  restore();const g=gait(speed),foot={};let reachable=true;
  if(kind==='run'){
   lift(-(profile.hipDrop??.19)+.006*(1-Math.cos(p*4*Math.PI)));lean(.10);
   for(const [side,offset]of [['Left',0],['Right',.5]]){const f=trajectory(side,p+offset,speed);foot[side]=f;reachable=solveLeg(side,f.target)&&reachable;const relative=f.target.z-legs[side].ankle.z;arms(side,-THREE.MathUtils.clamp(relative/(stride/2),-1,1)*.65,1.15)}
  }else if(kind==='jump'){
   const f=Math.sin(Math.PI*THREE.MathUtils.clamp(p,0,1));lift(options.externalJump?0:.48*f);lean(.04);
   for(const side of ['Left','Right']){const s=side==='Left'?1:-1,a=.25+.4*f;aim(side+'UpLeg',side+'Leg',new V(s*.04,-Math.cos(a),Math.sin(a)));aim(side+'Leg',side+'Foot',new V(s*.025,-Math.cos(a-.7*f),Math.sin(a-.7*f)));aim(side+'Foot',side+'ToeBase',legs[side].toeDir);arms(side,.9*f,.4)}
  }else if(kind==='slide'){
   // Bone-space seated slide: +Z is the model's forward direction. Both visual
   // adapters rotate that direction toward the track; the controller stays upright.
   const t=THREE.MathUtils.clamp(p,0,1),elapsed=t*2.72,smooth=v=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v)},weight=smooth(elapsed/.1296)*(1-smooth((elapsed-(2.72-.1656))/.1656));
   // Baked Rain entry/exit share the run clip's first pose. The live Gilbert
   // adapter supplies its gait phase. Equal blend weights then produce exactly
   // the same pose when an early release moves the cursor to the exit section.
   pose('run',options.runPhase??0,speed);
   const running=new Map(bones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}])),runFeet=Object.fromEntries(['Left','Right'].map(side=>[side,point(bone(side+'Foot'))])),slideFeet={};
   restore();lift(.25-hipsRest.y);lean(-.90);
   for(const side of ['Left','Right']){
    const r=legs[side],hip=point(bone(side+'UpLeg')),target=new V(r.ankle.x,.12,hip.z+(r.upper+r.lower)*(side==='Left'?.94:.65));
    slideFeet[side]=target;reachable=solveLeg(side,target)&&reachable;
    aim(side+'Foot',side+'ToeBase',new V(0,.45,1));arms(side,-1.3,.6);
   }
   rotateWorld(bone('Head'),new Q().setFromAxisAngle(new V(1,0,0).transformDirection(space.matrixWorld),.12));
   for(const b of bones){const run=running.get(b);b.quaternion.slerpQuaternions(run.q,b.quaternion.clone(),weight);b.position.lerpVectors(run.p,b.position.clone(),weight)}
   // Re-solve contact after blending: interpolated knee rotations alone can send
   // the soles through the floor even when both endpoint poses are valid.
   update();for(const side of ['Left','Right']){reachable=solveLeg(side,runFeet[side].clone().lerp(slideFeet[side],weight))&&reachable;aim(side+'Foot',side+'ToeBase',legs[side].toeDir.clone().lerp(new V(0,.45,1).normalize(),weight).normalize())}
  }else{
   for(const side of ['Left','Right'])arms(side,.025*Math.sin(p*2*Math.PI),.12);
  }
  update();lastInfo={kind,phase:p,speed:g.speed,period:g.period,stance:g.stance,stride,reachable,feet:foot,root:point(bone('Hips')).toArray()};return lastInfo;
 }
 function advance(dt,speed){const g=gait(speed);phase=(phase+Math.max(0,dt)/g.period)%1;return phase}
 function clips(speed=nominalSpeed){const clips=new Map();for(const [kind,duration]of [['idle',2.2],['run',gait(speed).period],['jump',1.35],['slide',2.72]]){const count=kind==='run'?120:40,times=[],data=new Map(bones.map(b=>[b,{q:[],p:[]}])),phases=Array.from({length:count+1},(_,i)=>i/count);
  // Keep dense keys in the short entry/exit, rather than stretching transitions.
  if(kind==='slide')for(let i=0;i<=8;i++)phases.push(i/8*.1296/duration,(duration-.1656+i/8*.1656)/duration);
  // Contact boundaries are explicit keys: never interpolate an airborne pose into a planted foot.
  if(kind==='run')phases.push(gait(speed).stance,gait(speed).stance+.5);
  for(const t of [...new Set(phases)].sort((a,b)=>a-b)){times.push(t*duration);pose(kind,t,speed);for(const b of bones){data.get(b).q.push(...b.quaternion.toArray());data.get(b).p.push(...b.position.toArray())}}const tracks=[];for(const b of bones){tracks.push(new THREE.QuaternionKeyframeTrack(b.uuid+'.quaternion',times,data.get(b).q));if(b===bone('Hips'))tracks.push(new THREE.VectorKeyframeTrack(b.uuid+'.position',times,data.get(b).p))}clips.set(kind,new THREE.AnimationClip(kind,duration,tracks))}restore();return clips}
 return {pose,advance,clips,gait,trajectory,bones: bones.length,nominalSpeed,info:()=>lastInfo,reset:()=>{phase=0;restore()}};
}

