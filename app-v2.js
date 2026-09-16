import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const mount=document.getElementById('scene');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0edf1f5);
scene.fog=new THREE.Fog(0xedf1f5,42,90);

const camera=new THREE.PerspectiveCamera(40,1,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;
mount.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.minDistance=4.2;
controls.maxDistance=70;
controls.maxPolarAngle=Math.PI*.49;

scene.add(new THREE.HemisphereLight(0xffffff,0x6a7584,2.15));
const sun=new THREE.DirectionalLight(0xfff5df,2.45);
sun.position.set(12,24,14); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-28; sun.shadow.camera.right=28; sun.shadow.camera.top=28; sun.shadow.camera.bottom=-28;
scene.add(sun);

const world=new THREE.Group(); scene.add(world);
const floors=new THREE.Group(),walls=new THREE.Group(),roof=new THREE.Group(),infra=new THREE.Group(),furniture=new THREE.Group(),labels=new THREE.Group(),ceiling=new THREE.Group(),bathDecor=new THREE.Group();
world.add(floors,walls,roof,infra,furniture,labels,ceiling,bathDecor);

const sx=25.54/(1338-95),sy=8.69/(727-279),ox=95,oy=727;
const X=p=>(p-ox)*sx, Z=p=>(oy-p)*sy, P=(px,py)=>({x:X(px),z:Z(py)});

function tex(size,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');draw(ctx,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t}
const plaster=tex(128,(c,s)=>{c.fillStyle='#f8f7f2';c.fillRect(0,0,s,s);for(let i=0;i<500;i++){c.fillStyle=`rgba(180,178,170,${.02+Math.random()*.035})`;c.fillRect(Math.random()*s,Math.random()*s,1+Math.random()*2,1+Math.random()*2)}},2,2);
const floorTex=tex(128,(c,s)=>{c.fillStyle='#ece9e3';c.fillRect(0,0,s,s);c.strokeStyle='rgba(150,145,137,.22)';for(const p of [0,s/2,s]){c.beginPath();c.moveTo(p,0);c.lineTo(p,s);c.stroke();c.beginPath();c.moveTo(0,p);c.lineTo(s,p);c.stroke()}},5,5);
const tileTex=tex(128,(c,s)=>{const q=16;for(let y=0;y<s;y+=q)for(let x=0;x<s;x+=q){c.fillStyle=['#ddd6c8','#c8b9a6','#e9e3d8','#bfa993'][((x+y)/q)%4|0];c.fillRect(x+1,y+1,q-2,q-2)}},3,4);

const matGreek=new THREE.MeshStandardMaterial({color:0xffffff,map:plaster,roughness:.98});
const matWood=new THREE.MeshStandardMaterial({color:0x8f6743,roughness:.72});
const matWoodDark=new THREE.MeshStandardMaterial({color:0x71513a,roughness:.76});
const matWhite=new THREE.MeshStandardMaterial({color:0xf8f7f3,roughness:.84});
const matCopper=new THREE.MeshStandardMaterial({color:0xb56e41,metalness:.72,roughness:.3});

const lotPts=[[95,726],[83,280],[1320,184],[1338,680]].map(([x,y])=>new THREE.Vector2(X(x),Z(y)));
const lotShape=new THREE.Shape(lotPts),lotGeo=new THREE.ShapeGeometry(lotShape);lotGeo.rotateX(-Math.PI/2);
const lot=new THREE.Mesh(lotGeo,new THREE.MeshStandardMaterial({color:0xa9cfa9,roughness:1}));lot.receiveShadow=true;lot.position.y=-.04;world.add(lot);

const roomMat=color=>new THREE.MeshStandardMaterial({color,map:floorTex,roughness:.92});
function floorRect(name,x1,y1,x2,y2,color){const w=X(x2)-X(x1),d=Z(y1)-Z(y2),o=new THREE.Mesh(new THREE.BoxGeometry(w,.055,d),roomMat(color));o.name=name;o.userData.kind='ambiente';o.position.set((X(x1)+X(x2))/2,.02,(Z(y1)+Z(y2))/2);o.receiveShadow=true;floors.add(o)}
function floorPoly(name,pts,color){const s=new THREE.Shape(pts.map(([x,y])=>new THREE.Vector2(X(x),Z(y)))),g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);const o=new THREE.Mesh(g,roomMat(color));o.name=name;o.userData.kind='ambiente';o.position.y=.026;o.receiveShadow=true;floors.add(o)}
floorRect('Lavanderia / varanda',280,269,369,628,0xbbb8a5);
floorRect('Banheiro social',280,628,402,699,0xc9c5d2);
floorRect('Quarto menor — 2 beliches',433,269,612,410,0xa9d7cf);
floorRect('Suíte maior',612,269,853,428,0xe7c4bc);
floorRect('Banheiro da suíte',853,269,952,412,0xc9c5d2);
floorPoly('Sala / cozinha integradas',[[369,269],[433,269],[433,410],[612,410],[612,510],[813,510],[813,699],[402,699],[402,628],[369,628]],0xe7dccb);
floorPoly('Jardim de inverno',[[612,428],[853,428],[853,699],[813,699],[813,510],[612,510]],0xa9d2ad);
floorRect('Garagem coberta',1032,240,1324,445,0xa7adb6);

const H=3,T=.14;
function wall(x1,y1,x2,y2,h=H){const ax=X(x1),az=Z(y1),bx=X(x2),bz=Z(y2),len=Math.hypot(bx-ax,bz-az),o=new THREE.Mesh(new THREE.BoxGeometry(len,h,T),matGreek);o.name='Parede — reboco grego branco';o.userData.kind='acabamento';o.position.set((ax+bx)/2,h/2,(az+bz)/2);o.rotation.y=-Math.atan2(bz-az,bx-ax);o.castShadow=true;o.receiveShadow=true;walls.add(o)}
[[280,269,952,269],[280,269,280,699],[280,699,853,699],[952,269,952,412],[853,269,853,412],[853,428,853,699],[369,269,369,628],[402,628,402,699],[280,628,402,628],[433,269,433,410],[433,410,612,410],[612,269,612,510],[612,428,853,428],[612,510,813,510],[813,510,813,699],[853,412,952,412]].forEach(v=>wall(...v));

function box(parent,w,h,d,mat,x,y,z,name='',kind='mobiliário'){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.name=name;o.userData.kind=kind;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function cyl(parent,r,h,mat,x,y,z,name='',kind='mobiliário'){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat);o.position.set(x,y,z);o.name=name;o.userData.kind=kind;o.castShadow=true;parent.add(o);return o}
function infraCylinder(name,px,py,diam,h,color,opacity=.55){const o=new THREE.Mesh(new THREE.CylinderGeometry(diam/2,diam/2,h,40),new THREE.MeshStandardMaterial({color,roughness:.68,transparent:opacity<1,opacity}));o.name=name;o.userData.kind='infraestrutura';o.position.set(X(px),h/2,Z(py));o.castShadow=true;infra.add(o)}
infraCylinder('Cisterna — Ø 2,00 m útil × 2,47 m',1135,385,2,2.47,0x67aadd,.5);
infraCylinder('Fossa A — Ø 1,50 m',990,570,1.5,.25,0x8f78b5,.68);
infraCylinder('Fossa D — Ø 1,20 m',1025,470,1.2,.25,0x7561a8,.68);
[[1045,252],[1180,252],[1310,252],[1045,432],[1180,432],[1310,432]].forEach(([x,y])=>box(infra,.18,2.72,.18,new THREE.MeshStandardMaterial({color:0xd7d7d4,roughness:.86}),X(x),1.36,Z(y),'Pilar da garagem','estrutura'));
function gate(x1,y1,x2,y2,h,color,name){const ax=X(x1),az=Z(y1),bx=X(x2),bz=Z(y2),len=Math.hypot(bx-ax,bz-az),o=new THREE.Mesh(new THREE.BoxGeometry(len,h,.09),new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.52}));o.position.set((ax+bx)/2,h/2,(az+bz)/2);o.rotation.y=-Math.atan2(bz-az,bx-ax);o.name=name;o.userData.kind='acesso';infra.add(o)}
gate(1160,215,1285,205,1.8,0x46505a,'Portão principal');gate(1095,220,1135,217,1.65,0x66717c,'Portão social');

