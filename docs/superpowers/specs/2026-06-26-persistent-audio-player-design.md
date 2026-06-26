# Persistent Audio Player

**Date:** 2026-06-26
**Status:** Approved

## Goal

When a visitor plays a music track on a post page, audio continues uninterrupted as they navigate around the site. A sticky bar appears at the bottom of the viewport while a track is playing and hides when the track ends or is dismissed.

## Approach

Astro View Transitions + `transition:persist`. Enables soft (SPA-style) navigation site-wide; the persisted player DOM node (including its `<audio>` element) is kept alive across page swaps so playback never restarts.

## Components

### `PersistentPlayer.astro` (new)

- Lives in `BaseLayout.astro`, just before `</body>`, with `transition:persist` directive
- Fixed bottom bar, full width, initially `display: none`
- Contains: post title (truncated), native `<audio controls>`, `✕` close button
- **Shows** when a `play-track` CustomEvent is received: sets `audio.src`, sets title text, calls `audio.play()`, makes bar visible
- **Hides** when: `audio` emits `ended`, user clicks `✕` (pause + hide)
- **No-op** when `play-track` fires with the same src that is already playing (prevents restart on back-navigation)
- Mobile Safari: `audio.play()` rejection caught silently; bar shows with track loaded but paused, user taps native controls
- Script uses `astro:page-load` to re-register AudioPlayer click listeners after each navigation

### `AudioPlayer.astro` (modified)

- Replaces `<audio controls>` with a `▶ Play` button
- On click: reads title from `document.querySelector('h1')?.textContent`, dispatches `new CustomEvent('play-track', { detail: { src, title }, bubbles: true })`, hides button, shows muted "now playing ↓" label
- State is local and visual only — resets to `▶ Play` if the page is swapped out and back in (expected; global bar continues playing)

### `BaseLayout.astro` (modified)

- Adds `<ViewTransitions />` to `<head>`
- Adds `<PersistentPlayer />` before `</body>`

## Data Flow

```
User clicks ▶ Play
  → AudioPlayer dispatches play-track CustomEvent (src, title)
  → PersistentPlayer receives event
  → Sets audio.src, title text, shows bar, calls audio.play()
  → Audio plays through page navigations (transition:persist keeps node alive)
  → Track ends or user clicks ✕ → bar hides
```

## Styling

- Uses existing CSS variables: `--color-bg`, `--color-border`, `--color-text`, `--color-muted`
- `border-top: 1px solid var(--color-border)` separates bar from content
- Dark mode inherited automatically
- Native `<audio controls>` — no custom skin

## Edge Cases

| Scenario | Behavior |
|---|---|
| Navigate to a different music post while playing | New `play-track` event swaps src + title, restarts playback |
| Back/forward navigation | PersistentPlayer survives; AudioPlayer on restored page resets to ▶ Play |
| Non-music pages | Bar stays hidden until a track has been played |
| Mobile Safari autoplay blocked | Bar shows, track loaded but paused; user taps to start |
| Same-track play-track fired again | No-op (no restart) |
| Multiple AudioPlayers on one page | Both work; last clicked wins |

## Files Changed

- `src/layouts/BaseLayout.astro` — add ViewTransitions, add PersistentPlayer
- `src/components/AudioPlayer.astro` — replace audio element with play button + event dispatch
- `src/components/PersistentPlayer.astro` — new component
