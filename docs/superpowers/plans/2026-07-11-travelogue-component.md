# Travelogue Component + Florigon Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the florigon Tumblr blog (a Feb 2010 road trip, 223 posts) as a single blog post tagged `florigon`, rendered as a timeline that preserves each entry's original date/time, using a new reusable `Travelogue`/`Day`/`Entry` component set.

**Architecture:** Three new Astro components (`Travelogue.astro` outer wrapper, `Day.astro` per-day heading + rail container, `Entry.astro` per-entry timestamp/text/images) composed inside a normal MDX blog post — no content-schema or routing changes. A new one-shot script (`scripts/build-florigon-post.mjs`) transforms the already-fetched `scripts/florigon-staging/posts.json` into that MDX file.

**Tech Stack:** Astro 7 + `@astrojs/mdx`, existing `Gallery.astro` component (reused inside `Entry.astro`), Node's built-in `node:test` runner (see `scripts/migrate-posts.test.mjs` for the existing pattern), plain `.mjs` modules (no TypeScript in `scripts/`).

## Global Constraints

- Node >= 22.12 (from `package.json` `engines`).
- No new npm dependencies — `fast-xml-parser` (already used by `fetch-florigon.mjs`) and Node built-ins only.
- Follow existing CSS variable conventions from `src/styles/global.css` (`--color-border`, `--color-muted`, `--color-text`, `--spacing`) so dark mode is inherited automatically — do not hardcode colors.
- Tests run via `node --test scripts/*.test.mjs` (no test framework installed).
- Verify Astro/MDX changes via `npm run build` (this repo's CI runs exactly `npm ci && npm run build`, no separate typecheck step — see `.github/workflows/deploy.yml`).
- Blog post images live alongside `index.mdx` in the post's own folder and are imported as `ImageMetadata` (see `src/content/blog/2010-02-22-cannon-beach/`).

## Important deviation from the approved design doc

The design doc (`docs/superpowers/specs/2026-07-11-travelogue-component-design.md`) describes `Travelogue.astro` as automatically grouping `Entry` children by date. **This is not implementable as described**: Astro has no API for a parent component to read a child component's props before/during rendering — slotted content is only available as an opaque rendered HTML string (`Astro.slots.render()`), not as a list of `{props, children}` like React.

This plan instead introduces a third component, **`Day.astro`**, which explicitly wraps the `Entry` children for one calendar day and owns the `date` prop (and thus the day heading + the rail line, which is scoped per day):

```mdx
<Travelogue>
  <Day date="2010-02-01">
    <Entry time="04:18">...</Entry>
    <Entry time="13:05">...</Entry>
  </Day>
  <Day date="2010-02-02">
    ...
  </Day>
</Travelogue>
```

`Entry` no longer takes a `date` prop (only `time`, optional, and `images`, optional). This preserves every observable behavior from the design doc (per-entry timestamps, day headings, reusable for future trips, hand-authoring stays simple) — it just makes day boundaries an explicit nesting instead of inferred magic, which is also easier to hand-author for retrospective trips (you write one `<Day>` block, no risk of the component guessing wrong).

**Also simplified from the design doc:** the design doc describes a single-image `Entry` rendering "directly, no grid chrome" while multi-image entries use `Gallery`. This plan instead always delegates to `Gallery` for any `Entry` with one or more images, including the single-image case — `Gallery` already renders a single image as one plain thumbnail button with no visible grid chrome, so the visual result is the same, and it avoids re-implementing lightbox open/close/keyboard-nav logic a second time for the single-image path.

**Also corrected during planning:** the original data fetch (`scripts/fetch-florigon.mjs`) grouped/timestamped posts by GMT, but the trip happened in `America/Los_Angeles` time (per the blog's own `timezone="US/Pacific"` attribute) — a post made at 7pm Thursday Pacific was landing on Friday's GMT date. This has already been fixed and re-fetched (223 posts now correctly span 2010-01-31 through 2010-02-21 in Pacific local time; images re-downloaded under corrected filenames in `scripts/florigon-staging/`). No task below needs to redo this — it's done. Frontmatter date for the trip post is `2010-01-31` (the earliest actual local-time content), not `2010-02-01` as discussed earlier.

---

### Task 1: `formatTime` utility

**Files:**
- Create: `src/lib/formatTime.mjs`
- Test: `src/lib/formatTime.test.mjs`

**Interfaces:**
- Produces: `formatTime(time: string): string` — takes 24h `"HH:MM"`, returns 12h `"h:mm AM/PM"`. Used by Task 3 (`Entry.astro`).

- [ ] **Step 1: Write the failing test**

```js
// src/lib/formatTime.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime } from './formatTime.mjs';

test('formats midnight hour as 12 AM', () => {
  assert.equal(formatTime('00:13'), '12:13 AM');
});

test('formats noon hour as 12 PM', () => {
  assert.equal(formatTime('12:00'), '12:00 PM');
});

test('formats afternoon hour', () => {
  assert.equal(formatTime('13:49'), '1:49 PM');
});

test('formats late night hour', () => {
  assert.equal(formatTime('23:59'), '11:59 PM');
});

test('formats single-digit morning hour', () => {
  assert.equal(formatTime('02:26'), '2:26 AM');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/formatTime.test.mjs`
Expected: FAIL — `Cannot find module './formatTime.mjs'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/formatTime.mjs
export function formatTime(time) {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/formatTime.test.mjs`
Expected: 5 pass, 0 fail

- [ ] **Step 5: Commit**

```bash
git add src/lib/formatTime.mjs src/lib/formatTime.test.mjs
git commit -m "Add formatTime utility for Entry timestamps"
```

---

### Task 2: `formatDayHeading` utility

**Files:**
- Create: `src/lib/formatDayHeading.mjs`
- Test: `src/lib/formatDayHeading.test.mjs`

**Interfaces:**
- Produces: `formatDayHeading(date: string): string` — takes `"YYYY-MM-DD"`, returns e.g. `"Thursday, February 11, 2010"`. Used by Task 3 (`Day.astro`).

- [ ] **Step 1: Write the failing test**

```js
// src/lib/formatDayHeading.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDayHeading } from './formatDayHeading.mjs';

test('formats a date string with correct weekday', () => {
  assert.equal(formatDayHeading('2010-02-11'), 'Thursday, February 11, 2010');
});

test('does not shift the date across a UTC day boundary', () => {
  // Regression guard: new Date('2010-02-01') parses as UTC midnight, which
  // renders as Jan 31 in negative-UTC-offset timezones if formatted naively.
  assert.equal(formatDayHeading('2010-02-01'), 'Monday, February 1, 2010');
});

test('formats a date near the end of a month', () => {
  assert.equal(formatDayHeading('2010-02-28'), 'Sunday, February 28, 2010');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/formatDayHeading.test.mjs`
Expected: FAIL — `Cannot find module './formatDayHeading.mjs'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/formatDayHeading.mjs
export function formatDayHeading(date) {
  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/formatDayHeading.test.mjs`
Expected: 3 pass, 0 fail

- [ ] **Step 5: Commit**

```bash
git add src/lib/formatDayHeading.mjs src/lib/formatDayHeading.test.mjs
git commit -m "Add formatDayHeading utility for Day headings"
```

---

### Task 3: `Entry`, `Day`, `Travelogue` components

**Files:**
- Create: `src/components/Entry.astro`
- Create: `src/components/Day.astro`
- Create: `src/components/Travelogue.astro`
- Temporary (not committed): `src/content/blog/2026-01-01-travelogue-smoke-test/index.mdx`

**Interfaces:**
- Consumes: `formatTime` from `src/lib/formatTime.mjs` (Task 1), `formatDayHeading` from `src/lib/formatDayHeading.mjs` (Task 2), existing `Gallery.astro` (`src/components/Gallery.astro`, props: `images: (string | ImageMetadata | { src, caption? })[]`).
- Produces: `Entry` (props: `time?: string`, `images?: ImageInput[]`, default slot = prose), `Day` (props: `date: string`, default slot = `Entry` children), `Travelogue` (no props, default slot = `Day` children). Used by Task 5 (`build-florigon-post.mjs` output) and any future hand-authored trip post.

- [ ] **Step 1: Write `Entry.astro`**

```astro
---
// src/components/Entry.astro
import type { ImageMetadata } from 'astro';
import Gallery from './Gallery.astro';
import { formatTime } from '../lib/formatTime.mjs';

type ImageInput =
  | string
  | ImageMetadata
  | { src: string | ImageMetadata; caption?: string };

interface Props {
  time?: string;
  images?: ImageInput[];
}

const { time, images = [] } = Astro.props;
---
<div class="entry">
  <div class="entry-marker"></div>
  <div class="entry-body">
    {time && <div class="entry-time">{formatTime(time)}</div>}
    <div class="entry-text"><slot /></div>
    {images.length > 0 && <Gallery images={images} />}
  </div>
</div>

<style>
.entry {
  position: relative;
  margin-bottom: 1.4em;
}

.entry:last-child {
  margin-bottom: 0;
}

.entry-marker {
  position: absolute;
  left: -24px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-muted);
}

.entry-time {
  font-size: 0.75em;
  color: var(--color-muted);
  margin-bottom: 0.3em;
}

.entry-text :global(p) {
  margin: 0 0 0.5em;
}

.entry-text:empty {
  display: none;
}
</style>
```

- [ ] **Step 2: Write `Day.astro`**

```astro
---
// src/components/Day.astro
import { formatDayHeading } from '../lib/formatDayHeading.mjs';

interface Props {
  date: string;
}

const { date } = Astro.props;
---
<div class="day">
  <h2 class="day-heading">{formatDayHeading(date)}</h2>
  <div class="day-entries">
    <slot />
  </div>
</div>

<style>
.day {
  margin-top: 2em;
}

.day:first-child {
  margin-top: 0;
}

.day-heading {
  font-size: 1.1em;
  margin: 0 0 1em;
  padding-bottom: 0.4em;
  border-bottom: 2px solid var(--color-border);
}

.day-entries {
  position: relative;
  padding-left: 28px;
}

.day-entries::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: var(--color-border);
}
</style>
```

- [ ] **Step 3: Write `Travelogue.astro`**

```astro
---
// src/components/Travelogue.astro
---
<div class="travelogue">
  <slot />
</div>

<style>
.travelogue {
  margin: 1.5em 0;
}
</style>
```

- [ ] **Step 4: Create a temporary smoke-test post**

```mdx
---
title: Travelogue Smoke Test
date: '2026-01-01'
draft: true
---
import Travelogue from '../../../components/Travelogue.astro';
import Day from '../../../components/Day.astro';
import Entry from '../../../components/Entry.astro';

<Travelogue>
  <Day date="2010-02-01">
    <Entry time="04:18">Just now leaving Pensacola</Entry>
    <Entry time="13:05">No caption on this one</Entry>
  </Day>
  <Day date="2010-02-02">
    <Entry time="09:00">Second day, no time-sensitive drama.</Entry>
  </Day>
</Travelogue>
```

Save this as `src/content/blog/2026-01-01-travelogue-smoke-test/index.mdx`. This file is scratch-only and gets deleted in Step 6 — do not commit it.

- [ ] **Step 5: Build and verify structurally**

Run: `npm run build`
Expected: build succeeds with no errors.

Run: `grep -o 'Monday, February 1, 2010' dist/blog/travelogue-smoke-test/index.html`
Expected: prints the matched string (confirms `Day` heading rendered correctly)

Run: `grep -o '4:18 AM' dist/blog/travelogue-smoke-test/index.html`
Expected: prints the matched string (confirms `Entry` time formatting rendered correctly)

Run: `grep -c 'class="entry"' dist/blog/travelogue-smoke-test/index.html`
Expected: `3` (three `Entry` components rendered)

- [ ] **Step 6: Manual visual check, then delete the scratch post**

Run: `npm run dev` in the background, open `http://localhost:4321/blog/travelogue-smoke-test/` in a browser, confirm the timeline renders as expected (day heading, rail line, dot markers, time labels) and matches the approved "line & dot" mockup. Stop the dev server.

Run: `rm -rf src/content/blog/2026-01-01-travelogue-smoke-test`

- [ ] **Step 7: Commit**

```bash
git add src/components/Entry.astro src/components/Day.astro src/components/Travelogue.astro
git commit -m "Add Travelogue, Day, and Entry components"
```

---

### Task 4: `build-florigon-post.mjs` pure functions

**Files:**
- Create: `scripts/build-florigon-post.mjs`
- Test: `scripts/build-florigon-post.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure data transforms only).
- Produces (all pure functions, no I/O):
  - `decodeEntities(str: string): string`
  - `stripHtml(html: string): string`
  - `postToEntry(post: object): { date: string, time: string, text: string, images: string[] }`
  - `entriesFromPosts(posts: object[]): entry[]` (sorted chronologically)
  - `groupByDay(entries: entry[]): { date: string, entries: entry[] }[]`
  - `escapeMdxText(text: string): string`
  - `assignImageVars(entries: entry[]): Map<string, string>`
  - `renderEntryMdx(entry: entry, varForFile: Map): string`
  - `renderDayMdx(group: { date, entries }, varForFile: Map): string`
  - `buildMdxBody(posts: object[]): string`
  Used by Task 5 (CLI wiring).

- [ ] **Step 1: Write the failing tests**

```js
// scripts/build-florigon-post.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeEntities,
  stripHtml,
  postToEntry,
  entriesFromPosts,
  groupByDay,
  escapeMdxText,
  assignImageVars,
  renderEntryMdx,
  renderDayMdx,
  buildMdxBody,
} from './build-florigon-post.mjs';

test('decodeEntities decodes the entity set found in the florigon data', () => {
  assert.equal(
    decodeEntities('We&rsquo;ve seen &ldquo;a lot&rdquo; &amp; more&hellip;'),
    'We’ve seen “a lot” & more…'
  );
});

test('stripHtml removes tags and decodes entities', () => {
  assert.equal(stripHtml('<p>We&rsquo;re here.</p>'), 'We’re here.');
});

test('stripHtml collapses an anchor tag to its link text', () => {
  assert.equal(
    stripHtml('<p>See <a href="http://x.com/y">http://x.com/y</a></p>'),
    'See http://x.com/y'
  );
});

test('stripHtml returns empty string for empty input', () => {
  assert.equal(stripHtml(''), '');
});

test('postToEntry converts a Photo post', () => {
  const post = {
    type: 'Photo',
    date: '2010-02-11 02:26:00',
    images: ['2010-02-11-home-1.jpg'],
    caption: '<p>Home!</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-11',
    time: '02:26',
    text: 'Home!',
    images: ['2010-02-11-home-1.jpg'],
  });
});

