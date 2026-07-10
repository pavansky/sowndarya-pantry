// Offline app-shell cache. Bump VER to force update after edits.
const VER = "pantry-v3";
const SHELL = ["app.html", "data.js", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;            // never cache Supabase calls
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