const roofMat=new THREE.MeshStandardMaterial({color:0xf7f7f4,roughness:.72,side:THREE.DoubleSide,transparent:true,opacity:.96});
const r1=X(270),r2=X(962),z1=Z(258),z2=Z(710),r=new THREE.Mesh(new THREE.BoxGeometry(r2-r1,.08,z1-z2),roofMat);r.position.set((r1+r2)/2,H+.20,(z1+z2)/2);r.rotation.z=THREE.MathUtils.degToRad(1.7);roof.add(r);
const g1=X(1018),g2=X(1332),gz1=Z(230),gz2=Z(456),gr=new THREE.Mesh(new THREE.BoxGeometry(g2-g1,.08,gz1-gz2),roofMat.clone());gr.position.set((g1+g2)/2,2.84,(gz1+gz2)/2);gr.rotation.z=THREE.MathUtils.degToRad(1.2);roof.add(gr);roof.visible=false;

function ceilingRect(x1,y1,x2,y2){const o=new THREE.Mesh(new THREE.BoxGeometry(X(x2)-X(x1),.035,Z(y1)-Z(y2)),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,side:THREE.DoubleSide}));o.position.set((X(x1)+X(x2))/2,2.92,(Z(y1)+Z(y2))/2);o.name='Forro de isopor + massa corrida branca';o.userData.kind='acabamento';ceiling.add(o)}
ceilingRect(280,269,612,699);ceilingRect(612,269,952,428);ceilingRect(612,510,813,699);ceiling.visible=false;

