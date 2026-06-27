# Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate wesrog.github.io from Jekyll + minima to Astro v7 with image galleries, SoundCloud embeds, and self-hosted audio support.

**Architecture:** Build the Astro site in an `astro/` subdirectory alongside the existing Jekyll files, then cut over by deleting Jekyll and moving Astro to the repo root. Posts are migrated via a Node.js script. Components are `.astro` files; posts needing rich media become `.mdx`.

**Tech Stack:** Astro v7, @astrojs/mdx, @astrojs/rss, gray-matter (migration only), GitHub Actions

## Global Constraints

- Site URL: `https://wesrog.github.io/` (no trailing path — set as `site` in astro.config)
- Node: 20+ (v20.20.0 confirmed locally)
- Branch: `master`
- All commands run from `astro/` unless noted
- Astro v7 APIs: verify `entry.slug` vs `entry.id` and `render()` import against Astro v7 docs before starting — the plan uses v5+ APIs which may have changed
- No external JS libraries — use native browser APIs (`<dialog>`, `<audio>`)
- Dark mode: `prefers-color-scheme` media query only, via CSS custom properties
- All colors via CSS variables defined in `global.css`

---

### Task 1: Scaffold and configure Astro project

**Files:**
- Create: `astro/` (entire directory from scaffold)
- Create: `astro/astro.config.mjs`
- Create: `astro/src/content/config.ts`
- Delete: `astro/src/pages/index.astro` (replace scaffold placeholder in Task 6)

**Interfaces:**
- Produces: `astro/` project that builds successfully; `blog` content collection with schema

- [ ] **Step 1: Scaffold with minimal template**

Run from repo root:
```bash
npm create astro@latest astro -- --template minimal --no-git --skip-houston
```

If prompted about install, say yes. If the `--skip-houston` flag is unrecognized in v7, omit it.

Expected: `astro/` directory created with `package.json`, `tsconfig.json`, `astro.config.mjs`, `src/pages/index.astro`, `src/env.d.ts`.

- [ ] **Step 2: Install dependencies**

```bash
cd astro && npm install && npm install @astrojs/mdx @astrojs/rss && npm install --save-dev gray-matter
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Configure Astro**

Replace the contents of `astro/astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://wesrog.github.io/',
  integrations: [mdx()],
});
```

- [ ] **Step 4: Create content collection schema**

Create `astro/src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 5: Create empty blog content directory**

```bash
mkdir -p src/content/blog
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: build succeeds, `dist/` created. Zero posts is fine.

- [ ] **Step 7: Commit**

```bash
cd .. && git add astro/ && git commit -m "feat: scaffold Astro project"
```

---

### Task 2: Post migration script

**Files:**
- Create: `astro/scripts/migrate-posts.mjs`
- Create: `astro/scripts/migrate-posts.test.mjs`
- Populate: `astro/src/content/blog/` (42 .md files)

**Interfaces:**
- Produces: `migratePost(rawString): string` — pure function, exported from migrate-posts.mjs
- Produces: 42 migrated posts in `astro/src/content/blog/`

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write the failing tests**

Create `astro/scripts/migrate-posts.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migratePost } from './migrate-posts.mjs';

test('removes layout from frontmatter', () => {
  const input = `---
layout: post
title: Test Post
date: '2008-05-08T09:02:21-07:00'
tags: []
---
Content.`;
  assert.doesNotMatch(migratePost(input), /^layout:/m);
});

test('merges categories and tags', () => {
  const input = `---
layout: post
title: Test Post
date: '2008-05-08T09:02:21-07:00'
categories:
- bicycles
- photography
tags:
- webdev
---
Content.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /^categories:/m);
  assert.doesNotMatch(result, /^category:/m);
  assert.match(result, /bicycles/);
  assert.match(result, /photography/);
  assert.match(result, /webdev/);
});

test('handles singular category: field', () => {
  const input = `---
layout: post
title: Test
date: '2006-02-10T22:00:00-08:00'
category:
tags:
---
Content.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /^category:/m);
  assert.doesNotMatch(result, /^categories:/m);
});

test('normalizes date to YYYY-MM-DD', () => {
  const input = `---
layout: post
title: Test
date: '2008-05-08T09:02:21-07:00'
---
Content.`;
  assert.match(migratePost(input), /date: '2008-05-08'/);
});

