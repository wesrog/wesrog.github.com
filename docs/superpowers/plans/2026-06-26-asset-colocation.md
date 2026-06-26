# Asset Co-location Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all flat blog/private posts to per-post directories and move co-located images from `public/` into `src/content/` alongside their markdown.

**Architecture:** Each post file `src/content/blog/2009-08-31-gaylord-pano.md` becomes `src/content/blog/2009-08-31-gaylord-pano/index.md`. Images that were in `public/tumblr_files/`, `public/assets/`, or other `public/` subdirectories are copied next to their post and references updated from absolute (`/tumblr_files/foo.jpg`) to relative (`./foo.jpg`). URL generation in all page routes strips the `/index` suffix that Astro's glob loader adds to folder-based entry IDs.

**Tech Stack:** Node.js ESM migration script, Astro content collections (glob loader), MDX

## Global Constraints

- Astro v5 glob loader: entry `id` for `<slug>/index.md` is `<slug>/index` — all URL-building code must strip the `/index` suffix
- Audio files (`/assets/music/*.mp3`) stay in `public/` — raw HTML `<audio>` tags in markdown cannot use relative paths without MDX imports, so absolute paths are kept
- No post content other than image paths and MDX component import depths is changed
- Private posts (`src/content/private/`) are also converted to folder layout for consistency
- `npm run build` must succeed with zero errors after migration

---

## File Map

**Created:**
- `scripts/migrate-to-colocation.mjs` — one-shot migration script
- `src/content/blog/<slug>/index.{md,mdx}` — all 570 blog posts (new home)
- `src/content/blog/<slug>/<asset>` — images moved out of `public/`
- `src/content/private/<slug>/index.md` — all 31 private posts (new home)

**Modified:**
- `src/pages/blog/[...slug].astro` — strip `/index` from `post.id` for URL param
- `src/pages/rss.xml.ts` — same strip
- `src/pages/tags/[tag].astro` — same strip
- `src/pages/[...page].astro` — same strip
- 4 MDX posts — update component import depth from `../../` to `../../../`

**Deleted (after migration):**
- All original flat `.md`/`.mdx` files in `src/content/blog/` and `src/content/private/`
- `public/tumblr_files/` directory (all files moved into content)
- `public/assets/*.jpg` and `public/assets/polyvbuild*.jpg` (moved into content)
- `public/emusic_tags.png`, `public/lastfmtagger/` (moved into content)
- `public/assets/me.jpg` (moved into relevant post)

---

## Task 1: Fix URL routing for folder-based IDs

With `index.md` files inside per-post directories, Astro's glob loader produces IDs like
`2009-08-31-gaylord-pano/index`. All four files that build blog URLs from `post.id` need
to strip the `/index` suffix. Do this first so you can test the build independently.

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/rss.xml.ts`
- Modify: `src/pages/tags/[tag].astro`
- Modify: `src/pages/[...page].astro`

**Interfaces:**
- Produces: helper `const postSlug = (id: string) => id.replace(/\/index$/, '')` used in all four files

- [ ] **Step 1: Update `[...slug].astro`**

Replace the `params` line so the URL stays `/blog/2009-08-31-gaylord-pano/` even after posts move to folders:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';

const postSlug = (id: string) => id.replace(/\/index$/, '');

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: postSlug(post.id) },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="wrapper">
    <header>
      <h1>{post.data.title}</h1>
      <p>
        <time class="post-meta" datetime={post.data.date.toISOString()}>
          {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
        {post.data.tags.length > 0 && (
          <span class="post-tags">
            {post.data.tags.map(tag => (
              <a href={`/tags/${tag}/`} class="post-tag">{tag}</a>
            ))}
          </span>
        )}
      </p>
    </header>
    <Content />
  </article>
</BaseLayout>

<style>
h1 { margin-bottom: 0.25em; }
header { margin-bottom: calc(var(--spacing) * 1.5); }
article :global(img) { margin: 1em 0; }
article :global(p) { margin: 0 0 1em; }
</style>
```

