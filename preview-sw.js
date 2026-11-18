const SHELL_REVISION = "28878aa629380615";
const SHELL_FILES = ["assets/adaptivePlayback-BP0ypkT2.js","assets/dist-ftMFAyxR.js","assets/dm-sans-latin-400-normal-BwCSEQnW.woff","assets/dm-sans-latin-400-normal-CW0RaeGs.woff2","assets/dm-sans-latin-500-normal-B9HHJjqV.woff2","assets/dm-sans-latin-500-normal-Dr3UlScf.woff","assets/dm-sans-latin-600-normal-Aqo67rzb.woff2","assets/dm-sans-latin-600-normal-BmdmIIQ2.woff","assets/index-CcjUm6HB.js","assets/index-y9o_P_UV.css","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/reelDeck-C3xt6dXQ.js","assets/roboto-condensed-latin-700-normal-BOl6B_hI.woff","assets/roboto-condensed-latin-700-normal-DRbp0YnP.woff2","assets/roboto-latin-400-normal-BqEyEoaF.woff2","assets/roboto-latin-400-normal-D27F5sTu.woff","assets/roboto-latin-500-normal-7RbcRiD8.woff2","assets/roboto-latin-500-normal-fsTFPL3E.woff","assets/roboto-latin-700-normal-BZpUvMxY.woff2","assets/roboto-latin-700-normal-YuyVweIx.woff","assets/web-BogHaGJP.js","assets/web-DZdewnw-.js","assets/web-ieX6JE0U.js","avatar-placeholder.svg","brand-avatar.png","brand-post.png","index.html","microgram-favicon-32.png","microgram-favicon-64.png","startup.png"];
const prefix = 'microgram-web-shell-';
const cacheName = prefix + SHELL_REVISION;
const scope = new URL(self.registration.scope);
const index = new URL('index.html', scope);
const shellPaths = new Set(SHELL_FILES.map((file) => new URL(file, scope).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(SHELL_FILES.map((file) => new Request(new URL(file, scope), { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function navigate(request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-cache', signal: AbortSignal.timeout(1800) });
    if (response.ok) return response;
  } catch {
    // Slow or unavailable network. The installed shell is a coherent fallback.
  }
  return (await cache.match(index)) ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || request.headers.has('Range')) return;
  if (request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === index.pathname)) {
    event.respondWith(navigate(request));
  } else if (shellPaths.has(url.pathname) && url.pathname !== index.pathname) {
    event.respondWith(caches.open(cacheName).then(async (cache) => (
      (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ?? fetch(request)
    )));
  }
});
