import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/controls/OrbitControls.js';

const mount=document.getElementById('scene');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xedf1f5);
scene.fog=new THREE.Fog(0xedf1f5,45,95);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,180);
camera.position.set(22,20,22);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
mount.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.target.set(10.8,0,4.9);
controls.minDistance=4.5;
controls.maxDistance=75;
controls.maxPolarAngle=Math.PI*.49;

scene.add(new THREE.HemisphereLight(0xffffff,0x677386,2.05));
const sun=new THREE.DirectionalLight(0xfff7e8,2.55);
sun.position.set(10,25,15);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;
scene.add(sun);

const world=new THREE.Group();
const floors=new THREE.Group(),walls=new THREE.Group(),roof=new THREE.Group(),infra=new THREE.Group(),furniture=new THREE.Group(),labels=new THREE.Group(),ceiling=new THREE.Group(),bathDecor=new THREE.Group();
scene.add(world);world.add(floors,walls,roof,infra,furniture,labels,ceiling,bathDecor);

const sx=25.54/(1338-95),sy=8.69/(727-279),ox=95,oy=727;
const X=p=>(p-ox)*sx,Z=p=>(oy-p)*sy,P=(px,py)=>({x:X(px),z:Z(py)});

function seededNoise(seed=2026){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function tex(size,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');draw(ctx,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
const rnd=seededNoise();
const plasterTex=tex(256,(ctx,s)=>{ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,s,s);for(let i=0;i<1500;i++){const v=225+Math.floor(rnd()*25);ctx.fillStyle=`rgba(${v},${v},${v-2},${.025+rnd()*.045})`;ctx.beginPath();ctx.arc(rnd()*s,rnd()*s,.3+rnd()*1.2,0,Math.PI*2);ctx.fill()}},2,2);
const floorTex=tex(256,(ctx,s)=>{ctx.fillStyle='#e9e6e0';ctx.fillRect(0,0,s,s);ctx.strokeStyle='rgba(148,143,135,.32)';ctx.lineWidth=2;for(const p of [0,s/2,s]){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,s);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(s,p);ctx.stroke()}},5,5);
const pastilhaTex=tex(256,(ctx,s)=>{const q=32;for(let y=0;y<s;y+=q)for(let x=0;x<s;x+=q){const k=((x/q)+(y/q))%4;ctx.fillStyle=['#ddd6c8','#c8b9a6','#e9e3d8','#bfa993'][k];ctx.fillRect(x+1,y+1,q-2,q-2)}},2.8,3.4);

const greekMat=new THREE.MeshStandardMaterial({color:0xffffff,map:plasterTex,roughness:.98});
const woodMat=new THREE.MeshStandardMaterial({color:0x8f6743,roughness:.72});
const woodDarkMat=new THREE.MeshStandardMaterial({color:0x71513a,roughness:.75});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf8f7f3,roughness:.82});
const copperMat=new THREE.MeshStandardMaterial({color:0xb56e41,metalness:.72,roughness:.3});

const lotPts=[[95,726],[83,280],[1320,184],[1338,680]].map(([x,y])=>new THREE.Vector2(X(x),Z(y)));
const lotShape=new THREE.Shape(lotPts),lotGeo=new THREE.ShapeGeometry(lotShape);lotGeo.rotateX(-Math.PI/2);
const lot=new THREE.Mesh(lotGeo,new THREE.MeshStandardMaterial({color:0xa9cfa9,roughness:1}));
lot.name='Terreno';lot.receiveShadow=true;lot.position.y=-.04;world.add(lot);

const roomMat=color=>new THREE.MeshStandardMaterial({color,roughness:.92,map:floorTex});
function floorRect(name,x1,y1,x2,y2,color){const w=X(x2)-X(x1),d=Z(y1)-Z(y2),o=new THREE.Mesh(new THREE.BoxGeometry(w,.055,d),roomMat(color));o.name=name;o.userData.kind='ambiente';o.position.set((X(x1)+X(x2))/2,.02,(Z(y1)+Z(y2))/2);o.receiveShadow=true;floors.add(o);return o}
function floorPoly(name,pts,color){const s=new THREE.Shape(pts.map(([x,y])=>new THREE.Vector2(X(x),Z(y)))),g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);const o=new THREE.Mesh(g,roomMat(color));o.name=name;o.userData.kind='ambiente';o.position.y=.026;o.receiveShadow=true;floors.add(o);return o}