test('postToEntry converts a Regular post with a title', () => {
  const post = {
    type: 'Regular',
    date: '2010-02-04 07:15:13',
    images: [],
    title: 'Made it',
    body: '<p>We made it to Albuquerque.</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-04',
    time: '07:15',
    text: '**Made it**\n\nWe made it to Albuquerque.',
    images: [],
  });
});

test('postToEntry converts a Regular post without a title', () => {
  const post = {
    type: 'Regular',
    date: '2010-02-01 13:05:39',
    images: [],
    title: '',
    body: '<p>Got up at 4:40 this morning.</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-01',
    time: '13:05',
    text: 'Got up at 4:40 this morning.',
    images: [],
  });
});

test('postToEntry converts a Quote post with a source', () => {
  const post = {
    type: 'Quote',
    date: '2010-02-08 23:27:52',
    images: [],
    quoteText: 'Adventure is out there',
    quoteSource: 'Some movie',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-08',
    time: '23:27',
    text: '"Adventure is out there" — Some movie',
    images: [],
  });
});

test('entriesFromPosts sorts entries chronologically regardless of input order', () => {
  const posts = [
    { type: 'Photo', date: '2010-02-02 09:00:00', images: [], caption: '' },
    { type: 'Photo', date: '2010-02-01 08:00:00', images: [], caption: '' },
    { type: 'Photo', date: '2010-02-01 20:00:00', images: [], caption: '' },
  ];
  const entries = entriesFromPosts(posts);
  assert.deepEqual(
    entries.map((e) => `${e.date} ${e.time}`),
    ['2010-02-01 08:00', '2010-02-01 20:00', '2010-02-02 09:00']
  );
});

