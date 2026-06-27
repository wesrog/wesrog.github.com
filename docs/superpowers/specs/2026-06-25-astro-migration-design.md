# Design: Migrate wesrog.github.com from Jekyll to Astro v7

Date: 2026-06-25

## Summary

Migrate the personal blog at wesrog.github.io from Jekyll + minima to Astro v7, using the official blog starter as a base. The migration adds image gallery support, a SoundCloud embed component, and a self-hosted audio player component. Visual style stays minimal; dark mode is retained via CSS custom properties.

## Architecture

### Project structure

Build the Astro site in an `astro/` subdirectory alongside the existing Jekyll files. Once ready to go live, delete the Jekyll files and move Astro to the repo root.

Final layout:

```
src/
  content/
    blog/           ← all posts (.md or .mdx)
    config.ts       ← content collection schema
  components/
    Gallery.astro
    SoundCloud.astro
    AudioPlayer.astro
    Header.astro
    Footer.astro
    TagList.astro
  layouts/
    BaseLayout.astro
    PostLayout.astro
  pages/
    index.astro
    blog/[...slug].astro
    tags/[tag].astro
    about.astro
    rss.xml.ts
public/
  assets/           ← images, audio (moved from Jekyll's assets/)
```

### Content collections schema

```ts
// src/content/config.ts
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
```

## Content Migration

### Frontmatter changes (all 42 posts)

- Remove `layout: post`
- Rename `categories` → `tags`
- Normalize `date` to `YYYY-MM-DD` format

Before:
```yaml
---
layout: post
title: New bike alert!
date: '2008-05-08T09:02:21-07:00'
categories: [photography, bicycles]
---
```

After:
```yaml
---
title: New bike alert!
date: 2008-05-08
tags: [photography, bicycles]
---
```

### Post format

- Posts with only text, images, and raw `<audio>` tags stay as `.md`
- Posts using `<Gallery>`, `<SoundCloud>`, or `<AudioPlayer>` components become `.mdx`
- Remove `<!--more-->` excerpt separators — post list uses the `description` frontmatter field when present; for old posts without one, fall back to the first 150 characters of `body`

### Assets

- Move `assets/` → `public/assets/`
- Move `tumblr_files/` → `public/tumblr_files/`
- Image paths in post bodies are unchanged (same relative URLs)

## Components

### `<Gallery images={[...]} />`

CSS grid of images with a native `<dialog>`-based lightbox. No external JS dependencies.

```mdx
<Gallery images={["/assets/img1.jpg", "/assets/img2.jpg"]} />
```

### `<SoundCloud url="..." />`

Wraps SoundCloud's standard iframe embed. Accepts a track or playlist URL.

```mdx
<SoundCloud url="https://soundcloud.com/wesrog/some-track" />
```

### `<AudioPlayer src="..." />`

Styled HTML5 `<audio>` element for self-hosted audio. Respects dark mode via CSS variables.

```mdx
<AudioPlayer src="/assets/2020-wld.wav" />
```

## Visual Style

- Base: Astro blog starter styles
- Typography and layout unchanged from current site
- Link colors ported to CSS custom properties: `--color-link: #a67bc3` (light), `--color-link: #c49ee0` (dark)
- Dark mode via `@media (prefers-color-scheme: dark)` using CSS variables throughout
- Carry over `audio { width: 100% }` and tag styles from custom.scss

## Deployment

- GitHub Actions workflow at `.github/workflows/deploy.yml`
- Triggers on push to `master`
- Runs `npm run build`, deploys `dist/` to GitHub Pages
- Set `site: "https://wesrog.github.io/"` in `astro.config.ts`
- One-time manual step: flip GitHub Pages source to "GitHub Actions" (Settings → Pages)

## Migration Sequence

1. Scaffold Astro project in `astro/` subdirectory
2. Configure Astro (content collections, MDX, RSS, GitHub Actions)
3. Migrate posts (frontmatter, format, assets)
4. Build layouts and pages
5. Build Gallery, SoundCloud, AudioPlayer components
6. Apply visual styles and dark mode
7. Verify build and test locally
8. Cut over: delete Jekyll files, move Astro to root, update Pages setting
9. Push and verify live site
