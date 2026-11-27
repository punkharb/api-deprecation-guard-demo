// Runs the real oasdiff on every scenario and saves the results to docs/data.js,
// so docs/index.html can show them in a browser with nothing installed.
// Usage: node build.ts
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { analyze } from './impact/analyze.ts';

const goBin = join(homedir(), 'go', 'bin', 'oasdiff.exe');
const oasdiff = process.env.OASDIFF ?? (existsSync(goBin) ? goBin : 'oasdiff');
const specs = new URL('./specs/', import.meta.url);
const run = (...args: string[]) => {
  const r = spawnSync(oasdiff, args, { cwd: specs, encoding: 'utf8' });
  if (r.error) throw r.error;
  return r;
};

const { usage } = JSON.parse(readFileSync(new URL('./impact/usage.json', import.meta.url), 'utf8'));
const version = run('--version').stdout.trim();

const scenarios = ['1-remove', '2-deprecate', '3-rename'].map(name => {
  const file = `${name}.yaml`;
  const prFails = run('breaking', 'base.yaml', file, '-o', 'ERR').status !== 0;
  const changes = JSON.parse(run('changelog', 'base.yaml', file, '-f', 'json').stdout || '[]');
  return { file, prFails, changes, impact: analyze(changes, usage) };
});

const data = { version, builtAt: new Date().toISOString().slice(0, 10), usage, scenarios };
writeFileSync(new URL('./docs/data.js', import.meta.url), `window.DEMO = ${JSON.stringify(data, null, 2)};\n`);
console.log(`docs/data.js written (${version}, ${scenarios.length} scenarios)`);
