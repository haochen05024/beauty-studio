# Beauty Studio v39 — Custom Booking Calendar

Overwrite only:
- index.html
- assets/css/style.css
- assets/js/app.js

v39 replaces the browser-native date picker with an in-site Beauty Studio calendar. It keeps the existing booking rules, working days, advance booking window, and step-3 transition.


## v56 · D1 customer content bridge

The customer site now reads published content from the public GET endpoints of
`beauty-studio-api`. If D1 is empty or unavailable, the existing static content
remains as the fallback. No ADMIN_TOKEN is used on the customer site.

Changed:
- `assets/js/app.js`