test('removes <!--more--> from body', () => {
  const input = `---
layout: post
title: Test
date: '2008-05-08T09:02:21-07:00'
---
First paragraph.<!--more-->
Second paragraph.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /<!--more-->/);
  assert.match(result, /First paragraph\./);
  assert.match(result, /Second paragraph\./);
});
```

- [ ] **Step 3: Run tests — expect all to fail**

```bash
node --test scripts/migrate-posts.test.mjs
```

Expected: all 5 tests fail with "Cannot find module" or similar.

- [ ] **Step 4: Write the migration script**

Create `astro/scripts/migrate-posts.mjs`:
```js
import matter from 'gray-matter';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export function migratePost(raw) {
  const { data, content } = matter(raw);

  const categories = toArray(data.categories ?? data.category);
  const tags = toArray(data.tags);
  const mergedTags = [...new Set([...categories, ...tags])].filter(Boolean);

  const rawDate = data.date;
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  const dateStr = date.toISOString().split('T')[0];

  const newData = {
    title: data.title,
    date: dateStr,
    ...(mergedTags.length > 0 && { tags: mergedTags }),
    ...(data.description && { description: data.description }),
  };

  const cleanedContent = content.replace(/<!--more-->/g, '');
  return matter.stringify(cleanedContent, newData);
}

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const ASTRO_ROOT = join(__dirname, '..');
  const REPO_ROOT = join(ASTRO_ROOT, '..');
  const POSTS_DIR = join(REPO_ROOT, '_posts');
  const OUTPUT_DIR = join(ASTRO_ROOT, 'src', 'content', 'blog');

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let migrated = 0, errors = 0;
  for (const filename of readdirSync(POSTS_DIR).sort()) {
    if (!filename.endsWith('.md')) continue;
    try {
      const raw = readFileSync(join(POSTS_DIR, filename), 'utf-8');
      writeFileSync(join(OUTPUT_DIR, filename), migratePost(raw));
      migrated++;
      console.log(`✓ ${filename}`);
    } catch (err) {
      errors++;
      console.error(`✗ ${filename}: ${err.message}`);
    }
  }
  console.log(`\nDone: ${migrated} migrated, ${errors} errors`);
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
node --test scripts/migrate-posts.test.mjs
```

Expected: `▶ 5 tests pass`.

- [ ] **Step 6: Run migration script**

```bash
node scripts/migrate-posts.mjs
```

Expected: 42 lines of `✓ YYYY-MM-DD-slug.md`, then `Done: 42 migrated, 0 errors`.

- [ ] **Step 7: Verify build with migrated posts**

```bash
npm run build
```

Expected: build succeeds. If Astro reports schema validation errors, check the failing post's frontmatter and fix `migrate-posts.mjs` accordingly (re-run migration after fixing).

- [ ] **Step 8: Commit**

```bash
cd .. && git add astro/ && git commit -m "feat: migrate 42 Jekyll posts to Astro content collection"
```

---

### Task 3: Copy assets

**Files:**
- Create: `astro/public/assets/` (copy of root `assets/`)
- Create: `astro/public/tumblr_files/` (copy of root `tumblr_files/`)

**Interfaces:**
- Produces: all images and audio files available at the same URL paths as in Jekyll

- [ ] **Step 1: Copy assets**

Run from repo root:
```bash
cp -r assets/ astro/public/assets/ && cp -r tumblr_files/ astro/public/tumblr_files/
```

- [ ] **Step 2: Verify build**

```bash
cd astro && npm run build
```

Expected: build succeeds, `dist/assets/` and `dist/tumblr_files/` present.

- [ ] **Step 3: Commit**

```bash
cd .. && git add astro/public/ && git commit -m "feat: copy static assets to Astro public directory"
```

---

### Task 4: Global styles

**Files:**
- Create: `astro/src/styles/global.css`

**Interfaces:**
- Produces: CSS custom properties for all colors; dark mode via `prefers-color-scheme`; base typography, layout, and element styles

- [ ] **Step 1: Create global stylesheet**

Create `astro/src/styles/global.css`:
```css
:root {
  --color-text: #111;
  --color-bg: #fdfdfd;
  --color-link: #a67bc3;
  --color-link-visited: #6d5180;
  --color-muted: #828282;
  --color-border: #e8e8e8;
  --color-code-bg: #f5f5f5;
  --color-header-top: #a67bc3;
  --font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-size: 18px;
  --line-height: 1.5;
  --content-width: 800px;
  --spacing: 30px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #e0e0e0;
    --color-bg: #1e1e1e;
    --color-link: #c49ee0;
    --color-link-visited: #9b7abf;
    --color-muted: #aaa;
    --color-border: #3a3a3a;
    --color-code-bg: #2a2a2a;
  }
}

*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: var(--font-base);
  font-size: var(--font-size);
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-bg);
  margin: 0;
}

a { color: var(--color-link); }
a:visited { color: var(--color-link-visited); }

.wrapper {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--spacing);
}

h1, h2, h3 { line-height: 1.2; }

img { max-width: 100%; height: auto; display: block; }

audio { width: 100%; }

pre, code {
  font-size: 0.875em;
  background-color: var(--color-code-bg);
  border-radius: 3px;
}
code { padding: 0.1em 0.3em; }
pre {
  padding: var(--spacing);
  overflow-x: auto;
}
pre code { padding: 0; background: none; }

blockquote {
  border-left: 4px solid var(--color-border);
  color: var(--color-muted);
  margin-left: 0;
  padding-left: 1em;
}

hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: calc(var(--spacing) * 2) 0;
}

table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid var(--color-border); padding: 0.5em; }
th { background-color: var(--color-code-bg); }

.post-meta {
  color: var(--color-muted);
  font-size: 0.875em;
}

.post-tags { display: inline; margin-left: 1em; }
.post-tag { color: var(--color-muted); font-size: 0.875em; margin-right: 0.5em; text-decoration: none; }
.post-tag::before { content: '#'; }
.post-tag:visited { color: var(--color-muted); }
```

- [ ] **Step 2: Commit**

```bash
cd .. && git add astro/src/styles/ && git commit -m "feat: add global CSS with dark mode via CSS custom properties"
```

---

### Task 5: BaseLayout, Header, Footer

**Files:**
- Create: `astro/src/components/Header.astro`
- Create: `astro/src/components/Footer.astro`
- Create: `astro/src/layouts/BaseLayout.astro`

**Interfaces:**
- Produces: `BaseLayout` — accepts `title: string`, `description?: string` props; renders full HTML page with Header, Footer, and `<slot />`

- [ ] **Step 1: Create Header**

Create `astro/src/components/Header.astro`:
```astro
---
---
<header class="site-header">
  <div class="wrapper">
    <a class="site-title" href="/">WR</a>
    <nav>
      <a href="/">Posts</a>
      <a href="/about">About</a>
    </nav>
  </div>
</header>

<style>
.site-header {
  border-top: 4px solid var(--color-header-top);
  border-bottom: 1px solid var(--color-border);
  padding: 15px 0;
  margin-bottom: var(--spacing);
}
.site-header .wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.site-title {
  font-size: 1.2em;
  font-weight: bold;
  text-decoration: none;
  color: var(--color-text);
}
.site-title:visited { color: var(--color-text); }
nav a {
  margin-left: 1em;
  text-decoration: none;
  color: var(--color-text);
}
nav a:visited { color: var(--color-text); }
nav a:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 2: Create Footer**

Create `astro/src/components/Footer.astro`:
```astro
---
---
<footer class="site-footer">
  <div class="wrapper">
    <span class="muted">Wes Rogers &mdash; Portland, OR</span>
  </div>
</footer>

<style>
.site-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing) 0;
  margin-top: calc(var(--spacing) * 2);
}
.muted { color: var(--color-muted); font-size: 0.875em; }
</style>
```

- [ ] **Step 3: Create BaseLayout**

Create `astro/src/layouts/BaseLayout.astro`:
```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Thoughts and waves from Wes Rogers.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title === 'WR' ? 'WR' : `${title} | WR`}</title>
    <meta name="description" content={description} />
    <link rel="alternate" type="application/rss+xml" title="WR" href="/rss.xml" />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd .. && git add astro/src/ && git commit -m "feat: add BaseLayout, Header, Footer components"
