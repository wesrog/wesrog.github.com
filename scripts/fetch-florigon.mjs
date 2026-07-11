import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STAGING_DIR = join(__dirname, 'florigon-staging');
const IMAGES_DIR = join(STAGING_DIR, 'images');
const BLOG = 'florigon.tumblr.com';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function toLocalDateTime(unixTimestamp) {
  const d = new Date(Number(unixTimestamp) * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

async function fetchAllPosts() {
  const posts = [];
  let start = 0;
  const num = 50;
  while (true) {
    const url = `https://${BLOG}/api/read?type=&num=${num}&start=${start}`;
    const res = await fetch(url);
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const postsNode = parsed.tumblr.posts;
    const total = Number(postsNode['@_total']);
    let batch = postsNode.post;
    if (!batch) batch = [];
    if (!Array.isArray(batch)) batch = [batch];
    posts.push(...batch);
    console.log(`fetched ${posts.length}/${total}`);
    start += num;
    if (start >= total || batch.length === 0) break;
  }
  return posts;
}

function toArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });
  const posts = await fetchAllPosts();
  const summary = [];

  for (const post of posts) {
    const id = post['@_id'];
    const type = post['@_type'];
    const date = toLocalDateTime(post['@_unix-timestamp']);
    const slug = post['@_slug'] || id;
    const url = post['@_url'];

    const entry = { id, type, date, slug, url, images: [] };

    if (type === 'Photo') {
      entry.caption = post['photo-caption'] || '';
      const photos = toArray(post.photoset?.photo);
      const photoUrls = [];
      if (photos.length > 0) {
        for (const p of photos) {
          const urls = toArray(p['photo-url']);
          const best = urls.find((u) => Number(u['@_max-width']) === 1280) || urls[0];
          if (best) photoUrls.push(best['#text']);
        }
      } else {
        const urls = toArray(post['photo-url']);
        const best = urls.find((u) => Number(u['@_max-width']) === 1280) || urls[0];
        if (best) photoUrls.push(best['#text']);
      }
      let i = 0;
      for (const pUrl of photoUrls) {
        i += 1;
        const ext = extname(new URL(pUrl).pathname) || '.jpg';
        const filename = `${date.slice(0, 10)}-${slug}-${i}${ext}`;
        const destPath = join(IMAGES_DIR, filename);
        try {
          await downloadImage(pUrl, destPath);
          entry.images.push(filename);
        } catch (e) {
          console.error(`failed to download ${pUrl}: ${e.message}`);
        }
      }
    } else if (type === 'Regular') {
      entry.title = post['regular-title'] || '';
      entry.body = post['regular-body'] || '';
    } else if (type === 'Quote') {
      entry.quoteText = post.quote || post['quote-text'] || '';
      entry.quoteSource = post.source || post['quote-source'] || '';
    } else {
      entry.raw = post;
    }

    summary.push(entry);
    console.log(`processed ${type} ${id} (${entry.images.length} images)`);
  }

  writeFileSync(join(STAGING_DIR, 'posts.json'), JSON.stringify(summary, null, 2));
  console.log(`\nDone. ${summary.length} posts, images in ${IMAGES_DIR}`);
}

main();
