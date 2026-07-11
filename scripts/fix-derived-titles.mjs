#!/usr/bin/env node
// Follow-up fix for derive-titles.mjs: strip leftover markdown link syntax
// and escaped punctuation that leaked into derived titles.

import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'blog');

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

function clean(title) {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\([.*_#\[\]()])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const files = findPostFiles(BLOG_DIR);
let changed = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^title: "((?:[^"\\]|\\.)*)"$/m);
  if (!match) continue;

  const original = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const cleaned = clean(original);
  if (cleaned === original) continue;

  const quoted = `"${cleaned.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const updated = raw.replace(/^title: "(?:[^"\\]|\\.)*"$/m, `title: ${quoted}`);
  fs.writeFileSync(file, updated);
  changed++;
  console.log(`${path.relative(BLOG_DIR, file)}: "${original}" -> "${cleaned}"`);
}

console.log(`\nDone. ${changed} files updated.`);
