import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const mount = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1f4f6);
scene.fog = new THREE.Fog(0xf1f4f6, 42, 95);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
camera.position.set(22, 19, 23);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
mount.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(10.6, 0, 4.7);
controls.minDistance = 4;
controls.maxDistance = 70;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xffffff, 0x66717f, 1.85));
const sun = new THREE.DirectionalLight(0xfff7e8, 2.35);
sun.position.set(12, 24, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);

const world = new THREE.Group();
const floors = new THREE.Group();
const walls = new THREE.Group();
const roof = new THREE.Group();
const furniture = new THREE.Group();
const labels = new THREE.Group();
const ceiling = new THREE.Group();
const details = new THREE.Group();
world.add(floors, walls, roof, furniture, labels, ceiling, details);
scene.add(world);

/*
  Escala da planta-base.
  A imagem 2D informa 25,54 m no comprimento inferior e 8,69 m no lado esquerdo.
  Os pontos abaixo reproduzem o contorno e a implantação diretamente sobre essa base.
*/
const sx = 25.54 / (1338 - 95);
const sz = 8.69 / (727 - 279);
const ox = 95;
const oy = 727;
const X = px => (px - ox) * sx;
const Z = py => (oy - py) * sz;
const P = (px, py) => ({ x: X(px), z: Z(py) });

function canvasTexture(size, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

const plasterTex = canvasTexture(256, (ctx, s) => {
  ctx.fillStyle = '#faf9f5';
  ctx.fillRect(0, 0, s, s);
  let seed = 37;
  for (let i = 0; i < 1200; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const a = seed / 4294967296;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const b = seed / 4294967296;
    ctx.fillStyle = `rgba(205,205,200,${0.025 + a * 0.04})`;
    ctx.fillRect(a * s, b * s, 1 + a * 1.4, 1 + b * 1.4);
  }
}, 2.4, 2.4);

const floorTex = canvasTexture(256, (ctx, s) => {
  ctx.fillStyle = '#eceae5';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(145,142,136,.25)';
  ctx.lineWidth = 1.5;
  for (let p = 0; p <= s; p += s / 2) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(s, p); ctx.stroke();
  }
}, 5, 5);

const greekMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: plasterTex, roughness: 0.98 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f7f3, roughness: 0.84 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6544, roughness: 0.75 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x6c4d36, roughness: 0.78 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x737b82, metalness: 0.62, roughness: 0.42 });
const copperMat = new THREE.MeshStandardMaterial({ color: 0xb56e41, metalness: 0.72, roughness: 0.3 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xc8e0e8, transparent: true, opacity: 0.32, roughness: 0.15, transmission: 0.3, side: THREE.DoubleSide });
const concreteMat = new THREE.MeshStandardMaterial({ color: 0xbdbbb5, roughness: 0.96 });
const pathMat = new THREE.MeshStandardMaterial({ color: 0xd7d1c6, roughness: 0.9 });
const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x303337, roughness: 0.84 });

function roomMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, map: floorTex, roughness: 0.93 });
}

function meshBox(parent, w, h, d, mat, x, y, z, name = '', kind = 'mobiliário') {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  o.position.set(x, y, z);
  o.name = name;
  o.userData.kind = kind;
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function floorRect(name, x1, y1, x2, y2, color) {
  const w = X(x2) - X(x1);
  const d = Z(y1) - Z(y2);
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, d), roomMaterial(color));
  o.position.set((X(x1) + X(x2)) / 2, 0.02, (Z(y1) + Z(y2)) / 2);
  o.name = name;
  o.userData.kind = 'ambiente';
  o.receiveShadow = true;
  floors.add(o);
  return o;
}

function floorPoly(name, pts, color) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(X(x), Z(y))));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const o = new THREE.Mesh(geo, roomMaterial(color));
  o.position.y = 0.026;
  o.name = name;
  o.userData.kind = 'ambiente';
  o.receiveShadow = true;
  floors.add(o);
  return o;
}

function groundRect(name, x1, y1, x2, y2, material, y = 0.055, parent = details) {
  const w = X(x2) - X(x1);
  const d = Z(y1) - Z(y2);
  const o = meshBox(parent, w, 0.045, d, material, (X(x1) + X(x2)) / 2, y, (Z(y1) + Z(y2)) / 2, name, 'pavimentação');
  return o;
}

