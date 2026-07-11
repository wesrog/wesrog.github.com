import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeEntities,
  stripHtml,
  postToEntry,
  entriesFromPosts,
  groupByDay,
  escapeMdxText,
  assignImageVars,
  renderEntryMdx,
  renderDayMdx,
  buildMdxBody,
} from './build-florigon-post.mjs';

test('decodeEntities decodes the entity set found in the florigon data', () => {
  assert.equal(
    decodeEntities('We&rsquo;ve seen &ldquo;a lot&rdquo; &amp; more&hellip;'),
    'We’ve seen “a lot” & more…'
  );
});

test('stripHtml removes tags and decodes entities', () => {
  assert.equal(stripHtml('<p>We&rsquo;re here.</p>'), 'We’re here.');
});

test('stripHtml collapses an anchor tag to its link text', () => {
  assert.equal(
    stripHtml('<p>See <a href="http://x.com/y">http://x.com/y</a></p>'),
    'See http://x.com/y'
  );
});

test('stripHtml returns empty string for empty input', () => {
  assert.equal(stripHtml(''), '');
});

test('postToEntry converts a Photo post', () => {
  const post = {
    type: 'Photo',
    date: '2010-02-11 02:26:00',
    images: ['2010-02-11-home-1.jpg'],
    caption: '<p>Home!</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-11',
    time: '02:26',
    text: 'Home!',
    images: ['2010-02-11-home-1.jpg'],
  });
});

test('postToEntry converts a Regular post with a title', () => {
  const post = {
    type: 'Regular',
    date: '2010-02-04 07:15:13',
    images: [],
    title: 'Made it',
    body: '<p>We made it to Albuquerque.</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-04',
    time: '07:15',
    text: '**Made it**\n\nWe made it to Albuquerque.',
    images: [],
  });
});

test('postToEntry converts a Regular post without a title', () => {
  const post = {
    type: 'Regular',
    date: '2010-02-01 13:05:39',
    images: [],
    title: '',
    body: '<p>Got up at 4:40 this morning.</p>',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-01',
    time: '13:05',
    text: 'Got up at 4:40 this morning.',
    images: [],
  });
});

test('postToEntry converts a Quote post with a source', () => {
  const post = {
    type: 'Quote',
    date: '2010-02-08 23:27:52',
    images: [],
    quoteText: 'Adventure is out there',
    quoteSource: 'Some movie',
  };
  assert.deepEqual(postToEntry(post), {
    date: '2010-02-08',
    time: '23:27',
    text: '"Adventure is out there" — Some movie',
    images: [],
  });
});

test('entriesFromPosts sorts entries chronologically regardless of input order', () => {
  const posts = [
    { type: 'Photo', date: '2010-02-02 09:00:00', images: [], caption: '' },
    { type: 'Photo', date: '2010-02-01 08:00:00', images: [], caption: '' },
    { type: 'Photo', date: '2010-02-01 20:00:00', images: [], caption: '' },
  ];
  const entries = entriesFromPosts(posts);
  assert.deepEqual(
    entries.map((e) => `${e.date} ${e.time}`),
    ['2010-02-01 08:00', '2010-02-01 20:00', '2010-02-02 09:00']
  );
});

test('groupByDay groups consecutive same-date entries', () => {
  const entries = [
    { date: '2010-02-01', time: '08:00', text: 'a', images: [] },
    { date: '2010-02-01', time: '20:00', text: 'b', images: [] },
    { date: '2010-02-02', time: '09:00', text: 'c', images: [] },
  ];
  const groups = groupByDay(entries);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].date, '2010-02-01');
  assert.equal(groups[0].entries.length, 2);
  assert.equal(groups[1].date, '2010-02-02');
  assert.equal(groups[1].entries.length, 1);
});

test('escapeMdxText escapes curly braces', () => {
  assert.equal(escapeMdxText('a {b} c'), 'a \\{b\\} c');
});

test('assignImageVars assigns sequential unique variable names, reusing repeats', () => {
  const entries = [
    { date: '2010-02-01', time: '08:00', text: '', images: ['a.jpg', 'b.jpg'] },
    { date: '2010-02-01', time: '09:00', text: '', images: ['a.jpg'] },
  ];
  const varForFile = assignImageVars(entries);
  assert.equal(varForFile.get('a.jpg'), 'img1');
  assert.equal(varForFile.get('b.jpg'), 'img2');
  assert.equal(varForFile.size, 2);
});

test('renderEntryMdx renders time, images, and text', () => {
  const entry = { date: '2010-02-01', time: '04:18', text: 'Leaving', images: ['a.jpg'] };
  const varForFile = new Map([['a.jpg', 'img1']]);
  const result = renderEntryMdx(entry, varForFile);
  assert.match(result, /<Entry time="04:18" images=\{\[img1\]\}>/);
  assert.match(result, /Leaving/);
});

test('renderEntryMdx omits time attribute when time is absent', () => {
  const entry = { date: '2010-02-01', time: '', text: 'Leaving', images: [] };
  const varForFile = new Map();
  const result = renderEntryMdx(entry, varForFile);
  assert.doesNotMatch(result, /time="/);
});

test('renderEntryMdx renders an empty entry with no children between tags', () => {
  const entry = { date: '2010-02-01', time: '04:18', text: '', images: [] };
  const varForFile = new Map();
  assert.equal(renderEntryMdx(entry, varForFile), '    <Entry time="04:18"></Entry>');
});

test('renderDayMdx wraps entries in a Day tag with the group date', () => {
  const group = {
    date: '2010-02-01',
    entries: [{ date: '2010-02-01', time: '04:18', text: 'Leaving', images: [] }],
  };
  const result = renderDayMdx(group, new Map());
  assert.match(result, /^ {2}<Day date="2010-02-01">/);
  assert.match(result, /<\/Day>$/);
  assert.match(result, /Leaving/);
});

test('buildMdxBody produces valid-looking MDX with imports and nested Day/Entry tags', () => {
  const posts = [
    {
      type: 'Photo',
      date: '2010-02-01 04:18:00',
      images: ['2010-02-01-a-1.jpg'],
      caption: '<p>Leaving</p>',
    },
  ];
  const result = buildMdxBody(posts);
  assert.match(result, /import Travelogue from '\.\.\/\.\.\/\.\.\/components\/Travelogue\.astro';/);
  assert.match(result, /import Day from '\.\.\/\.\.\/\.\.\/components\/Day\.astro';/);
  assert.match(result, /import Entry from '\.\.\/\.\.\/\.\.\/components\/Entry\.astro';/);
  assert.match(result, /import img1 from '\.\/2010-02-01-a-1\.jpg';/);
  assert.match(result, /<Travelogue>/);
  assert.match(result, /<Day date="2010-02-01">/);
  assert.match(result, /<Entry time="04:18" images=\{\[img1\]\}>/);
  assert.match(result, /Leaving/);
  assert.match(result, /<\/Travelogue>/);
});
