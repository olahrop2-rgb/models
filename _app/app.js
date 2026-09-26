// Проигрыватель модели Базиса: один на все проекты. Данные — ./model.json рядом со страницей проекта.
import * as THREE from 'three';

const APP_DATE = '2026-09-26';
const $ = id => document.getElementById(id);

// ---------------- разметка ----------------
document.body.insertAdjacentHTML('beforeend', `
<div id="load">загрузка модели…</div>
<div id="tree" class="hidden">
  <div class="head">
    <input type="search" id="q" placeholder="поиск по названию или материалу">
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
<div id="rlabel"></div>
<div id="stamp"></div>
<div id="bar">
  <button id="bTree">структура</button><span class="sep"></span>
  <button id="vF">спереди</button><button id="vB">сзади</button><button id="vL">слева</button>
  <button id="vR">справа</button><button id="vT">сверху</button><button id="v3">объём</button>
  <button id="bPersp" class="on" title="Перспектива. Выключена — строгий вид без искажений">перспектива</button>
  <button id="bFit">вписать</button><span class="sep"></span>
  <button id="m1" class="on">залито</button><button id="m2">полупрозрачно</button><button id="m3">рёбра</button>
  <span class="sep"></span>
  <button id="bF" class="on">фурнитура</button><button id="bB" class="on">профили</button><button id="bL" class="on">линии</button><button id="bRuler">линейка</button>
  <button id="bOpen">открыть всё</button><button id="bClose">закрыть всё</button>
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
  const x0 = t && !t.classList.contains('hidden') ? t.offsetWidth : 0;
  const y1 = innerHeight - (bar ? bar.offsetHeight : 0);
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
function snap(hit, cx, cy) {
  // ближайшая вершина детали в пределах 12 точек экрана
  const pos = hit.object.geometry.attributes.position, mw = hit.object.matrixWorld;
  let best = null, bd = 144; const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mw);
    const s = v.clone().project(cam);
    const sx = (s.x + 1) / 2 * innerWidth, sy = (1 - s.y) / 2 * innerHeight;
    const d2 = (sx - cx) ** 2 + (sy - cy) ** 2;
    if (d2 < bd) { bd = d2; best = v.clone(); }
  }
  return best || hit.point.clone();
}
function drawRuler() {
  if (rline) { scene.remove(rline); rline = null; }
  if (rp.length < 2) { $('st').textContent = 'линейка: укажи вторую точку'; updRuler(); need(); return; }
  rline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rp),
    new THREE.LineBasicMaterial({ color: 0xd94f2b, depthTest: false }));
  rline.renderOrder = 10; scene.add(rline);
  const d = rp[0].distanceTo(rp[1]), dv = rp[1].clone().sub(rp[0]);
  const f = x => Math.round(Math.abs(x) * 10) / 10;
  $('st').textContent = 'расстояние ' + f(d) + ' мм  (ширина ' + f(dv.x) + ', высота ' + f(dv.y) + ', глубина ' + f(dv.z) + ')';
  updRuler(); need();
}
function updRuler() {
  const el = $('rlabel');
  if (rp.length < 2) { el.style.display = 'none'; return; }
  const mid = rp[0].clone().add(rp[1]).multiplyScalar(0.5).project(cam);
  el.style.display = 'block';
  el.style.left = ((mid.x + 1) / 2 * innerWidth) + 'px';
  el.style.top = ((1 - mid.y) / 2 * innerHeight) + 'px';
  el.textContent = (Math.round(rp[0].distanceTo(rp[1]) * 10) / 10) + ' мм';
}
function stopRuler() {
  ruler = false; rp = []; if (rline) { scene.remove(rline); rline = null; }
  $('bRuler').className = ''; $('st').textContent = ''; updRuler(); need();
}

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
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  drag = { b: e.button, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
  if (e.button === 1) {
    e.preventDefault();
    const h = pick(e.clientX, e.clientY);
    if (h && !toggleAt(h.object.userData.idx)) $('st').textContent = 'эта деталь неподвижна';
  }
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
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
  const d = drag; drag = null;
  if (!d || d.b !== 0 || Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y0) > 4) return;
  const h = pick(e.clientX, e.clientY);
  if (ruler) { if (h) { rp.push(snap(h, e.clientX, e.clientY)); if (rp.length > 2) rp = [rp[rp.length - 1]]; drawRuler(); } return; }
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
  $('bRuler').onclick = () => { if (ruler) { stopRuler(); return; } ruler = true; rp = []; $('bRuler').className = 'on'; $('st').textContent = 'линейка: укажи первую точку'; };
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
    window.__viewer = { parts, animNode, M };   // для проверки из консоли
    $('load').remove(); loop();
  })
  .catch(err => { $('load').textContent = 'Не удалось открыть модель: ' + err.message; });
