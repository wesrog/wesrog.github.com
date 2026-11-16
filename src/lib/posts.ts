import { getCollection } from 'astro:content';

export const postSlug = (id: string) => id.replace(/\/index$/, '');

/** Published posts shown in the main feed (status updates live under /tags/status/), newest first. */
export async function getFeedPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft && !data.tags.includes('status')))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