function groundStrip(x1, y1, x2, y2, width, material, name = 'Caminho de acesso') {
  const a = P(x1, y1), b = P(x2, y2);
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const o = meshBox(details, len, 0.045, width, material, (a.x + b.x) / 2, 0.065, (a.z + b.z) / 2, name, 'acesso');
  o.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  return o;
}

// Terreno exatamente na orientação trapezoidal indicada na planta.
const lotPts = [[95, 726], [83, 280], [1320, 184], [1338, 680]].map(([x, y]) => new THREE.Vector2(X(x), Z(y)));
const lotShape = new THREE.Shape(lotPts);
const lotGeo = new THREE.ShapeGeometry(lotShape);
lotGeo.rotateX(-Math.PI / 2);
const lot = new THREE.Mesh(lotGeo, new THREE.MeshStandardMaterial({ color: 0xa9d0aa, roughness: 1 }));
lot.position.y = -0.05;
lot.name = 'Terreno — 25,54 m';
lot.userData.kind = 'terreno';
lot.receiveShadow = true;
world.add(lot);

// Ambientes reproduzidos sobre os mesmos limites visíveis no 2D.
floorRect('Varanda / lavanderia — 12,3 m²', 280, 269, 369, 628, 0xb6b5a5);
floorRect('Banheiro social — 3,1 m²', 280, 628, 402, 699, 0xc9c6d2);
floorRect('Quarto infantil', 433, 269, 612, 410, 0xa7d9d1);
floorRect('Quarto', 612, 269, 853, 428, 0xeac7c1);
floorRect('Banheiro da suíte', 853, 269, 952, 412, 0xc9c6d2);
floorPoly('Sala de estar / cozinha / jantar — ambiente integrado', [[369,269],[433,269],[433,410],[612,410],[612,510],[813,510],[813,699],[402,699],[402,628],[369,628]], 0xeadbc7);
floorPoly('Pátio interno / área ao ar livre', [[612,428],[853,428],[853,699],[813,699],[813,510],[612,510]], 0xa9d2ad);
floorPoly('Fundo menor / área gourmet', [[95,726],[83,280],[280,269],[280,699]], 0xa9d0aa);
// A garagem permanece permeável nas laterais; apenas a faixa central é cimentada.
floorRect('Garagem coberta — 4,00 × 5,60 m', 1124, 202, 1320, 444, 0xa9d0aa);
groundRect('Faixa central cimentada da garagem', 1152, 202, 1292, 444, concreteMat, 0.06);

const H = 3.0;
const T = 0.14;

function wallRaw(x1, y1, x2, y2, h = H, y0 = 0) {
  const a = P(x1, y1), b = P(x2, y2);
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const o = new THREE.Mesh(new THREE.BoxGeometry(len, h, T), greekMat);
  o.position.set((a.x + b.x) / 2, y0 + h / 2, (a.z + b.z) / 2);
  o.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  o.name = 'Parede — reboco grego branco';
  o.userData.kind = 'parede';
  o.castShadow = true;
  o.receiveShadow = true;
  walls.add(o);
  return o;
}

function hWall(y, x1, x2, openings = []) {
  const sorted = openings.slice().sort((a,b) => a[0]-b[0]);
  let cur = x1;
  for (const [a,b] of sorted) {
    if (a > cur) wallRaw(cur, y, a, y);
    cur = Math.max(cur, b);
  }
  if (cur < x2) wallRaw(cur, y, x2, y);
}

function vWall(x, y1, y2, openings = []) {
  const sorted = openings.slice().sort((a,b) => a[0]-b[0]);
  let cur = y1;
  for (const [a,b] of sorted) {
    if (a > cur) wallRaw(x, cur, x, a);
    cur = Math.max(cur, b);
  }
  if (cur < y2) wallRaw(x, cur, x, y2);
}

