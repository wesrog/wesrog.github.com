# Persistent Audio Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky audio bar that persists across page navigations when a music track is playing, using Astro View Transitions.

**Architecture:** Enable Astro View Transitions site-wide via `<ViewTransitions />` in BaseLayout. A new `PersistentPlayer` component marked `transition:persist` lives in the layout and is kept alive by Astro across page swaps — including its `<audio>` element, so playback state is preserved. Per-post `AudioPlayer` components dispatch a `play-track` CustomEvent on `document`; `PersistentPlayer` listens once (guarded by a `data-initialized` flag) and handles all audio state.

**Tech Stack:** Astro 7 (built-in View Transitions via `astro:transitions`), vanilla TypeScript in `<script>` blocks, native `<audio controls>`

## Global Constraints

- Astro `^7.0.3` — import `ViewTransitions` from `astro:transitions`
- No new npm dependencies
- All theming via existing CSS variables: `--color-bg`, `--color-border`, `--color-text`, `--color-muted`, `--spacing`
- Native `<audio controls>` only — no custom audio skin
- Scripts use `astro:page-load` lifecycle event (fires on initial load and after every View Transitions navigation)

---

### Task 1: PersistentPlayer component + View Transitions

**Files:**
- Create: `src/components/PersistentPlayer.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `#persistent-player` DOM element with `transition:persist`; listens on `document` for `play-track` CustomEvent with `detail: { src: string; title: string }`; adds/removes `player-active` class on `<body>`

- [ ] **Step 1: Create `src/components/PersistentPlayer.astro`**

```astro
---
---
<div id="persistent-player" transition:persist style="display: none">
  <span class="pp-title"></span>
  <audio controls></audio>
  <button class="pp-close" aria-label="Close player">✕</button>
</div>

<style>
#persistent-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem var(--spacing);
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}
.pp-title {
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875em;
  color: var(--color-muted);
}
#persistent-player audio {
  flex: 1;
  min-width: 0;
}
.pp-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-muted);
  font-size: 1.2em;
  line-height: 1;
  padding: 0.25em;
  flex-shrink: 0;
}
</style>

<script>
function showBar() {
  const bar = document.getElementById('persistent-player') as HTMLElement;
  if (bar) {
    bar.style.display = 'flex';
    document.body.classList.add('player-active');
  }
}

function hideBar() {
  const bar = document.getElementById('persistent-player') as HTMLElement;
  if (bar) {
    bar.style.display = 'none';
    document.body.classList.remove('player-active');
  }
}

document.addEventListener('astro:page-load', () => {
  const bar = document.getElementById('persistent-player') as HTMLElement;
  if (!bar || bar.dataset.initialized) return;
  bar.dataset.initialized = 'true';

  const audio = bar.querySelector('audio') as HTMLAudioElement;
  const titleEl = bar.querySelector('.pp-title') as HTMLElement;
  const closeBtn = bar.querySelector('.pp-close') as HTMLButtonElement;

  document.addEventListener('play-track', (e) => {
    const { src, title } = (e as CustomEvent<{ src: string; title: string }>).detail;
    const resolvedSrc = new URL(src, location.href).href;
    if (audio.src === resolvedSrc && !audio.paused) return;
    audio.src = src;
    titleEl.textContent = title;
    showBar();
    audio.play().catch(() => {});
  });

  audio.addEventListener('ended', hideBar);

  closeBtn.addEventListener('click', () => {
    audio.pause();
    hideBar();
  });
});
</script>
```

- [ ] **Step 2: Update `src/layouts/BaseLayout.astro`**

Replace the entire file:

```astro
---
import { ViewTransitions } from 'astro:transitions';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import PersistentPlayer from '../components/PersistentPlayer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
  noindex?: boolean;
}
const { title, description = 'Thoughts and waves from Wes Rogers.', noindex = false } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title === 'WR' ? 'WR' : `${title} | WR`}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex" />}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="WR" href="/rss.xml" />
    <ViewTransitions />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
    <PersistentPlayer />
  </body>
</html>
```

- [ ] **Step 3: Add player-active body padding to `src/styles/global.css`**

Append at the end of the file:

```css
body.player-active { padding-bottom: 80px; }
```

- [ ] **Step 4: Verify in dev server**

```bash
npm run dev
```

