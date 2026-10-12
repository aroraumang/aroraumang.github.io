# umangarora.com

Plain static site served by GitHub Pages from `master`, at https://umangarora.com.

- Page content lives in `_src/` as HTML fragments. Pages under `/paisolog/` use the app's own theme; the rest use the site theme. `node build.mjs` wraps them in the shared layout and writes the published pages to the repo root, along with `sitemap.xml`.
- `paisolog/privacy/` is rendered from the PaisoLog repo's `constants/legal/privacyPolicy.json`, so change the policy there and rebuild. The script expects PaisoLog next to this repo; otherwise run `PAISOLOG_DIR=/path/to/PaisoLog node build.mjs`.
- No dependencies and no analytics. The only JavaScript is `dog.js` on the home page, which reads the visitor's clock to decide if the dog is awake or asleep (try `/?dog=sleepy`) and walks her around when she's awake. Commit the built files along with the sources.