function lintelHorizontal(y, xa, xb, bottom = 2.10) {
  const a = P(xa,y), b = P(xb,y);
  const len = Math.abs(b.x-a.x);
  meshBox(walls, len, H-bottom, T, greekMat, (a.x+b.x)/2, bottom+(H-bottom)/2, a.z, 'Verga', 'parede');
}
function lintelVertical(x, ya, yb, bottom = 2.10) {
  const a = P(x,ya), b = P(x,yb);
  const len = Math.abs(b.z-a.z);
  const o = meshBox(walls, len, H-bottom, T, greekMat, a.x, bottom+(H-bottom)/2, (a.z+b.z)/2, 'Verga', 'parede');
  o.rotation.y = Math.PI/2;
}

// Fechamento externo e divisões internas, com os vãos vistos na planta.
hWall(269, 280, 952);
vWall(280, 269, 699);
hWall(699, 280, 813, [[386, 430], [795, 843]]);
vWall(952, 269, 412);
hWall(412, 853, 952);
vWall(853, 269, 699, [[298, 350], [455, 510]]);
vWall(369, 269, 628, [[316, 390]]);
hWall(628, 280, 402);
vWall(402, 628, 699, [[642, 686]]);
vWall(433, 269, 410);
hWall(410, 433, 612, [[532, 580]]);
vWall(612, 269, 510);
hWall(428, 612, 853, [[785, 836]]);
hWall(510, 612, 813);
vWall(813, 510, 699, [[545, 605]]);

[[699,386,430],[699,795,843],[410,532,580],[428,785,836]].forEach(v => lintelHorizontal(...v));
[[369,316,390],[402,642,686],[853,298,350],[853,455,510],[813,545,605]].forEach(v => lintelVertical(...v));

function door(px, py, widthPx, rotationDeg, name, double = false) {
  const p = P(px, py);
  const g = new THREE.Group();
  g.position.set(p.x, 1.02, p.z);
  g.rotation.y = THREE.MathUtils.degToRad(rotationDeg);
  g.name = name;
  g.userData.kind = 'porta';
  const width = widthPx * sx;
  if (double) {
    meshBox(g, width/2-0.02, 2.04, 0.045, darkWoodMat, -width/4, 0, 0, name, 'porta');
    meshBox(g, width/2-0.02, 2.04, 0.045, darkWoodMat, width/4, 0, 0, name, 'porta');
  } else {
    meshBox(g, width, 2.04, 0.045, darkWoodMat, 0, 0, 0, name, 'porta');
  }
  details.add(g);
  return g;
}

door(369, 353, 74, 90, 'Porta dupla da varanda', true);
door(556, 410, 48, 0, 'Porta do quarto infantil');
door(810, 428, 51, 0, 'Porta do quarto');
door(853, 324, 52, 90, 'Porta do banheiro da suíte');
door(402, 664, 44, 90, 'Porta do banheiro social');
door(813, 575, 60, 90, 'Porta para o pátio interno');
door(819, 699, 48, 0, 'Porta principal');

function windowHorizontal(y, xa, xb, sill = 1.0, height = 1.05) {
  const a=P(xa,y), b=P(xb,y), w=Math.abs(b.x-a.x);
  meshBox(details, w, height, 0.035, glassMat, (a.x+b.x)/2, sill+height/2, a.z, 'Janela', 'esquadria');
  meshBox(details, w+0.06, 0.05, 0.08, metalMat, (a.x+b.x)/2, sill, a.z, 'Peitoril', 'esquadria');
}
windowHorizontal(428, 658, 760);

const roofMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.72, side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
const mainRoof = meshBox(roof, X(962)-X(270), 0.09, Z(258)-Z(710), roofMat, (X(270)+X(962))/2, H+0.18, (Z(258)+Z(710))/2, 'Cobertura principal', 'cobertura');
mainRoof.rotation.z = THREE.MathUtils.degToRad(1.5);
const garageRoof = meshBox(roof, X(1330)-X(1116), 0.08, Z(194)-Z(452), roofMat.clone(), (X(1116)+X(1330))/2, 2.86, (Z(194)+Z(452))/2, 'Cobertura da garagem', 'cobertura');
garageRoof.rotation.z = THREE.MathUtils.degToRad(1.2);

