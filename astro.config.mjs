import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinks } from './src/lib/externalLinks.mjs';

export default defineConfig({
  site: 'https://wesrog.github.io/',
  integrations: [mdx()],
  markdown: {
    processor: satteri({ hastPlugins: [externalLinks] }),
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
