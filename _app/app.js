// Проигрыватель модели Базиса: один на все проекты. Данные — ./model.json рядом со страницей проекта.
import * as THREE from 'three';

const APP_DATE = '2026-09-26 (тест телефона)';
const $ = id => document.getElementById(id);
// телефон/планшет: палец вместо мыши — свои жесты, компактные кнопки, структура снизу
const TOUCH = matchMedia('(pointer: coarse)').matches;
if (TOUCH) document.documentElement.classList.add('touch');
// страница не масштабируется и не уезжает — все касания забирает модель
(() => {
  let vp = document.querySelector('meta[name=viewport]');
  if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.appendChild(vp); }
  vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  // «добавить на главный экран»: у каждого проекта свой manifest.json (пишет выгрузка), иконка общая
  const add = (tag, attrs) => { const el = document.createElement(tag); for (const k in attrs) el.setAttribute(k, attrs[k]); document.head.appendChild(el); };
  if (!document.querySelector('link[rel=manifest]')) add('link', { rel: 'manifest', href: 'manifest.json' });
  add('link', { rel: 'apple-touch-icon', href: '../_app/icon-192.png' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'theme-color', content: '#2b2f36' });
})();

// ---------------- разметка ----------------
document.body.insertAdjacentHTML('beforeend', `
<div id="load">загрузка модели…</div>
<div id="tree" class="hidden">
  <div class="head">
    <div class="row top"><input type="search" id="q" placeholder="поиск по названию"><button id="tClose" title="Закрыть">✕</button></div>
    <div class="row">
      <button id="tOnly" title="Скрыть всё, кроме выделенного">только это</button>
      <button id="tHide" title="Скрыть выделенное (Delete)">скрыть</button>
      <button id="tAll">показать всё</button>
      <button id="tFit" title="Приблизить к выделенному">к выделенному</button>
    </div>
  </div>
  <div class="body" id="tbody"></div>
</div>
<div id="card"></div>
<div id="rlabel"></div><div id="snapmk"></div>
<div id="stamp"></div>
<canvas id="loupe" width="240" height="240"></canvas>
<div id="hint"><b>Как смотреть</b>
  <p>☝ один палец — вращать</p><p>✌ два пальца — приблизить и сдвинуть</p>
  <p>👆 коснуться двери или ящика — открыть / закрыть</p><p>✋ подержать палец на детали — что это за деталь</p>
  <p>📏 рулетка: ведите пальцем — в круге видно точку, отпустите — точка поставлена</p>
  <small>коснитесь, чтобы закрыть</small></div>
<div id="bar">
  <button id="bTree">структура</button><span class="sep"></span>
  <button id="vF">спереди</button><button id="vB" class="x">сзади</button><button id="vL" class="x">слева</button>
  <button id="vR" class="x">справа</button><button id="vT">сверху</button><button id="v3">объём</button>
  <button id="bPersp" class="on x" title="Перспектива. Выключена — строгий вид без искажений">перспектива</button>
  <button id="bFit" class="x">вписать</button><span class="sep x"></span>
  <button id="m1" class="on x">залито</button><button id="m2" class="x">полупрозрачно</button><button id="m3" class="x">рёбра</button>
  <span class="sep x"></span>
  <button id="bF" class="on x">фурнитура</button><button id="bB" class="on x">профили</button><button id="bL" class="on x">линии</button><button id="bRuler">рулетка</button><button id="bDimClr" class="x">стереть размеры</button>
  <button id="bOpen" class="nt">открыть всё</button><button id="bClose" class="nt">закрыть всё</button>
  <button id="bMore" title="Ещё">⋯</button>
  <span id="st"></span>
</div>`);
$('stamp').textContent = 'проигрыватель от ' + APP_DATE;

// ---------------- сцена ----------------
const scene = new THREE.Scene();
const root = new THREE.Group(); scene.add(root);
scene.add(new THREE.AmbientLight(0xffffff, 1.9));
const d1 = new THREE.DirectionalLight(0xffffff, 1.5); d1.position.set(1, 2, 1.2); scene.add(d1);
const d2 = new THREE.DirectionalLight(0xffffff, 0.6); d2.position.set(-1, -0.6, -1); scene.add(d2);

const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
rend.setPixelRatio(Math.min(devicePixelRatio || 1, 2));   // выше двойки — только нагрев телефона
rend.setSize(innerWidth, innerHeight);
document.body.prepend(rend.domElement);

const persp = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1e6);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e6, 1e6);
let cam = persp;

// перерисовка только когда что-то изменилось
let dirty = true;
const need = () => { dirty = true; };

// ---------------- данные ----------------
const EDGE = new THREE.LineBasicMaterial({ color: 0x5a626b, transparent: true, opacity: 0.55 });
let M;                 // модель
const parts = [];      // деталь/единица фурнитуры: {g, meshes, edges, h, n, mat, isF, hidden, i}
const nodes = {};      // узел структуры: {id, name, kids[], parts[], parent, hidden, count}
const rootKids = [], rootParts = [];
const animNode = {};   // подвижный узел: id → {a, ang, d, c, t}
const moving = [];     // детали, у которых есть подвижные предки
const picks = [];
const box = new THREE.Box3();
let rad = 1000, showF = true, showB = true, showL = true;
const KIND = { p: 'панель', f: 'фурнитура', b: 'профиль', m: '3D-объект', l: 'линия' };
const NTYPE = { TFurnBlock: 'блок', TFurnAsm: 'сборка', TDraftBlock: 'полуфабрикат', layer: 'слой' };

function colorOf(c) { return (c[0] << 16) | (c[1] << 8) | c[2]; }

