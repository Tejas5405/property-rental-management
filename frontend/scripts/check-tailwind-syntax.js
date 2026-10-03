/**
 * Regression guard: Tailwind v4 syntax must not re-enter this project.
 *
 * This project runs Tailwind v3 (see devDependencies). A few shadcn
 * "base-nova" components were generated with Tailwind v4 syntax, which v3
 * cannot compile:
 *
 *   - `util-(--var)` is the v4 CSS-variable shorthand. v3 emits no rule for
 *     it at all, so the utility silently does nothing.
 *   - `--spacing(N)` is a v4 theme function. v3 passes it through verbatim,
 *     emitting `--var: var(--spacing(4))`, which is invalid CSS (var() cannot
 *     wrap a function call) and is dropped by browsers.
 *
 * The v3 equivalents are `util-[var(--var)]` and a literal value such as
 * `1rem`. This script fails if the v4 forms reappear.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];
const SCAN_EXT = /\.(tsx?|jsx?)$/;

// util-(--var): a utility directly followed by a parenthesised custom property.
const V4_SHORTHAND =
  /(?<![\w-[])(?:gap|row-gap|column-gap|py|px|p|pt|pb|pl|pr|mx|my|m|mt|mb|ml|mr|w|h|max-h|min-h|min-w|max-w|bg|text|border|outline|origin|translate|fill|stroke)-\((--[a-z0-9-]+)\)/g;
// --spacing(N): the v4 theme function.
const V4_THEME_FN = /--spacing\(\d+\)/g;

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (SCAN_EXT.test(entry.name)) acc.push(full);
  }
  return acc;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d), []));
const violations = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    for (const re of [V4_SHORTHAND, V4_THEME_FN]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        violations.push({
          file: path.relative(ROOT, file),
          line: i + 1,
          match: m[0],
        });
      }
    }
  });
}

if (violations.length) {
  console.error('Tailwind v4 syntax found in a Tailwind v3 project.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.match}`);
  }
  console.error(
    '\nUse the Tailwind v3 forms instead:\n' +
      '  util-(--var)        ->  util-[var(--var)]\n' +
      '  --spacing(4)        ->  1rem   (v3 spacing scale = N * 0.25rem)\n'
  );
  process.exit(1);
}

console.log(`check:tailwind-syntax OK — scanned ${files.length} files, no Tailwind v4 syntax.`);
