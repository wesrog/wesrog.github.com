# Travelogue Component + Florigon Import

**Date:** 2026-07-11
**Status:** Approved

## Goal

Import the `florigon` Tumblr blog (a real-time trip log from a Feb 2010 road trip, Pensacola FL to Portland OR — 223 posts) as a single blog post on wesrog.github.com, tagged `florigon`, rendered as a chronological timeline that preserves each entry's original date/time rather than flattening everything into one blob of text.

Build this as a reusable `Travelogue`/`Entry` component pair so future trips can be documented the same way — either imported in bulk from a real-time source (many small timestamped entries, like florigon) or hand-authored after the fact (fewer, chunkier entries with just a date, no fabricated times).

## Approach

Two new Astro components, `Travelogue.astro` and `Entry.astro`, used inside an MDX post body — the same authoring pattern already used for `Gallery.astro` (import images, drop a component into MDX). No content-schema changes: a trip is a normal blog post using the existing `blog` collection, frontmatter (`title`, `date`, `tags`, `description`), and route (`src/pages/blog/[...slug].astro`). No new content collection, no trip-level metadata, no dedicated trips index page — `/tags/florigon/` already provides that via the existing tag system.

## Components

### `Entry.astro` (new)

Props: `date` (required, `YYYY-MM-DD`), `time` (optional, `HH:MM`, 24h), `images` (optional, same shape `Gallery` accepts: `string | ImageMetadata | { src, caption }`). Default slot holds prose/markdown for that entry.

- Renders a single timeline item: time label (if present) above content, prose from the slot, then images.
- When `images` has more than one entry, delegates to `Gallery.astro` for the grid + lightbox, so multi-photo entries get the same click-to-enlarge behavior used elsewhere on the site. A single image renders directly (no grid chrome) at a size that fits inline in the timeline (~160px tall), still clickable to open the same lightbox pattern.
- Entries with no `time` (hand-authored, retrospective trips) simply omit the time label — the day heading is enough context.

### `Travelogue.astro` (new)

Props: none — reads its `Entry` children via `Astro.slots`.

- Groups children by `date`, in the order they appear (source order == chronological order; the component does not sort, so authors/import scripts control ordering).
- Renders one day-heading per group (`Thursday, February 11` style, via `toLocaleDateString`), then that day's entries inside a shared timeline rail.
- Visual style: layout "A" from brainstorming — vertical line down the left (`--color-border`), a small dot per entry, day heading as a bold section break above each group. Uses existing CSS variables (`--color-border`, `--color-muted`, `--color-text`, `--spacing`) so dark mode is inherited automatically, consistent with `Gallery.astro` and the rest of the site.

## Content Model

A trip is one MDX file, e.g. `src/content/blog/2010-02-01-florigon/index.mdx`:

```mdx
---
title: Florigon
date: '2010-02-01'
tags: [florigon]
---
import Travelogue from '../../../components/Travelogue.astro';
import Entry from '../../../components/Entry.astro';
import img1 from './2010-02-11-home-1.jpg';

<Travelogue>
  <Entry date="2010-02-01" time="04:18">Just now leaving Pensacola</Entry>
  ...
  <Entry date="2010-02-11" time="02:26" images={[img1]}>Home!</Entry>
  ...
</Travelogue>
```

Images live alongside `index.mdx` in the post's own folder (matching the existing convention seen in `2010-02-22-cannon-beach/`), imported as `ImageMetadata` so they go through Astro's image optimization pipeline like every other post image.

Post frontmatter: `title: Florigon`, `date: 2010-02-01` (trip start / "Leaving" entry), `tags: [florigon]`.

## Import Script

New `scripts/build-florigon-post.mjs`, run once, not part of the build:

- Reads `scripts/florigon-staging/posts.json` (already fetched from Tumblr's legacy read API via `scripts/fetch-florigon.mjs`).
- Re-downloads images at full resolution (not the review thumbnails) into the new post's folder.
- Emits one `<Entry>` per Tumblr post, in chronological order, mapping:
  - `Photo` posts → `images` (one or more) + caption text as slot content.
  - `Regular` posts → title (if present, rendered bold) + body as slot content, no images.
  - `Quote` posts → quote text + source as slot content.
- Writes the complete `index.mdx` file described above.
- Not idempotent / not re-run automatically — it's a one-shot migration tool, same spirit as `scripts/migrate-posts.mjs`.

## Folding In Existing Overlapping Posts

Four existing standalone posts overlap the florigon date range and were cross-posted to Wes's own Tumblr at the time:

| Existing post | Date | Action |
|---|---|---|
| `2010-02-01-leaving` | Feb 1 | Content merged into the Feb 1 entry |
| `2010-02-04-carlsbad-caverns-...` | Feb 4 | Content + photo merged into the Feb 4 entry |
| `2010-02-09-made-it-to-sfo-...` | Feb 9 | Content merged into the Feb 9 entry |
| `2010-02-22-cannon-beach` | Feb 22 | Its 4 photos (richer than the single photo florigon's API returned for that day) replace/augment the Feb 22 entry |

After merging, all 4 standalone post folders are deleted from `src/content/blog/`.

## Edge Cases

| Scenario | Behavior |
|---|---|
| Day with only text entries, no photos | Renders fine — `Entry` just omits the images block |
| Day with a single photo | `Entry` renders it directly, no `Gallery` grid chrome, still lightbox-clickable |
| Entry with empty caption/body (some Photo posts have none) | Renders image(s) only, no empty `<p>` |
| Hand-authored future trip, no `time` prop | Day heading still groups entries; no time label shown |
| Two entries same day, out of chronological order in source | Rendered in source order — author/script is responsible for ordering |

## Files Changed / Added

- `src/components/Travelogue.astro` — new
- `src/components/Entry.astro` — new
- `src/content/blog/2010-02-01-florigon/index.mdx` — new (+ image assets in same folder)
- `scripts/build-florigon-post.mjs` — new, one-shot import script
- `src/content/blog/2010-02-01-leaving/` — deleted
- `src/content/blog/2010-02-04-carlsbad-caverns-i-think-this-was-part-of-the/` — deleted
- `src/content/blog/2010-02-09-made-it-to-sfo-were-hangin-at-mr-larners/` — deleted
- `src/content/blog/2010-02-22-cannon-beach/` — deleted