// модель первой версии (цвет прямо в куске) — привести к общему виду
function upgradeV1() {
  if (M.v >= 2) return;
  const mats = [], idx = {};
  const mi = c => { const k = c.join(','); if (idx[k] === undefined) { idx[k] = mats.length; mats.push({ c, t: -1, sx: 1000, sy: 1000, a: 0, tr: 0 }); } return idx[k]; };
  M.shapes = M.shapes.map(sh => sh.map(sd => ({ m: mi(sd.c), v: sd.v })));
  for (const od of M.objs) { if (od.p) od.p = od.p.map(pd => ({ m: mi(pd.c), v: pd.v })); od.k = od.f !== undefined ? 'f' : 'p'; }
  M.mats = mats; M.tex = []; M.anim = {};
}

// материалы: картинки грузятся один раз, у каждой детали своя копия материала (для подсветки выделения)
const texCache = {};
function texture(ti, mt) {
  const name = M.tex[ti];
  if (!texCache[name]) {
    const tx = new THREE.TextureLoader().load('../_tex/' + name, need);
    tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    // uvs=1: выгрузка уже перевела координаты в доли картинки (с учётом шага и фурнитуры в долях)
    if (!M.uvs) tx.repeat.set(1 / (mt.sx || 1000), 1 / (mt.sy || 1000));
    // «угол» из карточки не применяем: у кромок он 90, а картинка у Базиса и так лежит вдоль (прогон 26.09)
    texCache[name] = tx;
  }
  return texCache[name];
}
const matProto = [];
function materialFor(mi) {
  if (!matProto[mi]) {
    const mt = M.mats[mi] || { c: [160, 160, 160], t: -1 };
    const opt = { color: colorOf(mt.c), side: THREE.DoubleSide };
    if (mt.t >= 0) opt.map = texture(mt.t, mt);
    if (mt.tr > 0 && mt.tr < 1) { opt.transparent = true; opt.opacity = Math.max(0.15, 1 - mt.tr); opt.depthWrite = false; }
    matProto[mi] = new THREE.MeshLambertMaterial(opt);
  }
  const m = matProto[mi].clone(); m.userData.base = matProto[mi];
  return m;
}
function geom(pd) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pd.v, 3));
  if (pd.u) g.setAttribute('uv', new THREE.Float32BufferAttribute(pd.u, 2));
  g.computeVertexNormals();
  return g;
}

function build() {
  upgradeV1();
  const SG = M.shapes.map(sh => sh.map(sd => ({ g: geom(sd), m: sd.m })));
  for (const id in M.anim) {
    const s = M.anim[id];
    animNode[id] = { a: new THREE.Vector3(s[0], s[1], s[2]), ang: s[3], d: s[4], c: new THREE.Vector3(s[5], s[6], s[7]), t: 0 };
  }
  M.objs.forEach((od, i) => {
    const grp = new THREE.Group(), meshes = [], edges = [];
    if (od.k === 'l') {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(od.l, 3));
      grp.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: colorOf(od.c || [90, 98, 107]) })));
    } else if (od.f !== undefined) {
      const inst = new THREE.Group(); inst.matrixAutoUpdate = false;
      const t = od.t;
      inst.matrix.set(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], 0, 0, 0, 1);
      for (const s of SG[od.f]) {
        const m = new THREE.Mesh(s.g, materialFor(s.m)); m.userData.idx = i; inst.add(m); meshes.push(m); picks.push(m);
      }
      grp.add(inst);
    } else {
      for (const pd of od.p) {
        const g = geom(pd); g.computeBoundingBox(); box.union(g.boundingBox);
        const m = new THREE.Mesh(g, materialFor(pd.m)); m.userData.idx = i; grp.add(m); meshes.push(m); picks.push(m);
        const ln = new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), EDGE); grp.add(ln); edges.push(ln);
      }
    }
    root.add(grp);
    const h = od.h || [];
    // подвижные предки — от внешнего к внутреннему (h идёт от ближайшего владельца вверх)
    const chainA = h.filter(id => animNode[id]).reverse();
    const rec = { g: grp, meshes, edges, h, n: od.n, kind: od.k || 'p', isF: od.k === 'f' || od.k === 'm', isB: od.k === 'b', isL: od.k === 'l', hidden: false, i, chainA };
    parts.push(rec);
    if (chainA.length) { grp.matrixAutoUpdate = false; moving.push(rec); }
  });
  poseAll();

  // структура: цепочка h идёт от ближайшего владельца к верхнему
  parts.forEach((p, i) => {
    let parent = null;
    for (let k = p.h.length - 1; k >= 0; k--) {
      const id = p.h[k];
      let nd = nodes[id];
      if (!nd) {
        nd = nodes[id] = { id, name: M.names[id] || '(без имени)', kids: [], parts: [], parent: parent ? parent.id : -1,
                           hidden: false, count: 0, open: false };
        (parent ? parent.kids : rootKids).push(id);
      }
      nd.count++;
      parent = nd;
    }
    (parent ? parent.parts : rootParts).push(i);
  });

  const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  root.position.set(-ctr.x, -ctr.y, -ctr.z);
  rad = Math.max(size.x, size.y, size.z) || 1000;
  view.dist = rad * 1.8;
  document.title = M.title || 'Просмотр изделия';
}

