const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const files = fs.readdirSync(root).filter(name => /\.(html|js|css)$/.test(name));
const errors = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const references = [
    ...source.matchAll(/(?:href|src)=["']([^"'#]+)["']/g),
    ...source.matchAll(/from\s+["'](\.[^"']+)["']/g)
  ];
  for (const match of references) {
    if (/^(https?:|mailto:|tel:|data:)/.test(match[1])) continue;
    const target = match[1].split(/[?#]/)[0];
    if (!fs.existsSync(path.resolve(root, target))) {
      errors.push(`${file}: missing ${target}`);
    }
  }
  if (file.endsWith('.js')) {
    try {
      require('node:child_process').execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
    } catch {
      errors.push(`${file}: invalid JavaScript syntax`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} files: links and JavaScript syntax OK`);
}
