#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { argv, exit, stdout, stderr } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RULEBOOKS_DIR = join(ROOT, 'rulebooks');

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
};
const tty = stdout.isTTY && !process.env.NO_COLOR;
const paint = (col, s) => (tty ? `${C[col]}${s}${C.reset}` : s);

function listStacks() {
  if (!existsSync(RULEBOOKS_DIR)) return [];
  return readdirSync(RULEBOOKS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
    .sort();
}

function help() {
  const stacks = listStacks();
  const lines = [
    paint('bold', 'pandect') + ' — opinionated rulebooks for AI coding agents',
    '',
    paint('bold', 'Usage:'),
    '  npx pandect <stack>          download rulebook to ./RULEBOOK.md',
    '  npx pandect <stack> -o file  write to a custom path',
    '  npx pandect --list           list every available stack',
    '  npx pandect --help           show this help',
    '',
    paint('bold', `Available stacks (${stacks.length}):`),
  ];
  for (const s of stacks) lines.push('  ' + paint('cyan', s));
  lines.push('');
  lines.push(paint('dim', 'Hand the resulting RULEBOOK.md + your idea to Claude Code, Codex, or Cursor.'));
  lines.push(paint('dim', 'https://github.com/cleanmcp/pandect'));
  stdout.write(lines.join('\n') + '\n');
}

const args = argv.slice(2);

if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
  help();
  exit(0);
}

if (args[0] === '--list' || args[0] === 'list') {
  for (const s of listStacks()) stdout.write(s + '\n');
  exit(0);
}

if (args[0] === '--version' || args[0] === '-v') {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  stdout.write(pkg.version + '\n');
  exit(0);
}

const stack = args[0];
let outPath = 'RULEBOOK.md';
const oFlag = args.findIndex(a => a === '-o' || a === '--out');
if (oFlag !== -1 && args[oFlag + 1]) outPath = args[oFlag + 1];

const src = join(RULEBOOKS_DIR, `${stack}.md`);
if (!existsSync(src)) {
  stderr.write(paint('red', '✗ ') + `unknown stack: ${stack}\n`);
  const stacks = listStacks();
  const matches = stacks.filter(s => s.toLowerCase().includes(stack.toLowerCase()));
  if (matches.length) {
    stderr.write(paint('dim', '  did you mean: ') + matches.map(m => paint('cyan', m)).join(', ') + '\n');
  }
  stderr.write(paint('dim', '  run `npx pandect --list` to see all stacks.') + '\n');
  exit(1);
}

if (existsSync(outPath)) {
  stderr.write(paint('yellow', '! ') + `${outPath} exists — overwriting.\n`);
}

const content = readFileSync(src, 'utf8');
writeFileSync(outPath, content);
const lineCount = content.split('\n').length;
const sizeKB = Math.round(content.length / 1024);
stdout.write(paint('green', '✓ ') + `wrote ${paint('bold', outPath)} ${paint('dim', `(${stack}, ${lineCount} lines, ${sizeKB} KB)`)}\n`);
stdout.write(paint('dim', '  hand this file + your idea to Claude Code, Codex, or Cursor.') + '\n');
