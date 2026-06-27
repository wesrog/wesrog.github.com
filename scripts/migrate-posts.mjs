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
