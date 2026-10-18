import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content/site.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = value => { const u = new URL(value); if (!['https:', 'http:'].includes(u.protocol)) throw new Error('Only HTTP links are allowed'); return escape(u.href); };
const entries = [...content.entries].sort((a,b) => b.date.localeCompare(a.date));
if (!entries.length) throw new Error('At least one diary entry is required');
const latest = entries[0];
const dateLabel = date => new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const paragraphs = items => items.map(p => `<p>${escape(p)}</p>`).join('\n');
const renderReelLinks = items => !items?.length ? '' : `<div class="diary-reel-links" aria-label="Related Instagram reels"><p class="eyebrow">OUR TOOTHBRUSHING ATTEMPTS</p><div class="diary-reel-link-list">${items.map(item => `<a class="diary-reel-link" href="${url(item.url)}" target="_blank" rel="noopener noreferrer"><span>${escape(item.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></div>`;
const photoById = new Map(content.photos.map(photo => [photo.id, photo]));
if (photoById.size !== content.photos.length) throw new Error('Photo IDs must be unique');
const getPhoto = id => { const photo = photoById.get(id); if (!photo) throw new Error('Unknown photo: '+id); return photo; };
const collections = content.collections;
const collectionIds = new Set(collections.map(item => item.id));
if (collectionIds.size !== collections.length || content.photos.some(photo => !collectionIds.has(photo.collection))) throw new Error('Every photo needs a valid collection');
const heroPhoto = getPhoto(content.heroPhotoId);
// A new entry takes the next gallery photograph unless a specific one is chosen.
// Work oldest-first so adding a new week does not change existing entry choices.
const entryPhotos = new Map();
let previousPhotoIndex = -1;
for (const entry of [...entries].reverse()) {
 const photo = entry.backgroundPhotoId ? getPhoto(entry.backgroundPhotoId) : content.photos[(previousPhotoIndex + 1) % content.photos.length];
 entryPhotos.set(entry.id, photo);
 previousPhotoIndex = content.photos.findIndex(item => item.id === photo.id);
}
const diaryPhoto = entryPhotos.get(latest.id);
const imageAttrs = photo => `width="${photo.width}" height="${photo.height}"`;
const igIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>';
const collection = content.featuredCollection;
const featuredPhotos = collection.photoIds.map(id => {
 const photo = content.photos.find(p => p.id === id);
 if (!photo) throw new Error('Unknown featured photo: '+id);
 return photo;
});
if (!featuredPhotos.length || new Set(collection.photoIds).size !== featuredPhotos.length) throw new Error('Featured photos must be a nonempty list of unique photo IDs');
const cards = featuredPhotos.map((p,i) => {
 let offset = i;
 if (offset > Math.floor(featuredPhotos.length / 2)) offset -= featuredPhotos.length;
 const position = offset === 0 ? 'front' : offset === 1 ? 'right' : offset === -1 ? 'left' : offset > 1 ? 'back-right' : 'back-left';
 return `<figure class="hero-photo carousel-card" data-featured-index="${i}" data-position="${position}" aria-hidden="${i !== 0}"><button class="photo-open" data-photo="${escape(p.id)}" tabindex="${i === 0 ? '0' : '-1'}" aria-label="Enlarge photograph: ${escape(p.caption)}"><img src="${escape(p.thumbnail || p.src)}" alt="${escape(p.alt)}" ${imageAttrs(p)} loading="lazy" decoding="async" style="object-position:${escape(p.position)}"><span class="photo-zoom" aria-hidden="true">+</span></button><figcaption>${escape(p.caption)}</figcaption></figure>`;
}).join('\n');
const gallery = content.photos.map((p,i) => `<figure class="gallery-photo" data-collection="${escape(p.collection)}"><button class="photo-open" data-photo="${escape(p.id)}" aria-label="Enlarge photograph: ${escape(p.caption)}"><img src="${escape(p.thumbnail || p.src)}" alt="${escape(p.alt)}" ${imageAttrs(p)} loading="lazy" decoding="async" style="object-position:${escape(p.position)}"><span class="photo-zoom" aria-hidden="true">+</span></button><figcaption><span class="photo-number">${String(i+1).padStart(2,'0')}</span>${escape(p.caption)}</figcaption></figure>`).join('\n');
const countCollection = id => content.photos.filter(photo => photo.collection === id).length;
const collectionLinks = collections.filter(item => item.id !== collection.id).map(item => `<button class="collection-link" data-open-collection="${escape(item.id)}"><span>${escape(item.label)} collection</span><small>${String(countCollection(item.id)).padStart(2,'0')} photographs</small><span aria-hidden="true">↗</span></button>`).join('\n');
const galleryFilters = `<button class="gallery-filter" data-filter="all" aria-pressed="true">All <span>${content.photos.length}</span></button>`+collections.map(item => `<button class="gallery-filter" data-filter="${escape(item.id)}" aria-pressed="false">${escape(item.label)} <span>${countCollection(item.id)}</span></button>`).join('');
const groupedPhotos = collections.map(item => content.photos.filter(photo => photo.collection === item.id));
const mixedPhotos = Array.from({length:Math.max(...groupedPhotos.map(group => group.length))}, (_,i) => groupedPhotos.map(group => group[i]).filter(Boolean)).flat();
const stripGroup = duplicate => `<div class="memory-strip-group"${duplicate ? ' aria-hidden="true" inert' : ''}>`+mixedPhotos.map(p => `<div class="memory-photo"><img src="${escape(p.thumbnail || p.src)}" alt="${duplicate ? '' : escape(p.alt)}" ${imageAttrs(p)} loading="lazy" decoding="async" style="object-position:${escape(p.position)}"></div>`).join('')+'</div>';
const affiliateLinks = content.affiliateLinks.length ? content.affiliateLinks.map((item,i) => `<div class="affiliate-item"><a class="product-link" href="${url(item.url)}" target="_blank" rel="sponsored noopener noreferrer"><span class="link-index">${String(i+1).padStart(2,'0')}</span><span><small>${escape(item.category || 'A FAVOURITE FIND')} · AFFILIATE LINK</small><strong>${escape(item.name)}</strong><span class="link-description">${escape(item.description)}</span></span><span class="external-arrow" aria-hidden="true">↗</span></a>${item.code ? `<button class="copy-code" data-code="${escape(item.code)}" aria-label="Copy discount code ${escape(item.code)}">Code: <strong>${escape(item.code)}</strong> <span>Copy</span></button>` : ''}</div>`).join('\n') : '<div class="favourites-empty"><div class="shelf-label"><span class="bookmark-shape" aria-hidden="true"></span><small>THE FAVOURITES SHELF</small></div><h3>A few good things,<br>coming soon.</h3><p>Our favourite finds and any discount codes will live right here. A little shelf of things we use and love.</p></div>';
const brandReels = content.brandReels?.length ? `<section class="brand-reels" aria-labelledby="brand-reels-heading"><p class="eyebrow">LITTLE BRAND FEATURES</p><h3 id="brand-reels-heading">Reels we made together.</h3><div class="brand-reel-grid">${content.brandReels.map(item => `<a class="brand-reel-card" href="${url(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch the ${escape(item.brand)} Reel on Instagram (opens in a new tab)"><img src="${escape(item.image)}" alt="${escape(item.alt)}" width="360" height="640" loading="lazy" decoding="async"><span class="brand-reel-copy"><small>BRAND REEL</small><strong>${escape(item.brand)}</strong><span>${escape(item.title)}</span><span class="brand-reel-watch">Watch the reel <b aria-hidden="true">↗</b></span></span></a>`).join('')}</div></section>` : '';
const archive = entries.map(e => `<details class="archive-entry"><summary><span class="archive-entry-number">${escape(e.number)}</span><span><time datetime="${escape(e.date)}">${dateLabel(e.date)}</time><strong>${escape(e.title)}</strong></span><span class="archive-plus" aria-hidden="true">+</span></summary><div class="letter-copy archive-body">${paragraphs(e.paragraphs)}${renderReelLinks(e.reelLinks)}<div class="signature"><span>${escape(e.signature)}</span><p>${escape(e.author)}</p></div></div></details>`).join('\n');
const projectFile = path.join(root, 'site-origin.txt');
const configuredOrigin = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') || fs.readFileSync(projectFile,'utf8').trim();
const siteUrl = new URL(configuredOrigin);
if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) throw new Error('SITE_URL must be an HTTPS origin without a path, credentials or query');
const origin = siteUrl.origin;
const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.IS_PULL_REQUEST === 'true';
const structuredData = JSON.stringify({
 '@context':'https://schema.org', '@type':'WebSite', name:'Velveteentails',
 url:origin+'/', description:content.description, inLanguage:'en', sameAs:[content.instagram]
}).replace(/</g,'\\u003c');
const replacements = {
 TITLE:escape(content.title), DESCRIPTION:escape(content.description), INSTAGRAM:url(content.instagram), INSTAGRAM_ICON:igIcon, FEATURED_REEL:url(content.featuredReel.url),
 ISSUE:escape(content.issue), ENTRY_NUMBER:escape(latest.number), ENTRY_DATE:escape(latest.date), ENTRY_DATE_LABEL:dateLabel(latest.date),
 ENTRY_CATEGORY:escape(latest.category), ENTRY_TITLE:escape(latest.title), ENTRY_EXCERPT:paragraphs(latest.paragraphs.slice(0,1)), ENTRY_REMAINDER:paragraphs(latest.paragraphs.slice(1)),
 ENTRY_SIGNATURE:escape(latest.signature), ENTRY_AUTHOR:escape(latest.author), ENTRY_REEL_LINKS:renderReelLinks(latest.reelLinks), ENTRY_COUNT_LABEL:`${entries.length === 1 ? 'The first page of our diary.' : `${entries.length} little letters, and counting.`}`,
 GALLERY:gallery, COLLECTION_TITLE:escape(collection.title), COLLECTION_DESCRIPTION:escape(collection.description), FEATURED_COUNT:featuredPhotos.length, PHOTO_COUNT:content.photos.length, CAROUSEL_CARDS:cards,
 COLLECTION_LINKS:collectionLinks, GALLERY_FILTERS:galleryFilters, MEMORY_STRIP:stripGroup(false)+stripGroup(true),
 HERO_SRC:escape(heroPhoto.src), HERO_ALT:escape(heroPhoto.alt), HERO_WIDTH:heroPhoto.width, HERO_HEIGHT:heroPhoto.height, HERO_POSITION:escape(content.heroPosition || heroPhoto.position),
 DIARY_PHOTO_ID:escape(diaryPhoto.id), DIARY_PHOTO_SRC:escape(diaryPhoto.src), DIARY_PHOTO_POSITION:escape(diaryPhoto.position), DIARY_PHOTO_WIDTH:diaryPhoto.width, DIARY_PHOTO_HEIGHT:diaryPhoto.height,
 AFFILIATE_LINKS:affiliateLinks, BRAND_REELS:brandReels, AUTUMN_REEL:url(content.autumnIntroReel.url), AFFILIATE_DISCLOSURE:escape(content.affiliateDisclosure), ARCHIVE:archive,
 ARCHIVE_NOTE:entries.length === 1 ? 'Our first entry is here. New notes will join it as the weeks go by.' : 'The most recent note is always at the top.',
 OG_IMAGE:escape(origin+'/'+heroPhoto.src), OG_IMAGE_ALT:escape(heroPhoto.alt), CANONICAL:escape(origin+'/'),
 ROBOTS:isPreview ? 'noindex, nofollow' : 'index, follow, max-image-preview:large', STRUCTURED_DATA:structuredData,
 RUNTIME_DATA:JSON.stringify({photos:content.photos,collections,featuredPhotoIds:collection.photoIds}).replace(/</g,'\\u003c')
};
const output = html.replace(/\{\{([A-Z_]+)\}\}/g, (_,key) => {if(!(key in replacements))throw new Error('Unknown template key: '+key);return replacements[key];});
fs.writeFileSync(path.join(root,'dist/index.html'), output);
fs.writeFileSync(path.join(root,'dist/robots.txt'), isPreview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(root,'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(origin)}/</loc></url></urlset>\n`);
console.log(`Built ${entries.length} diary entries, ${content.photos.length} photos and ${content.affiliateLinks.length} affiliate links.`);
