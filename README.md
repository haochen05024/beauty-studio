# Beauty Studio v57 — D1 cache/update fix

Replace only these files in the customer `beauty-studio` GitHub repository:
- `index.html`
- `sw.js`
- `assets/js/app.js`

This version forces the browser to request the new app JavaScript (`app.js?v=57`) and the new service worker (`sw.js?v=57`), while the service-worker cache is bumped to v57. The D1 bridge remains in `assets/js/app.js`.

After GitHub Pages finishes deploying, open the customer site in an Incognito window and hard-refresh once. The Services page should then read the service names saved in D1.


## v86
Added premium in-site contact action confirmation and D1-driven contact links.


## v87
Customer-visible D1 studio identity, address, hours, booking message, Services and Gallery content now follow the selected English / 中文 / မြန်မာ language. Future customer-facing D1 content should use the same localized field pattern.
