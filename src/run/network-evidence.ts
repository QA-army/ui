import type { BrowserDebuggerRecord } from './model';

export interface NetworkRequestRow {
  readonly id: string;
  readonly name: string;
  readonly timestamp: string;
  readonly url: string | null;
  readonly status: number | 'failed' | null;
  readonly method: string | null;
  readonly type: string | null;
  readonly initiator: string | null;
  readonly durationMs: number | null;
  readonly isStatic: boolean;
  readonly records: readonly BrowserDebuggerRecord[];
}
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value : null;
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

/** Correlate only captured IDs, never URLs: concurrent requests may share a URL. */
export function projectNetworkRequests(records: readonly BrowserDebuggerRecord[]): readonly NetworkRequestRow[] {
  const groups: { id: string; records: BrowserDebuggerRecord[] }[] = [];
  const active = new Map<string, typeof groups[number]>();
  for (const [index, record] of [...records].sort((a, b) => a.sequence - b.sequence).entries()) {
    if (record.kind !== 'network' && !record.kind.startsWith('network.')) continue;
    const key = record.requestId ? `${record.pageId}:${record.requestId}` : null;
    let group = key ? active.get(key) : undefined;
    if (!group || record.kind === 'network.request' && group.records.some(item => item.kind === 'network.request')) {
      group = { id: `${record.pageId}:${record.sequence}:${index}`, records: [] };
      groups.push(group);
      if (key) active.set(key, group);
    }
    group.records.push(record);
  }
  return groups.map(group => {
    const readText = (key: string) => group.records.map(record => text(record.payload[key])).find(value => value !== null) ?? null;
    const readNumber = (key: string) => [...group.records].reverse().map(record => number(record.payload[key])).find(value => value !== null) ?? null;
    const url = readText('url');
    let name = 'Unreported URL';
    if (url) {
      try { const parsed = new URL(url); name = parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname; }
      catch { name = url; }
    }
    const failed = group.records.some(record => record.kind === 'network.failed' || ['FAILED', 'TRANSPORT_FAILED'].includes(String(record.payload.outcome)));
    const statusCode = readNumber('status');
    const resource = readText('resource_type')?.toLowerCase();
    const mime = readText('mime_type');
    const isStatic = ['stylesheet', 'script', 'image', 'font', 'media'].includes(resource ?? '')
      || !['fetch', 'xhr', 'document'].includes(resource ?? '') && /^(image\/|font\/|audio\/|video\/|text\/css|(?:application|text)\/javascript)/i.test(mime ?? '');
    return { id: group.id, name, timestamp: group.records[0]!.observedAt, url,
      status: failed ? 'failed' : statusCode !== null && statusCode >= 100 && statusCode <= 599 ? statusCode : null,
      method: readText('method'), type: mime ?? readText('resource_type'), initiator: readText('initiator'),
      durationMs: readNumber('duration_ms'), isStatic, records: group.records };
  });
}

export function filterNetworkRequests(rows: readonly NetworkRequestRow[], query: string, showStatic: boolean) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => (showStatic || !row.isStatic) && (!search || row.url?.toLowerCase().includes(search)));
}

export function copyNetworkRequests(rows: readonly NetworkRequestRow[]): string {
  return JSON.stringify(rows.map(({ id: _id, isStatic: _static, records: _records, ...row }) => row), null, 2);
}

export function networkTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(11, 23) : 'Not reported';
}
