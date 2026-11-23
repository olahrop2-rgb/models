// Работа без интернета (тема 50, 23.11): страница, модель, проигрыватель и картинки, открытые хоть раз,
// остаются в телефоне. Есть связь — всегда берём свежее и обновляем запас; связи нет (или ответа нет 6 с) — запас.
// Лежит в корне хранилища фирмы (оттуда видны все её проекты); источник — _app\sw.js, в корень кладёт отправка.
const C = 'bazis-web-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
// ключ запаса — адрес без хвоста «?v=…» (проигрыватель и модель грузятся с ним, чтобы не брать старое)
const key = u => { const x = new URL(u); return x.origin + x.pathname; };
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url), scope = new URL(self.registration.scope);
  if (u.origin !== scope.origin || !u.pathname.startsWith(scope.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(C), k = key(r.url);
    const old = await c.match(k);
    const net = fetch(r).then(res => {
      if (res.ok && res.type === 'basic') { const cp = res.clone(); e.waitUntil(c.put(k, cp).catch(() => {})); }
      return res;
    });
    if (!old) return net;
    return Promise.race([net.catch(() => old), new Promise(ok => setTimeout(() => ok(old), 6000))]);
  })());
});