test('groupByDay groups consecutive same-date entries', () => {
  const entries = [
    { date: '2010-02-01', time: '08:00', text: 'a', images: [] },
    { date: '2010-02-01', time: '20:00', text: 'b', images: [] },
    { date: '2010-02-02', time: '09:00', text: 'c', images: [] },
  ];
  const groups = groupByDay(entries);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].date, '2010-02-01');
  assert.equal(groups[0].entries.length, 2);
  assert.equal(groups[1].date, '2010-02-02');
  assert.equal(groups[1].entries.length, 1);
});

test('escapeMdxText escapes curly braces', () => {
  assert.equal(escapeMdxText('a {b} c'), 'a \\{b\\} c');
});

test('assignImageVars assigns sequential unique variable names, reusing repeats', () => {
  const entries = [
    { date: '2010-02-01', time: '08:00', text: '', images: ['a.jpg', 'b.jpg'] },
    { date: '2010-02-01', time: '09:00', text: '', images: ['a.jpg'] },
  ];
  const varForFile = assignImageVars(entries);
  assert.equal(varForFile.get('a.jpg'), 'img1');
  assert.equal(varForFile.get('b.jpg'), 'img2');
  assert.equal(varForFile.size, 2);
});

test('renderEntryMdx renders time, images, and text', () => {
  const entry = { date: '2010-02-01', time: '04:18', text: 'Leaving', images: ['a.jpg'] };
  const varForFile = new Map([['a.jpg', 'img1']]);
  const result = renderEntryMdx(entry, varForFile);
  assert.match(result, /<Entry time="04:18" images=\{\[img1\]\}>/);
  assert.match(result, /Leaving/);
});

