#!/usr/bin/env node
// One-off script: derive a title for posts with an empty `title: ""` frontmatter
// field, using the first line of the post body. Rewrites only the `title:` line.

import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'blog');
const MAX_LEN = 80;

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

function deriveTitle(body) {
  const firstLine = body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);

  if (!firstLine) return 'Untitled';

  // Strip markdown emphasis/link syntax so it reads cleanly as plain text.
  let text = firstLine
    .replace(/^#+\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();

  if (text.length > MAX_LEN) {
    const cut = text.slice(0, MAX_LEN);
    const lastSpace = cut.lastIndexOf(' ');
    text = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…';
  }

  return text;
}

function yamlQuote(title) {
  return `"${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const files = findPostFiles(BLOG_DIR);
let changed = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Could not parse frontmatter in ${file}`);
  const [, frontmatter, body] = match;

  if (!/^title: ""$/m.test(frontmatter)) continue;

  const title = deriveTitle(body);
  const newFrontmatter = frontmatter.replace(/^title: ""$/m, `title: ${yamlQuote(title)}`);
  const updated = raw.replace(frontmatter, newFrontmatter);

  fs.writeFileSync(file, updated);
  changed++;
  console.log(`${path.relative(BLOG_DIR, file)}: -> ${title}`);
}

console.log(`\nDone. ${changed} files updated.`);
