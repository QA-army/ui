import type { BrowserDebuggerRecord } from './model';

export const consoleFilters = ['All', 'Error', 'Warning', 'Info', 'Log', 'Debug'] as const;
export type ConsoleFilter = typeof consoleFilters[number];
export interface ConsoleRow {
  readonly id: string;
  readonly level: string;
  readonly message: string | null;
  readonly source: string | null;
  readonly record: BrowserDebuggerRecord;
}
const text = (value: unknown) => typeof value === 'string' ? value : null;

export function projectConsoleRecords(records: readonly BrowserDebuggerRecord[]): readonly ConsoleRow[] {
  return [...records].sort((a, b) => a.sequence - b.sequence).map((record, index) => {
    const captured = (text(record.payload.level) || text(record.payload.type))?.trim().toLowerCase();
    const level = captured === 'warn' || captured === 'warning' ? 'Warning'
      : captured === 'error' ? 'Error' : captured === 'info' ? 'Info'
      : captured === 'log' ? 'Log' : captured === 'debug' ? 'Debug' : captured || 'Not reported';
    return { id: `${record.pageId}:${record.sequence}:${index}`, level,
      message: text(record.payload.text) ?? text(record.payload.message), source: text(record.payload.source), record };
  });
}

export function filterConsoleRecords(rows: readonly ConsoleRow[], level: ConsoleFilter, query: string): readonly ConsoleRow[] {
  const search = query.trim().toLowerCase();
  return rows.filter(row => (level === 'All' || row.level === level)
    && (!search || `${row.message ?? ''}\n${row.source ?? ''}`.toLowerCase().includes(search)));
}

export function copyConsoleRecords(rows: readonly ConsoleRow[]): string {
  // Export original captured evidence, preserving fields and existing redactions.
  return JSON.stringify(rows.map(row => row.record), null, 2);
}

export function consoleOffset(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return 'Not reported';
  const ms = Math.floor(milliseconds);
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}
