# Velveteentails — The Diary

A small diary of life with Lux & Leo, with seasonal photograph collections and favourite finds.

## Build and check

Requires Node.js 22 or newer. There are no third-party package dependencies.

```sh
npm run verify
```

The build creates the page, sitemap and robots file in `dist/`. The check validates photo assets, page anchors, diary content, metadata and JavaScript syntax.

## Hosting on Render

Create a **Static Site** from this repository, using branch `main`:

- Build command: `npm run verify`
- Publish directory: `dist`
- Automatic deployment: enabled
- Optional environment variable: `SKIP_INSTALL_DEPS=true`

No web server, paid compute instance or database is required. Only the contents of `dist/` are published.

The build uses Render's `RENDER_EXTERNAL_URL` for page and sitemap URLs. After connecting and verifying a custom domain, set `SITE_URL` to its HTTPS origin and redeploy. Until then, leave `SITE_URL` unset. Local builds fall back to the existing site address in `site-origin.txt`. Pull request previews are marked noindex.

## Weekly updates

Edit `content/site.json` to add a diary entry with a unique ID, number, date, title, paragraphs, signature and author. Existing entries remain in the archive. The newest date appears on the home page. A new entry advances to the next gallery photograph unless `backgroundPhotoId` specifies one.

Add prepared photographs and thumbnails in `dist/assets/`, then add their metadata to `photos` in `content/site.json`. Use an existing collection ID or add a collection. The full gallery and mixed scrolling photo strip include every photo automatically. `featuredCollection.photoIds` selects the rotating Polaroids. `heroPhotoId` selects the main photograph.

The diary, gallery and affiliate links can be edited without changing the design. Keep accurate photo descriptions and the affiliate disclosure.

Run `npm run verify`, review the change, and commit to `main`. Render rebuilds and publishes successful updates automatically when auto-deploy is enabled.

## Source layout

- `content/site.json`: diary entries, photographs and links
- `src/template.html`: page structure
- `dist/styles.css` and `dist/app.js`: appearance and interaction
- `dist/assets/`: photographs, thumbnails, local fonts and font licenses
- `scripts/build.mjs` and `scripts/check.mjs`: build and validation

Photographs and original site content belong to their respective owners. Font licenses are included with the font files.