// ---------------- движение: у каждого звена своя дуга, звено внутри звена складывается ----------------
// Замер diag_14: «всё открыто» = внешнее ∘ … ∘ внутреннее, каждое снято при закрытых остальных, 0 мм.
const ONE = new THREE.Vector3(1, 1, 1);
function screwMatrix(n) {
  const q = new THREE.Quaternion().setFromAxisAngle(n.a, n.ang * n.t);
  const p = n.c.clone().sub(n.c.clone().applyQuaternion(q)).addScaledVector(n.a, n.d * n.t);
  return new THREE.Matrix4().compose(p, q, ONE);
}
function poseAll() {
  for (const pr of moving) {
    const m = new THREE.Matrix4();
    for (const id of pr.chainA) m.multiply(screwMatrix(animNode[id]));   // внешнее слева, внутреннее справа
    pr.g.matrix.copy(m);
  }
}
const anims = [];   // {ids, from[], to, st}
function startAnim(ids, to) {
  if (!ids.length) return;
  anims.push({ ids, from: ids.map(id => animNode[id].t), to, st: performance.now() });
  need();
}
function tick() {
  if (!anims.length) return;
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    const k = Math.min(1, (performance.now() - a.st) / 900);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    a.ids.forEach((id, j) => { animNode[id].t = a.from[j] + (a.to - a.from[j]) * e; });
    if (k >= 1) anims.splice(i, 1);
  }
  poseAll(); need();
}
// щелчок по детали: внешнее подвижное звено и всё, что внутри него, — как в Базисе
// Если подвижное звено сидит в небольшой «системе» (ящик + его направляющие), открывается вся система:
// направляющая у Базиса лежит рядом с ящиком, а не внутри него. Система = владелец звена, если в нём
// деталей не больше чем в 2,5 раза больше, чем в самом звене (иначе это модуль — открываем только звено).
function toggleAt(i) {
  const ch = parts[i].chainA;
  if (!ch.length) return false;
  const top = ch[0], ids = new Set(), h = parts[i].h;
  const pIdx = h.indexOf(top) + 1, P = pIdx < h.length ? h[pIdx] : null;
  let scope = top;
  if (P !== null && (!M.ntype || M.ntype[P] !== 'layer') && partsUnder(P).length <= 2.5 * partsUnder(top).length) scope = P;
  for (const pr of moving) {
    if (!pr.h.includes(scope)) continue;
    const k = scope === top ? pr.chainA.indexOf(top) : 0;
    for (let q = Math.max(0, k); q < pr.chainA.length; q++) ids.add(pr.chainA[q]);
  }
  startAnim([...ids], animNode[top].t > 0.5 ? 0 : 1);
  return true;
}
const allAnimIds = () => Object.keys(animNode);

// ---------------- камера ----------------
const view = { yaw: 0.7, pitch: 0.28, dist: 1000, target: new THREE.Vector3(), persp: true };
function viewHeight() { return 2 * view.dist * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)); }
function place() {
  const { yaw, pitch, dist, target } = view;
  const pos = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw))
    .multiplyScalar(dist).add(target);
  const f = target.clone().sub(pos).normalize();
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new THREE.Vector3().crossVectors(right, f).normalize();   // верно и при взгляде строго сверху
  cam = view.persp ? persp : ortho;
  cam.position.copy(pos); cam.up.copy(up); cam.lookAt(target);
  const asp = innerWidth / innerHeight;
  // центр вида — середина свободного места (без панели структуры и нижней строки кнопок)
  const fr = freeRect(), ox = -(fr.x0 + fr.x1 - innerWidth) / 2, oy = -(fr.y0 + fr.y1 - innerHeight) / 2;
  persp.aspect = asp; persp.near = Math.max(1, dist / 1000); persp.far = dist + rad * 60;
  persp.setViewOffset(innerWidth, innerHeight, ox, oy, innerWidth, innerHeight);
  const h = viewHeight();
  ortho.left = -h * asp / 2; ortho.right = h * asp / 2; ortho.top = h / 2; ortho.bottom = -h / 2;
  ortho.near = -rad * 60; ortho.far = rad * 60;
  ortho.setViewOffset(innerWidth, innerHeight, ox, oy, innerWidth, innerHeight);
  updRuler(); need();
}
function freeRect() {
  const t = $('tree'), bar = $('bar');
  const open = t && !t.classList.contains('hidden');
  let y1 = innerHeight - (bar ? bar.offsetHeight : 0), x0 = 0;
  if (open && TOUCH) y1 = Math.min(y1, t.getBoundingClientRect().top);   // на телефоне структура выезжает снизу
  else if (open) x0 = t.offsetWidth;
  return { x0, x1: innerWidth, y0: 0, y1 };
}
function setPersp(on) { view.persp = on; $('bPersp').className = on ? 'on' : ''; place(); }
function strictView(yaw, pitch) { view.yaw = yaw; view.pitch = pitch; setPersp(false); fitVisible(); }

// точка под курсором на плоскости цели (для масштаба к курсору и сдвига)
function onTargetPlane(cx, cy) {
  const ndc = new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, cam);
  const n = cam.getWorldDirection(new THREE.Vector3());
  const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, view.target);
  return rc.ray.intersectPlane(pl, new THREE.Vector3());
}

function visibleBox(onlySel) {
  const b = new THREE.Box3();
  root.updateMatrixWorld(true);
  const list = onlySel ? selSet : parts.map((p, i) => i);
  for (const i of list) {
    const p = parts[i];
    if (!onlySel && !p.g.visible) continue;
    b.expandByObject(p.g);
  }
  return b;
}
function fitBox(b) {
  if (b.isEmpty()) return;
  const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  view.target.copy(c);
  // по экранной проекции рамки: сколько места она занимает по ширине и высоте окна
  const r = Math.max(s.x, s.y, s.z, 100) * 0.5;
  const pts = [];
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new THREE.Vector3(x, y, z));
  const f = new THREE.Vector3(Math.cos(view.pitch) * Math.sin(view.yaw), Math.sin(view.pitch), Math.cos(view.pitch) * Math.cos(view.yaw));
  const right = new THREE.Vector3(Math.cos(view.yaw), 0, -Math.sin(view.yaw));
  const up = new THREE.Vector3().crossVectors(right, f.clone().negate()).normalize();
  let w = 0, h = 0;
  for (const p of pts) { const d = p.clone().sub(c); w = Math.max(w, Math.abs(d.dot(right))); h = Math.max(h, Math.abs(d.dot(up))); }
  const fr = freeRect(), fw = fr.x1 - fr.x0, fh = fr.y1 - fr.y0;
  const hView = Math.max(h, w * fh / fw) * 2 * 1.08 * innerHeight / fh;   // с полями 8 % в свободном месте
  view.dist = hView / (2 * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2))) + (view.persp ? r : 0);
  place();
}
function fitVisible() { fitBox(visibleBox(false)); }

