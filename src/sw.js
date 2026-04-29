/* DroidGuard Quest — minimal service worker.
 *
 * Provides PWA installability (Chrome / Edge require a SW that handles
 * 'fetch' to consider a site installable) without taking responsibility
 * for offline caching. Every request passes through to the network.
 */
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",    () => { /* pass-through to network */ });