floorRect('Lavanderia / varanda',280,269,369,628,0xbbb8a5);
floorRect('Banheiro social',280,628,402,699,0xc9c5d2);
floorRect('Quarto menor — 2 beliches',433,269,612,410,0xa9d7cf);
floorRect('Suíte maior',612,269,853,428,0xe7c4bc);
floorRect('Banheiro da suíte',853,269,952,412,0xc9c5d2);
floorPoly('Sala / cozinha integradas',[[369,269],[433,269],[433,410],[612,410],[612,510],[813,510],[813,699],[402,699],[402,628],[369,628]],0xe7dccb);
floorPoly('Jardim de inverno',[[612,428],[853,428],[853,699],[813,699],[813,510],[612,510]],0xa9d2ad);
floorRect('Garagem coberta',1032,240,1324,445,0xa7adb6);

const H=3,T=.14;
function wallSeg(x1,y1,x2,y2,h=H){const ax=X(x1),az=Z(y1),bx=X(x2),bz=Z(y2),len=Math.hypot(bx-ax,bz-az),o=new THREE.Mesh(new THREE.BoxGeometry(len,h,T),greekMat);o.name='Parede — reboco grego branco';o.userData.kind='acabamento';o.position.set((ax+bx)/2,h/2,(az+bz)/2);o.rotation.y=-Math.atan2(bz-az,bx-ax);o.castShadow=true;o.receiveShadow=true;walls.add(o)}
[[280,269,952,269],[280,269,280,699],[280,699,853,699],[952,269,952,412],[853,269,853,412],[853,428,853,699],[369,269,369,628],[402,628,402,699],[280,628,402,628],[433,269,433,410],[433,410,612,410],[612,269,612,510],[612,428,853,428],[612,510,813,510],[813,510,813,699],[853,412,952,412]].forEach(v=>wallSeg(...v));

function markerLine(x1,y1,x2,y2,color=0x334155){const ax=X(x1),az=Z(y1),bx=X(x2),bz=Z(y2),len=Math.hypot(bx-ax,bz-az),o=new THREE.Mesh(new THREE.BoxGeometry(len,.025,.06),new THREE.MeshBasicMaterial({color}));o.position.set((ax+bx)/2,.08,(az+bz)/2);o.rotation.y=-Math.atan2(bz-az,bx-ax);world.add(o)}
markerLine(350,330,369,330);markerLine(540,410,580,410);markerLine(790,428,830,428);markerLine(813,545,813,585);markerLine(390,628,402,650);

function box(parent,w,h,d,mat,x,y,z,name='',kind='mobiliário'){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.name=name;o.userData.kind=kind;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function cylinder(parent,r,h,mat,x,y,z,name='',kind='mobiliário'){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat);o.position.set(x,y,z);o.name=name;o.userData.kind=kind;o.castShadow=true;parent.add(o);return o}
function cylinderAt(name,px,py,diameter,height,color,opacity=.55){const o=new THREE.Mesh(new THREE.CylinderGeometry(diameter/2,diameter/2,height,40),new THREE.MeshStandardMaterial({color,roughness:.68,transparent:opacity<1,opacity}));o.name=name;o.userData.kind='infraestrutura';o.position.set(X(px),height/2,Z(py));o.castShadow=true;o.receiveShadow=true;infra.add(o)}
cylinderAt('Cisterna — Ø 2,00 m útil × 2,47 m',1135,385,2,2.47,0x67aadd,.50);
cylinderAt('Fossa A — Ø 1,50 m',990,570,1.5,.25,0x8f78b5,.68);
cylinderAt('Fossa D — Ø 1,20 m',1025,470,1.2,.25,0x7561a8,.68);
function post(px,py){box(infra,.18,2.72,.18,new THREE.MeshStandardMaterial({color:0xd7d7d4,roughness:.86}),X(px),1.36,Z(py),'Pilar da garagem','estrutura')}
[[1045,252],[1180,252],[1310,252],[1045,432],[1180,432],[1310,432]].forEach(([x,y])=>post(x,y));
function gate(x1,y1,x2,y2,h,color,name){const ax=X(x1),az=Z(y1),bx=X(x2),bz=Z(y2),len=Math.hypot(bx-ax,bz-az),o=new THREE.Mesh(new THREE.BoxGeometry(len,h,.09),new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.52}));o.name=name;o.userData.kind='acesso';o.position.set((ax+bx)/2,h/2,(az+bz)/2);o.rotation.y=-Math.atan2(bz-az,bx-ax);infra.add(o)}
gate(1160,215,1285,205,1.8,0x46505a,'Portão principal');gate(1095,220,1135,217,1.65,0x66717c,'Portão social');

