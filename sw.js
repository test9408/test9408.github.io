// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    const newRequest = new Request(event.request, {
      headers: {
        ...Object.fromEntries(event.request.headers),
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    });
    event.respondWith(fetch(newRequest));
  } else {
    event.respondWith(fetch(event.request));
  }
});