// ---------------- видимость ----------------
function effVisible(p) {
  if (p.hidden) return false;
  if (p.isF && !showF) return false;
  if (p.isB && !showB) return false;
  if (p.isL && !showL) return false;
  for (const id of p.h) if (nodes[id].hidden) return false;
  return true;
}
function applyVis() { for (const p of parts) p.g.visible = effVisible(p); need(); }
function showAll() {
  for (const p of parts) p.hidden = false;
  for (const k in nodes) nodes[k].hidden = false;
  applyVis(); renderTree();
}
function hideSel() {
  if (selNode !== null) nodes[selNode].hidden = true;
  else for (const i of selSet) parts[i].hidden = true;
  clearSel(); applyVis(); renderTree();
}
function isolateSel() {
  if (!selSet.length) return;
  const keep = new Set(selSet);
  for (const k in nodes) nodes[k].hidden = false;
  parts.forEach((p, i) => { p.hidden = !keep.has(i); });
  applyVis(); renderTree();
}

// ---------------- выделение ----------------
let selIdx = -1, selLevel = -1, selSet = [], selNode = null;
const NCNT = {};
function initLevels() { for (const p of parts) for (const id of p.h) NCNT[id] = (NCNT[id] || 0) + 1; }
function sizeAt(i, k) { return k < 0 ? 1 : (NCNT[parts[i].h[k]] || 1); }
function upLevel(i, from) {
  const h = parts[i].h, cur = sizeAt(i, from);
  for (let k = from + 1; k < h.length; k++) if ((NCNT[h[k]] || 0) > cur) return k;
  return h.length ? h.length - 1 : -1;
}
function downLevel(i, from) {
  if (from < 0) return -1;
  const cur = sizeAt(i, from);
  for (let k = from - 1; k >= 0; k--) if ((NCNT[parts[i].h[k]] || 0) < cur) return k;
  return -1;
}
function partsUnder(id) { const out = []; parts.forEach((p, i) => { if (p.h.includes(id)) out.push(i); }); return out; }
function selectPart(i, level) {
  selIdx = i; selLevel = level;
  if (level < 0) { selNode = null; selSet = [i]; }
  else { selNode = parts[i].h[Math.min(level, parts[i].h.length - 1)]; selSet = partsUnder(selNode); }
  paint(); revealInTree();
}
function selectNode(id) { selNode = id; selIdx = -1; selSet = partsUnder(id); paint(); renderTree(); }
function clearSel() { selIdx = -1; selSet = []; selNode = null; paint(); renderTree(); }
function paint() {
  const on = new Set(selSet);
  parts.forEach((p, i) => {
    for (const m of p.meshes) {
      m.material.emissive.setHex(on.has(i) ? 0x2b6cb0 : 0x000000);
      m.material.emissiveIntensity = on.has(i) ? 0.45 : 0;
    }
  });
  const d = $('card');
  if (!selSet.length) { d.style.display = 'none'; need(); return; }
  d.style.display = 'block';
  let title, sub, chainOf;
  if (selNode === null) {
    const p = parts[selSet[0]];
    title = p.n; sub = KIND[p.kind] || ''; chainOf = p.h;
  } else {
    title = nodes[selNode].name; sub = selSet.length + ' объектов';
    const any = parts[selSet[0]]; chainOf = any.h.slice(any.h.indexOf(selNode));
  }
  const path = chainOf.slice().reverse().map(id => M.names[id]).join(' ▸ ');
  d.innerHTML = '<b></b><small></small><br><small></small>';
  d.children[0].textContent = title || '(без имени)';
  d.children[1].textContent = sub || '';
  d.children[3].textContent = path;
  need();
}