const roofMat=new THREE.MeshStandardMaterial({color:0xf7f7f4,roughness:.72,metalness:.02,side:THREE.DoubleSide,transparent:true,opacity:.96});
const rx1=X(270),rx2=X(962),rz1=Z(258),rz2=Z(710),ro=new THREE.Mesh(new THREE.BoxGeometry(rx2-rx1,.08,rz1-rz2),roofMat);ro.name='Cobertura principal — fibrocimento branco';ro.position.set((rx1+rx2)/2,H+.20,(rz1+rz2)/2);ro.rotation.z=THREE.MathUtils.degToRad(1.7);ro.castShadow=true;roof.add(ro);
const gx1=X(1018),gx2=X(1332),gz1=Z(230),gz2=Z(456),groof=new THREE.Mesh(new THREE.BoxGeometry(gx2-gx1,.08,gz1-gz2),roofMat.clone());groof.name='Cobertura da garagem';groof.position.set((gx1+gx2)/2,2.84,(gz1+gz2)/2);groof.rotation.z=THREE.MathUtils.degToRad(1.2);groof.castShadow=true;roof.add(groof);roof.visible=false;

function ceilingRect(x1,y1,x2,y2){const w=X(x2)-X(x1),d=Z(y1)-Z(y2),o=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.93,transparent:true,opacity:.96,side:THREE.DoubleSide}));o.name='Forro de isopor + massa corrida branca';o.userData.kind='acabamento';o.position.set((X(x1)+X(x2))/2,2.92,(Z(y1)+Z(y2))/2);ceiling.add(o)}
ceilingRect(280,269,612,699);ceilingRect(612,269,952,428);ceilingRect(612,510,813,699);ceiling.visible=false;

