import { writeFileSync } from 'node:fs';

writeFileSync(
  'docs/_config.yml',
  ['theme: null', 'plugins: []', 'include:', '  - .nojekyll', ''].join('\n'),
);
writeFileSync('docs/.nojekyll', '');
