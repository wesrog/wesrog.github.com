#!/usr/bin/env node
// Detect short Twitter/Tumblr-style status posts: single short paragraph,
// no image/audio/gallery embed, no multiple paragraphs.

import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'blog');
const WORD_LIMIT = 40;

function findPostFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPostFiles(full));
    } else if (entry.name === 'index.md' || entry.name === 'index.mdx') {
      results.push(full);
    }
  }
  return results;
}

const files = findPostFiles(BLOG_DIR);
const candidates = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!match) continue;
  let body = match[1];

  // Strip mdx imports
  body = body.replace(/^import .+$/gm, '');
  // Skip if it has media embeds — those are real content, not status updates
  if (/<audio|<AudioPlayer|<Gallery|!\[/.test(body)) continue;

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length !== 1) continue;

  const text = paragraphs[0];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > WORD_LIMIT) continue;
  if (/^#+\s/.test(text)) continue; // has a heading, likely a real post

  candidates.push({ file: path.relative(BLOG_DIR, file), wordCount, text });
}

candidates.sort((a, b) => a.wordCount - b.wordCount);
for (const c of candidates) {
  console.log(`[${c.wordCount}w] ${c.file}: ${c.text.slice(0, 70)}`);
}
console.log(`\nTotal candidates: ${candidates.length}`);
