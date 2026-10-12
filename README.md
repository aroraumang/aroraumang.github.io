# umangarora.com

Plain static site served by GitHub Pages from `master`, at https://umangarora.com.

- Page content lives in `_src/` as HTML fragments. Pages under `/paisolog/` use the app's own theme; the rest use the site theme. `node build.mjs` wraps them in the shared layout and writes the published pages to the repo root, along with `sitemap.xml`.
- `paisolog/privacy/` is rendered from the PaisoLog repo's `constants/legal/privacyPolicy.json`, so change the policy there and rebuild. The script expects PaisoLog next to this repo; otherwise run `PAISOLOG_DIR=/path/to/PaisoLog node build.mjs`.
- No dependencies, no client-side JavaScript, no analytics. Commit the built files along with the sources.
