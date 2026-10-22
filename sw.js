// Pacer service worker: shows the daily task notifications and opens Pacer when one is tapped.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {body: event.data && event.data.text()}; }
  event.waitUntil(self.registration.showNotification(data.title || 'Pacer', {
    body: data.body || 'Open Pacer to see what’s due.',
    tag: data.tag || 'pacer',
    renotify: true,
    data: {url: data.url || '/#tasks'},
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data && event.notification.data.url || '/#tasks', self.location.origin).href;
  event.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    const open = list.find(c => c.url.startsWith(self.location.origin));
    if (open) { open.navigate(url); return open.focus(); }
    return clients.openWindow(url);
  }));
});
