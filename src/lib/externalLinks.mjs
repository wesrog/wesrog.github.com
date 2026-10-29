const SITE_HOSTS = new Set(['wesrog.github.io', 'www.wesrog.github.io']);

export function isExternal(href) {
  if (typeof href !== 'string') return false;
  if (!/^(https?:)?\/\//i.test(href)) return false;
  try {
    return !SITE_HOSTS.has(new URL(href, 'https://wesrog.github.io').hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Sätteri hast plugin: open links to other sites in a new tab.
export const externalLinks = {
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      if (!isExternal(node.properties?.href)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
    },
  },
};
