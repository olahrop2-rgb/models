// Работа без интернета (тема 50, 23.11): ставит в телефон помощника (корень хранилища, sw.js) и сразу
// складывает в запас всё, что нужно этому проекту: страницу, модель, проигрыватель, картинки материалов.
// Монтажник открыл ссылку дома — на объекте без связи она откроется из запаса. Помощника на сайте нет — молча ничего.
const C = 'bazis-web-1';
const page = location.origin + location.pathname;
const root = new URL('../', page).href;                  // страница проекта — <хранилище>/<проект>/
const APP = ['app.js', 'app.css', 'offline.js', 'lib/three.module.min.js', 'lib/csg.module.js', 'icon-192.png', 'icon-512.png'];
const fresh = !navigator.serviceWorker.controller;        // первый раз: эта загрузка шла мимо помощника — сложить всё заново

async function fill() {
  const c = await caches.open(C);
  const put = async u => {
    if (!fresh && await c.match(u)) return;
    try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await c.put(u, r); } catch (e) {}
  };
  for (const u of [page, new URL('model.json', page).href, new URL('manifest.json', page).href]) await put(u);
  for (const f of APP) await put(new URL('_app/' + f, root).href);
  // картинки материалов — по списку из самой модели
  const m = await c.match(new URL('model.json', page).href);
  if (!m) return;
  let M = null; try { M = await m.json(); } catch (e) { return; }
  for (const t of (M && M.tex) || []) await put(new URL('_tex/' + t, root).href);
}

navigator.serviceWorker.register(new URL('sw.js', root).href, { scope: root })
  .then(() => {
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    // после загрузки модели, чтобы не отнимать связь у показа
    const go = () => setTimeout(() => fill().catch(() => {}), 3000);
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  })
  .catch(() => {});
