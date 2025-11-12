// service-worker.js

self.addEventListener('install', (event) => {
  // console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  // console.log('Service Worker activating.');
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  let data = {};
  if (event.data) {
    try {
        data = event.data.json();
    } catch (e) {
        data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Rugged Customs Update';
  const options = {
    body: data.body || 'Something new happened!',
    icon: '/icon.png', // You would place an icon file in your public directory
    badge: '/badge.png' // Same for a badge
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener for client messages to show notifications without a real push server
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: '/icon.png',
        });
    }
});