function accentWall(x1,py,x2){const a=P(x1,py),b=P(x2,py),o=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(b.x-a.x),2.3,.025),new THREE.MeshStandardMaterial({color:0xffffff,map:tileTex,roughness:.77}));o.position.set((a.x+b.x)/2,1.15,a.z+.08);o.name='Parede de pastilhas';o.userData.kind='acabamento';bathDecor.add(o)}
accentWall(286,691,397);accentWall(860,277,945);
function vanity(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Bancada com cuba de sobrepor e torneira de cobre';g.userData.kind='mobiliário';box(g,1.05,.72,.48,matWood,0,.36,0);box(g,1.08,.06,.52,matWhite,0,.75,0);const basin=new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.16,32),matWhite);basin.position.set(0,.86,0);basin.name='Cuba de sobrepor';g.add(basin);cyl(g,.018,.32,matCopper,.26,.93,.04,'Torneira de cobre');box(g,.20,.025,.025,matCopper,.18,1.08,.04,'Bica de cobre');furniture.add(g)}
vanity(338,655);vanity(900,315);

function dining(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Mesa de madeira — 6 cadeiras';g.userData.kind='mobiliário';box(g,2,.10,.95,matWood,0,.78,0,'Mesa');for(const [x,z] of [[-.8,-.78],[0,-.78],[.8,-.78],[-.8,.78],[0,.78],[.8,.78]]){box(g,.44,.08,.44,matWoodDark,x,.48,z,'Cadeira');for(const dx of [-.16,.16])for(const dz of [-.16,.16])box(g,.06,.47,.06,matWoodDark,x+dx,.235,z+dz);box(g,.42,.55,.06,matWoodDark,x,.78,z+(z<0?-.18:.18),'Encosto')}furniture.add(g)}
dining(700,605);
function bunk(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Beliche';g.userData.kind='mobiliário';for(const h of [.42,1.42]){box(g,.95,.12,1.92,matWoodDark,0,h,0);box(g,.86,.15,1.80,new THREE.MeshStandardMaterial({color:0xf2eee5,roughness:.95}),0,h+.13,0,'Colchão')}for(const x of [-.43,.43])for(const z of [-.88,.88])box(g,.075,1.78,.075,matWoodDark,x,.89,z);furniture.add(g)}
bunk(480,338);bunk(565,338);
function queen(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Cama queen — sugestão';g.userData.kind='mobiliário';box(g,1.65,.30,2.05,matWoodDark,0,.18,0);box(g,1.56,.24,1.95,new THREE.MeshStandardMaterial({color:0xf0ece4,roughness:.98}),0,.43,0,'Colchão');box(g,1.72,1.05,.10,matWood,0,.74,-1.02,'Cabeceira');furniture.add(g)}
queen(730,350);
function sofa(px,py){const p=P(px,py),g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xd7d1c7,roughness:.98});g.position.set(p.x,0,p.z);g.name='Sofá neutro — sugestão';g.userData.kind='mobiliário';box(g,2.15,.45,.85,m,0,.34,0);box(g,2.15,.65,.18,m,0,.72,-.34);box(g,.18,.58,.82,m,-1.05,.48,0);box(g,.18,.58,.82,m,1.05,.48,0);furniture.add(g)}
sofa(525,555);
const rack=P(430,480);box(furniture,1.85,.42,.35,matWood,rack.x,.21,rack.z,'Rack baixo — sugestão');
function kitchen(){const p1=P(430,680),p2=P(590,680),cx=(p1.x+p2.x)/2,w=Math.abs(p2.x-p1.x);box(furniture,w,.78,.58,matWood,cx,.39,p1.z,'Armários inferiores');box(furniture,w+.04,.055,.64,new THREE.MeshStandardMaterial({color:0xdedbd4,roughness:.7}),cx,.81,p1.z,'Bancada clara');const s=P(475,680);box(furniture,.72,.06,.38,new THREE.MeshStandardMaterial({color:0xb8bec3,metalness:.58,roughness:.34}),s.x,.84,s.z,'Pia extensa');cyl(furniture,.018,.34,matCopper,s.x+.28,1.01,s.z-.08,'Torneira cobre — cozinha');const c=P(560,680);box(furniture,.68,.035,.45,new THREE.MeshStandardMaterial({color:0x20242a,roughness:.25}),c.x,.85,c.z,'Cooktop elétrico')}
kitchen();
const wash=P(320,410);box(furniture,.65,.85,.62,matWhite,wash.x,.43,wash.z,'Máquina de lavar');const tank=P(320,500);box(furniture,.62,.82,.55,new THREE.MeshStandardMaterial({color:0xe5e6e4,roughness:.88}),tank.x,.41,tank.z,'Tanquinho');

function tree(px,py){const p=P(px,py);cyl(infra,.10,1.35,new THREE.MeshStandardMaterial({color:0x815838,roughness:1}),p.x,.675,p.z,'Juazeiro','paisagismo');const crown=new THREE.Mesh(new THREE.SphereGeometry(.78,18,14),new THREE.MeshStandardMaterial({color:0x56845c,roughness:1}));crown.position.set(p.x,1.72,p.z);crown.name='Copa do juazeiro';crown.userData.kind='paisagismo';infra.add(crown)}
tree(730,555);

function label(text,px,py,scale=2.6){const c=document.createElement('canvas');c.width=700;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='rgba(25,32,43,.82)';ctx.fillRect(8,22,684,84);ctx.fillStyle='#fff';ctx.font='700 31px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,350,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.set(X(px),.34,Z(py));s.scale.set(scale,.58,1);labels.add(s)}
label('LAVANDERIA',325,455,2.2);label('QUARTO MENOR • 2 BELICHES',525,345,3.8);label('SUÍTE MAIOR',733,350,2.4);label('BANHEIRO SUÍTE',900,340,2.8);label('BANHEIRO SOCIAL',340,664,2.8);label('SALA / COZINHA',575,600,2.8);label('JARDIM DE INVERNO',735,555,3.2);label('GARAGEM COBERTA',1190,320,3);label('CISTERNA Ø2,00 × 2,47 m',1135,385,3.5);label('FOSSA Ø1,50 m',990,570,2.6);label('FOSSA Ø1,20 m',1025,470,2.6);labels.visible=false;

const grid=new THREE.GridHelper(34,34,0x8b96a4,0xd1d6dd);grid.position.set(12.5,-.065,5);world.add(grid);
const interiorLights=new THREE.Group();scene.add(interiorLights);interiorLights.visible=false;
function light(px,py,h,i=7,c=0xffe4bf){const p=P(px,py),l=new THREE.PointLight(c,i,7,2);l.position.set(p.x,h,p.z);interiorLights.add(l)}
light(525,570,2.55,8);light(700,600,2.55,7);light(520,340,2.55,5.5,0xfff1d8);light(730,345,2.55,5.5,0xfff1d8);light(340,660,2.5,4.5,0xfff5e8);light(900,340,2.5,4.5,0xfff5e8);

const selection=document.getElementById('selection'),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0)return;const rr=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rr.left)/rr.width)*2-1;pointer.y=-((e.clientY-rr.top)/rr.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...floors.children,...furniture.children,...infra.children,...walls.children,...bathDecor.children],true);if(!hits.length)return;const o=hits[0].object;selection.textContent=`${o.name||o.parent?.name||'Elemento'} — ${o.userData.kind||o.parent?.userData?.kind||'elemento'}.`});

