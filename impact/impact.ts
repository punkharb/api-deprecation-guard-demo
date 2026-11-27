// Usage: node impact.ts <base.yaml> <revision.yaml>
// Runs oasdiff, then joins its changes with usage.json to say WHICH apps are hit.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { analyze } from './analyze.ts';

const [base, revision] = process.argv.slice(2);
if (!base || !revision) { console.error('usage: node impact.ts <base.yaml> <revision.yaml>'); process.exit(2); }

const goBin = join(homedir(), 'go', 'bin', 'oasdiff.exe');
const oasdiff = process.env.OASDIFF ?? (existsSync(goBin) ? goBin : 'oasdiff');

let changes;
try {
  changes = JSON.parse(execFileSync(oasdiff, ['changelog', base, revision, '-f', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) || '[]');
} catch (e: any) {
  console.error(`oasdiff failed: ${(e.stderr || e.message).toString().trim()}`);
  process.exit(1);
}
const { usage } = JSON.parse(readFileSync(new URL('./usage.json', import.meta.url), 'utf8'));
const r = analyze(changes, usage);

console.log('Consumer impact (oasdiff result x field usage):');
for (const h of r.broken) console.log(`  BREAKS  ${h.app}: ${h.reason}  -> notify this team`);
for (const h of r.warned) console.log(`  WARN    ${h.app}: ${h.reason}  -> send migration notice`);
console.log(`  safe    ${r.safe.join(', ') || '(none)'}  -> no notice sent`);
