import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migratePost } from './migrate-posts.mjs';

test('removes layout from frontmatter', () => {
  const input = `---
layout: post
title: Test Post
date: '2008-05-08T09:02:21-07:00'
tags: []
---
Content.`;
  assert.doesNotMatch(migratePost(input), /^layout:/m);
});

test('merges categories and tags', () => {
  const input = `---
layout: post
title: Test Post
date: '2008-05-08T09:02:21-07:00'
categories:
- bicycles
- photography
tags:
- webdev
---
Content.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /^categories:/m);
  assert.doesNotMatch(result, /^category:/m);
  assert.match(result, /bicycles/);
  assert.match(result, /photography/);
  assert.match(result, /webdev/);
});

test('handles singular category: field', () => {
  const input = `---
layout: post
title: Test
date: '2006-02-10T22:00:00-08:00'
category:
tags:
---
Content.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /^category:/m);
  assert.doesNotMatch(result, /^categories:/m);
});

test('normalizes date to YYYY-MM-DD', () => {
  const input = `---
layout: post
title: Test
date: '2008-05-08T09:02:21-07:00'
---
Content.`;
  assert.match(migratePost(input), /date: '2008-05-08'/);
});

test('removes <!--more--> from body', () => {
  const input = `---
layout: post
title: Test
date: '2008-05-08T09:02:21-07:00'
---
First paragraph.<!--more-->
Second paragraph.`;
  const result = migratePost(input);
  assert.doesNotMatch(result, /<!--more-->/);
  assert.match(result, /First paragraph\./);
  assert.match(result, /Second paragraph\./);
});
