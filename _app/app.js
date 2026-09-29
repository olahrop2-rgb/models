// Проигрыватель модели Базиса: один на все проекты. Данные — ./model.json рядом со страницей проекта.
import * as THREE from 'three';

const APP_DATE = '2026-09-29';
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
  // один файл-страница (window.__MODEL — модель внутри файла): соседних файлов нет, значок и manifest не нужны
  if (!window.__MODEL) {
    if (!document.querySelector('link[rel=manifest]')) add('link', { rel: 'manifest', href: 'manifest.json' });
    add('link', { rel: 'apple-touch-icon', href: '../_app/icon-192.png' });
  }
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'theme-color', content: '#2b2f36' });
})();

// ---------------- значки кнопок ----------------
// Кнопки — значками вместо слов (замечание 27.09: «компактнее»). Подпись: на компьютере — при наведении,
// на телефоне — подержать палец на кнопке. Виды — кубиком справа вверху (см. «кубик видов»).
const sv = b => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const CT = '12,3 20,7.5 12,12 4,7.5', CF = '4,7.5 12,12 12,21 4,16.5', CR = '12,12 20,7.5 20,16.5 12,21';
const ICON = {
  // структура — как у веб-просмотра Базиса: точки со строками (замечание 29.09)
  tree: sv('<circle cx="4.5" cy="7" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="17" r="1.4" fill="currentColor"/><path d="M9 7h11M9 12h11M9 17h11"/>'),
  v3: sv(`<polygon points="${CT}" fill="currentColor" fill-opacity=".15"/><polygon points="${CF}" fill="currentColor" fill-opacity=".4"/><polygon points="${CR}" fill="currentColor" fill-opacity=".25"/>`),
  persp: sv('<path d="M2 20L8 5h8l6 15z"/><path d="M12 5v15M5 13h14"/>'),
  ortho: sv('<path d="M3 20V9h12v11zM3 9l5-5h12l-5 5M15 20l5-5V4"/>'),
  fit: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6"/>'),
  solid: sv('<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" fill-opacity=".55"/>'),
  ghost: sv('<rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" fill-opacity=".2"/><rect x="9" y="9" width="12" height="12" rx="2" fill="currentColor" fill-opacity=".2"/>'),
  wire: sv(`<polygon points="${CT}"/><polygon points="${CF}"/><polygon points="${CR}"/><path d="M4 7.5l8 4.5M12 3v9" stroke-dasharray="2 2"/>`),
  hw: sv('<circle cx="12" cy="12" r="7"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'),
  prof: sv('<path d="M5 4h14v3h-5v10h5v3H5v-3h5V7H5z"/>'),
  lines: sv('<path d="M3 18l6-6 4 4 8-9"/>'),
  ruler: sv('<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>'),
  undo: sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  dims: sv('<path d="M4 12h16M4 7v10M20 7v10M8 9.5L5 12l3 2.5M16 9.5l3 2.5-3 2.5"/>'),
  open: sv('<path d="M4 3h9v18H4zM13 3l6 3v15l-6-2"/>'),
  close: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M15 12h1"/>'),
  fac: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M15 12h1"/><path d="M3 21L21 3" stroke-width="2"/>'),
  eye: sv('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  faces: sv('<path d="M5 4v16M19 4v16M8 12h8M10.5 9.5L8 12l2.5 2.5M13.5 9.5L16 12l-2.5 2.5"/>'),
  edges: sv('<path d="M4 15L15 4M9 20L20 9"/><path d="M8.5 11.5l4 4" stroke-dasharray="1.5 1.5"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
  easy: sv('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M7 12h10M7 12l2-2M7 12l2 2M17 12l-2-2M17 12l-2 2"/>'),
  points: sv('<circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/><path d="M8 12h8" stroke-dasharray="2 2"/>'),
};
// кнопка строки → значок и подпись
// Строка кнопок — короткая (решение 28–29.09): виды ушли в кубик, способы показа и камеры — окошком
// рядом со своей кнопкой (как способы у рулетки), структура — язычком у левого края.
// Надписи кнопок, подсказок к ним и окошек — українською (просьба Богдана, 29.09): страницу смотрят заказчики.
const BTN_ICON = {
  bShowAll: ['eye', 'показати все'],
  bMode: ['solid', 'вигляд: суцільно / напівпрозоро / лінії'],
  bCam: ['persp', 'камера: перспектива / без перспективи / вписати'],
  bOC: ['open', 'відкрити все / закрити все'],
  bFac: ['fac', 'сховати фасади / показати фасади'],
  bRuler: ['ruler', 'рулетка'], bUndo: ['undo', 'скасувати точку (Esc, права кнопка)'],
  bDims: ['dims', 'розміри: коротко — сховати/показати, довго — видалити всі'],
};
// Фурнитура, профили, линии — служебное, заказчику не показываем. Видно, когда проигрыватель открыт
// у Алексея на компьютере (местный адрес) или в режиме сборки (хвост ссылки #сборка).
const SERVICE = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) || decodeURIComponent(location.hash).includes('сборка');

// ---------------- разметка ----------------
document.body.insertAdjacentHTML('beforeend', `
<div id="load">загрузка модели…</div>
<div id="tree" class="hidden">
  <div class="head">
    <div class="row top"><input type="search" id="q" placeholder="пошук за назвою"></div>
    <div class="row">
      <button id="tOnly" title="Сховати все, крім виділеного">тільки це</button>
      <button id="tHide" title="Сховати виділене (Delete)">сховати</button>
      <button id="tAll">показати все</button>
      <button id="tFit" title="Наблизити до виділеного">до виділеного</button>
    </div>
  </div>
  <div class="body" id="tbody"></div>
</div>
<div id="ttab" title="Структура: натиснути — відкрити/закрити, потягнути — ширина"></div>
<div id="vcube"><svg id="vaxes" viewBox="-50 -50 100 100"></svg><div class="cb"></div></div>
<div id="pop"></div>
<div id="tools"></div><div id="toast"></div>
<div id="card"></div>
<div id="rlabel"></div><div id="snapmk"></div>
<div id="stamp"></div>
<canvas id="loupe" width="240" height="240"></canvas>
<div id="hint"><b>Как смотреть</b>
  <p>☝ один палец — вращать</p><p>✌ два пальца — приблизить и сдвинуть</p>
  <p>👆 коснуться двери или ящика — открыть / закрыть</p><p>✋ подержать палец на детали — что это за деталь</p>
  <p>📏 рулетка: коснитесь грани, потом параллельной ей — размер между ними; подержите палец — лупа</p>
  <small>коснитесь, чтобы закрыть</small></div>
<div id="bar">
  <button id="bShowAll" style="display:none">показать всё</button>
  <button id="bMode">показ</button><button id="bCam">камера</button><button id="bOC">открыть всё</button><button id="bFac" style="display:none">фасады</button>
  <button id="bRuler">рулетка</button><button id="bUndo" style="display:none" title="Убрать поставленную первую точку (Esc, правая кнопка)">отменить точку</button><button id="bDims" style="display:none" title="Коротко — спрятать/показать, долго — удалить все">размеры</button>
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
// Рёбра деталей: видимые — тёмные (контрастнее прежнего серого, замечание 29.09); в режиме «линии» ещё и
// скрытые за деталями — светлые, как у Базиса: сразу видно, что спереди, а что сзади.
const EDGE = new THREE.LineBasicMaterial({ color: 0x0c0e11, transparent: true, opacity: 0.92 });
const EDGE_HID = new THREE.LineBasicMaterial({ color: 0x9aa4ae, transparent: true, opacity: 0.45, depthWrite: false, depthFunc: THREE.GreaterDepth });
let M;                 // модель
const parts = [];      // деталь/единица фурнитуры: {g, meshes, edges, h, n, mat, isF, hidden, i}
const nodes = {};      // узел структуры: {id, name, kids[], parts[], parent, hidden, count}
const rootKids = [], rootParts = [];
const animNode = {};   // подвижный узел: id → {a, ang, d, c, t}
const moving = [];     // детали, у которых есть подвижные предки
const picks = [];
const hidEdges = [];   // копии рёбер для режима «линии»: рисуются только там, где их закрывает деталь
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
    const tx = new THREE.TextureLoader().load((window.__TEX && window.__TEX[name]) || '../_tex/' + name, need);
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
        const lh = new THREE.LineSegments(ln.geometry, EDGE_HID); lh.visible = false; lh.renderOrder = 1; grp.add(lh); hidEdges.push(lh);
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
  // новое движение забирает эти узлы у прежних (иначе два движения тянут ящик в разные стороны)
  const S = new Set(ids);
  for (let k = anims.length - 1; k >= 0; k--) {
    const a = anims[k], keep = a.ids.map((id, j) => S.has(id) ? -1 : j).filter(j => j >= 0);
    if (keep.length === a.ids.length) continue;
    if (!keep.length) { anims.splice(k, 1); continue; }
    a.ids = keep.map(j => a.ids[j]); a.from = keep.map(j => a.from[j]);
  }
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
    if (k >= 1) { anims.splice(i, 1); if (!anims.length) syncOC(); }
  }
  poseAll(); need();
}
// щелчок по детали: внешнее подвижное звено и всё, что внутри него, — как в Базисе
// Если подвижное звено сидит в небольшой «системе» (ящик + его направляющие), открывается вся система:
// направляющая у Базиса лежит рядом с ящиком, а не внутри него. Система = владелец звена, если в нём
// деталей не больше чем в 2,5 раза больше, чем в самом звене (иначе это модуль — открываем только звено).
function toggleAt(i, to) {
  const ch = parts[i].chainA;
  if (!ch.length) return false;
  const top = ch[0], ids = scopeIds(i);
  const dir = to !== undefined ? to : (openTarget(top) ? 0 : 1);
  lastOpenDelay = 0;
  if (dir === 1) {
    // открываемое заденет уже открытое (две двери на одной стойке)? — сначала закрыть мешающее, потом открыть (29.09)
    const blk = blockersOf(ids);
    if (blk.length) {
      startAnim(blk, 0);
      const list = [...ids];
      for (const id of list) pendingOpen.add(id);
      setTimeout(() => { for (const id of list) pendingOpen.delete(id); startAnim(list, 1); }, 900);
      lastOpenDelay = 900;
      return true;
    }
  }
  startAnim([...ids], dir);
  return true;
}
// всё, что движется вместе с деталью i по щелчку (фасад + его петли, ящик + направляющие) — одно правило
// и для щелчка, и для закрытия мешающей двери (иначе петли оставались открытыми, 29.09)
function scopeIds(i) {
  const ch = parts[i].chainA;
  const top = ch[0], ids = new Set(), h = parts[i].h;
  const pIdx = h.indexOf(top) + 1, P = pIdx < h.length ? h[pIdx] : null;
  let scope = top;
  if (P !== null && (!M.ntype || M.ntype[P] !== 'layer') && partsUnder(P).length <= 2.5 * partsUnder(top).length) scope = P;
  // как в Базисе: самый внешний блок с анимацией (даже нулевой) запускает всё движение внутри себя (фасад + петли)
  if (M.grp && M.grp.length) {
    const G = new Set(M.grp);
    for (let k = h.length - 1; k >= 0; k--) if (G.has(h[k]) || animNode[h[k]]) { if (G.has(h[k])) scope = h[k]; break; }
  }
  for (const pr of moving) {
    if (!pr.h.includes(scope)) continue;
    const k = scope === top ? pr.chainA.indexOf(top) : 0;
    for (let q = Math.max(0, k); q < pr.chainA.length; q++) ids.add(pr.chainA[q]);
  }
  return ids;
}
let lastOpenDelay = 0;
const pendingOpen = new Set();
// положение детали при заданных долях открывания её звеньев (tOf(id) → 0…1)
function poseOf(pr, tOf) {
  const m = new THREE.Matrix4();
  for (const id of pr.chainA) m.multiply(screwMatrix(Object.assign({}, animNode[id], { t: tOf(id) })));
  return m;
}
function panelBox(pr, m) {
  const b = new THREE.Box3();
  for (const me of pr.meshes) { const g = me.geometry; if (!g.boundingBox) g.computeBoundingBox(); b.union(g.boundingBox.clone().applyMatrix4(m)); }
  return b;
}
// какие открытые звенья окажутся на пути открываемых ids: путь проходим шагом 1/12, детали — панели
function blockersOf(ids) {
  const S = new Set(ids), mine = [], others = new Map();
  for (const pr of moving) {
    if (pr.kind !== 'p') continue;
    if (pr.chainA.some(id => S.has(id))) { mine.push(pr); continue; }
    const t0 = pr.chainA[0];
    // открытое или ещё не доехавшее до закрытия (лёгкие размеры закрывают прежнюю дверь в тот же миг)
    if (openTarget(t0) || animNode[t0].t > 0.05) { if (!others.has(t0)) others.set(t0, []); others.get(t0).push(panelBox(pr, pr.g.matrix).expandByScalar(-1)); }
  }
  if (!others.size || !mine.length) return [];
  const hit = new Set();
  for (let s = 1; s <= 12; s++) {
    const f = s / 12;
    for (const pr of mine) {
      const b = panelBox(pr, poseOf(pr, id => S.has(id) ? f : animNode[id].t));
      for (const [t0, boxes] of others) if (!hit.has(t0) && boxes.some(q => q.intersectsBox(b))) hit.add(t0);
    }
  }
  // закрываем мешающее звено целиком, со всем, что внутри его системы
  const out = new Set();
  for (const t0 of hit) { const pr = moving.find(q => q.chainA[0] === t0); if (pr) for (const id of scopeIds(pr.i)) out.add(id); }
  return [...out];
}
// открыт ли узел — по тому, КУДА он сейчас едет, а не по тому, где он в эту долю секунды
// (щелчок посреди выезда считал ящик закрытым: соседний не закрывался, размеры ложились на закрытый, 29.09)
function openTarget(id) {
  if (pendingOpen.has(id)) return true;
  for (let k = anims.length - 1; k >= 0; k--) { const a = anims[k], j = a.ids.indexOf(id); if (j >= 0) return a.to === 1; }
  return animNode[id].t > 0.5;
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
  updCube(right, up, f.clone().negate());
  updRuler(); need();
}

// ---------------- кубик видов ----------------
// Справа вверху, как у веб-просмотра Базиса: поворачивается вместе с моделью, подписи по-английски,
// из угла — оси X красная, Y зелёная, Z синяя. Нажал на грань — строгий вид с этой стороны;
// потянул кубик — модель вращается. Грань и её вид: FRONT — спереди (+Z), RIGHT — справа (+X), TOP — сверху (+Y).
const CUBE_FACES = [
  ['FRONT', 'rotateY(0deg)', 0, 0], ['BACK', 'rotateY(180deg)', Math.PI, 0],
  ['RIGHT', 'rotateY(90deg)', Math.PI / 2, 0], ['LEFT', 'rotateY(-90deg)', -Math.PI / 2, 0],
  ['TOP', 'rotateX(90deg)', 0, Math.PI / 2], ['BOTTOM', 'rotateX(-90deg)', 0, -Math.PI / 2],
];
let cubeMoved = false;
function initCube() {
  const cb = document.querySelector('#vcube .cb');
  for (const [name, rot, yaw, pitch] of CUBE_FACES) {
    const f = document.createElement('div'); f.className = 'cf'; f.textContent = name;
    f.style.transform = rot + ' translateZ(var(--ch))';
    f.onclick = e => { e.stopPropagation(); if (cubeMoved) return; strictView(yaw, pitch); };
    cb.appendChild(f);
  }
  // потянуть кубик — вращать модель (и выйти из строгого вида)
  const w = $('vcube'); let st = null;
  // палец/мышь захватываем только когда кубик потянули: захват сразу при нажатии забирал щелчок у грани
  w.addEventListener('pointerdown', e => { e.stopPropagation(); st = { x: e.clientX, y: e.clientY }; cubeMoved = false; });
  w.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!cubeMoved && Math.hypot(dx, dy) < 5) return;
    if (!cubeMoved) try { w.setPointerCapture(e.pointerId); } catch (er) {}
    cubeMoved = true; st = { x: e.clientX, y: e.clientY };
    if (view.strict) view.strict = false;
    orbit(dx * 1.6, dy * 1.6); place();
  });
  const end = () => { st = null; };
  w.addEventListener('pointerup', end); w.addEventListener('pointercancel', end);
  w.addEventListener('pointerleave', e => { if (!cubeMoved) st = null; });
}
// r, u, b — направления «вправо», «вверх» и «на смотрящего» в осях модели
function updCube(r, u, b) {
  const cb = document.querySelector('#vcube .cb'); if (!cb) return;
  // грани кубика заданы в осях страницы (вниз — плюс), модель — вверх плюс: y переворачиваем
  const m = [r.x, -u.x, b.x, 0, -r.y, u.y, -b.y, 0, r.z, -u.z, b.z, 0, 0, 0, 0, 1];
  cb.style.transform = 'matrix3d(' + m.map(v => Math.abs(v) < 1e-9 ? 0 : v.toFixed(6)).join(',') + ')';
  // оси из переднего нижнего левого угла кубика
  const H = 22, L = 36, P = v => [v.dot(r), -v.dot(u)];
  const o = new THREE.Vector3(-H, -H, H), [ox, oy] = P(o);
  const ax = [['X', new THREE.Vector3(1, 0, 0), '#e0301e'], ['Y', new THREE.Vector3(0, 1, 0), '#2e9a3a'], ['Z', new THREE.Vector3(0, 0, 1), '#2b6cb0']];
  let s = '';
  for (const [n, d, c] of ax) {
    const [x, y] = P(o.clone().addScaledVector(d, L));
    s += `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>` +
         `<text x="${(ox + (x - ox) * 1.18).toFixed(1)}" y="${(oy + (y - oy) * 1.18 + 3.5).toFixed(1)}" fill="${c}" font-size="10" font-weight="700" text-anchor="middle">${n}</text>`;
  }
  $('vaxes').innerHTML = s;
}
function freeRect() {
  const t = $('tree');
  const open = t && !t.classList.contains('hidden');
  // значки наверху лежат поверх модели маленькой строкой — модель под них не сдвигаем
  // структура слева; на телефоне она прозрачная и модель под ней не двигаем (иначе модель уезжает за край)
  const x0 = open && !TOUCH ? t.offsetWidth : 0;
  return { x0, x1: innerWidth, y0: 0, y1: innerHeight };
}
// «нажата» — только пометка on; остальные пометки кнопки (например «прятать в ⋯») не трогаем
const setOn = (id, v) => $(id).classList.toggle('on', !!v);
function setPersp(on) { view.persp = on; setIcon('bCam', on ? 'persp' : 'ortho'); place(); }
// строгий вид (грань кубика): на телефоне не поворачивается — один палец двигает, два приближают;
// обратно к вращению — потянуть кубик или «камера» → перспектива / без перспективы
function strictView(yaw, pitch) { view.strict = true; view.yaw = yaw; view.pitch = pitch; setPersp(false); fitVisible(); }

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
// «сховати фасади»: всё, что внутри блока с дверной меткой салона (выгрузка пишет их в M.door), — целиком,
// с петлями, линиями и демпферами внутри; фальш-панели и внутренние ящики меток не имеют (Алексей 29.09)
let hideFac = false;
function effVisible(p) {
  if (p.hidden) return false;
  if (hideFac && p.isDoor) return false;
  if (p.isF && !showF) return false;
  if (p.isB && !showB) return false;
  if (p.isL && !showL) return false;
  for (const id of p.h) if (nodes[id].hidden) return false;
  return true;
}
function applyVis() {
  let any = false;
  for (const p of parts) { p.g.visible = effVisible(p); if (p.hidden) any = true; }
  for (const k in nodes) if (nodes[k].hidden) any = true;
  const b = $('bShowAll'); if (b) b.style.display = any ? '' : 'none';   // «показать всё» — только когда что-то скрыто
  syncTools(); need();
}
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
// деталь, от которой построена цепочка в карточке: щелчки по звеньям цепочки её не меняют
let chainPart = -1;
function selectPart(i, level) {
  selIdx = i; selLevel = level; chainPart = i;
  if (level < 0) { selNode = null; selSet = [i]; }
  else { selNode = parts[i].h[Math.min(level, parts[i].h.length - 1)]; selSet = partsUnder(selNode); }
  paint(); revealInTree();
}
function selectNode(id) { selNode = id; selIdx = -1; chainPart = -1; selSet = partsUnder(id); paint(); renderTree(); }
// звено цепочки карточки: узел (блок, ящик, модуль…) или сама деталь
function selectChain(id) {
  const i = chainPart;
  if (id === null) { selectPart(i, -1); return; }
  const k = parts[i].h.indexOf(id);
  selIdx = i; selLevel = k; selNode = id; selSet = partsUnder(id);
  paint(); revealInTree();
}
function clearSel() { selIdx = -1; selSet = []; selNode = null; chainPart = -1; paint(); renderTree(); }
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
  let title, sub;
  if (selNode === null) {
    const p = parts[selSet[0]];
    title = p.n; sub = KIND[p.kind] || '';
  } else {
    title = nodes[selNode].name; sub = selSet.length + ' объектов';
  }
  d.innerHTML = '<b></b><small></small><div class="chain"></div><div class="cbtn"><button>сховати</button><button>тільки це</button></div>';
  d.children[0].textContent = title || '(без имени)';
  d.children[1].textContent = sub || '';
  // цепочка «изделие ▸ модуль ▸ ящик ▸ фасад»: щелчок по звену выделяет весь этот узел,
  // «скрыть» / «только это» работают для выделенного звена; цепочка остаётся, можно ходить вверх-вниз
  const ch = d.children[2];
  const add = (text, on, cur) => {
    if (ch.childNodes.length) ch.appendChild(document.createTextNode(' ▸ '));
    const a = document.createElement('span'); a.className = 'lnk' + (cur ? ' cur' : ''); a.textContent = text || '(без имени)';
    a.onclick = e => { e.stopPropagation(); on(); };
    ch.appendChild(a);
  };
  if (chainPart >= 0 && selSet.includes(chainPart)) {
    const p = parts[chainPart];
    for (const id of p.h.slice().reverse()) add(M.names[id], () => selectChain(id), selNode === id);
    add(p.n, () => selectChain(null), selNode === null);
  } else {
    const any = parts[selSet[0]], chainOf = selNode === null ? any.h : any.h.slice(any.h.indexOf(selNode));
    for (const id of chainOf.slice().reverse()) add(M.names[id], () => selectNode(id), selNode === id);
  }
  const bs = d.querySelectorAll('.cbtn button');
  bs[0].onclick = () => hideSel();
  bs[1].onclick = () => { isolateSel(); clearSel(); fitVisible(); };
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
// Точка рулетки — всегда угол (вершина) детали; в произвольное место поверхности точка не ставится.
// Углы берутся у ВСЕХ деталей рядом с курсором, а не только у той, что под ним (замечание 26.09: у раздвижки
// под курсором неподвижная часть — к двери было не прицепиться). Угол, закрытый от глаза другой поверхностью,
// не берётся (цепляло задний угол вместо переднего). Из видимых — ближайший к курсору; если несколько почти
// в одной точке экрана — тот, что ближе к смотрящему.
const SNAP_R = [40, 150];          // сначала ищем в круге 40 точек экрана, не нашли — в 150
let curMode = 1;
function uniqVerts(m) {            // у каждого угла несколько треугольников — считаем угол один раз
  if (m.userData.uv) return m.userData.uv;
  const pos = m.geometry.attributes.position, seen = new Set(), out = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = Math.round(x * 10) + ',' + Math.round(y * 10) + ',' + Math.round(z * 10);
    if (seen.has(k)) continue; seen.add(k); out.push(x, y, z);
  }
  return (m.userData.uv = new Float32Array(out));
}
function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
const occRay = new THREE.Raycaster();
// угол виден, если между глазом и ним нет непрозрачной поверхности (в режимах «полупрозрачно» и «рёбра» видно всё)
function pointVisible(p) {
  if (curMode !== 1) return true;
  const dir = cam.getWorldDirection(new THREE.Vector3());
  let from, dist;
  if (cam.isPerspectiveCamera) { from = cam.position.clone(); dist = p.distanceTo(from); dir.copy(p).sub(from).normalize(); }
  else { dist = rad * 30; from = p.clone().addScaledVector(dir, -dist); }
  occRay.set(from, dir); occRay.near = 0; occRay.far = dist - (1 + dist * 0.0005);
  for (const h of occRay.intersectObjects(picks, false)) {
    const mt = h.object.material;
    if (!mt.visible || mt.transparent) continue;
    if (shown(h.object)) return false;
  }
  return true;
}
function snapAt(cx, cy) {
  root.updateMatrixWorld(true);
  const persp = cam.isPerspectiveCamera, fwd = cam.getWorldDirection(new THREE.Vector3());
  const pxPerMm = d => persp ? innerHeight / 2 / (d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
                             : innerHeight / (cam.top - cam.bottom);
  const toPx = s => [(s.x + 1) / 2 * innerWidth, (1 - s.y) / 2 * innerHeight];
  const c = new THREE.Vector3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const R of SNAP_R) {
    // в одной точке экрана (сетка 2×2) держим только ближний к глазу угол: дальние за ним всё равно не видны,
    // а у мелкой фурнитуры сотни углов — без этого проверка видимости тонула в них
    const cell = new Map();
    for (const pr of parts) {
      if (pr.isL || !pr.g.visible) continue;
      for (const m of pr.meshes) {
        if (!shown(m)) continue;
        // сначала грубо: шар вокруг куска на экране далеко от курсора — пропускаем весь кусок
        const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
        c.copy(g.boundingSphere.center).applyMatrix4(m.matrixWorld);
        const depth = c.clone().sub(cam.position).dot(fwd), r = g.boundingSphere.radius;
        if (persp && depth <= r) { /* кусок у самого глаза — проверяем целиком */ }
        else {
          const [sx, sy] = toPx(s.copy(c).project(cam));
          if (Math.hypot(sx - cx, sy - cy) > r * pxPerMm(persp ? depth - r : 1) + R) continue;
        }
        const uv = uniqVerts(m), mw = m.matrixWorld;
        for (let i = 0; i < uv.length; i += 3) {
          v.set(uv[i], uv[i + 1], uv[i + 2]).applyMatrix4(mw);
          s.copy(v).project(cam);
          if (s.z > 1 || s.z < -1) continue;
          const [px, py] = toPx(s), d = Math.hypot(px - cx, py - cy);
          if (d > R) continue;
          const key = Math.round(px / 2) + ',' + Math.round(py / 2), z = v.clone().sub(cam.position).dot(fwd), o = cell.get(key);
          if (!o || z < o.z) cell.set(key, { p: v.clone(), d, z });
        }
      }
    }
    const cand = [...cell.values()];
    if (!cand.length) continue;
    cand.sort((a, b) => a.d - b.d);
    let best = null, d0 = 0, tested = 0;
    for (const k of cand) {
      if (best && k.d > d0 + 4) break;
      if (++tested > 250) break;
      if (!pointVisible(k.p)) continue;
      if (!best) { best = k; d0 = k.d; } else if (k.z < best.z - 0.5) best = k;
    }
    if (best) return best.p;
  }
  return null;
}
// ---------------- рулетка по граням ----------------
// Способ «грани» (основной, замечание 27.09): коснулся грани детали — она подсвечена и держится, на детали
// появляются два её больших размера (толщину не показываем). Ведёшь палец ко второй грани — подсвечивается
// только грань, параллельная первой; отпустил на ней — размер строго поперёк граней (на сколько утоплена полка
// от стойки). Коснулся пустого места — замер сброшен. Способ «точки» — прежний, от угла до угла.
let rmode = 'easy';                                    // для заказчика по умолчанию — лёгкие размеры
try { rmode = localStorage.getItem('viewerRMode2') || 'easy'; } catch (e) {}
let face1 = null, faceHov = null;
const partDims = [];
const PAR = 0.9995;                                   // «параллельно» — расхождение меньше 2°
function faceAt(cx, cy) {
  const h = pick(cx, cy); if (!h || !h.face) return null;
  const m = h.object, nl = h.face.normal.clone().normalize();
  const pl = m.worldToLocal(h.point.clone());
  const n = nl.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(m.matrixWorld)).normalize();
  return { m, nl, dl: nl.dot(pl), n, p: h.point.clone(), idx: m.userData.idx };
}
function sameFace(a, b) { return a.m.parent === b.m.parent && Math.abs(a.nl.dot(b.nl)) > PAR && Math.abs(Math.abs(a.dl) - Math.abs(b.dl)) < 0.3; }
// подсветка грани: все треугольники детали в той же плоскости
function faceHL(f, color, opacity) {
  const out = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3();
  for (const mm of parts[f.idx].meshes) {
    if (mm.parent !== f.m.parent) continue;
    const pos = mm.geometry.attributes.position;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      n.subVectors(b, a).cross(e.subVectors(c, a)); const L = n.length(); if (L < 1e-9) continue; n.divideScalar(L);
      if (Math.abs(n.dot(f.nl)) < PAR || Math.abs(f.nl.dot(a) - f.dl) > 0.3) continue;
      out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  const hl = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  hl.renderOrder = 5; f.m.parent.add(hl); f.hl = hl; need();
  return hl;
}
function dropHL(f) { if (f && f.hl) { f.hl.parent.remove(f.hl); f.hl.geometry.dispose(); f.hl = null; need(); } }
// ведём палец/мышь: подсветить грань под ним (при выбранной первой — только параллельную)
function faceHover(cx, cy) {
  const f = faceAt(cx, cy);
  const ok = !!f && (!face1 || Math.abs(f.n.dot(face1.n)) > PAR) && !(face1 && sameFace(f, face1));
  if (faceHov && !(ok && sameFace(faceHov, f))) { dropHL(faceHov); faceHov = null; }
  if (ok && !faceHov) { faceHov = f; faceHL(f, 0x2b6cb0, 0.35); }
  return f;
}
function faceHoverEnd() { dropHL(faceHov); faceHov = null; }
function setFace1(f) {
  clearFace1(); face1 = f; faceHL(f, DIMC, 0.45); showPartDims(f.idx);
  $('st').textContent += ' — коснитесь второй грани, параллельной первой (пустое место — сброс)'; showPending();
}
function clearFace1() { dropHL(face1); face1 = null; showPending(); }
// отпустили на грани (или мимо)
function faceClick(f, mouse) {
  if (!f) { if (face1) { clearFace1(); $('st').textContent = 'рулетка: коснитесь грани детали'; } return; }
  if (!face1) { setFace1(f); return; }
  if (sameFace(f, face1)) return;
  if (Math.abs(f.n.dot(face1.n)) <= PAR) { toast('эта грань не параллельна первой — выберите подсвеченную параллельную'); return; }
  // расстояние между плоскостями — по нормали первой грани; размер от точки касания второй грани до первой плоскости
  const n1 = face1.n.clone(), d = f.p.clone().sub(face1.p).dot(n1);
  clearFace1(); $('st').textContent = 'рулетка: коснитесь грани детали';
  if (Math.abs(d) < 0.5) { toast('грани в одной плоскости — 0 мм'); return; }
  dropPartDims();                          // нужен зазор между гранями — размеры первой детали убираем
  const b = f.p.clone(), a = b.clone().addScaledVector(n1, -d);
  const dm = addDim(a, b);
  if (mouse && dm.axis) placing = { dm, base: a.clone().add(b).multiplyScalar(0.5) };
}
// два больших размера детали (толщину не показываем) — на рёбрах, ближних к смотрящему
function dropPartDims() { while (partDims.length) { const dm = partDims.pop(); if (dims.includes(dm)) removeDim(dm); } }
function showPartDims(i) {
  dropPartDims();
  const pr = parts[i]; if (!pr || !pr.meshes.length) return;
  const box = new THREE.Box3();
  for (const m of pr.meshes) { const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); box.union(g.boundingBox); }
  const mw = pr.meshes[0].parent.matrixWorld, s = box.getSize(new THREE.Vector3());
  const ks = ['x', 'y', 'z'].sort((p, q) => s[q] - s[p]).slice(0, 2);
  const eye = cam.position, fwd = cam.getWorldDirection(new THREE.Vector3());
  for (const k of ks) {
    const [o1, o2] = ['x', 'y', 'z'].filter(q => q !== k);
    let best = null, bz = Infinity;
    for (const u of [box.min[o1], box.max[o1]]) for (const w of [box.min[o2], box.max[o2]]) {
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      a[k] = box.min[k]; b[k] = box.max[k]; a[o1] = b[o1] = u; a[o2] = b[o2] = w;
      a.applyMatrix4(mw); b.applyMatrix4(mw);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const z = cam.isPerspectiveCamera ? mid.distanceTo(eye) : mid.dot(fwd);
      if (z < bz) { bz = z; best = [a, b]; }
    }
    if (best && best[0].distanceTo(best[1]) > 0.5) partDims.push(addDim(best[0], best[1]));
  }
  $('st').textContent = 'деталь ' + fmt(s[ks[0]]) + ' × ' + fmt(s[ks[1]]) + ' мм';
}
// ---------------- рулетка по рёбрам ----------------
// Способ «рёбра» (замечание 27.09): в строгом виде грань видна линией — коснулся ребра, оно подсвечено;
// коснулся второго, параллельного — размер поперёк между ними. В строгом виде (без перспективы) мерим
// в плоскости экрана: сверху — только расстояние по плану, разница по высоте не подмешивается.
let edge1 = null, edgeHov = null;
function edgeAt(cx, cy) {
  root.updateMatrixWorld(true);
  const R = TOUCH ? 24 : 12, A = new THREE.Vector3(), B = new THREE.Vector3(), sa = new THREE.Vector3(), sb = new THREE.Vector3();
  const toPx = s => [(s.x + 1) / 2 * innerWidth, (1 - s.y) / 2 * innerHeight];
  const cand = [];
  for (const pr of parts) {
    if (!pr.g.visible || !pr.edges.length) continue;
    for (const ln of pr.edges) {
      const pos = ln.geometry.attributes.position, mw = ln.matrixWorld;
      for (let i = 0; i + 1 < pos.count; i += 2) {
        A.fromBufferAttribute(pos, i).applyMatrix4(mw); B.fromBufferAttribute(pos, i + 1).applyMatrix4(mw);
        sa.copy(A).project(cam); sb.copy(B).project(cam);
        if (sa.z > 1 || sb.z > 1) continue;
        const [ax, ay] = toPx(sa), [bx, by] = toPx(sb), vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
        if (L2 < 4) continue;                                   // ребро смотрит на нас — точка, не линия
        const t = Math.max(0, Math.min(1, ((cx - ax) * vx + (cy - ay) * vy) / L2));
        const d = Math.hypot(ax + vx * t - cx, ay + vy * t - cy);
        if (d <= R) cand.push({ d, a: A.clone(), b: B.clone(), t });
      }
    }
  }
  cand.sort((p, q) => p.d - q.d);
  for (const k of cand.slice(0, 40)) {
    const p = k.a.clone().lerp(k.b, k.t);
    if (!pointVisible(p)) continue;
    return { a: k.a, b: k.b, p, dir: k.b.clone().sub(k.a).normalize() };
  }
  return null;
}
function edgeHL(e, color) {
  // толщина подсветки — около 3 точек экрана
  const mid = e.a.clone().add(e.b).multiplyScalar(0.5);
  const mmPx = cam.isPerspectiveCamera ? 2 * mid.distanceTo(cam.position) * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / innerHeight
                                       : (cam.top - cam.bottom) / innerHeight;
  const len = e.a.distanceTo(e.b), r = mmPx * 1.8;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), new THREE.MeshBasicMaterial({ color, depthTest: false }));
  m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), e.dir); m.renderOrder = 12;
  scene.add(m); e.hl = m; need();
}
function dropEdge(e) { if (e && e.hl) { scene.remove(e.hl); e.hl.geometry.dispose(); e.hl = null; need(); } }
const sameEdge = (e, f) => e.a.distanceTo(f.a) + e.b.distanceTo(f.b) < 0.5 || e.a.distanceTo(f.b) + e.b.distanceTo(f.a) < 0.5;
function edgeHover(cx, cy) {
  const e = edgeAt(cx, cy);
  const ok = !!e && (!edge1 || (Math.abs(e.dir.dot(edge1.dir)) > PAR && !sameEdge(e, edge1)));
  if (edgeHov && !(ok && sameEdge(edgeHov, e))) { dropEdge(edgeHov); edgeHov = null; }
  if (ok && !edgeHov) { edgeHov = e; edgeHL(e, 0x2b6cb0); }
  return e;
}
function edgeHoverEnd() { dropEdge(edgeHov); edgeHov = null; }
function clearEdge1() { dropEdge(edge1); edge1 = null; showPending(); }
function edgeClick(e, mouse) {
  if (!e) { if (edge1) { clearEdge1(); $('st').textContent = 'рулетка: коснитесь ребра детали'; } return; }
  if (!edge1) {
    edge1 = e; edgeHL(e, DIMC); showPending();
    $('st').textContent = 'рулетка: коснитесь второго ребра, параллельного первому (пустое место — сброс)'; return;
  }
  if (sameEdge(e, edge1)) return;
  if (Math.abs(e.dir.dot(edge1.dir)) <= PAR) { toast('это ребро не параллельно первому — выберите подсвеченное параллельное'); return; }
  // поперёк рёбер; в строгом виде без перспективы — ещё и без составляющей «к смотрящему»
  const w = e.p.clone().sub(edge1.p), d = edge1.dir;
  const perp = w.clone().addScaledVector(d, -w.dot(d));
  if (!cam.isPerspectiveCamera) {
    const v = cam.getWorldDirection(new THREE.Vector3()), vp = v.clone().addScaledVector(d, -v.dot(d));
    if (vp.lengthSq() > 1e-6) { vp.normalize(); perp.addScaledVector(vp, -perp.dot(vp)); }
  }
  clearEdge1(); $('st').textContent = 'рулетка: коснитесь ребра детали';
  if (perp.length() < 0.5) { toast('рёбра на одной линии — 0 мм'); return; }
  const b = e.p.clone(), a = b.clone().sub(perp);
  const dm = addDim(a, b);
  if (mouse && dm.axis) placing = { dm, base: a.clone().add(b).multiplyScalar(0.5) };
}
// ---------------- лёгкие размеры (для заказчика) ----------------
// Способ по умолчанию (ТЗ-дополнение 28.09, раздел 3.2–3.3). Одно касание — один замер, новое гасит прежний.
//  • кромка панели или фурнитура — размеры этой детали;
//  • большая грань изнутри (задняя стенка, бок, полка) — ячейка в свету: от места касания лучи в стороны
//    до ближайших деталей; не упёрся луч — размера в эту сторону нет;
//  • дверь — открывается, после остановки размеры ячейки за ней; повторное касание — закрыть;
//  • ящик — открывается; ширина и глубина внутри коробки как есть, высота полезная: от верха дна до низа
//    ближайшего, что нависает над ящиком (с его фасадом), минус 6 мм, до целого; считается закрытым.
// Штанга и подсветка — позже (нужна отметка в выгрузке).
const easyDims = [];
let easyOpenIdx = -1;
function dropEasy() { while (easyDims.length) { const dm = easyDims.pop(); if (dims.includes(dm)) removeDim(dm); } dropPartDims(); }
function easyDim(a, b, label, text) { if (a.distanceTo(b) < 1) return; easyDims.push(addDim(a, b, { label, text })); }
function mainAxis(v) { const a = ['x', 'y', 'z'].map(k => Math.abs(v[k])); return ['x', 'y', 'z'][a.indexOf(Math.max(...a))]; }
function vec(o) { return new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0); }
const easyRay = new THREE.Raycaster();
// ближайшая видимая деталь по лучу (линии «Слоя 0» и сам палец-деталь не в счёт)
function rayHit(o, dir, skip) {
  easyRay.set(o, dir); easyRay.near = 0.5; easyRay.far = rad * 10;
  for (const h of easyRay.intersectObjects(picks, false)) {
    if (!shown(h.object)) continue;
    const pr = parts[h.object.userData.idx]; if (pr.isL || (skip && skip.has(h.object.userData.idx))) continue;
    return h.point.clone();
  }
  return null;
}
function geomBox(i) {
  const b = new THREE.Box3();
  for (const m of parts[i].meshes) { const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); b.union(g.boundingBox); }
  return b;
}
// ---------------- ячейка: коробка из стенок вокруг щелчка (29.09, вместо лучей из одной точки) ----------------
// Всё считается в координатах модели при закрытых дверях и ящиках. Направления берутся от щёлкнутой детали,
// не от камеры: у полки длинная горизонталь — ширина, короткая — глубина; у стенки — по соседям.
// Стенки ячейки — неподвижные панели (двери не в счёт). Внутри ячейки ищутся препятствия — всё, что стоит в ней
// (брючница, корзина, ящик, вешалка — по форме, не по названию); крепёж, петли, полкодержатели не в счёт.
// Штанга (тип «труба») — отдельно: до верха штанги и от штанги до полки над ней.
let BOX = null;
function boxOf(j) {   // в координатах модели, закрытое положение; у фурнитуры форма стоит через свою матрицу
  if (!BOX) BOX = [];
  if (BOX[j]) return BOX[j];
  const b = new THREE.Box3(), pr = parts[j];
  for (const m of pr.meshes) {
    const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox.clone(); if (m.parent !== pr.g) bb.applyMatrix4(m.parent.matrix);
    b.union(bb);
  }
  return (BOX[j] = b);
}
const toModel = p => root.worldToLocal(p.clone()), toWorld = p => root.localToWorld(p.clone());
function chainFt(j) { return M.nft ? parts[j].h.map(id => M.nft[id] || '') : []; }
const SMALL_RX = /петл|стяжк|полкодерж|заглушк|саморез|конфирмат|эксцентр|минификс|шкант|шуруп|ламел|демпф|tip-on|ручк/i;
function isHardwareSmall(j) {
  const ft = chainFt(j);
  if (ft.includes('Петля') || ft.includes('стяжки межсекционные')) return true;
  if (SMALL_RX.test(parts[j].n)) return true;
  const s = boxOf(j).getSize(new THREE.Vector3());
  return Math.max(s.x, s.y, s.z) < 60;
}
function isTube(j) { const ft = chainFt(j); return ft.includes('труба') || (!M.nft && /труба|штанг/i.test(parts[j].n)); }
const isWall = j => { const p = parts[j]; return p.kind === 'p' && !p.chainA.length && !p.isDoor && !p.isL; };
// ближайшая стенка от точки P по оси ax в сторону s (±1): её плоскость должна перекрывать P по двум другим осям
function wallBound(P, ax, s, skip) {
  const [o1, o2] = ['x', 'y', 'z'].filter(k => k !== ax);
  let best = null, bj = -1;
  parts.forEach((p, j) => {
    if (!isWall(j) || (skip && skip.has(j))) return;
    const b = boxOf(j);
    if (P[o1] < b.min[o1] - 0.5 || P[o1] > b.max[o1] + 0.5 || P[o2] < b.min[o2] - 0.5 || P[o2] > b.max[o2] + 0.5) return;
    const f = s > 0 ? b.min[ax] : b.max[ax];
    if (s * (f - P[ax]) < -0.5) return;
    if (best === null || s * (f - best) < 0) { best = f; bj = j; }
  });
  return best === null ? null : { v: best, j: bj };
}
function easyCell(pW, n, i) {
  const P = toModel(pW), k = mainAxis(n), sn = Math.sign(n[k]) || 1, cb = boxOf(i), cs = cb.getSize(new THREE.Vector3());
  const P0 = P.clone(); P0[k] += sn * 1;
  let wAx, dAx;
  if (k === 'y') {
    // полка: ширина — где стенки с обеих сторон вплотную к полке, глубина — где стенка только одна (задняя);
    // «длинная сторона = ширина» ошибалась у узкого глубокого шкафа (Шкаф 7: полка 464×537, 29.09)
    const both = a => {
      const lo = wallBound(P0, a, -1, new Set([i])), hi = wallBound(P0, a, 1, new Set([i]));
      return !!(lo && hi && cb.min[a] - lo.v < 40 && hi.v - cb.max[a] < 40);
    };
    const bx = both('x'), bz = both('z');
    wAx = bx && !bz ? 'x' : bz && !bx ? 'z' : (cs.x >= cs.z ? 'x' : 'z');
    dAx = wAx === 'x' ? 'z' : 'x';
  }
  else {
    // вертикальная стенка: напротив (по нормали) есть параллельная стенка — это боковина, иначе — задняя стенка
    const opp = wallBound(P0, k, sn, new Set([i]));
    const h2 = k === 'x' ? 'z' : 'x';
    if (opp && Math.abs(opp.v - P0[k]) < 2500) { wAx = k; dAx = h2; } else { dAx = k; wAx = h2; }
  }
  // высота и ширина — до стенок
  const skipMe = new Set([i]);
  const yLo = k === 'y' && sn > 0 ? { v: P[k], j: i } : wallBound(P0, 'y', -1, skipMe);
  const yHi = k === 'y' && sn < 0 ? { v: P[k], j: i } : wallBound(P0, 'y', 1, skipMe);
  const wLo = k === wAx && sn > 0 ? { v: P[k], j: i } : wallBound(P0, wAx, -1, skipMe);
  const wHi = k === wAx && sn < 0 ? { v: P[k], j: i } : wallBound(P0, wAx, 1, skipMe);
  if (!yLo || !wLo || !wHi) { toast('тут немає комірки: не знайшов стінок навколо'); return; }
  // глубина: вдоль боковин (или щёлкнутой детали); задняя стенка — внутри этого отрезка, перед — открытый край
  const sides = [wLo.j, wHi.j].map(j => boxOf(j));
  let dMin = Math.max(sides[0].min[dAx], sides[1].min[dAx]), dMax = Math.min(sides[0].max[dAx], sides[1].max[dAx]);
  if (!(dMax - dMin > 50)) { dMin = cb.min[dAx]; dMax = cb.max[dAx]; }
  const Pm = P0.clone(); Pm[dAx] = (dMin + dMax) / 2;
  const bLo = wallBound(Pm, dAx, -1, skipMe), bHi = wallBound(Pm, dAx, 1, skipMe);
  const inLo = bLo && bLo.v >= dMin - 1, inHi = bHi && bHi.v <= dMax + 1;
  let back, front, fs;
  if (k === dAx) { back = P[k]; fs = sn; front = sn > 0 ? dMax : dMin; }
  else if (inLo && !inHi) { back = bLo.v; front = dMax; fs = 1; }
  else if (inHi && !inLo) { back = bHi.v; front = dMin; fs = -1; }
  else { // обе или ни одной — задняя та, что ближе к краю отрезка
    const lo = inLo ? bLo.v : dMin, hi = inHi ? bHi.v : dMax;
    if (Math.abs(lo - dMin) <= Math.abs(dMax - hi)) { back = lo; front = dMax; fs = 1; } else { back = hi; front = dMin; fs = -1; }
  }
  const y0 = yLo.v, y1 = yHi ? yHi.v : null, w0 = wLo.v, w1 = wHi.v;
  const d0 = Math.min(back, front), d1 = Math.max(back, front);
  // препятствия внутри ячейки (при закрытых ящиках): всё, что не стенка, не дверь, не мелкий крепёж
  const C = { min: { y: y0 + 2, [wAx]: w0 + 2, [dAx]: d0 + 2 }, max: { y: (y1 ?? y0 + 3000) - 2, [wAx]: w1 - 2, [dAx]: d1 - 2 } };
  const inside = [];
  parts.forEach((p, j) => {
    if (j === i || isWall(j) || p.isDoor || p.isL || isHardwareSmall(j)) return;
    const b = boxOf(j);
    if (b.max.y <= C.min.y || b.min.y >= C.max.y || b.max[wAx] <= C.min[wAx] || b.min[wAx] >= C.max[wAx] || b.max[dAx] <= C.min[dAx] || b.min[dAx] >= C.max[dAx]) return;
    inside.push({ j, b });
  });
  // что стоит на дне (зазор до 50 мм — ящик на направляющих, корзина) — занятое место: высоту мерим от его верха
  let base = y0;
  for (let grow = true; grow;) {   // стопка ящиков: поднимаемся, пока следующий стоит вплотную к предыдущему
    grow = false;
    for (const o of inside) if (!isTube(o.j) && o.b.min.y <= base + 50 && o.b.max.y > base + 0.5) { base = o.b.max.y; grow = true; }
  }
  let obst = null, tube = null;
  for (const o of inside) {
    if (o.b.min.y <= base + 5) continue;
    if (isTube(o.j)) { if (!tube || o.b.min.y < tube.min.y) tube = o.b; continue; }
    if (!obst || o.b.min.y < obst.min.y) obst = o.b;
  }
  const H = (y1 ?? y0 + 1000) - y0, W = w1 - w0;
  const pt = (w, y, d) => { const q = { y }; q[wAx] = w; q[dAx] = d; return toWorld(vec(q)); };
  const dF = front - fs * 30;                                  // линии — у переднего края, внутри
  const topY = obst && (!tube || obst.min.y < tube.min.y) ? obst.min.y : y1;
  easyDim(pt(w0, y0 + Math.min(0.25 * H, 250), dF), pt(w1, y0 + Math.min(0.25 * H, 250), dF), 'ширина');
  easyDim(pt(w0 + 0.5 * W, y0 + 0.12 * H, back), pt(w0 + 0.5 * W, y0 + 0.12 * H, front), 'глибина');
  if (tube && (!obst || tube.min.y < obst.min.y)) {
    const wt = w0 + 0.3 * W;
    // штанга: от полки/дна под ней — какой длины вещь повесить; от пола (низ ножек) — достанет ли человек (29.09)
    easyDim(pt(wt, base, dF), pt(wt, tube.max.y, dF), 'до штанги');
    easyDim(pt(w0 + 0.6 * W, floorY(), dF), pt(w0 + 0.6 * W, tube.max.y, dF), 'штанга від підлоги');
  } else if (topY != null) {
    // над тем, что стоит на дне, почти пусто (ящик под полкой) — показываем нишу целиком, от дна
    const from = topY - base < 50 ? y0 : base;
    easyDim(pt(w0 + 0.15 * W, from, dF), pt(w0 + 0.15 * W, topY, dF), 'висота');
  }
}
// пол — низ ножек: самая нижняя точка изделия (отрезки помещения не в счёт)
let FLOOR = null;
function floorY() {
  if (FLOOR === null) { FLOOR = Infinity; parts.forEach((p, j) => { if (!p.isL) FLOOR = Math.min(FLOOR, boxOf(j).min.y); }); }
  return FLOOR;
}
// щелчок по самой штанге: от полки/дна под ней до верха штанги и от пола до верха штанги
function tubeDims(i) {
  const b = boxOf(i), c = b.getCenter(new THREE.Vector3());
  const lo = wallBound(new THREE.Vector3(c.x, b.min.y - 1, c.z), 'y', -1);
  const s = b.getSize(new THREE.Vector3()), along = s.x >= s.z ? 'x' : 'z';
  const at = (f, y) => { const q = c.clone(); q[along] = b.min[along] + f * s[along]; q.y = y; return toWorld(q); };
  if (lo) easyDim(at(0.3, lo.v), at(0.3, b.max.y), 'до штанги');
  easyDim(at(0.6, floorY()), at(0.6, b.max.y), 'штанга від підлоги');
}
// части подвижной системы (ящик + его направляющие) — как при открывании касанием
function scopeOf(i) {
  const ch = parts[i].chainA, top = ch[0], h = parts[i].h;
  const pIdx = h.indexOf(top) + 1, P = pIdx < h.length ? h[pIdx] : null;
  if (P !== null && (!M.ntype || M.ntype[P] !== 'layer') && partsUnder(P).length <= 2.5 * partsUnder(top).length) return P;
  return top;
}
// ящик: всё считается в закрытом положении (в координатах модели), показывается на открытом
function drawerDims(i) {
  const top = parts[i].chainA[0], nd = animNode[top];
  // детали фасада ящика (блоки типа «фасад»/«фронт», метка двери) в коробку не берём: кромка рамочного фасада
  // оказывалась «самой нижней плоской» и считалась дном — «корисна висота 12» (050_8, 29.09)
  const inFac = j => parts[j].isDoor || chainFt(j).some(t => t === 'фасад' || t === 'фронт');
  const all = partsUnder(top).filter(j => !parts[j].isF && !parts[j].isL && !parts[j].isB);
  const own = all.filter(j => !inFac(j));
  if (own.length < 3) return null;
  const v = nd.a.clone().multiplyScalar(Math.sign(nd.d) || 1);          // куда выезжает
  const kD = Math.abs(v.x) >= Math.abs(v.z) ? 'x' : 'z', kW = kD === 'x' ? 'z' : 'x', s = Math.sign(v[kD]) || 1;
  const bx = own.map(j => ({ j, b: geomBox(j) }));
  bx.forEach(o => { o.s = o.b.getSize(new THREE.Vector3()); o.u0 = Math.min(s * o.b.min[kD], s * o.b.max[kD]); o.u1 = Math.max(s * o.b.min[kD], s * o.b.max[kD]); });
  // фасад уже отброшен по типу; если типов нет (старая выгрузка) — отбрасываем самую переднюю деталь, как раньше
  const hasFt = !!M.nft && all.length > own.length;
  const fac = bx.reduce((p, q) => q.u1 > p.u1 ? q : p);
  const rest = hasFt ? bx : bx.filter(o => o !== fac);
  const thin = (o, k) => o.s[k] <= Math.min(o.s.x, o.s.y, o.s.z) + 0.01;
  // дно — самая большая горизонтальная панель, а не самая нижняя
  const bottoms = rest.filter(o => thin(o, 'y')).sort((p, q) => q.s.x * q.s.z - p.s.x * p.s.z);
  const sides = rest.filter(o => thin(o, kW)).sort((p, q) => (p.b.min[kW] + p.b.max[kW]) - (q.b.min[kW] + q.b.max[kW]));
  const walls = rest.filter(o => thin(o, kD)).sort((p, q) => (p.u0 + p.u1) - (q.u0 + q.u1));
  if (!bottoms.length || sides.length < 2 || !walls.length) return null;
  const bot = bottoms[0], y0 = bot.b.max.y;
  const w0 = sides[0].b.max[kW], w1 = sides[sides.length - 1].b.min[kW];
  const uB = walls[0].u1, uF = walls.length > 1 ? walls[walls.length - 1].u0 : hasFt ? fac.u1 : fac.u0;
  // что нависает над ящиком (над его коробкой с фасадом), в закрытом положении; свою систему не считаем
  const mine = new Set(partsUnder(scopeOf(i)));
  const fp = new THREE.Box3(); for (const o of bx) fp.union(o.b);  let yTop = Infinity;
  parts.forEach((pr, j) => {
    if (mine.has(j) || pr.isL || !pr.g.visible) return;
    const b = geomBox(j);
    if (b.max[kW] <= fp.min[kW] + 1 || b.min[kW] >= fp.max[kW] - 1 || b.max[kD] <= fp.min[kD] + 1 || b.min[kD] >= fp.max[kD] - 1) return;
    if (b.min.y >= y0 + 5 && b.min.y < yTop) yTop = b.min.y;
  });
  const P = (w, u, y) => { const o = { y }; o[kW] = w; o[kD] = u * s; return vec(o); };
  const wm = Math.min(w0, w1) + 15, uf = uF - 15, ub = uB + 15, ym = y0 + 1;
  const out = [
    [P(Math.min(w0, w1), uf, ym), P(Math.max(w0, w1), uf, ym), 'ширина', null],
    [P(wm, uB, ym), P(wm, uF, ym), 'глибина', null],
  ];
  // полезная высота = до того, что над ящиком, минус 6 мм; линия — ровно под число (замечание 29.09)
  if (isFinite(yTop)) out.push([P(wm, ub, y0), P(wm, ub, yTop - 6), 'корисна висота', String(Math.round(yTop - y0 - 6))]);
  return { g: parts[bot.j].g, out };
}
let easyTimer = null;
// закрыть то, что открыли лёгкие размеры (кроме узла keep), и отменить отложенные размеры
function closeEasyOpen(keep) {
  clearTimeout(easyTimer);
  if (easyOpenIdx >= 0 && parts[easyOpenIdx].chainA.length) {
    const t = parts[easyOpenIdx].chainA[0];
    if (t !== keep && openTarget(t)) toggleAt(easyOpenIdx, 0);
  }
  easyOpenIdx = -1;
}
function easyMoving(i, cx, cy) {
  const top = parts[i].chainA[0], nd = animNode[top];
  if (openTarget(top)) { closeEasyOpen(top); toggleAt(i, 0); return; }      // повторное касание — закрыть
  closeEasyOpen(top);
  const isDrawer = Math.abs(nd.ang) < 1e-3 && Math.abs(nd.d) > 0;
  let dd = isDrawer ? drawerDims(i) : null;
  // щёлкнули по направляющей (едет вместе с ящиком) — размеры берём у ящика той же системы (29.09, Шкаф 8)
  if (isDrawer && !dd) {
    const S = scopeIds(i);
    for (const pr of moving) if (pr.chainA[0] !== top && S.has(pr.chainA[0]) && pr.kind === 'p') { dd = drawerDims(pr.i); if (dd) break; }
  }
  toggleAt(i, 1); easyOpenIdx = i;
  const mark = easyOpenIdx;
  easyTimer = setTimeout(() => {                                            // после остановки
    if (easyOpenIdx !== mark || !openTarget(top) || !ruler || rmode !== 'easy') return;
    root.updateMatrixWorld(true);
    if (dd) { for (const [a, b, l, t] of dd.out) easyDim(a.applyMatrix4(dd.g.matrixWorld), b.applyMatrix4(dd.g.matrixWorld), l, t); return; }
    // дверь (в том числе раздвижная — она тоже едет прямо, но дна и боковин у неё нет): ячейка за ней
    const h = pick(cx, cy); if (!h || !h.face) return;
    const pr = parts[h.object.userData.idx]; if (pr.chainA.length) return;
    easyStatic(h);
  }, 980 + lastOpenDelay);
}
function easyStatic(h) {
  const i = h.object.userData.idx, pr = parts[i];
  const n = h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
  const k = mainAxis(n), s = geomBox(i).getSize(new THREE.Vector3());
  if (isTube(i)) { tubeDims(i); return; }
  // кромка: грань смотрит вдоль большого размера детали (не вдоль толщины) — размеры детали
  if (pr.isF || pr.isB || s[k] > Math.min(s.x, s.y, s.z) + 0.01) { showPartDims(i); return; }
  easyCell(h.point, n, i);
}
function easyPick(x, y) {
  dropEasy();
  const h = pick(x, y);
  if (!h || !h.face) { closeEasyOpen(); return; }
  const i = h.object.userData.idx; if (parts[i].isL) { closeEasyOpen(); return; }
  if (parts[i].chainA.length) { easyMoving(i, x, y); return; }
  // щелчок мимо открытого ящика/двери — закрыть его (замечание 29.09), размеры считаем уже по тому, что щёлкнули
  closeEasyOpen();
  easyStatic(h);
}

const RHINT = { easy: 'легкі розміри: торкніться полиці, стінки, дверцят або шухляди', face: 'рулетка: коснитесь грани детали', edge: 'рулетка: коснитесь ребра детали', point: 'рулетка: укажи первую точку' };
function setRMode(m) {
  rmode = m; try { localStorage.setItem('viewerRMode2', m); } catch (e) {}
  rp = []; clearFace1(); faceHoverEnd(); clearEdge1(); edgeHoverEnd(); hideHover(); dropEasy();
  $('st').textContent = RHINT[m];
  syncTools();
}
// выбор под пальцем/курсором по текущему способу
function rulerPick(x, y, mouse) {
  if (rmode === 'easy') { easyPick(x, y); return; }
  if (rmode === 'face') { faceHoverEnd(); faceClick(faceAt(x, y), mouse); }
  else if (rmode === 'edge') { edgeHoverEnd(); edgeClick(edgeAt(x, y), mouse); }
  else { const p = snapAt(x, y); if (!p) toast('точка не поставлена: рядом нет угла детали'); else addPoint(p, mouse); }
}
// ---------------- размеры ----------------
// Две точки вдоль ширины, высоты или глубины → размер с выносными «лапками», его можно оттащить:
// точки на месте, линия с числом уезжает (вверх-вниз — читается спереди, к себе-от себя — сверху).
// Точки наискосок (отличаются больше чем по одному направлению) → прямая линия с числом, без лапок.
// Размеры остаются на модели; удалить — правой кнопкой по числу (на телефоне — подержать палец на числе).
// цвет размеров — тёмно-синий: «ядовито-красный» не понравился (29.09)
const DIMC = 0x1f5fbf, AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
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
    // размерная линия — вдоль оси от смещённой первой точки; лапки идут поперёк оси от обеих точек
    // (для размера «по ширине/высоте/глубине» из косого лапки получаются разной длины — как в чертеже)
    const u0 = AX[dm.axis], tlen = dm.b.clone().sub(dm.a).dot(u0);
    const a2 = dm.a.clone().add(dm.off), b2 = a2.clone().addScaledVector(u0, tlen);
    const pts = [a2, b2];
    const ext = (p, q) => { const d = q.clone().sub(p); if (d.lengthSq() > 1) pts.push(p, q.clone().addScaledVector(d.normalize(), 8)); };
    ext(dm.a, a2); ext(dm.b, b2);
    // стрелки на концах, остриём в выносную линию (29.09: вместо косых засечек)
    const L = Math.max(10, Math.min(45, Math.abs(tlen) * 0.04));
    const u = AX[dm.axis].clone().multiplyScalar(Math.sign(tlen) || 1);
    const w = dm.off.lengthSq() > 1 ? dm.off.clone().normalize() : new THREE.Vector3().crossVectors(u, cam.getWorldDirection(new THREE.Vector3())).normalize();
    for (const [p, s] of [[a2, 1], [b2, -1]]) {
      const back = p.clone().addScaledVector(u, s * L);
      pts.push(p, back.clone().addScaledVector(w, L * 0.3), p, back.clone().addScaledVector(w, -L * 0.3));
    }
    seg(pts);
    dm.mid = a2.clone().add(b2).multiplyScalar(0.5);
  }
  dm.g = g; g.visible = dimsShown; scene.add(g);
  // лёгкие размеры подписаны словом («ширина 564»), у ящика число — расчётное («корисна висота 187»)
  dm.el.textContent = (dm.label ? dm.label + ' ' : '') + (dm.text != null ? dm.text : fmt(dm.axis ? dm.b.clone().sub(dm.a).dot(AX[dm.axis]) : dm.a.distanceTo(dm.b)));
}
// косой размер: щелчок по числу — перевести в размер по одной оси
function axisMenu(dm) {
  closeAxisMenu();
  const m = document.createElement('div'); m.id = 'axmenu';
  const r = dm.el.getBoundingClientRect();
  m.style.left = r.left + 'px'; m.style.top = (r.bottom + 4) + 'px';
  const dv = dm.b.clone().sub(dm.a);
  for (const [k, t] of [['x', 'по ширине'], ['y', 'по высоте'], ['z', 'по глубине']]) {
    if (Math.abs(dv[k]) < 0.5) continue;
    const b = document.createElement('button'); b.textContent = t + ' ' + fmt(dv[k]);
    b.onclick = e => { e.stopPropagation(); dm.axis = k; dm.off.set(0, 0, 0); buildDim(dm); updRuler(); closeAxisMenu(); need();
      $('st').textContent = 'размер ' + t + ' — потяните число, чтобы отодвинуть'; };
    m.appendChild(b);
  }
  document.body.appendChild(m);
  setTimeout(() => addEventListener('pointerdown', closeAxisMenu, { once: true }), 0);
}
function closeAxisMenu() { const m = $('axmenu'); if (m) m.remove(); }
// кнопка «размеры»: короткое нажатие — спрятать/показать, долгое (или правой кнопкой) — удалить все
let dimsShown = true;
function syncDimBtn() {
  const b = $('bDims'); if (!b) return;
  b.style.display = dims.length ? '' : 'none';
  b.classList.toggle('on', dimsShown);
  syncTools();                                             // значок «стереть все размеры»
}
function setDimsShown(on) {
  dimsShown = on;
  for (const dm of dims) dm.g.visible = on;
  updRuler(); syncDimBtn(); need();
}
function addDim(a, b, opt) {
  const dm = Object.assign({ a, b, axis: axisOf(a, b), off: new THREE.Vector3(), el: document.createElement('div') }, opt || {});
  dm.el.className = 'dim';
  document.body.appendChild(dm.el);
  dims.push(dm); if (!dimsShown) setDimsShown(true); buildDim(dm); hookDim(dm); updRuler(); syncDimBtn(); need();
  const dv = b.clone().sub(a);
  $('st').textContent = dm.axis ? 'размер ' + fmt(a.distanceTo(b)) + ' мм — потяните число, чтобы отодвинуть'
    : 'по прямой ' + fmt(a.distanceTo(b)) + ' мм  (ширина ' + fmt(dv.x) + ', высота ' + fmt(dv.y) + ', глубина ' + fmt(dv.z) + ')';
  return dm;
}
function removeDim(dm) { scene.remove(dm.g); dm.el.remove(); dims.splice(dims.indexOf(dm), 1); syncDimBtn(); need(); }
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
  const end = e => { const was = st; st = null; clearTimeout(lp); if (was && !was.moved && e.type === 'pointerup' && !dm.axis) axisMenu(dm); };
  dm.el.addEventListener('pointerup', end); dm.el.addEventListener('pointercancel', end);
  dm.el.addEventListener('contextmenu', e => e.preventDefault());
}
// число размера показываем, только когда середина размера на экране и перед глазом
// (замечание 27.09: число «висело» у края и на строке кнопок, когда сам размер ушёл за экран)
function updRuler() {
  const fwd = cam.getWorldDirection(new THREE.Vector3());
  for (const dm of dims) {
    const s = dm.mid.clone().project(cam);
    const x = (s.x + 1) / 2 * innerWidth, y = (1 - s.y) / 2 * innerHeight;
    const front = !cam.isPerspectiveCamera || dm.mid.clone().sub(cam.position).dot(fwd) > 0;
    const vis = front && s.z < 1 && x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight;
    dm.el.style.display = vis && dimsShown ? 'block' : 'none';
    dm.el.style.left = x + 'px';
    dm.el.style.top = y + 'px';
    dm._x = x; dm._y = y; dm._vis = vis && dimsShown;
  }
  // подписи не ложатся друг на друга: наехавшую сдвигаем вниз, пока не освободится место (ТЗ 3.5, замечание 29.09)
  const placed = [];
  for (const dm of dims) {
    if (!dm._vis) continue;
    const w = dm.el.offsetWidth, h = dm.el.offsetHeight;
    let y = dm._y;
    for (let t = 0; t < 8; t++) {
      const hit = placed.find(r => Math.abs(r.x - dm._x) < (r.w + w) / 2 + 2 && Math.abs(r.y - y) < (r.h + h) / 2 + 2);
      if (!hit) break;
      y = hit.y + (hit.h + h) / 2 + 3;
    }
    if (y !== dm._y) dm.el.style.top = y + 'px';
    placed.push({ x: dm._x, y, w, h });
  }
}
// первая точка ждёт вторую; вторая — ставит размер
function addPoint(p, mouse) {
  if (!p) return;
  if (!rp.length) { rp = [p]; $('st').textContent = 'рулетка: укажи вторую точку'; showPending(); return; }
  const a = rp[0]; rp = []; showPending();
  if (a.distanceTo(p) < 0.5) { toast('размер не поставлен: вторая точка попала в тот же угол, что и первая'); return; }
  const dm = addDim(a, p);
  if (mouse && dm.axis) placing = { dm, base: a.clone().add(p).multiplyScalar(0.5) };
}
// первая точка и резиновая линия до курсора (на компьютере)
let pend = null;
function cancelPoint() { rp = []; clearFace1(); clearEdge1(); $('st').textContent = RHINT[rmode]; }
function showPending(hover) {
  $('bUndo').style.display = ruler && (rp.length || face1 || edge1) ? '' : 'none';
  if (pend) { scene.remove(pend); pend = null; }
  if (!rp.length) { need(); return; }
  const pts = [rp[0], hover || rp[0]];
  const mk = new THREE.Group();
  // первая точка видна яркой отметкой, пока не поставлена вторая (на телефоне раньше не было видно ничего)
  const dot = new THREE.Points(new THREE.BufferGeometry().setFromPoints([rp[0]]),
    new THREE.PointsMaterial({ color: DIMC, size: TOUCH ? 14 : 10, sizeAttenuation: false, depthTest: false }));
  dot.renderOrder = 11; mk.add(dot);
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: DIMC, depthTest: false, dashSize: 10, gapSize: 6 }));
  l.computeLineDistances(); l.renderOrder = 10; mk.add(l);
  pend = mk; scene.add(pend); need();
}
function clearDims() { while (dims.length) removeDim(dims[0]); rp = []; showPending(); }
function stopRuler() {
  ruler = false; rp = []; placing = null; dropEasy(); clearFace1(); faceHoverEnd(); clearEdge1(); edgeHoverEnd(); showPending(); hideHover(); syncTools();
  cv.style.cursor = '';
  setOn('bRuler', false); $('st').textContent = ''; need();
}
// компьютер: крестик всегда на месте курсора; у угла детали прыгает на угол ещё до щелчка.
// После второго щелчка размер «висит на мыши»: ведёшь — лапки отъезжают, третий щелчок фиксирует.
let placing = null;
function hover(cx, cy) {
  const mk = $('snapmk');
  mk.style.display = 'block';
  if (placing) {
    const s = placing.base.clone().project(cam);
    const bx = (s.x + 1) / 2 * innerWidth, by = (1 - s.y) / 2 * innerHeight;
    mk.classList.remove('snapped'); mk.style.left = cx + 'px'; mk.style.top = cy + 'px';
    dragDim(placing.dm, cx, cy, cx - bx, cy - by);
    $('st').textContent = 'размер ' + fmt(placing.dm.a.distanceTo(placing.dm.b)) + ' мм — отведите мышь, щелчок фиксирует (Esc — без отступа)';
    return;
  }
  if (rmode !== 'point') {                                 // грани/рёбра: крестик на курсоре, под ним подсветка
    mk.classList.remove('snapped'); mk.style.left = cx + 'px'; mk.style.top = cy + 'px';
    if (rmode === 'face') faceHover(cx, cy); else if (rmode === 'edge') edgeHover(cx, cy);
    return;
  }
  const p = snapAt(cx, cy);
  let x = cx, y = cy, snapped = false;
  if (p) {
    const s = p.clone().project(cam), px = (s.x + 1) / 2 * innerWidth, py = (1 - s.y) / 2 * innerHeight;
    x = px; y = py; snapped = true;
  }
  mk.classList.toggle('snapped', snapped);
  mk.style.left = x + 'px'; mk.style.top = y + 'px';
  if (rp.length && p) { showPending(p); $('st').textContent = 'рулетка: ' + fmt(rp[0].distanceTo(p)) + ' мм'; }
  else if (!rp.length) $('st').textContent = 'рулетка: укажи первую точку';
}
function finishPlacing() { placing = null; $('st').textContent = RHINT[rmode]; }
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
let drag = null, hoverAt = null;
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
  aim = rmode === 'face' ? { x, y, kind: 'face', f: faceHover(x, y) }
      : rmode === 'edge' ? { x, y, kind: 'edge', e: edgeHover(x, y) } : { x, y, p: snapAt(x, y) };
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
  lctx.strokeStyle = '#1f5fbf'; lctx.lineWidth = 2;
  lctx.beginPath(); lctx.moveTo(mx - 14, my); lctx.lineTo(mx + 14, my); lctx.moveTo(mx, my - 14); lctx.lineTo(mx, my + 14); lctx.stroke();
  lctx.restore();
  lctx.strokeStyle = '#2b2f36'; lctx.lineWidth = 3; lctx.beginPath(); lctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); lctx.stroke();
  // лупа вверху слева; палец зашёл в этот угол — перескакивает вправо
  // (над пальцем у верхнего края экрана она пряталась под палец — замечание 27.09)
  const L = 120, G = 10, sf = safe(), top = G + sf.t, zone = L + 2 * G + 40;
  const right = x < zone + sf.l && y < top + zone;
  loupe.style.display = 'block';
  loupe.style.left = (right ? innerWidth - L - G - sf.r : G + sf.l) + 'px';
  loupe.style.top = top + 'px';
}
// верхний край строки значков внизу — до него доходят структура и язычок
function barTop() { return $('bar').getBoundingClientRect().top; }
function isLand() { return innerWidth > innerHeight; }
// отпустили палец: точка ставится; не поставилась — сказать почему (замечание 27.09: «ставятся не всегда»)
function aimEnd(place, cancelled) {
  loupe.style.display = 'none';
  const a = aim; aim = null; faceHoverEnd(); edgeHoverEnd();
  if (cancelled) toast('не поставлено: телефон прервал касание — попробуйте ещё раз, чуть дальше от края экрана');
  else if (place && a && a.kind === 'face') faceClick(a.f);
  else if (place && a && a.kind === 'edge') edgeClick(a.e);
  else if (place && a && !a.p) toast('точка не поставлена: рядом с пальцем нет угла детали');
  else if (place && a) addPoint(a.p);
  need();
}
let toastT = null;
function toast(text) {
  const t = $('toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3500);
}

function touchDown(e) {
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  spin = null; clearTimeout(pressTimer);
  if (aim) aimEnd(false);                                  // второй палец — отмена прицела, дальше щипок
  if (touches.size === 1) {
    tState = { one: true, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, vx: 0, vy: 0, long: false };
    // С рулеткой (замечание 27.09: «выбрал грань — не могу развернуть»): палец повёл — модель вращается,
    // короткое касание — выбор грани/ребра/точки, подержал на месте — лупа для точного прицела.
    if (ruler) {
      if (rmode === 'easy') return;                        // лёгким размерам лупа не нужна — касание и есть замер
      pressTimer = setTimeout(() => {
        if (!tState || tState.moved || touches.size !== 1) return;
        tState = { aim: true }; aimAt(e.clientX, e.clientY);
      }, 350);
      return;
    }
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
    if (view.strict) { panBy(dx, dy); place(); return; }
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
  if (tState && tState.aim) { tState = null; aimEnd(e.type === 'pointerup', e.type !== 'pointerup'); return; }
  const s = tState;
  if (touches.size === 1) { const [q] = [...touches.values()]; tState = { one: true, x0: q.x, y0: q.y, t0: 0, moved: true, vx: 0, vy: 0 }; return; }
  tState = null;
  if (!s || !s.one) return;
  if (s.moved) { if (!view.strict) { spin = { vx: s.vx, vy: s.vy }; requestAnimationFrame(spinLoop); } return; }
  if (s.long || performance.now() - s.t0 > 500) return;
  // короткое касание
  if (ruler) { rulerPick(e.clientX, e.clientY); return; }
  const h = pick(e.clientX, e.clientY);
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
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hideHover(); faceHoverEnd(); edgeHoverEnd(); } });
cv.addEventListener('pointercancel', e => { if (e.pointerType === 'touch') touchUp(e); });
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') { touchMove(e); return; }
  if (!drag) {
    if (ruler && e.pointerType === 'mouse') {         // поиск угла — не чаще одного раза за кадр
      const first = !hoverAt; hoverAt = [e.clientX, e.clientY];
      if (first) requestAnimationFrame(() => { const [x, y] = hoverAt; hoverAt = null; if (ruler) hover(x, y); });
    }
    return;
  }
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
  if (!d || Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y0) > 4) return;
  if (d.b === 2) { if (ruler && (rp.length || face1 || edge1)) cancelPoint(); return; }   // правая кнопка без сдвига — убрать первую точку
  if (d.b !== 0) return;
  if (ruler) {
    if (placing) { finishPlacing(); return; }
    rulerPick(e.clientX, e.clientY, true); return;
  }
  const h = pick(e.clientX, e.clientY);
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
  if (e.key === 'Escape') {
    if (placing) { placing.dm.off.set(0, 0, 0); buildDim(placing.dm); updRuler(); finishPlacing(); need(); return; }
    if (ruler && (rp.length || face1 || edge1)) { cancelPoint(); return; }
    stopRuler(); clearSel();
  }
});
addEventListener('resize', () => { rend.setSize(innerWidth, innerHeight); layout(); });

// ---------------- кнопки ----------------
function mode(m) {
  curMode = m;
  for (const p of parts) for (const x of p.meshes) {
    const mt = x.material, b = mt.userData.base || mt;   // стекло остаётся прозрачным и в обычном режиме
    // «линии»: детали не рисуются, но закрывают собой то, что за ними (для светлых скрытых линий);
    // чуть отодвинуты вглубь, чтобы рёбра на их же поверхности считались видимыми
    mt.colorWrite = m !== 3;
    mt.polygonOffset = m === 3; mt.polygonOffsetFactor = 1; mt.polygonOffsetUnits = 1;
    mt.transparent = m === 2 || (m !== 3 && b.transparent);
    mt.opacity = m === 2 ? Math.min(0.32, b.opacity) : b.opacity;
    mt.depthWrite = m === 3 || (m !== 2 && b.depthWrite); mt.needsUpdate = true;
  }
  for (const l of hidEdges) l.visible = m === 3;
  setIcon('bMode', ['solid', 'ghost', 'wire'][m - 1]);
  need();
}
function setIcon(id, key) { const b = $(id); if (b) b.innerHTML = ICON[key]; }

// ---------------- окошко выбора рядом с кнопкой ----------------
// Как у рулетки: одна кнопка, нажал — рядом варианты; выбрал — окошко закрылось.
// Пункт: {icon, label, on, act, keep} — keep: окошко не закрывать (переключатели фурнитуры и т. п.)
let popFor = null;
function openPop(btn, items) {
  const p = $('pop');
  if (popFor === btn) { closePop(); return; }
  popFor = btn; p.replaceChildren();
  for (const it of items) {
    if (it === '-') { const s = document.createElement('div'); s.className = 'psep'; p.appendChild(s); continue; }
    const b = document.createElement('button');
    b.className = it.on ? 'on' : '';
    b.innerHTML = ICON[it.icon] + '<span></span>'; b.lastChild.textContent = it.label;
    b.onclick = e => { e.stopPropagation(); it.act(); if (it.keep) { popFor = null; openPop(btn, btn._items()); } else closePop(); };
    p.appendChild(b);
  }
  p.style.display = 'flex';
  const r = btn.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  // значки внизу — окошко над своей кнопкой
  p.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
  p.style.top = Math.max(6, r.top - h - 6) + 'px';
}
function closePop() { popFor = null; const p = $('pop'); if (p) p.style.display = 'none'; }
function modeItems() {
  const it = [
    { icon: 'solid', label: 'суцільно', on: curMode === 1, act: () => mode(1) },
    { icon: 'ghost', label: 'напівпрозоро', on: curMode === 2, act: () => mode(2) },
    { icon: 'wire', label: 'лінії', on: curMode === 3, act: () => mode(3) },
  ];
  if (SERVICE) it.push('-',
    { icon: 'hw', label: 'фурнітура', on: showF, keep: true, act: () => { showF = !showF; applyVis(); renderTree(); } },
    { icon: 'prof', label: 'профілі', on: showB, keep: true, act: () => { showB = !showB; applyVis(); renderTree(); } },
    { icon: 'lines', label: 'відрізки', on: showL, keep: true, act: () => { showL = !showL; applyVis(); renderTree(); } });
  return it;
}
function camItems() {
  return [
    { icon: 'persp', label: 'перспектива', on: view.persp, act: () => { view.strict = false; setPersp(true); } },
    { icon: 'ortho', label: 'без перспективи', on: !view.persp, act: () => { view.strict = false; setPersp(false); } },
    '-',
    { icon: 'fit', label: 'вписати', act: fitVisible },
  ];
}
// открыто ли хоть что-то — от этого кнопка «открыть / закрыть всё»
function anyOpen() { for (const id in animNode) if (animNode[id].t > 0.5) return true; return false; }
function syncOC(o = anyOpen()) { setIcon('bOC', o ? 'close' : 'open'); const b = $('bOC'); if (b) b.title = o ? 'закрити все' : 'відкрити все'; }

// ---------------- структура: язычок у левого края ----------------
// Кнопки нет (замечание 29.09): у левого края маленький язычок со значком. Нажал — структура выехала,
// язычок встал на её правый край; нажал ещё раз — уехала. Потянул язычок — ширина структуры.
function treeOpen() { return !$('tree').classList.contains('hidden'); }
function setTree(open) {
  $('tree').classList.toggle('hidden', !open);
  if (open) renderTree();
  placeTab(); place(); syncTools();
}
function placeTab() {
  const tab = $('ttab'), t = $('tree'), s = safe(), open = treeOpen();
  tab.innerHTML = ICON.tree + '<b>' + (open ? '‹' : '›') + '</b>';
  tab.classList.toggle('open', open);
  tab.style.left = (open ? t.offsetWidth : s.l) + 'px';
  tab.style.top = Math.round(barTop() / 2 - tab.offsetHeight / 2) + 'px';   // середина места над значками
}
function wireTab() {
  const tab = $('ttab'), t = $('tree');
  let st = null;
  tab.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { tab.setPointerCapture(e.pointerId); } catch (er) {} st = { x: e.clientX, moved: false }; });
  tab.addEventListener('pointermove', e => {
    if (!st) return;
    if (!st.moved && Math.abs(e.clientX - st.x) < 6) return;
    st.moved = true;
    if (!treeOpen()) setTree(true);
    const w = Math.max(0.2, Math.min(0.95, e.clientX / innerWidth));
    t.style.width = Math.round(w * innerWidth) + 'px'; st.w = w; placeTab();
  });
  const end = () => {
    if (!st) return;
    if (!st.moved) setTree(!treeOpen());
    else if (st.w) { try { localStorage.setItem('viewerTreeW' + (isLand() ? 'L' : 'P'), String(st.w)); } catch (e) {} place(); }
    st = null;
  };
  tab.addEventListener('pointerup', end); tab.addEventListener('pointercancel', () => { st = null; });
  placeTab();
}
function wireIcons() {
  for (const id in BTN_ICON) {
    const b = $(id); if (!b) continue;
    const [k, label] = BTN_ICON[id];
    b.innerHTML = ICON[k]; b.title = label; b.setAttribute('aria-label', label); b.classList.add('ic');
  }
  // телефон: подержал палец на кнопке — всплыла подпись, нажатие при этом не срабатывает
  if (!TOUCH) return;
  const bar = $('bar'); let t = null, shownOn = null;
  bar.addEventListener('pointerdown', e => {
    const b = e.target.closest('button'); if (!b || !b.title || b.id === 'bDims') return;
    clearTimeout(t); t = setTimeout(() => { shownOn = b; tip(b); }, 450);
  });
  const stop = () => clearTimeout(t);
  bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop); bar.addEventListener('pointerleave', stop);
  bar.addEventListener('click', e => { if (shownOn && e.target.closest('button') === shownOn) { e.stopPropagation(); e.preventDefault(); } shownOn = null; }, true);
}
function tip(b) {
  let el = $('tip'); if (!el) { el = document.createElement('div'); el.id = 'tip'; document.body.appendChild(el); }
  el.textContent = b.title; el.style.display = 'block';
  const r = b.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  const x = r.left + r.width / 2 - w / 2, y = r.top - h - 8;   // значки внизу — подпись над кнопкой
  el.style.left = Math.max(6, Math.min(innerWidth - w - 6, x)) + 'px'; el.style.top = Math.max(6, y) + 'px';
  clearTimeout(tip.t); tip.t = setTimeout(() => { el.style.display = 'none'; }, 1600);
}
function wire() {
  wireIcons();
  wireTab(); initCube();
  const mb = $('bMode'), cb = $('bCam');
  mb._items = modeItems; cb._items = camItems;
  mb.onclick = e => { e.stopPropagation(); openPop(mb, modeItems()); };
  cb.onclick = e => { e.stopPropagation(); openPop(cb, camItems()); };
  // окошко закрывается касанием мимо него
  document.addEventListener('pointerdown', e => {
    if (!popFor || e.target.closest('#pop') || e.target.closest('button') === popFor) return;
    closePop();
  }, true);
  $('bOC').onclick = () => { const o = anyOpen() || anims.some(a => a.to === 1); startAnim(allAnimIds(), o ? 0 : 1); syncOC(!o); };
  { const DS = new Set(M.door || []); parts.forEach(p => { p.isDoor = p.h.some(id => DS.has(id)); });
    const b = $('bFac'); b.style.display = DS.size ? '' : 'none';
    b.onclick = () => { hideFac = !hideFac; setOn('bFac', hideFac); dropEasy(); applyVis(); }; }
  $('bUndo').onclick = cancelPoint;
  // подсказка по жестам — при первом открытии на телефоне
  const hint = $('hint');
  let seen = false; try { seen = localStorage.getItem('viewerHint') === '1'; } catch (e) {}
  if (TOUCH && !seen) hint.classList.add('show');
  hint.onclick = () => { hint.classList.remove('show'); try { localStorage.setItem('viewerHint', '1'); } catch (e) {} };
  $('q').oninput = renderTree;
  $('tOnly').onclick = isolateSel; $('tHide').onclick = hideSel; $('tAll').onclick = showAll;
  $('tFit').onclick = () => { if (selSet.length) fitBox(visibleBox(true)); };
  $('bRuler').onclick = () => { if (ruler) { stopRuler(); return; } ruler = true; rp = []; setOn('bRuler', true); cv.style.cursor = 'none'; $('st').textContent = RHINT[rmode]; syncTools(); };
  { let t = null, long = false; const b = $('bDims');
    b.addEventListener('pointerdown', () => { long = false; t = setTimeout(() => { long = true; clearDims(); }, 650); });
    b.addEventListener('pointerup', () => { clearTimeout(t); if (!long) setDimsShown(!dimsShown); });
    b.addEventListener('pointerleave', () => clearTimeout(t));
    b.addEventListener('contextmenu', e => { e.preventDefault(); clearTimeout(t); clearDims(); }); }
  $('bShowAll').onclick = showAll;
}

// ---------------- раскладка экрана ----------------
// Значки — всегда видны, строкой внизу посередине (29.09: прячущаяся строка с язычком ☰ убрана; вверху
// пробовали — Алексей вернул вниз). Справа вверху — кубик. Структура слева — от верха до строки значков.
function layout() {
  const b = $('bar'), t = $('tree'), land = isLand(), s = safe(), cw = $('vcube').offsetWidth;
  document.documentElement.classList.toggle('land', land);
  b.style.bottom = (8 + s.b) + 'px';
  b.style.maxWidth = (innerWidth - 16 - s.l - s.r) + 'px';
  $('st').style.bottom = (innerHeight - barTop() + 8) + 'px';   // подсказка — над значками
  t.style.top = (6 + s.t) + 'px';
  t.style.bottom = (innerHeight - barTop() + 6) + 'px';
  const c = $('card'); c.style.top = (10 + s.t) + 'px';
  if (TOUCH) {
    c.style.left = (10 + s.l) + 'px'; c.style.right = (16 + s.r + cw) + 'px';
    let tw = 0; try { tw = +localStorage.getItem('viewerTreeW' + (land ? 'L' : 'P')) || 0; } catch (e) {}
    t.style.width = Math.round((tw || (land ? 0.4 : 0.62)) * innerWidth) + 'px';
  }
  placeTools();
  placeTab();
  place();
}
// Значки включённого на экране (справа вверху): включил инструмент кнопкой — появился значок, нажал на значок —
// выключил, в строку кнопок лезть не надо (замечание 27.09).
function syncTools() {
  const box = $('tools'); box.replaceChildren();
  const chip = (icon, title, on, cls) => {
    const b = document.createElement('button'); b.innerHTML = icon; b.title = title; if (cls) b.className = cls;
    b.onclick = e => { e.stopPropagation(); on(); syncTools(); };
    box.appendChild(b);
  };
  if (ruler) {
    chip(ICON.ruler, 'вимкнути рулетку', stopRuler);
    // способ рулетки: лёгкие размеры (для заказчика, по умолчанию), грани, рёбра, точки
    chip(ICON.easy, 'легкі розміри: комірка, дверцята, шухляда', () => setRMode('easy'), 'mini' + (rmode === 'easy' ? ' on' : ''));
    chip(ICON.faces, 'міряти від грані до грані', () => setRMode('face'), 'mini' + (rmode === 'face' ? ' on' : ''));
    chip(ICON.edges, 'міряти від ребра до ребра', () => setRMode('edge'), 'mini' + (rmode === 'edge' ? ' on' : ''));
    chip(ICON.points, 'міряти від кута до кута', () => setRMode('point'), 'mini' + (rmode === 'point' ? ' on' : ''));
    if (dims.length) chip(ICON.trash, 'стерти всі розміри', () => { clearDims(); partDims.length = 0; easyDims.length = 0; }, 'mini');
  }
  if ($('bShowAll').style.display !== 'none') chip(ICON.eye, 'показати все приховане', showAll);
  placeTools();
}
// кубик видов — справа вверху; значки включённого — столбиком под ним
function placeTools() {
  const box = $('tools'), c = $('vcube'), s = safe();
  c.style.top = (6 + s.t) + 'px'; c.style.right = (6 + s.r) + 'px';
  box.style.top = (6 + s.t + c.offsetHeight + 4) + 'px';
  box.style.right = (6 + s.r + (c.offsetWidth - 46) / 2) + 'px';
}
// отступы под вырез камеры и полоску «домой» (у айфона — env(safe-area-inset-*), у остальных нули)
function safe() {
  let p = $('safeprobe');
  if (!p) {
    p = document.createElement('div'); p.id = 'safeprobe';
    p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(p);
  }
  const c = getComputedStyle(p);
  return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
}
function wireLayout() {
  // строка значков меняет высоту (подсказка рулетки, «показать всё») — структура и карточка следуют за ней
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe($('bar'));
}

// ---------------- запуск ----------------
// айфон при повороте сообщает новый размер экрана с опозданием (модель рисовалась растянутой, замечание 27.09) —
// размер сверяем каждый кадр и подстраиваемся, как только он поменялся
let lastW = innerWidth, lastH = innerHeight;
function loop() {
  requestAnimationFrame(loop);
  if (innerWidth !== lastW || innerHeight !== lastH) {
    const flip = (innerWidth > innerHeight) !== (lastW > lastH);
    lastW = innerWidth; lastH = innerHeight;
    rend.setSize(innerWidth, innerHeight); layout();
    if (flip && TOUCH) fitVisible();                       // повернули телефон — вписать модель заново
  }
  tick();
  if (!dirty) return;
  dirty = false;
  rend.render(scene, cam);
}
(window.__MODEL ? Promise.resolve(window.__MODEL)
  : fetch('./model.json?v=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('файл модели не найден (' + r.status + ')'); return r.json(); }))
  .then(data => {
    M = data; build(); initLevels(); wire(); wireLayout(); applyVis(); layout(); fitVisible();
    window.__viewer = { parts, animNode, M, dims, addDim, drawerDims, easyPick, easyCell, tubeDims, openTarget, pick, blockersOf, poseAll, toggleAt, scopeIds, boxOf, isTube, toWorld, clearDims, root, partsUnder, dragDim, THREE, snapAt, pointVisible, picks, get cam() { return cam; }, get placing() { return placing; }, get rp() { return rp; } };   // для проверки из консоли
    $('load').remove(); loop();
  })
  .catch(err => { $('load').textContent = 'Не удалось открыть модель: ' + err.message; });