```

---

### Task 6: Home page (post list)

**Files:**
- Modify: `astro/src/pages/index.astro` (replace scaffold placeholder)

**Interfaces:**
- Consumes: `BaseLayout(title, description?)`, `getCollection('blog')`, `entry.data.{title,date,tags,description}`, `entry.slug`, `entry.body`
- Produces: `/` — paginated list of all posts sorted newest-first with title, date, and excerpt

- [ ] **Step 1: Write the page**

Replace `astro/src/pages/index.astro` with:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

function excerpt(post: (typeof posts)[0]): string {
  if (post.data.description) return post.data.description;
  return post.body
    .replace(/---[\s\S]*?---/, '')
    .replace(/[#*`[\]]/g, '')
    .replace(/<!--.*?-->/gs, '')
    .trim()
    .slice(0, 150)
    .trimEnd() + '…';
}
---
<BaseLayout title="WR">
  <div class="wrapper">
    <ul class="post-list">
      {posts.map(post => (
        <li>
          <time class="post-meta" datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <a href={`/blog/${post.slug}/`}>
            <h2>{post.data.title}</h2>
          </a>
          <p>{excerpt(post)}</p>
        </li>
      ))}
    </ul>
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
p { margin: 0; color: var(--color-muted); font-size: 0.9em; }
</style>
```

- [ ] **Step 2: Verify build and check output**

```bash
npm run build && ls dist/
```

Expected: `dist/index.html` exists. Open `dist/index.html` in a browser (or run `npm run preview`) and confirm the post list renders with titles and dates.

If Astro reports `entry.slug` is not available in v7, replace `post.slug` with `post.id` (which may not include the file extension — check the Astro v7 migration guide).

- [ ] **Step 3: Commit**

```bash
cd .. && git add astro/src/pages/index.astro && git commit -m "feat: add home page with post list"
```

---

### Task 7: Post detail page

**Files:**
- Create: `astro/src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `getCollection('blog')`, `render(post)` from `astro:content`, `BaseLayout`
- Produces: `/blog/{slug}/` for each post

