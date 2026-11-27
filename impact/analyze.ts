export type Usage = { app: string; method: string; path: string; field: string };
export type Change = { id: string; text: string; level: number; operation?: string; path?: string };
export type Hit = { app: string; reason: string };

// oasdiff only puts the field name inside `text`, e.g. "removed the optional property `phone` ..."
// ponytail: regex on oasdiff's message text; breaks if oasdiff rewords it. Upgrade: `oasdiff diff -f json` (structured tree).
const firstTick = (s: string) => s.match(/`([^`]+)`/)?.[1];

export function analyze(changes: Change[], usage: Usage[]) {
  const broken: Hit[] = [];
  const warned: Hit[] = [];
  const add = (list: Hit[], app: string, reason: string) => {
    if (!list.some(h => h.app === app && h.reason === reason)) list.push({ app, reason });
  };

  for (const c of changes) {
    if (!c.operation || !c.path) continue; // e.g. api-version-changed
    const ep = `${c.operation} ${c.path}`;
    const callers = usage.filter(u => u.method === c.operation && u.path === c.path);

    if (c.id.includes('path-removed') || c.id.startsWith('api-removed')) {
      for (const u of callers) add(broken, u.app, `${ep} removed`);
    } else if (/^response-.*property-removed$/.test(c.id)) {
      const field = firstTick(c.text)?.split('/').pop(); // `items/total` -> total
      for (const u of callers.filter(u => u.field === field)) add(broken, u.app, `${ep} field '${field}' removed`);
    } else if (c.id.startsWith('response-') && c.level >= 3) {
      // any other oasdiff ERROR on a response field (type changed, etc.)
      const field = firstTick(c.text)?.split('/').pop();
      for (const u of callers.filter(u => u.field === field)) add(broken, u.app, `${ep} field '${field}' changed (${c.id})`);
    } else if (c.id.startsWith('endpoint-deprecated')) {
      const sunset = firstTick(c.text);
      for (const u of callers) add(warned, u.app, `${ep} deprecated${sunset ? `, sunset ${sunset}` : ''}`);
    }
  }

  const hit = new Set([...broken, ...warned].map(h => h.app));
  const safe = [...new Set(usage.map(u => u.app))].filter(a => !hit.has(a));
  return { broken, warned, safe };
}
