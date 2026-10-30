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
  fac: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M15 12h1"/><path d="M3 21L21 3" stroke-width="2"/>'),
  eye: sv('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  faces: sv('<path d="M5 4v16M19 4v16M8 12h8M10.5 9.5L8 12l2.5 2.5M13.5 9.5L16 12l-2.5 2.5"/>'),
  edges: sv('<path d="M4 15L15 4M9 20L20 9"/><path d="M8.5 11.5l4 4" stroke-dasharray="1.5 1.5"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
  gab: sv('<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>'),
  easy: sv('<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M7 12h10M7 12l2-2M7 12l2 2M17 12l-2-2M17 12l-2 2"/>'),
  points: sv('<circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/><path d="M8 12h8" stroke-dasharray="2 2"/>'),
  // до стін: угол комнаты (стена и пол) и полка с размерами до них
  wall: sv('<path d="M4 3v18h17" stroke-width="2.2"/><path d="M11 9h8"/><path d="M15 9v9.5M13.5 16.5l1.5 2 1.5-2" stroke-dasharray="0"/><path d="M11 6.5H6.5M8 5l-1.5 1.5L8 8"/>'),
  sheet: sv('<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 17h8M8 17v-6M16 17v-6M8 11h8"/>'),
  // пошук деталі за номером: лупа з решіткою
  find: sv('<circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M8 7.5l-.8 5M11.8 7.5l-.8 5M6.8 8.9h5.6M6.4 11.1h5.6"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  flip: sv('<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 6L3 18h6zM15 6l6 12h-6z"/>'),
  x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  full: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  unfull: sv('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
};
// кнопка строки → значок и подпись
// Строка кнопок — короткая (решение 28–29.09): виды ушли в кубик, способы показа и камеры — окошком
// рядом со своей кнопкой (как способы у рулетки), структура — язычком у левого края.
// Надписи кнопок, подсказок к ним и окошек — українською (просьба Богдана, 29.09): страницу смотрят заказчики.
const BTN_ICON = {
  bShowAll: ['eye', 'показати все'],
  bMode: ['solid', 'вигляд: суцільно / напівпрозоро / лінії'],
  bCam: ['persp', 'камера: перспектива / без перспективи / вписати'],
  bFac: ['fac', 'сховати фасади / показати фасади'],
  bRuler: ['ruler', 'рулетка'], bUndo: ['undo', 'скасувати точку (Esc, права кнопка)'],
  bDims: ['dims', 'розміри: коротко — сховати/показати, довго — видалити всі'],
  bDraw: ['sheet', 'креслення: кадри для звіту'],
  bFind: ['find', 'знайти деталь за номером'],
};
// Фурнитура, профили, линии — служебное, заказчику не показываем. Видно, когда проигрыватель открыт
// у Алексея на компьютере (местный адрес) или в режиме сборки (хвост ссылки #сборка).
const SERVICE = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) || decodeURIComponent(location.hash).includes('сборка');

// ---------------- разметка ----------------
document.body.insertAdjacentHTML('beforeend', `
<div id="load">завантаження моделі…</div>
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
<div id="hint"><b>Як дивитися</b>
  <p>☝ один палець — обертати</p><p>✌ два пальці — наблизити й зсунути</p>
  <p>👆 торкнутися дверцят або шухляди — відкрити / закрити</p><p>✋ потримати палець на деталі — що це за деталь</p>
  <p>📏 рулетка: торкніться грані, потім паралельної їй — розмір між ними; потримайте палець — лупа</p>
  <p>📱 iPhone: «Поділитися» → «На екран „Додому“» — модель відкриватиметься на весь екран, без рядка браузера</p>
  <small>торкніться, щоб закрити</small></div>
<div id="nfind"><div class="nfr"><input id="nq" type="search" inputmode="numeric" autocomplete="off" placeholder="номер деталі, напр. 225"><button id="nx" class="ic"></button></div><div id="nres"></div></div>
<div id="pdw"><canvas id="pdc"></canvas><div class="pdh"><div class="pdn"><b></b><small></small></div><button id="pdFlip" class="ic"></button><button id="pdClr" class="ic"></button><button id="pdX" class="ic"></button></div><div class="pdt"></div></div>
<div id="bar">
  <button id="bShowAll" style="display:none">показати все</button>
  <button id="bMode">вигляд</button><button id="bCam">камера</button><button id="bFac" style="display:none">фасади</button>
  <button id="bRuler">рулетка</button><button id="bUndo" style="display:none" title="Прибрати поставлену першу точку (Esc, права кнопка)">скасувати точку</button><button id="bDims" style="display:none" title="Коротко — сховати/показати, довго — видалити всі">розміри</button>
  <button id="bFind">пошук</button>
  <button id="bDraw" style="display:none">креслення</button>
  <span id="st"></span>
</div>
<div id="sheet"><span></span></div>
<svg id="dsvg"></svg>
<div id="dpanel"></div>
<div id="drib"></div><div id="dstrip"></div><div id="dctx"></div><div id="dfly"></div><div id="dstat"></div><div id="dtip"></div>`);
$('stamp').textContent = 'програвач від ' + APP_DATE;

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
const markObjs = [];   // значки крепежа на пласти (выгрузка метит их материал mk): в 3D видны, в кресленні спрятаны
let clipPl = null;     // разрез вида в кресленні: плоскость, всё по отрицательную сторону отсечено (см. «разрез вида»)
const cutAway = p => !!clipPl && drawOn && clipPl.distanceToPoint(p) < -0.01;
const box = new THREE.Box3();
let rad = 1000, showF = true, showB = true, showL = true;
let drawOn = false;    // вкладка «креслення» (см. ниже)
const KIND = { p: 'панель', f: 'фурнітура', b: 'профіль', m: '3D-об’єкт', l: 'лінія' };
const NTYPE = { TFurnBlock: 'блок', TFurnAsm: 'збірка', TDraftBlock: 'напівфабрикат', layer: 'шар' };

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

// рёбра детали как у EdgesGeometry, но без «сгиба на 180°»: Базис у деталей с вырезами/отверстиями отдаёт часть
// длинных узких треугольников ровной пласти перевёрнутыми (узкий лежит поверх соседа) — нормали противоположны, а
// оба в одной плоскости. EdgesGeometry считала это сгибом на 180° и проводила косую черту (скрины 08.10: планка
// WingLine 051_3, бок шкафа под стиралку 051_4). У объёмной детали противоположные нормали соседей ребром не бывают.
// Волосок (плиты, slivers): треугольник шириной меньше 0,5 мм и в 20 раз длиннее своей ширины. Выгрузка округляет точки
// до 0,1 мм, и направление у волоска выходит случайным — на ровной пласти рисовалась косая черта (08.10: бок антресоли
// левой 050_3, 275 мм). Волосок берёт направление широкого соседа по своей длинной стороне. Сверено на 050_3, 050_8,
// 051_1, 051_3, 051_4: уходят только эти три черты. У фурнитуры и 3D-объектов не применяется — там меняло настоящие рёбра.
function partEdges(g, deg, slivers) {
  const pos = g.attributes.position.array, cosT = Math.cos(deg * Math.PI / 180);
  const key = i => Math.round(pos[i] * 1e4) + ',' + Math.round(pos[i + 1] * 1e4) + ',' + Math.round(pos[i + 2] * 1e4);
  const E = new Map(), out = [], thin = [];
  const v = i => [pos[i], pos[i + 1], pos[i + 2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (let t = 0; t < pos.length; t += 9) {
    const P = [t, t + 3, t + 6], n = crs(sub(v(P[1]), v(P[0])), sub(v(P[2]), v(P[0]))), l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) continue;
    n[0] /= l; n[1] /= l; n[2] /= l;
    const K = P.map(key), len = [0, 1, 2].map(a => Math.hypot(...sub(v(P[(a + 1) % 3]), v(P[a])))), mx = Math.max(...len), hgt = l / mx;
    const tri = { n, thin: !!slivers && hgt < 0.5 && mx > 20 * hgt, long: null };   // у всех сторон треугольника — один tri
    for (let a = 0; a < 3; a++) {
      const b = (a + 1) % 3, c = (a + 2) % 3;
      if (K[a] === K[b]) continue;
      const h = K[a] < K[b] ? K[a] + '|' + K[b] : K[b] + '|' + K[a];
      const r = E.get(h), f = { tri, a: P[a], b: P[b], c: P[c] };
      if (r) r.push(f); else E.set(h, [f]);
      if (len[a] === mx) tri.long = h;
    }
    if (tri.thin) thin.push(tri);
  }
  for (const tri of thin) {
    const nb = tri.long && E.get(tri.long).find(f => !f.tri.thin);
    if (nb) tri.n = nb.tri.n;
  }
  for (const fs of E.values()) {
    const f = fs[0];
    let draw = fs.length !== 2;
    if (fs.length === 2) {
      const d = dot(f.tri.n, fs[1].tri.n);
      draw = d <= cosT && d >= -cosT;   // d < -cosT: перевёрнутый сосед в той же плоскости — не ребро
    }
    if (draw) out.push(pos[f.a], pos[f.a + 1], pos[f.a + 2], pos[f.b], pos[f.b + 1], pos[f.b + 2]);
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  return eg;
}

// чем меньше форма фурнитуры, тем выше она в споре за общую плоскость (0…3)
const rankMemo = {};
function shapeRank(f) {
  if (rankMemo[f] !== undefined) return rankMemo[f];
  const b = new THREE.Box3();
  for (const sd of M.shapes[f]) for (let i = 0; i < sd.v.length; i += 3) b.expandByPoint(new THREE.Vector3(sd.v[i], sd.v[i + 1], sd.v[i + 2]));
  const dg = b.isEmpty() ? 1000 : b.getSize(new THREE.Vector3()).length();
  return (rankMemo[f] = Math.max(0, Math.min(3, Math.floor(400 / Math.max(dg, 1)))));
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
        const mt = materialFor(s.m);
        // грани фурнитуры, лежащие в одной плоскости с плитой или соседней фурнитурой (врезной подвес LIBRA в крышке и
        // на планке), рисовались полосами вперемешку — фурнитура всегда поверх, из двух фурнитур — меньшая.
        // Только постоянный сдвиг: наклонная часть (factor) на взгляде вскользь вырастала больше толщины плиты —
        // направляющие за 18 мм ДСП просвечивали пунктиром (скрин 06.10)
        mt.polygonOffset = true; mt.polygonOffsetFactor = 0; mt.polygonOffsetUnits = -1 - shapeRank(od.f);
        const m = new THREE.Mesh(s.g, mt); m.userData.idx = i; inst.add(m); meshes.push(m); picks.push(m);
      }
      grp.add(inst);
    } else {
      for (const pd of od.p) {
        const g = geom(pd); g.computeBoundingBox(); box.union(g.boundingBox);
        const m = new THREE.Mesh(g, materialFor(pd.m)); m.userData.idx = i; grp.add(m); meshes.push(m); picks.push(m);
        const ln = new THREE.LineSegments(partEdges(g, 25, od.k === 'p'), EDGE); grp.add(ln); edges.push(ln);
        const lh = new THREE.LineSegments(ln.geometry, EDGE_HID); lh.visible = false; lh.renderOrder = 1; grp.add(lh); hidEdges.push(lh);
        if (M.mats[pd.m] && M.mats[pd.m].mk) { m.userData.mark = ln.userData.mark = lh.userData.mark = true; markObjs.push(m, ln); }
      }
    }
    root.add(grp);
    const h = od.h || [];
    // подвижные предки — от внешнего к внутреннему (h идёт от ближайшего владельца вверх)
    const chainA = h.filter(id => animNode[id]).reverse();
    const rec = { g: grp, meshes, edges, h, v: h, d: od.d || '', n: od.n, kind: od.k || 'p', isF: od.k === 'f' || od.k === 'm', isB: od.k === 'b', isL: od.k === 'l', hidden: false, i, chainA };
    parts.push(rec);
    if (chainA.length) { grp.matrixAutoUpdate = false; moving.push(rec); }
  });
  poseAll();
  initLevels();

  // уровни для показа (дерево, цепочка карточки, Tab) без пустых обёрток (Алексей 29.09): блок в блоке с тем же
  // содержимым — остаётся верхний; блок с одним объектом — остаётся сама деталь. Сборочная единица не убирается.
  // REP: убранный узел → оставленный с тем же содержимым (-1 — сама деталь). h (полная цепочка) — для движения.
  const ASM = new Set(M.nasm || []);
  parts.forEach(p => {
    const v = []; let upN = -1, upId = -1;
    for (let k = p.h.length - 1; k >= 0; k--) {
      const id = p.h[k], n = NCNT[id] || 0;
      if (n === upN) { REP[id] = upId; continue; }
      if (n <= 1 && !ASM.has(id)) { REP[id] = -1; continue; }
      REP[id] = id; v.unshift(id); upN = n; upId = id;
    }
    p.v = v;
  });

  // структура: цепочка идёт от ближайшего владельца к верхнему
  parts.forEach((p, i) => {
    let parent = null;
    for (let k = p.v.length - 1; k >= 0; k--) {
      const id = p.v[k];
      let nd = nodes[id];
      if (!nd) {
        nd = nodes[id] = { id, name: M.names[id] || '(без назви)', kids: [], parts: [], parent: parent ? parent.id : -1,
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
  document.title = M.title || 'Перегляд виробу';
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
    if (k >= 1) anims.splice(i, 1);
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
  updRuler(); if (drawOn) drawInfo(); need();
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
    if (drawOn && drawLines) return;                       // креслення: только строгие виды, кубик не вращает
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
  // креслення: сверху лента и строка значков, справа панель листов, снизу строка-подсказка — лист посередине
  if (drawOn) return { x0, x1: innerWidth - $('dpanel').offsetWidth - 12, y0: ribBottom() + 8 + $('dstrip').offsetHeight + 8, y1: barTop() - 10 };
  return { x0, x1: innerWidth, y0: 0, y1: innerHeight };
}
// «нажата» — только пометка on; остальные пометки кнопки (например «прятать в ⋯») не трогаем
const setOn = (id, v) => $(id).classList.toggle('on', !!v);
function setPersp(on) { view.persp = on; setIcon('bCam', on ? 'persp' : 'ortho'); place(); }
// строгий вид (грань кубика): на телефоне не поворачивается — один палец двигает, два приближают;
// обратно к вращению — потянуть кубик или «камера» → перспектива / без перспективы
function strictView(yaw, pitch) { view.strict = true; view.yaw = yaw; view.pitch = pitch; setPersp(false); if (drawOn) fitSheet(); else fitVisible(); }

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
  for (const id of p.v) if (nodes[id].hidden) return false;
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
  pushUndo();                                               // в кресленні — для Ctrl+Z
  for (const p of parts) p.hidden = false;
  for (const k in nodes) nodes[k].hidden = false;
  applyVis(); renderTree();
}
function hideSel() {
  pushUndo();
  if (selMany.length || selOne.length) { for (const id of selMany) nodes[id].hidden = true; for (const i of selOne) parts[i].hidden = true; }
  else if (selNode !== null) nodes[selNode].hidden = true;
  else for (const i of selSet) parts[i].hidden = true;
  clearSel(); applyVis(); renderTree();
}
function isolateSel() {
  if (!selSet.length) return;
  pushUndo();
  const keep = new Set(selSet);
  for (const k in nodes) nodes[k].hidden = false;
  parts.forEach((p, i) => { p.hidden = !keep.has(i); });
  applyVis(); renderTree();
}

// ---------------- выделение ----------------
let selIdx = -1, selLevel = -1, selSet = [], selNode = null, selMany = [], selOne = [];   // набор: шкафы (Shift) + отдельные детали (Ctrl)
const NCNT = {}, REP = {};
function initLevels() { for (const p of parts) for (const id of p.h) NCNT[id] = (NCNT[id] || 0) + 1; }
// уровни — по показанной цепочке v (без пустых обёрток), в ней объём растёт с каждым звеном
function sizeAt(i, k) { return k < 0 ? 1 : (NCNT[parts[i].v[k]] || 1); }
function upLevel(i, from) {
  const v = parts[i].v, cur = sizeAt(i, from);
  for (let k = from + 1; k < v.length; k++) if ((NCNT[v[k]] || 0) > cur) return k;
  return v.length ? v.length - 1 : -1;
}
function downLevel(i, from) {
  if (from < 0) return -1;
  const cur = sizeAt(i, from);
  for (let k = from - 1; k >= 0; k--) if ((NCNT[parts[i].v[k]] || 0) < cur) return k;
  return -1;
}
function partsUnder(id) { const out = []; parts.forEach((p, i) => { if (p.h.includes(id)) out.push(i); }); return out; }
// деталь, от которой построена цепочка в карточке: щелчки по звеньям цепочки её не меняют
let chainPart = -1;
function selectPart(i, level) {
  selIdx = i; selLevel = level; chainPart = i; selMany = []; selOne = [];
  const v = parts[i].v;
  if (level < 0 || !v.length) { selNode = null; selSet = [i]; selLevel = -1; }
  else { selNode = v[Math.min(level, v.length - 1)]; selSet = partsUnder(selNode); }
  paint(); revealInTree();
}
function selectNode(id) { selNode = id; selIdx = -1; chainPart = -1; selMany = []; selOne = []; selSet = partsUnder(id); paint(); renderTree(); }
// звено цепочки карточки: узел (блок, ящик, модуль…) или сама деталь
function selectChain(id) {
  const i = chainPart;
  if (id === null) { selectPart(i, -1); return; }
  const k = parts[i].v.indexOf(id);
  selIdx = i; selLevel = k; selNode = id; selMany = []; selOne = []; selSet = partsUnder(id);
  paint(); revealInTree();
}
function clearSel() { selIdx = -1; selSet = []; selNode = null; chainPart = -1; selMany = []; selOne = []; addMode = false; paint(); renderTree(); }
// Телефон: кнопка «＋ додати» в карточке — пока включена, касание работает как Shift на компьютере (Алексей 01.10).
// Снятое выделение выключает её.
let addMode = false;
function tapPick(i) { if (addMode) shiftPick(i); else stepSel(i); }
// Лестница сборочных единиц (Алексей 01.10): от детали вверх только по галочкам «сборочная единица» из Базиса —
// самая нижняя, потом та, в которую она входит, и так до верха. Нет галочек (выгрузки до 29.09 вечера) — подъёма нет.
function asmChain(i) {
  const out = [];
  if (!M.nasm) return out;
  const A = new Set(M.nasm), h = parts[i].h;
  for (let k = 0; k < h.length; k++) {
    if (!A.has(h[k])) continue;
    const r = REP[h[k]];
    if (r !== undefined && r >= 0 && !out.includes(r)) out.push(r);
  }
  return out;
}
// ступень выше: первая единица над деталью i, которая больше нынешнего выделения (cur — узел или null = сама деталь)
function asmAbove(i, cur) {
  const n0 = cur === null ? 1 : (NCNT[cur] || 0);
  for (const c of asmChain(i)) if (c !== cur && (NCNT[c] || 0) > n0) return c;
  return -1;
}
function rebuildMany() {
  selIdx = -1; selNode = null; chainPart = -1; selLevel = -1;
  const all = new Set(selOne); for (const n of selMany) for (const j of partsUnder(n)) all.add(j);
  selSet = [...all];
  if (!selSet.length) addMode = false;
  paint(); renderTree();
}
function seedMany() {                                       // уже выделенное обычным щелчком — первым в набор
  if (selMany.length || selOne.length) return;
  if (selNode !== null) selMany.push(selNode); else if (selIdx >= 0) selOne.push(selIdx);
}
// Набор (компьютер, показ через проектор): Ctrl+щелчок — добавить/убрать одну деталь; Delete прячет все.
function toggleOne(i) {
  const fresh = !selMany.length && !selOne.length;
  seedMany();
  if (fresh && selOne.length === 1 && selOne[0] === i) { rebuildMany(); return; }   // Ctrl по уже выделенной — остаётся
  const at = selOne.indexOf(i);
  if (at >= 0) selOne.splice(at, 1); else selOne.push(i);
  rebuildMany();
}
// Shift+щелчок: по невыделенной детали — добавить её самую нижнюю сборочную единицу; по выделенной — поднять ту
// единицу на ступень выше (выделенное внутри неё вливается); выше некуда — снять её из набора (Алексей 01.10).
function shiftPick(i) {
  seedMany();
  const own = selMany.find(n => partsUnder(n).includes(i));
  const cur = own !== undefined ? own : (selOne.includes(i) ? null : undefined);
  if (cur === undefined) {                                  // ещё не выделена
    const c = asmAbove(i, null);
    if (c < 0) selOne.push(i); else addUnit(c);
  } else {
    const c = asmAbove(i, cur);
    if (cur === null) selOne.splice(selOne.indexOf(i), 1); else selMany.splice(selMany.indexOf(cur), 1);
    if (c >= 0) addUnit(c);
  }
  rebuildMany();
}
function addUnit(c) {                                       // единица поглощает выделенное внутри себя
  const inside = new Set(partsUnder(c));
  selMany = selMany.filter(n => !partsUnder(n).every(j => inside.has(j)));
  selOne = selOne.filter(j => !inside.has(j));
  selMany.push(c);
}
// Телефон: касание детали — деталь, каждое следующее по ней же — сборочная единица ступенью выше, после самой
// верхней — снять (Алексей 01.10). У дверей и ящиков — долгим нажатием (короткое открывает).
function stepSel(i) {
  const plain = !selMany.length && !selOne.length;
  let cur;
  if (plain && selNode === null && selIdx === i) cur = null;
  else if (plain && selNode !== null && selSet.includes(i)) cur = selNode;
  else { selectPart(i, -1); return; }
  const c = asmAbove(i, cur);
  if (c < 0) { clearSel(); return; }
  const k = parts[i].v.indexOf(c);
  if (k >= 0) selectPart(i, k); else selectNode(c);
}
function paint() {
  const on = new Set(selSet);
  parts.forEach((p, i) => {
    for (const m of p.meshes) {
      if (drawOn && m.userData.mat) { if (!m.userData.glass) m.material = on.has(i) ? DRAW_SEL : DRAW_MAT; continue; }
      m.material.emissive.setHex(on.has(i) ? 0x2b6cb0 : 0x000000);
      m.material.emissiveIntensity = on.has(i) ? 0.45 : 0;
    }
  });
  const d = $('card');
  if (!selSet.length) { d.style.display = 'none'; need(); gabShow(); if (!drawOn) placeTools(); return; }
  d.style.display = 'block';
  let title, sub;
  const num = d => d ? ' · № ' + d : '';                 // обозначение из Базиса — номер как на этикетке
  if (selMany.length || selOne.length) {
    title = 'вибрано: ' + (selMany.length + selOne.length);
    sub = selMany.map(id => nodes[id].name).concat(selOne.map(i => parts[i].n + num(parts[i].d))).join('; ');
  } else if (selNode === null) {
    const p = parts[selSet[0]];
    title = p.n; sub = (KIND[p.kind] || '') + num(p.d);
  } else {
    title = nodes[selNode].name; sub = selSet.length + ' об’єктів' + num(M.ndes && M.ndes[selNode]);
  }
  // одна деталь: ссылка поставщика (фурнитура / профиль) и чертёж панели во весь экран (монтажники 30.10)
  const one = !selMany.length && !selOne.length ? (selNode === null ? selSet[0] : -1) : -1;
  const url = one >= 0 ? linkOf(one) : (selNode !== null && !selMany.length && !selOne.length ? nodeLink(selNode) : '');
  const canPd = one >= 0 && parts[one].kind === 'p';
  d.innerHTML = '<b></b><small></small><div class="chain"></div><div class="cbtn"><button>сховати</button><button>тільки це</button>' +
    (TOUCH ? '<button class="add' + (addMode ? ' on' : '') + '">＋ додати</button>' : '') +
    (canPd ? '<button class="pd">' + ICON.sheet + '<span>креслення</span></button>' : '') +
    (url ? '<button class="url">' + ICON.link + '<span>сайт</span></button>' : '') + '</div>';
  d.children[0].textContent = title || '(без назви)';
  d.children[1].textContent = sub || '';
  // цепочка «изделие ▸ модуль ▸ ящик ▸ фасад»: щелчок по звену выделяет весь этот узел,
  // «скрыть» / «только это» работают для выделенного звена; цепочка остаётся, можно ходить вверх-вниз
  const ch = d.children[2];
  const add = (text, on, cur) => {
    if (ch.childNodes.length) ch.appendChild(document.createTextNode(' ▸ '));
    const a = document.createElement('span'); a.className = 'lnk' + (cur ? ' cur' : ''); a.textContent = text || '(без назви)';
    a.onclick = e => { e.stopPropagation(); on(); };
    ch.appendChild(a);
  };
  if (selMany.length || selOne.length) {
    // набор шкафов и деталей: цепочки нет
  } else if (chainPart >= 0 && selSet.includes(chainPart)) {
    const p = parts[chainPart];
    for (const id of p.v.slice().reverse()) add(M.names[id], () => selectChain(id), selNode === id);
    add(p.n, () => selectChain(null), selNode === null);
  } else {
    const any = parts[selSet[0]], chainOf = selNode === null ? any.v : any.v.slice(Math.max(0, any.v.indexOf(selNode)));
    for (const id of chainOf.slice().reverse()) add(M.names[id], () => selectNode(id), selNode === id);
  }
  const bs = d.querySelectorAll('.cbtn button');
  bs[0].onclick = () => hideSel();
  bs[1].onclick = () => { isolateSel(); clearSel(); fitVisible(); };
  const ba = d.querySelector('.cbtn .add'); if (ba) ba.onclick = e => { e.stopPropagation(); addMode = !addMode; ba.classList.toggle('on', addMode); };
  const bp = d.querySelector('.cbtn .pd'); if (bp) bp.onclick = e => { e.stopPropagation(); pdOpen(one); };
  const bu = d.querySelector('.cbtn .url'); if (bu) bu.onclick = e => { e.stopPropagation(); window.open(url, '_blank', 'noopener'); };
  need(); gabShow(); if (!drawOn) placeTools();
}
// ссылка поставщика: своя у детали (выгрузка — od.u), иначе от ближайшей сборки фурнитуры над ней (петля для «основы»)
function linkOf(i) {
  if (!M.urls) return '';
  const od = M.objs[i]; if (od.u !== undefined) return M.urls[od.u] || '';
  for (const id of parts[i].h) { const r = nodeLink(id); if (r) return r; }
  return '';
}
function nodeLink(id) { return M.urls && M.nurl && M.nurl[id] !== undefined ? M.urls[M.nurl[id]] || '' : ''; }
// любая смена выделения (щелчок, Tab, Ctrl, дерево, цепочка карточки) проходит через paint → габарит следует за ней

// ---------------- дерево ----------------
const tbody = $('tbody');
function nodeRow(nd, depth) {
  const r = document.createElement('div');
  r.className = 'tr' + (selNode === nd.id || selMany.includes(nd.id) ? ' sel' : '') + (nodeOff(nd) ? ' off' : '');
  r.style.paddingLeft = (4 + depth * 14) + 'px';
  const hasKids = nd.kids.length + nd.parts.length > 0;
  r.innerHTML = '<span class="cr"></span><input type="checkbox"><span class="nm"></span><span class="tp"></span>';
  r.children[0].textContent = hasKids ? (nd.open ? '▾' : '▸') : '';
  r.children[1].checked = !nd.hidden;
  r.children[2].textContent = nd.name;
  r.children[3].textContent = ((M.ntype && NTYPE[M.ntype[nd.id]]) || 'вузол') + ' · ' + nd.count;
  r.children[0].onclick = e => { e.stopPropagation(); nd.open = !nd.open; renderTree(); };
  r.children[1].onclick = e => { e.stopPropagation(); pushUndo(); nd.hidden = !r.children[1].checked; applyVis(); renderTree(); };
  r.onclick = () => selectNode(nd.id);
  r.ondblclick = () => { selectNode(nd.id); fitBox(visibleBox(true)); };
  return r;
}
function partRow(i, depth) {
  const p = parts[i];
  const r = document.createElement('div');
  r.className = 'tr' + ((selNode === null && !selMany.length && selSet.includes(i)) || selOne.includes(i) ? ' sel' : '') + (effVisible(p) ? '' : ' off');
  r.style.paddingLeft = (4 + depth * 14) + 'px';
  r.innerHTML = '<span class="cr"></span><input type="checkbox"><span class="nm"></span><span class="tp"></span>';
  r.children[1].checked = !p.hidden;
  r.children[2].textContent = p.n || '(без назви)';
  r.children[3].textContent = KIND[p.kind] || '';
  r.children[1].onclick = e => { e.stopPropagation(); pushUndo(); p.hidden = !r.children[1].checked; applyVis(); renderTree(); };
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
    const h = parts[selIdx].v;
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
    if (!mt.visible || mt.transparent || cutAway(h.point)) continue;
    if (shown(h.object)) return false;
  }
  return true;
}
function snapAt(cx, cy, radii) {
  root.updateMatrixWorld(true);
  const persp = cam.isPerspectiveCamera, fwd = cam.getWorldDirection(new THREE.Vector3());
  const pxPerMm = d => persp ? innerHeight / 2 / (d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
                             : innerHeight / (cam.top - cam.bottom);
  const toPx = s => [(s.x + 1) / 2 * innerWidth, (1 - s.y) / 2 * innerHeight];
  const c = new THREE.Vector3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const R of (radii || SNAP_R)) {
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
          if (cutAway(v)) continue;
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
  $('st').textContent += ' — торкніться другої грані, паралельної першій (порожнє місце — скинути)'; showPending();
}
function clearFace1() { dropHL(face1); face1 = null; showPending(); }
// отпустили на грани (или мимо)
function faceClick(f, mouse) {
  if (!f) { if (face1) { clearFace1(); $('st').textContent = 'рулетка: торкніться грані деталі'; } return; }
  if (!face1) { setFace1(f); return; }
  if (sameFace(f, face1)) return;
  if (Math.abs(f.n.dot(face1.n)) <= PAR) { toast('ця грань не паралельна першій — виберіть підсвічену паралельну'); return; }
  // расстояние между плоскостями — по нормали первой грани; размер от точки касания второй грани до первой плоскости
  const n1 = face1.n.clone(), d = f.p.clone().sub(face1.p).dot(n1);
  clearFace1(); $('st').textContent = 'рулетка: торкніться грані деталі';
  if (Math.abs(d) < 0.5) { toast('грані в одній площині — 0 мм'); return; }
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
// ---------------- габарит выделенного ----------------
// Способ рулетки «габарит» (Алексей 29.09): щелчок выделяет, Tab/Shift+Tab — выше/ниже, Ctrl — деталь, Shift — сборочная единица (ещё раз — выше);
// на экране ОДИН габарит (ширина, висота, глибина) — пересчитывается при каждой смене выделения.
// Поворот — по габаритной рамке ближайшего фрагмента (выгрузка: M.nfax), числа — по самим видимым деталям в том
// положении, что на экране. Нет рамки или шкафы набора стоят по-разному — по осям комнаты.
const gabDims = [];
function gabShow() {
  // рулетка выключена, другой способ или выделение снято — прежний габарит остаётся как есть (стереть — корзина)
  if (!ruler || rmode !== 'gab' || !selSet.length) return;
  while (gabDims.length) { const dm = gabDims.pop(); if (dims.includes(dm)) removeDim(dm); }
  const n0 = dims.length;
  selGab();
  for (let k = n0; k < dims.length; k++) gabDims.push(dims[k]);
}
function frameNodeFor(i, from) {
  const h = parts[i].h;
  for (let k = Math.max(0, from); k < h.length; k++) if (M.nfax && M.nfax[h[k]]) return h[k];
  return -1;
}
function frameAxesNow(i, fid) {             // оси рамки с учётом открытых дверей/ящиков над ней (и её самой)
  const h = parts[i].h, k = h.indexOf(fid), m = new THREE.Matrix4();
  for (const id of parts[i].chainA) if (h.indexOf(id) >= k) m.multiply(screwMatrix(animNode[id]));
  const q = new THREE.Quaternion(); m.decompose(new THREE.Vector3(), q, new THREE.Vector3());
  return M.nfax[fid].map(a => new THREE.Vector3(a[0], a[1], a[2]).normalize().applyQuaternion(q));
}
function selGab() {
  if (!selSet.length) return false;
  const ref = [];
  if (selMany.length || selOne.length) {
    for (const n of selMany) { const i = partsUnder(n)[0]; if (i !== undefined) ref.push([i, parts[i].h.indexOf(n)]); }
    for (const i of selOne) ref.push([i, 0]);
  } else if (selNode !== null) ref.push([selSet[0], parts[selSet[0]].h.indexOf(selNode)]);
  else ref.push([selSet[0], 0]);
  let ax = null;
  for (const [i, from] of ref) {
    const f = frameNodeFor(i, from); if (f < 0) { ax = null; break; }
    const a = frameAxesNow(i, f);
    if (!ax) ax = a; else if (!a.every((v, q) => Math.abs(v.dot(ax[q])) > 0.999)) { ax = null; break; }
  }
  if (ax) {                                  // выровнять в строгий прямой угол
    ax[1].addScaledVector(ax[0], -ax[1].dot(ax[0])).normalize();
    ax[2] = new THREE.Vector3().crossVectors(ax[0], ax[1]).normalize();
  } else ax = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], v = new THREE.Vector3();
  for (const i of selSet) {
    const p = parts[i]; if (!effVisible(p)) continue;
    for (const m of p.meshes) {
      m.updateWorldMatrix(true, false);
      const pos = m.geometry.attributes.position;
      for (let t = 0; t < pos.count; t++) {
        v.fromBufferAttribute(pos, t).applyMatrix4(m.matrixWorld);
        for (let q = 0; q < 3; q++) { const d = v.dot(ax[q]); if (d < mn[q]) mn[q] = d; if (d > mx[q]) mx[q] = d; }
      }
    }
  }
  if (!isFinite(mn[0])) return false;
  const P = c => ax[0].clone().multiplyScalar(c[0]).addScaledVector(ax[1], c[1]).addScaledVector(ax[2], c[2]);
  const up = ax.map(a => Math.abs(a.y)), hi = up.indexOf(Math.max(...up)), rest = [0, 1, 2].filter(q => q !== hi);
  const label = []; label[hi] = 'висота'; label[rest[0]] = 'ширина'; label[rest[1]] = 'глибина';
  // Разводка как на чертеже (замечание 29.09: размеры сквозь шкаф, надписи друг на друге): ширина — по нижнему
  // ребру ближней к смотрящему стороны, высота — по вертикальному ребру ближнего бока, глибина — по нижнему ребру
  // этого бока; каждый отнесён наружу от габарита, надписи на трёх разных рёбрах.
  const W = rest[0], D = rest[1], H = hi;
  const eye = cam.position, fwd = cam.getWorldDirection(new THREE.Vector3());
  const near = (k) => {                        // какой из двух краёв по оси k ближе к смотрящему
    const c = [0, 1, 2].map(q => (mn[q] + mx[q]) / 2);
    const a = c.slice(), b = c.slice(); a[k] = mn[k]; b[k] = mx[k];
    const za = cam.isPerspectiveCamera ? P(a).distanceTo(eye) : P(a).dot(fwd), zb = cam.isPerspectiveCamera ? P(b).distanceTo(eye) : P(b).dot(fwd);
    return za <= zb ? mn[k] : mx[k];
  };
  const low = ax[H].y >= 0 ? mn[H] : mx[H];     // низ габарита
  const out = (k, at) => ax[k].clone().multiplyScalar(at === mn[k] ? -1 : 1);   // наружу от края at по оси k
  const gap = Math.max(40, Math.min(150, 0.05 * Math.max(mx[W] - mn[W], mx[H] - mn[H], mx[D] - mn[D])));
  const dF = near(D), wS = near(W);
  const put = (k, fix, off) => {
    if (mx[k] - mn[k] < 0.5) return;
    const c1 = [0, 0, 0], c2 = [0, 0, 0]; c1[k] = mn[k]; c2[k] = mx[k];
    for (const [q, v] of fix) { c1[q] = c2[q] = v; }
    let a = P(c1), b = P(c2);
    const dm = addDim(a, b, { label: label[k] });
    if (dm.axis) { dm.off.copy(off); buildDim(dm); }         // по оси комнаты — выносные линии с отступом
    else { dm.a.add(off); dm.b.add(off); buildDim(dm); }     // косой (развёрнутое изделие) — сам отодвинут
  };
  put(W, [[H, low], [D, dF]], out(H, low).multiplyScalar(gap));
  put(H, [[W, wS], [D, dF]], out(W, wS).multiplyScalar(gap));
  put(D, [[H, low], [W, wS]], out(H, low).multiplyScalar(gap).addScaledVector(out(W, wS), gap));
  updRuler(); need();
  $('st').textContent = 'габарит: ширина ' + fmt(mx[rest[0]] - mn[rest[0]]) + ', висота ' + fmt(mx[hi] - mn[hi]) + ', глибина ' + fmt(mx[rest[1]] - mn[rest[1]]) + ' мм';
  return true;
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
  // сначала грубо, как у углов: шар вокруг набора рёбер на экране далеко от курсора — весь набор мимо
  // (08.10: в гардеробной 050_8 — 462 тыс. рёбер, полный перебор на каждое движение мыши давал ~0,25 с и дёрганый прицел)
  const persp = cam.isPerspectiveCamera, fwd = cam.getWorldDirection(new THREE.Vector3()), c = new THREE.Vector3(), s = new THREE.Vector3();
  const pxPerMm = d => persp ? innerHeight / 2 / (d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) : innerHeight / (cam.top - cam.bottom);
  const near = ln => {
    const g = ln.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    const sc = ln.matrixWorld.getMaxScaleOnAxis(), r = g.boundingSphere.radius * sc;
    c.copy(g.boundingSphere.center).applyMatrix4(ln.matrixWorld);
    const depth = c.clone().sub(cam.position).dot(fwd);
    if (persp && depth <= r) return true;
    const [sx, sy] = toPx(s.copy(c).project(cam));
    return Math.hypot(sx - cx, sy - cy) <= r * pxPerMm(persp ? depth - r : 1) + R;
  };
  const cand = [];
  for (const pr of parts) {
    // в кресленні цепляемся ещё за рёбра фурнитуры (ножка) и отрезки помещения (линия чистого пола)
    const src = drawOn ? (pr.isL ? pr.g.children.filter(o => o.isLineSegments) : pr.edges.concat(pr.dEdges || [])) : pr.edges;
    if (!pr.g.visible || !src.length) continue;
    for (const ln of src) {
      if (ln.userData.mark && drawOn) continue;               // значки крепежа в кресленні спрятаны — к ним не цепляемся
      if (!near(ln)) continue;
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
    if (cutAway(p) || !pointVisible(p)) continue;
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
  if (!e) { if (edge1) { clearEdge1(); $('st').textContent = 'рулетка: торкніться ребра деталі'; } return; }
  if (!edge1) {
    edge1 = e; edgeHL(e, DIMC); showPending();
    $('st').textContent = 'рулетка: торкніться другого ребра, паралельного першому (порожнє місце — скинути)'; return;
  }
  if (sameEdge(e, edge1)) return;
  if (Math.abs(e.dir.dot(edge1.dir)) <= PAR) { toast('це ребро не паралельне першому — виберіть підсвічене паралельне'); return; }
  // поперёк рёбер; в строгом виде без перспективы — ещё и без составляющей «к смотрящему»
  const w = e.p.clone().sub(edge1.p), d = edge1.dir;
  const perp = w.clone().addScaledVector(d, -w.dot(d));
  if (!cam.isPerspectiveCamera) {
    const v = cam.getWorldDirection(new THREE.Vector3()), vp = v.clone().addScaledVector(d, -v.dot(d));
    if (vp.lengthSq() > 1e-6) { vp.normalize(); perp.addScaledVector(vp, -perp.dot(vp)); }
  }
  clearEdge1(); $('st').textContent = 'рулетка: торкніться ребра деталі';
  if (perp.length() < 0.5) { toast('ребра на одній лінії — 0 мм'); return; }
  const b = e.p.clone(), a = b.clone().sub(perp);
  const dm = addDim(a, b);
  if (mouse && dm.axis) placing = { dm, base: a.clone().add(b).multiplyScalar(0.5) };
}
// ---------------- рулетка «до стін» ----------------
// Способ «до стін» (Алексей 08.10): заказчик спрашивает, на какой высоте полка и сколько от неё до стены, а пола и
// стен в модели нет — есть только линии помещения («Слой 0»: зелёная линия пола, чёрные рёбра стен). Указал
// плоскость детали и линию помещения, в любом порядке, — размер поперёк плоскости до этой линии. Годятся только пары
// «плоскость примерно параллельна линии»: низ полки — к линии пола (высота), бок полки — к ребру стены или к линии
// пола вдоль стены (до стены). Указана плоскость — подсвечены все подходящие к ней линии; указана линия — под курсором
// подсвечиваются только подходящие плоскости. Линия к плоскости наискосок (стена завалена) — размер до середины
// линии, то есть средний; погрешность до 10 мм Алексея устраивает.
const WPAR = Math.sin(THREE.MathUtils.degToRad(10));    // «примерно параллельно» — до 10°
let wall1 = null, wallHov = null;
const wallHints = [];
const lineFits = (e, f) => Math.abs(e.dir.dot(f.n)) < WPAR;
// линия помещения под курсором (fit — только подходящие); видимая — в первую очередь, но линия пола под шкафом
// тоже берётся: за неё и меряют
function roomLineAt(cx, cy, fit) {
  root.updateMatrixWorld(true);
  const R = TOUCH ? 24 : 12, A = new THREE.Vector3(), B = new THREE.Vector3(), sa = new THREE.Vector3(), sb = new THREE.Vector3();
  const toPx = s => [(s.x + 1) / 2 * innerWidth, (1 - s.y) / 2 * innerHeight];
  const cand = [];
  for (const pr of parts) {
    if (!pr.isL || !pr.g.visible) continue;
    for (const ln of pr.g.children) {
      if (!ln.isLineSegments) continue;
      const pos = ln.geometry.attributes.position, mw = ln.matrixWorld;
      for (let i = 0; i + 1 < pos.count; i += 2) {
        A.fromBufferAttribute(pos, i).applyMatrix4(mw); B.fromBufferAttribute(pos, i + 1).applyMatrix4(mw);
        if (A.distanceTo(B) < 1) continue;
        const e = { a: A.clone(), b: B.clone(), dir: B.clone().sub(A).normalize() };
        if (fit && !fit(e)) continue;
        sa.copy(A).project(cam); sb.copy(B).project(cam);
        if (sa.z > 1 || sb.z > 1) continue;
        const [ax, ay] = toPx(sa), [bx, by] = toPx(sb), vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
        let d, t = 0;
        if (L2 < 4) d = Math.hypot(ax - cx, ay - cy);              // ребро стены сверху — точка
        else { t = Math.max(0, Math.min(1, ((cx - ax) * vx + (cy - ay) * vy) / L2)); d = Math.hypot(ax + vx * t - cx, ay + vy * t - cy); }
        if (d <= R) { e.d = d; e.p = e.a.clone().lerp(e.b, t); cand.push(e); }
      }
    }
  }
  if (!cand.length) return null;
  cand.sort((p, q) => p.d - q.d);
  for (const k of cand.slice(0, 20)) if (pointVisible(k.p)) return k;
  return cand[0];
}
// что под курсором: после плоскости — только подходящая линия (мимо — другая плоскость, ею заменить первую);
// после линии — только плоскость; в начале — линия, если рядом, иначе плоскость
function wallAt(cx, cy) {
  if (wall1 && wall1.e) { const f = faceAt(cx, cy); return f ? { f } : null; }
  const e = roomLineAt(cx, cy, wall1 ? (q => lineFits(q, wall1.f)) : null); if (e) return { e };
  const f = faceAt(cx, cy); return f ? { f } : null;
}
const sameWall = (p, q) => !!p && !!q && (p.f ? !!q.f && sameFace(p.f, q.f) : !!q.e && sameEdge(p.e, q.e));
function wallHL(w, color) { if (w.f) faceHL(w.f, color, 0.35); else edgeHL(w.e, color); }
function wallDrop(w) { if (!w) return; if (w.f) dropHL(w.f); else dropEdge(w.e); }
function wallHover(cx, cy) {
  const w = wallAt(cx, cy);
  const ok = !!w && !sameWall(w, wall1) && !(wall1 && wall1.e && !lineFits(wall1.e, w.f));
  if (wallHov && !(ok && sameWall(wallHov, w))) { wallDrop(wallHov); wallHov = null; }
  if (ok && !wallHov) { wallHov = w; wallHL(w, 0x2b6cb0); }
  return w;
}
function wallHoverEnd() { wallDrop(wallHov); wallHov = null; }
function dropWallHints() { while (wallHints.length) dropEdge(wallHints.pop()); }
function clearWall1() { wallDrop(wall1); wall1 = null; dropWallHints(); showPending(); }
// все линии помещения, до которых можно мерить от этой плоскости — бледной подсветкой
function showWallHints(f) {
  dropWallHints();
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  for (const pr of parts) {
    if (!pr.isL || !pr.g.visible) continue;
    for (const ln of pr.g.children) {
      if (!ln.isLineSegments) continue;
      const pos = ln.geometry.attributes.position, mw = ln.matrixWorld;
      for (let i = 0; i + 1 < pos.count && wallHints.length < 400; i += 2) {
        A.fromBufferAttribute(pos, i).applyMatrix4(mw); B.fromBufferAttribute(pos, i + 1).applyMatrix4(mw);
        if (A.distanceTo(B) < 1) continue;
        const e = { a: A.clone(), b: B.clone(), dir: B.clone().sub(A).normalize() };
        if (!lineFits(e, f)) continue;
        edgeHL(e, 0x8fb8e8); wallHints.push(e);
      }
    }
  }
  return wallHints.length;
}
const WHINT = 'до стін: вкажіть площину деталі, потім лінію підлоги або межі приміщення (порядок будь-який)';
function wallClick(w, mouse) {
  if (!w) { if (wall1) { clearWall1(); $('st').textContent = WHINT; } return; }
  if (sameWall(w, wall1)) return;
  if (!wall1 || (wall1.f && w.f)) {                       // первое указание (или другая плоскость вместо первой)
    clearWall1(); wall1 = w; wallHL(w, DIMC); showPending();
    if (w.f) {
      if (!showWallHints(w.f)) { toast('до цієї площини немає паралельної лінії приміщення — вкажіть іншу площину'); clearWall1(); $('st').textContent = WHINT; return; }
      $('st').textContent = 'до стін: вкажіть підсвічену лінію підлоги або межі (порожнє місце — скинути)';
    } else $('st').textContent = 'до стін: вкажіть площину деталі, паралельну лінії (порожнє місце — скинути)';
    return;
  }
  const f = wall1.f || w.f, e = wall1.e || w.e;
  if (!lineFits(e, f)) { toast('площина не паралельна лінії — вкажіть спочатку площину деталі, потім лінію підлоги або межі'); return; }
  // поперёк плоскости до середины линии; размер — от точки, где указана плоскость
  const n = f.n.clone(), mid = e.a.clone().add(e.b).multiplyScalar(0.5), d = mid.sub(f.p).dot(n);
  clearWall1(); $('st').textContent = WHINT;
  if (Math.abs(d) < 0.5) { toast('площина на самій лінії — 0 мм'); return; }
  const a = f.p.clone(), b = a.clone().addScaledVector(n, d), down = b.y - a.y;
  const label = Math.abs(n.y) > 0.9 ? (down < 0 ? 'від підлоги' : 'до стелі') : 'до стіни';
  const dm = addDim(a, b, { label });
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
let easyCollect = null;   // креслення: размеры ячейки не ставятся, а собираются сюда (щелчковая цепочка выбирает нужный)
let easyOpen = [];   // детали, чьи звенья открыли лёгкие размеры: ящик и дверь перед ним держатся вместе (05.10)
function dropEasy() { while (easyDims.length) { const dm = easyDims.pop(); if (dims.includes(dm)) removeDim(dm); } dropPartDims(); }
function easyDim(a, b, label, text) {
  if (a.distanceTo(b) < 1) return;
  // креслення: размер вдоль взгляда (глубина на виде спереди) на листе — точка, не ставим
  if (drawOn && Math.abs(b.clone().sub(a).normalize().dot(cam.getWorldDirection(new THREE.Vector3()))) > 0.9) return;
  if (easyCollect) { easyCollect.push({ a, b, label, text }); return; }   // креслення: только собрать, ставит цепочка
  easyDims.push(addDim(a, b, { label, text }));
}
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
  // креслення: проём целиком, от полки до полки (на ручных листах 050 — так, штанга не в счёт)
  if (easyCollect && y1 != null) easyDim(pt(w0 + 0.15 * W, y0, dF), pt(w0 + 0.15 * W, y1, dF), 'проріз');
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
// закрыть то, что открыли лёгкие размеры (кроме звеньев из keep), и отменить отложенные размеры
function closeEasyOpen(keep) {
  clearTimeout(easyTimer);
  const K = keep instanceof Set ? keep : new Set(keep !== undefined ? [keep] : []), rest = [];
  for (const j of easyOpen) {
    const t = parts[j].chainA[0];
    if (K.has(t)) { rest.push(j); continue; }
    if (openTarget(t)) toggleAt(j, 0);
  }
  easyOpen = rest;
}
// подвижные детали, которые в ЗАКРЫТОМ положении стоят на луче щелчка перед попаданием (дверь перед ящиком):
// по одной детали на звено. Луч — от последнего pick (05.10: щелчок по ящику за дверью закрывал дверь)
function doorsInFront(i, h) {
  const own = parts[i].chainA[0], seen = new Map(), v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  for (const pr of moving) {
    if (pr.kind !== 'p') continue;
    const t0 = pr.chainA[0];
    if (t0 === own || seen.has(t0) || parts[i].chainA.includes(t0)) continue;
    const b = panelBox(pr, poseOf(pr, () => 0)).applyMatrix4(root.matrixWorld);
    if (ray.ray.intersectBox(b, v) && ray.ray.origin.distanceTo(v) < h.distance - 0.5) seen.set(t0, pr.i);
  }
  return [...seen.values()];
}
// открыть деталь i вместе с дверьми перед ней: сначала двери, ящик — когда они отойдут
function openWithFront(i, front) {
  const doors = front.filter(j => !openTarget(parts[j].chainA[0]));
  if (!doors.length) { if (!openTarget(parts[i].chainA[0])) toggleAt(i, 1); else lastOpenDelay = 0; return; }
  let delay = 0;
  for (const j of doors) { toggleAt(j, 1); delay = Math.max(delay, lastOpenDelay); }
  delay += 600;
  const list = [...scopeIds(i)];
  for (const id of list) pendingOpen.add(id);
  setTimeout(() => { for (const id of list) pendingOpen.delete(id); startAnim(list, 1); }, delay);
  lastOpenDelay = delay;
}
let easySeq = 0;
function easyMoving(i, cx, cy, front = []) {
  const top = parts[i].chainA[0], nd = animNode[top];
  // креслення: ничего не открываем — ящик меряется закрытым, на своём месте; двери — спрятать фасады
  if (drawOn) {
    if (!(Math.abs(nd.ang) < 1e-3 && Math.abs(nd.d) > 0)) { toast('у кресленні двері не відкриваються — сховайте фасади'); return; }
    let dd = drawerDims(i);
    if (!dd) { const S = scopeIds(i); for (const pr of moving) if (pr.chainA[0] !== top && S.has(pr.chainA[0]) && pr.kind === 'p') { dd = drawerDims(pr.i); if (dd) break; } }
    if (!dd) { toast('не розібрав шухляду'); return; }
    root.updateMatrixWorld(true);
    for (const [a, b, l, t] of dd.out) easyDim(a.applyMatrix4(dd.g.matrixWorld), b.applyMatrix4(dd.g.matrixWorld), l, t);
    return;
  }
  const keep = new Set([top, ...front.map(j => parts[j].chainA[0])]);      // дверь перед ящиком не закрываем
  // повторное касание открытого ЛЁГКИМИ размерами — закрыть; открытое иначе («відкрити все», касание) — размеры (05.10)
  if (openTarget(top) && easyOpen.some(j => parts[j].chainA[0] === top)) {
    clearTimeout(easyTimer); toggleAt(i, 0); easyOpen = easyOpen.filter(j => parts[j].chainA[0] !== top); return;   // дверь перед ним остаётся
  }
  closeEasyOpen(keep);
  const isDrawer = Math.abs(nd.ang) < 1e-3 && Math.abs(nd.d) > 0;
  let dd = isDrawer ? drawerDims(i) : null;
  // щёлкнули по направляющей (едет вместе с ящиком) — размеры берём у ящика той же системы (29.09, Шкаф 8)
  if (isDrawer && !dd) {
    const S = scopeIds(i);
    for (const pr of moving) if (pr.chainA[0] !== top && S.has(pr.chainA[0]) && pr.kind === 'p') { dd = drawerDims(pr.i); if (dd) break; }
  }
  openWithFront(i, front);
  for (const j of [...front, i]) if (!easyOpen.some(q => parts[q].chainA[0] === parts[j].chainA[0])) easyOpen.push(j);
  const mark = ++easySeq;
  const fire = n => {                                                       // после остановки
    if (easySeq !== mark || !openTarget(top) || !ruler || rmode !== 'easy') return;
    // ещё едет (тяжёлая модель, медленные кадры) — подождать, иначе размеры встанут посреди хода,
    // а щелчок за дверью попадёт в саму дверь (05.10)
    if (n < 15 && (pendingOpen.has(top) || anims.some(a => a.ids.includes(top)))) { easyTimer = setTimeout(() => fire(n + 1), 200); return; }
    root.updateMatrixWorld(true);
    if (dd) { for (const [a, b, l, t] of dd.out) easyDim(a.applyMatrix4(dd.g.matrixWorld), b.applyMatrix4(dd.g.matrixWorld), l, t); return; }
    // дверь (в том числе раздвижная — она тоже едет прямо, но дна и боковин у неё нет): ячейка за ней
    const h = pickSolid(cx, cy); if (!h || !h.face) return;
    const pr = parts[h.object.userData.idx]; if (pr.chainA.length) return;
    easyStatic(h);
  };
  easyTimer = setTimeout(() => fire(0), 980 + lastOpenDelay);
}
function easyStatic(h) {
  const i = h.object.userData.idx, pr = parts[i];
  const n = h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
  const k = mainAxis(n), s = geomBox(i).getSize(new THREE.Vector3());
  if (isTube(i)) { tubeDims(i); return; }
  // кромка: грань смотрит вдоль большого размера детали (не вдоль толщины) — размеры детали
  if (pr.isF || pr.isB || s[k] > Math.min(s.x, s.y, s.z) + 0.01) { if (!easyCollect) showPartDims(i); return; }
  easyCell(h.point, n, i);
}
function easyPick(x, y) {
  if (drawOn) dropPartDims(); else dropEasy();               // в кресленні размеры ячеек копятся — лист собирается из многих
  const h = pickSolid(x, y);                                 // стекло пропускаем: ящик за стеклянной дверью (05.10)
  if (!h || !h.face) { closeEasyOpen(); return; }
  const i = h.object.userData.idx; if (parts[i].isL) { closeEasyOpen(); return; }
  const front = doorsInFront(i, h);
  if (parts[i].chainA.length) { easyMoving(i, x, y, front); return; }
  // щелчок мимо открытого ящика/двери — закрыть его (замечание 29.09), кроме двери, за которой щёлкнули;
  // размеры считаем уже по тому, что щёлкнули
  closeEasyOpen(new Set(front.map(j => parts[j].chainA[0])));
  easyStatic(h);
}

const RHINT = { easy: 'легкі розміри: торкніться полиці, стінки, дверцят або шухляди', face: 'рулетка: торкніться грані деталі', edge: 'рулетка: торкніться ребра деталі', point: 'рулетка: вкажіть першу точку',
  wall: WHINT,
  gab: matchMedia('(pointer: coarse)').matches ? 'габарит: торкніться деталі; ще раз — збірна одиниця, далі — вища'
    : 'габарит: виділіть деталь; Tab — вище, Shift+Tab — нижче, Ctrl — додати деталь, Shift — збірна одиниця (ще раз — вища)' };
function setRMode(m) {
  rmode = m; try { localStorage.setItem('viewerRMode2', m); } catch (e) {}
  rp = []; clearFace1(); faceHoverEnd(); clearEdge1(); edgeHoverEnd(); clearWall1(); wallHoverEnd(); hideHover(); dropEasy();
  $('st').textContent = RHINT[m];
  if (m === 'wall') {                                      // мерить не до чего, если линии помещения спрятаны или их нет
    if (!showL) { showL = true; applyVis(); renderTree(); }
    if (!parts.some(p => p.isL)) toast('у моделі немає ліній приміщення — міряти немає до чого');
  }
  syncTools();
  if (ruler) cv.style.cursor = m === 'gab' ? '' : 'none';
  if (m === 'gab') gabShow();
}
// выбор под пальцем/курсором по текущему способу
function rulerPick(x, y, mouse) {
  if (rmode === 'gab') { const h = pick(x, y); if (h) tapPick(h.object.userData.idx); else clearSel(); return; }   // только телефон
  if (rmode === 'easy') { easyPick(x, y); return; }
  if (rmode === 'face') { faceHoverEnd(); faceClick(faceAt(x, y), mouse); }
  else if (rmode === 'edge') { edgeHoverEnd(); edgeClick(edgeAt(x, y), mouse); }
  else if (rmode === 'wall') { wallHoverEnd(); wallClick(wallAt(x, y), mouse); }
  else { const p = snapAt(x, y); if (!p) toast('точку не поставлено: поруч немає кута деталі'); else addPoint(p, mouse); }
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
  dm.g = g; g.visible = dimsShown && !drawOn; scene.add(g);   // в кресленні размеры рисует лист (по правилам чертежа)
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
  for (const [k, t] of [['x', 'по ширині'], ['y', 'по висоті'], ['z', 'по глибині']]) {
    if (Math.abs(dv[k]) < 0.5) continue;
    const b = document.createElement('button'); b.textContent = t + ' ' + fmt(dv[k]);
    b.onclick = e => { e.stopPropagation(); dm.axis = k; dm.off.set(0, 0, 0); buildDim(dm); updRuler(); closeAxisMenu(); need();
      $('st').textContent = 'розмір ' + t + ' — потягніть число, щоб відсунути'; };
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
  b.style.display = 'none';          // кнопка «размеры» внизу убрана (29.09): прячет/показывает рулетка, стереть — значок справа вверху
  b.classList.toggle('on', dimsShown);
  syncTools();                                             // значок «стереть все размеры»
}
function setDimsShown(on) {
  dimsShown = on;
  for (const dm of dims) dm.g.visible = on && !drawOn;
  updRuler(); syncDimBtn(); need();
}
function addDim(a, b, opt) {
  const dm = Object.assign({ a, b, axis: axisOf(a, b), off: new THREE.Vector3(), el: document.createElement('div') }, opt || {});
  dm.el.className = 'dim';
  if (drawOn && !dm.vdir) dm.vdir = viewDir();             // в кресленні размер принадлежит виду, на котором поставлен
  if (drawOn && dm.fs === undefined) dm.fs = hideFac;      // …и листу с фасадами / без фасадов
  if (drawOn && dm.mk === undefined && metalCur !== null) dm.mk = metalCur;   // …и листу металла, на котором поставлен рукой
  document.body.appendChild(dm.el);
  dims.push(dm); if (!dimsShown) setDimsShown(true); buildDim(dm); hookDim(dm); updRuler(); syncDimBtn(); need();
  const dv = b.clone().sub(a);
  $('st').textContent = dm.axis ? 'розмір ' + fmt(a.distanceTo(b)) + ' мм — потягніть число, щоб відсунути'
    : 'по прямій ' + fmt(a.distanceTo(b)) + ' мм  (ширина ' + fmt(dv.x) + ', висота ' + fmt(dv.y) + ', глибина ' + fmt(dv.z) + ')';
  return dm;
}
function removeDim(dm) { if (dm === selDim) selDim = null; scene.remove(dm.g); dm.el.remove(); dims.splice(dims.indexOf(dm), 1); syncDimBtn(); need(); }
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
  if (drawOn) { for (const dm of dims) dm.el.style.display = 'none'; drawOverlay(); return; }   // в кресленні — числа на листе
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
  if (!rp.length) { rp = [p]; $('st').textContent = 'рулетка: вкажіть другу точку'; showPending(); return; }
  const a = rp[0]; rp = []; showPending();
  if (a.distanceTo(p) < 0.5) { toast('розмір не поставлено: друга точка потрапила в той самий кут, що й перша'); return; }
  const dm = addDim(a, p);
  if (mouse && dm.axis) placing = { dm, base: a.clone().add(p).multiplyScalar(0.5) };
}
// первая точка и резиновая линия до курсора (на компьютере)
let pend = null;
function cancelPoint() { rp = []; clearFace1(); clearEdge1(); clearWall1(); $('st').textContent = RHINT[rmode]; }
function showPending(hover) {
  $('bUndo').style.display = ruler && (rp.length || face1 || edge1 || wall1) ? '' : 'none';
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
  ruler = false; rp = []; placing = null; dropEasy(); clearFace1(); faceHoverEnd(); clearEdge1(); edgeHoverEnd(); clearWall1(); wallHoverEnd(); showPending(); hideHover(); syncTools();
  cv.style.cursor = '';
  setOn('bRuler', false); $('st').textContent = ''; need();
  // рулетку погасили — размеры спрятаны до следующего включения (29.09); в кресленні размеры — часть листа, остаются
  if (dims.length && !drawOn) setDimsShown(false);
}
// компьютер: крестик всегда на месте курсора; у угла детали прыгает на угол ещё до щелчка.
// После второго щелчка размер «висит на мыши»: ведёшь — лапки отъезжают, третий щелчок фиксирует.
let placing = null;
function hover(cx, cy) {
  if (rmode === 'gab' && !placing) { hideHover(); cv.style.cursor = ''; return; }   // габарит — обычный курсор, щелчок выделяет
  const mk = $('snapmk');
  mk.style.display = 'block';
  if (placing) {
    const s = placing.base.clone().project(cam);
    const bx = (s.x + 1) / 2 * innerWidth, by = (1 - s.y) / 2 * innerHeight;
    mk.classList.remove('snapped'); mk.style.left = cx + 'px'; mk.style.top = cy + 'px';
    dragDim(placing.dm, cx, cy, cx - bx, cy - by);
    $('st').textContent = 'розмір ' + fmt(placing.dm.a.distanceTo(placing.dm.b)) + ' мм — відведіть мишу, клацання фіксує (Esc — без відступу)';
    return;
  }
  if (rmode !== 'point') {                                 // грани/рёбра: крестик на курсоре, под ним подсветка
    mk.classList.remove('snapped'); mk.style.left = cx + 'px'; mk.style.top = cy + 'px';
    if (rmode === 'face') faceHover(cx, cy); else if (rmode === 'edge') edgeHover(cx, cy); else if (rmode === 'wall') wallHover(cx, cy);
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
  else if (!rp.length) $('st').textContent = 'рулетка: вкажіть першу точку';
}
function finishPlacing() { placing = null; $('st').textContent = RHINT[rmode]; }
function hideHover() { const mk = $('snapmk'); if (mk) mk.style.display = 'none'; }

// ---------------- мышь ----------------
const ray = new THREE.Raycaster();
function pick(cx, cy) {
  ray.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), cam);
  const hs = ray.intersectObjects(picks, false);
  for (const h of hs) { if (cutAway(h.point)) continue; let o = h.object, vis = true; while (o) { if (!o.visible) { vis = false; break; } o = o.parent; } if (vis) return h; }
  return null;
}
// то же, но сквозь стекло (лёгкие размеры: ящик и полки за стеклянной дверью)
function pickSolid(cx, cy) {
  ray.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), cam);
  const hs = ray.intersectObjects(picks, false);
  for (const h of hs) { if (isGlassMesh(h.object) || cutAway(h.point)) continue; let o = h.object, vis = true; while (o) { if (!o.visible) { vis = false; break; } o = o.parent; } if (vis) return h; }
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
  // на телефоне снизу не заглянуть (чтобы пальцем случайно не перевернуть модель); пока включено «до стін» — можно,
  // иначе низ полки не указать (Алексей 28.10). Выключил, глядя снизу, — подняться можно, ниже нельзя, без рывка.
  // считается только при включённой рулетке: «до стін» запоминается и при выключенных размерах (бой 28.10)
  const lo = !TOUCH || (ruler && rmode === 'wall') ? -Math.PI / 2 : Math.min(0, view.pitch);
  view.pitch = Math.max(lo, Math.min(Math.PI / 2, view.pitch + dy * 0.006));
}
function panBy(dx, dy) {
  const k = viewHeight() / innerHeight;
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  view.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
}
function zoomAt(k, cx, cy) {
  const nd = Math.max(50, Math.min(rad * 5, view.dist * k));   // ближе 50 мм не подойти (одинаково для любого изделия), дальше 5 габаритов не улететь
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
      : rmode === 'edge' ? { x, y, kind: 'edge', e: edgeHover(x, y) }
      : rmode === 'wall' ? { x, y, kind: 'wall', w: wallHover(x, y) } : { x, y, p: snapAt(x, y) };
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
function barTop() { return (drawOn ? $('dstat') : $('bar')).getBoundingClientRect().top; }   // креслення: строка-подсказка внизу
function ribBottom() { return drawOn ? $('drib').getBoundingClientRect().bottom : 0; }
function isLand() { return innerWidth > innerHeight; }
// отпустили палец: точка ставится; не поставилась — сказать почему (замечание 27.09: «ставятся не всегда»)
function aimEnd(place, cancelled) {
  loupe.style.display = 'none';
  const a = aim; aim = null; faceHoverEnd(); edgeHoverEnd(); wallHoverEnd();
  if (cancelled) toast('не поставлено: телефон перервав дотик — спробуйте ще раз, трохи далі від краю екрана');
  else if (place && a && a.kind === 'face') faceClick(a.f);
  else if (place && a && a.kind === 'wall') wallClick(a.w);
  else if (place && a && a.kind === 'edge') edgeClick(a.e);
  else if (place && a && !a.p) toast('точку не поставлено: поруч із пальцем немає кута деталі');
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
      if (rmode === 'easy' || rmode === 'gab') return;     // лёгким размерам и габариту лупа не нужна — касание и есть выбор
      pressTimer = setTimeout(() => {
        if (!tState || tState.moved || touches.size !== 1) return;
        tState = { aim: true }; aimAt(e.clientX, e.clientY);
      }, 350);
      return;
    }
    pressTimer = setTimeout(() => {                        // долгое нажатие — выделить (повторное — шкаф)
      if (!tState || tState.moved || touches.size !== 1) return;
      tState.long = true;
      const h = pick(tState.x0, tState.y0);
      if (h) tapPick(h.object.userData.idx); else clearSel();
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
  if (h) { if (!toggleAt(h.object.userData.idx)) tapPick(h.object.userData.idx); }
  else clearSel();
}

cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') { touchDown(e); return; }
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  drag = { b: e.button, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
  // креслення, щелчковая цепочка: нажали на модуль/фасад/проём — это размер, а не сдвиг листа
  if (drawOn && e.button === 0 && PRESS.has(drawTool)) { const t = pressTarget(e.clientX, e.clientY); if (t) drag.press = { t, ax: null, line: 0 }; }
  if (e.button === 1) {
    e.preventDefault();
    const h = pick(e.clientX, e.clientY);
    if (h && !toggleAt(h.object.userData.idx)) $('st').textContent = 'ця деталь нерухома';
  }
});
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hideHover(); faceHoverEnd(); edgeHoverEnd(); wallHoverEnd(); } });
cv.addEventListener('pointercancel', e => { if (e.pointerType === 'touch') touchUp(e); });
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') { touchMove(e); return; }
  if (!drag) {
    // курсор показывает, что сделает щелчок: креслення — прицел инструмента / палец над деталью; рулетка — свой крестик;
    // обычный просмотр — палец над деталью (Алексей 04.10). Поиск — не чаще одного раза за кадр.
    if (e.pointerType === 'mouse') {
      const first = !hoverAt; hoverAt = [e.clientX, e.clientY];
      if (first) requestAnimationFrame(() => {
        const [x, y] = hoverAt; hoverAt = null;
        if (drawOn) drawHover(x, y); else if (ruler) hover(x, y); else cv.style.cursor = pick(x, y) ? 'pointer' : '';
      });
    }
    return;
  }
  if (drag.press) { pressMove(drag, e.clientX, e.clientY); return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (drag.b === 0 && drawOn && drawLines) { panBy(dx, dy); place(); cv.style.cursor = 'grabbing'; }   // креслення: лист двигается, не вращается
  else if (drag.b === 0) {
    view.yaw -= dx * 0.006;
    view.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.pitch + dy * 0.006));
    place();
  } else if (drag.b === 2) {
    const k = viewHeight() / innerHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    view.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    place();
    if (drawOn) cv.style.cursor = 'grabbing';
  }
});
cv.addEventListener('pointerup', e => {
  if (e.pointerType === 'touch') { touchUp(e); return; }
  const d = drag; drag = null;
  if (drawOn) cv.style.cursor = snapTool() ? 'none' : 'default';
  if (d && d.press && drawOn) { pressUp(d); return; }
  if (!d || Math.abs(e.clientX - d.x0) > 4 || Math.abs(e.clientY - d.y0) > 4) return;
  // креслення с инструментом: левая — точка, правая — закончить цепочку (габаритный и «без инструмента» — выделение, как обычно)
  if (drawOn && snapTool()) { if (d.b === 2) endTool(); else if (d.b === 0) toolClick(e.clientX, e.clientY); return; }
  if (drawOn && d.b === 0 && (selDim || selSec)) { selDim = selSec = null; drawOverlay(); }
  if (drawOn && PRESS.has(drawTool)) return;                // щелчок мимо модуля/проёма — ничего не выделяем
  if (d.b === 2) { if (ruler && (rp.length || face1 || edge1 || wall1)) cancelPoint(); return; }   // правая кнопка без сдвига — убрать первую точку
  if (d.b !== 0) return;
  if (ruler && rmode !== 'gab') {                           // «габарит» — щелчок выделяет, как без рулетки (с Ctrl)
    if (placing) { finishPlacing(); return; }
    rulerPick(e.clientX, e.clientY, true); return;
  }
  const h = pick(e.clientX, e.clientY);
  if (h) {
    const i = h.object.userData.idx;
    if (e.shiftKey) shiftPick(i);
    else if (e.ctrlKey || e.metaKey) toggleOne(i);
    else selectPart(i, e.altKey ? upLevel(i, -1) : -1);
  }
  else if (!(e.ctrlKey || e.metaKey || e.shiftKey)) clearSel();
});
cv.addEventListener('wheel', e => {
  e.preventDefault();
  let k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
  if (k < 1 && view.persp) {                               // приближение — к детали под курсором, а не к середине модели
    const h = pick(e.clientX, e.clientY);
    if (h && !parts[h.object.userData.idx].isL) {
      const fwd = cam.getWorldDirection(new THREE.Vector3());
      const d = h.point.clone().sub(cam.position).dot(fwd);   // глубина детали по направлению взгляда
      if (d > 0) { view.target.copy(cam.position).addScaledVector(fwd, d); view.dist = d; }
    }
    k = Math.min(1, Math.max(50, view.dist * k) / view.dist);   // ближе 50 мм к детали не подойти
  }
  const p = onTargetPlane(e.clientX, e.clientY);          // масштаб к курсору
  if (p) view.target.lerp(p, 1 - k);
  view.dist *= k; place();
}, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (drawOn) {                                             // креслення: отмена/возврат, удалить размер, Enter, Esc
    const ctl = e.ctrlKey || e.metaKey;
    if (ctl && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) drawRedo(); else drawUndo(); return; }
    if (ctl && e.code === 'KeyY') { e.preventDefault(); drawRedo(); return; }
    if (e.key === 'Delete' && selDim) { pushUndo(); removeDim(selDim); drawOverlay(); return; }
    if (e.key === 'Delete' && selSec) { secAct('del', selSec); return; }
    if (e.key === 'Delete' && metalSelV && metalCur !== null) { const un = metalData().all.find(x => x.u === metalCur); if (un) metalDelView(un, metalSelV); return; }
    if (e.key === 'Enter') { if (drawTool === 'gab') gabCommit(); else if (drawTool) endTool(); return; }
    if (e.key === 'Escape') {
      if (tpts.length || tAxis !== null || (sd && sd.a) || (sd && sd.sec) || (cd && cd.a)) { endTool(); if (drawTool === 'sect' || drawTool === 'clip') $('st').textContent = L('h_' + drawTool); return; }
      if (drawTool) { setTool(null); return; }
      if (selDim || selSec || metalSelV) { selDim = selSec = metalSelV = null; drawOverlay(); return; }
    }
  }
  if (e.key === 'Tab') {
    e.preventDefault(); if (selIdx < 0) return;
    selectPart(selIdx, e.shiftKey ? downLevel(selIdx, selLevel) : upLevel(selIdx, selLevel));
  }
  if (e.key === 'Delete') hideSel();
  if (e.key === 'Escape') {
    if (placing) { placing.dm.off.set(0, 0, 0); buildDim(placing.dm); updRuler(); finishPlacing(); need(); return; }
    if (ruler && (rp.length || face1 || edge1 || wall1)) { cancelPoint(); return; }
    stopRuler(); clearSel();
  }
});
addEventListener('resize', () => { rend.setSize(innerWidth, innerHeight); layout(); });

// ---------------- кнопки ----------------
function mode(m) {
  if (drawOn) return;                                       // в кресленні материалы свои, показ не переключается
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
  for (const l of hidEdges) l.visible = m === 3 && !l.userData.mark;
  for (const p of parts) if (p.dHid) for (const l of p.dHid) l.visible = m === 3;
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
  tab.style.top = Math.round((ribBottom() + barTop()) / 2 - tab.offsetHeight / 2) + 'px';   // середина места над значками
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
  { const DS = new Set(M.door || []); parts.forEach(p => { p.isDoor = p.h.some(id => DS.has(id)); });
    const b = $('bFac'); b.style.display = DS.size ? '' : 'none';
    b.onclick = () => { pushUndo(); hideFac = !hideFac; setOn('bFac', hideFac); if (!drawOn) dropEasy(); applyVis(); }; }
  $('bUndo').onclick = cancelPoint;
  // подсказка по жестам — при первом открытии на телефоне
  const hint = $('hint');
  let seen = false; try { seen = localStorage.getItem('viewerHint') === '1'; } catch (e) {}
  if (TOUCH && !seen) hint.classList.add('show');
  hint.onclick = () => { hint.classList.remove('show'); try { localStorage.setItem('viewerHint', '1'); } catch (e) {} };
  $('q').oninput = renderTree;
  $('tOnly').onclick = isolateSel; $('tHide').onclick = hideSel; $('tAll').onclick = showAll;
  $('tFit').onclick = () => { if (selSet.length) fitBox(visibleBox(true)); };
  // Рулетка — только вкл/выкл (29.09): выключил — размеры спрятаны, включил — вернулись; габарит — её способ справа вверху
  $('bRuler').onclick = () => {
    if (ruler) { stopRuler(); return; }
    ruler = true; rp = []; setOn('bRuler', true); cv.style.cursor = 'none'; $('st').textContent = RHINT[rmode]; syncTools();
    if (dims.length) setDimsShown(true);
    if (rmode === 'gab') gabShow();
  };
  { let t = null, long = false; const b = $('bDims');
    b.addEventListener('pointerdown', () => { long = false; t = setTimeout(() => { long = true; clearDims(); }, 650); });
    b.addEventListener('pointerup', () => { clearTimeout(t); if (!long) setDimsShown(!dimsShown); });
    b.addEventListener('pointerleave', () => clearTimeout(t));
    b.addEventListener('contextmenu', e => { e.preventDefault(); clearTimeout(t); clearDims(); }); }
  $('bShowAll').onclick = showAll;
  wireHintFade(); wireFind(); wirePd(); wireFull();
  if (DRAW_OK) { $('bDraw').style.display = ''; $('bDraw').onclick = () => setDraw(!drawOn); wireOverlay(); wireDraw(); }
}

// ---------------- на весь экран (30.10) ----------------
// Телефон лёжа: строка адреса и вкладки браузера съедают полэкрана (скрин Алексея). Android-браузер умеет их убрать —
// кнопка в строке значков; айфон (Safari) не умеет — кнопки нет, в «Як дивитися» строка про «на экран Додому».
function wireFull() {
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!TOUCH || !req || standalone) return;
  const b = document.createElement('button'); b.id = 'bFull'; b.className = 'ic';
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const sync = () => { const on = !!fsEl(); b.innerHTML = on ? ICON.unfull : ICON.full; b.title = on ? 'вийти з повного екрана' : 'на весь екран'; };
  const fail = () => toast('браузер не дав відкрити на весь екран');
  b.onclick = () => {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    try { const r = req.call(el); if (r && r.catch) r.catch(fail); } catch (e) { fail(); }
  };
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
  sync(); $('bar').insertBefore(b, $('st'));
}

// ---------------- поиск детали по номеру (монтажники 30.10) ----------------
// Номер с этикетки — «Обозначение» Базиса («1-7», «2.1-15», «1.1.1-8»); монтажник знает последнее число. Набрал — через
// 0,7 с (или Enter) одно совпадение: деталь выделена, камера подлетает, в карточке как всегда «сховати / тільки це».
// Несколько (номера повторяются по модулям, разные изделия) — список, касание — выбор. Полное обозначение тоже находит.
const numTail = d => { const m = /(\d+)\s*$/.exec(d); return m ? m[1] : ''; };
function findByNum(s) {
  const k = s.replace(/\s+/g, '').toLowerCase(), full = /\D/.test(k), out = [];
  parts.forEach((p, i) => {
    if (!p.d) return;
    const d = p.d.replace(/\s+/g, '').toLowerCase();
    if (d === k || (!full && numTail(d) === k)) out.push(i);
  });
  return out;
}
function placeFind() {
  const b = $('nfind'), s = safe();
  b.style.top = (6 + s.t) + 'px'; b.style.left = (10 + s.l) + 'px';
  if (TOUCH) b.style.right = (16 + s.r + $('vcube').offsetWidth) + 'px';
}
function goPart(i) {
  const p = parts[i];
  if (hideFac && p.isDoor) { hideFac = false; setOn('bFac', false); applyVis(); }
  if (!effVisible(p)) showAll();
  selectPart(i, -1);
  // подлететь, но оставить вокруг детали обстановку — видно, где она лежит и как стоит
  const b = new THREE.Box3().expandByObject(p.g), sz = b.getSize(V3());
  b.expandByScalar(Math.max(250, Math.max(sz.x, sz.y, sz.z) * 0.35));
  fitBox(b);
}
function wireFind() {
  const box = $('nfind'), q = $('nq'), res = $('nres'), x = $('nx'); let t = null;
  x.innerHTML = ICON.x; x.title = 'закрити пошук';
  const close = () => { clearTimeout(t); box.classList.remove('show'); q.blur(); setOn('bFind', false); };
  $('bFind').onclick = e => {
    e.stopPropagation();
    if (box.classList.contains('show')) { close(); return; }
    closePop(); placeFind(); box.classList.add('show'); setOn('bFind', true);
    q.value = ''; res.replaceChildren(); q.focus();
  };
  x.onclick = close;
  const msg = text => { const m = document.createElement('div'); m.className = 'nmsg'; m.textContent = text; res.appendChild(m); };
  const run = () => {
    const s = q.value.trim(); res.replaceChildren();
    if (!s) return;
    if (!parts.some(p => p.d)) { msg('у цій вигрузці немає номерів деталей — потрібна нова вигрузка з Базиса'); return; }
    const hit = findByNum(s);
    if (!hit.length) { msg('деталі з номером ' + s + ' немає'); return; }
    if (hit.length === 1) { goPart(hit[0]); close(); return; }
    for (const i of hit.slice(0, 40)) {
      const p = parts[i], r = document.createElement('div'); r.className = 'nrow';
      const top = p.v.length ? M.names[p.v[Math.max(0, p.v.length - 2)]] : '';   // изделие под общим «Модель»
      r.innerHTML = '<b></b><span></span>'; r.children[0].textContent = '№ ' + p.d; r.children[1].textContent = (p.n || '(без назви)') + (top ? ' · ' + top : '');
      r.onclick = e => { e.stopPropagation(); goPart(i); close(); };
      res.appendChild(r);
    }
    if (hit.length > 40) msg('ще ' + (hit.length - 40) + ' — уточніть номер');
  };
  q.addEventListener('input', () => { clearTimeout(t); res.replaceChildren(); t = setTimeout(run, 700); });
  q.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { clearTimeout(t); run(); } else if (e.key === 'Escape') close(); });
}

// ---------------- чертёж детали во весь экран (монтажники 30.10, ТЗ 4.3) ----------------
// Карточка панели → «креслення»: деталь плашмя, сторона — та, что сейчас к смотрящему (кнопка — перевернуть). Контур и
// рёбра пласти (за деталью — пунктиром), отверстия кружками с ⌀ (отверстия крепежа из выгрузки — даже если в детали их
// не прорезали; в торец — пунктирным каналом), круглые вырезы контура; вторым слоем — фурнитура, что стоит на детали
// (рамкой; крестик — её точка установки). Автоматических размеров нет (с какой базы мерить — знает тот, кто меряет):
// два касания — размер. Точки прилипают: углы, центры отверстий, точки установки фурнитуры, края детали и пазов.
// Край + точка — размер поперёк края; две точки — по ширине и по высоте. Всё в осях проекта при закрытых дверях.
const PD = { on: false, i: -1, side: 1, segs: [], circs: [], slots: [], hw: [], pts: [], lines: [], dims: [], first: null, sc: 1, ox: 0, oy: 0, bb: null };
const pdC = () => $('pdc');
function pdFrame(i) {
  const p = parts[i], od = M.objs[i], pos = [];
  for (const m of p.meshes) { if (m.userData.mark) continue; const a = m.geometry.attributes.position.array; for (let k = 0; k < a.length; k++) pos.push(a[k]); }
  let n = null;
  if (od.ax) n = new THREE.Vector3(od.ax[9], od.ax[10], od.ax[11]).normalize();
  else {                                                    // нормаль пласти: направление граней с наибольшей площадью
    const acc = new Map();
    for (let t = 0; t + 8 < pos.length; t += 9) {
      const a = new THREE.Vector3(pos[t], pos[t + 1], pos[t + 2]), b = new THREE.Vector3(pos[t + 3], pos[t + 4], pos[t + 5]), c = new THREE.Vector3(pos[t + 6], pos[t + 7], pos[t + 8]);
      const nn = b.sub(a).cross(c.sub(a)), ar = nn.length(); if (ar < 1e-6) continue;
      nn.divideScalar(ar);
      const big = Math.abs(nn.x) >= Math.abs(nn.y) && Math.abs(nn.x) >= Math.abs(nn.z) ? nn.x : Math.abs(nn.y) >= Math.abs(nn.z) ? nn.y : nn.z;
      if (big < 0) nn.negate();
      const key = [nn.x, nn.y, nn.z].map(v => Math.round(v * 50)).join(',');
      const r = acc.get(key); if (r) { r.a += ar; r.v.addScaledVector(nn, ar); } else acc.set(key, { a: ar, v: nn.clone().multiplyScalar(ar) });
    }
    let best = null; for (const r of acc.values()) if (!best || r.a > best.a) best = r;
    n = best ? best.v.normalize() : new THREE.Vector3(0, 0, 1);
  }
  const c = new THREE.Vector3(); for (let k = 0; k < pos.length; k += 3) c.x += pos[k], c.y += pos[k + 1], c.z += pos[k + 2];
  c.divideScalar(Math.max(1, pos.length / 3));
  return { n, c, pos };
}
function pdBuild() {
  const i = PD.i, p = parts[i], od = M.objs[i], { n, c, pos } = pdFrame(i);
  const s = n.clone().multiplyScalar(PD.side);
  const v = Math.abs(s.y) < 0.7 ? new THREE.Vector3(0, 1, 0).addScaledVector(s, -s.y).normalize()     // стоит — верх вверху
                                : new THREE.Vector3(0, 0, -1).addScaledVector(s, s.z).normalize();    // лежит — зад вверху, перёд внизу
  const u = v.clone().cross(s);
  const P = (x, y, z) => { const dx = x - c.x, dy = y - c.y, dz = z - c.z; return [dx * u.x + dy * u.y + dz * u.z, dx * v.x + dy * v.y + dz * v.z, dx * s.x + dy * s.y + dz * s.z]; };
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, d0 = 1e9, d1 = -1e9;
  for (let k = 0; k < pos.length; k += 3) { const q = P(pos[k], pos[k + 1], pos[k + 2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); d0 = Math.min(d0, q[2]); d1 = Math.max(d1, q[2]); }
  const T = Math.max(0.1, d1 - d0), inBox = (x, y, e) => x >= x0 - e && x <= x1 + e && y >= y0 - e && y <= y1 + e;
  PD.bb = { x0, x1, y0, y1, T, W: x1 - x0, H: y1 - y0 }; PD.P = P;
  // заливка — треугольники пласти (не габарит: вырезы и выемки остаются пустыми)
  PD.fill = [];
  for (let k = 0; k + 8 < pos.length; k += 9) {
    const A = P(pos[k], pos[k + 1], pos[k + 2]), B = P(pos[k + 3], pos[k + 4], pos[k + 5]), C = P(pos[k + 6], pos[k + 7], pos[k + 8]);
    if (Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])) < 0.01) continue;   // торец — ребром
    if (Math.min(A[2], B[2], C[2]) < (d0 + d1) / 2) continue;   // только ближняя пласть: у неё обход один, заливка без дыр
    PD.fill.push(A[0], A[1], B[0], B[1], C[0], C[1]);
  }
  // рёбра: ближняя половина толщины — сплошные, дальняя — пунктир (не дублируя сплошные); значки крепежа — тонко серым
  const seg = new Map();
  p.edges.forEach((ln, k) => {
    const a = ln.geometry.attributes.position.array, mk = !!ln.userData.mark;
    for (let t = 0; t + 5 < a.length; t += 6) {
      const A = P(a[t], a[t + 1], a[t + 2]), B = P(a[t + 3], a[t + 4], a[t + 5]);
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 0.05) continue;
      const vis = (Math.min(A[2], B[2]) - d0) / T > 0.5, kind = mk ? 'mk' : vis ? 'v' : 'h';
      const r1 = v => Math.round(v * 10), k1 = r1(A[0]) + ',' + r1(A[1]), k2 = r1(B[0]) + ',' + r1(B[1]), key = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
      const old = seg.get(key);
      if (!old || (old.k === 'h' && kind === 'v') || (old.k === 'mk' && kind !== 'mk')) seg.set(key, { a: [A[0], A[1]], b: [B[0], B[1]], k: kind });
    }
  });
  PD.segs = [...seg.values()];
  // отверстия крепежа выгрузки (с телом и без): поперёк пласти — кружок, вдоль (в торец) — канал. Только те, что на самой
  // детали: в выемках и вырезах (габарит, а материала нет) — крепёж соседей, мимо
  PD.circs = []; PD.slots = [];
  const ck = new Set(), addC = (x, y, r, solid, name, thr) => {
    if (pdGap(x, y) > r + 1) return;
    const key = Math.round(x * 10) + ',' + Math.round(y * 10) + ',' + Math.round(r * 20);
    if (ck.has(key)) return; ck.add(key); PD.circs.push({ x, y, r, solid, name, thr });
  };
  for (const h of M.holes || []) {
    const A = P(h[0], h[1], h[2]), E = P(h[3], h[4], h[5]), L = Math.hypot(E[0] - A[0], E[1] - A[1], E[2] - A[2]);
    if (L < 0.01 || !(h[6] > 0)) continue;
    const along = Math.abs(E[2] - A[2]) / L, name = (M.hnames || [])[h[8]] || '';
    if (along > 0.9) {
      const lo = Math.min(A[2], E[2]), hi = Math.max(A[2], E[2]);
      if (hi < d0 + 0.2 || lo > d1 - 0.2 || !inBox(A[0], A[1], 0.5)) continue;
      const thr = lo <= d0 + 0.3 && hi >= d1 - 0.3, near = hi >= d1 - 0.3;
      addC((A[0] + E[0]) / 2, (A[1] + E[1]) / 2, h[6] / 2, thr || near, name, thr);
    } else if (along < 0.2) {
      if (Math.min(A[2], E[2]) < d0 - 0.5 || Math.max(A[2], E[2]) > d1 + 0.5) continue;
      if (!inBox(A[0], A[1], 1) || !inBox(E[0], E[1], 1) || pdGap((A[0] + E[0]) / 2, (A[1] + E[1]) / 2) > 1) continue;
      const kk = Math.round(A[0]) + ',' + Math.round(A[1]) + ',' + Math.round(E[0]) + ',' + Math.round(E[1]);
      if (ck.has(kk)) continue; ck.add(kk);
      PD.slots.push({ a: [A[0], A[1]], b: [E[0], E[1]], w: h[6], name });
    }
  }
  // круглые вырезы контура панели (hc, в осях панели) — центр для прилипания
  if (od.hc && od.ax) {
    const ax = od.ax;
    for (const [hx, hy, hr] of od.hc) {
      const q = P(ax[0] + hx * ax[3] + hy * ax[6], ax[1] + hx * ax[4] + hy * ax[7], ax[2] + hx * ax[5] + hy * ax[8]);
      addC(q[0], q[1], hr, true, 'виріз', true);
    }
  }
  // фурнитура на детали: касается пласти (±1 мм по толщине) и заходит на деталь; накрывающая больше половины (техника) — мимо
  PD.hw = [];
  const area = PD.bb.W * PD.bb.H;
  parts.forEach((q, j) => {
    if (j === i || !q.isF || q.isL) return;
    const bx = pdHwBox(j); if (!bx) return;
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, e0 = 1e9, e1 = -1e9;
    for (const X of [bx.min.x, bx.max.x]) for (const Y of [bx.min.y, bx.max.y]) for (const Z of [bx.min.z, bx.max.z]) {
      const w = P(X, Y, Z); a0 = Math.min(a0, w[0]); a1 = Math.max(a1, w[0]); b0 = Math.min(b0, w[1]); b1 = Math.max(b1, w[1]); e0 = Math.min(e0, w[2]); e1 = Math.max(e1, w[2]);
    }
    if (e1 < d0 - 1 || e0 > d1 + 1) return;
    const ou = Math.min(a1, x1) - Math.max(a0, x0), ov = Math.min(b1, y1) - Math.max(b0, y0);
    if (ou <= 0.5 || ov <= 0.5 || ou * ov > area * 0.5) return;
    const t = M.objs[j].t, ip = t ? P(t[3], t[7], t[11]) : null;
    if (pdGap((a0 + a1) / 2, (b0 + b1) / 2) > 2 && (!ip || pdGap(ip[0], ip[1]) > 2)) return;
    PD.hw.push({ x0: a0, x1: a1, y0: b0, y1: b1, back: (e0 + e1) / 2 < (d0 + d1) / 2, ip: ip && ip[0] >= a0 - 1 && ip[0] <= a1 + 1 && ip[1] >= b0 - 1 && ip[1] <= b1 + 1 ? [ip[0], ip[1]] : [(a0 + a1) / 2, (b0 + b1) / 2], exact: !!ip, name: q.n || '' });
  });
  // цели прилипания: точки (углы, центры, точки установки) и линии (рёбра, оси каналов)
  const pk = new Set(); PD.pts = []; PD.lines = [];
  const addP = (x, y, what, pri) => { const key = Math.round(x * 10) + ',' + Math.round(y * 10); if (pk.has(key)) return; pk.add(key); PD.pts.push({ x, y, what, pri }); };
  for (const c2 of PD.circs) addP(c2.x, c2.y, 'отвір ⌀' + fmtN(c2.r * 2) + (c2.thr ? ' наскрізь' : '') + (c2.name ? ' · ' + c2.name : ''), 0);
  for (const h of PD.hw) addP(h.ip[0], h.ip[1], (h.exact ? 'точка встановлення · ' : 'середина · ') + h.name, 0);
  for (const sl of PD.slots) { addP(sl.a[0], sl.a[1], 'отвір у торець ⌀' + fmtN(sl.w) + (sl.name ? ' · ' + sl.name : ''), 0); PD.lines.push({ a: sl.a, b: sl.b, what: 'вісь отвору ⌀' + fmtN(sl.w) }); }
  for (const sg of PD.segs) if (sg.k !== 'mk') { addP(sg.a[0], sg.a[1], 'кут', 1); addP(sg.b[0], sg.b[1], 'кут', 1); PD.lines.push({ a: sg.a, b: sg.b, what: sg.k === 'v' ? 'край' : 'край (з того боку)' }); }
}
// расстояние от точки до материала детали на виде (0 — на пласти), по треугольникам ближней пласти
function pdGap(x, y) {
  const f = PD.fill; let best = 1e9;
  for (let k = 0; k + 5 < f.length; k += 6) {
    const ax = f[k], ay = f[k + 1], bx = f[k + 2], by = f[k + 3], cx = f[k + 4], cy = f[k + 5];
    const s1 = (bx - ax) * (y - ay) - (by - ay) * (x - ax), s2 = (cx - bx) * (y - by) - (cy - by) * (x - bx), s3 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
    if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return 0;
    for (const [px, py, qx, qy] of [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]]) {
      const dx = qx - px, dy = qy - py, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - px) * dx + (y - py) * dy) / L2));
      best = Math.min(best, Math.hypot(px + t * dx - x, py + t * dy - y));
    }
  }
  return best;
}
// габарит фурнитуры в осях проекта при закрытых дверях (как отверстия выгрузки): форма × её расстановка
const pdHwMemo = new Map();
function pdHwBox(j) {
  if (pdHwMemo.has(j)) return pdHwMemo.get(j);
  const q = parts[j], b = new THREE.Box3();
  for (const m of q.meshes) {
    const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox.clone(); if (m.parent && m.parent !== q.g) bb.applyMatrix4(m.parent.matrix);   // расстановка формы (задана вручную)
    b.union(bb);
  }
  const r = b.isEmpty() ? null : b; pdHwMemo.set(j, r); return r;
}
function pdOpen(i) {
  PD.on = true; PD.i = i; PD.dims = []; PD.first = null;
  const { n, c } = pdFrame(i);
  // сторона — та, что сейчас к смотрящему
  root.updateMatrixWorld(true);
  const eye = cam.position.clone().sub(root.position);
  PD.side = n.dot(eye.sub(c)) >= 0 ? 1 : -1;
  pdBuild();
  const w = $('pdw'), p = parts[i], bb = PD.bb;
  w.classList.add('show');
  w.querySelector('.pdn b').textContent = (p.n || '(без назви)') + (p.d ? ' · № ' + p.d : '');
  w.querySelector('.pdn small').textContent = fmtN(bb.W) + ' × ' + fmtN(bb.H) + ' × ' + fmtN(bb.T);
  pdHint();
  try { history.pushState({ pd: 1 }, ''); } catch (e) {}   // «назад» на телефоне закрывает чертёж, а не страницу
  pdResize(); pdFit(); pdDraw();
}
function pdClose(fromHistory) {
  if (!PD.on) return;
  PD.on = false; $('pdw').classList.remove('show');
  if (!fromHistory && history.state && history.state.pd) try { history.back(); } catch (e) {}
}
function pdHint(t) {
  const el = $('pdw').querySelector('.pdt');
  el.textContent = t || (PD.first ? 'друга точка' : 'розмір: торкніться двох точок — край, центр отвору, точка кріплення');
}
function pdResize() {
  const cv2 = pdC(), dpr = Math.min(devicePixelRatio || 1, 2);
  cv2.width = Math.round(innerWidth * dpr); cv2.height = Math.round(innerHeight * dpr);
  cv2.style.width = innerWidth + 'px'; cv2.style.height = innerHeight + 'px';
}
function pdArea() {   // место под чертёж: без шапки и строки подсказки
  const w = $('pdw'), top = w.querySelector('.pdh').getBoundingClientRect().bottom, bot = w.querySelector('.pdt').getBoundingClientRect().top;
  return { x0: 0, x1: innerWidth, y0: top, y1: bot };
}
function pdFit() {
  const a = pdArea(), bb = PD.bb, m = 28;
  PD.sc = Math.min((a.x1 - a.x0 - 2 * m) / Math.max(1, bb.W), (a.y1 - a.y0 - 2 * m) / Math.max(1, bb.H));
  PD.ox = (a.x0 + a.x1) / 2 - (bb.x0 + bb.x1) / 2 * PD.sc;
  PD.oy = (a.y0 + a.y1) / 2 + (bb.y0 + bb.y1) / 2 * PD.sc;
}
const pdS = (x, y) => [PD.ox + x * PD.sc, PD.oy - y * PD.sc];
const pdM = (sx, sy) => [(sx - PD.ox) / PD.sc, (PD.oy - sy) / PD.sc];
function pdDraw(snap) {
  const cv2 = pdC(), g = cv2.getContext('2d'), dpr = cv2.width / innerWidth;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, innerWidth, innerHeight);
  const line = (a, b) => { const A = pdS(a[0], a[1]), B = pdS(b[0], b[1]); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); };
  // деталь — белым по своей форме, рёбра поверх
  { const f = PD.fill; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 0.6; g.lineJoin = 'round'; g.beginPath();
    for (let k = 0; k + 5 < f.length; k += 6) { const A = pdS(f[k], f[k + 1]), B = pdS(f[k + 2], f[k + 3]), C = pdS(f[k + 4], f[k + 5]); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); }
    g.fill(); g.stroke(); }
  // фурнитура — бледной рамкой (за деталью — пунктиром), точка установки — крестиком
  for (const h of PD.hw) {
    const A = pdS(h.x0, h.y1), B = pdS(h.x1, h.y0);
    g.fillStyle = 'rgba(43,108,176,.08)'; g.fillRect(A[0], A[1], B[0] - A[0], B[1] - A[1]);
    g.strokeStyle = 'rgba(43,108,176,.55)'; g.lineWidth = 1; g.setLineDash(h.back ? [4, 3] : []);
    g.strokeRect(A[0], A[1], B[0] - A[0], B[1] - A[1]); g.setLineDash([]);
    const Q = pdS(h.ip[0], h.ip[1]); g.strokeStyle = '#2b6cb0'; g.lineWidth = 1.3; g.beginPath();
    g.moveTo(Q[0] - 5, Q[1]); g.lineTo(Q[0] + 5, Q[1]); g.moveTo(Q[0], Q[1] - 5); g.lineTo(Q[0], Q[1] + 5); g.stroke();
  }
  g.lineCap = 'round';
  g.strokeStyle = '#b8c0c8'; g.lineWidth = 0.8; g.beginPath(); for (const s of PD.segs) if (s.k === 'mk') line(s.a, s.b); g.stroke();
  g.strokeStyle = '#7d8790'; g.lineWidth = 1; g.setLineDash([5, 4]); g.beginPath(); for (const s of PD.segs) if (s.k === 'h') line(s.a, s.b); g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#111'; g.lineWidth = 1.6; g.beginPath(); for (const s of PD.segs) if (s.k === 'v') line(s.a, s.b); g.stroke();
  // отверстия в торец — пунктирным каналом с осью
  for (const sl of PD.slots) {
    const A = pdS(sl.a[0], sl.a[1]), B = pdS(sl.b[0], sl.b[1]), L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
    const nx = -(B[1] - A[1]) / L * sl.w / 2 * PD.sc, ny = (B[0] - A[0]) / L * sl.w / 2 * PD.sc;
    g.strokeStyle = '#16427f'; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath();
    g.moveTo(A[0] + nx, A[1] + ny); g.lineTo(B[0] + nx, B[1] + ny); g.lineTo(B[0] - nx, B[1] - ny); g.lineTo(A[0] - nx, A[1] - ny); g.stroke();
    g.setLineDash([8, 3, 2, 3]); g.lineWidth = 0.7; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); g.setLineDash([]);
  }
  // отверстия поперёк: сплошной кружок — со стороны взгляда / насквозь, пунктир — с той стороны; ⌀ — когда кружок заметен
  g.font = '600 12px system-ui, sans-serif'; g.textBaseline = 'middle';
  for (const c2 of PD.circs) {
    const Q = pdS(c2.x, c2.y), r = Math.max(1.5, c2.r * PD.sc);
    g.strokeStyle = '#16427f'; g.lineWidth = 1.2; g.setLineDash(c2.solid ? [] : [3, 2]);
    g.beginPath(); g.arc(Q[0], Q[1], r, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.lineWidth = 0.6; g.beginPath(); g.moveTo(Q[0] - r - 3, Q[1]); g.lineTo(Q[0] + r + 3, Q[1]); g.moveTo(Q[0], Q[1] - r - 3); g.lineTo(Q[0], Q[1] + r + 3); g.stroke();
    if (r >= 5) { g.fillStyle = '#16427f'; g.fillText('⌀' + fmtN(c2.r * 2), Q[0] + r + 4, Q[1] - r - 2); }
  }
  // размеры
  for (const dm of PD.dims) pdDimDraw(g, dm);
  if (PD.first) { const Q = pdS(PD.first.x, PD.first.y); g.fillStyle = '#e0301e'; g.beginPath(); g.arc(Q[0], Q[1], 5, 0, Math.PI * 2); g.fill(); }
  if (snap) {
    const Q = pdS(snap.x, snap.y); g.strokeStyle = '#e0301e'; g.lineWidth = 2; g.beginPath();
    g.moveTo(Q[0] - 11, Q[1]); g.lineTo(Q[0] + 11, Q[1]); g.moveTo(Q[0], Q[1] - 11); g.lineTo(Q[0], Q[1] + 11); g.stroke();
  }
}
function pdDimDraw(g, dm) {
  const A = pdS(dm.a[0], dm.a[1]), B = pdS(dm.b[0], dm.b[1]), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  if (L < 1) return;
  const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
  g.strokeStyle = '#1f5fbf'; g.fillStyle = '#1f5fbf'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
  for (const [P0, s] of [[A, 1], [B, -1]]) {
    g.beginPath(); g.moveTo(P0[0], P0[1]);
    g.lineTo(P0[0] + s * ux * 9 - uy * 3.5, P0[1] + s * uy * 9 + ux * 3.5); g.lineTo(P0[0] + s * ux * 9 + uy * 3.5, P0[1] + s * uy * 9 - ux * 3.5); g.closePath(); g.fill();
  }
  // число — над линией (у вертикальной — слева), чтобы не закрывать центры отверстий на самой линии
  let nx = uy, ny = -ux; if (ny > 0 || (Math.abs(ny) < 0.01 && nx > 0)) { nx = -nx; ny = -ny; }
  const t = fmtN(dm.val);
  g.font = '600 14px system-ui, sans-serif'; const tw = g.measureText(t).width, off = 13 + Math.abs(nx) * tw / 2;
  const mx = (A[0] + B[0]) / 2 + nx * off, my = (A[1] + B[1]) / 2 + ny * off;
  g.fillStyle = 'rgba(255,255,255,.95)'; g.strokeStyle = '#1f5fbf'; g.lineWidth = 1;
  g.beginPath(); g.rect(mx - tw / 2 - 5, my - 10, tw + 10, 20); g.fill(); g.stroke();
  g.fillStyle = '#16427f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, mx, my + 0.5); g.textAlign = 'left';
}
// ближайшая цель у касания: точки важнее линий; на линии — ближайшая точка, сама линия запоминается (размер поперёк края)
function pdSnap(sx, sy) {
  const R = TOUCH ? 26 : 14;
  let best = null, bd = R;
  for (const q of PD.pts) { const Q = pdS(q.x, q.y), d = Math.hypot(Q[0] - sx, Q[1] - sy) - (q.pri ? 0 : 4); if (d < bd) { bd = d; best = { x: q.x, y: q.y, what: q.what }; } }
  if (best) return best;
  bd = R * 0.7;
  for (const l of PD.lines) {
    const A = pdS(l.a[0], l.a[1]), B = pdS(l.b[0], l.b[1]), dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((sx - A[0]) * dx + (sy - A[1]) * dy) / L2)), px = A[0] + t * dx, py = A[1] + t * dy, d = Math.hypot(px - sx, py - sy);
    if (d < bd) { bd = d; const m = pdM(px, py); best = { x: m[0], y: m[1], what: l.what, line: l }; }
  }
  return best;
}
function pdPick(sx, sy) {
  const q = pdSnap(sx, sy);
  if (!q) { if (PD.first) { PD.first = null; pdHint('першу точку скасовано'); } else pdHint('поруч немає точки — торкніться ближче до краю, отвору чи кріплення'); pdDraw(); return; }
  if (!PD.first) { PD.first = q; pdHint('друга точка · перша: ' + q.what); pdDraw(); return; }
  const a = PD.first, b = q; PD.first = null;
  const perp = (L, P0) => {                                  // от точки до края — поперёк края
    const dx = L.b[0] - L.a[0], dy = L.b[1] - L.a[1], L2 = dx * dx + dy * dy || 1, t = ((P0.x - L.a[0]) * dx + (P0.y - L.a[1]) * dy) / L2;
    const F = [L.a[0] + t * dx, L.a[1] + t * dy]; return { a: F, b: [P0.x, P0.y], val: Math.hypot(P0.x - F[0], P0.y - F[1]) };
  };
  const par = (L1, L2) => { const d1 = [L1.b[0] - L1.a[0], L1.b[1] - L1.a[1]], d2 = [L2.b[0] - L2.a[0], L2.b[1] - L2.a[1]];
    return Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) < 0.02 * Math.hypot(...d1) * Math.hypot(...d2); };
  let add = [];
  if (a.line && (!b.line || par(a.line, b.line))) add.push(perp(a.line, b));
  else if (b.line) add.push(perp(b.line, a));
  else {                                                     // две точки — по ширине и по высоте
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
    if (dx >= 0.05) add.push({ a: [a.x, a.y], b: [b.x, a.y], val: dx });
    if (dy >= 0.05) add.push({ a: [b.x, a.y], b: [b.x, b.y], val: dy });
  }
  add = add.filter(d => d.val >= 0.05);
  if (!add.length) { pdHint('точки збігаються — розміру немає'); pdDraw(); return; }
  PD.dims.push(...add);
  pdHint(add.map(d => fmtN(d.val)).join(' × ') + ' · ' + a.what + ' → ' + b.what);
  pdDraw();
}
function wirePd() {
  const w = $('pdw'), cv2 = pdC();
  $('pdX').innerHTML = ICON.x; $('pdX').title = 'закрити креслення';
  $('pdFlip').innerHTML = ICON.flip; $('pdFlip').title = 'перевернути деталь';
  $('pdClr').innerHTML = ICON.trash; $('pdClr').title = 'стерти розміри';
  $('pdX').onclick = () => pdClose(false);
  $('pdClr').onclick = () => { PD.dims = []; PD.first = null; pdHint(); pdDraw(); };
  // перевернули — размеры в осях той стороны больше не годятся
  $('pdFlip').onclick = () => { PD.side = -PD.side; PD.dims = []; PD.first = null; pdBuild(); pdFit(); pdHint(); pdDraw(); };
  addEventListener('popstate', () => { if (PD.on) pdClose(true); });
  addEventListener('resize', () => { if (!PD.on) return; pdResize(); pdFit(); pdDraw(); });
  addEventListener('keydown', e => { if (!PD.on) return; e.stopImmediatePropagation(); if (e.key === 'Escape') pdClose(false); }, true);   // модель под чертежом клавиш не слышит
  const ptr = new Map(); let st = null;
  cv2.addEventListener('pointerdown', e => {
    try { cv2.setPointerCapture(e.pointerId); } catch (er) {}
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1) st = { x: e.clientX, y: e.clientY, ox: PD.ox, oy: PD.oy, moved: false };
    else if (ptr.size === 2) { const [p1, p2] = [...ptr.values()]; st = { pinch: true, d: Math.hypot(p2.x - p1.x, p2.y - p1.y), mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2, sc: PD.sc, ox: PD.ox, oy: PD.oy, moved: true }; }
  });
  cv2.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) { if (!TOUCH) pdDraw(pdSnap(e.clientX, e.clientY)); return; }
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!st) return;
    if (st.pinch && ptr.size >= 2) {
      const [p1, p2] = [...ptr.values()], d = Math.hypot(p2.x - p1.x, p2.y - p1.y), mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const k = Math.max(0.05, Math.min(400, st.sc * d / (st.d || 1))) / st.sc;
      PD.sc = st.sc * k; PD.ox = mx - (st.mx - st.ox) * k; PD.oy = my - (st.my - st.oy) * k; pdDraw(); return;
    }
    if (!st.pinch) {
      if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8) return;
      st.moved = true; PD.ox = st.ox + e.clientX - st.x; PD.oy = st.oy + e.clientY - st.y; pdDraw();
    }
  });
  const up = e => {
    if (!ptr.has(e.pointerId)) return;
    ptr.delete(e.pointerId);
    if (st && !st.moved && !st.pinch && e.type === 'pointerup') pdPick(e.clientX, e.clientY);
    if (!ptr.size) st = null;
    else if (st && st.pinch) { const [p] = [...ptr.values()]; st = { x: p.x, y: p.y, ox: PD.ox, oy: PD.oy, moved: true }; }
  };
  cv2.addEventListener('pointerup', up); cv2.addEventListener('pointercancel', up);
  cv2.addEventListener('wheel', e => {
    e.preventDefault();
    const k = Math.exp(-e.deltaY * 0.0015), sc = Math.max(0.05, Math.min(400, PD.sc * k)), kk = sc / PD.sc;
    PD.ox = e.clientX - (e.clientX - PD.ox) * kk; PD.oy = e.clientY - (e.clientY - PD.oy) * kk; PD.sc = sc; pdDraw();
  }, { passive: false });
  w.addEventListener('contextmenu', e => e.preventDefault());
}

// ---------------- креслення: кадры для отчёта Федосова (Алексей 04.10) ----------------
// Только компьютер и только файл-страница из «Заказы» (модель внутри файла): по ссылке у заказчика вкладки нет.
// Кадр = один файл: лист — SVG (вектор, рёбра и размеры), снимок — PNG (как на экране). Кладутся в папки зоны, откуда
// их берёт отчёт (пресет «Заказчику», источник «Динамический»): <заказ>\5. Креслення\Чертежи для отчета(wmf)\<зона>
// и …\Визуализация\<зона>, имена «01 — …» по порядку. Пишет локальный сервер (127.0.0.1:8765, /draw/…).
// Лист — бумага А3 (400 × 283 мм), привязан к модели: колесо и сдвиг приближают лист целиком — линии, цифры и рамку
// вместе, на экране ровно то, что будет на бумаге. Масштаб чертежа (мм модели на мм бумаги) — по виду или закреплённый.
// В «линиях» модель не вращается: только строгие виды (кнопки, грани кубика). Невидимого на листе нет: детали белые и
// закрывают то, что за ними и внутри них; видимость каждого ребра проверяется по глубине кадра, точка за точкой.
// Размеры на листе — по правилам чертежа (Алексей 04.10): засечки или стрелки, число вдоль линии, шрифт как в Базисе,
// на каждом виде — только размеры этого вида; ручки: концы прилипают к углам и линиям, середина отводит линию поперёк.
const LOCAL = window.__LOCAL || null;
const DRAW_OK = !!window.__MODEL && !TOUCH;
const SRV = 'http://127.0.0.1:8765';
const SHEET_W = 400, SHEET_H = 283;
const SCALES = [2, 2.5, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
const DFONT = 'Sofia Sans Condensed';
const DIR_DRAW = LOCAL ? LOCAL.order + '\\5. Креслення\\Чертежи для отчета(wmf)\\' + LOCAL.zone : '';
const DIR_SHOT = LOCAL ? LOCAL.order + '\\5. Креслення\\Визуализация\\' + LOCAL.zone : '';
const DRAW_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const DRAW_SEL = DRAW_MAT.clone(); DRAW_SEL.color.setHex(0xd4e3f3);
const DRAW_GLASS = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });   // стекло не закрывает то, что за ним
// глубина кадра — 24 бита в цвете точки (свой простой материал, без упаковок three — одинаково в любой версии)
const DEPTH_MAT = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'void main(){ float v = floor(gl_FragCoord.z * 16777215.0 + 0.5); float r = floor(v / 65536.0);' +
    ' float g = floor((v - r * 65536.0) / 256.0); float b = v - r * 65536.0 - g * 256.0; gl_FragColor = vec4(r / 255.0, g / 255.0, b / 255.0, 1.0); }' });
let drawLines = true, drawFix = 0, drawN = 20, sheetC = null;   // линии/цвет; закреплённый масштаб; масштаб листа; середина листа
let dimEnd = 'tick'; try { dimEnd = localStorage.getItem('drawDimEnd') || 'tick'; } catch (e) {}
let drawHid = true; try { drawHid = localStorage.getItem('drawHid') !== '0'; } catch (e) {}   // невидимые линии в кресленні
let drawTool = null, tpts = [], tAxis = null, tLine = 0, tSide = 1, chainPrev = null, preview = null, selDim = null;
let metalCur = null;                                       // лист металла: узел полуфабриката, который сейчас на листе
let texList = null, texCur = null;                         // переход текстуры: группы шпона и та, что на листе (metalCur = её номер листа)
let joinList = null, joinCur = null;                       // столярка: рамочные фасады по изделиям и то, что на листе
const autoFlags = {};                                      // авторазмеры по видам: { mod, all }
const drawFiles = { d: [], s: [] };                        // что лежит в папках отчёта
const fEdges = new Map();
const V3 = () => new THREE.Vector3();
const toScr = v => { const s = v.clone().project(cam); return [(s.x + 1) / 2 * innerWidth, (1 - s.y) / 2 * innerHeight]; };
const fmtN = n => String(Math.round(n * 10) / 10).replace('.', ',');
// рёбра фурнитуры — только для креслення (на экране у фурнитуры рёбер нет): одна копия на форму
function drawEdgesFor(p) {
  if (p.dEdges) return p.dEdges;
  p.dEdges = []; p.dHid = [];
  if (p.isF) for (const m of p.meshes) {
    let g = fEdges.get(m.geometry);
    if (!g) { g = new THREE.EdgesGeometry(m.geometry, 30); fEdges.set(m.geometry, g); }
    const ln = new THREE.LineSegments(g, EDGE); ln.visible = false; m.parent.add(ln); p.dEdges.push(ln);
    const lh = new THREE.LineSegments(g, EDGE_HID); lh.visible = false; lh.renderOrder = 1; m.parent.add(lh); p.dHid.push(lh);   // за деталью — светлой
  }
  return p.dEdges;
}
const isGlassMesh = m => m.userData.mat ? m.userData.glass : !!(m.material.userData.base || m.material).transparent;
// направления вида: вправо и вверх на экране — какие оси модели (буква и знак)
function viewDir() { return cam.getWorldDirection(V3()); }
function viewAxes() {
  cam.updateMatrixWorld();
  const r = V3().setFromMatrixColumn(cam.matrixWorld, 0), u = V3().setFromMatrixColumn(cam.matrixWorld, 1);
  const big = v => ['x', 'y', 'z'].reduce((p, q) => Math.abs(v[q]) > Math.abs(v[p]) ? q : p, 'x');
  const R = big(r), U = big(u);
  return { R, U, D: ['x', 'y', 'z'].find(q => q !== R && q !== U), rs: Math.sign(r[R]) || 1, us: Math.sign(u[U]) || 1 };
}
function perpAxis(axis) { const { R, U } = viewAxes(); return AX[axis === R ? U : R].clone(); }
function viewKey() { const d = viewDir(); return [d.x, d.y, d.z].map(v => Math.round(v * 100)).join(','); }
function flags() { const k = viewKey(); return autoFlags[k] || (autoFlags[k] = { mod: false, all: false }); }
// размер принадлежит виду, на котором поставлен; старые (без вида) — если лежат в плоскости вида
function dimHere(dm) {
  if ((dm.mk ?? null) !== metalCur) return false;           // размеры листа металла — только на своём листе (и наоборот)
  // лист «с фасадами» и лист «без фасадов» — у каждого свои размеры (габариты на листе без фасадов не повторяются)
  if (dm.fs !== undefined && dm.fs !== hideFac) return false;
  const d = viewDir();
  if (dm.vdir) return dm.vdir.dot(d) > 0.99;
  return !!dm.axis && Math.abs(AX[dm.axis].dot(d)) < 0.1;
}

function setDraw(on) {
  if (on === drawOn) return;
  if (on) { closePop(); mode(1); if (ruler) stopRuler(); }
  else metalOff();                                          // из листа металла — вернуть спрятанное
  drawOn = on;
  clipApply();                                              // разрез вида — только в кресленні
  document.documentElement.classList.toggle('draw', on);
  setOn('bDraw', on);
  for (const id of ['bMode', 'bRuler']) $(id).style.display = on ? 'none' : '';
  // подсказка живёт в строке внизу, пока открыто креслення; вышли — обратно к значкам
  const st = $('st'); if (on) $('dstat').insertBefore(st, $('dstat').querySelector('.sr')); else $('bar').appendChild(st);
  setTool(null);
  for (const dm of dims) if (dm.g) dm.g.visible = dimsShown && !on;
  if (on) { frameName = L('n_front'); renderPanel(); applyLook(); layout(); strictView(0, 0); checkFolders(); }
  else { selDim = null; closeFly(); applyLook(); $('dpanel').replaceChildren(); $('dsvg').replaceChildren(); placeCtx(); layout(); updRuler(); }
  syncTools(); need();
}
// вид в кресленні: «линии» — белые детали, чёрные рёбра, без перспективы; «цвет» — как обычно (для снимков)
function applyLook() {
  const L = drawOn && drawLines;
  for (const p of parts) {
    for (const m of p.meshes) {
      if (L) {
        if (!m.userData.mat) { m.userData.mat = m.material; m.userData.glass = !!(m.material.userData.base || m.material).transparent; }
        m.material = m.userData.glass ? DRAW_GLASS : DRAW_MAT;
      } else if (m.userData.mat) { m.material = m.userData.mat; delete m.userData.mat; }
    }
    // рёбра фурнитуры: в 3D всегда (иначе в «линиях» она пропадает), в кресленні — только в режиме «линии»
    if (p.isF) { for (const l of drawEdgesFor(p)) l.visible = L || !drawOn; for (const l of p.dHid) l.visible = (L && drawHid) || (!drawOn && curMode === 3); }
  }
  for (const o of markObjs) o.visible = !drawOn;
  // невидимые линии (Алексей 08.10: «мне нужно понимание и передавать в чертёж»): светлые, там где линию закрывает деталь
  for (const l of hidEdges) l.visible = (L && drawHid && !l.userData.mark) || (!drawOn && curMode === 3);
  EDGE_HID.color.setHex(L ? 0xa9b1ba : 0x9aa4ae); EDGE_HID.opacity = L ? 0.75 : 0.45;
  EDGE.color.setHex(L ? 0x000000 : 0x0c0e11); EDGE.opacity = L ? 1 : 0.92;
  document.documentElement.classList.toggle('dlines', L);
  $('bCam').style.display = L ? 'none' : '';
  if (L && view.persp) setPersp(false);
  paint(); syncPanel();
}
// ---------- лист: прямоугольник бумаги в плоскости вида, стоит на модели ----------
const pxPerPaper = () => drawN * innerHeight / viewHeight();          // точек экрана на мм бумаги
function sheetRect() {
  cam.updateMatrixWorld();
  const r = V3().setFromMatrixColumn(cam.matrixWorld, 0), u = V3().setFromMatrixColumn(cam.matrixWorld, 1);
  const hw = SHEET_W * drawN / 2, hh = SHEET_H * drawN / 2;
  const a = toScr(sheetC.clone().addScaledVector(r, -hw).addScaledVector(u, hh)), b = toScr(sheetC.clone().addScaledVector(r, hw).addScaledVector(u, -hh));
  return { x0: a[0], y0: a[1], w: b[0] - a[0], h: b[1] - a[1] };
}
// масштаб по виду: видимое с полями под размеры (22 мм бумаги с каждой стороны) влезает в лист; любое число, не только стандартное
function fitSheet() {
  const b = visibleBox(false); if (b.isEmpty()) return;
  if (clipPl) {                                             // разрез вида по оси — лист по оставшемуся
    const nn = clipPl.normal, ax = ['x', 'y', 'z'].find(q => Math.abs(nn[q]) > 0.999);
    if (ax) { const c = -clipPl.constant / nn[ax]; if (nn[ax] > 0) b.min[ax] = Math.max(b.min[ax], c); else b.max[ax] = Math.min(b.max[ax], c); }
    if (b.isEmpty()) return;
  }
  const c = b.getCenter(V3()); view.target.copy(c); place(); cam.updateMatrixWorld();
  const right = V3().setFromMatrixColumn(cam.matrixWorld, 0), up = V3().setFromMatrixColumn(cam.matrixWorld, 1);
  let w = 0, h = 0;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const d = new THREE.Vector3(x, y, z).sub(c); w = Math.max(w, Math.abs(d.dot(right))); h = Math.max(h, Math.abs(d.dot(up)));
  }
  const m = 22;
  drawN = drawFix || Math.ceil(Math.max(2 * w / (SHEET_W - 2 * m), 2 * h / (SHEET_H - 2 * m)) * 10) / 10;
  sheetC = c.clone();
  fitView();
}
// показать лист целиком в свободном месте экрана
function fitView() {
  if (!sheetC) return;
  const fr = freeRect(), fw = fr.x1 - fr.x0 - 40, fh = fr.y1 - fr.y0 - 40;
  const mmpp = Math.max(SHEET_W * drawN / fw, SHEET_H * drawN / fh);
  view.target.copy(sheetC); view.dist = mmpp * innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)));
  place();
}
function drawInfo() {
  if (!sheetC) return;
  const S = sheetRect(), el = $('sheet');
  el.style.left = S.x0 + 'px'; el.style.top = S.y0 + 'px'; el.style.width = S.w + 'px'; el.style.height = S.h + 'px';
  const txt = view.persp ? L('noScale') : 'М 1:' + fmtN(drawN);
  el.firstChild.textContent = txt;
  const t = $('dScaleNow'); if (t) t.textContent = txt + (view.persp ? '' : ' (' + L(drawFix ? 'fixed' : 'byView') + ')');
  const sr = document.querySelector('#dstat .sr'), cv0 = curView();
  if (sr) sr.textContent = [cv0 ? L('n_' + cv0) + (hideFac ? L('n_nofac') : '') : '', txt, LOCAL ? LOCAL.zone : ''].filter(Boolean).join('   ·   ');
  drawOverlay();
}
function placeSheet() { drawInfo(); }
// ---------- размер на листе: линии, засечки/стрелки, число ----------
// toP — точка модели → [x, y] в единицах вывода; k — единиц вывода на мм бумаги (экран: точки, файл: 1)
function angPrims(dm, toP, k) {
  const c = toP(dm.ang.c), pa = toP(dm.a), pb = toP(dm.b), pp = toP(dm.ang.p);
  const ra = Math.hypot(pa[0] - c[0], pa[1] - c[1]), rb = Math.hypot(pb[0] - c[0], pb[1] - c[1]);
  if (ra < 0.5 * k || rb < 0.5 * k) return null;             // сторона вдоль взгляда — на этом виде угла нет
  const a1 = Math.atan2(pa[1] - c[1], pa[0] - c[0]);
  let d = Math.atan2(pb[1] - c[1], pb[0] - c[0]) - a1;
  while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) < 1e-3) return null;
  const R = Math.max(4 * k, Math.hypot(pp[0] - c[0], pp[1] - c[1])), at = (t, r) => [c[0] + (r || R) * Math.cos(t), c[1] + (r || R) * Math.sin(t)];
  const L = [], T = [], F = [], N = Math.max(8, Math.ceil(Math.abs(d) * 24)), a2 = a1 + d;
  for (let i = 0; i < N; i++) { const p = at(a1 + d * i / N), q = at(a1 + d * (i + 1) / N); L.push([p[0], p[1], q[0], q[1]]); }
  // выносные — по сторонам угла, если дуга дальше конца стороны (зазор 1 мм от детали, 2 мм за дугу)
  for (const [r0, t] of [[ra, a1], [rb, a2]]) if (R > r0 + 0.3 * k) { const p = at(t, r0 + k), q = at(t, R + 2 * k); L.push([p[0], p[1], q[0], q[1]]); }
  const sg = Math.sign(d);
  for (const [t, s] of [[a1, sg], [a2, -sg]]) {               // концы дуги: касательная внутрь дуги
    const p = at(t), ex = -Math.sin(t) * s, ey = Math.cos(t) * s;
    if (dimEnd === 'tick') { const h = 1.5 * k / Math.SQRT2, tx = (ex + ey) * h, ty = (ey - ex) * h; T.push([p[0] - tx, p[1] - ty, p[0] + tx, p[1] + ty]); }
    else { const AL = Math.min(3 * k, R * Math.abs(d) / 3), AW = AL * 0.28, bx = p[0] + ex * AL, by = p[1] + ey * AL; F.push([p[0], p[1], bx - ey * AW, by + ex * AW, bx + ey * AW, by - ex * AW]); }
  }
  const tm = a1 + d / 2, deg = Math.abs(d) * 180 / Math.PI, tp = at(tm), tx = at(tm, R + 2.6 * k);
  const txt = dm.text != null ? String(dm.text) : String(Math.round(deg * 10) / 10).replace('.', ',') + '°';
  return { L, T, F, txt, x: tx[0], y: tx[1] + 1.2 * k, ang: 0, pa, pb, tp, col: dm.col, fsz: dm.fsz };
}
function dimPrims(dm, toP, k) {
  if (dm.ang) return angPrims(dm, toP, k);
  const L = [], T = [], F = [];
  let pa, pb, pa2, pb2, val;
  if (dm.axis) {
    const u0 = AX[dm.axis], tl = dm.b.clone().sub(dm.a).dot(u0), a2 = dm.a.clone().add(dm.off), b2 = a2.clone().addScaledVector(u0, tl);
    pa = toP(dm.a); pb = toP(dm.b); pa2 = toP(a2); pb2 = toP(b2); val = tl;
  } else { pa = pa2 = toP(dm.a); pb = pb2 = toP(dm.b); val = dm.a.distanceTo(dm.b); }
  let ex = pb2[0] - pa2[0], ey = pb2[1] - pa2[1];
  const Ln = Math.hypot(ex, ey);
  if (Ln < (dm.small ? 1e-3 : 0.5) * k) return null;      // размер вдоль взгляда — на листе точка (зазор перехода текстуры 2 мм — рисуется)
  ex /= Ln; ey /= Ln;
  if (ex < -1e-6 || (Math.abs(ex) < 1e-6 && ey > 0)) { ex = -ex; ey = -ey; }   // читается слева направо / снизу вверх
  if (dm.axis) for (const [p, p2] of [[pa, pa2], [pb, pb2]]) {   // выносные: зазор 1 мм от детали, 2 мм за размерную линию
    const wx = p2[0] - p[0], wy = p2[1] - p[1], wl = Math.hypot(wx, wy);
    if (wl < 0.3 * k) continue;
    const g0 = wl > 3 * k ? k : 0;
    L.push([p[0] + wx / wl * g0, p[1] + wy / wl * g0, p2[0] + wx / wl * 2 * k, p2[1] + wy / wl * 2 * k]);
  }
  const tick = dimEnd === 'tick', ov = tick && dm.axis ? 2 * k : 0, sg = (pb2[0] - pa2[0]) * ex + (pb2[1] - pa2[1]) * ey >= 0 ? 1 : -1;
  L.push([pa2[0] - ex * ov * sg, pa2[1] - ey * ov * sg, pb2[0] + ex * ov * sg, pb2[1] + ey * ov * sg]);
  if (tick) {                                             // засечка: 3 мм под 45° к линии
    const s = 1.5 * k / Math.SQRT2, tx = (ex + ey) * s, ty = (ey - ex) * s;
    for (const p of [pa2, pb2]) T.push([p[0] - tx, p[1] - ty, p[0] + tx, p[1] + ty]);
  } else {
    const AL = Math.min(3 * k, Ln / 3), AW = AL * 0.28;
    for (const [p, s] of [[pa2, sg], [pb2, -sg]]) {
      const bx = p[0] + ex * AL * s, by = p[1] + ey * AL * s;
      F.push([p[0], p[1], bx - ey * AW, by + ex * AW, bx + ey * AW, by - ex * AW]);
    }
  }
  const ang = Math.atan2(ey, ex) * 180 / Math.PI, r = ang * Math.PI / 180;
  const tp = [(pa2[0] + pb2[0]) / 2, (pa2[1] + pb2[1]) / 2];
  // на листе — до целого (Алексей 06.10: сотые заказчика путают; цепочка может не сойтись с общим на мм — так и оставить)
  const txt = dm.text != null ? String(dm.text) : String(Math.round(Math.abs(val)));
  // лист металла: число шире интервала («30» у основания цепочки) — вынести за интервал в сторону от базы (Алексей 27.10)
  if (dm.mk != null && dm.axis) {
    const tw = txt.length * (dm.fsz || 3.5) * 0.55 * k;
    if (Ln < tw + 2 * k) { const sh = sg * (Ln / 2 + tw / 2 + 1.5 * k); tp[0] += ex * sh; tp[1] += ey * sh; }
    else if (dm.stag) { const sh = dm.stag * (tw * 0.6 + 1 * k); tp[0] += ex * sh; tp[1] += ey * sh; }   // шахматный порядок соседних рядов
  }
  return { L, T, F, txt, x: tp[0] + Math.sin(r) * k, y: tp[1] - Math.cos(r) * k, ang, pa, pb, tp, col: dm.col, fsz: dm.fsz };
}
function dimSvg(g, k, o) {
  const col = o.sel ? '#e0301e' : o.prev ? '#7aa7e0' : (g.col || '#1f5fbf'), f = v => String(Math.round(v * 100) / 100);
  const seg = a => a.map(q => 'M' + f(q[0]) + ' ' + f(q[1]) + 'L' + f(q[2]) + ' ' + f(q[3])).join('');
  const sw = o.exp ? 0.18 : Math.max(1, 0.18 * k), tw = o.exp ? 0.35 : Math.max(1.4, 0.35 * k);
  let s = `<path d="${seg(g.L)}" fill="none" stroke="${col}" stroke-width="${f(sw)}"/>`;
  if (g.T.length) s += `<path d="${seg(g.T)}" fill="none" stroke="${col}" stroke-width="${f(tw)}" stroke-linecap="round"/>`;
  if (g.F.length) s += `<path d="${g.F.map(t => 'M' + f(t[0]) + ' ' + f(t[1]) + 'L' + f(t[2]) + ' ' + f(t[3]) + 'L' + f(t[4]) + ' ' + f(t[5]) + 'Z').join('')}" fill="${col}" stroke="none"/>`;
  s += `<text x="${f(g.x)}" y="${f(g.y)}" font-family="${DFONT}" font-size="${f((g.fsz || 3.5) * k)}" fill="${col}" text-anchor="middle"` +
    (Math.abs(g.ang) > 0.01 ? ` transform="rotate(${f(g.ang)} ${f(g.x)} ${f(g.y)})"` : '') + (o.exp || o.prev ? '' : ` class="dt" data-d="${o.i}"`) + `>${g.txt}</text>`;
  if (!o.exp && !o.prev) s += `<path d="${seg(g.L)}" class="dh" data-d="${o.i}"/>`;
  return s;
}
// размеры на экране — тем же рисунком, что в файле, в масштабе листа
function drawOverlay() {
  const sv = $('dsvg'); if (!sv) return;
  if (!drawOn) { if (sv.firstChild) sv.replaceChildren(); return; }
  cam.updateMatrixWorld();
  const k = pxPerPaper();
  let h = '';
  if (dimsShown) dims.forEach((dm, i) => { if (!dimHere(dm)) return; const g = dimPrims(dm, toScr, k); if (g) h += dimSvg(g, k, { i, sel: dm === selDim }); });
  if (preview) { const g = dimPrims(preview, toScr, k); if (g) h += dimSvg(g, k, { prev: true }); }
  if (metalCur !== null && sheetC) {                        // лист металла: выноски и колонка примечаний
    for (const n of mnotes) if (n.mk === metalCur && n.vk === viewKey()) h += noteSvg(n, toScr, k);
    const un = metal && metal.units.find(x => x.u === metalCur);
    if (un && un.marks) for (const m of un.marks[viewKey()] || []) h += holeMarkSvg(m, toScr, k);
    const S = sheetRect();
    if (!joinCur && !texCur) { const mu = metalData().all.find(x => x.u === metalCur); if (mu && mu.lay) h = metalViewsSvg(mu, S) + h; }
    h += joinCur ? joinBlockSvg([S.x0, S.y0], S.w / SHEET_W) + joinNumsSvg(joinCur, toScr, k) : texCur ? texBlockSvg([S.x0, S.y0], S.w / SHEET_W) + texHolesSvg(texCur, toScr, k) + texNotesSvg(texCur, toScr, k) : metalBlockSvg([S.x0, S.y0], S.w / SHEET_W, true);
  }
  const o = sheetC ? toScr(sheetC) : [0, 0];
  if (sheetC) secs.forEach((sc, i) => { if (secHere(sc)) h += secSvg(secPrims(sc, o, k, toScr), k, { i, sel: sc === selSec }); });
  // разрез вида: линия со стрелками (куда смотрим) — на виде, где плоскость ребром; за линию можно тянуть
  if (sheetC && clipPl && clipEdgeOn()) {
    const g = clipPrims(k), [pa, pb] = clipLine().map(toScr);
    h += secSvg(g, k, { prev: !!clipDrag });
    h += `<path class="ch" d="M${pa[0]} ${pa[1]}L${pb[0]} ${pb[1]}" data-k="clip"/>`;
  }
  if (cd && drawTool === 'clip') {
    if (cd.b) h += secSvg(secPrims({ a: cd.a, b: cd.b, s: cd.s || 1, vdir: viewDir(), letter: '' }, o, k, toScr, true), k, { prev: true });
    else if (cd.a && cd.bh) { const p = toScr(cd.a), q = toScr(cd.bh); h += `<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" stroke="#7aa7e0" stroke-width="2" stroke-dasharray="10 4 2 4" fill="none"/>`; }
  }
  if (sd && drawTool === 'sect') {
    if (sd.sec) h += secSvg(secPrims(sd.sec, o, k, toScr), k, { prev: true });
    else if (sd.b) h += secSvg(secPrims({ a: sd.a, b: sd.b, s: sd.s || 1, vdir: viewDir(), letter: '' }, o, k, toScr, true), k, { prev: true });
    else if (sd.a && sd.bh) { const p = toScr(sd.a), q = toScr(sd.bh); h += `<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" stroke="#7aa7e0" stroke-width="2" stroke-dasharray="10 4 2 4" fill="none"/>`; }
  }
  if (selDim && dims.includes(selDim) && dimHere(selDim)) {
    const g = dimPrims(selDim, toScr, k);
    if (g) for (const [p, n] of [[g.pa, 'a'], [g.pb, 'b'], [g.tp, 'm']]) h += `<rect class="grip" data-g="${n}" x="${p[0] - 5}" y="${p[1] - 5}" width="10" height="10"/>`;
  }
  sv.innerHTML = h;
  placeCtx();
}
// ---------- прилипание точки: угол детали → линия (ребро, отрезок помещения) → просто место на виде ----------
function snapDraw(x, y) {
  const c = snapAt(x, y, [12]); if (c) return { p: c, kind: 'pt' };
  const e = edgeAt(x, y); if (e) return { p: e.p, kind: 'edge' };
  return { p: onTargetPlane(x, y) || V3(), kind: 'free' };
}
function showSnap(s) {
  const mk = $('snapmk'), [x, y] = toScr(s.p);
  mk.style.display = 'block'; mk.style.left = x + 'px'; mk.style.top = y + 'px';
  mk.classList.toggle('snapped', s.kind === 'pt'); mk.classList.toggle('edge', s.kind === 'edge');
}
// ---------- ручки размера ----------
// середина (число, линия) — отводит размерную линию поперёк; конец — прилипает к углу/линии, число пересчитывается,
// а размерная линия стоит на месте: вбок меняется только длина выносной ножки (Алексей 04.10)
function dragDimTo(dm, kind, x, y) {
  if (dm.ang) {                                             // угловой: середина — радиус дуги, концы — точки сторон
    if (kind === 'm') { const P = onTargetPlane(x, y); if (P) dm.ang.p.copy(P); }
    else { const s = snapDraw(x, y); showSnap(s); (kind === 'a' ? dm.a : dm.b).copy(s.p); }
    buildDim(dm); drawOverlay(); return;
  }
  if (!dm.axis) return;
  const w = perpAxis(dm.axis);
  if (kind === 'm') {
    const P = onTargetPlane(x, y); if (!P) return;
    const old = dm.off.clone(); dm.off.copy(w).multiplyScalar(P.sub(dm.a).dot(w));
    // размер из цепочки — едет вся цепочка на то же расстояние (Алексей 06.10)
    if (dm.chain) {
      const dv = dm.off.clone().sub(old);
      for (const o of dims) if (o !== dm && o.chain === dm.chain && o.axis === dm.axis) { o.off.add(dv); buildDim(o); }
      if (mc && mc.id === dm.chain) mc.line += dv.dot(w);
    }
  }
  else {
    const s = snapDraw(x, y); showSnap(s);
    if (kind === 'a') { const a2 = dm.a.clone().add(dm.off); dm.a.copy(s.p); dm.off.copy(w).multiplyScalar(a2.sub(dm.a).dot(w)); }
    else dm.b.copy(s.p);
  }
  buildDim(dm); drawOverlay();
}
function wireOverlay() {
  const sv = $('dsvg'); let dr = null;
  sv.addEventListener('pointerdown', e => {
    const di = e.target.dataset.d, gr = e.target.dataset.g, si = e.target.dataset.s;
    if (e.target.dataset.k === 'clip' && clipPl) {            // линия разреза вида: тянуть параллельно
      e.preventDefault(); e.stopPropagation();
      if (e.button === 0) clipDrag = { x: e.clientX, y: e.clientY, c0: clipPl.constant };
      return;
    }
    const vwv = e.target.dataset.vw || e.target.dataset.vws;
    if (vwv && metalCur !== null) {                           // лист металла: вид-блок — тянуть, за угол — масштаб листа, правая — удалить
      e.preventDefault(); e.stopPropagation();
      const un = metalData().all.find(x => x.u === metalCur); if (!un) return;
      if (e.button === 2) { metalDelView(un, vwv); return; }
      if (e.button !== 0) return;
      const vw = metalViews(un), P = {}; for (const w of vw) P[w.v] = [w.px, w.py];
      metalSelV = vwv; selDim = null; selSec = null;
      dr = { vw: vwv, scale: !!e.target.dataset.vws, un, x: e.clientX, y: e.clientY, moved: false, P, r0: metalViewRect(vw.find(w => w.v === vwv)), n0: drawN };
      drawOverlay(); return;
    }
    const bi = e.target.dataset.b;
    if (bi !== undefined && metalCur !== null) {              // лист металла: колонка надписей / аксонометрия — тянуть, за угол — растягивать
      e.preventDefault(); e.stopPropagation();
      const un = metalData().all.find(x => x.u === metalCur); if (!un || e.button !== 0) return;
      const G = metalBlockGeo(un, drawN), I = metalIsoGeo(un);
      dr = { blk: bi, un, x: e.clientX, y: e.clientY, moved: false, p0: bi.startsWith('blk') ? { x: G.x0, y: G.y0, s: G.s, w: G.x1 - G.x0 } : { x: I.x, y: I.y, s: I.s } };
      return;
    }
    if (si !== undefined) {                                   // сечение: щелчок — выделить (плашка), тянуть — двигать, правая — удалить
      e.preventDefault(); e.stopPropagation();
      const sc = secs[+si]; if (!sc) return;
      if (e.button === 2) { secAct('del', sc); return; }
      selSec = sc; selDim = null; dr = { sc, x: e.clientX, y: e.clientY, p0: sc.pos.slice(), moved: false }; drawOverlay(); return;
    }
    if (di === undefined && gr === undefined) return;
    e.preventDefault(); e.stopPropagation(); selSec = null;
    if (gr) { dr = { dm: selDim, kind: gr, x: e.clientX, y: e.clientY, moved: false }; return; }
    const dm = dims[+di]; if (!dm) return;
    if (e.button === 2) { pushUndo(); removeDim(dm); drawOverlay(); return; }
    selDim = dm; dr = { dm, kind: 'm', x: e.clientX, y: e.clientY, moved: false }; drawOverlay();
  });
  sv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointermove', e => {
    if (clipDrag) { clipDragTo(e.clientX, e.clientY, clipDrag.x, clipDrag.y, clipDrag.c0); return; }
    if (!dr) return;
    if (!dr.moved && Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 3) return;
    if (dr.vw) {
      dr.moved = true;
      const k = pxPerPaper(), dx = (e.clientX - dr.x) / k, dy = (e.clientY - dr.y) / k;
      if (dr.scale) {                                         // масштаб — ближайший из ряда, рамки показывают, как ляжет
        const r = dr.r0, f0 = Math.max(0.1, Math.max((r[2] - r[0] + dx) / (r[2] - r[0]), (r[3] - r[1] + dy) / (r[3] - r[1])));
        const n = SCALES.reduce((p, q) => Math.abs(Math.log(q / (dr.n0 / f0))) < Math.abs(Math.log(p / (dr.n0 / f0))) ? q : p, SCALES[0]);
        metalScaleDr = { n, f: dr.n0 / n, x: e.clientX, y: e.clientY };
      } else metalDragView(dr.un, dr.vw, dr.P, dx, dy);
      drawOverlay(); return;
    }
    if (!dr.moved) { dr.moved = true; pushUndo(); }
    if (dr.sc) { const k = pxPerPaper(); dr.sc.pos = [dr.p0[0] + (e.clientX - dr.x) / k, dr.p0[1] + (e.clientY - dr.y) / k]; drawOverlay(); return; }
    if (dr.blk) {
      const k = pxPerPaper(), dx = (e.clientX - dr.x) / k, dy = (e.clientY - dr.y) / k, p = dr.p0, un = dr.un;
      if (dr.blk === 'blk') un.blk = { x: p.x + dx, y: p.y + dy, s: p.s };
      else if (dr.blk === 'blks') un.blk = { x: p.x, y: p.y, s: Math.max(0.5, Math.min(3, p.s * (p.w + dx) / p.w)) };
      else if (dr.blk === 'iso') un.isoOv = { x: p.x + dx, y: p.y + dy, s: p.s };
      else un.isoOv = { x: p.x, y: p.y, s: Math.max(30, Math.min(250, p.s + Math.max(dx, dy))) };
      drawOverlay(); return;
    }
    dragDimTo(dr.dm, dr.kind, e.clientX, e.clientY);
  });
  addEventListener('pointerup', () => {
    if (clipDrag) { clipDrag = null; clipCaps(); drawOverlay(); return; }
    if (dr && dr.vw) {
      const d = dr; dr = null; const sc = metalScaleDr; metalScaleDr = null;
      if (d.scale) { if (sc && sc.n !== d.n0) metalApplyScale(d.un, sc.n); else drawOverlay(); return; }
      if (!d.moved && d.vw !== d.un.actV) { metalShow(d.un.u, d.vw, true); return; }   // щелчок по картинке вида — он живой
      drawOverlay(); return;
    }
    if (dr) { dr = null; hideHover(); drawOverlay(); }
  });
}
// ---------- инструменты: линейный, цепочка, от базы, габаритный, полезные ----------
// подсказки инструментов — в словаре креслення (h_lin, h_chain, …), на выбранном языке
// инструменты «нажал и потянул» — без прицела по углам
const PRESS = new Set(['mod', 'fac', 'easy']);
const snapTool = () => !!drawTool && drawTool !== 'gab' && !PRESS.has(drawTool);
function setTool(t) {
  drawTool = t; tpts = []; tAxis = null; chainPrev = null; preview = null; sd = null; cd = null; hideHover();
  if (PRESS.has(t)) mcReset(); else mc = null;
  cv.style.cursor = snapTool() ? 'none' : '';
  $('st').textContent = t ? L('h_' + t) : '';
  syncPanel(); drawOverlay();
}
function endTool() {
  tpts = []; tAxis = null; chainPrev = null; preview = null; sd = null; cd = null;
  if (PRESS.has(drawTool)) mcReset();                     // другой вид / Esc — следующая цепочка своя
  if (drawTool) $('st').textContent = L('h_' + drawTool); drawOverlay();
}
// горизонтально или вертикально — по тому, куда увели мышь от двух точек (как в Базисе)
function orient(p1, p2, x, y) {
  const { R, U } = viewAxes(), a = toScr(p1), b = toScr(p2);
  const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
  if (dy < 3) return R; if (dx < 3) return U;
  const inX = x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0]), inY = y > Math.min(a[1], b[1]) && y < Math.max(a[1], b[1]);
  if (inX && !inY) return R; if (inY && !inX) return U;
  return dx >= dy ? R : U;
}
function mkPrev(a, b, axis, line) { const w = perpAxis(axis); return { a, b, axis, off: w.multiplyScalar(line - a.dot(w)), text: null }; }
function toolHover(x, y) {
  if (drawTool === 'ang') { angHover(x, y); return; }
  if (drawTool === 'sect') { secHover(x, y); return; }
  if (drawTool === 'clip') { clipHover(x, y); return; }
  const s = snapDraw(x, y); showSnap(s);
  preview = null;
  if (tAxis === null && tpts.length === 2) {
    const o = orient(tpts[0], tpts[1], x, y), P = onTargetPlane(x, y);
    if (P) preview = mkPrev(tpts[0], tpts[1], o, P.dot(perpAxis(o)));
  } else if (tAxis !== null) {
    const from = drawTool === 'chain' ? chainPrev : tpts[0];
    preview = mkPrev(from, s.p, tAxis, drawTool === 'base' ? tLine + tSide * 7 * drawN : tLine);
  } else if (tpts.length === 1) preview = { a: tpts[0], b: s.p, axis: null, off: V3() };
  drawOverlay();
}
function toolDim(a, b) {
  if (Math.abs(b.clone().sub(a).dot(AX[tAxis])) < 0.5) { toast('точки на одной линии — 0 мм'); return; }
  const dm = addDim(a.clone(), b.clone()), w = perpAxis(tAxis);
  dm.axis = tAxis; dm.off = w.multiplyScalar(tLine - a.dot(w)); if (drawTool !== 'lin') dm.chain = tChain; buildDim(dm);
}
// угловой размер (Алексей 29.10): вершина, точка на одной стороне, на другой, щелчок — радиус дуги. Угол — как видно на
// виде (между сторонами на листе), меньший из двух; хранится размером без оси: a, b — точки сторон, ang.c — вершина, ang.p — дуга
function angHover(x, y) {
  const s = snapDraw(x, y); showSnap(s);
  preview = tpts.length === 3 ? { a: tpts[1], b: tpts[2], axis: null, off: V3(), ang: { c: tpts[0], p: onTargetPlane(x, y) || s.p } }
    : tpts.length ? { a: tpts[tpts.length - 1], b: s.p, axis: null, off: V3(), text: '' } : null;
  drawOverlay();
}
function angClick(x, y) {
  const s = snapDraw(x, y);
  if (tpts.length < 3) {
    if (tpts.some(p => p.distanceTo(s.p) < 0.5)) { toast('точка совпадает с прежней'); return; }
    tpts.push(s.p.clone()); angHover(x, y); return;
  }
  const P = onTargetPlane(x, y); if (!P) return;
  pushUndo();
  const dm = addDim(tpts[1].clone(), tpts[2].clone()); dm.axis = null; dm.ang = { c: tpts[0].clone(), p: P.clone() }; buildDim(dm);
  endTool();
}
function toolClick(x, y) {
  if (drawTool === 'ang') { angClick(x, y); return; }
  if (drawTool === 'easy') { pushUndo(); easyPick(x, y); drawOverlay(); return; }
  if (drawTool === 'sect') { secClick(x, y); return; }
  if (drawTool === 'clip') { clipClick(x, y); return; }
  const s = snapDraw(x, y);
  if (tAxis === null) {
    if (tpts.length < 2) { tpts.push(s.p.clone()); toolHover(x, y); return; }
    const o = orient(tpts[0], tpts[1], x, y), P = onTargetPlane(x, y); if (!P) return;
    const w = perpAxis(o);
    tAxis = o; tLine = P.dot(w); tSide = Math.sign(tLine - tpts[0].dot(w)) || 1; tChain = ++chainSeq;
    pushUndo(); toolDim(tpts[0], tpts[1]); chainPrev = tpts[1];
    if (drawTool === 'lin') endTool(); else { preview = null; $('st').textContent = L('h_next'); drawOverlay(); }
    return;
  }
  const from = drawTool === 'chain' ? chainPrev : tpts[0];
  pushUndo();
  if (drawTool === 'base') tLine += tSide * 7 * drawN;      // каждый следующий от базы — ступенькой дальше от чертежа
  toolDim(from, s.p); chainPrev = s.p.clone(); drawOverlay();
}
function drawHover(x, y) {
  if (snapTool()) { toolHover(x, y); return; }
  hideHover();
  cv.style.cursor = pick(x, y) ? (PRESS.has(drawTool) ? 'crosshair' : 'pointer') : 'default';
}
// ---------- сечение (Алексей 08.10): линия А-А на виде → профиль детали рядом на листе, в своём масштабе ----------
// Две точки — линия сечения (почти горизонтальная / вертикальная выпрямляется), третий щелчок — с какой стороны смотреть,
// дальше сечение едет за мышью, щелчок — положить. Режется то, что видно на виде: треугольники деталей — плоскостью через
// линию и направление взгляда, в пределах линии. Срез — контур и штриховка 45°. Сечение принадлежит виду, как размеры.
const SEC_LET = 'АБВГДЕЖИКЛМНПРСТУФШЩЭЮЯ';
const SEC_SCALES = [1, 2, 2.5, 5, 10];
const secs = [];
let selSec = null, sd = null;                              // sd — сечение в работе: { a, bh, b, s, sec }
function secHere(sc) { return (sc.mk ?? null) === metalCur && (sc.fs === undefined || sc.fs === hideFac) && sc.vdir.dot(viewDir()) > 0.99; }   // сечение — своему листу металла (или обычному)
// оси сечения: t — вдоль линии, n — поперёк (куда смотрим, со знаком s), на листе: вправо R, вверх U (к зрителю вида)
function secAxes(sc) {
  const t = sc.b.clone().sub(sc.a), len = t.length(); t.normalize();
  const n = t.clone().cross(sc.vdir).normalize();
  return { t, len, n, U: sc.vdir.clone().negate(), R: t.clone().multiplyScalar(sc.s) };
}
function secCut(sc, only) {
  const { t, len, n, U, R } = secAxes(sc), a = sc.a, c0 = a.dot(n) + 0.0007;   // чуть мимо, чтобы не попасть ровно в вершины
  root.updateMatrixWorld(true);
  const G = [], pi = [], A = V3(), B = V3(), C = V3(), e1 = V3(), e2 = V3(), dir = V3(), P = [A, B, C];
  parts.forEach((p, i) => {
    if (only ? !only.includes(i) : (!p.g.visible || p.isL)) return;
    const segs = [], seen = new Set();
    for (const m of p.meshes) {
      if (!only && !shown(m)) continue;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, mw = m.matrixWorld, cnt = idx ? idx.count : pos.count;
      for (let k = 0; k + 2 < cnt; k += 3) {
        for (let j = 0; j < 3; j++) P[j].fromBufferAttribute(pos, idx ? idx.getX(k + j) : k + j).applyMatrix4(mw);
        const D = [A.dot(n) - c0, B.dot(n) - c0, C.dot(n) - c0];
        if ((D[0] > 0 && D[1] > 0 && D[2] > 0) || (D[0] < 0 && D[1] < 0 && D[2] < 0)) continue;
        const X = [];
        for (let j = 0; j < 3; j++) { const q = (j + 1) % 3; if ((D[j] < 0) !== (D[q] < 0)) X.push(P[j].clone().lerp(P[q], D[j] / (D[j] - D[q]))); }
        if (X.length !== 2) continue;
        // направление отрезка — по повороту треугольника: у контура есть «внутри» (штриховка по правилу ненулевого обхода)
        dir.crossVectors(n, e1.subVectors(B, A).cross(e2.subVectors(C, A)));
        let [p0, p1] = X; if (p1.clone().sub(p0).dot(dir) < 0) [p0, p1] = [p1, p0];
        const t0 = p0.clone().sub(a).dot(t), dt = p1.clone().sub(a).dot(t) - t0;
        let l0 = 0, l1 = 1;
        if (Math.abs(dt) > 1e-9) { const la = -t0 / dt, lb = (len - t0) / dt; l0 = Math.max(0, Math.min(la, lb)); l1 = Math.min(1, Math.max(la, lb)); }
        else if (t0 < 0 || t0 > len) continue;
        if (l1 - l0 < 1e-6) continue;
        if (cutAway(p0.clone().lerp(p1, (l0 + l1) / 2))) continue;    // отсечённое разрезом вида — не режем
        const qa = p0.clone().lerp(p1, l0).sub(a), qb = p0.clone().lerp(p1, l1).sub(a);
        const s = [qa.dot(R), qa.dot(U), qb.dot(R), qb.dot(U)];
        const r2 = v => Math.round(v * 100), k1 = r2(s[0]) + ',' + r2(s[1]), k2 = r2(s[2]) + ',' + r2(s[3]);
        const key = k1 < k2 ? k1 + ';' + k2 : k2 + ';' + k1;     // Базис местами отдаёт треугольник дважды — один отрезок
        if (seen.has(key) || k1 === k2) continue;
        seen.add(key); segs.push(s);
      }
    }
    if (segs.length) { G.push(segs); pi.push(i); }
  });
  let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity;
  for (const g of G) for (const s of g) { u0 = Math.min(u0, s[0], s[2]); u1 = Math.max(u1, s[0], s[2]); v0 = Math.min(v0, s[1], s[3]); v1 = Math.max(v1, s[1], s[3]); }
  return { G, pi, box: [u0, v0, u1, v1] };
}
function secGeom(sc) { if (!sc.G) Object.assign(sc, secCut(sc, sc.pi)); return sc; }
// точка сечения (мм детали) → мм бумаги от середины листа
function secMap(sc) {
  const kS = 1 / (sc.sN || drawN), [u0, v0, u1, v1] = sc.box, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  const r = (sc.rot || 0) * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
  return (u, v) => { const x = (u - cu) * kS, y = -(v - cv) * kS; return [sc.pos[0] + x * co - y * si, sc.pos[1] + x * si + y * co]; };
}
// штриховка 45° (вправо-вверх) по правилу ненулевого обхода; S и ответ — отрезки в мм бумаги
function secHatch(S, step) {
  const r = Math.SQRT1_2, E = S.map(s => [(s[0] - s[1]) * r, (s[0] + s[1]) * r, (s[2] - s[3]) * r, (s[2] + s[3]) * r]), out = [];
  let y0 = Infinity, y1 = -Infinity; for (const e of E) { y0 = Math.min(y0, e[1], e[3]); y1 = Math.max(y1, e[1], e[3]); }
  for (let c = Math.ceil(y0 / step) * step; c < y1; c += step) {
    const X = [];
    for (const e of E) if ((e[1] <= c) !== (e[3] <= c)) X.push([e[0] + (c - e[1]) / (e[3] - e[1]) * (e[2] - e[0]), e[3] > e[1] ? 1 : -1]);
    X.sort((p, q) => p[0] - q[0]);
    let w = 0, st = 0;
    for (const [x, d] of X) {
      const w0 = w; w += d;
      if (!w0 && w) st = x; else if (w0 && !w && x - st > 0.05) out.push([(st + c) * r, (c - st) * r, (x + c) * r, (c - x) * r]);
    }
  }
  return out;
}
const secLabel = sc => sc.letter + '–' + sc.letter + (sc.sN && Math.abs(sc.sN - drawN) > 1e-6 ? ' (1:' + fmtN(sc.sN) + ')' : '');
// рисунок сечения: o — середина листа в единицах вывода, k — единиц на мм бумаги, toP — точка модели → вывод (линия на виде)
function secPrims(sc, o, k, toP, noSec) {
  const g = { O: [], H: [], C: [], F: [], T: [] };
  // линия сечения на виде: толстые штрихи на концах, стрелки — куда смотрим, буквы у стрелок
  const pa = toP(sc.a), pb = toP(sc.b), ex0 = pb[0] - pa[0], ey0 = pb[1] - pa[1], Ln = Math.hypot(ex0, ey0);
  if (Ln > 1) {
    const ex = ex0 / Ln, ey = ey0 / Ln, { n } = secAxes(sc), pn = toP(sc.a.clone().addScaledVector(n, sc.s * 100));
    let sx = -ey, sy = ex; if ((pn[0] - pa[0]) * sx + (pn[1] - pa[1]) * sy < 0) { sx = -sx; sy = -sy; }
    const sl = Math.min(8 * k, Ln / 2.5);
    for (const [p, d] of [[pa, 1], [pb, -1]]) {
      g.C.push([p[0], p[1], p[0] + ex * sl * d, p[1] + ey * sl * d]);
      const bx = p[0] + ex * 2 * k * d, by = p[1] + ey * 2 * k * d, tx = bx + sx * 7 * k, ty = by + sy * 7 * k;
      g.O.push([bx, by, tx - sx * 2.5 * k, ty - sy * 2.5 * k]);
      g.F.push([tx, ty, tx - sx * 3 * k - ex * k, ty - sy * 3 * k - ey * k, tx - sx * 3 * k + ex * k, ty - sy * 3 * k + ey * k]);
      g.T.push({ x: p[0] - ex * 3.5 * k * d + sx * 4.5 * k, y: p[1] - ey * 3.5 * k * d + sy * 4.5 * k + 1.8 * k, t: sc.letter });
    }
  }
  if (noSec) return g;
  secGeom(sc);
  const mp = secMap(sc), Pp = (u, v) => mp(u, v), sh = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const part of sc.G) {
    const S = part.map(s => { const p = Pp(s[0], s[1]), q = Pp(s[2], s[3]); return [p[0], p[1], q[0], q[1]]; });
    for (const s of S) { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); y1 = Math.max(y1, s[1], s[3]); }
    sh.push(S);
  }
  const step = Math.min(2, Math.max(0.8, Math.min(x1 - x0, y1 - y0) / 4));
  const W = s => [o[0] + s[0] * k, o[1] + s[1] * k, o[0] + s[2] * k, o[1] + s[3] * k];
  g.S = []; for (const S of sh) for (const s of S) g.S.push(W(s));
  for (const S of sh) for (const s of secHatch(S, step)) g.H.push(W(s));
  g.box = [o[0] + x0 * k, o[1] + y0 * k, o[0] + x1 * k, o[1] + y1 * k];
  g.lab = { x: (g.box[0] + g.box[2]) / 2, y: g.box[1] - 3 * k, t: secLabel(sc) };
  return g;
}
function secSvg(g, k, o) {
  const col = o.sel ? '#e0301e' : o.prev ? '#7aa7e0' : '#000000', f = v => String(Math.round(v * 100) / 100);
  const seg = a => a.map(q => 'M' + f(q[0]) + ' ' + f(q[1]) + 'L' + f(q[2]) + ' ' + f(q[3])).join('');
  const w = (mm, px) => f(o.exp ? mm : Math.max(px, mm * k));
  let s = '';
  if (g.C.length) s += `<path d="${seg(g.C)}" fill="none" stroke="${col}" stroke-width="${w(0.8, 2.2)}"/>`;
  if (g.O.length) s += `<path d="${seg(g.O)}" fill="none" stroke="${col}" stroke-width="${w(0.25, 1)}"/>`;
  if (g.F.length) s += `<path d="${g.F.map(t => 'M' + f(t[0]) + ' ' + f(t[1]) + 'L' + f(t[2]) + ' ' + f(t[3]) + 'L' + f(t[4]) + ' ' + f(t[5]) + 'Z').join('')}" fill="${col}" stroke="none"/>`;
  for (const t of g.T) s += `<text x="${f(t.x)}" y="${f(t.y)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="${col}" text-anchor="middle">${t.t}</text>`;
  if (g.S) {
    if (g.H.length) s += `<path d="${seg(g.H)}" fill="none" stroke="${col}" stroke-width="${w(0.18, 0.7)}"/>`;
    s += `<path d="${seg(g.S)}" fill="none" stroke="${col}" stroke-width="${w(0.5, 1.4)}" stroke-linecap="round"/>`;
    s += `<text x="${f(g.lab.x)}" y="${f(g.lab.y)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="${col}" text-anchor="middle">${g.lab.t}</text>`;
    if (!o.exp && !o.prev) { const b = g.box, m = 6; s += `<rect class="sh" data-s="${o.i}" x="${f(b[0] - m)}" y="${f(b[1] - m - 5 * k)}" width="${f(b[2] - b[0] + 2 * m)}" height="${f(b[3] - b[1] + 2 * m + 5 * k)}"/>`; }
  }
  return s;
}
const scrToPaper = (x, y) => { const o = toScr(sheetC), k = pxPerPaper(); return [(x - o[0]) / k, (y - o[1]) / k]; };
// почти горизонтальная / вертикальная линия на строгом виде — ровно
function secStraight(a, p) {
  const q = p.clone(); if (!view.strict) return q;
  const { R, U } = viewAxes(), dx = Math.abs(p[R] - a[R]), dy = Math.abs(p[U] - a[U]);
  if (dy < dx * 0.1) q[U] = a[U]; else if (dx < dy * 0.1) q[R] = a[R];
  return q;
}
function secSide(a, b, x, y) {
  const sa = toScr(a), sb = toScr(b), n = b.clone().sub(a).cross(viewDir()).normalize(), sn = toScr(a.clone().addScaledVector(n, 100));
  const ex = sb[0] - sa[0], ey = sb[1] - sa[1], c1 = ex * (y - sa[1]) - ey * (x - sa[0]), c2 = ex * (sn[1] - sa[1]) - ey * (sn[0] - sa[0]);
  return (c1 >= 0) === (c2 >= 0) ? 1 : -1;
}
function secHover(x, y) {
  if (!sd) sd = {};
  if (sd.sec) { hideHover(); sd.sec.pos = scrToPaper(x, y); drawOverlay(); return; }
  if (sd.b) { hideHover(); sd.s = secSide(sd.a, sd.b, x, y); drawOverlay(); return; }
  const s = snapDraw(x, y); showSnap(s);
  if (sd.a) sd.bh = secStraight(sd.a, s.p);
  drawOverlay();
}
function secClick(x, y) {
  if (!sd) sd = {};
  if (sd.sec) {                                            // положить на лист
    pushUndo(); secs.push(sd.sec); sd = null; $('st').textContent = L('h_sect'); drawOverlay(); syncPanel(); return;
  }
  if (!sd.a) { sd.a = snapDraw(x, y).p.clone(); $('st').textContent = L('h_sect2'); secHover(x, y); return; }
  if (!sd.b) {
    const b = secStraight(sd.a, snapDraw(x, y).p), pa = toScr(sd.a), pb = toScr(b);
    if (Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < 8) return;
    sd.b = b.clone(); hideHover(); $('st').textContent = L('h_sect3'); secHover(x, y); return;
  }
  const used = new Set(secs.map(q => q.letter)), letter = [...SEC_LET].find(c => !used.has(c)) || '?';
  const sc = { a: sd.a, b: sd.b, s: secSide(sd.a, sd.b, x, y), vdir: viewDir().clone(), fs: hideFac, letter, sN: 0, rot: 0, pos: scrToPaper(x, y), mk: metalCur };
  Object.assign(sc, secCut(sc));
  if (!sc.G.length) { toast(L('sect_empty')); sd = null; $('st').textContent = L('h_sect'); drawOverlay(); return; }
  sd = { sec: sc }; $('st').textContent = L('h_sect4'); drawOverlay();
}
function secAct(k, sc) {
  pushUndo();
  if (k === 'del') { secs.splice(secs.indexOf(sc), 1); selSec = null; }
  else if (k === 'rot') sc.rot = ((sc.rot || 0) + 90) % 360;
  else sc.sN = +k;
  ctxFor = null; drawOverlay(); syncPanel();
}
// ---------- разрез вида (Алексей 08.10, как у Юдина): плоскость на всю сцену, всё по одну сторону отсечено ----------
// Две точки — линия (почти ровная выпрямляется), третий щелчок — какую сторону оставить. Отсекается всё: мебель, стены,
// линии слоёв, коммуникации. По месту среза деталей — контур. На виде, где плоскость видна ребром, её линию можно
// тянуть мышью параллельно себе. Держится при смене видов; в 3D-модели не действует (только в кресленні).
let cd = null, capObj = null, clipDrag = null;             // cd — разрез в работе { a, bh, b }; capObj — контур среза
const CAP_MAT = new THREE.LineBasicMaterial({ color: 0x000000 });
function clipApply() {
  rend.clippingPlanes = drawOn && clipPl ? [clipPl] : [];
  if (capObj) capObj.visible = drawOn && !!clipPl;
  need();
}
// контур среза: треугольники видимых деталей ∩ плоскость (чуть к оставленной стороне, чтобы сам не отсёкся)
function clipCaps() {
  if (capObj) { scene.remove(capObj); capObj.geometry.dispose(); capObj = null; }
  if (!clipPl) return;
  root.updateMatrixWorld(true);
  const n = clipPl.normal, out = [], A = V3(), B = V3(), C = V3(), P = [A, B, C], sh = n.clone().multiplyScalar(0.05);
  for (const p of parts) {
    if (p.isL || !p.g.visible) continue;
    for (const m of p.meshes) {
      if (!shown(m) || m.userData.mark || isGlassMesh(m)) continue;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, mw = m.matrixWorld, cnt = idx ? idx.count : pos.count;
      for (let k = 0; k + 2 < cnt; k += 3) {
        for (let j = 0; j < 3; j++) P[j].fromBufferAttribute(pos, idx ? idx.getX(k + j) : k + j).applyMatrix4(mw);
        const D = P.map(q => clipPl.distanceToPoint(q) - 0.0007);
        if ((D[0] > 0 && D[1] > 0 && D[2] > 0) || (D[0] < 0 && D[1] < 0 && D[2] < 0)) continue;
        const X = [];
        for (let j = 0; j < 3; j++) { const q = (j + 1) % 3; if ((D[j] < 0) !== (D[q] < 0)) X.push(P[j].clone().lerp(P[q], D[j] / (D[j] - D[q])).add(sh)); }
        if (X.length === 2) out.push(X[0].x, X[0].y, X[0].z, X[1].x, X[1].y, X[1].z);
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  capObj = new THREE.LineSegments(g, CAP_MAT); capObj.renderOrder = 2; scene.add(capObj);
  clipApply();
}
function clipSet(a, b, s) {
  const t = b.clone().sub(a).normalize(), n = t.clone().cross(viewDir()).normalize().multiplyScalar(s);
  clipPl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, a);
  clipPl.userData = { a: a.clone(), b: b.clone() };
  clipCaps(); drawOverlay(); syncPanel();
}
function clipOff() { clipPl = null; clipCaps(); clipApply(); drawOverlay(); syncPanel(); }
function clipFlip() { if (!clipPl) return; clipPl.negate(); clipCaps(); drawOverlay(); }
// линия разреза видна на виде, где плоскость стоит ребром к взгляду
const clipEdgeOn = () => !!clipPl && Math.abs(clipPl.normal.dot(viewDir())) < 0.02;
function clipLine() {                                      // две точки линии на нынешнем виде: проекция сохранённых на плоскость
  const { a, b } = clipPl.userData, pa = clipPl.projectPoint(a, V3()), pb = clipPl.projectPoint(b, V3());
  return [pa, pb];
}
function clipPrims(k) {
  const [pa, pb] = clipLine(), sc = { a: pa, b: pb, vdir: viewDir(), letter: '' };
  // стрелки — куда смотрим (на оставленную сторону): для secPrims знак s так, чтобы n сечения совпал с нормалью плоскости
  const t = pb.clone().sub(pa).normalize(), n0 = t.clone().cross(viewDir()).normalize();
  sc.s = n0.dot(clipPl.normal) >= 0 ? 1 : -1;
  return secPrims(sc, [0, 0], k, toScr, true);
}
function clipHover(x, y) {
  if (!cd) cd = {};
  if (cd.b) { hideHover(); cd.s = secSide(cd.a, cd.b, x, y); drawOverlay(); return; }
  const s = snapDraw(x, y); showSnap(s);
  if (cd.a) cd.bh = secStraight(cd.a, s.p);
  drawOverlay();
}
function clipClick(x, y) {
  if (!cd) cd = {};
  if (!cd.a) { cd.a = snapDraw(x, y).p.clone(); $('st').textContent = L('h_clip2'); clipHover(x, y); return; }
  if (!cd.b) {
    const b = secStraight(cd.a, snapDraw(x, y).p), pa = toScr(cd.a), pb = toScr(b);
    if (Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < 8) return;
    cd.b = b.clone(); hideHover(); $('st').textContent = L('h_clip3'); clipHover(x, y); return;
  }
  const a = cd.a, b = cd.b, s = secSide(a, b, x, y);
  cd = null; setTool(null); clipSet(a, b, s); $('st').textContent = L('h_clip4');
}
// тянуть линию разреза: сдвиг плоскости вдоль её нормали; контур пересчитывается, когда отпустили
function clipDragTo(x, y, x0, y0, c0) {
  const P = onTargetPlane(x, y), P0 = onTargetPlane(x0, y0); if (!P || !P0) return;
  clipPl.constant = c0 - P.sub(P0).dot(clipPl.normal);
  if (capObj) capObj.visible = false;
  drawOverlay(); need();
}
// ---------- щелчковые цепочки (Алексей 06.10): габариты модулей, размеры фасадов, полезные в проёме ----------
// Первый раз — нажать на модуль / фасад / в проём и, не отпуская, потянуть: повёл вверх-вниз — горизонтальный размер
// (ширина), вправо-влево — вертикальный (высота); где отпустил — там линия. Дальше — просто щелчки: размер встаёт на ту
// же линию (брать можно через один). Кнопку выключил и включил (или сменил вид) — новая цепочка.
// Модуль меряется по габаритной рамке из Базиса (рамки стоят встык — компенсационный зазор в размер не попадает);
// нет рамки или она не сходится с деталями — по деталям. Фасад — по своим деталям, без петель и ручек.
let mc = null, chainSeq = 0, tChain = 0;                    // { id, axis, line } — нынешняя цепочка
function mcReset() { mc = { id: ++chainSeq, axis: null, line: 0 }; }
function frameBoxOf(i, u) {
  if (!M.nfbox) return null;
  const h = parts[i].h;
  for (let k = h.length - 1; k >= 0; k--) {
    const id = h[k]; if (id !== u && REP[id] !== u) continue;
    const f = M.nfbox[id]; if (!f) continue;
    const b = new THREE.Box3();
    for (const x of [f[0], f[3]]) for (const y of [f[1], f[4]]) for (const z of [f[2], f[5]]) b.expandByPoint(root.localToWorld(new THREE.Vector3(x, y, z)));
    return b;
  }
  return null;
}
// модуль — самая нижняя сборочная единица детали, у которой есть неподвижные стенки (корпус): антресоль, нижний
// блок, шкаф целиком; ящик (TANDEM — стенки едут) пропускается, группа «Шкафы слева» — только если ниже ничего нет
// (050_8: группа > шкаф > антресоль / нижний блок > ящики; на ручных листах цепочки — по антресолям и нижним блокам)
function moduleOf(i) {
  for (const u of asmChain(i)) if (partsUnder(u).some(j => isWall(j))) return u;
  const v = parts[i].v; return v.length ? v[v.length - 1] : null;
}
function moduleBox(i) {
  const u = moduleOf(i);
  if (u === null) return null;
  root.updateMatrixWorld(true);
  const mb = new THREE.Box3();
  for (const j of partsUnder(u)) { const p = parts[j]; if (p.isL || !p.g.visible) continue; for (const m of p.meshes) mb.expandByObject(m); }
  if (mb.isEmpty()) return null;
  const fb = frameBoxOf(i, u);
  const name = M.names[u] || 'модуль';
  if (fb && ['x', 'y', 'z'].every(k => Math.abs(fb.min[k] - mb.min[k]) < 60 && Math.abs(fb.max[k] - mb.max[k]) < 60)) return { b: fb, src: 'по рамке', name };
  return { b: mb, src: 'по деталям', name };
}
function facadeBox(i) {
  if (!M.door) return null;
  const D = new Set(M.door), id = parts[i].h.find(q => D.has(q));
  if (id === undefined) return null;
  root.updateMatrixWorld(true);
  const b = new THREE.Box3();
  for (const j of partsUnder(id)) { const p = parts[j]; if (p.isF || p.isL || !p.g.visible) continue; for (const m of p.meshes) b.expandByObject(m); }
  return b.isEmpty() ? null : { b, src: '', name: M.names[id] || 'фасад' };
}
// что под курсором: рамка модуля / фасада или размеры проёма (как у «полезных», только собранные)
function pressTarget(x, y) {
  if (drawTool === 'easy') {
    easyCollect = [];
    let L; try { easyPick(x, y); } finally { L = easyCollect; easyCollect = null; }
    return L.length ? { list: L } : null;
  }
  const h = pick(x, y); if (!h) return null;
  const i = h.object.userData.idx; if (parts[i].isL) return null;
  if (drawTool === 'fac') {
    if (hideFac) { toast('фасады спрятаны'); return null; }
    const r = facadeBox(i); if (!r) toast('это не фасад'); return r;
  }
  return moduleBox(i);
}
// размеры цели вдоль оси ax на линии line (координата поперёк размера); выносные — от ближней к линии стороны,
// линия внутри цели — размер прямо на ней, без выносных
function pressDims(t, ax, line) {
  const wk = mainAxis(perpAxis(ax));
  if (t.b) {
    const b = t.b, { D } = viewAxes(), zF = viewDir()[D] < 0 ? b.max[D] : b.min[D];
    const near = Math.min(Math.max(line, b.min[wk]), b.max[wk]);
    const P = v => { const p = V3(); p[ax] = v; p[wk] = near; p[D] = zF; return p; };
    return [{ a: P(b.min[ax]), b: P(b.max[ax]), text: null }];
  }
  const ok = q => q.label !== 'штанга від підлоги';
  const q = t.list.find(z => z.label === 'проріз' && axisOf(z.a, z.b) === ax) || t.list.find(z => ok(z) && axisOf(z.a, z.b) === ax);
  if (!q) return [];
  const cr = t.list.find(z => ok(z) && axisOf(z.a, z.b) === wk);
  const lo = cr ? Math.min(cr.a[wk], cr.b[wk]) : -Infinity, hi = cr ? Math.max(cr.a[wk], cr.b[wk]) : Infinity;
  const near = Math.min(Math.max(line, lo), hi), a = q.a.clone(), b = q.b.clone();
  if (isFinite(near)) { a[wk] = near; b[wk] = near; }
  return [{ a, b, text: q.text != null ? q.text : null }];
}
function pressPrev(t, ax, line) {
  const out = pressDims(t, ax, line); if (!out.length) return null;
  const w = perpAxis(ax);
  return { a: out[0].a, b: out[0].b, axis: ax, off: w.multiplyScalar(line - out[0].a.dot(w)), text: out[0].text };
}
function pressCommit(t, ax, line) {
  const out = pressDims(t, ax, line);
  if (!out.length) { toast(ax === viewAxes().U ? 'тут нечего мерить по высоте' : 'тут нечего мерить по ширине'); return false; }
  // тот же модуль ещё раз — второй размер поверх первого не ставим
  const same = (d, q) => d.chain === mc.id && ((d.a.distanceTo(q.a) < 0.5 && d.b.distanceTo(q.b) < 0.5) || (d.a.distanceTo(q.b) < 0.5 && d.b.distanceTo(q.a) < 0.5));
  const add = out.filter(q => !dims.some(d => same(d, q)));
  const what = t.name ? t.name + ' — ' : '', len = Math.round(Math.abs(out[0].b.clone().sub(out[0].a).dot(AX[ax])));
  if (!add.length) { $('st').textContent = what + len + ' — уже стоит'; return true; }
  pushUndo();
  for (const q of add) {
    const dm = addDim(q.a, q.b, q.text != null ? { text: q.text } : null), w = perpAxis(ax);
    dm.axis = ax; dm.off = w.multiplyScalar(line - q.a.dot(w)); dm.chain = mc.id; buildDim(dm);
  }
  $('st').textContent = what + (q0 => q0.text != null ? q0.text : len)(out[0]) + (t.src ? ' (' + t.src + ')' : '');
  return true;
}
function pressMove(d, x, y) {
  const p = d.press;
  if (mc.axis !== null) return;                             // линия уже задана первым размером
  if (!p.ax) {
    const dx = x - d.x0, dy = y - d.y0; if (Math.hypot(dx, dy) < 6) return;
    const { R, U } = viewAxes(); p.ax = Math.abs(dy) >= Math.abs(dx) ? R : U;
  }
  const P = onTargetPlane(x, y); if (!P) return;
  p.line = P.dot(perpAxis(p.ax));
  preview = pressPrev(p.t, p.ax, p.line); drawOverlay();
}
function pressUp(d) {
  const p = d.press; preview = null;
  if (mc.axis === null) {
    if (!p.ax) { $('st').textContent = L('h_press'); drawOverlay(); return; }
    if (pressCommit(p.t, p.ax, p.line)) { mc.axis = p.ax; mc.line = p.line; $('st').textContent += L('h_more'); }
  } else pressCommit(p.t, mc.axis, mc.line);
  drawOverlay();
}
// ---------- габариты: модули (сборочные единицы) видимого, выделенное по Enter ----------
// Модули — самые верхние сборочные единицы видимых деталей (галочки Базиса; нет галочек — верхний блок).
// Ширины модулей — цепочкой снизу, под ними общая ширина; высоты модулей — слева (одна на каждую разную высоту),
// общая высота — справа. Отступы — 9 мм бумаги при любом масштабе. Всё — в осях вида (сбоку ширина = глубина).
function unitBoxes() {
  root.updateMatrixWorld(true);
  const map = new Map();
  parts.forEach((p, i) => {
    if (p.isL || !p.g.visible) return;
    const ch = asmChain(i), u = ch.length ? ch[ch.length - 1] : (p.v.length ? p.v[p.v.length - 1] : null);
    if (u === null) return;
    if (!map.has(u)) map.set(u, new THREE.Box3());
    for (const m of p.meshes) map.get(u).expandByObject(m);
  });
  return [...map.values()].filter(b => !b.isEmpty());
}
function boxTools(all) {
  const { R, U, D, rs, us } = viewAxes(), d = viewDir(), zF = d[D] < 0 ? all.max[D] : all.min[D];
  const P = (h, v) => { const p = V3(); p[R] = h; p[U] = v; p[D] = zF; return p; };
  const put = (a, b, offAx, offV, tag) => { if (a.distanceTo(b) < 1) return; const dm = addDim(a, b); dm.off = AX[offAx].clone().multiplyScalar(offV); dm.auto = tag; buildDim(dm); };
  return { R, U, rs, us, P, put, lo: b => us > 0 ? b.min[U] : b.max[U], le: b => rs > 0 ? b.min[R] : b.max[R], ri: b => rs > 0 ? b.max[R] : b.min[R], g: 9 * drawN };
}
function autoDims() {
  const F = flags();
  for (const dm of dims.filter(q => q.auto && q.auto !== 'gab' && dimHere(q))) removeDim(dm);
  if (!F.mod && !F.all) { drawOverlay(); return; }
  const B = unitBoxes(); if (!B.length) { toast('на виде нет модулей'); return; }
  const all = new THREE.Box3(); B.forEach(b => all.union(b));
  const { R, U, rs, us, P, put, lo, le, ri, g } = boxTools(all), low = lo(all);
  if (F.mod) {
    for (const b of B) put(P(b.min[R], lo(b)), P(b.max[R], lo(b)), U, low - us * g - lo(b), 'mod');
    const seen = [];
    B.slice().sort((p, q) => (q.max[U] - q.min[U]) - (p.max[U] - p.min[U])).forEach(b => {
      if (seen.some(s => Math.abs(s[0] - b.min[U]) < 1 && Math.abs(s[1] - b.max[U]) < 1)) return;
      seen.push([b.min[U], b.max[U]]);
      const e = le(b);
      put(P(e, b.min[U]), P(e, b.max[U]), R, le(all) - rs * g * seen.length - e, 'mod');
    });
  }
  if (F.all) {
    put(P(all.min[R], low), P(all.max[R], low), U, -us * g * (F.mod ? 2 : 1), 'all');
    const e = ri(all); put(P(e, all.min[U]), P(e, all.max[U]), R, rs * g, 'all');
  }
  drawOverlay();
}
function gabCommit() {
  if (!selSet.length) { toast('выделите модули (Shift — несколько), потом Enter'); return; }
  root.updateMatrixWorld(true);
  const b = new THREE.Box3();
  for (const i of selSet) { const p = parts[i]; if (!effVisible(p) || p.isL) continue; for (const m of p.meshes) b.expandByObject(m); }
  if (b.isEmpty()) return;
  pushUndo();
  // размеры — снаружи всего вида (третьим рядом, за габаритами модулей и общим), выносные тянутся от выделенного
  const all = visibleBox(false), { R, U, rs, us, P, put, lo, le, g } = boxTools(b), low = lo(b), e = le(b);
  put(P(b.min[R], low), P(b.max[R], low), U, lo(all) - us * g * 3 - low, 'gab');
  put(P(e, b.min[U]), P(e, b.max[U]), R, le(all) - rs * g * 3 - e, 'gab');
  clearSel(); drawOverlay();
}
// ---------- Ctrl+Z / Ctrl+Y: размеры, спрятанное, фасады ----------
const undoS = [], redoS = [];
function stateNow() {
  return { dims: dims.map(d => ({ a: d.a.toArray(), b: d.b.toArray(), axis: d.axis, off: d.off.toArray(), label: d.label, text: d.text, vdir: d.vdir ? d.vdir.toArray() : null, auto: d.auto, chain: d.chain, fs: d.fs, ang: d.ang ? { c: d.ang.c.toArray(), p: d.ang.p.toArray() } : null })),
           ph: parts.map(p => p.hidden ? '1' : '0').join(''), nh: Object.keys(nodes).filter(k => nodes[k].hidden), fac: hideFac, af: JSON.stringify(autoFlags),
           secs: secs.map(q => ({ a: q.a.toArray(), b: q.b.toArray(), s: q.s, vdir: q.vdir.toArray(), fs: q.fs, letter: q.letter, sN: q.sN, rot: q.rot, pos: q.pos.slice(), pi: q.pi })) };
}
function pushUndo() { if (!drawOn) return; undoS.push(stateNow()); if (undoS.length > 80) undoS.shift(); redoS.length = 0; }
function restoreState(s) {
  selDim = null; preview = null;
  while (dims.length) removeDim(dims[0]);
  easyDims.length = 0; partDims.length = 0; gabDims.length = 0;
  for (const q of s.dims) {
    const dm = addDim(new THREE.Vector3().fromArray(q.a), new THREE.Vector3().fromArray(q.b), { label: q.label, text: q.text, fs: q.fs });
    dm.axis = q.axis; dm.off = new THREE.Vector3().fromArray(q.off); dm.vdir = q.vdir ? new THREE.Vector3().fromArray(q.vdir) : null; dm.auto = q.auto; dm.chain = q.chain;
    if (q.ang) dm.ang = { c: new THREE.Vector3().fromArray(q.ang.c), p: new THREE.Vector3().fromArray(q.ang.p) };
    buildDim(dm);
  }
  parts.forEach((p, i) => { p.hidden = s.ph[i] === '1'; });
  for (const k in nodes) nodes[k].hidden = s.nh.includes(k);
  hideFac = s.fac; setOn('bFac', hideFac);
  for (const k in autoFlags) delete autoFlags[k];
  Object.assign(autoFlags, JSON.parse(s.af));
  // сечения: тот же разрез заново по тем же деталям (рисунок не храним — он считается из модели)
  const old = new Map(secs.map(q => [q.letter + q.a.toArray() + q.b.toArray() + q.s, q]));
  selSec = null; secs.length = 0;
  for (const q of s.secs || []) {
    const sc = { a: new THREE.Vector3().fromArray(q.a), b: new THREE.Vector3().fromArray(q.b), s: q.s, vdir: new THREE.Vector3().fromArray(q.vdir), fs: q.fs,
                 letter: q.letter, sN: q.sN, rot: q.rot, pos: q.pos.slice(), pi: q.pi };
    const was = old.get(q.letter + q.a + q.b + q.s); if (was) { sc.G = was.G; sc.box = was.box; }
    secs.push(sc);
  }
  applyVis(); renderTree(); syncPanel(); drawOverlay();
}
function drawUndo() { if (!undoS.length) { toast('отменять нечего'); return; } redoS.push(stateNow()); restoreState(undoS.pop()); }
function drawRedo() { if (!redoS.length) { toast('возвращать нечего'); return; } undoS.push(stateNow()); restoreState(redoS.pop()); }

const DVIEWS = { front: [0, 0], back: [Math.PI, 0], left: [-Math.PI / 2, 0], right: [Math.PI / 2, 0], top: [0, Math.PI / 2], bottom: [0, -Math.PI / 2], iso: [Math.PI / 4, 0.6155] };
// ---------- креслення: оформление как у чертёжных программ (Алексей 07.10, образец — FurniDraft) ----------
// Сверху лента: вкладки, в них группы кнопок (значок + подпись, подпись группы снизу). Над листом — строка значков
// с выпадающими списками; у выделенного размера — плашка действий; справа — листы зоны и предпросмотр; снизу —
// тёмная строка-подсказка. Оформление (светлое / тёмное / синее) и язык (русский / українська) — вкладка «Настройки».
const DS = (b, s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const cube = (t, f, r) => `<polygon points="${CT}" fill="currentColor" fill-opacity="${t}"/><polygon points="${CF}" fill="currentColor" fill-opacity="${f}"/><polygon points="${CR}" fill="currentColor" fill-opacity="${r}"/>`;
const MIR = s => `<g transform="matrix(-1 0 0 1 24 0)">${s}</g>`;
const TXT = t => `<text x="12" y="16" text-anchor="middle" font-size="10.5" font-weight="700" font-family="system-ui,sans-serif" fill="currentColor" stroke="none">${t}</text>`;
const DIC = {
  front: cube(0, .6, 0), right: cube(0, 0, .6), top: cube(.6, 0, 0), left: MIR(cube(0, 0, .6)),
  back: `<g stroke-dasharray="2 1.6">${cube(0, .22, 0)}</g>`, iso: cube(.18, .55, .32),
  lines: '<path d="M4 7.5L12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',
  color: '<path d="M12 3.5s6 6.6 6 10.5a6 6 0 0 1-12 0c0-3.9 6-10.5 6-10.5z" fill="currentColor" fill-opacity=".35"/>',
  hid: '<rect x="3" y="6" width="12" height="12" stroke-width="1.8"/><path d="M9 3h12v12" stroke-dasharray="2 2" stroke-opacity=".55"/>',
  clip: '<path d="M3 9l9-5 9 5v10l-9-4-9 4z" fill="currentColor" fill-opacity=".18"/><path d="M12 2v20" stroke-width="2" stroke-dasharray="4 2 1 2"/>',
  clipflip: '<path d="M12 3v18" stroke-dasharray="4 2 1 2"/><path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
  clipoff: '<path d="M12 3v18" stroke-dasharray="4 2 1 2"/><path d="M5 5l14 14" stroke-width="2"/>',
  nofac: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M15 12h1"/><path d="M3 21L21 3" stroke-width="2"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6"/>',
  showall: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  tree: '<circle cx="4.5" cy="7" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="17" r="1.4" fill="currentColor"/><path d="M9 7h11M9 12h11M9 17h11"/>',
  sel: '<path d="M6 3l12 7.5-5.2 1.3 3 5.6-2.4 1.3-3-5.6L6 17z"/>',
  lin: '<path d="M3 6v12M21 6v12M3 12h18"/><path d="M6 10l-3 2 3 2M18 10l3 2-3 2"/>',
  chain: '<path d="M3 7v10M11 7v10M21 7v10M3 12h18"/><path d="M5.5 10.5L3 12l2.5 1.5M8.5 10.5L11 12l-2.5 1.5M13.5 10.5L11 12l2.5 1.5M18.5 10.5L21 12l-2.5 1.5"/>',
  base: '<path d="M4 3v18"/><path d="M4 8h7M4 13h11M4 18h15"/><path d="M9 6.5L11 8l-2 1.5M13 11.5l2 1.5-2 1.5M17 16.5l2 1.5-2 1.5"/>',
  gab: '<rect x="5" y="9" width="14" height="11"/><path d="M5 5h14M5 3.5v3M19 3.5v3"/><path d="M8 13h8M8 16h5" stroke-dasharray="1.5 1.5"/>',
  ang: '<path d="M4 20L18 6M4 20h16"/><path d="M15 20A11 11 0 0 0 11.8 12.2"/>',
  mod: '<rect x="3" y="8" width="8" height="13"/><rect x="13" y="8" width="8" height="13"/><path d="M3 4.5h18M3 3v3M11 3v3M13 3v3M21 3v3"/>',
  fac: '<rect x="3.5" y="8" width="7.5" height="13" rx=".6"/><rect x="13" y="8" width="7.5" height="13" rx=".6"/><path d="M9 13.5v2M15 13.5v2M3.5 4.5h17M3.5 3v3M20.5 3v3"/>',
  easy: '<path d="M4 3v18M20 3v18M4 4h16M4 20h16M4 12h16"/><path d="M12 5.5v5M10.5 7L12 5.5 13.5 7M10.5 9L12 10.5 13.5 9"/>',
  all: '<rect x="7" y="4" width="13" height="13"/><path d="M7 21h13M7 19.5v3M20 19.5v3M3 4v13M1.5 4h3M1.5 17h3"/>',
  tick: '<path d="M3 12h18M4 7v10M20 7v10M2 14.5l4-5M18 14.5l4-5"/>',
  arrow: '<path d="M3 12h18M3 7v10M21 7v10"/><path d="M3 12l4.5-2.2v4.4zM21 12l-4.5-2.2v4.4z" fill="currentColor"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  clr: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  dia: '<circle cx="12" cy="12" r="7.5"/><path d="M6.7 17.3L17.3 6.7"/><path d="M14 6.7h3.3V10"/>',
  rad: '<circle cx="12" cy="12" r="7.5"/><path d="M12 12l5.3-5.3"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  lead: '<path d="M4 20l7-7h9"/><circle cx="4" cy="20" r="1.4" fill="currentColor"/><path d="M12 9.5h8"/>',
  pos: '<circle cx="16" cy="8" r="5"/><path d="M3.5 20.5l8.8-8.8"/><circle cx="3.5" cy="20.5" r="1.3" fill="currentColor"/>',
  cut: '<path d="M4 3.5h5M4 3.5v4.5M20 20.5h-5M20 20.5V16"/><path d="M4 20L20 4" stroke-dasharray="3.2 2"/>',
  sect: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 12l8-4 8 4-8 4z" fill="currentColor" fill-opacity=".3"/>',
  detail: '<circle cx="9" cy="9" r="5.5"/><path d="M13 13l2.5 2.5"/><rect x="15" y="15" width="6" height="6"/>',
  svg: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 10v7M9 14l3 3 3-3"/>',
  png: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8.5" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 4-5 5 5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  th_light: '<rect x="3" y="5" width="18" height="14" rx="1.5" fill="#ffffff"/><path d="M3 9.5h18"/><rect x="5" y="11.5" width="6" height="5" fill="#d8dde3" stroke="none"/>',
  th_dark: '<rect x="3" y="5" width="18" height="14" rx="1.5" fill="#2b2d31"/><path d="M3 9.5h18" stroke="#8a8f98"/><rect x="5" y="11.5" width="6" height="5" fill="#4c9be8" stroke="none"/>',
  th_blue: '<rect x="3" y="5" width="18" height="14" rx="1.5" fill="#ffffff"/><path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v3H3z" fill="#2b579a" stroke="#2b579a"/><rect x="5" y="11.5" width="6" height="5" fill="#2b579a" stroke="none"/>',
  ru: TXT('Ру'), uk: TXT('Ук'),
  exit: '<path d="M4 7.5L12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',
  chev: '<path d="M6 9l6 6 6-6"/>', chevR: '<path d="M9 6l6 6-6 6"/>', chevL: '<path d="M15 6l-6 6 6 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/>',
  del: '<path d="M6 6l12 12M18 6L6 18"/>',
  delchain: '<path d="M3 9h7M14 9h7M3 6v6M10 6v6M14 6v6M21 6v6"/><path d="M8 15l8 6M16 15l-8 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  dimfly: '<path d="M3 6v12M21 6v12M3 12h18"/>',
  metal: '<rect x="3" y="7" width="18" height="10"/><rect x="5.5" y="9.5" width="13" height="5"/><circle cx="8" cy="12" r=".9" fill="currentColor"/><circle cx="16" cy="12" r=".9" fill="currentColor"/>',
  tex: '<rect x="3" y="4" width="8" height="16"/><rect x="13" y="4" width="8" height="16"/><path d="M5 7c2 3 2 7 0 10M8.5 6c1.5 4 1.5 8 0 12M15 7c2 3 2 7 0 10M18.5 6c1.5 4 1.5 8 0 12"/>',
  join: '<rect x="3" y="3" width="18" height="18"/><rect x="7" y="7" width="10" height="10"/><path d="M3 3l4 4M21 3l-4 4M3 21l4-4M21 21l-4-4"/>',
};
const DTXT = {
  ru: {
    exit: 'Модель', tab_view: 'Вид', tab_dims: 'Размеры', tab_marks: 'Обозначения', tab_sheet: 'Лист', tab_set: 'Настройки',
    g_views: 'Виды', g_look: 'Отображение', g_fac: 'Фасады', g_scale: 'Масштаб', g_show: 'Показ',
    g_put: 'Проставить', g_auto: 'По модели', g_ends: 'Концы', g_edit: 'Правка',
    g_mdia: 'Отверстия', g_mlead: 'Выноски', g_mcut: 'Разрезы', g_frame: 'Кадр', g_save: 'Сохранить', g_folder: 'Папки отчёта',
    g_theme: 'Оформление', g_lang: 'Язык',
    front: 'Спереди', back: 'Сзади', left: 'Слева', right: 'Справа', top: 'Сверху', iso: 'Изометрия',
    lines: 'Линии', color: 'Цвет', hid: 'Невидимые', t_hid: 'Линии за деталями — тонкие светлые, на экране и в листе SVG', nofac: 'Без фасадов',
    g_clipg: 'Разрез вида', clip: 'Провести', clipflip: 'Развернуть', clipoff: 'Снять',
    t_clip: 'Плоскость на всю сцену: всё по одну сторону отсекается (мебель, стены, слои). Удобно ставить на виде сверху',
    t_clipflip: 'Оставить другую сторону', t_clipoff: 'Вернуть всё отсечённое',
    h_clip: 'Разрез вида: первая точка линии (удобно на виде сверху)', h_clip2: 'Разрез вида: вторая точка линии (почти ровная — выпрямится)',
    h_clip3: 'Разрез вида: щелчок с той стороны, которую оставить',
    h_clip4: 'Разрез стоит. На виде, где он виден линией, линию можно тянуть мышью. «Развернуть» — другая сторона, «Снять» — всё вернуть', fit: 'Вписать', showall: 'Показать всё', tree: 'Структура',
    sel: 'Выбор', lin: 'Линейный', chain: 'Цепочка', base: 'От базы', gab: 'Габаритный', ang: 'Угловой',
    h_ang: 'Угловой: вершина угла, точка на одной стороне, точка на другой, потом щелчок — где встанет дуга',
    mod: 'Модули', fac: 'Фасады', easy: 'Проёмы', all: 'Общий габарит',
    tick: 'Засечки', arrow: 'Стрелки', undo: 'Отменить', redo: 'Вернуть', clr: 'Стереть вид',
    dia: 'Диаметр', rad: 'Радиус', lead: 'Выноска', pos: 'Позиции', cut: 'Разрез', sect: 'Сечение', detail: 'Местный вид',
    svg: 'Лист SVG', png: 'Снимок PNG', refresh: 'Обновить',
    th_light: 'Светлое', th_dark: 'Тёмное', th_blue: 'Синее', ru: 'Русский', uk: 'Українська',
    dimfly: 'Размеры', autofly: 'Размеры по модели', endfly: 'Концы размеров', pcol: 'Свернуть / развернуть',
    scaleAuto: 'по виду', scaleFix: 'закрепить 1:', frameName: 'название кадра', frameHint: 'так назовётся файл',
    noScale: 'перспектива — без масштаба', fixed: 'закреплён', byView: 'по виду',
    e_text: 'Текст', e_reset: 'Исходный', e_del: 'Удалить', e_delchain: 'Цепочку',
    p_sheets: 'Листы зоны', p_draw: 'Листы', p_shot: 'Снимки', p_empty: 'пусто', p_prev: 'Предпросмотр',
    p_noSrv: 'локальный сервер не отвечает', p_noZone: 'нет папки заказа — перевыгрузите проект из Базиса',
    soon: 'будет следующим шагом',
    idle: 'Щелчок по размеру — его действия. Левая кнопка двигает лист, колесо приближает. Ctrl+Z — отменить.',
    n_front: 'вид спереди', n_back: 'вид сзади', n_left: 'вид слева', n_right: 'вид справа', n_top: 'вид сверху', n_iso: 'изометрия', n_nofac: ' без фасадов',
    h_lin: 'Линейный: две точки (угол или линия), потом щелчок — куда встанет размер',
    h_chain: 'Цепочка: две точки и место, дальше — следующие точки. Esc или правая кнопка — закончить',
    h_base: 'От базы: база (точка или линия), вторая точка и место, дальше — следующие точки. Esc — закончить',
    h_gab: 'Габаритный: выделите модули (Shift — несколько) и нажмите Enter',
    h_mod: 'Модули: нажмите на модуль и потяните (вверх-вниз — ширина, вправо-влево — высота), отпустите на месте линии; дальше — щелчки по модулям',
    h_fac: 'Фасады: нажмите на фасад и потяните (вверх-вниз — ширина, вправо-влево — высота), отпустите на месте линии; дальше — щелчки по фасадам',
    h_easy: 'Проёмы: нажмите в проём и потяните (вправо-влево — высота, вверх-вниз — ширина), отпустите на месте линии; дальше — щелчки по проёмам',
    h_next: 'Следующая точка. Esc или правая кнопка — закончить',
    h_press: 'Нажмите и, не отпуская, потяните: вверх-вниз — ширина, вправо-влево — высота',
    h_more: '. Дальше — щелчки: встанут на эту линию; новая цепочка — выключить и включить кнопку',
    t_exit: 'Вернуться к 3D-модели', t_lines: 'Белые детали и чёрные рёбра — как на чертеже', t_color: 'Как в 3D — для снимков',
    t_nofac: 'Спрятать двери и фасады ящиков — лист «без фасадов»', t_fit: 'Пересчитать масштаб и вписать лист в экран',
    t_showall: 'Вернуть всё спрятанное', t_tree: 'Структура модели слева', t_sel: 'Без инструмента: щелчок выделяет деталь или размер',
    t_all: 'Общая ширина снизу и общая высота справа — на этом виде', t_tick: 'Концы размеров — засечки 45°', t_arrow: 'Концы размеров — стрелки',
    t_undo: 'Ctrl+Z', t_redo: 'Ctrl+Y', t_clr: 'Убрать все размеры этого вида',
    t_svg: 'Рёбра и размеры — векторный файл в папку отчёта', t_png: 'Картинка листа, как на экране, — в папку визуализаций',
    t_refresh: 'Перечитать, что лежит в папках отчёта', t_dimfly: 'Линейный, цепочка, от базы, габаритный',
    t_autofly: 'Модули, фасады, проёмы', t_endfly: 'Засечки или стрелки',
    t_sect: 'Профиль детали по линии А–А: срез со штриховкой рядом на листе, в своём масштабе',
    h_sect: 'Сечение: первая точка линии А–А', h_sect2: 'Сечение: вторая точка линии (почти ровная — выпрямится)',
    h_sect3: 'Сечение: щелчок с той стороны, куда смотреть', h_sect4: 'Сечение: щелчок — положить на лист. Потом щелчок по сечению — масштаб, поворот',
    sect_empty: 'линия не пересекает ни одной детали', s_view: 'как вид', s_rot: 'Повернуть',
    metal: 'Металл', g_metal: 'Металлоизделия', t_metal: 'Лист на каждый металлический полуфабрикат: размеры и подписи по модели',
    tex: 'Переход текстуры', g_tex: 'Шпон', t_tex: 'Лист на каждую группу шпона (окно «Раскладка по текстуре», галочка «Шпон»): панели как стоят, зазоры, выноски под номера Вияра',
    join: 'Столярка', g_join: 'Рамочные фасады', t_join: 'Лист на изделие с рамочными фасадами: фасады как стоят, размеры, таблица, сечение рамки, отделка (двойной щелчок — вписать)',
  },
  uk: {
    exit: 'Модель', tab_view: 'Вигляд', tab_dims: 'Розміри', tab_marks: 'Позначення', tab_sheet: 'Аркуш', tab_set: 'Налаштування',
    g_views: 'Види', g_look: 'Відображення', g_fac: 'Фасади', g_scale: 'Масштаб', g_show: 'Показ',
    g_put: 'Проставити', g_auto: 'За моделлю', g_ends: 'Кінці', g_edit: 'Правка',
    g_mdia: 'Отвори', g_mlead: 'Виноски', g_mcut: 'Розрізи', g_frame: 'Кадр', g_save: 'Зберегти', g_folder: 'Теки звіту',
    g_theme: 'Оформлення', g_lang: 'Мова',
    front: 'Спереду', back: 'Ззаду', left: 'Зліва', right: 'Справа', top: 'Згори', iso: 'Ізометрія',
    lines: 'Лінії', color: 'Колір', hid: 'Невидимі', t_hid: 'Лінії за деталями — тонкі світлі, на екрані й в аркуші SVG', nofac: 'Без фасадів',
    g_clipg: 'Розріз виду', clip: 'Провести', clipflip: 'Розвернути', clipoff: 'Зняти',
    t_clip: 'Площина на всю сцену: все з одного боку відсікається (меблі, стіни, шари). Зручно ставити на виді згори',
    t_clipflip: 'Залишити інший бік', t_clipoff: 'Повернути все відсічене',
    h_clip: 'Розріз виду: перша точка лінії (зручно на виді згори)', h_clip2: 'Розріз виду: друга точка лінії (майже рівна — випрямиться)',
    h_clip3: 'Розріз виду: клік з того боку, який залишити',
    h_clip4: 'Розріз стоїть. На виді, де він видно лінією, лінію можна тягнути мишею. «Розвернути» — інший бік, «Зняти» — все повернути', fit: 'Вписати', showall: 'Показати все', tree: 'Структура',
    sel: 'Вибір', lin: 'Лінійний', chain: 'Ланцюжок', base: 'Від бази', gab: 'Габаритний', ang: 'Кутовий',
    h_ang: 'Кутовий: вершина кута, точка на одній стороні, точка на іншій, потім клік — де стане дуга',
    mod: 'Модулі', fac: 'Фасади', easy: 'Прорізи', all: 'Загальний габарит',
    tick: 'Засічки', arrow: 'Стрілки', undo: 'Скасувати', redo: 'Повернути', clr: 'Стерти вид',
    dia: 'Діаметр', rad: 'Радіус', lead: 'Виноска', pos: 'Позиції', cut: 'Розріз', sect: 'Переріз', detail: 'Місцевий вид',
    svg: 'Аркуш SVG', png: 'Знімок PNG', refresh: 'Оновити',
    th_light: 'Світле', th_dark: 'Темне', th_blue: 'Синє', ru: 'Русский', uk: 'Українська',
    dimfly: 'Розміри', autofly: 'Розміри за моделлю', endfly: 'Кінці розмірів', pcol: 'Згорнути / розгорнути',
    scaleAuto: 'за видом', scaleFix: 'закріпити 1:', frameName: 'назва кадру', frameHint: 'так називатиметься файл',
    noScale: 'перспектива — без масштабу', fixed: 'закріплено', byView: 'за видом',
    e_text: 'Текст', e_reset: 'Початковий', e_del: 'Видалити', e_delchain: 'Ланцюжок',
    p_sheets: 'Аркуші зони', p_draw: 'Аркуші', p_shot: 'Знімки', p_empty: 'порожньо', p_prev: 'Попередній перегляд',
    p_noSrv: 'локальний сервер не відповідає', p_noZone: 'немає теки замовлення — перевивантажте проєкт з Базиса',
    soon: 'буде наступним кроком',
    idle: 'Клік по розміру — його дії. Ліва кнопка рухає аркуш, коліщатко наближає. Ctrl+Z — скасувати.',
    n_front: 'вигляд спереду', n_back: 'вигляд ззаду', n_left: 'вигляд зліва', n_right: 'вигляд справа', n_top: 'вигляд згори', n_iso: 'ізометрія', n_nofac: ' без фасадів',
    h_lin: 'Лінійний: дві точки (кут або лінія), потім клік — де стане розмір',
    h_chain: 'Ланцюжок: дві точки і місце, далі — наступні точки. Esc або права кнопка — завершити',
    h_base: 'Від бази: база (точка або лінія), друга точка і місце, далі — наступні точки. Esc — завершити',
    h_gab: 'Габаритний: виділіть модулі (Shift — кілька) і натисніть Enter',
    h_mod: 'Модулі: натисніть на модуль і потягніть (вгору-вниз — ширина, вправо-вліво — висота), відпустіть на місці лінії; далі — кліки по модулях',
    h_fac: 'Фасади: натисніть на фасад і потягніть (вгору-вниз — ширина, вправо-вліво — висота), відпустіть на місці лінії; далі — кліки по фасадах',
    h_easy: 'Прорізи: натисніть у проріз і потягніть (вправо-вліво — висота, вгору-вниз — ширина), відпустіть на місці лінії; далі — кліки по прорізах',
    h_next: 'Наступна точка. Esc або права кнопка — завершити',
    h_press: 'Натисніть і, не відпускаючи, потягніть: вгору-вниз — ширина, вправо-вліво — висота',
    h_more: '. Далі — кліки: стануть на цю лінію; новий ланцюжок — вимкнути й увімкнути кнопку',
    t_exit: 'Повернутися до 3D-моделі', t_lines: 'Білі деталі й чорні ребра — як на кресленні', t_color: 'Як у 3D — для знімків',
    t_nofac: 'Сховати двері й фасади шухляд — аркуш «без фасадів»', t_fit: 'Перерахувати масштаб і вписати аркуш в екран',
    t_showall: 'Повернути все сховане', t_tree: 'Структура моделі зліва', t_sel: 'Без інструмента: клік виділяє деталь або розмір',
    t_all: 'Загальна ширина знизу й загальна висота справа — на цьому виді', t_tick: 'Кінці розмірів — засічки 45°', t_arrow: 'Кінці розмірів — стрілки',
    t_undo: 'Ctrl+Z', t_redo: 'Ctrl+Y', t_clr: 'Прибрати всі розміри цього виду',
    t_svg: 'Ребра й розміри — векторний файл у теку звіту', t_png: 'Картинка аркуша, як на екрані, — у теку візуалізацій',
    t_refresh: 'Перечитати, що лежить у теках звіту', t_dimfly: 'Лінійний, ланцюжок, від бази, габаритний',
    t_autofly: 'Модулі, фасади, прорізи', t_endfly: 'Засічки або стрілки',
    t_sect: 'Профіль деталі по лінії А–А: зріз зі штрихуванням поруч на аркуші, у своєму масштабі',
    h_sect: 'Переріз: перша точка лінії А–А', h_sect2: 'Переріз: друга точка лінії (майже рівна — випрямиться)',
    h_sect3: 'Переріз: клік з того боку, куди дивитися', h_sect4: 'Переріз: клік — покласти на аркуш. Потім клік по перерізу — масштаб, поворот',
    sect_empty: 'лінія не перетинає жодної деталі', s_view: 'як вид', s_rot: 'Повернути',
    metal: 'Метал', g_metal: 'Металовироби', t_metal: 'Аркуш на кожен металевий напівфабрикат: розміри й підписи за моделлю',
    tex: 'Перехід текстури', g_tex: 'Шпон', t_tex: 'Аркуш на кожну групу шпону (вікно «Раскладка по текстуре», галочка «Шпон»): панелі як стоять, зазори, виноски під номери Віяра',
    join: 'Столярка', g_join: 'Рамкові фасади', t_join: 'Аркуш на виріб з рамковими фасадами: фасади як стоять, розміри, таблиця, переріз рамки, оздоблення (подвійний клік — вписати)',
  },
};
const keep = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const kept = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
let dLang = kept('drawLang', 'ru'), dTheme = kept('drawTheme', 'light'), ribTab = kept('drawTab', 'dims');
let frameName = 'вид спереди', lastDim = 'lin', lastAuto = 'mod', flyFor = null, ctxFor = null, ctxEdit = false;
const L = k => (DTXT[dLang] && DTXT[dLang][k]) || DTXT.ru[k] || k;
// какой строгий вид сейчас (для подсветки кнопки и строки внизу)
function curView() {
  if (!view.strict) return '';
  const d = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (const k in DVIEWS) if (d(DVIEWS[k][0], view.yaw) < 1e-3 && Math.abs(DVIEWS[k][1] - view.pitch) < 1e-3) return k;
  return '';
}
function setView(k) {
  // лист металла: кнопка вида делает живым этот вид листа (лист не перекладывается)
  if (metalCur !== null && !texCur && !joinCur) { const un = metalData().all.find(x => x.u === metalCur); if (un && un.lay && metalViews(un).some(w => w.v === k)) { metalShow(un.u, k, true); return; } }
  const [y, p] = DVIEWS[k]; selDim = null; endTool(); strictView(y, p);
  frameName = L('n_' + k) + (hideFac ? L('n_nofac') : ''); const nm = $('dName'); if (nm) nm.value = frameName;
}
function setLook(on) { drawLines = on; applyLook(); if (drawLines && !view.strict) strictView(0, 0); need(); }
const isT = t => () => drawTool === t;
const pickT = t => () => { if (PRESS.has(t)) lastAuto = t; else lastDim = t; setTool(drawTool === t ? null : t); };
const soon = { act: () => toast(L('soon')), dis: () => true };
const DCMD = {
  exit: { act: () => setDraw(false) },
  front: { act: () => setView('front'), on: () => curView() === 'front' }, back: { act: () => setView('back'), on: () => curView() === 'back' },
  left: { act: () => setView('left'), on: () => curView() === 'left' }, right: { act: () => setView('right'), on: () => curView() === 'right' },
  top: { act: () => setView('top'), on: () => curView() === 'top' }, iso: { act: () => setView('iso'), on: () => curView() === 'iso', show: () => !drawLines },
  lines: { act: () => setLook(true), on: () => drawLines }, color: { act: () => setLook(false), on: () => !drawLines },
  clip: { act: () => setTool(drawTool === 'clip' ? null : 'clip'), on: isT('clip') },
  clipflip: { act: () => clipFlip(), dis: () => !clipPl }, clipoff: { act: () => clipOff(), dis: () => !clipPl },
  hid: { act: () => { drawHid = !drawHid; keep('drawHid', drawHid ? '1' : '0'); applyLook(); need(); }, on: () => drawHid, show: () => drawLines },
  nofac: { act: () => $('bFac').onclick(), on: () => hideFac, show: () => !!(M.door && M.door.length) },
  fit: { act: () => fitSheet() }, showall: { act: () => showAll() }, tree: { act: () => setTree(!treeOpen()), on: () => treeOpen() },
  sel: { act: () => setTool(null), on: () => !drawTool },
  lin: { act: pickT('lin'), on: isT('lin') }, chain: { act: pickT('chain'), on: isT('chain') },
  base: { act: pickT('base'), on: isT('base') }, gab: { act: pickT('gab'), on: isT('gab') }, ang: { act: pickT('ang'), on: isT('ang') },
  mod: { act: pickT('mod'), on: isT('mod') }, fac: { act: pickT('fac'), on: isT('fac') }, easy: { act: pickT('easy'), on: isT('easy') },
  all: { act: () => { pushUndo(); const F = flags(); F.all = !F.all; autoDims(); }, on: () => flags().all },
  tick: { act: () => setEnd('tick'), on: () => dimEnd === 'tick' }, arrow: { act: () => setEnd('arrow'), on: () => dimEnd === 'arrow' },
  undo: { act: () => drawUndo(), dis: () => !undoS.length }, redo: { act: () => drawRedo(), dis: () => !redoS.length },
  clr: { act: () => { pushUndo(); for (const dm of dims.filter(dimHere)) removeDim(dm); for (const q of secs.filter(secHere)) secs.splice(secs.indexOf(q), 1); const F = flags(); F.mod = F.all = false; selDim = selSec = null; drawOverlay(); } },
  sect: { act: () => setTool(drawTool === 'sect' ? null : 'sect'), on: isT('sect') },
  dia: soon, rad: soon, lead: soon, pos: soon, cut: soon, detail: soon,
  svg: { act: () => saveSheet() }, png: { act: () => saveShot() }, refresh: { act: () => refreshList() },
  th_light: { act: () => setTheme('light'), on: () => dTheme === 'light' }, th_dark: { act: () => setTheme('dark'), on: () => dTheme === 'dark' },
  th_blue: { act: () => setTheme('blue'), on: () => dTheme === 'blue' },
  ru: { act: () => setLang('ru'), on: () => dLang === 'ru' }, uk: { act: () => setLang('uk'), on: () => dLang === 'uk' },
  metal: { act: () => metalMenu(document.querySelector('#drib [data-c="metal"]')), on: () => metalCur !== null && !texCur },
  tex: { act: () => texMenu(document.querySelector('#drib [data-c="tex"]')), on: () => !!texCur },
  join: { act: () => joinMenu(document.querySelector('#drib [data-c="join"]')), on: () => !!joinCur },
};
function setEnd(e) { dimEnd = e; keep('drawDimEnd', e); drawOverlay(); }
function setTheme(t) { dTheme = t; keep('drawTheme', t); document.documentElement.dataset.dtheme = t; }
function setLang(l) {
  dLang = l; keep('drawLang', l);
  const cv0 = curView(); if (cv0) frameName = L('n_' + cv0) + (hideFac ? L('n_nofac') : '');
  ctxFor = null; renderPanel(); placeCtx(); if (drawTool) $('st').textContent = L('h_' + drawTool);   // плашка размера — тоже на новом языке
}
// вкладка → группы: [подпись группы, вид кнопок ('big' — значок над подписью, 'sm' — строчкой, столбиком по три), кнопки]
const RIB = {
  view: [['metal', 'big', ['metal']], ['tex', 'big', ['tex']], ['join', 'big', ['join']], ['views', 'sm', ['front', 'back', 'left', 'right', 'top', 'iso']], ['look', 'big', ['lines', 'color', 'hid']], ['fac', 'big', ['nofac']],
         ['clipg', 'big', ['clip', 'clipflip', 'clipoff']],
         ['scale', 'scale'], ['show', 'big', ['showall', 'tree']]],
  dims: [['put', 'big', ['sel', 'lin', 'chain', 'base', 'gab', 'ang']], ['auto', 'big', ['mod', 'fac', 'easy', 'all']], ['ends', 'sm', ['tick', 'arrow']],
         ['edit', 'sm', ['undo', 'redo', 'clr']]],
  marks: [['mdia', 'big', ['dia', 'rad']], ['mlead', 'big', ['lead', 'pos']], ['mcut', 'big', ['cut', 'sect', 'detail']]],
  sheet: [['frame', 'frame'], ['save', 'big', ['svg', 'png']], ['folder', 'big', ['refresh']]],
  set: [['theme', 'big', ['th_light', 'th_dark', 'th_blue']], ['lang', 'big', ['ru', 'uk']]],
};
const FLY = { dimfly: ['lin', 'chain', 'base', 'gab', 'ang'], autofly: ['mod', 'fac', 'easy'], endfly: ['tick', 'arrow'] };
const ribBtn = (id, sz) => `<button class="rb ${sz}" data-c="${id}" data-tip="${id}">${DS(DIC[id] || '', sz === 'big' ? 26 : 16)}<span>${L(id)}</span></button>`;
function renderRibbon() {
  const r = $('drib'), groups = RIB[ribTab] || RIB.dims;
  let h = `<div class="rtabs"><button class="rfile" data-c="exit" data-tip="exit">${DS(DIC.exit, 16)}<span>${L('exit')}</span></button>`;
  for (const t in RIB) h += `<button class="rtab${t === ribTab ? ' on' : ''}" data-tab="${t}">${L('tab_' + t)}</button>`;
  h += '<span class="rzone"></span></div><div class="rbody">';
  for (const [g, kind, items] of groups) {
    let inner;
    if (kind === 'scale') inner = '<div class="rinput"><select id="dScale"></select><small id="dScaleNow"></small></div>' + ribBtn('fit', 'big');
    else if (kind === 'frame') inner = `<div class="rinput"><input id="dName" placeholder="${L('frameName')}"><small>${L('frameHint')}</small></div>`;
    else inner = items.map(id => ribBtn(id, kind)).join('');
    h += `<div class="rgrp"><div class="ritems${kind === 'sm' ? ' sm' : ''}">${inner}</div><div class="rgl">${L('g_' + g)}</div></div>`;
  }
  r.innerHTML = h + '</div>';
  r.querySelector('.rzone').textContent = LOCAL ? LOCAL.zone : '';
  r.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { ribTab = b.dataset.tab; keep('drawTab', ribTab); renderRibbon(); syncPanel(); }; });
  const sel = $('dScale');
  if (sel) {
    sel.innerHTML = `<option value="0">${L('scaleAuto')}</option>` + SCALES.map(s => `<option value="${s}">${L('scaleFix')}${s}</option>`).join('');
    sel.value = String(drawFix); sel.onchange = () => {
      drawFix = +sel.value;
      // лист металла: масштаб связанный — все виды листа перекладываются в выбранном (или снова автоматически при «0»)
      if (metalCur !== null && !texCur && !joinCur) {
        const un = metalData().all.find(x => x.u === metalCur);
        if (un) { if (drawFix) metalApplyScale(un, drawFix); else { un.forceN = 0; un.vpos = null; un.lay = null; metalShow(un.u, un.actV); } return; }
      }
      fitSheet();
    };
  }
  const nm = $('dName');
  if (nm) { nm.value = frameName; nm.oninput = () => { frameName = nm.value; }; nm.onkeydown = e => { if (e.key === 'Enter') saveSheet(); }; }
}
function renderStrip() {
  const sb = id => `<button class="sb" data-c="${id}" data-tip="${id}">${DS(DIC[id], 20)}</button>`;
  const fb = f => `<button class="sb fl" data-fly="${f}" data-tip="${f}"><span class="fi"></span>${DS(DIC.chev, 10)}</button>`;
  const s = $('dstrip');
  s.innerHTML = sb('sel') + fb('dimfly') + fb('autofly') + sb('all') + '<i class="sep"></i>' + sb('undo') + sb('redo') +
    '<i class="sep"></i>' + fb('endfly') + sb('nofac') + '<i class="sep"></i>' + sb('lines') + sb('color') + sb('hid') + sb('fit');
  s.querySelectorAll('[data-fly]').forEach(b => { b.onclick = e => { e.stopPropagation(); openFly(b); }; });
}
function openFly(b) {
  const el = $('dfly');
  if (flyFor === b) { closeFly(); return; }
  flyFor = b;
  el.innerHTML = FLY[b.dataset.fly].map(id => `<button data-c="${id}" class="${DCMD[id].on() ? 'on' : ''}">${DS(DIC[id], 18)}<span>${L(id)}</span></button>`).join('');
  el.classList.add('show');
  const r = b.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(innerWidth - el.offsetWidth - 6, r.left)) + 'px'; el.style.top = (r.bottom + 4) + 'px';
}
function closeFly() { flyFor = null; const el = $('dfly'); if (el) el.classList.remove('show'); }
function renderSide() {
  const d = $('dpanel');
  d.innerHTML = `<div class="ph"><span>${L('p_sheets')}</span><button class="pcol" data-tip="pcol">${DS(DIC[d.classList.contains('col') ? 'chevL' : 'chevR'], 14)}</button></div>
    <div class="pz"></div><div id="dList"></div>
    <div class="ph2">${L('p_prev')}</div><div class="pthumb"><canvas id="dthumb" width="400" height="283"></canvas></div>`;
  d.querySelector('.pz').textContent = LOCAL ? LOCAL.zone : L('p_noZone');
  d.querySelector('.pcol').onclick = () => { d.classList.toggle('col'); renderSide(); refreshList(); layout(); fitView(); };
}
function renderPanel() {
  document.documentElement.dataset.dtheme = dTheme;
  renderRibbon(); renderStrip(); renderSide();
  $('st').dataset.idle = L('idle');
  syncPanel(); refreshList();
}
// состояние кнопок: нажата, недоступна, спрятана; значок выпадающей кнопки — выбранный в ней инструмент
function syncPanel() {
  if (!drawOn || !$('drib').firstChild) return;
  for (const b of document.querySelectorAll('#drib [data-c], #dstrip [data-c]')) {
    const c = DCMD[b.dataset.c]; if (!c) continue;
    b.classList.toggle('on', !!(c.on && c.on()));
    b.classList.toggle('dis', !!(c.dis && c.dis()));
    b.style.display = c.show && !c.show() ? 'none' : '';
  }
  for (const b of document.querySelectorAll('#dstrip [data-fly]')) {
    const f = b.dataset.fly, cur = FLY[f].find(id => DCMD[id].on());
    b.querySelector('.fi').innerHTML = DS(DIC[cur || (f === 'dimfly' ? lastDim : f === 'autofly' ? lastAuto : 'tick')], 20);
    b.classList.toggle('on', !!cur && f !== 'endfly');
  }
  const sel = $('dScale'); if (sel) sel.value = String(drawFix);
  drawInfo();
}
// плашка у выделенного размера: текст, исходное число, удалить размер / всю его цепочку
function placeCtx() {
  const el = $('dctx'); if (!el) return;
  const sc = drawOn && selSec && secs.includes(selSec) && secHere(selSec) ? selSec : null;
  if (sc) {                                                 // плашка сечения: масштаб, повернуть, удалить
    if (ctxFor !== sc) {
      ctxFor = sc;
      const it = SEC_SCALES.map(n => [String(n), '1:' + fmtN(n), sc.sN === n]).concat([['0', L('s_view'), !sc.sN], ['rot', L('s_rot')], ['del', L('e_del')]]);
      el.innerHTML = it.map(([k, t, on]) => `<button data-x="${k}" class="${on ? 'on' : ''}">${k === 'rot' ? DS(DIC.refresh, 18) : k === 'del' ? DS(DIC.del, 18) : ''}<span>${t}</span></button>`).join('');
      el.querySelectorAll('[data-x]').forEach(b => { b.onclick = e => { e.stopPropagation(); secAct(b.dataset.x, sc); }; });
    }
    el.classList.add('show');
    const g = secPrims(sc, toScr(sheetC), pxPerPaper(), toScr), w = el.offsetWidth, h = el.offsetHeight;
    let y = g.box[3] + 14; if (y + h > barTop() - 6) y = g.box[1] - h - 40;
    el.style.left = Math.max(6, Math.min(innerWidth - w - 6, (g.box[0] + g.box[2]) / 2 - w / 2)) + 'px';
    el.style.top = Math.max(ribBottom() + 4, y) + 'px';
    return;
  }
  const dm = drawOn && selDim && dims.includes(selDim) && dimHere(selDim) ? selDim : null;
  const g = dm && dimPrims(dm, toScr, pxPerPaper());
  if (!g) { el.classList.remove('show'); ctxFor = null; ctxEdit = false; return; }
  if (ctxFor !== dm) { ctxFor = dm; ctxEdit = false; ctxFill(dm, g); }
  el.classList.add('show');
  const w = el.offsetWidth, h = el.offsetHeight;
  let y = g.tp[1] + 20; if (y + h > barTop() - 6) y = g.tp[1] - h - 28;
  el.style.left = Math.max(6, Math.min(innerWidth - w - 6, g.tp[0] - w / 2)) + 'px';
  el.style.top = Math.max(ribBottom() + 4, y) + 'px';
}
function ctxFill(dm, g) {
  const el = $('dctx');
  if (ctxEdit) {
    el.innerHTML = '<input id="dctxIn">';
    const i = $('dctxIn'); i.value = g ? g.txt : (dm.text != null ? dm.text : '');
    i.onkeydown = e => {
      e.stopPropagation();
      if (e.key === 'Enter') { pushUndo(); const v = i.value.trim(); dm.text = v === '' ? null : v; ctxEdit = false; ctxFill(dm); drawOverlay(); }
      if (e.key === 'Escape') { ctxEdit = false; ctxFill(dm); drawOverlay(); }
    };
    setTimeout(() => { i.focus(); i.select(); });
    return;
  }
  const it = [['e_text', 'edit'], dm.text != null ? ['e_reset', 'reset'] : null, ['e_del', 'del'], dm.chain ? ['e_delchain', 'delchain'] : null].filter(Boolean);
  el.innerHTML = it.map(([k, ic]) => `<button data-x="${k}">${DS(DIC[ic], 18)}<span>${L(k)}</span></button>`).join('');
  el.querySelectorAll('[data-x]').forEach(b => { b.onclick = e => { e.stopPropagation(); ctxAct(b.dataset.x, dm); }; });
}
function ctxAct(k, dm) {
  if (k === 'e_text') { ctxEdit = true; ctxFill(dm, dimPrims(dm, toScr, pxPerPaper())); placeCtx(); return; }
  pushUndo();
  if (k === 'e_reset') { dm.text = null; ctxFill(dm); }
  if (k === 'e_del') removeDim(dm);
  if (k === 'e_delchain') for (const o of dims.filter(o => o.chain === dm.chain && dimHere(o))) removeDim(o);
  drawOverlay(); syncPanel();
}
function placeStrip() {
  const s = $('dstrip'), t = $('tree');
  const x0 = treeOpen() ? t.offsetWidth : 0, x1 = innerWidth - $('dpanel').offsetWidth;
  s.style.top = (ribBottom() + 8) + 'px';
  s.style.left = Math.max(x0 + 8, (x0 + x1) / 2 - s.offsetWidth / 2) + 'px';
}
// предпросмотр листа справа: копия нарисованного кадра, не чаще трёх раз в секунду
let thumbT = 0, thumbTm = null;
function drawThumb() {
  const c = $('dthumb'); if (!c || !sheetC) return;
  const S = sheetRect(), pr = rend.getPixelRatio(), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
  try { g.drawImage(rend.domElement, S.x0 * pr, S.y0 * pr, S.w * pr, S.h * pr, 0, 0, c.width, c.height); } catch (e) {}
}
function thumbTick() {
  const t = performance.now();
  if (t - thumbT > 350) { thumbT = t; drawThumb(); }
  else if (!thumbTm) thumbTm = setTimeout(() => { thumbTm = null; need(); }, 400);
}
// щелчки по кнопкам ленты / строки / списков, всплывающие подсказки, закрытие списка щелчком мимо
function wireDraw() {
  $('dstat').innerHTML = `<span class="si">${DS(DIC.info, 15)}</span><span class="sr"></span>`;
  document.addEventListener('click', e => {
    const b = e.target.closest('#drib [data-c], #dstrip [data-c], #dfly [data-c]'); if (!b) return;
    const c = DCMD[b.dataset.c]; if (!c) return;
    closeFly(); c.act(); syncPanel();
  });
  document.addEventListener('pointerdown', e => {
    $('dtip').classList.remove('show');
    if (flyFor && !e.target.closest('#dfly') && !e.target.closest('[data-fly]')) closeFly();
  }, true);
  let tt = null;
  document.addEventListener('pointerover', e => {
    const b = drawOn && e.target.closest('[data-tip]'); clearTimeout(tt);
    if (!b) { $('dtip').classList.remove('show'); return; }
    tt = setTimeout(() => showTip(b), 280);
  });
}
function showTip(b) {
  const el = $('dtip'), id = b.dataset.tip, c = DCMD[id];
  const sub = c && c.dis && c.dis() && c === soon ? L('soon') : (DTXT[dLang]['t_' + id] || DTXT.ru['t_' + id] || DTXT[dLang]['h_' + id] || '');
  el.innerHTML = '<b></b>' + (sub ? '<span></span>' : '');
  el.firstChild.textContent = L(id); if (sub) el.lastChild.textContent = sub;
  el.classList.add('show');
  const r = b.getBoundingClientRect(), w = el.offsetWidth;
  el.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
  el.style.top = (r.bottom + 6) + 'px';
}
// ---------- чертежи металла (тема 50, 27.10): лист на каждый полуфабрикат-металл, размеры и подписи — только из модели ----------
// Полуфабрикат-металл: верхний с меткой «Метал» (выгрузка, правило экспорт-формы) и все полуфабрикаты внутри него. Лист —
// у каждого, внутри которого нет других полуфабрикатов (рамка, крестовина). Вид — из осей РАМКИ ФРАГМЕНТА полуфабриката
// (выгрузка: M.nfax), не из осей изделия: опора стола Sg1 стоит в изделии под 45°, в осях изделия лист давал 552 вместо 500 и
// косые виды (Алексей 28.10). Пока лист на экране, вся модель повёрнута так, что оси рамки легли на оси мира — дальше всё
// считается по миру, как раньше. Тонкая по высоте деталь — сверху (задняя сторона вверху листа), тонкая по ширине — слева,
// по глубине — спереди. Масштаб — из ряда, А3 альбомный.
// Отверстия: крепёж, чья ось проходит через тело полуфабриката (любого владельца — саморезы столешницы лежат в её блоке), и
// отверстия самих панелей (круглые `hc`, зенковки `cu`) — по каждому размер от базы (левый / нижний край) вдоль листа и
// поперёк, кроме направления оси отверстия; ряды наружу — от короткого к длинному, габарит — последним.
const WP = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(root.matrixWorld);   // точка модели → сцена (с поворотом листа)
let metalRotQ = null;                                       // поворот модели под лист металла (null — модель как есть)
function metalRot(q) { root.quaternion.copy(q || new THREE.Quaternion()); root.updateMatrixWorld(true); metalRotQ = q || null; }
// оси полуфабриката — рамка ближайшего фрагмента (свой узел, потом вверх по цепочке); нет рамки — оси изделия.
// Зеркальный фрагмент (левая тройка) — без отражения: ось X переворачивается, лист не зеркалится
function unitFrameQ(u, anc) {
  for (const id of [u, ...anc(u)]) {
    const a = M.nfax && M.nfax[id]; if (!a) continue;
    const X = new THREE.Vector3(...a[0]).normalize(), Y = new THREE.Vector3(...a[1]).normalize(), Z = new THREE.Vector3(...a[2]).normalize();
    if (X.clone().cross(Y).dot(Z) < 0) X.negate();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)).invert();
  }
  return new THREE.Quaternion();
}
const MTXT = {
  ru: { metal: 'Металл', t_metal: 'Лист на каждый металлический полуфабрикат: размеры и подписи по модели', m_off: 'Обычный лист', m_pdf: 'Комплект PDF (все листы)', m_rep: 'Листы в отчёт Федосова (картинки по одному)',
        m_none: 'в модели нет полуфабрикатов с металлом', m_view: 'вид', v_bottom: 'снизу', v_back: 'сзади', v_right: 'справа', v_front: 'спереди', v_left: 'слева', v_top: 'сверху', m_last: 'последний вид листа не удаляется', holes: 'отв.', thru: 'насквозь', nothru: 'несквозное', fromIn: 'изнутри', fromOut: 'снаружи', withleg: 'с ножкой', capsYes: 'Торцы труб заглушить', capsNo: 'Торцы труб не глушить', refnote: '* Размеры для справок', det: 'Платик', detHole: 'отв.', deep: 'глуб.', under: 'под', nuts: 'шт.', c_offax: 'отверстие не по оси трубы (смещение', c_mm: 'мм)',
        side: { '-x': 'слева', x: 'справа', '-y': 'снизу', y: 'сверху', '-z': 'сзади', z: 'спереди' }, onside: 'с боку:', inside: 'внутрь', weld: 'патрубок', gablegs: 'Габариты — по трубам, без опор', metalprop: 'Металл', nopaintneed: 'не требуется (нержавейка)', m_chk: 'Проверить модель', ctr: 'Подрядчик', noctr: 'без подрядчика', orderqty: 'Количество изделий', qty: 'Количество', c_title: 'Замечания по модели — поправить и выгрузить заново', c_none: 'Замечаний по модели нет', c_nonut: 'на оси нет гайки', c_twonuts: 'две гайки в одном месте',
        mat: 'Материал', paint: 'Покраска', nopaint: 'покраска не задана в модели (свойство полуфабриката)', sheet: 'Лист', scale: 'Масштаб',
        note1: 'Размеры — по наружному контуру, от базы (левый / нижний край).',
        tex: 'Переход текстуры', t_grp: 'группа', t_pos: 'поз.', t_keep: 'Детали подобраны по рисунку шпона: не менять местами и не переворачивать.', t_num: 'В выносках — номера деталей на сайте Вияр.',
        t_edit: 'Подписи выносок (номера Вияра)', t_cancel: 'Отмена', t_none: 'в модели нет групп шпона — поставь их окном «Раскладка по текстуре» с галочкой «Шпон» и выгрузи заново', t_pick: 'сначала открой лист группы',
        join: 'Столярка — рамочные фасады', j_fac: 'фасадов', j_none: 'в модели нет рамочных фасадов (полуфабрикат «рамка» из дерева внутри блока фасада)', j_no: '№', j_wh: 'ширина × высота', j_qty: 'шт.',
        j_frame: 'Рамка', j_sec: 'Сечение рамки', j_fill: 'Наполнение', j_nofill: 'без наполнения', j_fin: 'Отделка: впиши двойным щелчком (тонировка, лак…)', j_note: 'Размеры фасадов — по наружному контуру рамки.' },
  uk: { metal: 'Метал', t_metal: 'Аркуш на кожен металевий напівфабрикат: розміри й підписи за моделлю', m_off: 'Звичайний аркуш', m_pdf: 'Комплект PDF (усі аркуші)', m_rep: 'Аркуші у звіт Федосова (картинки по одному)',
        m_none: 'у моделі немає напівфабрикатів з металом', m_view: 'вид', v_bottom: 'знизу', v_back: 'ззаду', v_right: 'справа', v_front: 'спереду', v_left: 'зліва', v_top: 'згори', m_last: 'останній вид аркуша не видаляється', holes: 'отв.', thru: 'наскрізь', nothru: 'ненаскрізне', fromIn: 'зсередини', fromOut: 'ззовні', withleg: 'з ніжкою', capsYes: 'Торці труб заглушити', capsNo: 'Торці труб не глушити', refnote: '* Розміри для довідок', det: 'Платик', detHole: 'отв.', deep: 'глиб.', under: 'під', nuts: 'шт.', c_offax: 'отвір не по осі труби (зміщення', c_mm: 'мм)',
        side: { '-x': 'зліва', x: 'справа', '-y': 'знизу', y: 'згори', '-z': 'ззаду', z: 'спереду' }, onside: 'з боку:', inside: 'всередину', weld: 'патрубок', gablegs: 'Габарити — по трубах, без опор', metalprop: 'Метал', nopaintneed: 'не потрібне (нержавійка)', m_chk: 'Перевірити модель', ctr: 'Підрядник', noctr: 'без підрядника', orderqty: 'Кількість виробів', qty: 'Кількість', c_title: 'Зауваження до моделі — виправити й вивантажити заново', c_none: 'Зауважень до моделі немає', c_nonut: 'на осі немає гайки', c_twonuts: 'дві гайки в одному місці',
        mat: 'Матеріал', paint: 'Фарбування', nopaint: 'фарбування не задане в моделі (властивість напівфабрикату)', sheet: 'Аркуш', scale: 'Масштаб',
        note1: 'Розміри — по зовнішньому контуру, від бази (лівий / нижній край).',
        tex: 'Перехід текстури', t_grp: 'група', t_pos: 'поз.', t_keep: 'Деталі підібрані за малюнком шпону: не міняти місцями й не перевертати.', t_num: 'У виносках — номери деталей на сайті Віяр.',
        t_edit: 'Підписи виносок (номери Віяра)', t_cancel: 'Скасувати', t_none: 'у моделі немає груп шпону — постав їх вікном «Раскладка по текстуре» з галочкою «Шпон» і вивантаж заново', t_pick: 'спершу відкрий аркуш групи',
        join: 'Столярка — рамкові фасади', j_fac: 'фасадів', j_none: 'у моделі немає рамкових фасадів (напівфабрикат «рамка» з дерева всередині блоку фасаду)', j_no: '№', j_wh: 'ширина × висота', j_qty: 'шт.',
        j_frame: 'Рамка', j_sec: 'Переріз рамки', j_fill: 'Наповнення', j_nofill: 'без наповнення', j_fin: 'Оздоблення: впиши подвійним кліком (тонування, лак…)', j_note: 'Розміри фасадів — по зовнішньому контуру рамки.' },
};
const ML = k => (MTXT[dLang] && MTXT[dLang][k]) || MTXT.ru[k];
let metal = null, metalPrevFix = 0;
const mnotes = [];                                          // выноски листов металла: {mk, p (сцена), dx, dy, txt[]}
function cleanFast(n) {   // имя крепежа без поставщика в скобках и без артикула в конце (длинный код из букв и цифр)
  const w = String(n || '').replace(/^\[[^\]]*\]\s*/, '').trim().split(/\s+/);
  if (w.length > 1 && w[w.length - 1].length >= 12 && /\d/.test(w[w.length - 1]) && /[a-z]/i.test(w[w.length - 1])) w.pop();
  const s = w.join(' '), m = /(винт|болт|анкер|саморез|шуруп|шпильк\S*|гайк\S*|заклёпк\S*|заклепк\S*)\S*\s+[МMм]\d+(?:[,.]\d+)?(?:\s*[хx×]\s*\d+)?/i.exec(s);
  return m ? m[0] : s;                                      // «Винт М6х25» — тип и размер из имени в модели
}
// подрядчик (свойство «Подрядчик», Алексей 27.10): полуфабрикаты делятся на комплекты по его значению — что написано, не важно
// (1 / 2 / Viyar / латунь…); нет свойства — комплект «без подрядчика»; у вложенного без своего — подрядчик внешнего.
// Выбранный в меню комплект — то, с чем работают листы, PDF и «в отчёт» (папка «Метал» очищается и заполняется им).
let metalGroupSel = null;
function metalData() {
  const B = metal || (metal = metalBuild());
  const g = B.groups.includes(metalGroupSel) ? metalGroupSel : B.groups[0];
  if (B.views[g]) return B.views[g];
  const units = B.units.filter(x => x.ctr === g);
  units.forEach((x, k) => { x.no = k + 1; });                 // номера листов — свои в каждом комплекте
  const gi = B.groups.indexOf(g);
  const gen = B.composite.map((t, ti) => {                   // общий вид: изделие целиком, выделены полуфабрикаты комплекта
    const us = units.filter(x => x.top === t); if (!us.length) return null;
    const box = new THREE.Box3(); for (const x of us) box.union(x.allbox || x.mbox || x.box);   // габарит — по трубам, без патрубков; одинаковые полуфабрикаты слиты в один лист, но в габарите все
    return { u: -1000 - gi * 100 - ti, top: t, general: true, gunits: us, many: B.groups.length > 1, name: M.names[t] || 'изделие', no: 0,
             pi: B.groups.length > 1 ? [...new Set(us.flatMap(x => x.pi))] : partsUnder(t),   // виды — только детали комплекта
             boxes: [], box, holes: [], mats: [...new Set(us.flatMap(x => x.mats))], paint: us.map(x => x.paint).find(Boolean) || '' };
  }).filter(Boolean);
  return (B.views[g] = { tops: B.tops, groups: B.groups, group: g, units, gen, all: gen.concat(units) });
}
function metalBuild() {
  const par = {};
  for (const p of parts) for (let k = 0; k + 1 < p.h.length; k++) par[p.h[k]] = p.h[k + 1];
  const anc = id => { const o = []; for (let c = par[id], g = 0; c !== undefined && g < 60; c = par[c], g++) o.push(c); return o; };
  const isSemi = id => !!M.ntype && M.ntype[id] === 'TDraftBlock';
  const ns = M.nsemi || {}, tops = Object.keys(ns).map(Number).filter(id => (ns[id] || []).includes('Метал'));
  const all = [];
  for (let id = 0; id < M.names.length; id++) if (isSemi(id) && (tops.includes(id) || anc(id).some(a => tops.includes(a)))) all.push(id);
  const leaf = all.filter(id => !all.some(o => o !== id && anc(o).includes(id)));
  root.updateMatrixWorld(true);
  // свойства шаблона Алексея (27.10): берутся строго по названию — «Краска», «Металл»; прочие свойства («Столярка»,
  // «Сборка», «Принадлежность БП»…) сюда не попадают. Ищется у полуфабриката, нет — выше по цепочке
  const propOf = (u, name) => {
    for (const id of [u, ...anc(u)]) {
      const up = (M.nup || {})[id]; if (!up) continue;
      for (const k in up) if (k.trim().toLowerCase() === name && String(up[k] || '').trim()) return String(up[k]).trim();
    }
    return '';
  };
  const paintOf = u => propOf(u, 'краска'), metalOf = u => propOf(u, 'металл'), ctrOf = u => propOf(u, 'подрядчик');
  // приварной элемент (патрубок, платик): профиль короче трёх своих сечений (Алексей 27.10, Br3 — патрубки 30×30 L=50)
  const secSize = s => { let a = 1e9, b = -1e9; for (const e of M.secs[s] || []) for (const v of [e[1], e[3], e[5]]) if (v != null) { a = Math.min(a, v); b = Math.max(b, v); } return b > a ? b - a : 0; };
  const isWeld = i => { const pf = M.objs[i].pf; return !!pf && pf.l < 3 * secSize(pf.s); };
  // опоры (ножки) — крепёж с телом: место в мире, чтобы подписать гайку на их оси «под опору»
  const legsIn = pi => pi.filter(i => M.objs[i].k === 'f' && /опор|ножк|ніжк/i.test(M.objs[i].n)).map(i => {
    const t = M.objs[i].t; return { name: M.objs[i].n, p: WP(t[3], t[7], t[11]) };
  });
  const mkUnit = (u, pi, holesOf, name, rot) => {
    metalRot(rot);                                          // всё ниже — в осях рамки полуфабриката (модель повёрнута)
    // детали полуфабриката: трубы (профили) и детали из листа (панели — опоры, рамки столов из нержавейки); крепёж не в счёт
    const tubes = pi.filter(i => M.objs[i] && (M.objs[i].pf || M.objs[i].k === 'p')), tb = new THREE.Box3(), mb = new THREE.Box3();
    // рамки — по вершинам (precise): модель повёрнута под оси рамки, рамка по готовой коробке геометрии даёт 490×490 вместо 560×60
    const boxes = tubes.map(i => new THREE.Box3().expandByObject(parts[i].g, true));
    for (const b of boxes) tb.union(b);
    // основные детали (без патрубков): по ним габарит и края, от которых меряются отверстия (Алексей 27.10, Br3).
    // Есть профили — основные только они; платики и заглушки (детали из листа внутри сварного полуфабриката) — приварные
    // элементы, подписываются и ставятся по месту (Алексей 27.10, стол St2). Нет профилей (опоры из листа) — лист и есть деталь
    const hasProf = tubes.some(i => M.objs[i].pf);
    const sheets = hasProf ? tubes.map((i, k) => M.objs[i].pf ? null : (() => {
      const o = M.objs[i], s = boxes[k].getSize(V3()), ax = ['x', 'y', 'z'].reduce((p, q) => s[q] < s[p] ? q : p, 'x');
      const wh = ['x', 'y', 'z'].filter(q => q !== ax).map(q => Math.round(s[q])).sort((a, b) => b - a);
      return { i, box: boxes[k], c: boxes[k].getCenter(V3()), thin: ax, name: o.n, size: wh.join('×') + '×' + fmtN(o.th || Math.round(s[ax] * 10) / 10), mat: M.mnames[o.mn] || '' };
    })()).filter(Boolean) : [];
    const sheetI = new Set(sheets.map(x => x.i));
    const mainsI = tubes.filter(i => !(isWeld(i) || sheetI.has(i)));
    const mains = tubes.map((i, k) => isWeld(i) || sheetI.has(i) ? null : boxes[k]).filter(Boolean); for (const b of mains) mb.union(b);
    // крепёж: свой (лежит в полуфабрикате) и чужой, чья ось проходит через тело полуфабриката (саморезы столешницы — в её
    // блоке, а отверстие под них — в опоре; Алексей 28.10, Sg1)
    const inner = boxes.map(b => b.clone().expandByScalar(-0.5));   // касание грани (муфта столешницы над платиком) — не насквозь
    const through = h => { const a = WP(h[0], h[1], h[2]), e = WP(h[3], h[4], h[5]), n = Math.max(2, Math.ceil(a.distanceTo(e) / 1)), P = V3();
      for (let s = 0; s <= n; s++) { P.copy(a).lerp(e, s / n); if (inner.some(b => b.containsPoint(P))) return true; } return false; };
    const holes = (M.holes || []).filter(h => holesOf(h) || through(h)).map(h => ({
      a: WP(h[0], h[1], h[2]), e: WP(h[3], h[4], h[5]), d: h[6], dep: h[7], name: (M.hnames || [])[h[8]] || '' }));
    // отверстия самих панелей (опоры из листа): круглые отверстия `hc` (⌀ из модели) и зенковки `cu` с круглой траекторией —
    // зенковка над отверстием дополняет его подпись, одна — отверстие без диаметра, подпись именем паза из модели
    for (const i of tubes) {
      const o = M.objs[i], ax = o.ax; if (!ax || o.pf) continue;
      const at = (x, y, z) => WP(ax[0] + x * ax[3] + y * ax[6] + z * ax[9], ax[1] + x * ax[4] + y * ax[7] + z * ax[10], ax[2] + x * ax[5] + y * ax[8] + z * ax[11]);
      const th = o.th || 0, mine = [];
      for (const hc of o.hc || []) mine.push({ a: at(hc[0], hc[1], 0), e: at(hc[0], hc[1], th), d: hc[2] * 2, dep: th, name: '', own: true });
      for (const cut of o.cu || []) {
        const tr = (cut.tr || []).find(e => e[0] === 3); if (!tr) continue;
        const c = at(tr[5], tr[6], 0), nm = cut.n + (cut.s ? ' (' + cut.s + ')' : '');
        const near = mine.find(q => q.a.distanceTo(c) <= 1);
        if (near) near.cut = nm; else mine.push({ a: c, e: at(tr[5], tr[6], th), d: tr[7] > 0 ? Math.round(tr[7] * 20) / 10 : 0, dep: th, name: '', own: true, cut: nm });
      }
      holes.push(...mine);
    }
    const welds = tubes.filter(isWeld).map(i => { const o = M.objs[i], b = new THREE.Box3().expandByObject(parts[i].g, true), ax = o.pf.ax;
      return { c: b.getCenter(V3()), ax: new THREE.Vector3(ax[9], ax[10], ax[11]), l: o.pf.l, mat: M.mnames[o.mn] || o.n }; });
    const mats = [...new Set(tubes.map(i => M.objs[i].mn).filter(m => m !== undefined).map(m => M.mnames[m]))];
    const pmats = [...new Set(tubes.filter(i => M.objs[i].pf).map(i => M.objs[i].mn).filter(m => m !== undefined).map(m => M.mnames[m]))];   // только трубы
    const pu = typeof u === 'number' && u >= 0 ? u : tops[0], metal = metalOf(pu);
    // нержавейка (все детали из нержавейки или «Металл» = нержавейка) — не красится, замечания «нет покраски» нет
    const stainless = (mats.length > 0 && mats.every(m => /нерж/i.test(m))) || /нерж|aisi/i.test(metal);
    // габарит с регулируемыми опорами — второй габарит рядом с габаритом по металлу (Алексей 27.10)
    const legs = legsIn(pi), lb = (mb.isEmpty() ? tb : mb).clone();
    for (const i of pi) if (M.objs[i].k === 'f' && /опор|ножк|ніжк/i.test(M.objs[i].n)) lb.union(new THREE.Box3().expandByObject(parts[i].g, true));
    // габарит и точка выноски в осях изделия (модель как есть) — для общего вида и аксонометрии
    metalRot(null);
    const wbx = i => new THREE.Box3().expandByObject(parts[i].g, true), wmb = new THREE.Box3();
    for (const i of mainsI.length ? mainsI : tubes) wmb.union(wbx(i));
    return { u, name, pi, tubes, boxes, mains, sheets, box: tb, mbox: mb.isEmpty() ? tb : mb, lbox: lb, holes, welds, legs, mats, pmats: pmats.length ? pmats : mats, paint: paintOf(pu), metal, stainless,
             rot, wmbox: wmb, hasProf,                       // hasProf — есть трубы; нет — деталь из листа (гнутые опоры)                                 // rot — поворот модели под лист; wmbox — габарит в осях изделия
             inst: [(mainsI.length ? wbx(mainsI[0]) : wmb).getCenter(V3())],   // точки выноски на аксонометрии — на теле (первая труба), по одной на экземпляр
             ctr: ctrOf(pu), top: tops.find(t => t === pu || anc(pu).includes(t)) ?? tops[0] };
  };
  const units = leaf.map(u => mkUnit(u, partsUnder(u), h => h[9] === u || anc(h[9]).includes(u), M.names[u] || 'полуфабрикат', unitFrameQ(u, anc)));
  const inLeaf = new Set(units.flatMap(x => x.pi));          // детали всех полуфабрикатов — ДО слияния одинаковых (Br3: два каркаса)
  // одинаковые полуфабрикаты по форме (габарит, число деталей и отверстий, материалы) — один лист «N шт.», имя не в счёт
  // (Алексей 27.10, Br3 «каркас 1» / «каркас 2»: «два одинаковых — один чертёж и две штуки»)
  { const sig = x => [x.ctr, ...x.mbox.getSize(V3()).toArray().map(Math.round), x.tubes.length, x.holes.length, x.mats.join(',')].join('|'), seenU = new Map();
    for (let i = units.length - 1; i >= 0; i--) { const s = sig(units[i]); if (seenU.has(s)) { const k = seenU.get(s); k.qty = (k.qty || 1) + 1; k.allbox.union(units[i].wmbox); k.inst.push(...units[i].inst); k.instBox.push(units[i].wmbox); units.splice(i, 1); } else { units[i].allbox = units[i].wmbox.clone(); units[i].instBox = [units[i].wmbox]; seenU.set(s, units[i]); } } }
  // детали прямо в полуфабрикате-металле, мимо вложенных (Br3: две трубы 2560 в металокаркасе) — лист на группу одинаковых
  const loose = new Map();
  for (const t of tops) for (const i of partsUnder(t)) {
    const o = M.objs[i]; if (inLeaf.has(i) || !o.pf) continue;
    const key = o.mn + '|' + Math.round(o.pf.l); if (!loose.has(key)) loose.set(key, []); loose.get(key).push(i);
  }
  let li = 0;
  for (const list of loose.values()) {
    const i0 = list[0], o = M.objs[i0], own = parts[i0].h[0], n = list.length;
    const un = mkUnit(-(++li), [i0], h => h[9] === own || anc(h[9]).includes(own),
      (M.mnames[o.mn] || o.n) + ' L=' + Math.round(o.pf.l), unitFrameQ(own, anc));
    un.loose = true; un.qty = n; un.paint = un.paint || (units.find(x => x.paint) || {}).paint || ''; un.metal = un.metal || (units.find(x => x.metal) || {}).metal || '';   // покраска — как у соседних полуфабрикатов изделия
    un.allbox = un.wmbox.clone(); un.inst = []; un.instBox = [];
    for (const i of list) { const bx = new THREE.Box3().expandByObject(parts[i].g, true); un.allbox.union(bx); un.inst.push(bx.getCenter(V3())); un.instBox.push(bx); }   // все экземпляры — габарит общего вида и выноска на каждый
    units.push(un);
  }
  // номера листов — по высоте снизу вверх, затем слева направо (номера живут только в этом комплекте)
  units.sort((a, b) => (a.box.min.y - b.box.min.y) || (a.box.min.x - b.box.min.x));
  units.forEach((x, k) => { x.no = k + 1; });
  // общий вид — только у изделия с полуфабрикатами внутри (собирается по комплекту в metalData)
  const groups = [...new Set(units.map(x => x.ctr))].sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'ru', { numeric: true }));
  return { tops, units, composite: tops.filter(t => !leaf.includes(t)), groups: groups.length ? groups : [''], views: {} };
}
// центр отверстия на детали: середина той части оси, что проходит внутри труб полуфабриката; сквозное — прошло трубу целиком
function holeAt(un, h) {
  const n = Math.max(2, Math.ceil(h.a.distanceTo(h.e) / 0.25)), P = V3();
  let t0 = -1, t1 = -1;
  for (let s = 0; s <= n; s++) {
    P.copy(h.a).lerp(h.e, s / n);
    if (un.boxes.some(b => b.containsPoint(P))) { if (t0 < 0) t0 = s / n; t1 = s / n; }
  }
  const c = t0 < 0 ? h.a.clone().lerp(h.e, 0.5) : h.a.clone().lerp(h.e, (t0 + t1) / 2);
  const inside = t0 < 0 ? 0 : (t1 - t0) * h.a.distanceTo(h.e);
  const ax = h.e.clone().sub(h.a).normalize();
  const sec = un.boxes.find(b => b.containsPoint(c)), span = sec ? Math.abs(sec.getSize(V3()).dot(ax)) : 0;
  const p0 = t0 < 0 ? h.a.clone() : h.a.clone().lerp(h.e, t0), p1 = t0 < 0 ? h.e.clone() : h.a.clone().lerp(h.e, t1);
  return { c, ax, p0, p1, thru: span > 0 && inside >= span - 0.6 };
}
function axName(v) { const k = ['x', 'y', 'z'].reduce((p, q) => Math.abs(v[q]) > Math.abs(v[p]) ? q : p, 'x'); return (v[k] < 0 ? '-' : '') + k; }
// заголовок листа: полуфабрикат — имя и номер, отдельная деталь — её материал, длина, количество
const unitTitle = un => un.general || un.loose ? un.name : un.name + ' ' + un.no;
function metalView(un) {
  const s = un.box.getSize(V3()), mn = Math.min(s.x, s.y, s.z), sd = [s.x, s.y, s.z].sort((a, b) => a - b);
  if (sd[2] > 3 * sd[1] && (un.mains || []).length <= 1) return s.z === sd[2] ? 'left' : 'front';   // одиночная труба / пруток: вид, где видна вся длина (крестовина из труб — три вида)
  if (s.y === mn && s.y * 3 < Math.min(s.x, s.z)) return 'top';
  if (s.x === mn && s.x * 3 < Math.min(s.y, s.z)) return 'left';
  if (s.z === mn && s.z * 3 < Math.min(s.x, s.y)) return 'front';
  return '3d';                                              // объёмная (крестовина): три вида на одном листе
}
// ракурс листа: камера на вид, размер полуфабриката на этом виде (мм модели) — ширина и высота
function metalCam(un, v) {
  const [yw, pt] = DVIEWS[v]; un.curV = v;
  view.strict = true; view.yaw = yw; view.pitch = pt; setPersp(false); place(); cam.updateMatrixWorld();
  const r = V3().setFromMatrixColumn(cam.matrixWorld, 0), up = V3().setFromMatrixColumn(cam.matrixWorld, 1), c = un.box.getCenter(V3());
  let w = 0, h = 0;
  for (const x of [un.box.min.x, un.box.max.x]) for (const y of [un.box.min.y, un.box.max.y]) for (const z of [un.box.min.z, un.box.max.z]) {
    const d = new THREE.Vector3(x, y, z).sub(c); w = Math.max(w, Math.abs(d.dot(r))); h = Math.max(h, Math.abs(d.dot(up)));
  }
  return { r, up, c, w: 2 * w, h: 2 * h };
}
// середина листа так, чтобы середина полуфабриката легла в точку листа (px, py) мм от левого верхнего угла
function metalPlace(g, px, py) {
  sheetC = g.c.clone().addScaledVector(g.r, (SHEET_W / 2 - px) * drawN).addScaledVector(g.up, (py - SHEET_H / 2) * drawN);
}
const RIGHT_COL = 92, GAP = 34;                             // мм листа: колонка справа (картинка, примечания), поле под ряды размеров
// раскладка листа (Алексей 27.10, образец — пример Kw1 из чата): виды прижаты к левому верхнему краю вместе с рядами своих
// размеров; объёмная деталь и общий вид — спереди, справа вид слева (проекционная связь), под видом спереди — вид сверху.
// Аксонометрия — в самое большое оставшееся место, соразмерно видам: не меньше 70 мм (иначе масштаб мельче), не больше 150.
// Масштаб — самый крупный из ряда, при котором всё это помещается. Размеры строятся здесь же (ряды зависят от масштаба).
const ISO_MIN = 70, ISO_MAX = 150, EDGE_M = 8, VGAP = 6, DET_S = 58;   // DET_S — сторона увеличенного вида платика (мм листа)
function metalClear(un) {                                   // автоматические размеры листа; поставленные рукой — остаются
  for (const dm of dims.filter(d => d.mk === un.u && d.auto)) removeDim(dm);
  for (let i = mnotes.length - 1; i >= 0; i--) if (mnotes[i].mk === un.u) mnotes.splice(i, 1);
  un.given = new Set(); un.marks = {};
}
function metalLayout(un) {
  const v0 = un.general ? '3d' : metalView(un); let vs = v0 === '3d' ? ['front', 'left', 'top'] : [v0];
  // дополнительные виды по просьбе (меню листа: снизу / сзади / справа — «вид по линии вниз, вверх», Алексей 28.10)
  for (const v of un.extra || []) if (!vs.includes(v)) vs.push(v);
  // виды, удалённые рукой с листа (вернуть — меню «Металл» → «+ вид …»)
  if (un.vdel && un.vdel.length && vs.some(v => !un.vdel.includes(v))) vs = vs.filter(v => !un.vdel.includes(v));
  un.multi = vs.length > 1; un.vs = vs;
  // лист в три вида: габарит по оси — один раз (ГОСТ 2.307 п. 4.6): главный вид, если по оси там не длиннее, чем на
  // дополнительном (длинная цепочка > 2 рядов — на другой). Общий вид (Алексей 27.10): габариты — на дополнительных видах
  // (1800 и 400 — сверху, 2680 — сбоку), на главном — высоты полок и выступы
  const VA = { front: ['x', 'y'], back: ['x', 'y'], left: ['z', 'y'], right: ['z', 'y'], top: ['x', 'z'], bottom: ['x', 'z'] };
  const gabViewOf = views => {
    if (views.length < 2) return null;
    const cnt = {}, gv = {};
    for (const v of views) for (const a of VA[v]) cnt[v + a] = un.holes.filter(h => axName(h.e.clone().sub(h.a)).replace('-', '') !== a).length;
    for (const a of ['x', 'y', 'z']) {
      const cand = views.filter(v => VA[v].includes(a));
      gv[a] = un.general ? (cand.find(v => v !== 'front') || cand[0]) : cand.sort((p, q) => (Math.min(cnt[p + a], 3) - Math.min(cnt[q + a], 3)) || (views.indexOf(p) - views.indexOf(q)))[0];
    }
    return gv;
  };
  un.gabView = gabViewOf(vs);
  // общий вид: вид, на котором не нашлось ни одного размера, не рисуется (Алексей 27.10, Br3). Главный — всегда
  // (29.10 Br4: габариты ушли на дополнительные виды, у ноги без полок вид спереди пустел и пропадал)
  if (un.general && un.multi) {
    drawFix = drawN = SCALES[3]; metalClear(un);
    const keep = vs.filter((v, i) => { metalCam(un, v); metalDims(un); return i === 0 || un.lastRows > 0; });
    if (keep.length && keep.length < vs.length) { vs = keep; un.multi = vs.length > 1; un.vs = vs; un.gabView = gabViewOf(vs); }
    metalClear(un);
  }
  const AW = SHEET_W, AH = SHEET_H;
  let best = null;
  // первый проход — только с аксонометрией справа вверху (как на образце); не вышло ни в одном масштабе — второй, где найдётся
  // масштаб, выбранный рукой в ленте (связанный: все виды листа в нём), — единственный в переборе
  const scales = un.forceN ? [un.forceN] : SCALES;
  for (const pass of [1, 2]) { if (best && best.iso && best.iso.s >= ISO_MIN) break; best = null;
  for (const n of scales) {
    drawFix = drawN = n; metalClear(un);
    const G = vs.map(v => { const g = metalCam(un, v); metalDims(un); return Object.assign(g, { v, pad: un.padNow }); });
    const sz = g => ({ w: g.w / n, h: g.h / n });
    const F = G[0], fw = sz(F);
    const views = [{ v: F.v, px: EDGE_M + F.pad.l + fw.w / 2, py: EDGE_M + F.pad.t + fw.h / 2 }];
    const occ = [];                                         // занятые прямоугольники листа (вид + его размеры и выноски)
    const box = (g, w) => { const s = sz(g); return [w.px - s.w / 2 - g.pad.l, w.py - s.h / 2 - g.pad.t, w.px + s.w / 2 + g.pad.r, w.py + s.h / 2 + g.pad.b]; };
    occ.push(box(F, views[0]));
    if (G.length > 1) {                                     // второй вид — справа, третий (если остался) — под главным
      const L = G[1], T = G[2], lw = sz(L);
      views.push({ v: L.v, px: occ[0][2] + VGAP + L.pad.l + lw.w / 2, py: views[0].py }); occ.push(box(L, views[1]));
      if (T) { const tw = sz(T); views.push({ v: T.v, px: views[0].px, py: occ[0][3] + VGAP + T.pad.t + tw.h / 2 }); occ.push(box(T, views[2])); }
    }
    // надписи — правый нижний угол; над ними, правее видов, — аксонометрия (Алексей 27.10, скрин: «пусто вверху справа»)
    const tb = metalBlockRect(un, n);
    // дополнительные виды (4-й и дальше) — в свободное место листа, не задевая виды и надписи; не влезли — масштаб мельче
    let fits = true;
    for (let q = 3; q < G.length; q++) {
      const g = G[q], s = sz(g), w = s.w + g.pad.l + g.pad.r, h = s.h + g.pad.t + g.pad.b, spot = metalFreeRect(occ.concat([tb]), AW, AH, w, h);
      if (!spot) { fits = false; break; }
      views.push({ v: g.v, px: spot[0] + g.pad.l + s.w / 2, py: spot[1] + g.pad.t + s.h / 2 }); occ.push(box(g, views[q]));
    }
    if (!fits) continue;
    const U0 = [Math.min(...occ.map(r => r[0])), Math.min(...occ.map(r => r[1])), Math.max(...occ.map(r => r[2])), Math.max(...occ.map(r => r[3]))];
    // наименьший сдвиг, при котором ряды размеров не выходят за левый / верхний край листа
    const minS = [Math.max(0, EDGE_M - U0[0]), Math.max(0, EDGE_M - U0[1])];
    if (U0[2] + minS[0] > AW - EDGE_M || U0[3] + minS[1] > AH - EDGE_M) continue;   // не влезло — масштаб мельче
    const cw = AW - EDGE_M - (U0[2] + minS[0] + VGAP + 8), ch = tb[1] - VGAP - EDGE_M;   // +8: аксонометрия не касается видов (27.10, стол)
    let iso = Math.min(cw, ch) >= ISO_MIN ? { s: Math.min(ISO_MAX, cw, ch) } : null, shift = minS.slice();
    const mv = sh => occ.map(r => [r[0] + sh[0], r[1] + sh[1], r[2] + sh[0], r[3] + sh[1]]);
    const onBlock = sh => mv(sh).some(r => r[2] > tb[0] - 4 && r[3] > tb[1] - 4);
    if (iso) {
      iso.x = AW - EDGE_M - iso.s; iso.y = EDGE_M;
      // виды — посередине оставшегося места: по высоте листа, по ширине — между левым краем и аксонометрией
      const uw = U0[2] - U0[0], uh = U0[3] - U0[1];
      shift = [Math.max(minS[0], EDGE_M + (iso.x - VGAP - EDGE_M - uw) / 2 - U0[0]), Math.max(minS[1], EDGE_M + (AH - 2 * EDGE_M - uh) / 2 - U0[1])];
      if (onBlock(shift)) shift = [shift[0], minS[1]];     // по середине налезло бы на надписи — вверху
      // сдвиг к середине задел бы аксонометрию (дополнительный вид стоит правее основных) — виды у левого верха
      const onIso = sh => mv(sh).some(r => r[2] > iso.x - 4 && r[0] < iso.x + iso.s + 4 && r[3] > iso.y - 4 && r[1] < iso.y + iso.s + 4);
      if (onIso(shift)) shift = minS.slice();
      if (onIso(shift)) iso = null;                         // и так задевает — аксонометрия в другое свободное место (второй проход)
    }
    if (!iso) {
      if (pass === 1 || onBlock(shift)) continue;
      iso = metalIsoSpot(mv(shift).concat([tb]), AW, AH);
    }
    for (const w of views) { w.px += shift[0]; w.py += shift[1]; }
    const occS = occ.map(r => [r[0] + shift[0], r[1] + shift[1], r[2] + shift[0], r[3] + shift[1]]);
    // увеличенный вид платика — в свободном квадрате, не задевая виды, аксонометрию и надписи
    const det = (un.sheets || []).some(s => !/заглуш/i.test(s.name)) ? metalIsoSpot(occS.concat([tb], iso ? [[iso.x, iso.y, iso.x + iso.s, iso.y + iso.s]] : []), AW, AH, DET_S) : null;
    views.forEach((w, i) => { w.gw = G[i].w / n; w.gh = G[i].h / n; w.pad = G[i].pad; });   // рамка вида-блока на листе
    best = { n, views, iso, occ: occS, det };
    if (iso && iso.s >= ISO_MIN) break;
  }
  }
  if (!best) { const n = scales[scales.length - 1]; best = { n, views: vs.map(v => ({ v, px: AW / 2, py: AH / 2 })), iso: null }; }
  if (best.n !== drawN) { drawFix = drawN = best.n; metalClear(un); for (const v of vs) { metalCam(un, v); metalDims(un); } }
  return best;
}
// свободный прямоугольник w×h на листе (сетка 4 мм, от левого верха — рядом с видами), не задевая занятое; нет — null
function metalFreeRect(occ, AW, AH, w, h) {
  const hit = (x, y) => occ.some(r => x < r[2] + 4 && x + w > r[0] - 4 && y < r[3] + 4 && y + h > r[1] - 4);
  for (let y = EDGE_M; y + h <= AH - EDGE_M; y += 4) for (let x = EDGE_M; x + w <= AW - EDGE_M; x += 4) if (!hit(x, y)) return [x, y];
  return null;
}
// самый большой квадрат в свободном месте рабочего поля (поиск сеткой 4 мм, от правого нижнего угла)
function metalIsoSpot(occ, AW, AH, sMax) {
  const hit = (x, y, s) => occ.some(r => x < r[2] + 4 && x + s > r[0] - 4 && y < r[3] + 4 && y + s > r[1] - 4);
  for (let s = sMax || ISO_MAX; s >= 40; s -= 5)
    for (let y = AH - EDGE_M - s; y >= EDGE_M; y -= 4)
      for (let x = AW - EDGE_M - s; x >= EDGE_M; x -= 4) if (!hit(x, y, s)) return { x, y, s };
  return null;
}
// лист на полуфабрикат: только он, виды, размеры. На экране все виды сразу (Алексей 29.10): один «живой» — на нём ставятся
// размеры, остальные — картинкой того же рисунка, что в PDF; щелчок по картинке делает живым её. vi — имя вида или номер;
// keep — лист остаётся на месте экрана в том же приближении; noStat — без картинок (сборка PDF / отчёта)
function metalShow(u, vi, keep, noStat) {
  const md = metalData(), un = md.all.find(x => x.u === u); if (!un) return;
  if (metalCur === null) metalPrevFix = drawFix;
  if (metalCur !== u) metalSelV = null;
  let o = null;
  if (keep && metalCur === u && sheetC) {                    // где лист на экране — запомнить в мм листа (картинки двигают камеру)
    cam.updateMatrixWorld();
    const r = V3().setFromMatrixColumn(cam.matrixWorld, 0), up = V3().setFromMatrixColumn(cam.matrixWorld, 1), d = view.target.clone().sub(sheetC);
    o = [d.dot(r) / drawN, d.dot(up) / drawN, view.dist / drawN];
  }
  metalCur = u; selDim = null; endTool();
  metalRot(un.general ? null : un.rot);                     // лист полуфабриката — модель в осях его рамки
  for (const k in nodes) nodes[k].hidden = false;
  const keepI = new Set(un.pi); parts.forEach((p, i) => { p.hidden = !keepI.has(i); }); applyVis(); renderTree();
  const lay = un.lay || (un.lay = metalLayout(un));          // раскладка строит и размеры — один раз на лист
  drawFix = drawN = lay.n;
  const vw = metalViews(un), w = (typeof vi === 'string' && vw.find(x => x.v === vi)) || vw[typeof vi === 'number' ? vi : 0] || vw[0];
  un.curVi = vw.indexOf(w); un.actV = w.v;
  if (noStat) un.stat = null; else metalStatics(un, w.v);
  metalPlace(metalCam(un, w.v), w.px, w.py);
  const sel = $('dScale'); if (sel) sel.value = String(un.forceN || 0);   // лента: выбранный масштаб или «автоматически»
  if (o) {
    cam.updateMatrixWorld();
    const r = V3().setFromMatrixColumn(cam.matrixWorld, 0), up = V3().setFromMatrixColumn(cam.matrixWorld, 1);
    view.target.copy(sheetC).addScaledVector(r, o[0] * drawN).addScaledVector(up, o[1] * drawN); view.dist = o[2] * drawN; place();
  } else fitView();
  frameName = unitTitle(un); const nm = $('dName'); if (nm) nm.value = frameName;
  syncPanel(); drawInfo(); need();
}
// виды листа с поправками рукой: перетянутые (un.vpos — середина вида, мм листа); удалённые в раскладку не попадают
function metalViews(un) {
  const lay = un.lay || (un.lay = metalLayout(un));
  return lay.views.map(w => { const p = un.vpos && un.vpos[w.v]; return p ? Object.assign({}, w, { px: p[0], py: p[1] }) : w; });
}
// рамка вида-блока на листе: сам вид и ряды его размеров (мм листа)
function metalViewRect(w) {
  const gw = w.gw || 40, gh = w.gh || 40, p = w.pad || { l: 3, t: 3, r: 3, b: 3 };
  return [w.px - gw / 2 - p.l, w.py - gh / 2 - p.t, w.px + gw / 2 + p.r, w.py + gh / 2 + p.b];
}
// картинки неживых видов: рёбра и размеры своей камерой, в мм листа; при перетаскивании картинка просто сдвигается
function metalStatics(un, act) {
  un.stat = []; metalNoBlock = true;
  for (const w of metalViews(un)) {
    if (w.v === act) continue;
    metalPlace(metalCam(un, w.v), w.px, w.py);
    const s = buildSVG();
    un.stat.push({ v: w.v, px: w.px, py: w.py, svg: s.slice(s.indexOf('>', s.indexOf('<svg')) + 1, s.lastIndexOf('</svg>')).replace(/<g id="masshtab">[\s\S]*?<\/g>/, '') });
  }
  metalNoBlock = false;
}
// сдвинуть вид на листе; живой — вместе с ним сдвигается лист в сцене, а камера за листом (лист на экране стоит)
function metalMoveView(un, v, px, py) {
  const cur = metalViews(un).find(w => w.v === v); if (!cur) return;
  const dx = px - cur.px, dy = py - cur.py; if (!dx && !dy) return;
  (un.vpos || (un.vpos = {}))[v] = [px, py];
  if (v !== un.actV || !sheetC) return;
  cam.updateMatrixWorld();
  const d = V3().setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(-dx * drawN).addScaledVector(V3().setFromMatrixColumn(cam.matrixWorld, 1), dy * drawN);
  sheetC.add(d); view.target.add(d); place(); need();
}
// проекционная связь (Алексей 29.10): вид слева / справа / сзади, стоящий в ряд с главным, ходит только вбок, вид сверху /
// снизу под ним — только вверх-вниз; главный тянет связанные за собой. Несвязанный ходит свободно, у линии главного — прилипает
const V_ROW = ['left', 'right', 'back'], V_COL = ['top', 'bottom'];
function metalDragView(un, v, P, dx, dy) {
  const F = P.front;
  let x = P[v][0] + dx, y = P[v][1] + dy;
  if (F && v !== 'front') {
    if (V_ROW.includes(v)) { if (Math.abs(P[v][1] - F[1]) < 0.5 || Math.abs(y - F[1]) < 4) y = F[1]; }
    else if (V_COL.includes(v)) { if (Math.abs(P[v][0] - F[0]) < 0.5 || Math.abs(x - F[0]) < 4) x = F[0]; }
  }
  metalMoveView(un, v, x, y);
  if (v === 'front') for (const q in P) {
    if (V_ROW.includes(q) && Math.abs(P[q][1] - F[1]) < 0.5) metalMoveView(un, q, P[q][0], P[q][1] + dy);
    else if (V_COL.includes(q) && Math.abs(P[q][0] - F[0]) < 0.5) metalMoveView(un, q, P[q][0] + dx, P[q][1]);
  }
}
// масштаб листа: все виды разом; главный стоит, остальные — с тем же зазором до главного (связь видов не рвётся)
function metalApplyScale(un, n) {
  const old = metalViews(un), F0 = old.find(w => w.v === 'front') || old[0], a0 = metalViewRect(F0), kk = drawN / n, gap = {};
  for (const w of old) { const b = metalViewRect(w); gap[w.v] = { r: b[0] - a0[2], l: a0[0] - b[2], d: b[1] - a0[3], u: a0[1] - b[3], dx: w.px - F0.px, dy: w.py - F0.py }; }
  const moved = !!un.vpos;
  un.forceN = n; un.lay = null; un.vpos = null;
  if (moved) {                                              // виды двигали рукой — их места сохраняются в новом масштабе
    const nw = metalViews(un), F = nw.find(w => w.v === F0.v) || nw[0], pos = { [F.v]: [F0.px, F0.py] };
    const a = metalViewRect(Object.assign({}, F, { px: F0.px, py: F0.py }));
    for (const w of nw) {
      const g = gap[w.v]; if (w === F || !g) continue;
      const p = w.pad || { l: 3, t: 3, r: 3, b: 3 }, gw = w.gw || 40, gh = w.gh || 40;
      const x = g.r >= 0 ? a[2] + g.r + p.l + gw / 2 : g.l >= 0 ? a[0] - g.l - p.r - gw / 2 : F0.px + g.dx * kk;
      const y = g.d >= 0 ? a[3] + g.d + p.t + gh / 2 : g.u >= 0 ? a[1] - g.u - p.b - gh / 2 : F0.py + g.dy * kk;
      pos[w.v] = [x, y];
    }
    un.vpos = pos;
  }
  metalShow(un.u, un.actV);
}
// удалить вид с листа (правая кнопка по рамке или Delete): остальные стоят где стояли, масштаб тот же
function metalDelView(un, v) {
  const vw = metalViews(un); if (vw.length < 2) { toast(ML('m_last')); return; }
  const pos = {}; for (const w of vw) if (w.v !== v) pos[w.v] = [w.px, w.py];
  const ex = un.extra || [];
  if (ex.includes(v)) ex.splice(ex.indexOf(v), 1); else un.vdel = (un.vdel || []).concat(v);
  un.forceN = drawN; un.vpos = pos; un.lay = null; metalSelV = null;
  metalShow(un.u, v === un.actV ? Object.keys(pos)[0] : un.actV, true);
}
// на экране: картинки неживых видов и рамки всех видов (тянуть, за правый нижний угол — масштаб всего листа)
let metalSelV = null, metalScaleDr = null;
function metalViewsSvg(un, S) {
  const k = S.w / SHEET_W, f = v => String(Math.round(v * 100) / 100), vw = metalViews(un);
  let s = '';
  for (const st of un.stat || []) {
    const w = vw.find(x => x.v === st.v); if (!w) continue;
    s += `<g transform="translate(${f(S.x0 + (w.px - st.px) * k)} ${f(S.y0 + (w.py - st.py) * k)}) scale(${f(k)})">${st.svg}</g>`;
  }
  const box = (r, cls, extra) => `<rect class="${cls}" ${extra || ''} x="${f(S.x0 + r[0] * k)}" y="${f(S.y0 + r[1] * k)}" width="${f((r[2] - r[0]) * k)}" height="${f((r[3] - r[1]) * k)}"/>`;
  if (metalScaleDr) {                                       // тянут угол: будущие рамки видов и масштаб
    const D = metalScaleDr, F = vw.find(w => w.v === 'front') || vw[0];
    for (const w of vw) {
      const r = metalViewRect(w), c = [F.px + (w.px - F.px) * D.f, F.py + (w.py - F.py) * D.f], hw = (r[2] - r[0]) * D.f / 2, hh = (r[3] - r[1]) * D.f / 2;
      s += box([c[0] - hw, c[1] - hh, c[0] + hw, c[1] + hh], 'vpre');
    }
    s += `<text class="vtip" x="${f(D.x + 12)}" y="${f(D.y + 24)}">М 1:${fmtN(D.n)}</text>`;
    return s;
  }
  for (const w of vw) {
    const r = metalViewRect(w), act = w.v === un.actV, on = metalSelV === w.v;
    s += box(r, 'vfr' + (on ? ' on' : '')) + box(r, act ? 'vb' : 'vh', `data-vw="${w.v}"`) +
      `<rect class="grip bg" data-vws="${w.v}" x="${f(S.x0 + r[2] * k - 5)}" y="${f(S.y0 + r[3] * k - 5)}" width="10" height="10"/>`;
  }
  return s;
}
// лист для PDF: все виды полуфабриката на одном листе — рёбра каждого вида считаются своей камерой, колонка — один раз
function metalSheetSvg(un) {
  metalShow(un.u, 0, false, true);
  const vw = metalViews(un), inner = [];
  vw.forEach((w, i) => {
    metalPlace(metalCam(un, w.v), w.px, w.py);
    metalNoBlock = i < vw.length - 1;
    const s = buildSVG(); inner.push(s.slice(s.indexOf('>', s.indexOf('<svg')) + 1, s.lastIndexOf('</svg>')).replace(/<g id="masshtab">[\s\S]*?<\/g>/, ''));
  });
  metalNoBlock = false;
  metalShow(un.u, 0, false, true);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_W}mm" height="${SHEET_H}mm" viewBox="0 0 ${SHEET_W} ${SHEET_H}">` + inner.join('') + '</svg>';
}
// после сборки PDF / отчёта — вернуть на экран лист, который был открыт (с картинками видов)
function metalBackTo(cur, av) { const md = metalData(); if (cur !== null && md.all.some(x => x.u === cur)) metalShow(cur, av); else if (md.all.length) metalShow(md.all[md.all.length - 1].u); }
let metalNoBlock = false;
function metalOff() {
  if (metalCur === null) return;
  metalSelV = null;
  metalCur = null; texCur = null; joinCur = null; drawFix = metalPrevFix; selDim = null;
  metalRot(null);
  for (const p of parts) p.hidden = false; for (const k in nodes) nodes[k].hidden = false;
  applyVis(); renderTree(); setView('front');
}
function metalDims(un) {
  const vk = viewKey();                                     // размеры, выноски и отверстия — свои у каждого вида
  for (const dm of dims.filter(d => d.mk === un.u && d.auto && dimHere(d))) removeDim(dm);
  for (let i = mnotes.length - 1; i >= 0; i--) if (mnotes[i].mk === un.u && mnotes[i].vk === vk) mnotes.splice(i, 1);
  const { R, U } = viewAxes(), b = un.mbox || un.box, k = drawN, ROW = 9 * k, FIRST = 11 * k;
  const mid = b.getCenter(V3());
  // только отверстия, проходящие через металл (дюбель в стене за полкой — не отверстие полки; контрольная кухня 030_2)
  const HSall = un.general ? [] : un.holes.map(h => Object.assign({ h }, holeAt(un, h))).filter(q => q.p0.distanceTo(q.p1) > 0.5 && un.boxes.some(bb => bb.clone().expandByScalar(0.5).containsPoint(q.c)));
  // отверстие меряется и подписывается на виде, где оно кружком (ось на нас); есть такой вид на листе — на остальных только
  // его линии (принцип 2: элемент — на виде, где его видно)
  const VD = { front: 'z', back: 'z', left: 'x', right: 'x', top: 'y', bottom: 'y' }, Dax = ['x', 'y', 'z'].find(q => q !== R && q !== U);
  const HS = HSall.filter(q => { const a = axName(q.ax).replace('-', ''); return a === Dax || !(un.vs || []).some(v => VD[v] === a); });
  // приварные (патрубки) — в те же ряды, оранжевым: положение их оси, без размера вдоль самой оси (Алексей 27.10)
  const WS = un.general ? [] : (un.welds || []).map(w => ({ c: w.c, ax: w.ax, weld: w }));
  // по сторонам листа: вдоль листа (R) — сверху / снизу, поперёк (U) — слева / справа; база — левый и нижний край
  // экран: вверх по листу = +U или −U (вид сверху: вверх — к задней стороне, −Z)
  const upS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 1)[U]) || 1, rtS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 0)[R]) || 1;
  const onTop = q => (q.c[U] - mid[U]) * upS > 0, onRight = q => (q.c[R] - mid[R]) * rtS > 0;
  // --- принципы Алексея 27.10 (правила_металл.md): каждый размер — между двумя реальными гранями и с ответом «зачем»;
  // элемент меряется на виде, где он виден; жёсткое (отверстия под винты, трубы, высоты) — точные цифры от базы, нежёсткое
  // (платики, гайки под опоры) — от краёв к центру с обеих сторон и «=» между равными; высоты — до верха; общий вид —
  // только габариты, высоты полок и выступы; справочный размер от второго края — со звёздочкой.
  const D = ['x', 'y', 'z'].find(q => q !== R && q !== U);  // ось взгляда
  const side = { top: [], bot: [], lef: [], rig: [] };      // записи размеров: {v, f, col, text, soft, star} по сторонам вида
  const seen = new Set();
  const multi = !!un.multi, given = un.given || (un.given = new Set());
  const rowsN = { t: 0, b: 0, l: 0, r: 0 };                // сколько рядов размеров по сторонам — для раскладки листа
  const baseR = rtS > 0 ? b.min[R] : b.max[R], baseU = upS > 0 ? b.min[U] : b.max[U];
  const farR = rtS > 0 ? b.max[R] : b.min[R], farU = upS > 0 ? b.max[U] : b.min[U];
  const mains = un.mains && un.mains.length ? un.mains : [b];
  // деталь отверстия: самая маленькая из содержащих его (платик на трубе лежит внутри рамки трубы — его, не трубу); нет — ближняя
  const vol = x => { const s = x.getSize(V3()); return s.x * s.y * s.z; };
  const hostOf = q => { const inn = mains.filter(x => x.clone().expandByScalar(0.5).containsPoint(q.c)); return inn.length ? inn.reduce((p, x) => vol(x) < vol(p) ? x : p) : mains.reduce((best, x) => x.distanceToPoint(q.c) < best.distanceToPoint(q.c) ? x : best, mains[0]); };
  const longAx = x => { const s = x.getSize(V3()); return ['x', 'y', 'z'].reduce((p, q) => s[q] > s[p] ? q : p, 'x'); };
  // отверстие по оси трубы (смещение ≤ 1 мм) размером поперёк не подписывается — металлист сверлит по центру
  const centered = (q, a) => { const h = hostOf(q); return longAx(h) !== a && Math.abs(q.c[a] - (h.min[a] + h.max[a]) / 2) <= 1; };
  const CB = '#1f5fbf', CW = '#d9822b', CT = '#000000';     // крепёж синий, приварное оранжевое, трубы чёрные
  // запись размера вдоль листа (ось R) на стороне top/bot и поперёк (ось U) на стороне lef/rig; один раз на лист
  // ключ размера — по паре координат без порядка: тот же отрезок на зеркальном виде (сверху / снизу) — тот же размер
  const kk = (a, v, f) => { const p = Math.round(v), q = Math.round(f); return a + Math.min(p, q) + '|' + Math.max(p, q); };
  const rowR = (top, v, f, col, o) => { const key = kk('R', v, f) + (multi ? '' : top ? 't' : 'b'); if (seen.has(key) || (multi && given.has(key))) return; seen.add(key); (top ? side.top : side.bot).push(Object.assign({ v, f, col }, o)); };
  const rowU = (right, v, f, col, o) => { const key = kk('U', v, f) + (multi ? '' : right ? 'r' : 'l'); if (seen.has(key) || (multi && given.has(key))) return; seen.add(key); (right ? side.rig : side.lef).push(Object.assign({ v, f, col }, o)); };
  // нежёсткая цепочка (платики, гайки под опоры) — по ГОСТ 2.307 п. 5.48 (Алексей 27.10: «по ГОСТу»): от базы до первого,
  // один шаг между соседними, при равных шагах общий «n×шаг=итог»; замыкающий до дальнего края — справочный «*», если на этом
  // виде стоит габарит по оси (п. 4.13: цепь не замыкать)
  const softChain = (vals, base, far, push, col, closed) => {
    const vs = [...new Set(vals.map(v => Math.round(v)))].sort((a, b) => (a - base) * Math.sign(far - base) - (b - base) * Math.sign(far - base));
    if (!vs.length) return;
    push(vs[0], base, col, { soft: true });
    const gaps = []; for (let i = 1; i < vs.length; i++) gaps.push(Math.abs(vs[i] - vs[i - 1]));
    const eq = gaps.length > 1 && gaps.every(g => Math.abs(g - gaps[0]) <= 1);
    if (eq) { push(vs[1], vs[0], col, { soft: true }); push(vs[vs.length - 1], vs[0], col, { soft: true, text: gaps.length + '×' + gaps[0] + '=' + Math.abs(vs[vs.length - 1] - vs[0]) }); }
    else for (let i = 1; i < vs.length; i++) push(vs[i], vs[i - 1], col, { soft: true });
    if (vs.length > 1 || Math.abs(far - vs[0]) > 1) push(vs[vs.length - 1], far, col, { soft: true, star: !!closed });
  };
  // габарит по оси на этом виде? (один раз на лист: главный вид, если там нет длинной цепочки, иначе — дополнительный)
  const gabOn = a => !un.gabView || un.gabView[a] === un.curV;
  // крепёж: винты — точно от базы своей трубы; гайка под опору — нежёсткая (как платик)
  const legShort = n => String(n).replace(/^\[[^\]]*\]\s*/, '').split(',')[0].trim();
  const legOn = q => { for (const L of un.legs || []) { const v = L.p.clone().sub(q.c), t = v.dot(q.ax); if (Math.abs(t) < 60 && v.addScaledVector(q.ax, -t).length() < 6) return legShort(L.name); } return ''; };
  for (const q of HS) { q.nut = /гайк/i.test(q.h.name); q.leg = q.nut ? legOn(q) : ''; q.soft = !!q.leg; }
  const hostBase = (q, a) => { const h = hostOf(q); return (a === R ? rtS : upS) > 0 ? h.min[a] : h.max[a]; };
  const hostFar = (q, a) => { const h = hostOf(q); return (a === R ? rtS : upS) > 0 ? h.max[a] : h.min[a]; };
  const exactR = { t: [], b: [] }, exactU = { l: [], r: [] };
  for (const q of HS) {
    const axk = axName(q.ax).replace('-', '');
    if (q.soft) continue;
    if (axk !== R && !centered(q, R)) { const t = onTop(q); rowR(t, q.c[R], hostBase(q, R), CB); exactR[t ? 't' : 'b'].push(q); }
    if (axk !== U && !centered(q, U)) { const r = onRight(q); rowU(r, q.c[U], hostBase(q, U), CB); exactU[r ? 'r' : 'l'].push(q); }
  }
  // справочный размер от второго края со звёздочкой — к последнему элементу цепочки, если ему ближе до дальнего края
  for (const sk of ['t', 'b']) { const L = exactR[sk]; if (!L.length) continue; const q = L.reduce((p, x) => Math.abs(x.c[R] - hostBase(x, R)) > Math.abs(p.c[R] - hostBase(p, R)) ? x : p); const g = Math.abs(hostFar(q, R) - q.c[R]); if (g > 1 && g < Math.abs(q.c[R] - hostBase(q, R))) rowR(sk === 't', q.c[R], hostFar(q, R), CB, { star: true }); }
  for (const sk of ['l', 'r']) { const L = exactU[sk]; if (!L.length) continue; const q = L.reduce((p, x) => Math.abs(x.c[U] - hostBase(x, U)) > Math.abs(p.c[U] - hostBase(p, U)) ? x : p); const g = Math.abs(hostFar(q, U) - q.c[U]); if (g > 1 && g < Math.abs(q.c[U] - hostBase(q, U))) rowU(sk === 'r', q.c[U], hostFar(q, U), CB, { star: true }); }
  // гайки под опоры — нежёсткой цепочкой по сторонам
  for (const sk of ['t', 'b']) { const L = HS.filter(q => q.soft && axName(q.ax).replace('-', '') !== R && !centered(q, R) && (onTop(q) === (sk === 't'))); if (L.length) softChain(L.map(q => q.c[R]), baseR, farR, (v, f, col, o) => rowR(sk === 't', v, f, col, o), CB, gabOn(R)); }
  for (const sk of ['l', 'r']) { const L = HS.filter(q => q.soft && axName(q.ax).replace('-', '') !== U && !centered(q, U) && (onRight(q) === (sk === 'r'))); if (L.length) softChain(L.map(q => q.c[U]), baseU, farU, (v, f, col, o) => rowU(sk === 'r', v, f, col, o), CB, gabOn(U)); }
  const ext = b.max[R] - b.min[R], extU = b.max[U] - b.min[U];
  if (!un.general && !un.hasProf) {
    // деталь из листа (гнутые опоры стола Sg1, Алексей 28.10 — по листу металлистов): каждая панель — свой размер по обеим
    // осям вида, если он не совпадает с габаритом (ширина полки 500, длина ноги 500, полоса 60, толщина ноги 10), и положение
    // ближнего края от базы, если панель не у базы и не упёрта в соседнюю (нога 220 от края полки). Одинаковые — один раз (ключ)
    // упёрта: соседняя панель лежит между базой и этим краем и кончается на нём (нога встык к полке); полоса на той же
    // ноге с тем же краем — не упор
    const abuts = (e, a, sg, self) => mains.some(h => h !== self && Math.abs((sg > 0 ? h.max[a] : h.min[a]) - e) <= 1 && (sg > 0 ? h.min[a] < e - 1 : h.max[a] > e + 1));
    const thOf = x => { const k = un.boxes.indexOf(x); return k >= 0 ? (M.objs[un.tubes[k]].th || 0) : 0; };
    for (const x of mains) {
      const c = x.getCenter(V3()), top = onTop({ c }), right = onRight({ c }), th = thOf(x);
      for (const [a, rowF, isTop] of [[R, rowR, top], [U, rowU, right]]) {
        const len = x.max[a] - x.min[a], full = a === R ? ext : extU;
        if (len < 1 || len >= 0.9 * full) continue;
        const sg = a === R ? rtS : upS, e0 = sg > 0 ? x.min[a] : x.max[a], e1 = sg > 0 ? x.max[a] : x.min[a], base = a === R ? baseR : baseU;
        const far = a === R ? farR : farU, isTh = Math.abs(len - th) <= 0.6;
        if (!isTh) rowF(isTop, e1, e0, CT);                 // размер самой панели (толщина листа — в колонке материала, не размером)
        if (isTh && Math.abs(e1 - far) <= 1) continue;      // полоса лежит на верху / у края — положение по толщине даёт «355 от пола», мусор
        if (Math.abs(e0 - base) > 1 && !abuts(e0, a, sg, x)) rowF(isTop, e0, base, CT);   // положение от базы
      }
    }
  } else if (!un.general) {
    // трубы сварного полуфабриката: по горизонтали — ближний к базе край (симметричные — один раз, ГОСТ 2.307 п. 5.47);
    // по вертикали — до ВЕРХА трубы; труба чуть ниже верха (≤ 60) — маленький размер от её верха до габарита («10»)
    // труба по оси другой трубы (штырь по центру полки 20×10 — «10») не подписывается, как отверстие по оси
    const onHostAxis = (x, a) => mains.some(h => h !== x && h.max[a] - h.min[a] > x.max[a] - x.min[a] + 1 && Math.abs((h.min[a] + h.max[a]) / 2 - (x.min[a] + x.max[a]) / 2) <= 1);
    // край трубы, упёртый в другую трубу (штырь от стенки полки — «10»), не подписывается: место даёт та труба и её сечение
    const abuts = (e, a) => mains.some(h => Math.abs(h.max[a] - e) <= 1 || Math.abs(h.min[a] - e) <= 1);
    for (const x of mains) {
      const c = x.getCenter(V3()), top = onTop({ c }), right = onRight({ c });
      if (x.max[R] - x.min[R] < 0.9 * ext && longAx(x) !== R && !onHostAxis(x, R)) {
        const e = rtS > 0 ? x.min[R] : x.max[R], e2 = rtS > 0 ? x.max[R] : x.min[R], gL = Math.abs(e - baseR), gR = Math.abs(farR - e2);
        if (gL > 1 && gR > 1 && !abuts(e, R)) rowR(top, e, baseR, CT);
      }
      if (x.max[U] - x.min[U] < 0.9 * extU && longAx(x) !== U && !onHostAxis(x, U)) {
        const nr = upS > 0 ? x.min[U] : x.max[U], tp = upS > 0 ? x.max[U] : x.min[U], gT = Math.abs(farU - tp), gN = Math.abs(nr - baseU);
        if (U === 'y') { if (gT > 1 && gN > 1) rowU(right, tp, gT <= 60 ? farU : baseU, CT); }   // высота — до верха; у самого верха — зазор
        else if (gN > 1 && gT > 1 && !abuts(nr, U)) rowU(right, nr, baseU, CT);   // в плане — как по ширине
      }
    }
    // платики — только на виде, где видны пластью (ось толщины = ось взгляда); цепочкой по ГОСТ по обеим осям
    const sh = (un.sheets || []).filter(s => !/заглуш/i.test(s.name) && s.thin === D);
    for (const sk of ['t', 'b']) { const L = sh.filter(s => onTop(s) === (sk === 't')); if (L.length) softChain(L.map(s => s.c[R]), baseR, farR, (v, f, col, o) => rowR(sk === 't', v, f, col, o), CW, gabOn(R)); }
    for (const sk of ['l', 'r']) { const L = sh.filter(s => onRight(s) === (sk === 'r')); if (L.length) softChain(L.map(s => s.c[U]), baseU, farU, (v, f, col, o) => rowU(sk === 'r', v, f, col, o), CW, gabOn(U)); }
    // место выносного элемента — окружность вокруг первого платика с буквой на полке (ГОСТ 2.305 п. 8.2)
    un.detMark = sh.length ? { vk, p: sh[0].c.clone(), r: Math.max(...['x', 'y', 'z'].filter(a => a !== sh[0].thin).map(a => sh[0].box.max[a] - sh[0].box.min[a])) / 2 + 3 * k } : un.detMark;
  } else if (U === 'y') {
    // общий вид (только вертикальные виды): высоты ПОЛОК до верха — у каждого экземпляра, включая слитые в один лист;
    // полка = плоский горизонтальный полуфабрикат (высота ≤ четверти его длины); верх вертикальной опоры — не высота полки
    const gb = (un.gunits || []).flatMap(x => x.instBox || [x.mbox || x.box]);
    for (const x of gb) {
      const s = x.getSize(V3()), flat = s[U] <= 0.25 * Math.max(s.x, s.y, s.z);
      if (!flat || s[U] >= 0.9 * extU) continue;
      const tp = upS > 0 ? x.max[U] : x.min[U]; if (Math.abs(farU - tp) > 1) rowU(onRight({ c: x.getCenter(V3()) }), tp, baseU, CT);
    }
    const post = gb.reduce((p, x) => !p || x.max[U] - x.min[U] > p.max[U] - p.min[U] ? x : p, null);
    if (post && post.max[U] - post.min[U] >= 0.9 * extU) {
      const e = rtS > 0 ? post.min[R] : post.max[R], e2 = rtS > 0 ? post.max[R] : post.min[R];
      if (Math.abs(e - baseR) > 1 && Math.abs(farR - e2) > 1) { rowR(false, e, baseR, CT); rowR(false, e2, farR, CT); }   // стойка внутри, полки с обеих сторон
    }
  }
  if (multi) for (const kk of seen) given.add(kk);
  // разные типы размеров — по разные стороны вида (Алексей 27.10): где лежит цепочка платиков / гаек, положение труб уходит
  // на противоположную сторону, чтобы ряды не пересекались
  for (const [A, B] of [['top', 'bot'], ['lef', 'rig']]) for (const [from, to] of [[A, B], [B, A]]) {
    if (side[from].some(o => o.soft) && side[from].some(o => o.col === CT)) { const mv = side[from].filter(o => o.col === CT); side[from] = side[from].filter(o => o.col !== CT); side[to].push(...mv); }
  }
  const edgeU = s => (s > 0) === (upS > 0) ? b.max[U] : b.min[U];   // край детали со стороны «вверх листа» (s=1) / «вниз» (s=-1)
  const edgeR = s => (s > 0) === (rtS > 0) ? b.max[R] : b.min[R];
  const pt = (rv, uv) => { const p = mid.clone(); p[R] = rv; p[U] = uv; return p; };
  // габарит — с той стороны, где деталь проходит на всю длину (у каркаса — верхняя труба); на всю длину с обеих — снизу / справа
  const span = (ax, x) => x.max[ax] - x.min[ax] >= 0.9 * (b.max[ax] - b.min[ax]);
  const nearTop = x => (x.getCenter(V3())[U] - mid[U]) * upS > 0, nearRight = x => (x.getCenter(V3())[R] - mid[R]) * rtS > 0;
  const fullR = mains.filter(x => span(R, x)), fullU = mains.filter(x => span(U, x));
  const gabRside = fullR.length && fullR.every(nearTop) ? 1 : -1, gabUside = fullU.length && fullU.every(x => !nearRight(x)) ? -1 : 1;
  // габаритные — тёмно-красные; «=» и «*» — текстом вместо числа / после числа
  // шрифт 5 (ряд ГОСТ 2.304); числа соседних рядов с одной серединой — в шахматном порядке (ГОСТ 2.307 п. 5.26)
  const mids = [];
  const put = (a, bb, axis, offV, gab, col, text) => {
    const dm = addDim(a, bb, { mk: un.u, auto: true, col: gab ? '#a12a2a' : col, fsz: 5 }); dm.axis = axis; dm.off = offV; if (text) dm.text = text;
    const m = (a[axis] + bb[axis]) / 2, near = mids.filter(z => z.axis === axis && Math.abs(z.m - m) < 14 * k);
    if (near.length) dm.stag = near.length % 2 ? 1 : -1; mids.push({ axis, m });
    buildDim(dm);
  };
  // габарит по оси — на каждом виде, где эта длина видна и по ней нет цепочек; при цепочках — на виде, который выбрала раскладка
  const axRows = a => a === R ? side.top.length + side.bot.length : side.lef.length + side.rig.length;
  const gabHere = a => gabOn(a);                            // один раз на лист (ГОСТ 2.307 п. 4.6: размеры не повторять)
  // два габарита при опорах: по металлу и с регулируемой опорой — подписан «с ножкой» (Алексей 27.10)
  const lb = un.lbox || b;
  const gabRows = (axis, mk, dir, n0) => {
    put(mk(axis === R ? baseR : baseU, 0), mk(axis === R ? (baseR === b.min[R] ? b.max[R] : b.min[R]) : (baseU === b.min[U] ? b.max[U] : b.min[U]), 0), axis, dir.clone().multiplyScalar(FIRST + n0 * ROW), true);
    const dl = lb.max[axis] - lb.min[axis];
    if (dl - (b.max[axis] - b.min[axis]) > 1) {
      put(mk(lb.min[axis], 1), mk(lb.max[axis], 1), axis, dir.clone().multiplyScalar(FIRST + (n0 + 1) * ROW), true, null, Math.round(dl) + ' ' + ML('withleg')); return 2;
    }
    return 1;
  };
  const txtOf = o => { if (o.star) un.hasStar = true; return o.text ? o.text : o.star ? Math.round(Math.abs(o.v - o.f)) + '*' : null; };
  // ряды вдоль листа: сверху (s=1) и снизу (s=-1); от короткого к длинному; габарит — последним рядом
  for (const [list, s] of [[side.top, 1], [side.bot, -1]]) {
    const arr = list.slice().sort((x, y) => Math.abs(x.v - x.f) - Math.abs(y.v - y.f));
    const eu = edgeU(s), dir = AX[U].clone().multiplyScalar(s * upS);
    // нежёсткая цепочка (между соседями) — в одном ряду, остальное — рядами наружу
    let row = 0; const chain = arr.filter(o => o.soft && o.text), rest = arr.filter(o => !(o.soft && o.text));
    if (chain.length) { for (const o of chain) put(pt(o.f, eu), pt(o.v, eu), R, dir.clone().multiplyScalar(FIRST), false, o.col, txtOf(o)); row = 1; }
    rest.forEach((o, i) => put(pt(o.f, eu), pt(o.v, eu), R, dir.clone().multiplyScalar(FIRST + (row + i) * ROW), false, o.col, txtOf(o)));
    let nr = row + rest.length;
    const gk = 'G' + R + un.curV;
    if (s === gabRside && !given.has(gk) && gabHere(R)) {
      nr += gabRows(R, (v, l) => { const p = pt(v, eu); if (l) p[U] = upS * s > 0 ? lb.max[U] : lb.min[U]; return p; }, dir, nr);
      given.add(gk);
    }
    rowsN[s > 0 ? 't' : 'b'] = nr;
  }
  for (const [list, s] of [[side.lef, -1], [side.rig, 1]]) {
    const arr = list.slice().sort((x, y) => Math.abs(x.v - x.f) - Math.abs(y.v - y.f));
    const er = edgeR(s), dir = AX[R].clone().multiplyScalar(s * rtS);
    let row = 0; const chain = arr.filter(o => o.soft && o.text), rest = arr.filter(o => !(o.soft && o.text));
    if (chain.length) { for (const o of chain) put(pt(er, o.f), pt(er, o.v), U, dir.clone().multiplyScalar(FIRST), false, o.col, txtOf(o)); row = 1; }
    rest.forEach((o, i) => put(pt(er, o.f), pt(er, o.v), U, dir.clone().multiplyScalar(FIRST + (row + i) * ROW), false, o.col, txtOf(o)));
    let nr = row + rest.length;
    const gk = 'G' + U + un.curV;
    if (s === gabUside && !given.has(gk) && gabHere(U)) {
      nr += gabRows(U, (v, l) => { const p = pt(er, v); if (l) p[R] = rtS * s > 0 ? lb.max[R] : lb.min[R]; return p; }, dir, nr);
      given.add(gk);
    }
    rowsN[s > 0 ? 'r' : 'l'] = nr;
  }
  un.lastRows = rowsN.t + rowsN.b + rowsN.l + rowsN.r;     // общий вид: вид без единого размера не рисуется
  // выноски: группа «одинаковое отверстие» (диаметр + сквозное + крепёж) — одна выноска на первое
  const groups = new Map(), nSide = {};
  // сторона гайки: грань, на которой она стоит (против оси её отверстия); смотрит внутрь рамки — «внутрь»
  const nutSide = q => { const s = q.ax.clone().negate(); return s.dot(mid.clone().sub(q.c)) > 1 ? ML('inside') : ML('side')[axName(s)]; };
  // выноска — только на виде, где элемент виден (ось отверстия не вдоль взгляда — видно; вдоль — кружок, тоже видно)
  for (const q of HS) {
    const key = q.nut ? 'n|' + cleanFast(q.h.name) + '|' + nutSide(q) + '|' + q.leg : 'h|' + q.h.d + '|' + q.thru + '|' + cleanFast(q.h.name) + '|' + (q.h.cut || '');
    if (!groups.has(key)) groups.set(key, { nut: q.nut, leg: q.leg, list: [] });
    groups.get(key).list.push(q);
  }
  for (const q of WS) {                                     // патрубки: одна выноска на одинаковые (материал + длина)
    const key = 'w|' + q.weld.mat + '|' + Math.round(q.weld.l);
    if (!groups.has(key)) groups.set(key, { weld: true, list: [] });
    groups.get(key).list.push(q);
  }
  // платики — без выноски: положение дают размеры, сам платик — увеличенным видом «А»; заглушки — строкой «торцы заглушить»
  for (const [gkey, g] of groups) {
    if (multi) { if (given.has('N' + gkey)) continue; given.add('N' + gkey); }   // выноска группы — на одном виде
    const q = g.list[0], n = g.list.length, cnt = n > 1 ? n + ' ' + ML('nuts') + ' ' : '';   // одно — без «1 шт.»
    if (g.weld) {
      const txt = [cnt + ML('weld'), q.weld.mat + ', L=' + Math.round(q.weld.l)];
      const top = onTop(q), rows = top ? rowsN.t : rowsN.b, sk = top ? 't' : 'b';
      mnotes.push({ mk: un.u, vk, p: q.c.clone(), dx: onRight(q) ? -1 : 1, dy: top ? -1 : 1, ly: 11 + rows * 9 + 5 + (nSide[sk] || 0), txt });
      nSide[sk] = (nSide[sk] || 0) + txt.length * 6.6 + 4;   // следующая выноска той же стороны — ниже на высоту этой
      continue;
    }
    const nm = cleanFast(q.h.name), own = q.h.own || /^отв/i.test(nm);   // «Отв.скв 7» / отверстие панели — само отверстие, не крепёж
    // труба: обе стенки — «наскрізь»; одна стенка — «несквозное, изнутри / снаружи» (сторона входа относительно самой детали,
    // не «сзади» — непонятно, как смотреть); глубину в мм не писать (Алексей 27.10)
    const en = q.ax.clone().negate(), entry = en.dot(mid.clone().sub(q.c)) > 1 ? ML('fromIn') : ML('fromOut');
    const txt = g.nut
      ? [cnt + nm].concat(g.leg ? [ML('under') + ': ' + g.leg] : [], [ML('onside') + ' ' + nutSide(q)])   // «с боку: внутрь» — принято Алексеем 27.10
      // отверстие панели: зенковка над ним — в той же строке; одна зенковка без отверстия — именем паза из модели, без диаметра
      : [(n > 1 ? n + ' ' + ML('holes') + ' ' : '') + (q.h.d > 0 ? '⌀' + fmtN(q.h.d) + ' ' + (q.thru ? ML('thru') : ML('nothru') + ', ' + entry) + (q.h.cut ? ', ' + q.h.cut : '') : q.h.cut || nm)]
        .concat(own ? [] : [ML('under') + ' ' + nm.charAt(0).toLowerCase() + nm.slice(1)]);
    // выноска уходит за ряды размеров своей стороны; следующая на той же стороне — ниже на высоту предыдущей
    const top = onTop(q), rows = top ? rowsN.t : rowsN.b, sk = top ? 't' : 'b';
    // полка выноски — к середине листа (наружу она уходила за край листа)
    mnotes.push({ mk: un.u, vk, p: q.c.clone(), dx: onRight(q) ? -1 : 1, dy: top ? -1 : 1, ly: 11 + rows * 9 + 5 + (nSide[sk] || 0), txt });
    nSide[sk] = (nSide[sk] || 0) + txt.length * 6.6 + 4;
  }
  // сами отверстия на виде (в модели их нет — Базис держит их в крепеже): ось и стенки, или кружок с крестом
  (un.marks || (un.marks = {}))[vk] = HSall.map(q => ({ p0: q.p0, p1: q.p1, c: q.c, r: q.h.d / 2, nut: /гайк/i.test(q.h.name) }));
  if (un.detMark && un.detMark.vk === vk) {               // окружность вокруг платика + буква «А» на полке (ГОСТ 2.305 п. 8.2)
    const q = { c: un.detMark.p }, top = onTop(q);
    mnotes.push({ mk: un.u, vk, p: un.detMark.p.clone(), dx: onRight(q) ? -1 : 1, dy: top ? -1 : 1, ly: 11 + (top ? rowsN.t : rowsN.b) * 9 + 5 + (nSide[top ? 't' : 'b'] || 0), txt: ['А'], circ: un.detMark.r / k });
  }
  // поля вокруг вида (мм листа): ряды размеров (первый 10 мм, дальше по 8, плюс цифра) и выноски с их полками
  const padOf = n => n ? 11 + (n - 1) * 9 + 6 : 3, pad = { t: padOf(rowsN.t), b: padOf(rowsN.b), l: padOf(rowsN.l), r: padOf(rowsN.r) };
  const halfW = Math.abs(b.max[R] - b.min[R]) / k / 2;
  for (const n of mnotes) {
    if (n.mk !== un.u || n.vk !== vk) continue;
    if (n.dy < 0) pad.t = Math.max(pad.t, n.ly + 6); else pad.b = Math.max(pad.b, n.ly + n.txt.length * 6.6 + 2);
    const x0 = (n.p[R] - mid[R]) * rtS / k, x1 = x0 + n.dx * (n.ly * 0.5 + Math.max(...n.txt.map(t => t.length)) * 2.5);
    if (x1 > halfW) pad.r = Math.max(pad.r, x1 - halfW + 2); if (x1 < -halfW) pad.l = Math.max(pad.l, -halfW - x1 + 2);
  }
  un.padNow = pad;
  drawOverlay();
}
// выноска: точка → косая 8 мм наружу → полка с текстом (строки друг под другом)
function noteSvg(n, toP, k, exp) {
  const p = toP(n.p), f = v => String(Math.round(v * 100) / 100), col = '#000000';
  const ly = n.ly || 8, q = [p[0] + n.dx * ly * 0.5 * k, p[1] + n.dy * ly * k], wTxt = Math.max(...n.txt.map(t => t.length)) * 2.5 * k;
  const end = [q[0] + n.dx * wTxt, q[1]], sw = exp ? 0.18 : Math.max(1, 0.18 * k);
  let s;
  if (n.circ) {                                             // место выносного элемента: тонкая окружность, выноска от её края
    const rr = n.circ * k, L0 = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, sx = p[0] + (q[0] - p[0]) / L0 * rr, sy = p[1] + (q[1] - p[1]) / L0 * rr;
    s = `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(rr)}" fill="none" stroke="${col}" stroke-width="${f(sw)}"/>` +
        `<path d="M${f(sx)} ${f(sy)}L${f(q[0])} ${f(q[1])}L${f(end[0])} ${f(end[1])}" fill="none" stroke="${col}" stroke-width="${f(sw)}"/>`;
  } else {
    s = `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}L${f(end[0])} ${f(end[1])}" fill="none" stroke="${col}" stroke-width="${f(sw)}"/>`;
    s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(0.6 * k)}" fill="${col}"/>`;
  }
  const x = n.dx > 0 ? q[0] : end[0];
  n.txt.forEach((t, i) => { s += `<text x="${f(x)}" y="${f(q[1] - 1.4 * k + i * 6.6 * k)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="${col}">${esc(t)}</text>`; });
  return s;
}
// отверстие на виде: ось в плоскости листа — штрихпунктир оси и две линии стенок; ось на нас — кружок и крест
function holeMarkSvg(m, toP, k, exp) {
  const f = v => String(Math.round(v * 100) / 100), a = toP(m.p0), b = toP(m.p1), c = toP(m.c);
  const rp = m.r / drawN * k, sw = exp ? 0.18 : Math.max(1, 0.18 * k), col = m.nut ? '#555555' : '#000000';
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L > rp * 0.5) {
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy * rp, ny = ux * rp, ex = 1.5 * k;
    return `<path d="M${f(a[0] + nx)} ${f(a[1] + ny)}L${f(b[0] + nx)} ${f(b[1] + ny)}M${f(a[0] - nx)} ${f(a[1] - ny)}L${f(b[0] - nx)} ${f(b[1] - ny)}" stroke="${col}" stroke-width="${f(sw)}" fill="none"/>` +
      `<path d="M${f(a[0] - ux * ex)} ${f(a[1] - uy * ex)}L${f(b[0] + ux * ex)} ${f(b[1] + uy * ex)}" stroke="${col}" stroke-width="${f(sw * 0.7)}" stroke-dasharray="${f(3 * k)} ${f(0.8 * k)} ${f(0.5 * k)} ${f(0.8 * k)}" fill="none"/>`;
  }
  const x = 1.4 * rp + 1 * k;
  return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(rp)}" stroke="${col}" stroke-width="${f(sw)}" fill="none"/>` +
    `<path d="M${f(c[0] - x)} ${f(c[1])}L${f(c[0] + x)} ${f(c[1])}M${f(c[0])} ${f(c[1] - x)}L${f(c[0])} ${f(c[1] + x)}" stroke="${col}" stroke-width="${f(sw * 0.7)}" fill="none"/>`;
}
// знак «меньше» — в скобках [<]: выгрузка вставляет проигрыватель в страницу и правит в нём «<» + «/», регулярка ломалась (27.10)
const esc = t => String(t).replace(/&/g, '&amp;').replace(/[<]/g, '&lt;').replace(/>/g, '&gt;');
// колонка примечаний справа внизу листа (мм бумаги; o — левый верхний угол листа, k — единиц на мм)
// строки колонки надписей (с переносом) и её прямоугольник на листе — раскладка обходит его стороной
// колонка надписей: по умолчанию правый нижний угол; перетянута рукой — un.blk {x, y (левый верх, мм листа), s (масштаб шрифта)}
// (Алексей 28.10: «блок текстовой надписи беру, перетягиваю, он вытягивается, меняется пропорционально»)
function metalBlockGeo(un, n) {
  const s = (un.blk && un.blk.s) || 1, ls = metalBlockLines(un, n), h = ls.reduce((a, l) => a + (l[1] + 2.4) * s, 0);
  const x0 = un.blk ? un.blk.x : SHEET_W - 90, y0 = un.blk ? un.blk.y : SHEET_H - 12 - h - 2;
  return { x0, y0, x1: x0 + 86 * s, y1: y0 + h + 6, s, ls };
}
function metalBlockRect(un, n) { const g = metalBlockGeo(un, n); return [g.x0, g.y0, g.x1, g.y1]; }
// аксонометрия: место от раскладки или перетянутое рукой (un.isoOv {x, y, s})
function metalIsoGeo(un) { return un.isoOv || (un.lay && un.lay.iso && un.lay.iso.s >= 40 ? un.lay.iso : { x: SHEET_W - 88, y: 8, s: 82 }); }
function metalBlockSvg(o, k, ui) {
  const md = metalData(), un = metal && md.all.find(x => x.u === metalCur); if (!un) return '';
  const f = v => String(Math.round(v * 100) / 100), G = metalBlockGeo(un, drawN), x = o[0] + (G.x0 + 2) * k;
  let y = o[1] + G.y0 * k, s = '';
  for (const [t, h, warn] of G.ls) {
    y += (h + 2.4) * G.s * k;
    s += `<text x="${f(x)}" y="${f(y)}" font-family="${DFONT}" font-size="${f(h * G.s * k)}" fill="${warn ? '#c0392b' : '#000000'}">${esc(t)}</text>`;
  }
  // увеличенный вид платика «А» в свободном месте листа (Алексей 27.10: на основном виде платик — точка, нечитаемо)
  if (!un.general && un.lay && un.lay.det) s += metalDetailSvg(un, o, k, un.lay.det);
  // аксонометрия: всё изделие серой дымкой, этот полуфабрикат выделен — в место, которое нашла раскладка
  const th = metalThumb(un);
  const iso = metalIsoGeo(un);
  if (th) s += `<image href="${th}" x="${f(o[0] + iso.x * k)}" y="${f(o[1] + iso.y * k)}" width="${f(iso.s * k)}" height="${f(iso.s * k)}" preserveAspectRatio="xMidYMid meet"/>`;
  if (ui) {                                                 // на экране: колонку и аксонометрию можно тянуть, за правый нижний угол — растягивать
    const R = (b, x0, y0, x1, y1) => `<rect class="bh" data-b="${b}" x="${f(o[0] + x0 * k)}" y="${f(o[1] + y0 * k)}" width="${f((x1 - x0) * k)}" height="${f((y1 - y0) * k)}"/>` +
      `<rect class="grip bg" data-b="${b}s" x="${f(o[0] + x1 * k - 5)}" y="${f(o[1] + y1 * k - 5)}" width="10" height="10"/>`;
    s += R('blk', G.x0, G.y0, G.x1, G.y1);
    if (th) s += R('iso', iso.x, iso.y, iso.x + iso.s, iso.y + iso.s);
  }
  // общий вид: выноски с номерами позиций на аксонометрии — те же номера, что в списке (Алексей 27.10)
  if (th && un.general && un.thumbMap) {
    const R0 = 0.47, rc = 3.2, taken = [];
    const img = p => [o[0] + (iso.x + p[0] * iso.s) * k, o[1] + (iso.y + p[1] * iso.s) * k];
    for (const x of md.units) for (const pt of x.inst || [(x.mbox || x.box).getCenter(V3())]) {   // точка — на теле, по выноске на каждый экземпляр
      const p = un.thumbMap(pt), dx = p[0] - 0.5, dy = p[1] - 0.5;
      let a = Math.atan2(dy, dx); if (!isFinite(a)) a = 0;
      let q;                                                 // кружок — на кольце у края картинки, занятое место обходится по кругу
      for (let t = 0; t < 24; t++) { const aa = a + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.26; q = [0.5 + R0 * Math.cos(aa), 0.5 + R0 * Math.sin(aa)]; if (!taken.some(z => Math.hypot(z[0] - q[0], z[1] - q[1]) * iso.s < 2.2 * rc)) break; }
      taken.push(q);
      const P = img(p), Q = img(q);
      s += `<path d="M${f(P[0])} ${f(P[1])}L${f(Q[0])} ${f(Q[1])}" stroke="#000000" stroke-width="${f(0.2 * k)}" fill="none"/><circle cx="${f(P[0])}" cy="${f(P[1])}" r="${f(0.6 * k)}" fill="#000000"/>` +
        `<circle cx="${f(Q[0])}" cy="${f(Q[1])}" r="${f(rc * k)}" fill="#ffffff" stroke="#000000" stroke-width="${f(0.25 * k)}"/>` +
        `<text x="${f(Q[0])}" y="${f(Q[1] + 1.5 * k)}" font-family="${DFONT}" font-size="${f(4.2 * k)}" fill="#000000" text-anchor="middle">${x.no}</text>`;
    }
  }
  return s;
}
// увеличенный вид платика: рисуется по данным модели (габарит платика, отверстия внутри него), не по рёбрам сцены.
// Масштаб 1:1 (платик до 50 мм) или 1:2; подпись «А (1:1) — платик 30×30×2, N шт.», отверстия «⌀5 под саморез»
function metalDetailSvg(un, o, k, det) {
  const f = v => String(Math.round(v * 100) / 100);
  const groups = new Map();
  for (const sh of (un.sheets || []).filter(x => !/заглуш/i.test(x.name))) { const key = sh.name + '|' + sh.size; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(sh); }
  let s = '', y0 = det.y, L = 'А';
  for (const [, list] of groups) {
    const sh = list[0], sz = sh.box.getSize(V3()), [A1, A2] = ['x', 'y', 'z'].filter(a => a !== sh.thin);
    const w = sz[A1], h = sz[A2], sc = Math.max(w, h) <= 50 ? 1 : 2, W = w / sc, H = h / sc;
    const x0 = det.x + 14, yy = y0 + 16;                     // поле слева под размер высоты, сверху — заголовок и размер ширины
    const X = v => o[0] + (x0 + (v - sh.box.min[A1]) / sc) * k, Y = v => o[1] + (yy + (sh.box.max[A2] - v) / sc) * k;
    s += `<text x="${f(o[0] + det.x * k)}" y="${f(o[1] + (y0 + 5) * k)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="#000000">${esc(L + ' (1:' + sc + ') — ' + sh.name + ' ' + sh.size + ', ' + list.length + ' ' + ML('nuts'))}</text>`;
    s += `<rect x="${f(X(sh.box.min[A1]))}" y="${f(Y(sh.box.max[A2]))}" width="${f(W * k)}" height="${f(H * k)}" fill="none" stroke="#000000" stroke-width="${f(0.3 * k)}"/>`;
    // отверстия платика: (а) свои — круги в контуре панели (hc, оси панели → мир через ax); (б) крепёж, проходящий через
    // платик, любого владельца (саморезы столешницы лежат в её блоке, не в каркасе). Зенковка — паз с круглой траекторией (cu)
    const bx = sh.box.clone().expandByScalar(1), po = M.objs[sh.i], ax = po.ax;
    const P2W = (x, y) => ax ? WP(ax[0] + x * ax[3] + y * ax[6], ax[1] + x * ax[4] + y * ax[7], ax[2] + x * ax[5] + y * ax[8]) : null;
    const hs = [];
    for (const hc of po.hc || []) { const c = P2W(hc[0], hc[1]); if (c) hs.push({ hh: { d: hc[2] * 2, dep: 0, name: '' }, c, own: true }); }
    const sinks = (po.cu || []).map(cut => { const tr = (cut.tr || []).find(e => e[0] === 3); return tr ? { c: P2W(tr[5], tr[6]), r: tr[7], n: cut.n, s: cut.s } : null; }).filter(Boolean);
    for (const q of (M.holes || []).map(h => ({ hh: { d: h[6], dep: h[7], name: (M.hnames || [])[h[8]] || '' }, a: WP(h[0], h[1], h[2]), e: WP(h[3], h[4], h[5]) }))) {
      q.c = q.a.clone().lerp(q.e, 0.5);
      if (bx.containsPoint(q.a) || bx.containsPoint(q.e) || bx.containsPoint(q.c)) hs.push(q);
    }
    const notes = [];
    for (const q of hs) {
      const cx = X(q.c[A1]), cy = Y(q.c[A2]), r = q.hh.d / 2 / sc * k;
      s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="#1f5fbf" stroke-width="${f(0.3 * k)}"/><path d="M${f(cx - r - 1.5 * k)} ${f(cy)}L${f(cx + r + 1.5 * k)} ${f(cy)}M${f(cx)} ${f(cy - r - 1.5 * k)}L${f(cx)} ${f(cy + r + 1.5 * k)}" stroke="#1f5fbf" stroke-width="${f(0.18 * k)}"/>`;
      const nm = cleanFast(q.hh.name), own = q.own || /^отв/i.test(nm);
      // зенковка — паз с круглой траекторией в том же месте: имя и обозначение паза из модели
      const sk = sinks.find(z => z.c && z.c.distanceTo(q.c) <= 1);   // зенковка — только соосная (саморез в 2 мм рядом — не её)
      if (sk && sk.r > 0) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(sk.r / sc * k)}" fill="none" stroke="#1f5fbf" stroke-width="${f(0.18 * k)}" stroke-dasharray="${f(1.2 * k)} ${f(0.6 * k)}"/>`;
      const t = '⌀' + fmtN(q.hh.d) + (sk ? ', ' + sk.n + (sk.s ? ' (' + sk.s + ')' : '') + (sk.r > 0 ? ' ⌀' + fmtN(Math.round(sk.r * 20) / 10) : '') : '') + (own ? '' : ' ' + ML('under') + ' ' + nm.charAt(0).toLowerCase() + nm.slice(1)); if (!notes.includes(t)) notes.push(t);
      // положение отверстия от краёв платика (если не по центру)
      const dx = q.c[A1] - sh.box.min[A1], dy = q.c[A2] - sh.box.min[A2];
      if (Math.abs(dx - w / 2) > 0.5) s += dimLine([X(sh.box.min[A1]), Y(sh.box.min[A2]) + 7 * k], [cx, Y(sh.box.min[A2]) + 7 * k], Math.round(dx), k, f);
      if (Math.abs(dy - h / 2) > 0.5) s += dimLine([X(sh.box.max[A1]) + 7 * k, Y(sh.box.min[A2])], [X(sh.box.max[A1]) + 7 * k, cy], Math.round(dy), k, f, true);
    }
    s += dimLine([X(sh.box.min[A1]), Y(sh.box.max[A2]) - 5 * k], [X(sh.box.max[A1]), Y(sh.box.max[A2]) - 5 * k], Math.round(w), k, f);
    s += dimLine([X(sh.box.min[A1]) - 5 * k, Y(sh.box.max[A2])], [X(sh.box.min[A1]) - 5 * k, Y(sh.box.min[A2])], Math.round(h), k, f, true);
    notes.forEach((t, i) => { s += `<text x="${f(o[0] + det.x * k)}" y="${f(o[1] + (yy + H + 14 + i * 6) * k)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="#000000">${esc(ML('detHole') + ' ' + t)}</text>`; });
    y0 += 16 + H + 14 + notes.length * 6 + 6;
    L = String.fromCharCode(L.charCodeAt(0) + 1);
  }
  return s;
}
// простой размер для увеличенного вида: линия со стрелками-засечками и числом посередине (единицы вывода)
function dimLine(a, b, txt, k, f, vert) {
  const t = 1.2 * k, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  let s = `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#000000" stroke-width="${f(0.18 * k)}"/>`;
  for (const p of [a, b]) s += `<path d="M${f(p[0] - t)} ${f(p[1] + t)}L${f(p[0] + t)} ${f(p[1] - t)}" stroke="#000000" stroke-width="${f(0.35 * k)}"/>`;
  s += vert ? `<text x="${f(mx - 1.2 * k)}" y="${f(my)}" font-family="${DFONT}" font-size="${f(4 * k)}" fill="#000000" text-anchor="middle" transform="rotate(-90 ${f(mx - 1.2 * k)} ${f(my)})">${txt}</text>`
            : `<text x="${f(mx)}" y="${f(my - 1.2 * k)}" font-family="${DFONT}" font-size="${f(4 * k)}" fill="#000000" text-anchor="middle">${txt}</text>`;
  return s;
}
function metalBlockLines(un, n) {
  const md = metalData(), page = md.all.indexOf(un) + 1;
  const sz = b => { const s = b.getSize(V3()); return [s.x, s.y, s.z].map(v => Math.round(v)).join('×'); };
  // количество на весь заказ: «Количество изделий» × сколько таких в одном изделии — одним числом, без умножения (Алексей 27.10)
  const Q = M.qty > 0 ? M.qty : 1, fq = c => c * Q + ' ' + ML('nuts');
  // один размер шрифта на всю колонку (5 мм, не меньше), крупнее — только заголовок (Алексей 27.10)
  const F = 5;
  let lines = [[unitTitle(un), 7]];
  if (un.general) lines.push([ML('orderqty') + ': ' + Q, F]); else lines.push([ML('qty') + ': ' + fq(un.qty || 1), F]);
  if (un.general) {                                         // спецификация: листы-полуфабрикаты и покупной крепёж (по именам из модели)
    for (const x of md.units) lines.push([x.no + '.  ' + unitTitle(x) + (x.loose ? '' : ' — ' + sz(x.mbox || x.box)) + ' — ' + fq(x.qty || 1), F]);
    const cnt = new Map();
    for (const x of md.units) for (const h of x.holes) { const n = cleanFast(h.name); if (/^отв/i.test(n)) continue; cnt.set(n, (cnt.get(n) || 0) + (x.qty || 1)); }
    for (const x of md.units) for (const L of x.legs || []) { const n = String(L.name).replace(/^\[[^\]]*\]\s*/, '').split(',')[0].trim(); cnt.set(n, (cnt.get(n) || 0) + (x.qty || 1)); }
    for (const [n, c] of cnt) lines.push([n + ' — ' + fq(c), F]);
  }
  const metals = [...new Set((un.general ? md.units : [un]).map(x => x.metal).filter(Boolean))];
  // материал — только трубы, каждая своей строкой; листы платиков / заглушек не перечисляются
  const mats = un.general ? [...new Set(md.units.flatMap(x => x.pmats || x.mats))] : (un.pmats || un.mats);
  lines.push([ML('mat') + ':', F]); for (const m of mats) lines.push(['   ' + m, F]);
  if (metals.length) lines.push([ML('metalprop') + ': ' + metals.join(', '), F]);
  // покраска — только если задана (замечание «не задана» — в окне проверки, не на листе)
  if (un.paint) lines.push([ML('paint') + ': ' + un.paint, F]); else if (un.stainless) lines.push([ML('paint') + ': ' + ML('nopaintneed'), F]);
  // торцы — всегда явно: заглушка в модели → заглушить, иначе — не глушить (Алексей 27.10)
  if (!un.general && un.hasProf) lines.push([(un.sheets || []).some(s => /заглуш/i.test(s.name)) ? ML('capsYes') : ML('capsNo'), F]);   // у детали из листа торцов труб нет
  if (un.hasStar) lines.push([ML('refnote'), F]);          // ГОСТ 2.307 п. 4.3: есть «*» — надпись «* Размеры для справок»
  // опоры: на видах два габарита — по металлу и с опорой (Алексей 27.10); масштаб, «лист N из M», «от базы» сняты — их даёт отчёт
  // длинная строка — переносом по словам в ширину колонки (знак ≈ 0,5 высоты шрифта)
  return lines.flatMap(([t, h, warn]) => {
    const max = Math.floor(84 / (h * 0.5)), out = []; let cur = '';
    for (const wd of String(t).split(' ')) { if (cur && (cur + ' ' + wd).length > max) { out.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd; }
    if (cur) out.push(cur);
    return out.map(q => [q, h, warn]);
  });
}
// цвет RAL по номеру из свойства «Краска» («RAL 9005», «ral 7024», «порошковая RAL 7016») — справочник ходовых; нет — null
const RAL = { 1013: 0xe3d9c6, 1015: 0xe6d2b5, 1023: 0xf7b500, 2004: 0xe25303, 3000: 0xa72920, 3003: 0x8d1d2c, 3020: 0xc1121c, 5002: 0x00387b, 5005: 0x004f7c,
  5010: 0x0e4c7c, 6005: 0x114232, 6018: 0x57a639, 7004: 0x9b9b9b, 7016: 0x383e42, 7021: 0x2f3234, 7022: 0x4b4d46, 7024: 0x45494e, 7030: 0x8b8c7a,
  7035: 0xc5c7c4, 7037: 0x7a7b7a, 7040: 0x9da3a6, 7042: 0x8d9295, 7045: 0x8f9695, 7047: 0xc8c8c7, 8014: 0x382c1e, 8017: 0x442f29, 8019: 0x3d3635,
  9001: 0xe9e0d2, 9003: 0xf4f4f4, 9005: 0x0a0a0d, 9006: 0xa1a1a0, 9007: 0x878581, 9010: 0xf7f9ef, 9011: 0x1c1c21, 9016: 0xf1f0ea };
function ralColor(s) { const m = /ral\D*(\d{4})/i.exec(String(s || '')); return m && RAL[+m[1]] !== undefined ? RAL[+m[1]] : null; }
// картинка изделия: изометрия всего металла, свой полуфабрикат в цвете покраски (или синим), остальное — светло-серым
function metalThumb(un) {
  if (un.thumb !== undefined) return un.thumb;
  un.thumb = '';
  const rotKeep = metalRotQ; metalRot(null);                // аксонометрия — изделие как есть, без поворота под лист
  try {
    const md = metalData(), all = new Set(), mine = new Set(un.general ? (un.many ? un.gunits.flatMap(x => x.pi) : []) : un.pi);
    for (const t of md.tops) for (const i of partsUnder(t)) all.add(i);
    const GRAY = new THREE.MeshBasicMaterial({ color: 0xd3d8de, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    // цвет — покраска из свойства (RAL по справочнику), осветлённая «в дымке», рёбра видны; нет покраски — синий (Алексей 27.10)
    const paint = un.paint || (un.general ? (md.units.find(x => x.paint) || {}).paint : '') || '';
    const ral = ralColor(paint), hiCol = ral != null ? new THREE.Color(ral).lerp(new THREE.Color(0xffffff), 0.5).getHex() : (un.general && !un.many ? 0xc9d0d8 : 0x8fb6ea);
    const HI = new THREE.MeshBasicMaterial({ color: hiCol, side: THREE.DoubleSide });
    const vis = [], mats = [], lines = [], box = new THREE.Box3();
    root.updateMatrixWorld(true);
    parts.forEach((p, i) => {
      vis.push([p.g, p.g.visible]); p.g.visible = all.has(i); if (!p.g.visible) return;
      box.expandByObject(p.g);
      const on = un.general && !un.many ? true : mine.has(i);   // общий вид при нескольких подрядчиках — выделен свой комплект
      for (const m of p.meshes) { mats.push([m, m.material]); m.material = on ? HI : GRAY; }
      p.g.traverse(o => { if (o.isLineSegments) { lines.push([o, o.visible]); o.visible = on && o.material === EDGE; } });
    });
    // ракурс чуть развёрнут от чистой изометрии и ниже — труба читается объёмной, а не «жирным маркером» (Алексей 27.10)
    const yw = 0.95, pt = 0.48, dir = new THREE.Vector3(Math.cos(pt) * Math.sin(yw), Math.sin(pt), Math.cos(pt) * Math.cos(yw));
    const c = box.getCenter(V3()), R0 = box.getSize(V3()).length() / 2 + 10;
    const ca = new THREE.OrthographicCamera(-R0, R0, R0, -R0, 0.1, R0 * 6);
    ca.position.copy(c).addScaledVector(dir, R0 * 3); ca.up.set(0, 1, 0); ca.lookAt(c); ca.updateMatrixWorld();
    // кадр — впритык к изделию (по углам его рамки на картинке), квадрат с полями 3 %
    let ex = 0; const inv = ca.matrixWorldInverse;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const q = new THREE.Vector3(x, y, z).applyMatrix4(inv); ex = Math.max(ex, Math.abs(q.x), Math.abs(q.y));
    }
    ex *= 1.03; ca.left = -ex; ca.right = ex; ca.top = ex; ca.bottom = -ex; ca.updateProjectionMatrix();
    { const inv2 = inv.clone(), ex2 = ex; un.thumbMap = v => { const q = v.clone().applyMatrix4(inv2); return [(q.x / ex2 + 1) / 2, 1 - (q.y / ex2 + 1) / 2]; }; }   // точка модели → доля картинки
    const N = 700, rt = new THREE.WebGLRenderTarget(N, N), cc = rend.getClearColor(new THREE.Color()), cl = rend.getClearAlpha();
    rend.setRenderTarget(rt); rend.setClearColor(0xffffff, 1); rend.clear(); rend.render(scene, ca);
    const px = new Uint8Array(N * N * 4); rend.readRenderTargetPixels(rt, 0, 0, N, N, px);
    rend.setRenderTarget(null); rend.setClearColor(cc, cl); rt.dispose();
    for (const [g, v] of vis) g.visible = v; for (const [m, mt] of mats) m.material = mt; for (const [o, v] of lines) o.visible = v;
    const cv2 = document.createElement('canvas'); cv2.width = cv2.height = N; const g2 = cv2.getContext('2d'), im = g2.createImageData(N, N);
    for (let y = 0; y < N; y++) im.data.set(px.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);   // кадр снизу вверх
    g2.putImageData(im, 0, 0);
    g2.strokeStyle = '#ffffff'; g2.lineWidth = 10; g2.strokeRect(0, 0, N, N);   // край кадра — белым (в отчёте была видна черта)
    un.thumb = cv2.toDataURL('image/png');
  } catch (e) { console.error('картинка изделия:', e); }
  metalRot(rotKeep);
  need();
  return un.thumb;
}
// комплект: общий вид + все листы → один PDF в «5. Креслення\Дод. креслення\Метал» заказа (печать — локальный сервер)
// листы по одному в папку чертежей зоны — их по порядку имён берёт отчёт Федосова и ставит в свою рамку (Алексей 27.10:
// «для скорости — через шаблон Федосова», своя форматка потом). Номера продолжают то, что уже лежит в папке.
// лист SVG → картинка PNG (белый фон). Шрифт страницы в картинку не попадает — узкий системный Arial Narrow
function svgPng(svg, pxmm) {
  svg = svg.replace(/font-family="[^"]*"/g, 'font-family="Arial Narrow, Arial, sans-serif"');
  return new Promise((ok, no) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = Math.round(SHEET_W * pxmm); c.height = Math.round(SHEET_H * pxmm);
      const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/png').split(',')[1]);
    };
    im.onerror = () => no(new Error('лист не нарисовался картинкой'));
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
// проверка модели при создании чертежей (Алексей 27.10): не останавливает, а показывает список — поправить в модели и
// выгрузить заново. Сейчас: винт без гайки на оси, две гайки в одном месте, полуфабрикат без покраски.
function metalChecks() {
  // координаты — в осях изделия (точки отверстий у полуфабриката лежат в осях его рамки)
  // точки отверстий у каждого полуфабриката — в осях его рамки; сравнивать между полуфабрикатами — в осях изделия
  const W = (v, un) => { const q = v.clone().sub(root.position); if (un && un.rot) q.applyQuaternion(un.rot.clone().invert()); return q; };
  const md = metalData(), out = [], P = (v, un) => { const q = W(v, un); return 'X ' + Math.round(q.x) + ', Y ' + Math.round(q.y) + ', Z ' + Math.round(q.z); };
  const all = []; for (const un of md.units) for (const h of un.holes) all.push({ un, h, a: W(h.a, un), e: W(h.e, un) });
  const nuts = all.filter(x => /гайк/i.test(x.h.name)), bolts = all.filter(x => /винт|болт/i.test(cleanFast(x.h.name)));
  for (const b of bolts) {
    const ax = b.e.clone().sub(b.a), L = ax.length(); if (L < 0.1) continue; ax.normalize();
    const hit = nuts.some(n => { const v = n.a.clone().sub(b.a), t = v.dot(ax); return t > -5 && t < L + 5 && v.addScaledVector(ax, -t).length() < 1.5; });
    if (!hit) out.push(unitTitle(b.un) + ' — ' + cleanFast(b.h.name) + ' (' + P(b.h.a, b.un) + '): ' + ML('c_nonut'));
  }
  for (let i = 0; i < nuts.length; i++) for (let j = i + 1; j < nuts.length; j++)
    if (nuts[i].a.distanceTo(nuts[j].a) < 0.5) out.push(unitTitle(nuts[i].un) + ' — ' + cleanFast(nuts[i].h.name) + ' (' + P(nuts[i].h.a, nuts[i].un) + '): ' + ML('c_twonuts'));
  for (const un of md.units) if (!un.paint && !un.stainless) out.push(unitTitle(un) + ': ' + ML('nopaint'));   // нержавейку не красят
  // отверстие не по оси своей трубы (смещение > 1 мм поперёк) — на листе размер поставлен, но это надо проверить в модели
  for (const un of md.units) {
    if (!un.hasProf) continue;                              // у деталей из листа оси трубы нет
    const mains = un.mains && un.mains.length ? un.mains : [un.box];
    for (const h of un.holes) {
      const q = holeAt(un, h), host = mains.reduce((best, x) => x.distanceToPoint(q.c) < best.distanceToPoint(q.c) ? x : best, mains[0]);
      const s = host.getSize(V3()), la = ['x', 'y', 'z'].reduce((p, k) => s[k] > s[p] ? k : p, 'x'), ha = axName(q.ax).replace('-', '');
      for (const a of ['x', 'y', 'z']) {
        if (a === la || a === ha) continue;
        const off = Math.abs(q.c[a] - (host.min[a] + host.max[a]) / 2);
        if (off > 1 && off < s[a]) out.push(unitTitle(un) + ' — ' + cleanFast(h.name) + ' (' + P(h.a, un) + '): ' + ML('c_offax') + ' ' + fmtN(Math.round(off * 10) / 10) + ' ' + ML('c_mm'));
      }
    }
  }
  return out;
}
// окно со списком замечаний (или «замечаний нет»)
function metalCheckBox(list) {
  let el = $('mcheck');
  if (!el) { el = document.createElement('div'); el.id = 'mcheck'; document.body.appendChild(el);
    el.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:60;max-width:760px;max-height:60vh;overflow:auto;background:#fff;color:#222;border:1px solid #c9d2dc;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:16px 18px;font:14px system-ui,sans-serif'; }
  el.innerHTML = '<b></b><ol style="margin:10px 0 12px 18px;padding:0"></ol><button>OK</button>';
  el.firstChild.textContent = list.length ? ML('c_title') + ' (' + list.length + ')' : ML('c_none');
  for (const s of list) { const li = document.createElement('li'); li.textContent = s; li.style.margin = '4px 0'; el.children[1].appendChild(li); }
  el.lastChild.onclick = () => el.remove();
}
async function metalReport() {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  // папка «Метал» в чертежах отчёта (Алексей 27.10): что там лежало — в корзину, листы с 01 заново
  const dir = LOCAL.order + '\\5. Креслення\\Чертежи для отчета(wmf)\\Метал', got = [];
  try { await srv('/draw/clear', { dir }); } catch (e) { toast(L('p_noSrv') + ': ' + e.message); return; }
  const md = metalData(), cur = metalCur, av = cur !== null ? (md.all.find(x => x.u === cur) || {}).actV : 0; let n = 0;
  for (const un of md.all) {
    // картинкой PNG 15 точек на мм (6000 точек в ширину): отчёт переводил SVG в картинку 2000 точек — было размыто (27.10)
    const b64 = await svgPng(metalSheetSvg(un), 15), name = nextName(got, unitTitle(un).replace(/\.+$/, ''), '.png');
    try { await srv('/draw/save', { dir, name, b64 }); got.push({ name }); n++; }
    catch (e) { toast('не сохранилось: ' + e.message); break; }
  }
  metalBackTo(cur, av);
  toast('в отчёт Федосова — листов ' + n + ' (папка «Метал»' + (md.group ? ', подрядчик ' + md.group : '') + ')');
  const cl = metalChecks(); if (cl.length) metalCheckBox(cl);
  return n;
}
function metalPdfHtml() {
  const md = metalData(), pages = [], cur = metalCur, av = cur !== null ? (md.all.find(x => x.u === cur) || {}).actV : 0;
  for (const un of md.all) pages.push(metalSheetSvg(un));
  metalBackTo(cur, av);
  return '<!doctype html><html><head><meta charset="utf-8">' +
    `<link href="https://fonts.googleapis.com/css2?family=${DFONT.replace(/ /g, '+')}&display=block" rel="stylesheet">` +
    '<style>@page{size:420mm 297mm;margin:0}html,body{margin:0}.pg{width:420mm;height:297mm;display:flex;align-items:center;justify-content:center;break-after:page;overflow:hidden}' +
    '.pg:last-child{break-after:auto}.pg svg{width:400mm;height:283mm}</style></head><body>' + pages.map(s => `<div class="pg">${s}</div>`).join('') + '</body></html>';
}
async function metalPdf(suffix) {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  const md = metalData(), html = metalPdfHtml();
  const name = (M.title || 'изделие') + '_Чертежи металлоизделий' + (md.group ? ' — ' + md.group.replace(/[\\/:*?"<>|]/g, '_') : '') + (suffix || '') + '.pdf', dir = LOCAL.order + '\\5. Креслення\\Дод. креслення\\Метал';
  toast('собираю PDF: листов ' + md.all.length + '…');
  try { const r = await srv('/draw/pdf', { dir, name, html }); toast('PDF готов: ' + r.file); const cl = metalChecks(); if (cl.length) metalCheckBox(cl); return r.file; }
  catch (e) {
    // старый PDF открыт в просмотрщике — Windows не даёт его перезаписать: кладём рядом с хвостом «(новый)»
    if (!suffix && /использ|used by another|доступ/i.test(e.message)) return metalPdf(' (новый)');
    toast('PDF не собрался: ' + e.message); return null;
  }
}
// для самопроверки в невидимом браузере: данные, лист, размеры и выноски текущего листа
window.__metal = { data: () => metalData(), show: (u, vi) => metalShow(u, vi), off: () => metalOff(),
  views: () => { const un = metalData().all.find(x => x.u === metalCur); return un ? { act: un.actV, n: drawN, stat: (un.stat || []).map(s => s.v), v: metalViews(un).map(w => [w.v, Math.round(w.px), Math.round(w.py)]) } : null; },
  move: (v, dx, dy) => { const un = metalData().all.find(x => x.u === metalCur), P = {}; for (const w of metalViews(un)) P[w.v] = [w.px, w.py]; metalDragView(un, v, P, dx, dy); drawOverlay(); },
  sheet: () => { const un = metalData().all.find(x => x.u === metalCur), av = un.actV, s = metalSheetSvg(un); metalBackTo(un.u, av); return s; },
  scale: n => metalApplyScale(metalData().all.find(x => x.u === metalCur), n), del: v => metalDelView(metalData().all.find(x => x.u === metalCur), v),
  dims: () => dims.filter(dimHere).filter(d => d.axis).map(d => [d.axis, Math.round(Math.abs(d.b.clone().sub(d.a).dot(AX[d.axis])))]), notes: () => mnotes.filter(n => n.mk === metalCur).map(n => n.txt.join(' / ')), svg: () => buildSVG(), pdf: () => metalPdf(), rep: () => metalReport(), chk: () => metalChecks(), grp: g => { metalOff(); metalGroupSel = g; return metalData().group; },
  // самопроверка инструментов листа: сечение по двум точкам сцены (сторона s, место на листе мм от середины, масштаб sN)
  sec: (a, b, s, pos, sN) => { const sc = { a: new THREE.Vector3(...a), b: new THREE.Vector3(...b), s, vdir: viewDir().clone(), fs: hideFac, letter: 'А', sN: sN || 0, rot: 0, pos, mk: metalCur }; Object.assign(sc, secCut(sc)); secs.push(sc); drawOverlay(); return sc.G.length; } };
function metalMenu(b) {
  const md = metalData(), el = $('dfly');
  if (!md.units.length) { toast(ML('m_none')); return; }
  flyFor = b;
  const mdB = metal;                                        // подрядчики: выбор комплекта (один — кнопок нет)
  const grpBtns = mdB.groups.length > 1 ? mdB.groups.map((g, k) => `<button data-mg="${k}" class="${g === md.group ? 'on' : ''}"><span>${esc(ML('ctr') + ': ' + (g || ML('noctr')))}</span></button>`).join('') : '';
  // дополнительные виды текущего листа (снизу / сзади / справа) — кладутся в свободное место в том же масштабе
  const cur = metalCur !== null && !texCur ? md.all.find(x => x.u === metalCur) : null;
  // удалённые с листа основные виды — вернуть (Алексей 29.10)
  const back = cur ? (cur.vdel || []).map(v => `<button data-mr="${v}"><span>${esc('+ ' + ML('m_view') + ' ' + ML('v_' + v))}</span></button>`).join('') : '';
  const exBtns = back + (cur ? ['bottom', 'back', 'right'].filter(v => !(cur.vdel || []).includes(v)).map(v => `<button data-mv="${v}" class="${(cur.extra || []).includes(v) ? 'on' : ''}"><span>${esc('+ ' + ML('m_view') + ' ' + ML('v_' + v))}</span></button>`).join('') : '');
  el.innerHTML = grpBtns + `<button data-mu="pdf"><span>${esc(ML('m_pdf'))}</span></button><button data-mu="rep"><span>${esc(ML('m_rep'))}</span></button><button data-mu="chk"><span>${esc(ML('m_chk'))}</span></button>` +
    md.all.map(x => `<button data-mu="${x.u}" class="${metalCur === x.u ? 'on' : ''}"><span>${esc(unitTitle(x))}</span></button>`).join('') + exBtns +
    `<button data-mu="off"><span>${esc(ML('m_off'))}</span></button>`;
  el.querySelectorAll('[data-mv]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); closeFly();
    const v = q.dataset.mv, ex = cur.extra || (cur.extra = []), i = ex.indexOf(v); if (i >= 0) ex.splice(i, 1); else ex.push(v);
    cur.lay = null; metalShow(cur.u, i >= 0 ? 0 : v);      // новый вид сразу живой
  }; });
  el.querySelectorAll('[data-mr]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); closeFly();
    const v = q.dataset.mr; cur.vdel = (cur.vdel || []).filter(x => x !== v);
    cur.vpos = null; cur.lay = null; metalShow(cur.u, v);   // вернули вид — лист раскладывается заново в том же масштабе
  }; });
  el.querySelectorAll('[data-mg]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); metalOff(); metalGroupSel = mdB.groups[+q.dataset.mg]; closeFly(); metalMenu(b);
  }; });
  el.querySelectorAll('[data-mu]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); closeFly();
    const v = q.dataset.mu; if (v === 'off') metalOff(); else if (v === 'pdf') metalPdf(); else if (v === 'rep') metalReport(); else if (v === 'chk') metalCheckBox(metalChecks()); else metalShow(+v);
  }; });
  el.classList.add('show');
  const r = b.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(innerWidth - el.offsetWidth - 6, r.left)) + 'px'; el.style.top = (r.bottom + 4) + 'px';
}
// ---------- переход текстуры на шпоне (тема 54): лист на группу для менеджера Вияра ----------
// Группу ставит окно «Раскладка по текстуре» в Базисе с галочкой «Шпон»: на панелях пометка «Подбор текстуры» = «Шпон; Г<n>».
// Лист — вид на лицо группы: только её панели (как стоят, с настоящими зазорами) и фурнитура, что их пересекает (по ней
// менеджер видит верх / низ и не перевернёт); что за панелью — пунктиром. Размеры (Алексей 28.10): ширины снизу, высоты
// слева, одинаковые — один раз (колонка одной ширины — одна цифра), зазоры между панелями — обязательно, габарита нет.
// Выноска на каждую панель — подпись правится руками (номер детали Вияра), хранится в браузере по странице.
const TEX_U0 = -9000, TEX_BLK = 32, TEX_NL = 12;           // TEX_BLK — мм листа снизу под надписи; TEX_NL — полки выносок над изделием
const texKey = i => 'texNote|' + (M.title || '') + '|' + i;
const texNote = i => { try { const v = localStorage.getItem(texKey(i)); if (v) return v; } catch (e) {} const o = M.objs[i]; return o.d || ML('t_pos') + ' ' + (o.pos || '?'); };   // обозначение Базиса «3.1-20» — с номером блока, позиции в разных блоках повторяются
function texBuild() {
  if (texList) return texList;
  const by = new Map();
  M.objs.forEach((o, i) => {
    if (o.k !== 'p' || !o.up || !parts[i]) return;
    for (const k in o.up) {
      if (k.trim().toLowerCase() !== 'подбор текстуры') continue;
      const m = /Шпон[\s\S]*?Г\s*(\d+)/i.exec(String(o.up[k] || '')); if (!m) continue;
      if (!by.has(+m[1])) by.set(+m[1], []); by.get(+m[1]).push(i);
    }
  });
  root.updateMatrixWorld(true);
  const HL = (M.holes || []).map(h => ({ a: WP(h[0], h[1], h[2]), e: WP(h[3], h[4], h[5]), r: h[6] / 2 }));
  texList = [...by.keys()].sort((a, b) => a - b).map(g => {
    const panels = by.get(g), boxes = panels.map(i => new THREE.Box3().expandByObject(parts[i].g)), box = new THREE.Box3();
    for (const b of boxes) box.union(b);
    // отверстия, что проходят через панель (Алексей 28.10: тело фурнитуры не нужно — на Вияр уходят только отверстия;
    // петля — ⌀35 и два малых, минификс в пласть — ⌀5, шкант — ⌀8): кусок оси внутри панели, не короче 1 мм
    const holes = [];
    for (const h of HL) {
      const L = h.a.distanceTo(h.e); if (L < 0.1) continue;
      const sb = new THREE.Box3().setFromPoints([h.a, h.e]);
      boxes.forEach((b, j) => {
        const bb = b.clone().expandByScalar(0.05); if (!bb.intersectsBox(sb)) return;
        const n = Math.max(2, Math.ceil(L / 0.25)), P = V3(); let t0 = -1, t1 = -1;
        for (let s = 0; s <= n; s++) { P.copy(h.a).lerp(h.e, s / n); if (bb.containsPoint(P)) { if (t0 < 0) t0 = s / n; t1 = s / n; } }
        if (t0 < 0 || (t1 - t0) * L < 1) return;              // только касается панели (отверстие соседней детали у её грани) — не её
        holes.push({ j, p0: h.a.clone().lerp(h.e, t0), p1: h.a.clone().lerp(h.e, t1), ax: h.e.clone().sub(h.a).normalize(), r: h.r });
      });
    }
    // вид — на лицо: лицевая сторона из выгрузки (fn), нет — тонкая ось группы со стороны «к нам»
    const o0 = M.objs[panels[0]], s = box.getSize(V3()), thin = ['x', 'y', 'z'].reduce((p, q) => s[q] < s[p] ? q : p, 'z');
    const fn = o0.fn ? new THREE.Vector3(o0.fn[0], o0.fn[1], o0.fn[2]) : AX[thin].clone();
    const a = axName(fn), view = { z: 'front', '-z': 'back', x: 'right', '-x': 'left', y: 'top', '-y': 'top' }[a] || 'front';
    return { u: TEX_U0 - g, g, panels, boxes, box, pi: panels, holes, view, mat: (M.mnames || [])[o0.mn] || '' };
  });
  return texList;
}
const texTitle = un => ML('tex') + ' — ' + ML('t_grp') + ' ' + un.g;
function texDims(un) {
  const vk = viewKey();
  for (const dm of dims.filter(d => d.mk === un.u)) removeDim(dm);
  for (let i = mnotes.length - 1; i >= 0; i--) if (mnotes[i].mk === un.u) mnotes.splice(i, 1);
  const { R, U } = viewAxes(), k = drawN, ROW = 9 * k, FIRST = 11 * k, b = un.box, mid = b.getCenter(V3());
  const upS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 1)[U]) || 1, rtS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 0)[R]) || 1;
  // промежутки панелей вдоль оси (в направлении листа): одинаковые — один раз; ряд = цепочка без наложений, слева направо
  const rowsOf = (ax, sg) => {
    const ivs = [];
    for (const x of un.boxes) { let p = x.min[ax] * sg, q = x.max[ax] * sg; if (p > q) [p, q] = [q, p]; if (!ivs.some(z => Math.abs(z[0] - p) < 0.5 && Math.abs(z[1] - q) < 0.5)) ivs.push([p, q]); }
    ivs.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const rows = [];
    for (const iv of ivs) { let r = rows.find(row => row[row.length - 1][1] <= iv[0] + 0.5); if (!r) rows.push(r = []); r.push(iv); }
    return rows;
  };
  const mids = [];
  const put = (a, bb, axis, offV) => {
    const dm = addDim(a, bb, { mk: un.u, col: '#000000', fsz: 5, small: true }); dm.axis = axis; dm.off = offV;
    const m = (a[axis] + bb[axis]) / 2, near = mids.filter(z => z.axis === axis && Math.abs(z.m - m) < 14 * k);
    if (near.length) dm.stag = near.length % 2 ? 1 : -1; mids.push({ axis, m });
    buildDim(dm);
  };
  const pt = (rv, uv) => { const p = mid.clone(); p[R] = rv; p[U] = uv; return p; };
  // ряд — цепочка: размер каждой панели и зазор до следующей (зазор и есть переход рисунка).
  // Столярка (un.gapRows, Алексей 28.10): зазоры и размеры фасадов — в разных рядах, зазоры ближе к виду, размеры дальше
  const rowsR = rowsOf(R, rtS), rowsU = rowsOf(U, upS), PER = un.gapRows ? 2 : 1;
  const eu = upS > 0 ? b.min[U] : b.max[U], dirB = AX[U].clone().multiplyScalar(-upS);   // снизу
  const er = rtS > 0 ? b.min[R] : b.max[R], dirL = AX[R].clone().multiplyScalar(-rtS);   // слева
  rowsR.forEach((row, ri) => { const offG = dirB.clone().multiplyScalar(FIRST + ri * PER * ROW), off = dirB.clone().multiplyScalar(FIRST + (ri * PER + PER - 1) * ROW);
    for (let i = 0; i < row.length; i++) {
      put(pt(row[i][0] / rtS, eu), pt(row[i][1] / rtS, eu), R, off);
      if (i + 1 < row.length && row[i + 1][0] - row[i][1] > 0.3) put(pt(row[i][1] / rtS, eu), pt(row[i + 1][0] / rtS, eu), R, offG);
    } });
  rowsU.forEach((row, ri) => { const offG = dirL.clone().multiplyScalar(FIRST + ri * PER * ROW), off = dirL.clone().multiplyScalar(FIRST + (ri * PER + PER - 1) * ROW);
    for (let i = 0; i < row.length; i++) {
      put(pt(er, row[i][0] / upS), pt(er, row[i][1] / upS), U, off);
      if (i + 1 < row.length && row[i + 1][0] - row[i][1] > 0.3) put(pt(er, row[i][1] / upS), pt(er, row[i + 1][0] / upS), U, offG);
    } });
  // выноски — над изделием одним рядом (texNotesSvg): сверху место под полки, справа — если подписи шире изделия;
  // столярка — без выносок (номера посреди фасадов), сверху только зазор
  const pad = { t: un.gapRows ? 4 : TEX_NL + 7, r: 3, b: rowsR.length ? 11 + (rowsR.length * PER - 1) * 9 + 6 : 3, l: rowsU.length ? 11 + (rowsU.length * PER - 1) * 9 + 6 : 3 };
  if (!un.gapRows) { const wAll = un.panels.reduce((s, i) => s + (un.noteFn || texNote)(i).length * 2.5 + 4, 0), wG = Math.abs(b.max[R] - b.min[R]) / k;
    if (wAll > wG) pad.r = wAll - wG + 3; }
  un.padNow = pad;
  drawOverlay();
}
// масштаб — самый крупный из ряда, при котором вид с размерами и выносками помещается над надписями; вид — посередине
function texLayout(un) {
  const AW = SHEET_W - 2 * EDGE_M, AH = SHEET_H - 2 * EDGE_M - TEX_BLK;
  for (const n of SCALES) {
    drawFix = drawN = n;
    const g = metalCam(un, un.view); texDims(un);
    const p = un.padNow, w = g.w / n + p.l + p.r, h = g.h / n + p.t + p.b;
    if (w <= AW && h <= AH) return { n, px: EDGE_M + (AW - w) / 2 + p.l + g.w / n / 2, py: EDGE_M + (AH - h) / 2 + p.t + g.h / n / 2 };
  }
  const n = SCALES[SCALES.length - 1]; drawFix = drawN = n; metalCam(un, un.view); texDims(un);
  return { n, px: SHEET_W / 2, py: (SHEET_H - TEX_BLK) / 2 };
}
function texShow(g) {
  const un = texBuild().find(x => x.g === g); if (!un) return;
  if (metalCur === null) metalPrevFix = drawFix;
  metalCur = un.u; texCur = un; selDim = null; endTool();
  for (const k in nodes) nodes[k].hidden = false;
  const keepI = new Set(un.pi); parts.forEach((p, i) => { p.hidden = !keepI.has(i); }); applyVis(); renderTree();
  if (!un.lay) un.lay = texLayout(un);
  drawFix = drawN = un.lay.n;
  metalPlace(metalCam(un, un.view), un.lay.px, un.lay.py);
  if (!dims.some(d => d.mk === un.u)) texDims(un);
  fitView();
  frameName = texTitle(un); const nm = $('dName'); if (nm) nm.value = frameName;
  syncPanel(); drawInfo(); need();
}
// надписи внизу листа: что это, материал, указание менеджеру
function texBlockSvg(o, k) {
  const un = texCur; if (!un) return '';
  const f = v => String(Math.round(v * 100) / 100), x = o[0] + EDGE_M * k;
  const lines = [[texTitle(un) + ' · ' + un.panels.length + ' ' + ML('nuts'), 7], [ML('mat') + ': ' + un.mat, 5], [ML('t_keep'), 5], [ML('t_num'), 5]];
  let y = o[1] + (SHEET_H - TEX_BLK - 4) * k, s = '';
  for (const [t, h] of lines) { y += (h + 1.6) * k; s += `<text x="${f(x)}" y="${f(y)}" font-family="${DFONT}" font-size="${f(h * k)}" fill="#000000">${esc(t)}</text>`; }
  return s;
}
// выноски (Алексей 28.10): точка на детали, полки — над изделием на одном уровне, слева направо по порядку деталей,
// чтобы линии не перекрещивались. Подпись правится двойным щелчком по ней (номер детали Вияра)
function texNotesSvg(un, toP, k, exp) {
  const f = v => String(Math.round(v * 100) / 100), col = '#000000', sw = exp ? 0.18 : Math.max(1, 0.18 * k);
  let top = Infinity;
  for (const x of [un.box.min.x, un.box.max.x]) for (const y of [un.box.min.y, un.box.max.y]) for (const z of [un.box.min.z, un.box.max.z]) top = Math.min(top, toP(new THREE.Vector3(x, y, z))[1]);
  const lvl = top - TEX_NL * k;
  // un.noteFn — своя подпись (лист столярки: номер строки таблицы), тогда подпись не правится на месте
  const pts = un.panels.map((i, j) => ({ i, p: toP(un.boxes[j].getCenter(V3())), txt: (un.noteFn || texNote)(i) })).sort((a, b) => a.p[0] - b.p[0] || a.p[1] - b.p[1]);
  let s = '', xEnd = -Infinity;
  for (const q of pts) {
    const w = q.txt.length * 2.5 * k + 2 * k, x0 = Math.max(q.p[0] - w / 2, xEnd + 4 * k); xEnd = x0 + w;
    s += `<path d="M${f(q.p[0])} ${f(q.p[1])}L${f(x0)} ${f(lvl)}L${f(x0 + w)} ${f(lvl)}" fill="none" stroke="${col}" stroke-width="${f(sw)}"/>` +
      `<circle cx="${f(q.p[0])}" cy="${f(q.p[1])}" r="${f(0.6 * k)}" fill="${col}"/>` +
      `<text x="${f(x0 + k)}" y="${f(lvl - 1.4 * k)}" font-family="${DFONT}" font-size="${f(5 * k)}" fill="${col}"` +
      (exp || un.noteFn ? '' : ` class="tn" data-n="${q.i}" style="pointer-events:all;cursor:text"`) + `>${esc(q.txt)}</text>`;
  }
  return s;
}
// ---------- столярка: рамочные фасады — техзадание столяру (28.10) ----------
// Рамочный фасад узнаётся по устройству, без меток: блок «фронт», в нём полуфабрикат категории «Столярка» (класс материала
// «Дерево», экспорт detectSemiCategories) с профилями (пф) и, если есть, панель наполнения. Лист — на верхний блок изделия
// («Пеналы кухни», «входная группа»): вид спереди на фасады и фурнитуру, что в них стоит (ручка на лице — сплошной, петля за
// фасадом — пунктиром: так столяр видит, какая дверь левая / правая; Алексей 28.10). Ширины снизу / высоты слева в два ряда:
// зазоры между фасадами — ближний ряд, размеры фасадов — дальний (Алексей 28.10); номер строки таблицы — бледной цифрой
// посреди фасада, без выносок. Справа колонка: таблица «№ | ширина × высота | шт.», рамка (материал, сечение с размерами по
// контуру из модели), наполнение, отделка — пишет Алексей двойным щелчком, хранится в браузере по странице; пустая отделка
// на экране — серая подсказка, в картинку не идёт.
const JOIN_U0 = -19000, JOIN_COL = 118;                    // JOIN_COL — мм листа под колонку справа
const joinKey = t => 'joinFin|' + (M.title || '') + '|' + t;
const joinFin = t => { try { const v = localStorage.getItem(joinKey(t)); if (v) return v; } catch (e) {} return ''; };
function joinBuild() {
  if (joinList) return joinList;
  const par = {};
  for (const p of parts) for (let k = 0; k + 1 < p.h.length; k++) par[p.h[k]] = p.h[k + 1];
  const anc = id => { const o = []; for (let c = par[id], g = 0; c !== undefined && g < 60; c = par[c], g++) o.push(c); return o; };
  const ns = M.nsemi || {}, isLayer = id => M.ntype[id] === 'layer' || /layer/i.test(M.ntype[id] || '');
  const drafts = Object.keys(ns).map(Number).filter(id => (ns[id] || []).includes('Столярка') && !(ns[id] || []).includes('Метал') && M.ntype[id] === 'TDraftBlock');
  root.updateMatrixWorld(true);
  // фурнитура модели с габаритами — на лист идёт та, что стоит на фасаде: лежит на его пласти (чашка петли, TIP-ON, демпфер,
  // ручка — в выгрузке форма чашки сидит на задней пласти, в тело не входит) и накрывает его не меньше 3 мм по обеим сторонам
  // пласти (полкодержатели и ответные планки рядом на корпусе — мимо)
  const hwAll = parts.map((p, i) => p.isF && !p.isL ? { i, b: new THREE.Box3().expandByObject(p.g, true) } : null).filter(Boolean);
  // (встроенная техника — холодильник за дверью — накрывает фасад больше чем наполовину: не фурнитура фасада, мимо)
  const onFacade = (hb, fb) => { const s = fb.getSize(V3()), thin = ['x', 'y', 'z'].reduce((p, q) => s[q] < s[p] ? q : p, 'z'); let area = 1, fa = 1;
    for (const ax of ['x', 'y', 'z']) { const ov = Math.min(hb.max[ax], fb.max[ax]) - Math.max(hb.min[ax], fb.min[ax]); if (ov < (ax === thin ? -1 : 3)) return false; if (ax !== thin) { area *= ov; fa *= s[ax]; } }
    return area < fa * 0.5; };
  const byTop = new Map();
  for (const d of drafts) {
    const a = anc(d);
    const pfI = parts.map((p, i) => p.h.includes(d) && M.objs[i].pf ? i : -1).filter(i => i >= 0); if (!pfI.length) continue;
    const fr = a.find(x => /фронт/i.test(M.nft[x] || '')) ?? a[0];
    const pi = parts.map((p, i) => p.h.includes(fr) && (M.objs[i].k === 'p' || M.objs[i].k === 'b') ? i : -1).filter(i => i >= 0);
    const top = a.find((x, j) => j + 1 >= a.length || isLayer(a[j + 1])) ?? a[a.length - 1];
    if (!byTop.has(top)) byTop.set(top, []);
    if (byTop.get(top).some(f => f.fr === fr)) continue;
    const fill = pi.map(i => M.objs[i]).find(o => o.k === 'p');
    const box = pi.reduce((b, i) => b.union(new THREE.Box3().expandByObject(parts[i].g, true)), new THREE.Box3());
    const hw = hwAll.filter(q => onFacade(q.b, box)).map(q => q.i);
    byTop.get(top).push({ fr, d, pi, hw, pfI, box,
      frameMat: (M.mnames || [])[M.objs[pfI[0]].mn] || '', sec: M.objs[pfI[0]].pf.s, fillMat: fill ? (M.mnames || [])[fill.mn] || '' : '', fillTh: fill ? fill.th : 0 });
  }
  // лист — на изделие и сторону: фасады смотрят в разные стороны (угловой пенал) — на каждую сторону свой лист.
  // Сторона — тонкая ось фасада, знак — от середины изделия к фасаду (фасады снаружи корпуса)
  joinList = []; let n = 0;
  for (const t of [...byTop.keys()].sort((a, b) => a - b)) {
    const tb = partsUnder(t).reduce((b, i) => b.union(new THREE.Box3().expandByObject(parts[i].g, true)), new THREE.Box3()), tc = tb.getCenter(V3());
    const sideOf = f => { const s = f.box.getSize(V3()), thin = ['x', 'y', 'z'].reduce((p, q) => s[q] < s[p] ? q : p, 'z'); return ((f.box.getCenter(V3())[thin] - tc[thin]) < 0 ? '-' : '') + thin; };
    const bySide = new Map();
    for (const f of byTop.get(t)) { const k = sideOf(f); if (!bySide.has(k)) bySide.set(k, []); bySide.get(k).push(f); }
    for (const [side, facs] of bySide) {
      const box = new THREE.Box3(); for (const f of facs) box.union(f.box);
      const view = { z: 'front', '-z': 'back', x: 'right', '-x': 'left', y: 'top', '-y': 'top' }[side] || 'front';
      const un = { u: JOIN_U0 - n++, t, side, name: (M.names[t] || 'изделие') + (bySide.size > 1 ? ' (' + (ML('side')[side] || side) + ')' : ''),
                   facs, pi: [...new Set(facs.flatMap(f => f.pi.concat(f.hw)))], boxes: facs.map(f => f.box), box, panels: facs.map(f => f.fr), holes: [], view, gapRows: true };
      un.noteFn = fr => String((un.rowOf || {})[fr] || '');   // номер строки таблицы — бледной цифрой посреди фасада (joinNumsSvg)
      joinList.push(un);
    }
  }
  return joinList;
}
const joinTitle = un => ML('join') + ' — ' + un.name;
// «1 фасад / 2 фасада / 5 фасадов» (укр.: фасад / фасади / фасадів)
const joinFacWord = n => { const m10 = n % 10, m100 = n % 100, uk = dLang === 'uk';
  if (m10 === 1 && m100 !== 11) return uk ? 'фасад' : 'фасад';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return uk ? 'фасади' : 'фасада';
  return ML('j_fac'); };
// строки таблицы: одинаковые ширина × высота (на виде спереди) — одна строка «N шт.»; номер строки — на выноске фасада
function joinRows(un) {
  const { R, U } = viewAxes(), rows = []; un.rowOf = {};
  // нумерация — как стоят: слева направо, в столбце сверху вниз (как на листе глазами)
  const rtS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 0)[R]) || 1, upS = Math.sign(V3().setFromMatrixColumn(cam.matrixWorld, 1)[U]) || 1;
  const facs = un.facs.slice().sort((a, b) => { const ca = a.box.getCenter(V3()), cb = b.box.getCenter(V3()); return (ca[R] - cb[R]) * rtS || (cb[U] - ca[U]) * upS; });
  for (const f of facs) {
    const s = f.box.getSize(V3()), w = Math.round(s[R] * 2) / 2, h = Math.round(s[U] * 2) / 2;
    let r = rows.find(x => x.w === w && x.h === h); if (!r) rows.push(r = { w, h, n: 0 });
    r.n++; un.rowOf[f.fr] = rows.indexOf(r) + 1;
  }
  return rows;
}
// масштаб — самый крупный, при котором вид с размерами и выносками помещается слева от колонки; вид — посередине поля
function joinLayout(un) {
  const AW = SHEET_W - 2 * EDGE_M - JOIN_COL - 6, AH = SHEET_H - 2 * EDGE_M;
  for (const n of SCALES) {
    drawFix = drawN = n;
    const g = metalCam(un, un.view); joinRows(un); texDims(un);
    const p = un.padNow, w = g.w / n + p.l + p.r, h = g.h / n + p.t + p.b;
    if (w <= AW && h <= AH) return { n, px: EDGE_M + (AW - w) / 2 + p.l + g.w / n / 2, py: EDGE_M + (AH - h) / 2 + p.t + g.h / n / 2 };
  }
  const n = SCALES[SCALES.length - 1]; drawFix = drawN = n; metalCam(un, un.view); joinRows(un); texDims(un);
  return { n, px: (SHEET_W - JOIN_COL) / 2, py: SHEET_H / 2 };
}
function joinShow(u) {
  const un = joinBuild().find(x => x.u === u); if (!un) return;
  if (metalCur === null) metalPrevFix = drawFix;
  metalCur = un.u; joinCur = un; texCur = null; selDim = null; endTool();
  metalRot(null);
  for (const k in nodes) nodes[k].hidden = false;
  const keepI = new Set(un.pi); parts.forEach((p, i) => { p.hidden = !keepI.has(i); }); applyVis(); renderTree();
  if (!un.lay) un.lay = joinLayout(un);
  drawFix = drawN = un.lay.n;
  metalPlace(metalCam(un, un.view), un.lay.px, un.lay.py);
  if (!dims.some(d => d.mk === un.u)) { joinRows(un); texDims(un); }
  fitView();
  frameName = joinTitle(un); const nm = $('dName'); if (nm) nm.value = frameName;
  syncPanel(); drawInfo(); need();
}
// сечение рамки по контуру из модели (как на вкладке «Столярка» раскроя профилей): прямые и дуги, снизу цепочка ступенек
// и общий размер, справа так же. Рисуется в мм листа в поле (x0, y0) шириной W; возвращает svg и занятую высоту
function joinSecSvg(o, k, els0, x0, y0, W) {
  if (!els0 || !els0.length) return { s: '', h: 0 };
  let mx = Infinity, my = Infinity, Mx = -Infinity, My = -Infinity;
  for (const e of els0) for (const [x, y] of [[e[1], e[2]], [e[3], e[4]]]) if (x != null) { mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
  const els = els0.map(e => ({ t: e[0], x1: e[1] - mx, y1: e[2] - my, x2: e[3] - mx, y2: e[4] - my, cx: e[5] != null ? e[5] - mx : null, cy: e[6] != null ? e[6] - my : null, dir: e[8] }));
  const w = Mx - mx, h = My - my;
  const steps = ax => {
    const v = [0, ax === 'x' ? w : h];
    for (const e of els) { if (e.t !== 1) continue;
      if (ax === 'x' && Math.abs(e.x1 - e.x2) < 0.05 && Math.abs(e.y1 - e.y2) > 1.5) v.push(e.x1);
      if (ax === 'y' && Math.abs(e.y1 - e.y2) < 0.05 && Math.abs(e.x1 - e.x2) > 1.5) v.push(e.y1); }
    v.sort((a, b) => a - b); const out = [];
    v.forEach((q, j) => { if (!out.length || q - out[out.length - 1] > 1.5) out.push(q); else if (j === v.length - 1) out[out.length - 1] = q; });
    return out;
  };
  const sx = steps('x'), sy = steps('y'), chX = sx.length > 2, chY = sy.length > 2;
  const f = v => String(Math.round(v * 100) / 100), FS = 3.2, ROW = 6.5;
  const padR = (chY ? 2 : 1) * ROW + 6, padB = (chX ? 2 : 1) * ROW + 3, maxH = 46;
  const sc = Math.min((W - padR) / (w || 1), (maxH - padB) / (h || 1), 1);   // не крупнее 1:1
  const ox = x0, oy = y0 + h * sc;                           // y модели вверх → на листе вниз
  const X = x => o[0] + (ox + x * sc) * k, Y = y => o[1] + (oy - y * sc) * k;
  let d = '';
  for (const e of els) {
    d += 'M' + f(X(e.x1)) + ' ' + f(Y(e.y1));
    if (e.t === 2 && e.cx != null) {
      const r = Math.hypot(e.x1 - e.cx, e.y1 - e.cy), a1 = Math.atan2(e.y1 - e.cy, e.x1 - e.cx), a2 = Math.atan2(e.y2 - e.cy, e.x2 - e.cx);
      let sw = e.dir ? a2 - a1 : a1 - a2; while (sw < 0) sw += 2 * Math.PI; while (sw > 2 * Math.PI) sw -= 2 * Math.PI;
      d += 'A' + f(r * sc * k) + ' ' + f(r * sc * k) + ' 0 ' + (sw > Math.PI ? 1 : 0) + ' ' + (e.dir ? 0 : 1) + ' ' + f(X(e.x2)) + ' ' + f(Y(e.y2));
    } else d += 'L' + f(X(e.x2)) + ' ' + f(Y(e.y2));
  }
  let s = `<path d="${d}" fill="none" stroke="#000000" stroke-width="${f(0.35 * k)}" stroke-linecap="round"/>`;
  const ln = (a, b, c, e, sw) => `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(e)}" stroke="#000000" stroke-width="${f(sw * k)}"/>`;
  const dimH = (a, b, yy) => ln(X(a), yy, X(b), yy, 0.2) + ln(X(a), Y(0) + 1 * k, X(a), yy + 1.2 * k, 0.13) + ln(X(b), Y(0) + 1 * k, X(b), yy + 1.2 * k, 0.13) +
    `<text x="${f((X(a) + X(b)) / 2)}" y="${f(yy - 0.8 * k)}" font-family="${DFONT}" font-size="${f(FS * k)}" fill="#000000" text-anchor="middle">${fmtN(b - a)}</text>`;
  const dimV = (a, b, xx) => ln(xx, Y(a), xx, Y(b), 0.2) + ln(X(w) + 1 * k, Y(a), xx + 1.2 * k, Y(a), 0.13) + ln(X(w) + 1 * k, Y(b), xx + 1.2 * k, Y(b), 0.13) +
    `<text x="${f(xx + 1 * k)}" y="${f((Y(a) + Y(b)) / 2 + 1.1 * k)}" font-family="${DFONT}" font-size="${f(FS * k)}" fill="#000000">${fmtN(b - a)}</text>`;
  let yRow = Y(0) + ROW * k;
  if (chX) { for (let a = 0; a < sx.length - 1; a++) s += dimH(sx[a], sx[a + 1], yRow); yRow += ROW * k; }
  s += dimH(0, w, yRow);
  let xCol = X(w) + 4 * k;
  if (chY) { for (let b = 0; b < sy.length - 1; b++) s += dimV(sy[b], sy[b + 1], xCol); xCol += ROW * k; }
  s += dimV(0, h, xCol);
  return { s, h: h * sc + padB + 2 };
}
// колонка справа: заголовок, таблица фасадов, рамка с сечением, наполнение, отделка (правится на месте)
function joinBlockSvg(o, k, exp) {
  const un = joinCur; if (!un) return '';
  const f = v => String(Math.round(v * 100) / 100), x = SHEET_W - EDGE_M - JOIN_COL, T = (t, xx, yy, h, extra) =>
    `<text x="${f(o[0] + xx * k)}" y="${f(o[1] + yy * k)}" font-family="${DFONT}" font-size="${f(h * k)}" fill="#000000"${extra || ''}>${esc(t)}</text>`;
  const rows = un.rowOf ? joinRowsCached(un) : joinRows(un);
  let y = EDGE_M + 6, s = T(joinTitle(un), x, y, 5.5); y += 5;
  s += T(un.facs.length + ' ' + joinFacWord(un.facs.length), x, y, 3.8); y += 7;
  const C = [x, x + 10, x + 44, x + JOIN_COL], HL = 6.2;
  const line = (yy, sw) => `<line x1="${f(o[0] + C[0] * k)}" y1="${f(o[1] + yy * k)}" x2="${f(o[0] + C[3] * k)}" y2="${f(o[1] + yy * k)}" stroke="#000000" stroke-width="${f(sw * k)}"/>`;
  s += line(y - 4.6, 0.3) + T(ML('j_no'), C[0] + 1, y, 3.6) + T(ML('j_wh'), C[1] + 1, y, 3.6) + T(ML('j_qty'), C[2] + 1, y, 3.6); y += 1.6; s += line(y, 0.3);
  rows.forEach((r, i) => { y += HL; s += T(String(i + 1), C[0] + 1, y - 1.6, 3.8) + T(fmtN(r.w) + ' × ' + fmtN(r.h), C[1] + 1, y - 1.6, 3.8) + T(String(r.n), C[2] + 1, y - 1.6, 3.8) + line(y, 0.15); });
  y += 7;
  // длинный текст — в несколько строк по ширине колонки (≈0.52 мм на знак при высоте 1 мм)
  const wrap = (t, h) => { const maxC = Math.max(10, Math.floor(JOIN_COL / (h * 0.52))), out = []; let cur = '';
    for (const w of String(t).split(/\s+/)) { if (cur && (cur + ' ' + w).length > maxC) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) out.push(cur); return out; };
  const TW = (t, h, extra) => { for (const ln of wrap(t, h)) { s += T(ln, x, y, h, extra); y += h + 1.4; } };
  const f0 = un.facs[0];
  TW(ML('j_frame') + ': ' + f0.frameMat, 3.8);
  s += T(ML('j_sec') + ':', x, y, 3.6); y += 3;
  const sec = joinSecSvg(o, k, (M.secs || [])[f0.sec], x + 4, y, JOIN_COL - 10); s += sec.s; y += sec.h + 8;
  // толщина — если её нет в имени материала («Шпон тангентальный 18 мм» уже с толщиной); каждый материал — своей строкой
  const fills = [...new Set(un.facs.map(q => q.fillMat ? q.fillMat + (q.fillTh && !new RegExp('(^|\\D)' + fmtN(q.fillTh).replace(',', '[.,]') + '\\s*мм').test(q.fillMat) ? ' ' + fmtN(q.fillTh) + ' мм' : '') : ''))].filter(Boolean);
  if (!fills.length) TW(ML('j_fill') + ': ' + ML('j_nofill'), 3.8);
  else fills.forEach((m, i) => TW((i ? '' : ML('j_fill') + ': ') + m, 3.8));
  y += 3;
  // отделка: вписана — в лист и в картинку; пустая — серая подсказка только на экране, в картинке пустое место (Алексей 28.10)
  const fin = joinFin(un.t);
  if (fin || !exp) TW(fin || ML('j_fin'), fin ? 4.4 : 3.6, exp ? '' : ` class="jf" data-t="${un.t}" style="pointer-events:all;cursor:text"${fin ? '' : ' opacity="0.55"'}`); y += 4;
  s += T(ML('j_note'), x, SHEET_H - EDGE_M - 2, 3.2);
  return s;
}
// номер строки таблицы — бледной цифрой «водяным знаком» посреди фасада (Алексей 28.10: выноски не нужны); высота цифры —
// от меньшей стороны фасада на листе, не крупнее 24 мм и не мельче 5
function joinNumsSvg(un, toP, k, exp) {
  const f = v => String(Math.round(v * 100) / 100); let s = '';
  un.facs.forEach((q, j) => {
    const bx = un.boxes[j], pts = [];
    for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y]) for (const z of [bx.min.z, bx.max.z]) pts.push(toP(new THREE.Vector3(x, y, z)));
    const w = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0])), h = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
    const fs = Math.max(5 * k, Math.min(24 * k, Math.min(w, h) * 0.45)), c = toP(bx.getCenter(V3()));
    s += `<text x="${f(c[0])}" y="${f(c[1] + fs * 0.35)}" font-family="${DFONT}" font-size="${f(fs)}" fill="#000000" fill-opacity="0.16" text-anchor="middle">${esc(un.noteFn(q.fr))}</text>`;
  });
  return s;
}
function joinRowsCached(un) { const rows = []; for (const f of un.facs) { const i = un.rowOf[f.fr] - 1; const s = f.box.getSize(V3()), { R, U } = viewAxes(); if (!rows[i]) rows[i] = { w: Math.round(s[R] * 2) / 2, h: Math.round(s[U] * 2) / 2, n: 0 }; rows[i].n++; } return rows; }
// двойной щелчок по строке отделки — поле на месте; Enter / уход со поля — сохранить, Esc — отмена
addEventListener('dblclick', e => {
  const t = e.target; if (!t || !t.classList || !t.classList.contains('jf')) return;
  e.preventDefault(); e.stopPropagation();
  const top = +t.dataset.t, r = t.getBoundingClientRect(), inp = document.createElement('input');
  inp.value = joinFin(top); inp.placeholder = ML('j_fin'); inp.style.cssText = `position:fixed;left:${r.left - 4}px;top:${r.top - 4}px;width:${Math.max(260, r.width + 60)}px;z-index:70;font:15px system-ui,sans-serif;padding:3px 6px;border:2px solid #1f6feb;border-radius:4px`;
  document.body.appendChild(inp); inp.focus(); inp.select();
  let done = false;
  const fin = ok => {
    if (done) return; done = true;
    if (ok) { try { const v = inp.value.trim(); if (v) localStorage.setItem(joinKey(top), v); else localStorage.removeItem(joinKey(top)); } catch (x) {} }
    inp.remove(); if (joinCur) drawOverlay();
  };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') fin(true); else if (ev.key === 'Escape') fin(false); });
  inp.addEventListener('blur', () => fin(true));
}, true);
function joinSheetSvg(un) { joinShow(un.u); return buildSVG(); }
async function joinReport() {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  const dir = LOCAL.order + '\\5. Креслення\\Чертежи для отчета(wmf)\\Столярка', got = [];
  try { await srv('/draw/clear', { dir }); } catch (e) { toast(L('p_noSrv') + ': ' + e.message); return; }
  let n = 0;
  for (const un of joinBuild()) {
    const b64 = await svgPng(joinSheetSvg(un), 15), name = nextName(got, joinTitle(un), '.png');
    try { await srv('/draw/save', { dir, name, b64 }); got.push({ name }); n++; }
    catch (e) { toast('не сохранилось: ' + e.message); break; }
  }
  toast('в отчёт Федосова — листов ' + n + ' (папка «Столярка»)');
  return n;
}
window.__join = { list: () => joinBuild().map(u => ({ u: u.u, t: u.t, name: u.name, n: u.facs.length, view: u.view })), show: u => joinShow(u), off: () => metalOff(), svg: () => buildSVG(), rep: () => joinReport(), png: px => svgPng(buildSVG(), px || 4),
  rows: () => joinCur ? joinRowsCached(joinCur) : [], dims: () => dims.filter(dimHere).map(d => [d.axis, Math.round(Math.abs(d.b.clone().sub(d.a).dot(AX[d.axis])))]),
  hw: () => joinCur ? joinCur.facs.map(f => ({ row: joinCur.rowOf[f.fr], hw: f.hw.map(i => M.objs[i].n) })) : [],   // фурнитура на листе — по фасадам
  near: (j, d) => { if (!joinCur) return []; const b = joinCur.facs[j].box.clone().expandByScalar(d || 60), o = [];   // фурнитура модели около фасада j
    parts.forEach((p, i) => { if (!p.isF) return; const bb = new THREE.Box3().expandByObject(p.g, true); if (bb.intersectsBox(b)) o.push([M.objs[i].n, bb.min.toArray().map(Math.round), bb.max.toArray().map(Math.round)]); });
    return { box: [joinCur.facs[j].box.min.toArray().map(Math.round), joinCur.facs[j].box.max.toArray().map(Math.round)], o }; } };
function joinMenu(b) {
  const T = joinBuild(), el = $('dfly');
  if (!T.length) { toast(ML('j_none')); return; }
  flyFor = b;
  el.innerHTML = `<button data-ju="rep"><span>${esc(ML('m_rep'))}</span></button>` +
    T.map(x => `<button data-ju="${x.u}" class="${joinCur && joinCur.u === x.u ? 'on' : ''}"><span>${esc(x.name + ' — ' + x.facs.length + ' ' + joinFacWord(x.facs.length))}</span></button>`).join('') +
    `<button data-ju="off"><span>${esc(ML('m_off'))}</span></button>`;
  el.querySelectorAll('[data-ju]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); closeFly();
    const v = q.dataset.ju; if (v === 'off') metalOff(); else if (v === 'rep') joinReport(); else joinShow(+v);
  }; });
  el.classList.add('show');
  const r = b.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(innerWidth - el.offsetWidth - 6, r.left)) + 'px'; el.style.top = (r.bottom + 4) + 'px';
}
// отверстия группы: ось на нас — кружок (открыто со стороны лица — сплошной, с обратной стороны — пунктир);
// ось в плоскости листа (в торце) — стенки пунктиром и ось штрихпунктиром: внутри материала
function texHolesSvg(un, toP, k, exp) {
  const f = v => String(Math.round(v * 100) / 100), vd = viewDir(), sw = exp ? 0.18 : Math.max(1, 0.18 * k), dash = ` stroke-dasharray="${f(1.2 * k)} ${f(0.7 * k)}"`;
  let s = '';
  for (const h of un.holes) {
    const rp = h.r / drawN * k, b = un.boxes[h.j];
    if (Math.abs(h.ax.dot(vd)) > 0.9) {
      const near = h.p0.dot(vd) < h.p1.dot(vd) ? h.p0 : h.p1, c = toP(near);
      let face = Infinity; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) face = Math.min(face, new THREE.Vector3(x, y, z).dot(vd));
      const vis = near.dot(vd) <= face + 0.5, x = rp + 0.8 * k;
      s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(rp)}" fill="none" stroke="#000000" stroke-width="${f(vis ? sw * 1.4 : sw)}"${vis ? '' : dash}/>` +
        `<path d="M${f(c[0] - x)} ${f(c[1])}L${f(c[0] + x)} ${f(c[1])}M${f(c[0])} ${f(c[1] - x)}L${f(c[0])} ${f(c[1] + x)}" stroke="#000000" stroke-width="${f(sw * 0.6)}" fill="none"/>`;
    } else {
      const a = toP(h.p0), e = toP(h.p1), L = Math.hypot(e[0] - a[0], e[1] - a[1]); if (L < 0.05 * k) continue;
      const ux = (e[0] - a[0]) / L, uy = (e[1] - a[1]) / L, nx = -uy * rp, ny = ux * rp;
      s += `<path d="M${f(a[0] + nx)} ${f(a[1] + ny)}L${f(e[0] + nx)} ${f(e[1] + ny)}M${f(a[0] - nx)} ${f(a[1] - ny)}L${f(e[0] - nx)} ${f(e[1] - ny)}M${f(e[0] + nx)} ${f(e[1] + ny)}L${f(e[0] - nx)} ${f(e[1] - ny)}" stroke="#000000" stroke-width="${f(sw)}" fill="none"${dash}/>` +
        `<path d="M${f(a[0] - ux * k)} ${f(a[1] - uy * k)}L${f(e[0] + ux * k)} ${f(e[1] + uy * k)}" stroke="#000000" stroke-width="${f(sw * 0.6)}" stroke-dasharray="${f(3 * k)} ${f(0.8 * k)} ${f(0.5 * k)} ${f(0.8 * k)}" fill="none"/>`;
    }
  }
  return s;
}
// двойной щелчок по подписи выноски — поле на месте подписи; Enter / уход со поля — сохранить, Esc — отмена
addEventListener('dblclick', e => {
  const t = e.target; if (!t || !t.classList || !t.classList.contains('tn')) return;
  e.preventDefault(); e.stopPropagation();
  const i = +t.dataset.n, r = t.getBoundingClientRect(), inp = document.createElement('input');
  inp.value = texNote(i); inp.style.cssText = `position:fixed;left:${r.left - 4}px;top:${r.top - 4}px;width:${Math.max(140, r.width + 60)}px;z-index:70;font:15px system-ui,sans-serif;padding:3px 6px;border:2px solid #1f6feb;border-radius:4px`;
  document.body.appendChild(inp); inp.focus();
  const m = /\d[\d\s.\-\/]*$/.exec(inp.value);              // выделено только число в конце («поз. 42» → «42»), его и перебивают
  if (m) inp.setSelectionRange(m.index, inp.value.length); else inp.select();
  let done = false;
  const fin = ok => {
    if (done) return; done = true;
    if (ok) { try { const v = inp.value.trim(); if (v) localStorage.setItem(texKey(i), v); else localStorage.removeItem(texKey(i)); } catch (x) {} }
    inp.remove(); if (texCur) { texCur.lay = null; texShow(texCur.g); }
  };
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') fin(true); else if (ev.key === 'Escape') fin(false); });
  inp.addEventListener('blur', () => fin(true));
}, true);
// лист в картинку: тот же лист, что на экране
function texSheetSvg(un) { texShow(un.g); return buildSVG(); }
async function texReport() {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  // папка «Переход текстуры» в чертежах отчёта (Алексей 28.10): старое — в корзину, листы с 01 заново; нет папки — создаёт сервер
  const dir = LOCAL.order + '\\5. Креслення\\Чертежи для отчета(wmf)\\Переход текстуры', got = [];
  try { await srv('/draw/clear', { dir }); } catch (e) { toast(L('p_noSrv') + ': ' + e.message); return; }
  let n = 0;
  for (const un of texBuild()) {
    const b64 = await svgPng(texSheetSvg(un), 15), name = nextName(got, texTitle(un), '.png');
    try { await srv('/draw/save', { dir, name, b64 }); got.push({ name }); n++; }
    catch (e) { toast('не сохранилось: ' + e.message); break; }
  }
  toast('в отчёт Федосова — листов ' + n + ' (папка «Переход текстуры»)');
  return n;
}
window.__tex = { list: () => texBuild(), show: g => texShow(g), off: () => metalOff(), svg: () => buildSVG(), rep: () => texReport(), png: px => svgPng(buildSVG(), px || 4),
  holes: () => texCur ? texCur.holes.map(h => [h.j, Math.round(h.r * 20) / 10, Math.round(h.p0.distanceTo(h.p1) * 10) / 10]) : [],
  dims: () => dims.filter(dimHere).map(d => [d.axis, Math.round(Math.abs(d.b.clone().sub(d.a).dot(AX[d.axis])))]), notes: () => texCur ? texCur.panels.map(texNote) : [] };
function texMenu(b) {
  const T = texBuild(), el = $('dfly');
  if (!T.length) { toast(ML('t_none')); return; }
  flyFor = b;
  el.innerHTML = `<button data-tu="rep"><span>${esc(ML('m_rep'))}</span></button>` +
    T.map(x => `<button data-tu="${x.g}" class="${texCur && texCur.g === x.g ? 'on' : ''}"><span>${esc(ML('t_grp') + ' ' + x.g + ' — ' + x.panels.length + ' ' + ML('nuts') + ' · ' + x.mat)}</span></button>`).join('') +
    `<button data-tu="off"><span>${esc(ML('m_off'))}</span></button>`;
  el.querySelectorAll('[data-tu]').forEach(q => { q.onclick = e => {
    e.stopPropagation(); closeFly();
    const v = q.dataset.tu; if (v === 'off') metalOff(); else if (v === 'rep') texReport(); else texShow(+v);
  }; });
  el.classList.add('show');
  const r = b.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(innerWidth - el.offsetWidth - 6, r.left)) + 'px'; el.style.top = (r.bottom + 4) + 'px';
}
// ---------- лист SVG ----------
function buildSVG() {
  for (const p of parts) if (p.isF) drawEdgesFor(p);
  root.updateMatrixWorld(true); cam.updateMatrixWorld();
  // камера листа: тот же ракурс, кадр ровно по листу, глубина — по видимому
  const camD = new THREE.OrthographicCamera();
  camD.position.copy(cam.position); camD.quaternion.copy(cam.quaternion); camD.updateMatrixWorld();
  const inv = camD.matrixWorldInverse, q0 = sheetC.clone().applyMatrix4(inv), hw = SHEET_W * drawN / 2, hh = SHEET_H * drawN / 2;
  camD.left = q0.x - hw; camD.right = q0.x + hw; camD.top = q0.y + hh; camD.bottom = q0.y - hh;
  const vb = visibleBox(false); let z0 = Infinity, z1 = -Infinity;
  for (const x of [vb.min.x, vb.max.x]) for (const y of [vb.min.y, vb.max.y]) for (const z of [vb.min.z, vb.max.z]) {
    const q = new THREE.Vector3(x, y, z).applyMatrix4(inv); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z);
  }
  camD.near = -z1 - 50; camD.far = -z0 + 50; camD.updateProjectionMatrix();
  // глубина кадра: только сами детали (рёбра, размеры, подсветки и стекло — не закрывают)
  const RW = 4096, RH = Math.round(RW * SHEET_H / SHEET_W);
  const rt = new THREE.WebGLRenderTarget(RW, RH), hid = [];
  scene.traverse(o => {
    if (!o.visible) return;
    if (o.isLine || o.isPoints || (o.isMesh && (o.userData.idx === undefined || isGlassMesh(o)))) { o.visible = false; hid.push(o); }
  });
  const ov = scene.overrideMaterial, cc = rend.getClearColor(new THREE.Color()), ca = rend.getClearAlpha();
  scene.overrideMaterial = DEPTH_MAT;
  rend.setRenderTarget(rt); rend.setClearColor(0xffffff, 1); rend.clear(); rend.render(scene, camD);
  const px = new Uint8Array(RW * RH * 4); rend.readRenderTargetPixels(rt, 0, 0, RW, RH, px);
  rend.setRenderTarget(null); rend.setClearColor(cc, ca); scene.overrideMaterial = ov;
  for (const o of hid) o.visible = true;
  rt.dispose(); need();
  const Z = new Float32Array(RW * RH);
  for (let k = 0; k < RW * RH; k++) Z[k] = (px[4 * k] * 65536 + px[4 * k + 1] * 256 + px[4 * k + 2]) / 16777215;
  // ребро видно в точке, если оно не глубже самой дальней из 4 ближайших точек кадра (+1,5 мм)
  const eps = 1.5 / (camD.far - camD.near);
  const zAt = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? -1 : Z[(RH - 1 - y) * RW + x];
  const visAt = (fx, fy, z) => {
    const x = Math.floor(fx - 0.5), y = Math.floor(fy - 0.5); let mx = -1;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const v = zAt(x + dx, y + dy); if (v > mx) mx = v; }
    return mx >= 0 && z <= mx + eps;
  };
  const out = [], outH = [], kx = SHEET_W / RW, ky = SHEET_H / RH;   // outH — невидимые (за деталью): тонкие серые
  const seg = (a, b) => {
    if ((a.z < -1 && b.z < -1) || (a.z > 1 && b.z > 1)) return;
    const ax = (a.x + 1) / 2 * RW, ay = (1 - a.y) / 2 * RH, bx = (b.x + 1) / 2 * RW, by = (1 - b.y) / 2 * RH;
    const az = (a.z + 1) / 2, bz = (b.z + 1) / 2, L = Math.hypot(bx - ax, by - ay);
    if (L < 0.5 || Math.max(ax, bx) < 0 || Math.min(ax, bx) > RW || Math.max(ay, by) < 0 || Math.min(ay, by) > RH) return;
    const n = Math.max(1, Math.ceil(L)), v = new Uint8Array(n + 1);
    for (let s = 0; s <= n; s++) { const t = s / n; v[s] = visAt(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t) ? 1 : 0; }
    for (let s = 1; s < n; s++) if (v[s - 1] === v[s + 1] && v[s] !== v[s - 1]) v[s] = v[s - 1];   // одиночные выбросы
    for (const [want, dst] of drawHid || texCur || joinCur ? [[1, out], [0, outH]] : [[1, out]]) {   // переход текстуры / столярка — невидимое всегда (пунктир)
      let s0 = -1;
      for (let s = 0; s <= n + 1; s++) {
        const on = s <= n && v[s] === want;
        if (on && s0 < 0) s0 = s;
        else if (!on && s0 >= 0) {
          if (s - 1 > s0) { const t0 = s0 / n, t1 = (s - 1) / n; dst.push([(ax + (bx - ax) * t0) * kx, (ay + (by - ay) * t0) * ky, (ax + (bx - ax) * t1) * kx, (ay + (by - ay) * t1) * ky]); }
          s0 = -1;
        }
      }
    }
  };
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  const lines = ln => {
    const pos = ln.geometry.attributes.position, mw = ln.matrixWorld;
    for (let i = 0; i + 1 < pos.count; i += 2) {
      A.fromBufferAttribute(pos, i).applyMatrix4(mw); B.fromBufferAttribute(pos, i + 1).applyMatrix4(mw);
      if (clipPl && ln !== capObj) {                        // разрез вида: отсечённая часть ребра на лист не идёт
        const da = clipPl.distanceToPoint(A), db = clipPl.distanceToPoint(B);
        if (da < 0 && db < 0) continue;
        if (da < 0) A.lerp(B, da / (da - db)); else if (db < 0) B.lerp(A, db / (db - da));
      }
      seg(A.project(camD), B.project(camD));
    }
  };
  for (const p of parts) {
    if (!p.g.visible) continue;
    if (p.isL) { p.g.traverse(o => { if (o.isLineSegments) lines(o); }); continue; }
    for (const ln of p.edges) if (ln.visible) lines(ln);
    if (p.isF) for (const ln of p.dEdges) lines(ln);
  }
  if (capObj && capObj.visible) lines(capObj);              // контур среза разреза вида
  // размеры: тем же рисунком, что на экране, в мм бумаги
  const P2 = v => { const q = v.clone().project(camD); return [(q.x + 1) / 2 * SHEET_W, (1 - q.y) / 2 * SHEET_H]; };
  let ds = '', nd = 0;
  if (dimsShown) for (const dm of dims) { if (!dimHere(dm)) continue; const g = dimPrims(dm, P2, 1); if (g) { ds += dimSvg(g, 1, { exp: true }); nd++; } }
  let ss = ''; for (const sc of secs) if (secHere(sc)) ss += secSvg(secPrims(sc, [SHEET_W / 2, SHEET_H / 2], 1, P2), 1, { exp: true });
  if (metalCur !== null) {
    let ms = ''; for (const n of mnotes) if (n.mk === metalCur && n.vk === viewKey()) ms += noteSvg(n, P2, 1, true);
    const un = metal && metal.units.find(x => x.u === metalCur);
    if (un && un.marks) for (const m of un.marks[viewKey()] || []) ms += holeMarkSvg(m, P2, 1, true);
    ss += `<g id="metall">${ms}${metalNoBlock ? '' : joinCur ? joinBlockSvg([0, 0], 1, true) + joinNumsSvg(joinCur, P2, 1, true) : texCur ? texBlockSvg([0, 0], 1) + texHolesSvg(texCur, P2, 1, true) + texNotesSvg(texCur, P2, 1, true) : metalBlockSvg([0, 0], 1)}</g>`;
  }
  const f2 = v => String(Math.round(v * 100) / 100), paths = [];
  for (let k = 0; k < out.length; k += 1500) paths.push(out.slice(k, k + 1500).map(q => 'M' + f2(q[0]) + ' ' + f2(q[1]) + 'L' + f2(q[2]) + ' ' + f2(q[3])).join(''));
  const pathsH = [];
  for (let k = 0; k < outH.length; k += 1500) pathsH.push(outH.slice(k, k + 1500).map(q => 'M' + f2(q[0]) + ' ' + f2(q[1]) + 'L' + f2(q[2]) + ' ' + f2(q[3])).join(''));
  console.log('лист: рёбер на листе ' + out.length + ', размеров ' + nd + ', масштаб 1:' + fmtN(drawN));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_W}mm" height="${SHEET_H}mm" viewBox="0 0 ${SHEET_W} ${SHEET_H}">\n` +
    (pathsH.length ? '<g id="nevidimye" fill="none" stroke="' + (texCur || joinCur ? '#555555" stroke-dasharray="1.6 0.9' : '#a9b1ba') + '" stroke-width="0.13" stroke-linecap="round">\n' + pathsH.map(d => `<path d="${d}"/>`).join('\n') + '\n</g>\n' : '') +
    '<g id="detali" fill="none" stroke="#000000" stroke-width="0.3" stroke-linecap="round">\n' + paths.map(d => `<path d="${d}"/>`).join('\n') + '\n</g>\n' +
    (ds ? `<g id="razmery">${ds}</g>\n` : '') + (ss ? `<g id="secheniya">${ss}</g>\n` : '') +
    `<g id="masshtab"><text x="2" y="${SHEET_H - 2}" font-family="${DFONT}" font-size="3.5" fill="#000000">М 1:${fmtN(drawN)}</text></g>\n</svg>\n`;
}
// ---------- снимок PNG: лист целиком, в тройном разрешении экрана, без размеров и выделения ----------
function shotPNG() {
  const keep = { t: view.target.clone(), d: view.dist };
  if (selSet.length) clearSel();
  fitView();
  const S = sheetRect(), k = 3, pr = rend.getPixelRatio();
  rend.setPixelRatio(k); rend.setSize(innerWidth, innerHeight, false); rend.render(scene, cam);
  const c = document.createElement('canvas'); c.width = Math.round(S.w * k); c.height = Math.round(S.h * k);
  const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(rend.domElement, S.x0 * k, S.y0 * k, S.w * k, S.h * k, 0, 0, c.width, c.height);
  rend.setPixelRatio(pr); rend.setSize(innerWidth, innerHeight, false);
  view.target.copy(keep.t); view.dist = keep.d; place();
  return c.toDataURL('image/png').split(',')[1];
}
// ---------- папки отчёта (через локальный сервер) ----------
// тело — JSON простым текстом: такой запрос браузер шлёт без предварительного опроса сервера
async function srv(path, body) {
  const r = await fetch(SRV + path, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || ('ответ сервера ' + r.status));
  return j;
}
const filesOf = j => !j.files ? [] : Array.isArray(j.files) ? j.files : [j.files];
async function refreshList() {
  const el = $('dList'); if (!el || !LOCAL) return;
  try { drawFiles.d = filesOf(await srv('/draw/list', { dir: DIR_DRAW })); drawFiles.s = filesOf(await srv('/draw/list', { dir: DIR_SHOT })); }
  catch (e) { el.textContent = L('p_noSrv'); return false; }
  el.replaceChildren();
  // раздел: значок, название, сколько файлов; под ним файлы строками со значком
  const sec = (t, arr, ic) => {
    const h = document.createElement('div'); h.className = 'dlh'; h.innerHTML = DS(DIC[ic], 15) + '<span></span><em></em>';
    h.children[1].textContent = t; h.lastChild.textContent = arr.length || L('p_empty'); el.appendChild(h);
    for (const f of arr) {
      const r = document.createElement('div'); r.className = 'dlf'; r.innerHTML = DS(DIC[ic], 13) + '<span></span>';
      r.lastChild.textContent = f.name.replace(/\.\w+$/, ''); r.title = f.name + ' — ' + f.time; el.appendChild(r);
    }
  };
  sec(L('p_draw'), drawFiles.d, 'svg'); sec(L('p_shot'), drawFiles.s, 'png');
  return true;
}
function nextName(arr, title, ext) {
  let n = 0; for (const f of arr) { const m = /^(\d+)/.exec(f.name); if (m) n = Math.max(n, +m[1]); }
  return String(n + 1).padStart(2, '0') + ' — ' + ((title || '').trim() || 'вид').replace(/[\\/:*?"<>|]/g, '_') + ext;
}
// вход во вкладку: в папках уже что-то есть — удалить (в корзину) и начать с 01 или дописывать следующими номерами
async function checkFolders() {
  if (!LOCAL || !(await refreshList())) return;
  const nd = drawFiles.d.length, ns = drawFiles.s.length;
  if (!nd && !ns) return;
  const kinds = a => { const c = {}; for (const f of a) { const e = ((/\.(\w+)$/.exec(f.name) || [])[1] || '?').toLowerCase(); c[e] = (c[e] || 0) + 1; } return Object.entries(c).map(([e, k]) => e + ' ' + k).join(', '); };
  const msg = 'В папках отчёта для зоны «' + LOCAL.zone + '» уже есть файлы:\n' +
    (nd ? '   листы — ' + nd + ' (' + kinds(drawFiles.d) + ')\n' : '') + (ns ? '   снимки — ' + ns + ' (' + kinds(drawFiles.s) + ')\n' : '') +
    '\nУдалить их (в корзину Windows) и начать заново?\nОК — удалить.  Отмена — новые кадры пойдут следующими номерами.';
  if (!confirm(msg)) return;
  try { await srv('/draw/clear', { dir: DIR_DRAW }); await srv('/draw/clear', { dir: DIR_SHOT }); toast('старые файлы — в корзине'); }
  catch (e) { toast('не удалось удалить: ' + e.message); }
  refreshList();
}
async function saveSheet() {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  if (view.persp) setPersp(false);
  let svg; try { svg = buildSVG(); } catch (e) { console.error(e); toast('лист не собрался: ' + e.message); return; }
  const name = nextName(drawFiles.d, frameName, '.svg');
  try { await srv('/draw/save', { dir: DIR_DRAW, name, svg }); toast('лист сохранён: ' + name); }
  catch (e) { toast('не сохранилось: ' + e.message); return; }
  refreshList();
}
async function saveShot() {
  if (!LOCAL) { toast('в этой странице нет папки заказа — перевыгрузите проект из Базиса'); return; }
  const b64 = shotPNG(), name = nextName(drawFiles.s, frameName, '.png');
  try { await srv('/draw/save', { dir: DIR_SHOT, name, b64 }); toast('снимок сохранён: ' + name); }
  catch (e) { toast('не сохранилось: ' + e.message); return; }
  refreshList();
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
  // креслення: структура — от ленты до строки-подсказки вплотную, карточка — под строкой значков левее панели листов
  t.style.top = (drawOn ? ribBottom() : 6 + s.t) + 'px';
  t.style.bottom = (innerHeight - barTop() + (drawOn ? 0 : 6)) + 'px';
  const c = $('card'); c.style.top = (drawOn ? ribBottom() + 60 : 10 + s.t) + 'px';
  if (!TOUCH) c.style.right = drawOn ? ($('dpanel').offsetWidth + 16) + 'px' : '';
  if (drawOn) { $('dpanel').style.top = ribBottom() + 'px'; placeStrip(); }
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
    // вимкнути — кнопкой рулетки внизу (Алексей 30.10: кружок-дубль лишний); в кресленні строки внизу нет — там остаётся
    if (drawOn) chip(ICON.ruler, 'вимкнути рулетку', stopRuler);
    // способ рулетки: лёгкие размеры (для заказчика, по умолчанию), грани, рёбра, точки
    chip(ICON.easy, 'легкі розміри: комірка, дверцята, шухляда', () => setRMode('easy'), 'mini' + (rmode === 'easy' ? ' on' : ''));
    chip(ICON.faces, 'міряти від грані до грані', () => setRMode('face'), 'mini' + (rmode === 'face' ? ' on' : ''));
    chip(ICON.edges, 'міряти від ребра до ребра', () => setRMode('edge'), 'mini' + (rmode === 'edge' ? ' on' : ''));
    chip(ICON.points, 'міряти від кута до кута', () => setRMode('point'), 'mini' + (rmode === 'point' ? ' on' : ''));
    chip(ICON.wall, 'до стін: від площини деталі до лінії підлоги або стіни', () => setRMode('wall'), 'mini' + (rmode === 'wall' ? ' on' : ''));
    chip(ICON.gab, 'габарит виділеного: ширина, висота, глибина', () => setRMode('gab'), 'mini' + (rmode === 'gab' ? ' on' : ''));
    if (dims.length) chip(ICON.trash, 'стерти всі розміри', () => { clearDims(); partDims.length = 0; easyDims.length = 0; gabDims.length = 0; }, 'mini');
  }
  if ($('bShowAll').style.display !== 'none') chip(ICON.eye, 'показати все приховане', showAll);
  placeTools();
  if (drawOn) syncPanel();
}
// кубик видов — справа вверху; значки включённого — столбиком под ним
function placeTools() {
  const box = $('tools'), c = $('vcube'), s = safe();
  if (drawOn) {                                             // креслення: кубик — внизу справа рабочего поля, как у чертёжных программ
    const pw = $('dpanel').offsetWidth + 10, y = barTop() - c.offsetHeight - 10;
    c.style.top = y + 'px'; c.style.right = pw + 'px';
    box.style.top = (y - 4 - box.offsetHeight) + 'px'; box.style.right = (pw + (c.offsetWidth - 46) / 2) + 'px';
    placeSheet(); return;
  }
  c.style.top = (6 + s.t) + 'px'; c.style.right = (6 + s.r) + 'px';
  // телефон стоя (30.10): экран узкий — значки мелкой строкой в пустом месте слева от кубика (скрин Алексея), а не столбиком
  // справа (столбик съедал ширину); открыта карточка — строка под ней. Лёжа и на компьютере — столбиком, как было.
  const row = TOUCH && !isLand();
  box.classList.toggle('row', row);
  if (row) {
    const cd = $('card'), open = cd.style.display === 'block';
    box.style.left = (6 + s.l) + 'px'; box.style.maxHeight = '';
    if (open) { box.style.top = (Math.max(6 + s.t + c.offsetHeight, cd.getBoundingClientRect().bottom) + 4) + 'px'; box.style.right = (6 + s.r) + 'px'; }
    else { box.style.right = (10 + s.r + c.offsetWidth) + 'px'; box.style.top = (6 + s.t + Math.max(0, (c.offsetHeight - box.offsetHeight) / 2)) + 'px'; }
  } else {
    // лёжа столбик не влезал по высоте — нижние значки (до стін, габарит, корзина) уходили за край: переносится вторым столбиком влево
    box.style.left = '';
    box.style.maxHeight = Math.max(100, innerHeight - (6 + s.t + c.offsetHeight + 4) - 8 - s.b) + 'px';
    box.style.top = (6 + s.t + c.offsetHeight + 4) + 'px';
    box.style.right = (6 + s.r + (c.offsetWidth - 46) / 2) + 'px';
  }
  placeHint();
}
// подсказка рулетки: телефон лёжа (30.10, скрин Алексея) — над значками она съедала полосу экрана; тонкой строкой у верхнего
// края, гаснет через 3 с после смены текста. Стоя и на компьютере — над значками, как было.
function placeHint() {
  const st = $('st'), s = safe();
  if (TOUCH && isLand() && !drawOn) {
    const cd = $('card'), cb = cd.style.display === 'block' ? cd.getBoundingClientRect().bottom : 0;
    st.style.bottom = 'auto'; st.style.top = (Math.max(6 + s.t, cb + 4)) + 'px';
    st.style.left = (10 + s.l) + 'px'; st.style.right = (16 + s.r + $('vcube').offsetWidth) + 'px';
    st.classList.add('thin');
  } else {
    st.style.top = ''; st.style.left = ''; st.style.right = ''; st.classList.remove('thin', 'fade');
    if (!drawOn) st.style.bottom = (innerHeight - barTop() + 8) + 'px';
  }
}
function wireHintFade() {
  const st = $('st'); let t = null;
  new MutationObserver(() => {
    st.classList.remove('fade'); clearTimeout(t);
    if (TOUCH && isLand() && !drawOn && st.textContent) t = setTimeout(() => st.classList.add('fade'), 3000);
  }).observe(st, { childList: true, characterData: true, subtree: true });
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
  if (drawOn) thumbTick();
}
(window.__MODEL ? Promise.resolve(window.__MODEL)
  : fetch('./model.json?v=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('файл моделі не знайдено (' + r.status + ')'); return r.json(); }))
  .then(data => {
    M = data; build(); for (const p of parts) if (p.isF) for (const l of drawEdgesFor(p)) l.visible = true;   // рёбра фурнитуры видны в 3D сразу
    wire(); wireLayout(); applyVis(); layout(); fitVisible();
    window.__viewer = { parts, animNode, M, dims, addDim, drawerDims, easyPick, easyCell, tubeDims, openTarget, pick, blockersOf, poseAll, toggleAt, scopeIds, boxOf, isTube, toWorld, clearDims, root, partsUnder, dragDim, THREE, snapAt, pointVisible, picks, nodes, NCNT, REP, rootKids, selectPart, toggleOne, shiftPick, stepSel, tapPick, asmChain, hideSel, showAll, upLevel, downLevel, effVisible, selGab, gabShow, gabDims, setRMode, frameNodeFor, setDraw, buildSVG, sheetRect, autoDims, fitSheet, fitView, setTool, toolClick, toolHover, drawUndo, drawRedo, gabCommit, dragDimTo, pdOpen, pdClose, pdPick, pdS, findByNum, goPart, linkOf, get PD() { return PD; }, get drawN() { return drawN; }, get selDim() { return selDim; }, set selDim(v) { selDim = v; }, get drawOn() { return drawOn; }, get ruler() { return ruler; }, get selSet() { return selSet; }, get selMany() { return selMany; }, get selOne() { return selOne; }, get selNode() { return selNode; }, get cam() { return cam; }, get placing() { return placing; }, get rp() { return rp; } };   // для проверки из консоли
    $('load').remove(); loop();
  })
  .catch(err => { $('load').textContent = 'Не вдалося відкрити модель: ' + err.message; });