- [ ] **Step 1: Write the page**

Create `astro/src/pages/blog/[...slug].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
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

> **Note:** If Astro v7 changed `render` to a different import or `entry.slug` to `entry.id`, check the v7 migration guide and update `params: { slug: post.slug }` and the href in Task 6 accordingly.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: 42 routes built under `dist/blog/`. Spot-check one: open `dist/blog/2020-08-07-wld-2020/index.html` and verify the post content renders.

- [ ] **Step 3: Commit**

```bash
cd .. && git add astro/src/pages/blog/ && git commit -m "feat: add post detail page"
```

---

### Task 8: Tag pages

**Files:**
- Create: `astro/src/pages/tags/[tag].astro`

**Interfaces:**
- Consumes: `getCollection('blog')`, `BaseLayout`
- Produces: `/tags/{tag}/` for each unique tag

- [ ] **Step 1: Write the page**

Create `astro/src/pages/tags/[tag].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

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
          <a href={`/blog/${post.slug}/`}>{post.data.title}</a>
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

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: tag pages generated. Check `dist/tags/` to see the directories created.

- [ ] **Step 3: Commit**

```bash
cd .. && git add astro/src/pages/tags/ && git commit -m "feat: add tag pages"
```

---

### Task 9: About page and RSS feed

**Files:**
- Create: `astro/src/pages/about.astro`
- Create: `astro/src/pages/rss.xml.ts`

**Interfaces:**
- Produces: `/about/` — static page; `/rss.xml` — RSS feed of all non-draft posts

- [ ] **Step 1: Create about page**

Create `astro/src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About" description="About Wes Rogers">
  <article class="wrapper">
    <h1>About</h1>
    <p>Hi, I'm Wes.</p>
    <p>I love writing elegant, efficient, and sensible code that is mirrored with
    functional and intuitive design. My work is best paired with a UX Designer as I
    love bringing life into human-centered designs.</p>
    <p>I have been writing software and designing websites since the early 2000s. I
    became a manager of engineers around 2014 and have been practicing that
    discipline now for over 10 years. Alongside that, I work on projects at home to
    keep my skills fresh.</p>
    <p>Here, you'll find a multitude of musings ranging from the technical to the
    frivolous. You'll also occasionally find music that I make here as well.</p>
    <p><a href="/assets/Wes Rogers.pdf">Download a copy of my resume</a></p>
    <img src="/assets/me.jpg" alt="A picture of me smiling and holding a coffee mug that says 'Poe me a cup'" />
  </article>
</BaseLayout>
```

