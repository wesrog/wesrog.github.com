#!/usr/bin/env node
// Add a `status` tag to posts that were auto-imported from Twitter/Tumblr
// with no real title (identified by an originally-empty `title: ""`,
// captured in scripts/derive-titles.mjs's file list before that ran).

import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'blog');
const listFile = process.argv[2];
if (!listFile) {
  console.error('Usage: node tag-status-posts.mjs <file-with-relative-paths>');
  process.exit(1);
}

const relPaths = fs.readFileSync(listFile, 'utf8').trim().split('\n').filter(Boolean);
let changed = 0;

for (const rel of relPaths) {
  const file = path.join(BLOG_DIR, rel);
  const raw = fs.readFileSync(file, 'utf8');

  const tagsBlockRe = /^tags:\n((?:  - .*\n)+)/m;
  const existing = raw.match(tagsBlockRe);

  let updated;
  if (existing) {
    if (/^\s*- status$/m.test(existing[1])) continue; // already tagged
    updated = raw.replace(tagsBlockRe, `tags:\n${existing[1]}  - status\n`);
  } else {
    // Insert a new tags: block right after the date: line
    const dateLineRe = /^(date: .+)\n/m;
    if (!dateLineRe.test(raw)) throw new Error(`No date: line found in ${file}`);
    updated = raw.replace(dateLineRe, `$1\ntags:\n  - status\n`);
  }

  fs.writeFileSync(file, updated);
  changed++;
}

console.log(`Done. ${changed} files updated.`);
