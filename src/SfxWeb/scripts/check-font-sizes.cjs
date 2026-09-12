const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../src');
const fix = process.argv.includes('--fix');
const violations = [];
let changed = 0;

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'mif' || entry.name === 'assets') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!/\.(scss|css|html|ts)$/.test(entry.name) || /\.spec\.ts$/.test(entry.name)) continue;
    const source = fs.readFileSync(file, 'utf8');
    // Covers owned declarations, custom/Sass size tokens, TS chart options and font shorthands.
    const pattern = /((?:font-size|fontSize|--font-size-[\w-]+|\$[\w-]*font-size)\s*:\s*['"]?|\bfont\s*:\s*(?:(?:normal|italic|bold|[1-9]00)\s+)*)(\d*\.?\d+)(px|pt|rem|em|%)/g;
    let updated = source.replace(pattern, (match, prefix, value, unit, offset) => {
      const selector = source.slice(0, offset).match(/([^{}]+)\{[^{}]*$/)?.[1]?.trim();
      // These two declarations size glyphs, not text.
      if (path.relative(root, file).replace(/\\/g, '/') === 'styles.scss' && ['.sort-icon', '.filter-icon'].includes(selector)) return match;
      const pixels = Number(value) * (unit === 'pt' ? 4 / 3 : unit === 'rem' || unit === 'em' ? 16 : unit === '%' ? 0.15 : 1);
      if (pixels >= 15) return match;
      violations.push(`${path.relative(root, file)}:${source.slice(0, offset).split('\n').length}: ${match}`);
      return fix ? `${prefix}15px` : match;
    });
    if (fix) {
      updated = updated
        .replace(/'Segoe UI',\s*sans-serif/g, 'var(--font-family-ui)')
        .replace(/Consolas,\s*monospace/g, 'var(--font-family-mono)')
        .replace(/font-family:\s*monospace/g, 'font-family: var(--font-family-mono)');
    }
    if (fix && /font(?:-size)?\s*:\s*15px/.test(updated)) updated = updated.replace(/\r\n/g, '\n');
    if (fix && updated !== source) { fs.writeFileSync(file, updated); changed++; }
  }
}

visit(root);
if (fix) {
  console.log(`Raised ${violations.length} undersized font declarations in ${changed} files to 15px.`);
} else if (violations.length) {
  console.error('Text must be at least 15px (11.25pt).\n' + violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Font-size check passed: no owned literal text sizes below 15px.');
}
