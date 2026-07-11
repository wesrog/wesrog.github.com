const ENTITIES = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&hellip;': '\u2026',
  '&amp;': '&',
};

export function decodeEntities(str) {
  let result = str;
  for (const [entity, char] of Object.entries(ENTITIES)) {
    result = result.split(entity).join(char);
  }
  return result;
}

export function stripHtml(html) {
  return decodeEntities((html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function postToEntry(post) {
  const date = post.date.slice(0, 10);
  const time = post.date.slice(11, 16);
  const images = post.images || [];
  let text = '';

  if (post.type === 'Photo') {
    text = stripHtml(post.caption);
  } else if (post.type === 'Regular') {
    const title = stripHtml(post.title);
    const body = stripHtml(post.body);
    text = title ? `**${title}**\n\n${body}` : body;
  } else if (post.type === 'Quote') {
    const quote = stripHtml(post.quoteText);
    const source = stripHtml(post.quoteSource);
    text = source ? `"${quote}" — ${source}` : `"${quote}"`;
  }

  return { date, time, text, images };
}

export function entriesFromPosts(posts) {
  return posts
    .map(postToEntry)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function groupByDay(entries) {
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }
  return groups;
}

export function escapeMdxText(text) {
  return text.replace(/</g, '&lt;').replace(/[{}]/g, (c) => `\\${c}`);
}

export function assignImageVars(entries) {
  const varForFile = new Map();
  let n = 0;
  for (const entry of entries) {
    for (const file of entry.images) {
      if (!varForFile.has(file)) {
        n += 1;
        varForFile.set(file, `img${n}`);
      }
    }
  }
  return varForFile;
}

export function renderEntryMdx(entry, varForFile) {
  const timeAttr = entry.time ? ` time="${entry.time}"` : '';
  const imageVars = entry.images.map((f) => varForFile.get(f));
  const imagesAttr = imageVars.length > 0 ? ` images={[${imageVars.join(', ')}]}` : '';
  const text = escapeMdxText(entry.text);
  const body = text ? `\n      ${text}\n    ` : '';
  return `    <Entry${timeAttr}${imagesAttr}>${body}</Entry>`;
}

export function renderDayMdx(group, varForFile) {
  const entryLines = group.entries.map((e) => renderEntryMdx(e, varForFile)).join('\n');
  return `  <Day date="${group.date}">\n${entryLines}\n  </Day>`;
}

export function buildMdxBody(posts) {
  const entries = entriesFromPosts(posts);
  const groups = groupByDay(entries);
  const varForFile = assignImageVars(entries);

  const imageImports = [...varForFile.entries()]
    .map(([file, varName]) => `import ${varName} from './${file}';`)
    .join('\n');

  const dayBlocks = groups.map((g) => renderDayMdx(g, varForFile)).join('\n');

  return `import Travelogue from '../../../components/Travelogue.astro';
import Day from '../../../components/Day.astro';
import Entry from '../../../components/Entry.astro';
${imageImports}

<Travelogue>
${dayBlocks}
</Travelogue>
`;
}