// Nova cobertura leve para a área gourmet do fundo menor.
const gourmetRoof = meshBox(roof, X(268)-X(105), 0.07, Z(345)-Z(615), new THREE.MeshStandardMaterial({ color: 0xe8e3d9, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.94 }), (X(105)+X(268))/2, 2.78, (Z(345)+Z(615))/2, 'Cobertura leve da área gourmet', 'cobertura');
gourmetRoof.rotation.z = THREE.MathUtils.degToRad(1.0);
roof.visible = false;

// Estrutura da garagem coberta.
for (const [px,py] of [[1130,210],[1225,205],[1314,198],[1130,438],[1225,435],[1310,432]]) {
  const p=P(px,py);
  meshBox(details, 0.16, 2.72, 0.16, new THREE.MeshStandardMaterial({color:0xd8d8d5,roughness:.88}), p.x,1.36,p.z,'Pilar da garagem','estrutura');
}

// Área gourmet no fundo menor: piso, cobertura, bancada, churrasqueira e mesa compacta.
groundRect('Piso da área gourmet', 108, 350, 266, 612, new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9 }), 0.065);
for (const [px,py] of [[112,355],[260,350],[112,606],[260,606]]) {
  const p=P(px,py);
  meshBox(details, 0.14, 2.65, 0.14, darkWoodMat, p.x,1.325,p.z,'Pilar da área gourmet','estrutura');
}
{
  const p=P(130,425),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Bancada gourmet com churrasqueira';g.userData.kind='área gourmet';
  meshBox(g,.62,.88,2.65,woodMat,0,.44,0,'Bancada gourmet','mobiliário');
  meshBox(g,.66,.06,2.72,whiteMat,0,.91,0,'Tampo claro','mobiliário');
  meshBox(g,.66,1.95,.78,greekMat,0,1.02,-.92,'Churrasqueira','mobiliário');
  meshBox(g,.69,.50,.10,charcoalMat,.02,1.05,-.51,'Boca da churrasqueira','mobiliário');
  meshBox(g,.24,.12,.34,whiteMat,.02,.98,.40,'Cuba','mobiliário');
  meshBox(g,.025,.30,.025,copperMat,.18,1.07,.40,'Torneira de cobre','mobiliário');
  furniture.add(g);
}
{
  const p=P(205,520),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Mesa da área gourmet — 4 lugares';g.userData.kind='mobiliário';
  meshBox(g,1.35,.10,.78,woodMat,0,.77,0,'Mesa gourmet');
  for(const [x,z] of [[-.82,0],[.82,0],[0,-.64],[0,.64]]){
    meshBox(g,.38,.07,.38,darkWoodMat,x,.45,z,'Cadeira gourmet');
    meshBox(g,.36,.45,.06,darkWoodMat,x,.70,z+(z<0?-.16:.16),'Encosto');
  }
  furniture.add(g);
}

// Portões e acesso. O portão veicular alinha com a garagem; o portão principal é o acesso de pedestres.
function gateSegment(x1,y1,x2,y2,height,name){
  const a=P(x1,y1),b=P(x2,y2),len=Math.hypot(b.x-a.x,b.z-a.z);
  const g=meshBox(details,len,height,.07,metalMat,(a.x+b.x)/2,height/2,(a.z+b.z)/2,name,'acesso');
  g.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);
  return g;
}
gateSegment(1160,198,1318,185,1.78,'Portão veicular da garagem');
gateSegment(1334,545,1337,608,1.78,'Portão principal de pedestres');

// Caminho confortável do portão principal até a porta de entrada, com patamar final.
const accessPts=[[1328,578],[1222,584],[1115,608],[1010,638],[905,672],[824,692]];
for(let i=0;i<accessPts.length-1;i++) groundStrip(...accessPts[i],...accessPts[i+1],1.10,pathMat,'Caminho do portão principal à entrada');
groundRect('Patamar da porta principal', 795, 680, 850, 713, pathMat, 0.07);
for (const [px,py] of [[1210,590],[1085,618],[965,653],[855,684]]) {
  const p=P(px,py);
  meshBox(details,.10,.42,.10,charcoalMat,p.x,.23,p.z,'Balizador do caminho','iluminação externa');
}

