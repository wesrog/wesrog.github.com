#!/usr/bin/env node
// Migrates flat content posts to per-post directories with co-located images.
// Usage: node scripts/migrate-to-colocation.mjs [--dry-run]
//
// What it does per post:
//  1. Reads the .md/.mdx file
//  2. Finds all absolute-path local image references (not audio)
//  3. Creates src/content/<collection>/<slug>/ directory
//  4. Copies each image from public/ into the new directory
//  5. Rewrites absolute paths to relative in the content
//  6. For .mdx: updates component import depth (../../ → ../ ../)
//  7. Writes content to <slug>/index.<ext>
//  8. Deletes the original file

import { readdir, readFile, writeFile, mkdir, copyFile, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('[DRY RUN] No files will be written or deleted.\n');

// All local path prefixes that live under public/ and should be co-located
const LOCAL_PATH_PREFIXES = [
  '/tumblr_files/',
  '/assets/',       // images only — audio stays in public/
  '/emusic_tags.png',
  '/lastfmtagger/',
];

// Audio extensions — keep in public/, don't move
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.flac']);

function isLocalImagePath(src) {
  const lsrc = src.toLowerCase();
  const ext = lsrc.slice(lsrc.lastIndexOf('.'));
  if (AUDIO_EXTS.has(ext)) return false;
  return LOCAL_PATH_PREFIXES.some(prefix => src.startsWith(prefix));
}

// Extract all local image paths from markdown/MDX content
function extractLocalImagePaths(content) {
  const paths = new Set();

  // Markdown images: ![alt](/path)
  for (const m of content.matchAll(/!\[[^\]]*\]\((\/?[^)]+)\)/g)) {
    const src = m[1];
    if (isLocalImagePath(src)) paths.add(src);
  }

  // HTML img tags: <img src="/path"
  for (const m of content.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const src = m[1];
    if (isLocalImagePath(src)) paths.add(src);
  }

  return [...paths];
}

function rewritePaths(content, imagePaths) {
  let updated = content;
  for (const absPath of imagePaths) {
    const filename = basename(absPath);
    // Replace both quoted and unquoted occurrences
    updated = updated.replaceAll(absPath, `./${filename}`);
  }
  return updated;
}

function rewriteMdxImportDepth(content) {
  // ../../components/ → ../../../components/  (one level deeper due to new subdir)
  return content.replaceAll("'../../components/", "'../../../components/");
}

async function migrateCollection(collectionPath) {
  const entries = await readdir(collectionPath);
  const postFiles = entries.filter(f => /\.(md|mdx)$/.test(f));

  console.log(`\nMigrating ${postFiles.length} posts in ${collectionPath}`);

  let moved = 0, skipped = 0, assetsTotal = 0;
  const movedPublicPaths = new Set();

  for (const filename of postFiles) {
    const ext = extname(filename);
    const slug = filename.slice(0, -ext.length);
    const srcFile = join(collectionPath, filename);
    const destDir = join(collectionPath, slug);
    const destFile = join(destDir, `index${ext}`);

    let content = await readFile(srcFile, 'utf8');
    const imagePaths = extractLocalImagePaths(content);

    // Check all referenced images exist in public/
    const missingAssets = imagePaths.filter(p => !existsSync(join(PUBLIC, p)));
    if (missingAssets.length > 0) {
      console.warn(`  WARN ${slug}: missing public assets: ${missingAssets.join(', ')}`);
    }

    const availableAssets = imagePaths.filter(p => existsSync(join(PUBLIC, p)));

    if (DRY_RUN) {
      console.log(`  [dry] ${slug}/`);
      for (const p of availableAssets) {
        console.log(`    copy public${p} → ${slug}/${basename(p)}`);
      }
      if (ext === '.mdx') console.log(`    rewrite MDX import depth`);
      skipped++;
      continue;
    }

    // Create dest directory
    await mkdir(destDir, { recursive: true });

    // Copy images
    for (const absPath of availableAssets) {
      const srcAsset = join(PUBLIC, absPath);
      const destAsset = join(destDir, basename(absPath));
      await copyFile(srcAsset, destAsset);
      movedPublicPaths.add(absPath);
      assetsTotal++;
    }

    // Rewrite content
    content = rewritePaths(content, availableAssets);
    if (ext === '.mdx') {
      content = rewriteMdxImportDepth(content);
    }

    await writeFile(destFile, content, 'utf8');
    await unlink(srcFile);
    moved++;
  }

  console.log(`  Done: ${moved} posts moved, ${assetsTotal} assets co-located, ${skipped} skipped (dry-run).`);
  return { moved, assetsTotal, movedPublicPaths };
}

async function cleanupPublicDirs(allMovedAssets) {
  // Remove directories from public/ that should now be empty
  const toClean = ['tumblr_files', 'lastfmtagger', 'emusic_tags.png'];
  for (const name of toClean) {
    const target = join(PUBLIC, name);
    if (existsSync(target)) {
      if (DRY_RUN) {
        console.log(`[dry] Would remove public/${name}`);
      } else {
        await rm(target, { recursive: true, force: true });
        console.log(`Removed public/${name}`);
      }
    }
  }

  // Only remove image files from public/assets/ that were actually co-located
  const assetsDir = join(PUBLIC, 'assets');
  if (existsSync(assetsDir)) {
    const assetFiles = await readdir(assetsDir);
    for (const f of assetFiles) {
      const absPath = `/assets/${f}`;
      if (allMovedAssets.has(absPath)) {
        const target = join(assetsDir, f);
        if (DRY_RUN) {
          console.log(`[dry] Would remove public/assets/${f}`);
        } else {
          await unlink(target);
          console.log(`Removed public/assets/${f}`);
        }
      }
    }
  }
}

// Main
const blogDir = join(ROOT, 'src/content/blog');
const privateDir = join(ROOT, 'src/content/private');

const { movedPublicPaths: blogMoved } = await migrateCollection(blogDir);
const { movedPublicPaths: privateMoved } = await migrateCollection(privateDir);
const allMovedAssets = new Set([...blogMoved, ...privateMoved]);

console.log('\nCleaning up public/ directories...');
await cleanupPublicDirs(allMovedAssets);

console.log('\nMigration complete.');
if (!DRY_RUN) {
  console.log('Run `npm run build` to verify.');
}