function accentWall(x1,py,x2,height=2.35){const a=P(x1,py),b=P(x2,py),len=Math.abs(b.x-a.x),mat=new THREE.MeshStandardMaterial({color:0xffffff,map:pastilhaTex,roughness:.77}),o=new THREE.Mesh(new THREE.BoxGeometry(len,height,.025),mat);o.name='Parede de pastilhas';o.userData.kind='acabamento';o.position.set((a.x+b.x)/2,height/2,a.z+.08);bathDecor.add(o)}
accentWall(286,691,397,2.30);accentWall(860,277,945,2.30);
function vanity(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Bancada com cuba de sobrepor e torneira de cobre';g.userData.kind='mobiliário';box(g,1.05,.72,.48,woodMat,0,.36,0,'Bancada em madeira');box(g,1.08,.06,.52,whiteMat,0,.75,0,'Tampo claro');const basin=new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.16,32),whiteMat);basin.name='Cuba de sobrepor';basin.position.set(0,.86,0);g.add(basin);cylinder(g,.018,.32,copperMat,.26,.93,.04,'Torneira de cobre');box(g,.20,.025,.025,copperMat,.18,1.08,.04,'Bica de cobre');furniture.add(g)}
vanity(338,655);vanity(900,315);

function diningSet(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Mesa de madeira — 6 cadeiras';g.userData.kind='mobiliário';box(g,2,.10,.95,woodMat,0,.78,0,'Mesa de madeira');for(const [x,z] of [[-.8,-.78],[0,-.78],[.8,-.78],[-.8,.78],[0,.78],[.8,.78]]){box(g,.44,.08,.44,woodDarkMat,x,.48,z,'Cadeira');for(const dx of [-.16,.16])for(const dz of [-.16,.16])box(g,.06,.47,.06,woodDarkMat,x+dx,.235,z+dz);box(g,.42,.55,.06,woodDarkMat,x,.78,z+(z<0?-.18:.18),'Encosto')}for(const x of [-.75,.75])for(const z of [-.30,.30])box(g,.08,.75,.08,woodDarkMat,x,.375,z);furniture.add(g)}
diningSet(700,605);

function bunk(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Beliche';g.userData.kind='mobiliário';for(const h of [.42,1.42]){box(g,.95,.12,1.92,woodDarkMat,0,h,0,'Estrutura da beliche');box(g,.86,.15,1.80,new THREE.MeshStandardMaterial({color:0xf2eee5,roughness:.95}),0,h+.13,0,'Colchão')}for(const x of [-.43,.43])for(const z of [-.88,.88])box(g,.075,1.78,.075,woodDarkMat,x,.89,z);for(let i=0;i<5;i++)box(g,.58,.045,.045,woodDarkMat,.63,.35+i*.28,.72,'Degrau');box(g,.05,1.45,.05,woodDarkMat,.37,.9,.72);box(g,.05,1.45,.05,woodDarkMat,.89,.9,.72);furniture.add(g)}
bunk(480,338);bunk(565,338);

function queenBed(px,py){const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Cama queen — sugestão';g.userData.kind='mobiliário';box(g,1.65,.30,2.05,woodDarkMat,0,.18,0);box(g,1.56,.24,1.95,new THREE.MeshStandardMaterial({color:0xf0ece4,roughness:.98}),0,.43,0,'Colchão');box(g,1.72,1.05,.10,woodMat,0,.74,-1.02,'Cabeceira');box(g,.42,.42,.38,woodMat,-1.1,.21,-.72,'Criado');box(g,.42,.42,.38,woodMat,1.1,.21,-.72,'Criado');furniture.add(g)}
queenBed(730,350);

function sofa(px,py){const p=P(px,py),g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xd7d1c7,roughness:.98});g.position.set(p.x,0,p.z);g.name='Sofá neutro — sugestão';g.userData.kind='mobiliário';box(g,2.15,.45,.85,mat,0,.34,0);box(g,2.15,.65,.18,mat,0,.72,-.34);box(g,.18,.58,.82,mat,-1.05,.48,0);box(g,.18,.58,.82,mat,1.05,.48,0);furniture.add(g)}
sofa(525,555);const mediaP=P(430,480);box(furniture,1.85,.42,.35,woodMat,mediaP.x,.21,mediaP.z,'Rack baixo — sugestão');

function kitchen(){const p1=P(430,680),p2=P(590,680),cx=(p1.x+p2.x)/2,w=Math.abs(p2.x-p1.x);box(furniture,w,.78,.58,woodMat,cx,.39,p1.z,'Armários inferiores');box(furniture,w+.04,.055,.64,new THREE.MeshStandardMaterial({color:0xdedbd4,roughness:.7}),cx,.81,p1.z,'Bancada clara');const sinkP=P(475,680),sink=new THREE.Mesh(new THREE.BoxGeometry(.72,.06,.38),new THREE.MeshStandardMaterial({color:0xb8bec3,metalness:.58,roughness:.34}));sink.name='Pia extensa';sink.userData.kind='mobiliário';sink.position.set(sinkP.x,.84,sinkP.z);furniture.add(sink);cylinder(furniture,.018,.34,copperMat,sinkP.x+.28,1.01,sinkP.z-.08,'Torneira cobre — cozinha');const cook=P(560,680);box(furniture,.68,.035,.45,new THREE.MeshStandardMaterial({color:0x20242a,roughness:.25,metalness:.15}),cook.x,.85,cook.z,'Cooktop elétrico');const up=P(500,655);box(furniture,w,.68,.36,whiteMat,cx,1.82,up.z,'Armários superiores brancos')}
kitchen();

const wash=P(320,410);box(furniture,.65,.85,.62,whiteMat,wash.x,.43,wash.z,'Máquina de lavar');const washerDoor=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,28),new THREE.MeshStandardMaterial({color:0x6d7782,metalness:.25,roughness:.35}));washerDoor.rotation.x=Math.PI/2;washerDoor.position.set(wash.x,.48,wash.z-.325);washerDoor.name='Máquina de lavar';washerDoor.userData.kind='mobiliário';furniture.add(washerDoor);const tank=P(320,500);box(furniture,.62,.82,.55,new THREE.MeshStandardMaterial({color:0xe5e6e4,roughness:.88}),tank.x,.41,tank.z,'Tanquinho');

function tree(px,py){const p=P(px,py);cylinder(infra,.10,1.35,new THREE.MeshStandardMaterial({color:0x815838,roughness:1}),p.x,.675,p.z,'Juazeiro','paisagismo');const crown=new THREE.Mesh(new THREE.SphereGeometry(.78,18,14),new THREE.MeshStandardMaterial({color:0x56845c,roughness:1}));crown.position.set(p.x,1.72,p.z);crown.name='Copa do juazeiro';crown.userData.kind='paisagismo';infra.add(crown)}
tree(730,555);