- [ ] **Step 2: Create RSS feed**

Create `astro/src/pages/rss.xml.ts`:
```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

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
      link: `/blog/${post.slug}/`,
    })),
  });
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: `dist/about/index.html` and `dist/rss.xml` present.

- [ ] **Step 4: Commit**

```bash
cd .. && git add astro/src/pages/about.astro astro/src/pages/rss.xml.ts && git commit -m "feat: add about page and RSS feed"
```

---

### Task 10: Rich media components

**Files:**
- Create: `astro/src/components/Gallery.astro`
- Create: `astro/src/components/SoundCloud.astro`
- Create: `astro/src/components/AudioPlayer.astro`

**Interfaces:**
- `Gallery` — accepts `images: string[]` prop; renders CSS grid with native `<dialog>` lightbox
- `SoundCloud` — accepts `url: string` prop (track or playlist URL); renders iframe embed
- `AudioPlayer` — accepts `src: string` prop (path to audio file in `public/`); renders styled `<audio>` element

These components are used in `.mdx` posts. To use them, rename a post from `.md` to `.mdx` and add the import at the top.

Example MDX post header:
```mdx
---
title: My Bike Build
date: 2024-01-15
tags: [bicycles]
---
import Gallery from '../../components/Gallery.astro';
import SoundCloud from '../../components/SoundCloud.astro';
import AudioPlayer from '../../components/AudioPlayer.astro';
```

- [ ] **Step 1: Create Gallery component**

Create `astro/src/components/Gallery.astro`:
```astro
---
interface Props {
  images: string[];
}
const { images } = Astro.props;
const uid = Math.random().toString(36).slice(2, 8);
---
<div class="gallery" data-uid={uid}>
  {images.map((src, i) => (
    <button class="gallery-btn" data-src={src} data-index={i}>
      <img src={src} loading="lazy" alt="" />
    </button>
  ))}
</div>
<dialog class="lightbox" id={`lb-${uid}`}>
  <img src="" alt="" />
</dialog>

<script>
  document.querySelectorAll<HTMLElement>('.gallery').forEach(gallery => {
    const uid = gallery.dataset.uid!;
    const dialog = document.getElementById(`lb-${uid}`) as HTMLDialogElement;
    const lightboxImg = dialog.querySelector('img') as HTMLImageElement;

    gallery.querySelectorAll<HTMLElement>('.gallery-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        lightboxImg.src = btn.dataset.src!;
        dialog.showModal();
      });
    });

    dialog.addEventListener('click', e => {
      if (e.target === dialog) dialog.close();
    });
  });
</script>

<style>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5em;
  margin: 1em 0;
}
.gallery-btn {
  padding: 0;
  border: none;
  cursor: pointer;
  background: none;
  overflow: hidden;
}
.gallery-btn img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s;
}
.gallery-btn:hover img { opacity: 0.85; }
.lightbox {
  max-width: 92vw;
  max-height: 92vh;
  padding: 0;
  border: none;
  background: transparent;
}
.lightbox img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  display: block;
}
.lightbox::backdrop { background: rgba(0, 0, 0, 0.88); }
</style>
```

- [ ] **Step 2: Create SoundCloud component**

Create `astro/src/components/SoundCloud.astro`:
```astro
---
interface Props {
  url: string;
}
const { url } = Astro.props;
const params = new URLSearchParams({
  url,
  color: '#a67bc3',
  auto_play: 'false',
  hide_related: 'true',
  show_comments: 'false',
  show_user: 'true',
  show_reposts: 'false',
  show_teaser: 'false',
});
const embedSrc = `https://w.soundcloud.com/player/?${params}`;
---
<div class="soundcloud-embed">
  <iframe
    width="100%"
    height="166"
    scrolling="no"
    frameborder="no"
    allow="autoplay"
    src={embedSrc}
  ></iframe>
</div>

<style>
.soundcloud-embed { margin: 1em 0; }
</style>
```

- [ ] **Step 3: Create AudioPlayer component**

Create `astro/src/components/AudioPlayer.astro`:
```astro
---
interface Props {
  src: string;
}
const { src } = Astro.props;
---
<div class="audio-player">
  <audio controls>
    <source src={src} />
    Your browser does not support the audio element.
  </audio>
</div>