Open http://localhost:4321 in browser. Open DevTools console. Run:

```js
document.dispatchEvent(new CustomEvent('play-track', { detail: { src: '/fake.mp3', title: 'Test Track' } }))
```

Expected:
- Sticky bar appears at bottom with title "Test Track" and native audio controls
- `body` has class `player-active` (check in Elements panel)
- `✕` button dismisses the bar and removes `player-active`
- Navigate to another page — bar stays visible, stays dismissed (whichever state it was in)

- [ ] **Step 5: Commit**

```bash
git add src/components/PersistentPlayer.astro src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: add PersistentPlayer bar with View Transitions"
```

---

### Task 2: Modify AudioPlayer to dispatch and hand off

**Files:**
- Modify: `src/components/AudioPlayer.astro`

**Interfaces:**
- Consumes: nothing
- Produces: dispatches `play-track` CustomEvent on `document` with `detail: { src: string; title: string }` where `title` is read from the page's `<h1>` at click time

- [ ] **Step 1: Replace `src/components/AudioPlayer.astro`**

```astro
---
interface Props {
  src: string;
}
const { src } = Astro.props;
---
<div class="audio-player">
  <button class="audio-play-btn" data-src={src}>▶ Play</button>
  <span class="audio-now-playing" style="display: none">now playing ↓</span>
</div>

<style>
.audio-player { margin: 1em 0; }
.audio-play-btn {
  cursor: pointer;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.4em 1em;
  color: var(--color-text);
  font-size: 1em;
}
.audio-now-playing {
  color: var(--color-muted);
  font-size: 0.875em;
  font-style: italic;
}
</style>

<script>
function setupAudioPlayers() {
  document.querySelectorAll<HTMLButtonElement>('.audio-play-btn:not([data-wired])').forEach(btn => {
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const src = btn.dataset.src ?? '';
      const title = document.querySelector('h1')?.textContent?.trim() ?? '';
      document.dispatchEvent(new CustomEvent('play-track', { detail: { src, title } }));
      btn.style.display = 'none';
      const label = btn.nextElementSibling as HTMLElement | null;
      if (label) label.style.display = '';
    });
  });
}

document.addEventListener('astro:page-load', setupAudioPlayers);
</script>
```

- [ ] **Step 2: Verify hand-off flow**

```bash
npm run dev
```

1. Navigate to http://localhost:4321/blog/2011-02-09-gelem/
2. Confirm page shows `▶ Play` button (no native `<audio>` element)
3. Click `▶ Play`
4. Expected: button disappears, "now playing ↓" label appears, sticky bar appears at bottom with title "gelem" and audio controls
5. Press play in the sticky bar — audio plays
6. Navigate to http://localhost:4321/ — audio continues, bar remains visible
7. Navigate back to `/blog/2011-02-09-gelem/` — `▶ Play` button is visible again (page content was swapped), bar still playing
8. Click `▶ Play` again — no-op: bar stays playing, track does not restart (same src + not paused check fires)
9. Click `✕` in bar — audio stops, bar hides, `padding-bottom` resets

- [ ] **Step 3: Verify all music posts**

Visit each and confirm `▶ Play` works and hands off to the bar:

- http://localhost:4321/blog/2006-02-10-i-am-your-noisy-neighbor/
- http://localhost:4321/blog/2006-03-18-aloneliness/
- http://localhost:4321/blog/2008-11-09-vehicle-the-first-song-recorded-with-fourtrack/
- http://localhost:4321/blog/2009-01-20-vehicle-final-recorded-with-fourtrack/
- http://localhost:4321/blog/2011-02-09-gelem/
- http://localhost:4321/blog/2011-05-13-nanoloop-fun/
- http://localhost:4321/blog/2011-10-11-drums-bass-and-vocals-ian-mackaye-are-sampled/
- http://localhost:4321/blog/2011-10-11-mithrian/
- http://localhost:4321/blog/2019-06-22-gifford-pinchot-birds/
- http://localhost:4321/blog/2020-08-07-wld-2020/

Also verify navigation between two different music posts while playing: clicking `▶ Play` on a second post should swap the bar to the new track.

- [ ] **Step 4: Commit**

```bash
git add src/components/AudioPlayer.astro
git commit -m "feat: AudioPlayer dispatches play-track event, hands off to persistent bar"
```
