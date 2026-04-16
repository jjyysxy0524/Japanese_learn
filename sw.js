const CACHE_NAME = 'kana-learning-v1';
const ASSETS_TO_CACHE = [
  './',
  './index_mobile.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装事件 - 缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 请求拦截 - 缓存优先
self.addEventListener('fetch', (event) => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // 不缓存非成功响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 缓存新的响应
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 网络失败时返回缓存或离线页面
            return caches.match('./index_mobile.html');
          });
      })
  );
});
