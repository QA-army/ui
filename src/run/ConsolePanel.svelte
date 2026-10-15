<script lang="ts">
  import type { BrowserDebuggerRecord } from './model';
  import { consoleFilters, consoleOffset, filterConsoleRecords, projectConsoleRecords, type ConsoleFilter } from './console-evidence';
  let { records }: { records: readonly BrowserDebuggerRecord[] } = $props();
  let severity = $state<ConsoleFilter>('All');
  let query = $state('');
  let page = $state(0);
  const pageSize = 100;
  let rows = $derived(projectConsoleRecords(records));
  let filtered = $derived(filterConsoleRecords(rows, severity, query));
  let currentPage = $derived(Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)));
  let visible = $derived(filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize));
</script>

<section class="console-panel" aria-label="Console logs">
  <div class="console-panel__toolbar">
    <!-- Severity filters match the evidence tabs: gray track, selected label on a white square. -->
    <div class="console-panel__filters" role="group" aria-label="Console severity">
      {#each consoleFilters as level (level)}<button aria-pressed={severity === level} onclick={() => { severity = level; page = 0; }}>{level}</button>{/each}
    </div>
    <input type="search" aria-label="Filter console logs" placeholder="Filter console…" value={query} oninput={event => { query = event.currentTarget.value; page = 0; }} />
  </div>
  <div class="console-panel__summary"><span>{filtered.length} of {rows.length} logs</span><span>Time: elapsed capture</span></div>
  {#if !rows.length}<p class="console-panel__empty" role="status">No console logs were captured.</p>
  {:else if !filtered.length}<p class="console-panel__empty" role="status">No console logs match the current filter.</p>
  {:else}
    <!-- Keyboard users must be able to scroll long console output. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="console-panel__scroll" role="region" aria-label="Captured console output" tabindex="0">
      <ol>
        {#each visible as row (row.id)}
          <li class={{ error: row.level === 'Error', warning: row.level === 'Warning' }}>
            <time datetime={row.record.observedAt} title={row.record.observedAt}>{consoleOffset(row.record.monotonicMs)}</time>
            <span class="console-panel__level">{row.level}</span>
            <div class="console-panel__content"><pre>{row.message ?? 'Message not reported'}</pre>{#if row.source}<span class="console-panel__source">{row.source}</span>{/if}</div>
          </li>
        {/each}
      </ol>
    </div>
    {#if filtered.length > pageSize}<nav class="console-panel__pagination" aria-label="Console log pages"><button disabled={currentPage === 0} onclick={() => { page = currentPage - 1; }}>Previous</button><span>Page {currentPage + 1} of {Math.ceil(filtered.length / pageSize)}</span><button disabled={(currentPage + 1) * pageSize >= filtered.length} onclick={() => { page = currentPage + 1; }}>Next</button></nav>{/if}
  {/if}
</section>

<style>
  .console-panel { color: var(--text); }
  .console-panel__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 0 10px; }
  .console-panel__filters { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 4px; background: color-mix(in srgb, var(--line-soft) 72%, var(--paper)); }
  .console-panel button, .console-panel input { border: 1px solid var(--line-soft); border-radius: 0; background: var(--surface); color: var(--text); font: 12px var(--font-body); min-height: 34px; }
  .console-panel button { padding: 6px 10px; cursor: pointer; }
  .console-panel button:disabled { opacity: .5; cursor: default; }
  .console-panel__filters button,
  .console-panel__filters button:hover,
  .console-panel__filters button:active { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: transparent; color: var(--muted); font: 500 13px var(--font-body); min-height: 28px; padding: 6px 12px; }
  .console-panel__filters button[aria-pressed='true'],
  .console-panel__filters button[aria-pressed='true']:hover { background: var(--surface-raised); color: var(--ink); font-weight: 700; }
  .console-panel input { flex: 0 0 auto; width: 220px; max-width: 100%; min-width: 0; padding: 9px 11px; }
  .console-panel__summary { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; color: var(--muted); font: 10px var(--font-mono); }
  .console-panel p { color: var(--muted); font-size: 12px; }
  .console-panel__empty { display: grid; place-items: center; min-height: 180px; margin: 0; padding: 24px; border-top: 1px solid var(--line-soft); text-align: center; }
  .console-panel__scroll { max-height: 60dvh; overflow: auto; border: 1px solid var(--line-soft); }
  .console-panel ol { list-style: none; margin: 0; padding: 0; }
  .console-panel li { display: grid; grid-template-columns: 72px 80px minmax(0, 1fr); align-items: start; gap: 10px; padding: 9px 10px; border-bottom: 1px solid var(--line-soft); font: 11px / 1.6 var(--font-mono); }
  .console-panel li:last-child { border-bottom: 0; }
  .console-panel li:nth-child(even) { background: var(--paper-soft); }
  .console-panel time, .console-panel__source { color: var(--muted); }
  .console-panel__level { overflow-wrap: anywhere; }
  .console-panel .error .console-panel__level { color: var(--danger); font-weight: 700; }
  .console-panel .warning .console-panel__level { color: #936000; font-weight: 700; }
  :global(:root[data-theme="dark"]) .console-panel .warning .console-panel__level { color: #f2c166; }
  .console-panel pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
  .console-panel__source { display: block; margin-top: 3px; overflow-wrap: anywhere; }
  .console-panel__pagination { display: flex; justify-content: flex-end; align-items: center; gap: 10px; padding-top: 10px; font: 11px var(--font-mono); }
  @media (max-width: 760px) {
    .console-panel button, .console-panel input { min-height: 44px; }
    .console-panel input { width: 100%; }
    .console-panel__filters { flex-basis: 100%; }
    .console-panel__filters button { min-height: 44px; }
    .console-panel li { grid-template-columns: 68px minmax(0, 1fr); }
    .console-panel__content { grid-column: 1 / -1; }
  }
</style>
