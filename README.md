# Velveteentails — The Diary

A small diary of life with Lux & Leo, with seasonal photograph collections and favourite finds.

**Live website:** [velveteentails.com](https://velveteentails.com)

## Build and check

Requires Node.js 22 or newer. There are no third-party package dependencies.

```sh
npm run verify
```

The build creates the page, sitemap and robots file in `dist/`. The check validates photo assets, page anchors, diary content, metadata and JavaScript syntax.

## Hosting on Vercel

The production site is Vercel project `velveteentails` (`prj_yqDM9SpF06sgLw3eX5JTRowu0fW5`) in team `patelks2394` (`team_ZY9phrDZ5PvukhUf5QSSvcyr`), connected to this repository's `main` branch.

- Framework preset: Other
- Build command: `npm run verify`
- Output directory: `dist`
- Environment variable: `SITE_URL=https://velveteentails.com`
- Primary domain: https://velveteentails.com
- https://www.velveteentails.com redirects to the primary domain.

Vercel builds repository updates. Always inspect deployment status and source commit after publishing; a push alone does not prove a successful release. Preview deployments are marked noindex. The domain was registered through Vercel and HTTPS was verified on October 12, 2026. Keep canonical, sharing, sitemap and robots URLs consistent with SITE_URL.

The former Render site and ChatGPT Sites copy remain migration fallbacks. Do not independently edit their content or delete them without user approval. No paid hosting upgrade is authorized.

## Weekly updates

Edit `content/site.json` to add a diary entry with a unique ID, number, date, title, paragraphs, signature and author. Existing entries remain in the archive. The newest date appears on the home page. A new entry advances to the next gallery photograph unless `backgroundPhotoId` specifies one.

Add prepared photographs and thumbnails in `dist/assets/`, then add their metadata to `photos` in `content/site.json`. Use an existing collection ID or add a collection. The full gallery and mixed scrolling photo strip include every photo automatically. `featuredCollection.photoIds` selects the rotating Polaroids. `heroPhotoId` selects the main photograph.

The diary, gallery and affiliate links can be edited without changing the design. Keep accurate photo descriptions and the affiliate disclosure.

Run `npm run verify`, review the change, and commit to `main`. Check the matching Vercel deployment and verify the public site before reporting publication.

## Source layout

- `content/site.json`: diary entries, photographs and links
- `src/template.html`: page structure
- `dist/styles.css` and `dist/app.js`: appearance and interaction
- `dist/assets/`: photographs, thumbnails, local fonts and font licenses
- `scripts/build.mjs` and `scripts/check.mjs`: build and validation

Photographs and original site content belong to their respective owners. Font licenses are included with the font files.