function label(text,px,py,scale=2.6){const c=document.createElement('canvas');c.width=700;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='rgba(25,32,43,.78)';ctx.fillRect(8,22,684,84);ctx.fillStyle='#fff';ctx.font='700 31px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,350,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.set(X(px),.24,Z(py));s.scale.set(scale,.58,1);labels.add(s)}
label('LAVANDERIA',325,455,2.2);label('QUARTO MENOR • 2 BELICHES',525,345,3.8);label('SUÍTE MAIOR',733,350,2.4);label('BANHEIRO SUÍTE',900,340,2.8);label('BANHEIRO SOCIAL',340,664,2.8);label('SALA / COZINHA',575,600,2.8);label('JARDIM DE INVERNO',735,555,3.2);label('GARAGEM COBERTA',1190,320,3);label('CISTERNA Ø2,00 × 2,47 m',1135,385,3.5);label('FOSSA Ø1,50 m',990,570,2.6);label('FOSSA Ø1,20 m',1025,470,2.6);

const grid=new THREE.GridHelper(34,34,0x8b96a4,0xd1d6dd);grid.position.set(12.5,-.065,5);world.add(grid);
const interiorLights=new THREE.Group();scene.add(interiorLights);interiorLights.visible=false;
function point(px,py,h,intensity=7,color=0xffe4bf){const p=P(px,py),l=new THREE.PointLight(color,intensity,7,2);l.position.set(p.x,h,p.z);interiorLights.add(l)}
point(525,570,2.55,8);point(700,600,2.55,7);point(520,340,2.55,5.5,0xfff1d8);point(730,345,2.55,5.5,0xfff1d8);point(340,660,2.5,4.5,0xfff5e8);point(900,340,2.5,4.5,0xfff5e8);

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),selection=document.getElementById('selection');
renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0)return;const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...floors.children,...furniture.children,...infra.children,...walls.children,...bathDecor.children],true);if(!hits.length)return;let o=hits[0].object;const name=o.name||o.parent?.name||'Elemento',kind=o.userData.kind||o.parent?.userData?.kind||'elemento';selection.textContent=`${name} — ${kind}.`});
const setBtn=(id,on)=>document.getElementById(id).classList.toggle('active',on);
function cameraTo(pos,target,fov=42){camera.fov=fov;camera.updateProjectionMatrix();camera.position.copy(pos);controls.target.copy(target);controls.update()}
function view(id,pos,target,fov){['view3d','viewTop','viewFront','viewInside'].forEach(k=>setBtn(k,k===id));cameraTo(pos,target,fov)}
document.getElementById('view3d').onclick=()=>view('view3d',new THREE.Vector3(22,20,22),new THREE.Vector3(10.8,0,4.9),42);
document.getElementById('viewTop').onclick=()=>view('viewTop',new THREE.Vector3(10.8,38,5),new THREE.Vector3(10.8,0,5),32);
document.getElementById('viewFront').onclick=()=>view('viewFront',new THREE.Vector3(14,6.5,27),new THREE.Vector3(13,1.2,5.8),40);
document.getElementById('viewInside').onclick=()=>{roof.visible=false;ceiling.visible=false;setBtn('toggleRoof',false);setBtn('toggleCeiling',false);view('viewInside',new THREE.Vector3(8.8,2.25,2.3),new THREE.Vector3(11.7,1.15,4.2),58)};
document.getElementById('toggleRoof').onclick=e=>{roof.visible=!roof.visible;e.currentTarget.classList.toggle('active',roof.visible)};
document.getElementById('toggleWalls').onclick=e=>{walls.visible=!walls.visible;e.currentTarget.classList.toggle('active',walls.visible)};
document.getElementById('toggleInfra').onclick=e=>{infra.visible=!infra.visible;e.currentTarget.classList.toggle('active',infra.visible)};
document.getElementById('toggleFurniture').onclick=e=>{furniture.visible=!furniture.visible;bathDecor.visible=furniture.visible;e.currentTarget.classList.toggle('active',furniture.visible)};
document.getElementById('toggleLabels').onclick=e=>{labels.visible=!labels.visible;e.currentTarget.classList.toggle('active',labels.visible)};
document.getElementById('toggleCeiling').onclick=e=>{ceiling.visible=!ceiling.visible;e.currentTarget.classList.toggle('active',ceiling.visible)};
document.getElementById('toggleLights').onclick=e=>{interiorLights.visible=!interiorLights.visible;e.currentTarget.classList.toggle('active',interiorLights.visible)};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});