// ---------------- дерево ----------------
const tbody = $('tbody');
function nodeRow(nd, depth) {
  const r = document.createElement('div');
  r.className = 'tr' + (selNode === nd.id ? ' sel' : '') + (nodeOff(nd) ? ' off' : '');
  r.style.paddingLeft = (4 + depth * 14) + 'px';
  const hasKids = nd.kids.length + nd.parts.length > 0;
  r.innerHTML = '<span class="cr"></span><input type="checkbox"><span class="nm"></span><span class="tp"></span>';
  r.children[0].textContent = hasKids ? (nd.open ? '▾' : '▸') : '';
  r.children[1].checked = !nd.hidden;
  r.children[2].textContent = nd.name;
  r.children[3].textContent = ((M.ntype && NTYPE[M.ntype[nd.id]]) || 'узел') + ' · ' + nd.count;
  r.children[0].onclick = e => { e.stopPropagation(); nd.open = !nd.open; renderTree(); };
  r.children[1].onclick = e => { e.stopPropagation(); nd.hidden = !r.children[1].checked; applyVis(); renderTree(); };
  r.onclick = () => selectNode(nd.id);
  r.ondblclick = () => { selectNode(nd.id); fitBox(visibleBox(true)); };
  return r;
}
function partRow(i, depth) {
  const p = parts[i];
  const r = document.createElement('div');
  r.className = 'tr' + (selNode === null && selSet.includes(i) ? ' sel' : '') + (effVisible(p) ? '' : ' off');
  r.style.paddingLeft = (4 + depth * 14) + 'px';
  r.innerHTML = '<span class="cr"></span><input type="checkbox"><span class="nm"></span><span class="tp"></span>';
  r.children[1].checked = !p.hidden;
  r.children[2].textContent = p.n || '(без имени)';
  r.children[3].textContent = KIND[p.kind] || '';
  r.children[1].onclick = e => { e.stopPropagation(); p.hidden = !r.children[1].checked; applyVis(); renderTree(); };
  r.onclick = () => selectPart(i, -1);
  r.ondblclick = () => { selectPart(i, -1); fitBox(visibleBox(true)); };
  return r;
}
function nodeOff(nd) {
  for (let id = nd.id; id !== -1; id = nodes[id].parent) if (nodes[id].hidden) return true;
  return false;
}
function renderTree() {
  if ($('tree').classList.contains('hidden')) return;
  const q = $('q').value.trim().toLowerCase();
  const frag = document.createDocumentFragment();
  if (q) {
    let n = 0;
    for (const k in nodes) if (nodes[k].name.toLowerCase().includes(q) && n++ < 300) frag.appendChild(nodeRow(nodes[k], 0));
    parts.forEach((p, i) => {
      if (n >= 300) return;
      if ((p.n || '').toLowerCase().includes(q)) { frag.appendChild(partRow(i, 0)); n++; }
    });
  } else {
    const walk = (ids, pis, depth) => {
      for (const id of ids) {
        const nd = nodes[id]; frag.appendChild(nodeRow(nd, depth));
        if (nd.open) walk(nd.kids, nd.parts, depth + 1);
      }
      for (const i of pis) frag.appendChild(partRow(i, depth));
    };
    walk(rootKids, rootParts, 0);
  }
  const st = tbody.scrollTop;
  tbody.replaceChildren(frag);
  tbody.scrollTop = st;
}
function revealInTree() {
  if (selIdx >= 0) {
    const h = parts[selIdx].h;
    const upto = selNode === null ? 0 : h.indexOf(selNode) + 1;
    for (let k = h.length - 1; k >= upto; k--) nodes[h[k]].open = true;
  }
  renderTree();
  const s = tbody.querySelector('.tr.sel');
  if (s) s.scrollIntoView({ block: 'nearest' });
}

