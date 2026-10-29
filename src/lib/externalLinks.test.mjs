import { test } from 'node:test';
import assert from 'node:assert/strict';
import { externalLinks, isExternal } from './externalLinks.mjs';

test('detects external links', () => {
  assert.equal(isExternal('https://discogs.com/'), true);
  assert.equal(isExternal('//example.com/x'), true);
  assert.equal(isExternal('https://wesrog.github.io/about'), false);
  assert.equal(isExternal('/blog/foo'), false);
  assert.equal(isExternal('#top'), false);
  assert.equal(isExternal('mailto:a@b.c'), false);
});

test('sets target and rel on external anchors only', () => {
  const set = [];
  const ctx = { setProperty: (node, key, value) => set.push([node.properties.href, key, value]) };
  externalLinks.element.visit({ properties: { href: 'https://discogs.com' } }, ctx);
  externalLinks.element.visit({ properties: { href: '/about' } }, ctx);
  assert.deepEqual(set, [
    ['https://discogs.com', 'target', '_blank'],
    ['https://discogs.com', 'rel', ['noopener', 'noreferrer']],
  ]);
});
