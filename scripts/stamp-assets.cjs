#!/usr/bin/env node
/**
 * Cache-bust CSS/JS on every build.
 *
 * index.html references assets/css/styles.css and assets/js/main.js at fixed
 * paths. Without a changing URL, a browser that cached the previous deploy's
 * stylesheet keeps using it against the NEW html — new utility classes are
 * then missing and the layout collapses. Stamping ?v=<build id> gives every
 * deploy fresh asset URLs.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const id = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);

let html = fs.readFileSync(file, 'utf8');
const before = html;
html = html
  .replace(/(assets\/css\/styles\.css)(\?v=[\w-]+)?/g, `$1?v=${id}`)
  .replace(/(assets\/js\/main\.js)(\?v=[\w-]+)?/g, `$1?v=${id}`);

if (html === before && !before.includes(`?v=${id}`)) {
  console.error('stamp-assets: no asset references found in index.html');
  process.exit(1);
}
fs.writeFileSync(file, html);
console.log(`stamp-assets: styles.css + main.js -> ?v=${id}`);
