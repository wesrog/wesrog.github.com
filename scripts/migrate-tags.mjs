#!/usr/bin/env node
// One-off script: remap existing post tags to the canonical taxonomy.
// Rewrites only the `tags:` YAML block in each file's frontmatter, in place,
// leaving everything else (date formatting, body, etc.) untouched.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'blog');

// old tag -> new tag(s)
const TAG_MAP = {
  music: ['music'],
  photography: ['photography'],
  photos: ['photography'],
  programming: ['programming'],
  software: ['software'],
  lastfm: ['lastfm'],
  lastfmtagger: ['lastfm'],
  tagging: ['lastfm'],
  folksonomy: ['lastfm'],
  socialnetworking: ['lastfm'],
  mac: ['mac'],
  ruby: ['ruby'],
  webdev: ['webdev'],
  bicycles: ['bicycling'],
  bicycling: ['bicycling'],
  biking: ['bicycling'],
  food: ['food'],
  recipes: ['food'],
  cooking: ['food'],
  rubycocoa: ['ruby', 'mac'],
  rubyonrails: ['rails'],
  rails: ['rails'],
  geek: ['misc'],
  rant: ['misc'],
  nerd: ['misc'],
  hacks: ['misc'],
  shpoping: ['misc'],
  funny: ['misc'],
  blogging: ['blogging'],
  blogs: ['blogging'],
  life: ['life'],
  nostalgia: ['life'],
  organization: ['life'],
  'time-vampire': ['life'],
  lifestyle: ['life'],
  compositions: ['music-composition'],
  audio: ['music-composition'],
  'field-recording': ['music-composition'],
  mp3: ['music-composition'],
  comics: ['comics'],
  friends: ['friends'],
  gadgets: ['gadgets'],
  computers: ['gadgets'],
  'ms-widget': ['gadgets'],
  railsconf: ['conferences'],
  conferences: ['conferences'],
  travel: ['travel'],
  firefox: ['firefox'],
  diet: ['health'],
  health: ['health'],
  exercise: ['health'],
  politics: ['politics'],
  environment: ['politics'],
  books: ['books'],
  reading: ['books'],
  movies: ['movies'],
  radicalcandor: ['management'],
  iphone: ['iphone'],
  refactoring: ['refactoring'],
  opensource: ['opensource'],
  gaming: ['gaming'],
  testing: ['testing'],
  python: ['python'],
  linux: ['linux'],
  'ubuntu lenovo': ['linux', 'gadgets'],
};

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

function mapTags(oldTags) {
  const newTags = [];
  for (const t of oldTags) {
    const mapped = TAG_MAP[t];
    if (!mapped) {
      throw new Error(`No mapping for tag: ${JSON.stringify(t)}`);
    }
    newTags.push(...mapped);
  }
  return [...new Set(newTags)];
}

function formatTagsBlock(tags) {
  return 'tags:\n' + tags.map((t) => `  - ${t}`).join('\n');
}

const files = findPostFiles(BLOG_DIR);
let changed = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data } = matter(raw);
  const oldTags = data.tags ?? [];
  if (oldTags.length === 0) continue;

  const newTags = mapTags(oldTags);

  const tagsBlockRe = /^tags:\n(?:  - .*\n)+/m;
  if (!tagsBlockRe.test(raw)) {
    throw new Error(`Could not find tags: block to replace in ${file}`);
  }
  const updated = raw.replace(tagsBlockRe, formatTagsBlock(newTags) + '\n');

  if (updated !== raw) {
    fs.writeFileSync(file, updated);
    changed++;
    console.log(`${path.relative(BLOG_DIR, file)}: [${oldTags.join(', ')}] -> [${newTags.join(', ')}]`);
  }
}

console.log(`\nDone. ${changed} files updated.`);