// Quadro elétrico: posição indicada pelo símbolo amarelo na planta, próximo à garagem/portão.
{
  const p=P(1297,222);
  const g=new THREE.Group(); g.position.set(p.x,1.55,p.z); g.name='Quadro de distribuição — posição da planta'; g.userData.kind='elétrica';
  meshBox(g,.42,.52,.10,new THREE.MeshStandardMaterial({color:0xf0c91f,roughness:.6}),0,0,0,'Quadro de distribuição','elétrica');
  const bolt=new THREE.Mesh(new THREE.ConeGeometry(.07,.24,3),new THREE.MeshBasicMaterial({color:0x1f2937})); bolt.rotation.z=Math.PI; bolt.position.z=.06; g.add(bolt);
  details.add(g);
}

function ceilingRect(x1,y1,x2,y2){
  const w=X(x2)-X(x1), d=Z(y1)-Z(y2);
  const o=meshBox(ceiling,w,.035,d,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,transparent:true,opacity:.96,side:THREE.DoubleSide}),(X(x1)+X(x2))/2,2.93,(Z(y1)+Z(y2))/2,'Forro de isopor + massa corrida branca','acabamento');
  return o;
}
ceilingRect(280,269,612,699);
ceilingRect(612,269,952,428);
ceilingRect(612,510,813,699);
ceiling.visible=false;

function diningSet(px,py){
  const p=P(px,py),g=new THREE.Group(); g.position.set(p.x,0,p.z); g.name='Mesa de madeira — 6 lugares'; g.userData.kind='mobiliário';
  meshBox(g,1.90,.10,.90,woodMat,0,.78,0,'Mesa de madeira');
  for(const [x,z] of [[-.72,-.72],[0,-.72],[.72,-.72],[-.72,.72],[0,.72],[.72,.72]]){
    meshBox(g,.40,.07,.40,darkWoodMat,x,.46,z,'Cadeira');
    meshBox(g,.38,.48,.06,darkWoodMat,x,.73,z+(z<0?-.18:.18),'Encosto');
  }
  furniture.add(g);
}
diningSet(700,605);

function bunk(px,py,rot=0){
  const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.rotation.y=rot;g.name='Beliche';g.userData.kind='mobiliário';
  for(const y of [.48,1.48]){meshBox(g,1.82,.10,.78,darkWoodMat,0,y,0,'Estrado');meshBox(g,1.72,.16,.70,whiteMat,0,y+.12,0,'Colchão');}
  for(const x of [-.86,.86])for(const z of [-.34,.34])meshBox(g,.07,1.92,.07,darkWoodMat,x,.96,z,'Montante');
  furniture.add(g);
}
bunk(480,325,Math.PI/2);
bunk(565,325,Math.PI/2);

function bed(px,py){
  const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Cama casal';g.userData.kind='mobiliário';
  meshBox(g,1.55,.25,2.00,darkWoodMat,0,.18,0,'Base');
  meshBox(g,1.48,.20,1.92,whiteMat,0,.40,0,'Colchão');
  meshBox(g,1.60,1.00,.10,darkWoodMat,0,.72,-.98,'Cabeceira');
  furniture.add(g);
}
bed(720,335);

function kitchen(px,py){
  const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Cozinha linear';g.userData.kind='mobiliário';
  meshBox(g,.62,.86,2.55,woodMat,0,.43,0,'Armário inferior');
  meshBox(g,.66,.06,2.62,whiteMat,0,.89,0,'Bancada clara');
  meshBox(g,.50,.72,1.80,whiteMat,0,1.78,0,'Armários superiores');
  furniture.add(g);
}
kitchen(384,505);

function vanity(px,py,rot=0){
  const p=P(px,py),g=new THREE.Group();g.position.set(p.x,0,p.z);g.rotation.y=rot;g.name='Cuba de sobrepor + torneira de cobre';g.userData.kind='mobiliário';
  meshBox(g,.82,.70,.44,woodMat,0,.35,0,'Bancada');
  meshBox(g,.86,.05,.48,whiteMat,0,.73,0,'Tampo');
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(.20,.17,.14,30),whiteMat);basin.position.set(0,.84,0);g.add(basin);
  meshBox(g,.03,.32,.03,copperMat,.22,.92,.05,'Torneira de cobre');
  furniture.add(g);
}
vanity(333,655);
vanity(900,315,Math.PI/2);

