import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('docs/index.html', 'utf8');
if (!html.startsWith('---')) {
  writeFileSync('docs/index.html', `---\nlayout: null\n---\n${html}`);
}

writeFileSync(
  'docs/_config.yml',
  ['theme: null', 'plugins: []', 'include:', '  - .nojekyll', ''].join('\n'),
);
writeFileSync('docs/.nojekyll', '');
