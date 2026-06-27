#!/usr/bin/env node
// Converts HTML in post bodies to markdown in-place.
// Run from repo root: node scripts/html-to-md.mjs

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'src', 'content', 'blog');

const td = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});
td.keep(['audio', 'iframe', 'source']);
td.addRule('emptyP', {
  filter: node => node.nodeName === 'P' && !node.textContent.trim(),
  replacement: () => '',
});

function splitFrontmatter(src) {
  const match = src.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
  if (!match) return { front: '', body: src };
  return { front: match[1], body: match[2] };
}

function hasHtml(text) {
  return /<[a-z][a-z0-9]*[\s/>]/i.test(text);
}

// For blocks that start with '<': full turndown conversion.
// For blocks with inline HTML mixed into non-HTML content: targeted regex only.
// For plain text/markdown blocks: leave untouched.

function convertInlineHtml(block) {
  return block
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) =>
      `[${text.replace(/<[^>]+>/g, '').trim()}](${href})`)
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
}

function convertBlock(block) {
  const trimmed = block.trim();
  if (!trimmed || !hasHtml(trimmed)) return block;

  if (trimmed.startsWith('<')) {
    // Pure HTML block: use turndown
    const md = td.turndown(trimmed);
    return md.replace(/\n{3,}/g, '\n\n').trim();
  } else {
    // Mixed block: targeted inline conversion only
    return convertInlineHtml(trimmed);
  }
}

function convert(body) {
  if (!hasHtml(body)) return body;
  const blocks = body.split(/\n\n+/);
  const result = blocks.map(convertBlock).filter(b => b !== null);
  return result.join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// Skip .mdx files — they use JSX components which look like HTML but aren't
const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
let changed = 0, unchanged = 0;

for (const file of files) {
  const path = join(CONTENT_DIR, file);
  const src = readFileSync(path, 'utf-8');
  const { front, body } = splitFrontmatter(src);

  if (!hasHtml(body)) { unchanged++; continue; }

  const converted = convert(body);
  const newSrc = front + '\n' + converted;
  if (newSrc === src) { unchanged++; continue; }

  writeFileSync(path, newSrc);
  changed++;
}

console.log(`Done: ${changed} converted, ${unchanged} unchanged`);