{
  const p=P(540,575),g=new THREE.Group();g.position.set(p.x,0,p.z);g.name='Sofá';g.userData.kind='mobiliário';
  meshBox(g,2.00,.35,.78,new THREE.MeshStandardMaterial({color:0xc9c4bc,roughness:.9}),0,.35,0,'Sofá');
  meshBox(g,2.00,.62,.16,new THREE.MeshStandardMaterial({color:0xc9c4bc,roughness:.9}),0,.73,.31,'Encosto');
  furniture.add(g);
}

function makeLabel(text, px, py, y=0.13){
  const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);ctx.font='600 48px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,.90)';ctx.roundRect(6,18,1012,124,24);ctx.fill();ctx.fillStyle='#253548';ctx.fillText(text,512,80);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  const p=P(px,py);spr.position.set(p.x,y,p.z);spr.scale.set(3.2,.5,1);spr.name=text;spr.userData.kind='rótulo';labels.add(spr);
}
makeLabel('Varanda / lavanderia',325,470);
makeLabel('Banheiro social',341,664);
makeLabel('Quarto infantil',523,338);
makeLabel('Quarto',733,344);
makeLabel('Banheiro',901,338);
makeLabel('Sala / cozinha / jantar',590,558);
makeLabel('Pátio interno',734,474);
makeLabel('Área gourmet',188,505);
makeLabel('Garagem coberta',1220,330);
makeLabel('Acesso principal',1045,635);

const interiorLights=[];
for(const [px,py] of [[520,340],[735,345],[575,565],[900,335],[190,490]]){
  const p=P(px,py);const l=new THREE.PointLight(0xffe7c2,0,7,2);l.position.set(p.x,2.55,p.z);scene.add(l);interiorLights.push(l);
}

const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshStandardMaterial({color:0xe7ebee,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.set(10,-.08,4);ground.receiveShadow=true;scene.add(ground);

function setView(pos,target){
  camera.position.copy(pos);controls.target.copy(target);controls.update();
}
const center=new THREE.Vector3(10.7,0,4.7);

document.getElementById('view3d')?.addEventListener('click',()=>setView(new THREE.Vector3(22,19,23),center));
document.getElementById('viewTop')?.addEventListener('click',()=>setView(new THREE.Vector3(11,34,4.5),new THREE.Vector3(11,0,4.5)));
document.getElementById('viewFront')?.addEventListener('click',()=>setView(new THREE.Vector3(11,7,24),new THREE.Vector3(11,1.5,4.5)));
document.getElementById('viewInside')?.addEventListener('click',()=>setView(new THREE.Vector3(X(590),1.65,Z(585)),new THREE.Vector3(X(690),1.45,Z(510))));

function bindToggle(id,obj){
  const b=document.getElementById(id);if(!b)return;
  b.addEventListener('click',()=>{obj.visible=!obj.visible;b.classList.toggle('active',obj.visible);});
}
bindToggle('toggleRoof',roof);
bindToggle('toggleWalls',walls);
bindToggle('toggleFurniture',furniture);
bindToggle('toggleLabels',labels);
bindToggle('toggleCeiling',ceiling);
bindToggle('toggleInfra',details);

document.getElementById('toggleLights')?.addEventListener('click',e=>{
  const on=!e.currentTarget.classList.contains('active');
  e.currentTarget.classList.toggle('active',on);
  interiorLights.forEach(l=>l.intensity=on?18:0);
});

const buttons=[...document.querySelectorAll('.viewRow button')];
buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('active'));b.classList.add('active');}));

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const selection=document.getElementById('selection');
function pick(ev){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((ev.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((ev.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([floors,walls,furniture,details,roof],true);
  if(!hits.length)return;
  let o=hits[0].object;
  while(o && !o.name && o.parent)o=o.parent;
  const name=o?.name || o?.parent?.name;
  const kind=o?.userData?.kind || o?.parent?.userData?.kind;
  if(selection && name) selection.innerHTML=`<strong>${name}</strong>${kind?`<br><span>${kind}</span>`:''}`;
}
renderer.domElement.addEventListener('pointerdown',pick);

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);

function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
animate();