# Beauty Studio Customer v56.1 — PWA cache fix

Replace only `sw.js` in the current `beauty-studio` GitHub repository.

Reason:
The previous PWA service worker was still using the `beauty-studio-v55` cache,
so the newly uploaded D1 dynamic `assets/js/app.js` could remain cached.

Changing the cache name to v56 forces the browser/PWA to install a fresh cache
and load the new D1 dynamic JavaScript.

Do not change the Worker, D1, or Admin project.