// ---------------- линейка ----------------
let ruler = false, rp = [], rline = null;
function snap(hit, cx, cy, px = 12) {
  // ближайшая вершина детали в пределах px точек экрана (под палец — крупнее)
  const pos = hit.object.geometry.attributes.position, mw = hit.object.matrixWorld;
  let best = null, bd = px * px; const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mw);
    const s = v.clone().project(cam);
    const sx = (s.x + 1) / 2 * innerWidth, sy = (1 - s.y) / 2 * innerHeight;
    const d2 = (sx - cx) ** 2 + (sy - cy) ** 2;
    if (d2 < bd) { bd = d2; best = v.clone(); }
  }
  return best || hit.point.clone();
}
// ---------------- размеры ----------------
// Две точки вдоль ширины, высоты или глубины → размер с выносными «лапками», его можно оттащить:
// точки на месте, линия с числом уезжает (вверх-вниз — читается спереди, к себе-от себя — сверху).
// Точки наискосок (отличаются больше чем по одному направлению) → прямая линия с числом, без лапок.
// Размеры остаются на модели; удалить — правой кнопкой по числу (на телефоне — подержать палец на числе).
const DIMC = 0xd94f2b, AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const dims = [];
const fmt = x => String(Math.round(Math.abs(x) * 10) / 10).replace('.', ',');
function axisOf(a, b) {
  const d = b.clone().sub(a), big = ['x', 'y', 'z'].filter(k => Math.abs(d[k]) > 0.5);
  return big.length === 1 ? big[0] : null;
}
function lineMat() { return new THREE.LineBasicMaterial({ color: DIMC, depthTest: false }); }
function buildDim(dm) {
  if (dm.g) scene.remove(dm.g);
  const g = new THREE.Group(); g.renderOrder = 10;
  const seg = pts => { const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat()); l.renderOrder = 10; g.add(l); };
  if (!dm.axis) { seg([dm.a, dm.b]); dm.mid = dm.a.clone().add(dm.b).multiplyScalar(0.5); }
  else {
    const a2 = dm.a.clone().add(dm.off), b2 = dm.b.clone().add(dm.off);
    const pts = [a2, b2];
    if (dm.off.lengthSq() > 1) { pts.push(dm.a, a2.clone().addScaledVector(dm.off.clone().normalize(), 8), dm.b, b2.clone().addScaledVector(dm.off.clone().normalize(), 8)); }
    // засечки на концах — косые чёрточки, как на чертеже
    const L = Math.max(8, Math.min(40, dm.a.distanceTo(dm.b) * 0.03));
    const u = AX[dm.axis].clone(), w = dm.off.lengthSq() > 1 ? dm.off.clone().normalize() : new THREE.Vector3().crossVectors(u, cam.getWorldDirection(new THREE.Vector3())).normalize();
    const t = u.clone().add(w).normalize().multiplyScalar(L);
    for (const p of [a2, b2]) pts.push(p.clone().sub(t), p.clone().add(t));
    seg(pts);
    dm.mid = a2.clone().add(b2).multiplyScalar(0.5);
  }
  dm.g = g; scene.add(g);
  dm.el.textContent = fmt(dm.a.distanceTo(dm.b));
}
function addDim(a, b) {
  const dm = { a, b, axis: axisOf(a, b), off: new THREE.Vector3(), el: document.createElement('div') };
  dm.el.className = 'dim';
  document.body.appendChild(dm.el);
  dims.push(dm); buildDim(dm); hookDim(dm); updRuler(); need();
  const dv = b.clone().sub(a);
  $('st').textContent = dm.axis ? 'размер ' + fmt(a.distanceTo(b)) + ' мм — потяните число, чтобы отодвинуть'
    : 'по прямой ' + fmt(a.distanceTo(b)) + ' мм  (ширина ' + fmt(dv.x) + ', высота ' + fmt(dv.y) + ', глубина ' + fmt(dv.z) + ')';
}
function removeDim(dm) { scene.remove(dm.g); dm.el.remove(); dims.splice(dims.indexOf(dm), 1); need(); }
// оттаскивание: смещение — по одной из двух осей поперёк размера, какая лучше совпадает с движением
function dragDim(dm, cx, cy, sdx, sdy) {
  if (!dm.axis) return;
  const ndc = new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, cam);
  const others = ['x', 'y', 'z'].filter(k => k !== dm.axis);
  // экранное направление каждой оси-кандидата
  const base = dm.mid.clone().project(cam);
  let best = null, bestScore = -1;
  for (const c of others) {
    const q = dm.mid.clone().add(AX[c].clone().multiplyScalar(100)).project(cam);
    const vx = (q.x - base.x) * innerWidth / 2, vy = -(q.y - base.y) * innerHeight / 2, vl = Math.hypot(vx, vy) || 1;
    const score = Math.abs((vx * sdx + vy * sdy) / vl);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  const third = others.find(k => k !== best);
  const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(AX[third], dm.a);
  const P = rc.ray.intersectPlane(pl, new THREE.Vector3());
  if (!P) return;
  dm.off = AX[best].clone().multiplyScalar(P.clone().sub(dm.a).dot(AX[best]));
  buildDim(dm); updRuler(); need();
}
function hookDim(dm) {
  let st = null, lp = null;
  dm.el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    try { dm.el.setPointerCapture(e.pointerId); } catch (err) {}
    st = { x: e.clientX, y: e.clientY, moved: false };
    if (e.button === 2) { removeDim(dm); st = null; return; }
    if (e.pointerType === 'touch') lp = setTimeout(() => { if (st && !st.moved) { removeDim(dm); st = null; } }, 650);
  });
  dm.el.addEventListener('pointermove', e => {
    if (!st) return;
    const sdx = e.clientX - st.x, sdy = e.clientY - st.y;
    if (!st.moved && Math.hypot(sdx, sdy) < 5) return;
    st.moved = true; clearTimeout(lp);
    dragDim(dm, e.clientX, e.clientY, sdx, sdy);
  });
  const end = () => { st = null; clearTimeout(lp); };
  dm.el.addEventListener('pointerup', end); dm.el.addEventListener('pointercancel', end);
  dm.el.addEventListener('contextmenu', e => e.preventDefault());
}
function updRuler() {
  for (const dm of dims) {
    const s = dm.mid.clone().project(cam);
    const vis = s.z < 1;
    dm.el.style.display = vis ? 'block' : 'none';
    dm.el.style.left = ((s.x + 1) / 2 * innerWidth) + 'px';
    dm.el.style.top = ((1 - s.y) / 2 * innerHeight) + 'px';
  }
}
// первая точка ждёт вторую; вторая — ставит размер
function addPoint(p) {
  if (!p) return;
  if (!rp.length) { rp = [p]; $('st').textContent = 'рулетка: укажи вторую точку'; showPending(); return; }
  const a = rp[0]; rp = []; showPending();
  if (a.distanceTo(p) < 0.5) return;
  addDim(a, p);
}
// первая точка и резиновая линия до курсора (на компьютере)
let pend = null;
function showPending(hover) {
  if (pend) { scene.remove(pend); pend = null; }
  if (!rp.length) { need(); return; }
  const pts = [rp[0], hover || rp[0]];
  const mk = new THREE.Group();
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: DIMC, depthTest: false, dashSize: 10, gapSize: 6 }));
  l.computeLineDistances(); l.renderOrder = 10; mk.add(l);
  pend = mk; scene.add(pend); need();
}
function clearDims() { while (dims.length) removeDim(dims[0]); rp = []; showPending(); }
function stopRuler() {
  ruler = false; rp = []; showPending(); hideHover();
  cv.style.cursor = '';
  $('bRuler').className = ''; $('st').textContent = ''; need();
}
// перекрестие на компьютере: метка прыгает на угол ещё до щелчка
function hover(cx, cy) {
  const h = pick(cx, cy), mk = $('snapmk');
  const p = h ? snap(h, cx, cy) : null;
  if (!p) { mk.style.display = 'none'; showPending(); $('st').textContent = rp.length ? 'рулетка: укажи вторую точку' : 'рулетка: укажи первую точку'; return; }
  const s = p.clone().project(cam);
  mk.style.display = 'block';
  mk.style.left = ((s.x + 1) / 2 * innerWidth) + 'px';
  mk.style.top = ((1 - s.y) / 2 * innerHeight) + 'px';
  if (rp.length) { showPending(p); $('st').textContent = 'рулетка: ' + fmt(rp[0].distanceTo(p)) + ' мм'; }
}
function hideHover() { const mk = $('snapmk'); if (mk) mk.style.display = 'none'; }

// ---------------- мышь ----------------
const ray = new THREE.Raycaster();
function pick(cx, cy) {
  ray.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), cam);
  const hs = ray.intersectObjects(picks, false);
  for (const h of hs) { let o = h.object, vis = true; while (o) { if (!o.visible) { vis = false; break; } o = o.parent; } if (vis) return h; }
  return null;
}
const cv = rend.domElement;
let drag = null;
cv.addEventListener('contextmenu', e => e.preventDefault());

