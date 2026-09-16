# Tipright

Website: [tipright.app](https://tipright.app)

Static pages in `dist/`, served by a Cloudflare Worker (`wrangler.json`).

## Build & deploy

```bash
npm install
npm run deploy          # build, then wrangler deploy
```

`npm run build` compiles `src/tailwind.css` and copies `src/calculator.js`
into `dist/assets/` under content-hashed filenames, then repoints every page
at the new names. The hash is what lets `/assets/css/*` and `/assets/js/*` be
cached for a year.

**Run it after any change to markup or to `src/calculator.js`.** The stylesheet
holds only the utility classes found in those files, so a class added without a
rebuild has no CSS behind it and silently does nothing. `npm run deploy` does
the rebuild for you; a bare `wrangler deploy` does not.

The pages used to pull `cdn.tailwindcss.com` and compile in the visitor's
browser instead — 407 KB of render-blocking JavaScript per page view, against
an 18 KB stylesheet now (4 KB gzipped).
