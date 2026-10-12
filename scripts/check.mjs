import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content/site.json'), 'utf8'));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
assert(!/\{\{[A-Z_]+\}\}/.test(html), 'Unreplaced template token');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Use one page heading');

function requireAsset(relative) {
 const filename = path.resolve(dist, relative.split(/[?#]/)[0]);
 assert(filename.startsWith(dist + path.sep), `Asset escapes dist: ${relative}`);
 assert(fs.existsSync(filename) && fs.statSync(filename).size > 0, `Missing or empty asset: ${relative}`);
}
for (const [, attribute, value] of html.matchAll(/\b(src|href)="([^"]*)"/g)) {
 if (value.startsWith('#')) assert(ids.includes(value.slice(1)), `Broken anchor: ${value}`);
 else if (!/^(https?:|mailto:|data:)/.test(value)) requireAsset(value);
}
for (const [, value] of fs.readFileSync(path.join(dist, 'styles.css'), 'utf8').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
 if (!/^(https?:|data:)/.test(value)) requireAsset(value);
}
for (const photo of content.photos) {
 requireAsset(photo.src);
 requireAsset(photo.thumbnail);
 assert(photo.alt?.trim() && photo.caption?.trim(), `Missing photo description: ${photo.id}`);
 assert(photo.width > 0 && photo.height > 0, `Invalid image dimensions: ${photo.id}`);
}
assert.equal(new Set(content.entries.map(entry => entry.id)).size, content.entries.length, 'Duplicate diary entry IDs');
for (const entry of content.entries) {
 assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date) && !Number.isNaN(Date.parse(entry.date)), `Invalid date: ${entry.id}`);
 assert(entry.title?.trim() && entry.paragraphs?.length, `Incomplete diary entry: ${entry.id}`);
}
const runtime = JSON.parse(html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)[1]);
assert.equal(runtime.photos.length, content.photos.length, 'Album does not contain every photograph');
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
assert(canonical.startsWith('https://'), 'Canonical must use HTTPS');
assert(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8').includes(`<loc>${canonical}</loc>`), 'Sitemap and canonical disagree');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema.url, canonical, 'Structured data URL is inconsistent');
assert(!/<footer\b[\s\S]*?Krushangi[\s\S]*?<\/footer>/.test(html), 'Footer name must stay removed');
for (const filename of ['scripts/build.mjs', 'dist/app.js']) execFileSync(process.execPath, ['--check', path.join(root, filename)]);
console.log(`Passed: ${content.photos.length} photos, ${content.entries.length} diary entries, assets, anchors, metadata and JavaScript syntax.`);