// ---------------- пальцы ----------------
// один палец — вращение (с докруткой после отпускания), два — приближение щипком и сдвиг,
// короткое касание — открыть/закрыть дверь или ящик, долгое — выделить деталь и показать карточку
const touches = new Map();
let tState = null, spin = null, pressTimer = null;
function orbit(dx, dy) {
  view.yaw -= dx * 0.006;
  const lo = TOUCH ? 0 : -Math.PI / 2;                    // на телефоне снизу не заглянуть
  view.pitch = Math.max(lo, Math.min(Math.PI / 2, view.pitch + dy * 0.006));
}
function panBy(dx, dy) {
  const k = viewHeight() / innerHeight;
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  view.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
}
function zoomAt(k, cx, cy) {
  const nd = Math.max(rad * 0.08, Math.min(rad * 5, view.dist * k));   // не пролететь сквозь и не улететь
  k = nd / view.dist;
  const p = onTargetPlane(cx, cy); if (p) view.target.lerp(p, 1 - k);
  view.dist = nd;
}
function twoInfo() {
  const [a, b] = [...touches.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function spinLoop() {
  if (!spin || touches.size) { spin = null; return; }
  spin.vx *= 0.92; spin.vy *= 0.92;
  if (Math.abs(spin.vx) + Math.abs(spin.vy) < 0.3) { spin = null; return; }
  orbit(spin.vx, spin.vy); place();
  requestAnimationFrame(spinLoop);
}
// ---------------- рулетка под палец: лупа ----------------
// Одним пальцем в режиме рулетки модель не вращается: ведём палец, над ним круг с увеличенной картинкой
// и отметкой точки (с прилипанием к углу), отпустили — точка поставлена. Два пальца — как обычно.
const loupe = $('loupe'), lctx = loupe.getContext('2d');
let aim = null;
function aimAt(x, y) {
  const h = pick(x, y);
  aim = { x, y, p: h ? snap(h, x, y, 24) : null };
  rend.render(scene, cam);                                  // свежий кадр — сразу копируем из него кусок
  // круг 120 точек экрана (внутри 240 — для чёткости), увеличение 2,5
  const cw = rend.domElement.width / innerWidth, Z = 2.5, S = loupe.width, C = 120, k = S / C;
  const src = C / Z * cw;
  lctx.save(); lctx.clearRect(0, 0, S, S);
  lctx.beginPath(); lctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); lctx.clip();
  lctx.fillStyle = '#eef2f6'; lctx.fillRect(0, 0, S, S);
  lctx.drawImage(rend.domElement, x * cw - src / 2, y * cw - src / 2, src, src, 0, 0, S, S);
  // точка, к которой прилипло (или сам палец)
  let mx = S / 2, my = S / 2;
  if (aim.p) { const s = aim.p.clone().project(cam); mx = S / 2 + (((s.x + 1) / 2 * innerWidth) - x) * Z * k; my = S / 2 + (((1 - s.y) / 2 * innerHeight) - y) * Z * k; }
  lctx.strokeStyle = '#d94f2b'; lctx.lineWidth = 2;
  lctx.beginPath(); lctx.moveTo(mx - 14, my); lctx.lineTo(mx + 14, my); lctx.moveTo(mx, my - 14); lctx.lineTo(mx, my + 14); lctx.stroke();
  lctx.restore();
  lctx.strokeStyle = '#2b2f36'; lctx.lineWidth = 3; lctx.beginPath(); lctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); lctx.stroke();
  loupe.style.display = 'block';
  loupe.style.left = Math.min(innerWidth - 130, Math.max(10, x - 60)) + 'px';
  loupe.style.top = Math.max(10, y - 150) + 'px';
}
function aimEnd(place) {
  loupe.style.display = 'none';
  if (place && aim && aim.p) { addPoint(aim.p); }
  aim = null; need();
}

function touchDown(e) {
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  spin = null; clearTimeout(pressTimer);
  if (ruler && touches.size === 1) { tState = { aim: true }; aimAt(e.clientX, e.clientY); return; }
  if (aim) aimEnd(false);                                  // второй палец — отмена прицела, дальше щипок
  if (touches.size === 1) {
    tState = { one: true, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, vx: 0, vy: 0, long: false };
    pressTimer = setTimeout(() => {                        // долгое нажатие — выделить
      if (!tState || tState.moved || touches.size !== 1) return;
      tState.long = true;
      const h = pick(tState.x0, tState.y0);
      if (h) selectPart(h.object.userData.idx, -1); else clearSel();
    }, 550);
  } else if (touches.size === 2) {
    tState = { one: false, ...twoInfo() };
  }
}
function touchMove(e) {
  const p = touches.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (!tState) return;
  if (tState.aim) { aimAt(e.clientX, e.clientY); return; }
  if (tState.one && touches.size === 1) {
    if (Math.hypot(e.clientX - tState.x0, e.clientY - tState.y0) > 8) tState.moved = true;   // мёртвая зона дрожания
    if (!tState.moved) return;
    orbit(dx, dy); tState.vx = dx; tState.vy = dy; place();
  } else if (!tState.one && touches.size === 2) {
    const n = twoInfo();
    if (n.d > 10 && tState.d > 10) zoomAt(tState.d / n.d, n.x, n.y);
    panBy(n.x - tState.x, n.y - tState.y);
    tState.d = n.d; tState.x = n.x; tState.y = n.y; place();
  }
}
function touchUp(e) {
  touches.delete(e.pointerId); clearTimeout(pressTimer);
  if (tState && tState.aim) { tState = null; aimEnd(e.type === 'pointerup'); return; }
  const s = tState;
  if (touches.size === 1) { const [q] = [...touches.values()]; tState = { one: true, x0: q.x, y0: q.y, t0: 0, moved: true, vx: 0, vy: 0 }; return; }
  tState = null;
  if (!s || !s.one) return;
  if (s.moved) { spin = { vx: s.vx, vy: s.vy }; requestAnimationFrame(spinLoop); return; }
  if (s.long || performance.now() - s.t0 > 500) return;
  // короткое касание
  const h = pick(e.clientX, e.clientY);
  if (ruler) { if (h) { addPoint(snap(h, e.clientX, e.clientY, 24)); } return; }
  if (h) { if (!toggleAt(h.object.userData.idx)) selectPart(h.object.userData.idx, -1); }
  else clearSel();
}

cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') { touchDown(e); return; }
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  drag = { b: e.button, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
  if (e.button === 1) {
    e.preventDefault();
    const h = pick(e.clientX, e.clientY);
    if (h && !toggleAt(h.object.userData.idx)) $('st').textContent = 'эта деталь неподвижна';
  }
});
cv.addEventListener('pointercancel', e => { if (e.pointerType === 'touch') touchUp(e); });
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') { touchMove(e); return; }
  if (!drag) { if (ruler && e.pointerType === 'mouse') hover(e.clientX, e.clientY); return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (drag.b === 0) {
    view.yaw -= dx * 0.006;
    view.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.pitch + dy * 0.006));
    place();
  } else if (drag.b === 2) {
    const k = viewHeight() / innerHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    view.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    place();
  }
});
cv.addEventListener('pointerup', e => {
  if (e.pointerType === 'touch') { touchUp(e); return; }
  const d = drag; drag = null;
  if (!d || d.b !== 0 || Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y0) > 4) return;
  const h = pick(e.clientX, e.clientY);
  if (ruler) { if (h) { addPoint(snap(h, e.clientX, e.clientY)); } return; }
  if (h) { const i = h.object.userData.idx; selectPart(i, (e.ctrlKey || e.altKey) ? upLevel(i, -1) : -1); }
  else clearSel();
});
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
  const p = onTargetPlane(e.clientX, e.clientY);          // масштаб к курсору
  if (p) view.target.lerp(p, 1 - k);
  view.dist *= k; place();
}, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Tab') {
    e.preventDefault(); if (selIdx < 0) return;
    selectPart(selIdx, e.shiftKey ? downLevel(selIdx, selLevel) : upLevel(selIdx, selLevel));
  }
  if (e.key === 'Delete') hideSel();
  if (e.key === 'Escape') { stopRuler(); clearSel(); }
});
addEventListener('resize', () => { rend.setSize(innerWidth, innerHeight); place(); });

// ---------------- кнопки ----------------
function mode(m) {
  for (const p of parts) for (const x of p.meshes) {
    const mt = x.material, b = mt.userData.base || mt;   // стекло остаётся прозрачным и в обычном режиме
    mt.visible = m !== 3;
    mt.transparent = m === 2 || b.transparent;
    mt.opacity = m === 2 ? Math.min(0.32, b.opacity) : b.opacity;
    mt.depthWrite = m !== 2 && b.depthWrite; mt.needsUpdate = true;
  }
  ['m1', 'm2', 'm3'].forEach((id, n) => { $(id).className = n + 1 === m ? 'on' : ''; });
  need();
}
function wire() {
  $('bTree').onclick = () => { $('tree').classList.toggle('hidden'); $('bTree').className = $('tree').classList.contains('hidden') ? '' : 'on'; renderTree(); place(); };
  $('tClose').onclick = () => { $('tree').classList.add('hidden'); $('bTree').className = ''; place(); };
  $('bMore').onclick = () => { $('bar').classList.toggle('more'); $('bMore').className = $('bar').classList.contains('more') ? 'on' : ''; place(); };
  // подсказка по жестам — при первом открытии на телефоне
  const hint = $('hint');
  let seen = false; try { seen = localStorage.getItem('viewerHint') === '1'; } catch (e) {}
  if (TOUCH && !seen) hint.classList.add('show');
  hint.onclick = () => { hint.classList.remove('show'); try { localStorage.setItem('viewerHint', '1'); } catch (e) {} };
  $('q').oninput = renderTree;
  $('tOnly').onclick = isolateSel; $('tHide').onclick = hideSel; $('tAll').onclick = showAll;
  $('tFit').onclick = () => { if (selSet.length) fitBox(visibleBox(true)); };
  $('vF').onclick = () => strictView(0, 0);
  $('vB').onclick = () => strictView(Math.PI, 0);
  $('vL').onclick = () => strictView(-Math.PI / 2, 0);
  $('vR').onclick = () => strictView(Math.PI / 2, 0);
  $('vT').onclick = () => strictView(0, Math.PI / 2);
  $('v3').onclick = () => { view.yaw = 0.7; view.pitch = 0.28; setPersp(true); fitVisible(); };
  $('bPersp').onclick = () => setPersp(!view.persp);
  $('bFit').onclick = fitVisible;
  $('m1').onclick = () => mode(1); $('m2').onclick = () => mode(2); $('m3').onclick = () => mode(3);
  $('bF').onclick = () => { showF = !showF; $('bF').className = showF ? 'on' : ''; applyVis(); renderTree(); };
  $('bRuler').onclick = () => { if (ruler) { stopRuler(); return; } ruler = true; rp = []; $('bRuler').className = 'on'; cv.style.cursor = 'crosshair'; $('st').textContent = 'рулетка: укажи первую точку'; };
  $('bDimClr').onclick = clearDims;
  $('bOpen').onclick = () => startAnim(allAnimIds(), 1);
  $('bClose').onclick = () => startAnim(allAnimIds(), 0);
  $('bB').onclick = () => { showB = !showB; $('bB').className = showB ? 'on' : ''; applyVis(); renderTree(); };
  $('bL').onclick = () => { showL = !showL; $('bL').className = showL ? 'on' : ''; applyVis(); renderTree(); };
}

// ---------------- запуск ----------------
function loop() {
  requestAnimationFrame(loop);
  tick();
  if (!dirty) return;
  dirty = false;
  rend.render(scene, cam);
}
fetch('./model.json').then(r => { if (!r.ok) throw new Error('файл модели не найден (' + r.status + ')'); return r.json(); })
  .then(data => {
    M = data; build(); initLevels(); wire(); applyVis(); place(); fitVisible();
    window.__viewer = { parts, animNode, M, dims, addDim, dragDim, THREE };   // для проверки из консоли
    $('load').remove(); loop();
  })
  .catch(err => { $('load').textContent = 'Не удалось открыть модель: ' + err.message; });
