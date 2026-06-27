#!/usr/bin/env node
// Usage: node scripts/import-tumblr.mjs <api_key>
//
// Imports all original posts from 633k.tumblr.com into src/content/blog/.
// Skips reblogs and posts whose date+slug already exist.
// Downloads images to public/tumblr_files/.

import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'blog');
const IMAGES_DIR = join(ROOT, 'public', 'tumblr_files');
const BLOG = '633k.tumblr.com';

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('Usage: node scripts/import-tumblr.mjs <api_key>');
  process.exit(1);
}

// Map from slug → [filename, ...] to detect ±1 day timezone duplicates
const existingSlugs = new Map();
for (const f of readdirSync(CONTENT_DIR)) {
  const name = f.replace(/\.(md|mdx)$/, '');
  const slug = name.slice(11); // strip YYYY-MM-DD-
  if (!existingSlugs.has(slug)) existingSlugs.set(slug, []);
  existingSlugs.get(slug).push(name);
}
const existing = new Set([...existingSlugs.values()].flat());

async function apiFetch(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.tumblr.com/v2/blog/${BLOG}/${path}${sep}api_key=${API_KEY}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  const data = await res.json();
  return data.response;
}

async function downloadImage(url) {
  const filename = basename(new URL(url).pathname);
  const dest = join(IMAGES_DIR, filename);
  if (existsSync(dest)) return `/tumblr_files/${filename}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return `/tumblr_files/${filename}`;
  } catch {
    return url;
  }
}

function decodeEntities(s) {
  return s
    .replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;|&#8216;/g, '‘')
    .replace(/&rdquo;|&#8221;/g, '”').replace(/&ldquo;|&#8220;/g, '“')
    .replace(/&mdash;|&#8212;/g, '—').replace(/&ndash;|&#8211;/g, '–')
    .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60).replace(/-$/, '');
}

function yamlStr(s) {
  if (!s) return '""';
  // JSON.stringify produces a valid YAML double-quoted string (same escape rules)
  if (/[:#\[\]{}&*!|>'"@`]/.test(s) || s.includes('\n') || s.includes('"')) return JSON.stringify(s);
  return s;
}

async function convertPost(post) {
  const date = post.date.split(' ')[0];
  const tags = post.tags || [];
  let title = '', body = '', slug = post.slug || '';

  switch (post.type) {
    case 'text': {
      title = post.title || '';
      body = post.body || '';
      if (!slug) slug = title ? slugify(title) : `post-${post.id}`;
      break;
    }
    case 'photo': {
      const photos = await Promise.all((post.photos || []).map(async p => {
        const local = await downloadImage(p.original_size.url);
        const alt = p.caption ? stripHtml(p.caption) : '';
        return `![${alt}](${local})`;
      }));
      const caption = post.caption ? '\n\n' + post.caption : '';
      body = photos.join('\n\n') + caption;
      const firstCapLine = post.caption ? stripHtml(post.caption).split('\n').find(l => l.trim()) || '' : '';
      title = firstCapLine.slice(0, 80) || 'Photos';
      if (!slug) slug = firstCapLine ? slugify(firstCapLine) : `photos-${post.id}`;
      break;
    }
    case 'audio': {
      const caption = post.caption || '';
      title = post.track_name
        ? `${post.artist ? post.artist + ' — ' : ''}${post.track_name}`
        : (caption ? stripHtml(caption).split('\n')[0].slice(0, 80) : 'Audio');
      const embed = post.embed || '';
      body = (embed ? embed + '\n\n' : '') + caption;
      if (!slug) slug = title !== 'Audio' ? slugify(title) : `audio-${post.id}`;
      break;
    }
    case 'video': {
      const caption = post.caption || '';
      title = caption ? stripHtml(caption).split('\n').find(l => l.trim())?.slice(0, 80) || 'Video' : 'Video';
      const player = Array.isArray(post.player)
        ? (post.player.at(-1)?.embed_code || '')
        : (post.player || '');
      body = (player ? player + '\n\n' : '') + caption;
      if (!slug) slug = title !== 'Video' ? slugify(title) : `video-${post.id}`;
      break;
    }
    case 'quote': {
      const text = post.text || '';
      title = stripHtml(text).slice(0, 60);
      body = `> ${text}\n\n— ${post.source || ''}`;
      if (!slug) slug = slugify(title) || `quote-${post.id}`;
      break;
    }
    case 'link': {
      title = post.title || post.url;
      body = `[${post.title || post.url}](${post.url})\n\n${post.description || ''}`;
      if (!slug) slug = title ? slugify(title) : `link-${post.id}`;
      break;
    }
    case 'answer': {
      title = (post.question || 'Q&A').slice(0, 60);
      body = `**Q:** ${post.question}\n\n**A:** ${post.answer}`;
      if (!slug) slug = slugify(title) || `answer-${post.id}`;
      break;
    }
    default:
      return null;
  }

  title = decodeEntities(title);
  const filename = `${date}-${slug}`;
  const tagsYaml = tags.length > 0 ? `\ntags:\n${tags.map(t => `  - ${yamlStr(t)}`).join('\n')}` : '';
  const frontmatter = `---\ntitle: ${yamlStr(title)}\ndate: '${date}'${tagsYaml}\n---\n`;

  return { filename, content: frontmatter + '\n' + body.trimStart() };
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });

  const info = await apiFetch('info');
  const total = info.blog.posts;
  console.log(`Fetching ${total} posts from ${BLOG}…\n`);

  let imported = 0, skipped = 0, dupes = 0, errors = 0;

  for (let offset = 0; offset < total; offset += 20) {
    const { posts } = await apiFetch(`posts?limit=20&offset=${offset}&reblog_info=true`);

    for (const post of posts) {
      if (post.reblogged_from_name) { skipped++; continue; }

      try {
        const result = await convertPost(post);
        if (!result) { skipped++; continue; }

        const slug = result.filename.slice(11);
        if (existing.has(result.filename) || existingSlugs.has(slug)) {
          process.stdout.write(`  skip  ${result.filename}\n`);
          dupes++;
          continue;
        }

        writeFileSync(join(CONTENT_DIR, `${result.filename}.md`), result.content);
        existing.add(result.filename);
        process.stdout.write(`  ✓     ${result.filename}\n`);
        imported++;
      } catch (err) {
        process.stdout.write(`  ✗     post ${post.id} (${post.type}): ${err.message}\n`);
        errors++;
      }
    }

    if (offset + 20 < total) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nDone: ${imported} imported, ${dupes} already existed, ${skipped} reblogs skipped, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
