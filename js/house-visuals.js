/* Presentation only. No balance, storage, level or upgrade ownership lives here. */
window.CorridaHouseVisuals = (() => {
  let kit;
  function resources(T) {
    if (kit) return kit;
    const mat = (color, roughness=.85, extra={}) => new T.MeshStandardMaterial({color,roughness,...extra});
    function surface(base, lines, roof=false) {
      const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');q.fillStyle=base;q.fillRect(0,0,128,128);
      for(let i=0;i<900;i++){const x=(i*47)%128,y=(i*83+Math.floor(i/128)*17)%128;q.fillStyle=i%2?'#ffffff09':'#00000009';q.fillRect(x,y,1,1)}
      if(lines){q.strokeStyle=lines;q.lineWidth=roof?2:1;for(let y=0;y<=128;y+=roof?16:32){q.beginPath();q.moveTo(0,y);q.lineTo(128,y);q.stroke();for(let x=(y%64?16:0);x<128;x+=roof?16:32){q.beginPath();q.moveTo(x,y);q.lineTo(x,y+(roof?16:32));q.stroke()}}}
      const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(3,2);return tex;
    }
    const m={plaster:mat(0xe5d9bc,.94,{map:surface('#ded0b0')}),old:mat(0xb6a384,1,{map:surface('#cfbea1')}),white:mat(0xefeee6,.86),cream:mat(0xe5d2ac),slate:mat(0x38464a,.78),wood:mat(0x835b3c,.8,{map:surface('#a78259','#69513c')}),stone:mat(0xb6b3a5,.97,{map:surface('#c8c5b9','#9b9a91')}),brick:mat(0x9b624b,1,{map:surface('#d0ab8e','#746656')}),roof:mat(0xc17c57,.93,{map:surface('#ca997a','#6f4c3b',true)}),oldRoof:mat(0x776052,.98,{map:surface('#b5a089','#5d5049',true)}),metal:mat(0x33434a,.48,{metalness:.3}),glass:mat(0x4b8090,.24,{metalness:.35}),curtain:mat(0xd7ceb8),lawn:mat(0x638658,1,{map:surface('#a0b190')}),dry:mat(0x8c8864,1,{map:surface('#a3a183')}),soil:mat(0x655442),leaf:mat(0x487647),leafLight:mat(0x6d8e50),bark:mat(0x63513d),water:mat(0x4caebd,.18,{metalness:.3}),pool:mat(0xcbd7d0,.65),light:mat(0xffe0a3,.65,{emissive:0xffc56f,emissiveIntensity:.7}),flower:mat(0xd79d82),wear:mat(0x988e75),curb:mat(0x919893),street:mat(0x4c5557)};
    kit={m,box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,10,7),cylinder:new T.CylinderGeometry(1,1,1,10)};return kit;
  }
  function build(T,level) {
    const {m,box,sphere,cylinder}=resources(T),root=new T.Group(),parts=[];
    function add(geo,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){const o=new T.Object3D();o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.updateMatrix();parts.push({geo,material,matrix:o.matrix});}
    const b=(w,h,d,material,x,y,z,rx=0,ry=0,rz=0)=>add(box,material,x,y,z,w,h,d,rx,ry,rz);
    const ball=(x,y,z,sx,sy,sz,material)=>add(sphere,material,x,y,z,sx,sy,sz);
    const post=(x,y,z,r,h,material)=>add(cylinder,material,x,y,z,r,h,r);
    // Local facade coordinates allow the same complete openings on all four sides.
    function opening(cx,y,cz,w,h,angle=0,door=false,lux=false) {
      const a=Math.cos(angle),s=Math.sin(angle),put=(ww,hh,dd,mt,x,yy,z)=>b(ww,hh,dd,mt,cx+x*a+z*s,y+yy,cz-x*s+z*a,0,angle);
      put(w+.22,h+.22,.12,m.slate,0,0,0);put(w,h,.06,door?m.wood:m.glass,0,0,.085);
      for(const x of [-w/2,w/2])put(.065,h+.14,.13,lux?m.metal:m.white,x,0,.09);
      for(const yy of [-h/2,h/2])put(w+.14,.07,.13,lux?m.metal:m.white,0,yy,.09);
      if(door){put(.055,.28,.06,m.metal,w*.33,0,.145);for(let i=0;i<4;i++)put(w-.17,.025,.018,m.bark,0,-h*.32+i*h*.21,.121)}
      else {put(.045,h,.07,m.metal,0,0,.13);put(w,.04,.07,m.metal,0,h*.12,.13);put(w*.16,h*.84,.012,m.curtain,-w*.36,0,.122);put(w*.07,h*.8,.012,m.curtain,w*.4,0,.122);put(w+.33,.095,.3,m.stone,0,-h/2-.085,.04);put(w*.35,.025,.008,m.white,-w*.16,h*.27,.125);}
    }
    function roof(x,z,w,d,y,rise,old=false){const len=Math.hypot(w/2,rise),a=Math.atan2(rise,w/2),mroof=old?m.oldRoof:m.roof;
      b(len,.12,d,mroof,x-w/4,y+rise/2,z,0,0,a);b(len,.12,d,mroof,x+w/4,y+rise/2,z,0,0,-a);
      // Closed gables, under the two roof slopes; no inverted pyramids or open ends.
      const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();const geo=new T.ShapeGeometry(shape);geo.userData.houseOwned=true;
      // Gables close the walls behind the eaves. At z +/- d/2 they shared a
      // plane with the slab end caps, overlapping along both sloping edges.
      const gableInset=.08;
      add(geo,old?m.old:m.cream,x,y,z+d/2-gableInset,1,1,1);add(geo,old?m.old:m.cream,x,y,z-d/2+gableInset,1,1,1,0,Math.PI);
      for(const side of [-1,1])b(w+.1,.12,.12,m.white,x,y-.01,z+side*d/2);
      // A single cap covers the seam; the old loop added two identical caps.
      b(.2,.13,d+.06,mroof,x,y+rise+.08,z);for(const side of [-1,1]){b(.1,.14,d,m.metal,x+side*w/2,y-.05,z);post(x+side*(w/2-.08),y/2,z+d/2-.12,.04,y,m.metal)}
    }
    function tree(x,z,s=1){post(x,s*.9,z,.12*s,1.8*s,m.bark);for(const [dx,dy,dz,r] of [[0,2.2,0,.8],[-.45,1.9,.1,.63],[.45,2.05,.15,.68],[.1,2.7,-.05,.59]])ball(x+dx*s,dy*s,z+dz*s,r*s,r*s*.85,r*s,dy>2.3?m.leafLight:m.leaf);b(1.9*s,.14,1.7*s,m.soil,x,.09,z)}
    function bed(x,z,w,d){b(w,.16,d,m.stone,x,.1,z);b(w-.16,.05,d-.16,m.soil,x,.2,z);for(let i=0;i<Math.ceil(w/.55);i++){const xx=x-w/2+.32+i*.5;ball(xx,.48,z,.32,.3,.31,m.leaf);if(level>=3)ball(xx+.08,.7,z+.04,.075,.06,.075,m.flower)}}
    function lamp(x,z){b(.12,.63,.12,m.metal,x,.4,z);b(.19,.12,.19,m.light,x,.74,z);b(.23,.04,.23,m.metal,x,.82,z)}
    function garage(x,z,w,d,h){b(w,h,d,m.white,x,h/2+.18,z);b(w+.24,.2,d+.2,m.slate,x,h+.22,z);b(w-.35,h-.4,.07,m.metal,x,h/2+.1,z+d/2+.05);for(let i=0;i<9;i++)b(w-.4,.035,.04,m.stone,x,.4+i*(h-.6)/9,z+d/2+.1);b(.55,.08,.06,m.light,x,h-.16,z+d/2+.12);}
    function flat(x,z,w,d,h,material){b(w,h,d,material,x,h/2+.18,z);b(w+.2,.18,d+.2,m.slate,x,h+.23,z);for(const xx of [-1,1])b(.12,.25,d+.16,m.white,x+xx*w/2,h+.42,z);for(const zz of [-1,1])b(w,.25,.12,m.white,x,h+.42,z+zz*d/2);}
    // Continuous ground beyond the lot: five finite tiles with shared edges.
    // The old thick 17x16 slab exposed its cut edges against the sky.
    const turf=level===1?m.dry:m.lawn;
    b(24,.3,20,turf,0,-.09,-2); // lawn top .06; lot spans x +/-12, z -12..8
    b(28,.3,48,turf,-26,-.09,-16);b(28,.3,48,turf,26,-.09,-16);
    b(24,.3,28,turf,0,-.09,-26);b(80,.3,24.3,m.lawn,0,-.09,27.85);
    // A full street and the opposite verge give the foreground a real context.
    b(80,.12,6,m.street,0,-.04,11);b(80,.16,1.6,m.stone,0,.04,7.15);
    b(80,.2,.14,m.curb,0,.05,7.93);b(80,.16,1.7,m.stone,0,.04,14.85);
    b(80,.2,.14,m.curb,0,.05,14.03);
    for(let x=-36;x<=36;x+=6)b(2.5,.008,.09,m.white,x,.025,11);
    const pathWidth=level<3?1.55:level===3?2:1.45,pathX=level<4?0:-2.7;
    // Continuous bedding under the pavers connects the lowest step to the pavement.
    b(pathWidth+.16,.08,4.9,m.stone,pathX,.08,4.5);
    for(let i=0;i<8;i++)b(pathWidth,.07,.59,level===1?m.stone:m.white,pathX,.125,2.35+i*.6);
    // Soft lot limits and restrained landscaping, kept clear of all access routes.
    for(const side of [-1,1]){b(.22,.1,14,m.soil,side*10.3,.07,-2);for(const z of [-8,-4,0,4]){if(level>=2)ball(side*10.3,.4,z,.4,.33,.65,m.leaf);else ball(side*10.3,.17,z,.25,.12,.4,m.leafLight)}}
    if(level>=2){tree(-9.1,-8,.9);tree(9,-8.3,.85);}
    for(const x of [-12,12])tree(x,18,.9);
    if(level<4){const w=level===1?5.4:level===2?6:7,d=level===3?4.8:4.3,h=level===1?2.65:3.0,z=-.75,front=z+d/2;
      b(w+.22,.3,d+.2,m.brick,0,.25,z);b(w,h,d,level===1?m.old:level===2?m.plaster:m.white,0,h/2+.35,z);b(w+.12,.2,d+.12,m.stone,0,.52,z);
      // Foundation intersects the lawn and supports the masonry base (previously .04 above it).
      b(w+.38,.16,d+.36,m.stone,0,.06,z);
      roof(0,z,w+.65,d+.65,h+.35,level===3?1.25:1.0,level===1);
      opening(0,1.47,front+.04,1.02,2.2,0,true);for(const x of [-w*.31,w*.31])opening(x,1.95,front+.04,level===3?1.5:1.15,1.2);
      for(const side of [-1,1]){opening(side*(w/2+.03),1.95,z,1.1,1.25,side*Math.PI/2);if(level!==3||side===1)opening(side*1.5,1.9,z-d/2-.04,1.15,1.2,Math.PI)}
      for(let i=0;i<2;i++)b(1.65+i*.25,.16, .45,m.stone,0,.25-i*.08,front+.35+i*.38);
      if(level===1){for(const [x,y,wid] of [[-2.3,.8,.5],[2.2,1,.65],[-.8,2.5,.3]])b(wid,.11,.016,m.wear,x,y,front+.012);b(.56,.55,.42,m.brick,1.65,h+1.1,-1.7);for(const x of [-4,-2.8,-1.6,1.6,2.8,4])b(.11,.8,.1,m.wood,x,.45,5.5);for(const x of [-2.8,2.8])b(2.5,.065,.08,m.wood,x,.65,5.5);}
      if(level>=2){tree(-5.8,-1.8,.8);bed(-2.9,3.15,2.1,.8);bed(2.9,3.15,2.1,.8);b(1.85,.12,1.1,m.wood,0,2.7,front+.5);for(const x of [-.82,.82])b(.09,2.5,.09,m.white,x,1.45,front+.85);}
      if(level===3){tree(5.7,-2,1);bed(-5,3.8,1.3,1.3);bed(5,3.8,1.3,1.3);for(const x of [-1.3,1.3])lamp(x,4.5);b(2.1,2.3,2,m.brick,-2.4,1.5,-3.2);b(2.25,.38,2.16,m.stone,-2.4,.16,-3.2);opening(-2.4,1.65,-4.24,.9,.95,Math.PI);roof(-2.4,-3.2,2.6,2.4,2.65,.65);for(const x of [-.9,.9]){b(.12,.28,.13,m.metal,x,2.25,front+.15);b(.08,.16,.08,m.light,x,2.25,front+.23)} }
    }else{
      const luxury=level===5,h=luxury?3.05:2.9;
      flat(-1.25,-1.0,6.1,5.0,h,m.white);garage(4,-.85,luxury?4.1:3.5,5.3,2.65);
      b(6.3,.26,5.2,m.stone,-1.25,.06,-1);b(luxury?4.3:3.7,.26,5.5,m.stone,4,.06,-.85);
      b(1.7,.19,.65,m.stone,-2.7,.18,1.95);b(1.85,.12,.55,m.stone,-2.7,.12,2.4);
      b(1.7,h,.16,m.wood,-2.7,h/2+.2,1.57);for(let i=0;i<9;i++)b(.045,h,.025,m.bark,-3.45+i*.18,h/2+.2,1.67);
      opening(-2.7,1.5,1.7,1.05,2.35,0,true,true);opening(.35,1.7,1.58,2.25,2.05,0,false,true);
      opening(-4.34,1.7,-.9,2.5,1.8,-Math.PI/2,false,true);opening(-.8,1.65,-3.56,3.7,1.9,Math.PI,false,true);
      flat(-1.85,-1.55,luxury?6.1:3.8,3.55,luxury?2.55:2.25,m.cream); // elevate complete second floor including its roof
      const upperStart=parts.length; // relocate only the upper assembly created just above
      // Its components are the final six boxes: volume, slab and parapet on four sides.
      for(let i=upperStart-6;i<upperStart;i++)parts[i].matrix.elements[13]+=h+.25;
      const upperY=h+.25;
      opening(-1.85,upperY+1.42,.27,luxury?4.7:2.75,1.8,0,false,true);
      opening(-1.85,upperY+1.4,-3.37,luxury?3.5:2.6,1.65,Math.PI,false,true);
      opening(luxury?-4.94:-3.79,upperY+1.4,-1.4,2,1.7,-Math.PI/2,false,true);
      b(luxury?7:4.5,.18,1.55,m.stone,-1.8,upperY+.04,1.0);
      const bw=luxury?6.7:4.2;for(let i=0;i<Math.ceil(bw/.9);i++)b(.04,.88,.04,m.metal,-1.8-bw/2+i*.88,upperY+.55,1.72);b(bw,.05,.06,m.metal,-1.8,upperY+1,1.72);b(bw,.62,.035,m.glass,-1.8,upperY+.55,1.72);
      for(const x of [-3.5,-.25])b(.16,2.85,.16,m.slate,x,1.6,2.25);b(4,.18,1.0,m.slate,-1.85,3.1,2.0);
      b(3.7,.1,6.1,m.stone,4,.07,4.8);
      for(let i=0;i<12;i++)b(3.5,.07,.48,m.stone,4,.12,2.05+i*.5);
      b(3.7,.1,.65,m.stone,4,.055,8.05,-.13);
      bed(-6,3.7,2.3,1.1);bed(1.25,4.5,1,2);tree(-6,-3.9,.9);tree(6.5,-4.5,.9);
      for(const [x,z]of [[-1.5,4.7],[1.5,4.7],[-5.8,2],[6.6,2]])lamp(x,z);
      if(luxury){
        // Front-side pool stays visible from the default camera, unlike the old rear pool.
        b(4.6,.15,3.1,m.wood,-4.8,.12,4.25);b(3.3,.14,2.15,m.pool,-4.9,.23,4.4);b(3.0,.05,1.85,m.water,-4.9,.32,4.4);
        for(let i=0;i<5;i++)b(.9,.008,.012,m.pool,-5.8+i*.38,.35,4.2+(i%2)*.35);
        for(const x of [-6,-3.7]){b(.56,.16,1.4,m.white,x,.39,2.3);b(.58,.2,.55,m.cream,x,.55,1.9, .3);}
        for(let i=0;i<8;i++){b(.08,.12,1.2,m.wood,-4.6+i*.24,5.98,1.35)}for(const x of [-4.6,-2.95])b(.07,2.7,.07,m.metal,x,4.65,1.85);
        bed(6.9,4.6,.9,3.0);bed(-6.4,-.1,1.5,1.5);tree(-6.7,-.5,.8);
        // Dual garage and boundary landscaping leave both driveway and entry open.
        b(.1,2.25,.14,m.white,4,1.3,1.9);for(const x of [2,6])b(.18,2.55,.2,m.stone,x,1.4,1.88);
        b(.16,.5,3,m.stone,7,.35,4.5);for(let i=0;i<8;i++)b(.06,.65,.04,m.metal,7,.85,3.15+i*.38);
        b(1.3,.09,.12,m.light,4,2.55,1.87);b(3.8,.06,.08,m.light,-1.7,5.9,.3);
      }
    }
    // Batch repeated primitives by material and geometry. No individual garden light sources.
    const batches=new Map();for(const p of parts){const key=p.geo.uuid+p.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p)}
    for(const list of batches.values()){const inst=new T.InstancedMesh(list[0].geo,list[0].material,list.length);list.forEach((p,i)=>inst.setMatrixAt(i,p.matrix));inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();root.add(inst)}
    root.userData.stats={parts:parts.length,drawBatches:batches.size};root.scale.setScalar(level>=4?.87:.95);return root;
  }
  return {build};
})();