test('renderEntryMdx omits time attribute when time is absent', () => {
  const entry = { date: '2010-02-01', time: '', text: 'Leaving', images: [] };
  const varForFile = new Map();
  const result = renderEntryMdx(entry, varForFile);
  assert.doesNotMatch(result, /time="/);
});

test('renderEntryMdx renders an empty entry with no children between tags', () => {
  const entry = { date: '2010-02-01', time: '04:18', text: '', images: [] };
  const varForFile = new Map();
  assert.equal(renderEntryMdx(entry, varForFile), '    <Entry time="04:18"></Entry>');
});

test('renderDayMdx wraps entries in a Day tag with the group date', () => {
  const group = {
    date: '2010-02-01',
    entries: [{ date: '2010-02-01', time: '04:18', text: 'Leaving', images: [] }],
  };
  const result = renderDayMdx(group, new Map());
  assert.match(result, /^ {2}<Day date="2010-02-01">/);
  assert.match(result, /<\/Day>$/);
  assert.match(result, /Leaving/);
});

test('buildMdxBody produces valid-looking MDX with imports and nested Day/Entry tags', () => {
  const posts = [
    {
      type: 'Photo',
      date: '2010-02-01 04:18:00',
      images: ['2010-02-01-a-1.jpg'],
      caption: '<p>Leaving</p>',
    },
  ];
  const result = buildMdxBody(posts);
  assert.match(result, /import Travelogue from '\.\.\/\.\.\/\.\.\/components\/Travelogue\.astro';/);
  assert.match(result, /import Day from '\.\.\/\.\.\/\.\.\/components\/Day\.astro';/);
  assert.match(result, /import Entry from '\.\.\/\.\.\/\.\.\/components\/Entry\.astro';/);
  assert.match(result, /import img1 from '\.\/2010-02-01-a-1\.jpg';/);
  assert.match(result, /<Travelogue>/);
  assert.match(result, /<Day date="2010-02-01">/);
  assert.match(result, /<Entry time="04:18" images=\{\[img1\]\}>/);
  assert.match(result, /Leaving/);
  assert.match(result, /<\/Travelogue>/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/build-florigon-post.test.mjs`
Expected: FAIL — `Cannot find module './build-florigon-post.mjs'`

- [ ] **Step 3: Write the implementation**

```js
// scripts/build-florigon-post.mjs
const ENTITIES = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&hellip;': '…',
  '&amp;': '&',
};

export function decodeEntities(str) {
  let result = str;
  for (const [entity, char] of Object.entries(ENTITIES)) {
    result = result.split(entity).join(char);
  }
  return result;
}

export function stripHtml(html) {
  return decodeEntities((html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function postToEntry(post) {
  const date = post.date.slice(0, 10);
  const time = post.date.slice(11, 16);
  const images = post.images || [];
  let text = '';

  if (post.type === 'Photo') {
    text = stripHtml(post.caption);
  } else if (post.type === 'Regular') {
    const title = stripHtml(post.title);
    const body = stripHtml(post.body);
    text = title ? `**${title}**\n\n${body}` : body;
  } else if (post.type === 'Quote') {
    const quote = stripHtml(post.quoteText);
    const source = stripHtml(post.quoteSource);
    text = source ? `"${quote}" — ${source}` : `"${quote}"`;
  }

  return { date, time, text, images };
}

export function entriesFromPosts(posts) {
  return posts
    .map(postToEntry)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function groupByDay(entries) {
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }
  return groups;
}

export function escapeMdxText(text) {
  return text.replace(/[{}]/g, (c) => `\\${c}`);
}

export function assignImageVars(entries) {
  const varForFile = new Map();
  let n = 0;
  for (const entry of entries) {
    for (const file of entry.images) {
      if (!varForFile.has(file)) {
        n += 1;
        varForFile.set(file, `img${n}`);
      }
    }
  }
  return varForFile;
}

export function renderEntryMdx(entry, varForFile) {
  const timeAttr = entry.time ? ` time="${entry.time}"` : '';
  const imageVars = entry.images.map((f) => varForFile.get(f));
  const imagesAttr = imageVars.length > 0 ? ` images={[${imageVars.join(', ')}]}` : '';
  const text = escapeMdxText(entry.text);
  const body = text ? `\n      ${text}\n    ` : '';
  return `    <Entry${timeAttr}${imagesAttr}>${body}</Entry>`;
}

export function renderDayMdx(group, varForFile) {
  const entryLines = group.entries.map((e) => renderEntryMdx(e, varForFile)).join('\n');
  return `  <Day date="${group.date}">\n${entryLines}\n  </Day>`;
}

export function buildMdxBody(posts) {
  const entries = entriesFromPosts(posts);
  const groups = groupByDay(entries);
  const varForFile = assignImageVars(entries);

  const imageImports = [...varForFile.entries()]
    .map(([file, varName]) => `import ${varName} from './${file}';`)
    .join('\n');

  const dayBlocks = groups.map((g) => renderDayMdx(g, varForFile)).join('\n');

  return `import Travelogue from '../../../components/Travelogue.astro';
import Day from '../../../components/Day.astro';
import Entry from '../../../components/Entry.astro';
${imageImports}

<Travelogue>
${dayBlocks}
</Travelogue>
`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/build-florigon-post.test.mjs`
Expected: 17 pass, 0 fail

- [ ] **Step 5: Commit**

```bash
git add scripts/build-florigon-post.mjs scripts/build-florigon-post.test.mjs
git commit -m "Add pure transform functions for the florigon MDX import"
```

---

### Task 5: `build-florigon-post.mjs` CLI wiring — generate the real post

**Files:**
- Modify: `scripts/build-florigon-post.mjs` (add CLI entry point)
- Create (generated, then committed): `src/content/blog/2010-01-31-florigon/index.mdx` and its sibling image files

**Interfaces:**
- Consumes: `entriesFromPosts`, `buildMdxBody` from Task 4.
- Produces: the on-disk florigon post, used by Task 6 (folding in overlap posts) and Task 7 (final verification).

- [ ] **Step 1: Add the CLI block to `scripts/build-florigon-post.mjs`**

Append to the end of the file:

```js
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const FRONTMATTER = `---
title: Florigon
date: '2010-01-31'
tags: [florigon]
description: A road trip from Pensacola, FL to Portland, OR — Feb 2010.
---
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = join(__dirname, '..');
  const STAGING_DIR = join(__dirname, 'florigon-staging');
  const OUT_DIR = join(REPO_ROOT, 'src', 'content', 'blog', '2010-01-31-florigon');

  mkdirSync(OUT_DIR, { recursive: true });

  const posts = JSON.parse(readFileSync(join(STAGING_DIR, 'posts.json'), 'utf8'));
  const entries = entriesFromPosts(posts);
  const usedFiles = new Set(entries.flatMap((e) => e.images));

  for (const file of usedFiles) {
    copyFileSync(join(STAGING_DIR, 'images', file), join(OUT_DIR, file));
  }

  const mdx = FRONTMATTER + '\n' + buildMdxBody(posts);
  writeFileSync(join(OUT_DIR, 'index.mdx'), mdx);

  console.log(`Wrote ${join(OUT_DIR, 'index.mdx')} with ${entries.length} entries, ${usedFiles.size} images`);
}
```

Move the `import` statements for `fs`, `path`, and `url` to the top of the file alongside any existing imports (there are none yet in this file, so this is the first import block).

- [ ] **Step 2: Re-run the unit tests to confirm the CLI addition didn't break the pure functions**

Run: `node --test scripts/build-florigon-post.test.mjs`
Expected: 17 pass, 0 fail (the `if (process.argv[1] === ...)` guard means the CLI block does not execute under `node --test`)

- [ ] **Step 3: Run the script for real**

Run: `node scripts/build-florigon-post.mjs`
Expected output: `Wrote .../src/content/blog/2010-01-31-florigon/index.mdx with 223 entries, 185 images`

- [ ] **Step 4: Verify the generated files**

Run: `ls src/content/blog/2010-01-31-florigon | wc -l`
Expected: `186` (185 images + `index.mdx`)

Run: `head -20 src/content/blog/2010-01-31-florigon/index.mdx`
Expected: frontmatter block, then `import Travelogue ...` / `import Day ...` / `import Entry ...` lines, then a run of `import imgN from './...'` lines.

- [ ] **Step 5: Build and verify structurally**

Run: `npm run build`
Expected: build succeeds with no errors (this is the real type/compile check for all 223 generated `<Entry>` / `<Day>` tags).

Run: `grep -c 'class="entry"' dist/blog/florigon/index.html`
Expected: `223`

Run: `grep -c 'class="day-heading"' dist/blog/florigon/index.html`
Expected: matches the number of distinct days in `scripts/florigon-staging/posts.json` (16, per the grouping check already run during planning) — run `grep -c 'class="day-heading"' dist/blog/florigon/index.html` and confirm it's `16`.

- [ ] **Step 6: Manual visual check**

Run: `npm run dev` in the background, open `http://localhost:4321/blog/florigon/`, scroll through and confirm: day headings render in order, timestamps look correct (e.g. the Feb 10 "We made it!!!" entry should NOT be under Feb 11 — this was the timezone bug fixed during planning), images load and lightbox on click. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-florigon-post.mjs src/content/blog/2010-01-31-florigon
git commit -m "Generate the florigon Travelogue post from Tumblr data"
```

---

### Task 6: Fold in the 4 existing overlapping posts, delete originals

**Files:**
- Modify: `src/content/blog/2010-01-31-florigon/index.mdx`
- Delete: `src/content/blog/2010-02-01-leaving/`
- Delete: `src/content/blog/2010-02-04-carlsbad-caverns-i-think-this-was-part-of-the/`
- Delete: `src/content/blog/2010-02-09-made-it-to-sfo-were-hangin-at-mr-larners/`
- Delete: `src/content/blog/2010-02-22-cannon-beach/`

**Interfaces:**
- Consumes: the generated `index.mdx` from Task 5.
- Produces: the final florigon post content, verified by Task 7.

This is a manual content-editing task (merging four short, distinct hand-written posts into the generated timeline) rather than a scripted one — each merge is a one-off edit, not a generalizable transform.

- [ ] **Step 1: Read the current content of the 4 posts being folded in**

Run: `cat src/content/blog/2010-02-01-leaving/index.md src/content/blog/2010-02-04-carlsbad-caverns-i-think-this-was-part-of-the/index.md src/content/blog/2010-02-09-made-it-to-sfo-were-hangin-at-mr-larners/index.md src/content/blog/2010-02-22-cannon-beach/index.mdx`

Confirm the content matches what's documented in the design/plan (Leaving: "Just now leaving Pensacola"; Carlsbad Caverns: title + one photo + "I think this was part of the Great Dome. So magical."; SFO: "Made it to SFO. We're hangin at Mr. Larner's."; Cannon Beach: 4 photos with captions).

- [ ] **Step 2: Add a new Entry to the Feb 1 Day group for "Leaving"**

Open `src/content/blog/2010-01-31-florigon/index.mdx`, find the `<Day date="2010-02-01">` block. Its earliest existing entry is `time="05:05"`. Add a new `<Entry>` as the block's first child, before that one:

```mdx
    <Entry time="05:00">Just now leaving Pensacola</Entry>
```

- [ ] **Step 3: Add a photo Entry to the Feb 3 Day group for "Carlsbad Caverns"**

The Carlsbad Caverns content in the florigon data itself sits in the **Feb 3** day group (local time), not Feb 4 — there's a `22:52` "At Carlsbad Caverns" / `22:56` "This place is magical. Go see it." pair of entries already in that group.

Copy the image file:

```bash
cp src/content/blog/2010-02-04-carlsbad-caverns-i-think-this-was-part-of-the/tumblr_kxc1tcOfE31qz70lno1_1280.jpg src/content/blog/2010-01-31-florigon/carlsbad-caverns-great-dome.jpg
```

In `index.mdx`, add an import near the other image imports:

```mdx
import carlsbadCavernsGreatDome from './carlsbad-caverns-great-dome.jpg';
```

Find the `<Day date="2010-02-03">` block and add a new `<Entry>` right after the existing `time="22:56"` entry:

```mdx
    <Entry time="22:57" images={[carlsbadCavernsGreatDome]}>**Carlsbad Caverns:** I think this was part of the Great Dome. So magical.</Entry>
```

- [ ] **Step 4: Add an Entry to the Feb 9 Day group for "Made it to SFO"**

The Feb 9 group's entries run from `16:25` (leaving San Francisco) through a `20:38`–`21:30` dinner cluster that includes a `21:05` "Brigit and Mr. Larner" photo — "Made it to SFO. We're hangin at Mr. Larner's." belongs earlier in that evening, before the dinner-out entries. Add it right after the `16:30` entry and before the `18:30` entry:

```mdx
    <Entry time="17:00">Made it to SFO. We’re hangin at Mr. Larner’s.</Entry>
```

(Use an actual `'` apostrophe in the file, not the escaped unicode — that's shown escaped here only because of this plan document's own formatting.)

- [ ] **Step 5: Replace the Feb 21 Cannon Beach entry's single photo with the 4 richer photos**

The Haystack Rock / Cannon Beach entry is in the **Feb 21** day group (local time), not Feb 22 — it's the group's single `time="22:38"` entry.

Copy the 4 image files:

```bash
cp src/content/blog/2010-02-22-cannon-beach/tumblr_ky8cnn2Tol1qz70lno1_1280.jpg src/content/blog/2010-01-31-florigon/cannon-beach-photo-buffs.jpg
cp src/content/blog/2010-02-22-cannon-beach/tumblr_ky8co43EZv1qz70lno1_1280.jpg src/content/blog/2010-01-31-florigon/cannon-beach.jpg
cp src/content/blog/2010-02-22-cannon-beach/tumblr_ky8cnx6D0J1qz70lno1_1280.jpg src/content/blog/2010-01-31-florigon/cannon-beach-sunset.jpg
cp src/content/blog/2010-02-22-cannon-beach/tumblr_ky8cnuvnj51qz70lno1_1280.jpg src/content/blog/2010-01-31-florigon/haystack-rock.jpg
```

In `index.mdx`, add imports:

```mdx
import cannonBeachPhotoBuffs from './cannon-beach-photo-buffs.jpg';
import cannonBeach from './cannon-beach.jpg';
import cannonBeachSunset from './cannon-beach-sunset.jpg';
import haystackRock from './haystack-rock.jpg';
```

Find the existing `<Entry>` for the Haystack Rock photo (single image, empty caption, in the last `<Day>` group) and replace its `images` prop and add caption text:

```mdx
    <Entry time="22:38" images={[
      { src: cannonBeachPhotoBuffs, caption: 'Photo buffs at Cannon Beach' },
      { src: cannonBeach, caption: 'Cannon Beach' },
      { src: cannonBeachSunset, caption: 'Cannon Beach sunset' },
      { src: haystackRock, caption: 'Haystack Rock' },
    ]}></Entry>
```

(Keep the original entry's `time` value — only replace the `images` array.)

- [ ] **Step 6: Delete the 4 original standalone posts**

```bash
rm -rf src/content/blog/2010-02-01-leaving
rm -rf src/content/blog/2010-02-04-carlsbad-caverns-i-think-this-was-part-of-the
rm -rf src/content/blog/2010-02-09-made-it-to-sfo-were-hangin-at-mr-larners
rm -rf src/content/blog/2010-02-22-cannon-beach
```

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: build succeeds with no errors, and no longer produces `dist/blog/leaving/`, `dist/blog/carlsbad-caverns.../`, `dist/blog/made-it-to-sfo.../`, or `dist/blog/cannon-beach/`.

Run: `grep -c 'Just now leaving Pensacola' dist/blog/florigon/index.html`
Expected: `1`

Run: `grep -c 'Haystack Rock' dist/blog/florigon/index.html`
Expected: `1`

- [ ] **Step 8: Commit**

```bash
git add -A src/content/blog
git commit -m "Fold overlapping standalone trip posts into the florigon Travelogue"
```

---

### Task 7: Cleanup and final verification

**Files:**
- Delete: `scripts/build-florigon-review.mjs`
- Delete: `scripts/florigon-staging/` (entire directory — 21MB+ of staging images/JSON/thumbnails, no longer needed once the real post is committed)
- Keep: `scripts/fetch-florigon.mjs`, `scripts/build-florigon-post.mjs` (+ its test) as permanent one-shot migration scripts, matching `scripts/migrate-posts.mjs`

**Interfaces:** None — this is verification and cleanup only.

- [ ] **Step 1: Remove scratch tooling and staging data**

```bash
rm scripts/build-florigon-review.mjs
rm -rf scripts/florigon-staging
```

- [ ] **Step 2: Run the full test suite**

Run: `node --test src/lib/*.test.mjs scripts/*.test.mjs`
Expected: all tests pass (5 from Task 1 + 3 from Task 2 + 17 from Task 4 + any pre-existing `migrate-posts.test.mjs` tests, 0 fail)

- [ ] **Step 3: Full production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Verify the tag page**

Run: `npm run build` (if not already run in Step 3), then:
Run: `cat dist/tags/florigon/index.html | grep -o 'Florigon'`
Expected: prints `Florigon` (confirms the post is listed under its tag)

- [ ] **Step 5: Final manual check**

Run: `npm run dev` in the background. Visit `http://localhost:4321/blog/florigon/` and `http://localhost:4321/tags/florigon/` in a browser. Confirm: the trip reads top-to-bottom as a coherent timeline, the 4 folded-in entries (Leaving, Carlsbad Caverns, SFO, Cannon Beach) appear in their correct days with the right content, and no broken images. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A scripts
git commit -m "Remove florigon staging data and review tooling"
```
