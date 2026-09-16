# Tipright

Website: [tipright.app](https://tipright.app)

A Cloudflare Worker serving static pages (`wrangler.json`). `dist/` is build
output — **edit `src/`, not `dist/`.**

## Layout

```
src/
  pages/<route>.html   front-matter (JSON) + that page's body, verbatim
  partials/
    styles.css         the one inline <style> every page carries
    styles.home.css    extra rules only the homepage needs
    logo.svg           the wordmark's mark
  calculator.js        the shared calculator
  tailwind.css         Tailwind entry point
scripts/
  build.mjs            assets + pages
  lib/layout.mjs       head, nav, footer, FAQ, FAQPage schema
  lib/pages.mjs        assembles src/pages + partials into dist
```

A page file is its own body with four markers the build fills:
`<!--@nav-->`, `<!--@footer-->`, `<!--@calculator-->`, `<!--@faq-->`. Everything
else in that file is the page's own content and is copied through untouched.

The head, the nav, the footer and the dark-mode CSS are generated. They used to
be pasted into all 25 pages, which is how the same stylesheet ended up in nine
versions, how three footers grew a link to the page you were already on, and how
eight pages ended up showing one FAQ while telling Google a different one.

The FAQ is rendered at build time from the `faq` array in the page's
front-matter, and the FAQPage structured data is generated from that same array,
so the two cannot disagree.

## Build & deploy

```bash
npm install
npm run deploy          # build, then wrangler deploy
```

`npm run build` compiles the stylesheet, copies `src/calculator.js`, writes both
into `dist/assets/` under content-hashed filenames, renders every page, and
writes the matching Cache-Control rules into `dist/_headers`.

**A bare `wrangler deploy` does not build.** `npm run deploy` does.