<style>
.audio-player { margin: 1em 0; }
.audio-player audio { width: 100%; }
</style>
```

- [ ] **Step 4: Smoke-test components in an MDX post**

Convert one post to MDX to verify components render. Rename `astro/src/content/blog/2020-08-07-wld-2020.md` to `.mdx` and add an AudioPlayer import. The post already has a raw `<audio>` tag — replace it:

Old post body contains:
```html
<audio controls>
  <source src="https://www.dropbox.com/s/scxvgrjpqqp1yr2/2020-wld-wesrog.wav.WAV?raw=1">
</audio>
```

Replace with (after the frontmatter, before first paragraph):
```mdx
import AudioPlayer from '../../components/AudioPlayer.astro';

<AudioPlayer src="https://www.dropbox.com/s/scxvgrjpqqp1yr2/2020-wld-wesrog.wav.WAV?raw=1" />
```

Then build and verify:
```bash
npm run build && npm run preview
```

Open http://localhost:4321/blog/2020-08-07-wld-2020/ and confirm the audio player renders.

- [ ] **Step 5: Commit**

```bash
cd .. && git add astro/src/components/ astro/src/content/blog/2020-08-07-wld-2020.mdx && git commit -m "feat: add Gallery, SoundCloud, AudioPlayer components"
```

---

### Task 11: GitHub Actions deployment workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: automatic deployment to GitHub Pages on push to `master`, building from `astro/` subdirectory

- [ ] **Step 1: Create workflow**

Run from repo root:
```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: astro/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: astro
      - name: Build
        run: npm run build
        working-directory: astro
      - uses: actions/upload-pages-artifact@v3
        with:
          path: astro/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Actions as Pages source (manual)**

Go to: https://github.com/wesrog/wesrog.github.com/settings/pages

Under "Build and deployment" → "Source", select **GitHub Actions** instead of "Deploy from a branch". Save.

- [ ] **Step 3: Commit and push**

```bash
git add .github/ && git commit -m "feat: add GitHub Actions deploy workflow" && git push
```

Expected: the Actions tab on GitHub shows the workflow running. It will fail if the Pages source isn't switched to GitHub Actions yet — do Step 2 first.

- [ ] **Step 4: Verify deployment**

Watch the workflow at: https://github.com/wesrog/wesrog.github.com/actions

Expected: both `build` and `deploy` jobs succeed. The Astro site should be live at https://wesrog.github.io/ — but Jekyll files at root will still be there, so the Jekyll build may conflict. If GitHub Pages tries to build Jekyll alongside Actions, add a `.nojekyll` file:

```bash
touch astro/public/.nojekyll && git add astro/public/.nojekyll && git commit -m "fix: disable Jekyll processing" && git push
```

---

### Task 12: Cut over

**Goal:** Delete Jekyll files, move Astro to repo root, update the deploy workflow, go live.

**Files:**
- Delete: all Jekyll files (listed below)
- Move: `astro/` contents → repo root
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Verify Astro site is production-ready**

```bash
cd astro && npm run build && npm run preview
```

Manually check:
- Home page loads, posts are listed
- A post page loads with correct content
- About page loads
- `/rss.xml` returns valid XML
- Images render
- Dark mode works (toggle OS dark mode)

Do not proceed until satisfied.

- [ ] **Step 2: Delete Jekyll files**

Run from repo root:
```bash
rm -rf _posts _layouts _includes _sass category _site
rm -f _config.yml Gemfile Gemfile.lock about.md index.md 404.html
```

Keep `docs/` (design docs), `.github/` (workflows), `astro/`, `scripts/`.

- [ ] **Step 3: Move Astro to root**

```bash
cp -r astro/. . && rm -rf astro/
```

This moves all Astro files (src/, public/, package.json, astro.config.mjs, tsconfig.json, node_modules/) to the repo root.

- [ ] **Step 4: Update deploy workflow**

Replace `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Verify local build from new root location**

```bash
npm run build
```

Expected: build succeeds from root.

- [ ] **Step 6: Commit and push**

```bash
git add -A && git commit -m "feat: cut over from Jekyll to Astro" && git push
```

- [ ] **Step 7: Verify live site**

Watch https://github.com/wesrog/wesrog.github.com/actions — both jobs should pass.

Open https://wesrog.github.io/ and verify:
- Post list loads
- A post renders correctly
- Dark mode works
- Audio in the WLD post plays
- `/rss.xml` is valid
