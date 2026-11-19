# BrewTest

Frontend-only software testing workspace (HTML5, CSS3, vanilla ES modules). All data is mock data kept in `localStorage`; test runs are simulated.

## Run
ES modules need http, not file://. From this folder:

    python3 -m http.server 8765      # then open http://localhost:8765

(or `npx serve .`). Fonts load from Google Fonts; Chart.js is vendored in `assets/vendor/`; icons are inlined in `js/icons.js`.

## Structure
- `index.html` – shell; hash router (`#/dashboard`, `#/test-cases/TC-001`, …)
- `css/` – tokens, reset, layout, components, shell, per-page CSS, responsive
- `js/services/` – mock service layer (swap for FastAPI calls later)
- `js/components/`, `js/pages/`, `js/data/mock-data.js`, `js/state.js`, `js/router.js`

Use *Reset demo data* in the profile menu to restore the seed data.
