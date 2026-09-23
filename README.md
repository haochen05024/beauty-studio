# Beauty Studio Customer — v90 Stable Cleanup

This is the customer-facing GitHub Pages project.

## Current production files

- `index.html`
- `assets/css/style.css`
- `assets/js/app.js`
- `sw.js`
- `manifest.webmanifest`
- `assets/icons/*`
- `assets/images/*`

The old duplicate root-level `css/style.css` and `js/app.js` files were removed because the site loads the `assets/*` versions.

## v90 cleanup

- Unified the app JavaScript cache-buster to `app.js?v=90`.
- Bumped the Service Worker cache to `beauty-studio-v90`.
- Removed unused duplicate root CSS/JS files.
- Kept the working D1 dynamic content, multilingual Service system, Gallery, Notifications, Booking, Need Help, and PWA behavior unchanged.
- The multilingual Service layer continues to support English / Chinese / Myanmar and Admin-created localized fields.

## Deployment

Upload the contents of `beauty-studio-main/` to the customer `beauty-studio` GitHub Pages repository.

Do not upload these files to the separate Admin or API projects.


## v91
Polished stable build: accessibility, keyboard focus, reduced-motion support, dynamic live-region semantics, and cache alignment. Existing D1, booking, notification, support, PWA and three-language behavior are preserved.
