self.addEventListener("push", (event) => {
  let url = "/";
  try {
    const candidate = new URL(
      event.data?.json()?.url || "/",
      self.location.origin
    );
    if (candidate.origin === self.location.origin) url = candidate.pathname;
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification("Daily Game Scores", {
      body: "There is a new comment on a score you follow.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  );
  if (target.origin !== self.location.origin) return;
  event.waitUntil(clients.openWindow(target.href));
});
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