const setBtn=(id,on)=>document.getElementById(id)?.classList.toggle('active',on);
function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
function go(id,pos,target,fov=40){['view3d','viewTop','viewFront','viewInside'].forEach(k=>setBtn(k,k===id));camera.fov=fov;camera.updateProjectionMatrix();camera.position.copy(pos);controls.target.copy(target);controls.update()}
const target=new THREE.Vector3(13.3,.55,5);
document.getElementById('view3d').onclick=()=>go('view3d',new THREE.Vector3(23.5,13.5,19.5),target,40);
document.getElementById('viewTop').onclick=()=>go('viewTop',new THREE.Vector3(13.6,31.5,5),new THREE.Vector3(13.6,0,5),30);
document.getElementById('viewFront').onclick=()=>go('viewFront',new THREE.Vector3(15.2,5.2,24.5),new THREE.Vector3(14.2,1.05,5),38);
document.getElementById('viewInside').onclick=()=>{roof.visible=false;ceiling.visible=false;setBtn('toggleRoof',false);setBtn('toggleCeiling',false);go('viewInside',new THREE.Vector3(8.9,1.75,2.65),new THREE.Vector3(11.9,1.25,4.8),58)};
document.getElementById('toggleRoof').onclick=e=>{roof.visible=!roof.visible;e.currentTarget.classList.toggle('active',roof.visible)};
document.getElementById('toggleWalls').onclick=e=>{walls.visible=!walls.visible;e.currentTarget.classList.toggle('active',walls.visible)};
document.getElementById('toggleInfra').onclick=e=>{infra.visible=!infra.visible;e.currentTarget.classList.toggle('active',infra.visible)};
document.getElementById('toggleFurniture').onclick=e=>{furniture.visible=!furniture.visible;bathDecor.visible=furniture.visible;e.currentTarget.classList.toggle('active',furniture.visible)};
document.getElementById('toggleLabels').onclick=e=>{labels.visible=!labels.visible;e.currentTarget.classList.toggle('active',labels.visible)};
document.getElementById('toggleCeiling').onclick=e=>{ceiling.visible=!ceiling.visible;e.currentTarget.classList.toggle('active',ceiling.visible)};
document.getElementById('toggleLights').onclick=e=>{interiorLights.visible=!interiorLights.visible;e.currentTarget.classList.toggle('active',interiorLights.visible)};
const panel=document.querySelector('.panel'),collapse=document.getElementById('collapsePanel');if(collapse)collapse.onclick=()=>{panel.classList.toggle('collapsed');collapse.textContent=panel.classList.contains('collapsed')?'›':'‹';requestAnimationFrame(resize)};
addEventListener('resize',resize);resize();go('view3d',new THREE.Vector3(23.5,13.5,19.5),target,40);renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});