<script lang="ts">
  import { copyNetworkRequests, filterNetworkRequests, networkTimestamp, type NetworkRequestRow } from './network-evidence';
  let { rows }: { rows: readonly NetworkRequestRow[] } = $props();
  let query = $state('');
  let showStatic = $state(true);
  let expanded = $state<Record<string, boolean>>({});
  let page = $state(0);
  let copying = $state(false);
  let feedback = $state('');
  let copyFailed = $state(false);
  const pageSize = 100;
  let filtered = $derived(filterNetworkRequests(rows, query, showStatic));
  let currentPage = $derived(Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)));
  let visible = $derived(filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize));
  async function copy() {
    if (copying) return;
    copying = true; feedback = ''; copyFailed = false;
    const snapshot = filtered;
    try { await navigator.clipboard.writeText(copyNetworkRequests(snapshot)); feedback = `${snapshot.length} requests copied as JSON.`; }
    catch { copyFailed = true; feedback = 'Copy is unavailable. Your browser did not grant clipboard access.'; }
    finally { copying = false; }
  }
</script>

<section class="network-panel" aria-label="Network requests">
  <div class="network-panel__toolbar">
    <input type="search" aria-label="Filter network requests by URL" placeholder="Filter by URL…" value={query} oninput={event => { query = event.currentTarget.value; page = 0; feedback = ''; }} />
    <label><input type="checkbox" checked={showStatic} onchange={event => { showStatic = event.currentTarget.checked; page = 0; feedback = ''; }} />Show static assets</label>
    <button onclick={() => { void copy(); }} disabled={copying || !filtered.length} aria-label="Copy filtered network requests">{copying ? 'Copying…' : 'Copy'}</button>
  </div>
  <div class="network-panel__summary"><span>{filtered.length} of {rows.length} requests</span><span>Timestamp: UTC</span></div>
  {#if feedback}<p role={copyFailed ? 'alert' : 'status'}>{feedback}</p>{/if}
  {#if !rows.length}<p>No network events were captured.</p>
  {:else if !filtered.length}<p>No requests match these filters.</p>
  {:else}
    <!-- Keyboard users must be able to scroll the wide table. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="network-panel__scroll" role="region" aria-label="Network request table" tabindex="0">
      <table>
        <thead><tr><th scope="col">Timestamp</th><th scope="col">Name</th><th scope="col">Status</th><th scope="col">Method</th><th scope="col">Type</th><th scope="col">Initiator</th><th scope="col">Time</th><th scope="col">URL</th></tr></thead>
        <tbody>{#each visible as row (row.id)}
          <tr>
            <td><time datetime={row.timestamp}>{networkTimestamp(row.timestamp)}</time></td>
            <td><button class="network-panel__expand" aria-expanded={Boolean(expanded[row.id])} aria-controls="network-details-{row.id}" onclick={() => { expanded[row.id] = !expanded[row.id]; }}><span aria-hidden="true">{expanded[row.id] ? '⌄' : '›'}</span>{row.name}</button></td>
            <td class={{ failed: row.status === 'failed' || typeof row.status === 'number' && row.status >= 400, success: typeof row.status === 'number' && row.status >= 200 && row.status < 300 }}>{row.status ?? 'Not reported'}</td>
            <td>{row.method ?? 'Not reported'}</td><td>{row.type ?? 'Not reported'}</td><td>{row.initiator ?? 'Not reported'}</td><td class="network-panel__duration">{row.durationMs === null ? 'Not reported' : `${Math.round(row.durationMs)} ms`}</td><td class="network-panel__url" title={row.url ?? undefined}>{row.url ?? 'Not reported'}</td>
          </tr>
          {#if expanded[row.id]}<tr id="network-details-{row.id}" class="network-panel__details"><td colspan="8"><strong>Captured evidence · {row.records.length} events</strong><p>{row.records[0]?.requestId ? 'Events joined by captured request ID.' : 'No request ID was captured. This event is shown independently.'} Only captured fields are available; existing redactions are preserved.</p><pre>{JSON.stringify(row.records, null, 2)}</pre></td></tr>{/if}
        {/each}</tbody>
      </table>
    </div>
    {#if filtered.length > pageSize}<nav class="network-panel__pagination" aria-label="Network request pages"><button disabled={currentPage === 0} onclick={() => { page = currentPage - 1; }}>Previous</button><span>Page {currentPage + 1} of {Math.ceil(filtered.length / pageSize)}</span><button disabled={(currentPage + 1) * pageSize >= filtered.length} onclick={() => { page = currentPage + 1; }}>Next</button></nav>{/if}
  {/if}
</section>

<style>
  .network-panel { color: var(--text); }
  .network-panel__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 0 10px; }
  .network-panel__toolbar > input { flex: 1; min-width: 180px; padding: 9px 11px; }
  .network-panel input, .network-panel button { border: 1px solid var(--line-soft); border-radius: 0; background: var(--surface); color: var(--text); font: 12px var(--font-body); }
  .network-panel button { min-height: 34px; padding: 6px 10px; cursor: pointer; }
  .network-panel button:disabled { opacity: .5; cursor: default; }
  .network-panel label { display: flex; align-items: center; gap: 7px; font-size: 12px; white-space: nowrap; }
  .network-panel input[type='checkbox'] { appearance: none; width: 16px; height: 16px; margin: 0; flex-shrink: 0; }
  .network-panel input[type='checkbox']:checked { background: var(--accent-strong); border-color: var(--accent-strong); }
  .network-panel input[type='checkbox']:checked::after { content: '✓'; display: block; color: #fff; font: 700 12px / 14px var(--font-body); text-align: center; }
  .network-panel__summary { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; color: var(--muted); font: 10px var(--font-mono); }
  .network-panel p { margin: 10px 0; color: var(--muted); font-size: 12px; }
  .network-panel__scroll { max-height: 60dvh; overflow: auto; border: 1px solid var(--line-soft); }
  .network-panel table { width: 100%; min-width: 1000px; border-collapse: collapse; font: 11px / 1.5 var(--font-mono); }
  .network-panel th { position: sticky; top: 0; z-index: 1; background: var(--line-soft); color: var(--text); text-align: left; font: 600 11px var(--font-body); }
  .network-panel th, .network-panel td { padding: 8px 10px; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft); white-space: nowrap; }
  .network-panel tbody tr:nth-child(even) { background: var(--paper-soft); }
  .network-panel .network-panel__expand { display: flex; align-items: center; gap: 8px; min-height: 24px; padding: 0; border: 0; background: transparent; font: inherit; text-align: left; max-width: 240px; white-space: normal; overflow-wrap: anywhere; }
  .network-panel__url { max-width: 380px; overflow: hidden; text-overflow: ellipsis; }
  .network-panel__duration { text-align: right; }
  .network-panel .failed { color: var(--danger); font-weight: 700; }
  .network-panel .success { color: var(--success); }
  .network-panel__details td { white-space: normal; background: var(--paper-soft); }
  .network-panel pre { margin: 10px 0 0; max-height: 280px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: 11px / 1.6 var(--font-mono); }
  .network-panel__pagination { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding-top: 10px; font: 11px var(--font-mono); }
  @media (max-width: 760px) { .network-panel button, .network-panel .network-panel__expand, .network-panel__toolbar > input { min-height: 44px; } .network-panel__toolbar > input { flex-basis: 100%; } }
</style>