- [ ] **Step 2: Update `rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const postSlug = (id: string) => id.replace(/\/index$/, '');

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'WR',
    description: 'Thoughts and waves from Wes Rogers.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${postSlug(post.id)}/`,
    })),
  });
}
```

- [ ] **Step 3: Update `tags/[tag].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const postSlug = (id: string) => id.replace(/\/index$/, '');

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const tags = [...new Set(posts.flatMap(p => p.data.tags))];
  return tags.map(tag => ({
    params: { tag },
    props: {
      posts: posts
        .filter(p => p.data.tags.includes(tag))
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
    },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---
<BaseLayout title={`#${tag}`}>
  <div class="wrapper">
    <h1>#{tag}</h1>
    <ul class="post-list">
      {posts.map(post => (
        <li>
          <time class="post-meta" datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <a href={`/blog/${postSlug(post.id)}/`}>{post.data.title}</a>
        </li>
      ))}
    </ul>
  </div>
</BaseLayout>

<style>
h1 { margin-bottom: var(--spacing); }
.post-list { list-style: none; padding: 0; }
.post-list li { margin-bottom: 1em; }
time { display: block; }
a { text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 4: Update `[...page].astro`**

Only the `href` in the post list link needs updating. Find and replace both uses of `` `/blog/${post.id}/` `` with `` `/blog/${postSlug(post.id)}/` `` and add the helper at the top of the frontmatter:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';

const postSlug = (id: string) => id.replace(/\/index$/, '');

export async function getStaticPaths({ paginate }) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return paginate(posts, { pageSize: 20 });
}

const { page } = Astro.props;

const rendered = await Promise.all(page.data.map(async post => {
  const { Content } = await render(post);
  return { post, Content };
}));
---
<BaseLayout title="WR">
  <div class="wrapper">
    <p class="intro">Listen to <a href="/tags/music/">music</a>, look at <a href="/tags/photography/">photography</a>, <a href="/tags/bicycles/">bicycles</a>, or read ramblings below.</p>
    <ul class="post-list">
      {rendered.map(({ post, Content }) => (
        <li>
          <time class="post-meta" datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <a href={`/blog/${postSlug(post.id)}/`}>
            <h2>{post.data.title}</h2>
          </a>
          <div class="post-content">
            <Content />
          </div>
        </li>
      ))}
    </ul>
    <nav class="pagination">
      {page.url.prev ? <a href={page.url.prev}>← Newer</a> : <span />}
      <span>Page {page.currentPage} of {page.lastPage}</span>
      {page.url.next ? <a href={page.url.next}>Older →</a> : <span />}
    </nav>
  </div>
</BaseLayout>

<style>
.post-list { list-style: none; padding: 0; margin: 0; }
.post-list li {
  margin-bottom: calc(var(--spacing) * 1.5);
  padding-bottom: calc(var(--spacing) * 1.5);
  border-bottom: 1px solid var(--color-border);
}
.post-list li:last-child { border-bottom: none; }
time { display: block; }
h2 { margin: 0.25em 0 0.5em; font-size: 1.25em; }
a { text-decoration: none; color: var(--color-text); }
a:hover h2 { text-decoration: underline; }
a:visited { color: var(--color-text); }
.intro { color: var(--color-muted); font-size: 0.95em; margin: 0 0 calc(var(--spacing) * 1.5); }
.intro a { color: var(--color-link); }
.intro a:visited { color: var(--color-link-visited); }
.post-content { font-size: 0.9em; }
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing) 0;
  border-top: 1px solid var(--color-border);
  margin-top: calc(var(--spacing) * 1.5);
  font-size: 0.9em;
  color: var(--color-muted);
}
.pagination a { color: var(--color-link); text-decoration: none; }
.pagination a:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 5: Also check private posts routing**

```bash
cat src/pages/private/\[...slug\].astro
```

If it uses `post.id` for URLs, apply the same `postSlug()` helper.

- [ ] **Step 6: Verify build still passes (posts are still flat at this point)**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds, same number of pages as before.

- [ ] **Step 7: Commit**

```bash
git add src/pages/blog/\[...slug\].astro src/pages/rss.xml.ts src/pages/tags/\[tag\].astro src/pages/\[...page\].astro src/pages/private/
git commit -m "feat: strip /index suffix from post IDs for URL generation"
```

---

## Task 2: Write the migration script

**Files:**
- Create: `scripts/migrate-to-colocation.mjs`

**Interfaces:**
- Consumes: `src/content/blog/*.{md,mdx}`, `src/content/private/*.{md,mdx}`, `public/` asset files
- Produces: per-post directories with `index.{md,mdx}` and co-located image files; removes originals

- [ ] **Step 1: Create the script**

```bash
# Verify scripts/ directory exists
ls scripts/
```

- [ ] **Step 2: Write `scripts/migrate-to-colocation.mjs`**

```js
#!/usr/bin/env node
// Migrates flat content posts to per-post directories with co-located images.
// Usage: node scripts/migrate-to-colocation.mjs [--dry-run]
//
// What it does per post:
//  1. Reads the .md/.mdx file
//  2. Finds all absolute-path local image references (not audio)
//  3. Creates src/content/<collection>/<slug>/ directory
//  4. Copies each image from public/ into the new directory
//  5. Rewrites absolute paths to relative in the content
//  6. For .mdx: updates component import depth (../../ → ../ ../)
//  7. Writes content to <slug>/index.<ext>
//  8. Deletes the original file

import { readdir, readFile, writeFile, mkdir, copyFile, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('[DRY RUN] No files will be written or deleted.\n');

// All local path prefixes that live under public/ and should be co-located
const LOCAL_PATH_PREFIXES = [
  '/tumblr_files/',
  '/assets/',       // images only — audio stays in public/
  '/emusic_tags.png',
  '/lastfmtagger/',
];

// Audio extensions — keep in public/, don't move
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.flac']);

function isLocalImagePath(src) {
  const lsrc = src.toLowerCase();
  const ext = lsrc.slice(lsrc.lastIndexOf('.'));
  if (AUDIO_EXTS.has(ext)) return false;
  return LOCAL_PATH_PREFIXES.some(prefix => src.startsWith(prefix));
}

// Extract all local image paths from markdown/MDX content
function extractLocalImagePaths(content) {
  const paths = new Set();

  // Markdown images: ![alt](/path)
  for (const m of content.matchAll(/!\[[^\]]*\]\((\/?[^)]+)\)/g)) {
    const src = m[1];
    if (isLocalImagePath(src)) paths.add(src);
  }

  // HTML img tags: <img src="/path"
  for (const m of content.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const src = m[1];
    if (isLocalImagePath(src)) paths.add(src);
  }

  return [...paths];
}

function rewritePaths(content, imagePaths) {
  let updated = content;
  for (const absPath of imagePaths) {
    const filename = basename(absPath);
    // Replace both quoted and unquoted occurrences
    updated = updated.replaceAll(absPath, `./${filename}`);
  }
  return updated;
}

function rewriteMdxImportDepth(content) {
  // ../../components/ → ../../../components/  (one level deeper due to new subdir)
  return content.replaceAll("'../../components/", "'../../../components/");
}

async function migrateCollection(collectionPath) {
  const entries = await readdir(collectionPath);
  const postFiles = entries.filter(f => /\.(md|mdx)$/.test(f));

  console.log(`\nMigrating ${postFiles.length} posts in ${collectionPath}`);

  let moved = 0, skipped = 0, assetsTotal = 0;

  for (const filename of postFiles) {
    const ext = extname(filename);
    const slug = filename.slice(0, -ext.length);
    const srcFile = join(collectionPath, filename);
    const destDir = join(collectionPath, slug);
    const destFile = join(destDir, `index${ext}`);

    let content = await readFile(srcFile, 'utf8');
    const imagePaths = extractLocalImagePaths(content);

    // Check all referenced images exist in public/
    const missingAssets = imagePaths.filter(p => !existsSync(join(PUBLIC, p)));
    if (missingAssets.length > 0) {
      console.warn(`  WARN ${slug}: missing public assets: ${missingAssets.join(', ')}`);
    }

    const availableAssets = imagePaths.filter(p => existsSync(join(PUBLIC, p)));

    if (DRY_RUN) {
      console.log(`  [dry] ${slug}/`);
      for (const p of availableAssets) {
        console.log(`    copy public${p} → ${slug}/${basename(p)}`);
      }
      if (ext === '.mdx') console.log(`    rewrite MDX import depth`);
      skipped++;
      continue;
    }

    // Create dest directory
    await mkdir(destDir, { recursive: true });

    // Copy images
    for (const absPath of availableAssets) {
      const srcAsset = join(PUBLIC, absPath);
      const destAsset = join(destDir, basename(absPath));
      await copyFile(srcAsset, destAsset);
      assetsTotal++;
    }

    // Rewrite content
    content = rewritePaths(content, availableAssets);
    if (ext === '.mdx') {
      content = rewriteMdxImportDepth(content);
    }

    await writeFile(destFile, content, 'utf8');
    await unlink(srcFile);
    moved++;
  }

  console.log(`  Done: ${moved} posts moved, ${assetsTotal} assets co-located, ${skipped} skipped (dry-run).`);
  return { moved, assetsTotal };
}

async function cleanupPublicDirs() {
  // Remove directories from public/ that should now be empty
  const toClean = ['tumblr_files', 'lastfmtagger', 'emusic_tags.png'];
  for (const name of toClean) {
    const target = join(PUBLIC, name);
    if (existsSync(target)) {
      if (DRY_RUN) {
        console.log(`[dry] Would remove public/${name}`);
      } else {
        await rm(target, { recursive: true, force: true });
        console.log(`Removed public/${name}`);
      }
    }
  }

  // Also remove individual image files from public/assets/ that were moved
  const assetsDir = join(PUBLIC, 'assets');
  if (existsSync(assetsDir)) {
    const assetFiles = await readdir(assetsDir);
    for (const f of assetFiles) {
      const ext = extname(f).toLowerCase();
      if (!AUDIO_EXTS.has(ext) && f !== 'music') {
        // It's an image file — should have been moved
        const target = join(assetsDir, f);
        if (DRY_RUN) {
          console.log(`[dry] Would remove public/assets/${f}`);
        } else {
          await unlink(target);
          console.log(`Removed public/assets/${f}`);
        }
      }
    }
  }
}

// Main
const blogDir = join(ROOT, 'src/content/blog');
const privateDir = join(ROOT, 'src/content/private');

await migrateCollection(blogDir);
await migrateCollection(privateDir);

console.log('\nCleaning up public/ directories...');
await cleanupPublicDirs();

console.log('\nMigration complete.');
if (!DRY_RUN) {
  console.log('Run `npm run build` to verify.');
}
```

- [ ] **Step 3: Commit the script**

```bash
git add scripts/migrate-to-colocation.mjs
git commit -m "feat: add co-location migration script"
```

---

## Task 3: Run dry-run and review

- [ ] **Step 1: Execute dry-run**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | head -80
```

Expected: list of post slugs, their assets, and which public/ paths would be removed. No files changed.

- [ ] **Step 2: Spot-check a photo-heavy post**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | grep -A5 "cannon-beach"
```

Expected output:
```
  [dry] 2010-02-22-cannon-beach/
    copy public/tumblr_files/tumblr_ky8co43EZv1qz70lno1_1280.jpg → 2010-02-22-cannon-beach/tumblr_ky8co43EZv1qz70lno1_1280.jpg
```

- [ ] **Step 3: Spot-check a bike post (uses /assets/)**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | grep -A8 "bianchi-pista"
```

- [ ] **Step 4: Spot-check an MDX post**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | grep -A4 "wld-2020"
```

Expected: shows `rewrite MDX import depth`.

- [ ] **Step 5: Spot-check the lastfmtagger posts**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | grep -A5 "lastfm-cocoa-tagger"
```

Expected: shows `copy public/lastfmtagger/screenshot_12.png`.

- [ ] **Step 6: Check warning count (missing assets)**

```bash
node scripts/migrate-to-colocation.mjs --dry-run 2>&1 | grep WARN
```

Investigate any warnings — a missing asset means the markdown references a file that no longer exists in `public/`. This is acceptable (dead link) as long as it's not a file that should exist.

---

## Task 4: Execute the migration

- [ ] **Step 1: Take a snapshot of the current state**

```bash
git stash list
# If clean working tree (only the route-update commit), you're safe to proceed.
git status
```

- [ ] **Step 2: Run the migration for real**

```bash
node scripts/migrate-to-colocation.mjs
```

Expected output ends with `Migration complete.` and lists moved post counts.

- [ ] **Step 3: Spot-check the result for one photo post**

```bash
ls src/content/blog/2010-02-22-cannon-beach/
```

Expected:
```
index.md
tumblr_ky8co43EZv1qz70lno1_1280.jpg
```

```bash
head -5 src/content/blog/2010-02-22-cannon-beach/index.md
```

Expected: the image reference reads `![](./tumblr_ky8co43EZv1qz70lno1_1280.jpg)`.

- [ ] **Step 4: Spot-check an MDX post import**

```bash
grep "import AudioPlayer" src/content/blog/2020-08-07-wld-2020/index.mdx
```

Expected: `import AudioPlayer from '../../../components/AudioPlayer.astro';`

- [ ] **Step 5: Confirm original flat files are gone**

```bash
ls src/content/blog/*.md 2>&1
```

Expected: `No such file or directory` (all converted to subdirs).

- [ ] **Step 6: Confirm public/tumblr_files is gone**

```bash
ls public/tumblr_files 2>&1
```

Expected: `No such file or directory`.

- [ ] **Step 7: Confirm audio is untouched**

```bash
ls public/assets/music/
```

Expected: all 6 `.mp3` files still present.

- [ ] **Step 8: Build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds, same page count as before (~580+ pages).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: co-locate post assets — convert all posts to per-post directories"
```

---

## Task 5: Verify URLs are unchanged

- [ ] **Step 1: Start dev server and check a known post**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/blog/2010-02-22-cannon-beach/
```

Expected: `200`

- [ ] **Step 2: Check that image loads**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/blog/2010-02-22-cannon-beach/ | grep 200
# Then open in browser and verify the image renders
open http://localhost:4321/blog/2010-02-22-cannon-beach/
```

- [ ] **Step 3: Check an audio post**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/blog/2011-05-13-nanoloop-fun/
```

Expected: `200` — audio still references `/assets/music/nanoloop_fun.mp3` which still exists.

- [ ] **Step 4: Stop dev server**

```bash
kill %1
```

- [ ] **Step 5: Commit verification note**

No commit needed — verification only.

---

## Self-Review

**Spec coverage:**
- ✅ All blog posts converted to folder layout
- ✅ All private posts converted to folder layout
- ✅ Images from `tumblr_files`, `assets/`, `emusic_tags.png`, `lastfmtagger/` co-located
- ✅ Audio stays in `public/assets/music/` (raw HTML `<audio>` tags can't use relative paths without MDX)
- ✅ URL routing updated in all 4 page files (blog route, RSS, tags, pagination)
- ✅ MDX component import depths updated
- ✅ `public/tumblr_files/` cleaned up after migration

**Placeholder scan:** None found.

**Type consistency:**
- `postSlug(id)` helper is defined locally in each page file — consistent name across all four.
- `post.id` usage: all replaced with `postSlug(post.id)` in URL positions; `post.id` still used correctly for non-URL purposes (collection lookups).
