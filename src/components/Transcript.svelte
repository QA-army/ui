<script lang="ts">
  import OutcomeIcon from "./OutcomeIcon.svelte";
  import StepKindBadge from "./StepKindBadge.svelte";

  type Step = { number: number; type: string; title: string; outcome: string; time: string; pending?: boolean };
  let { steps }: { steps: Step[] } = $props();
</script>

<ol>
  {#each steps as step (step.number)}
    <li>
      <span class="number">{step.number}</span>
      <StepKindBadge type={step.type} reveal="icon" />
      <span class="title" class:pending={step.pending}>{step.title}</span>
      <span class="end">
        {#if step.outcome === "STARTED"}
          <span class="running">Running</span>
        {:else}
          <OutcomeIcon outcome={step.outcome} />
        {/if}
        <time>{step.time}</time>
      </span>
    </li>
  {/each}
</ol>

<style>
  ol { margin: 0; padding: 0; list-style: none; background: var(--surface-raised); }
  li {
    display: grid;
    grid-template-columns: max-content max-content minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line-soft);
  }
  .number { color: var(--muted); font: 12px var(--font-mono, ui-monospace, monospace); }
  .title { color: var(--ink); font: 700 13px / 1.4 var(--font-body, Inter, sans-serif); }
  .pending { font-weight: 400; color: var(--text); }
  .end { display: inline-flex; align-items: center; gap: 8px; }
  time { color: var(--muted); font: 11px var(--font-mono, ui-monospace, monospace); }
  .running {
    padding: 2px 6px;
    background: var(--run-passed);
    color: #ffffff;
    font: 600 10px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    animation: fade 2s ease-in-out infinite;
  }
  @keyframes fade { 50% { opacity: 0.5; } }
  @media (prefers-reduced-motion: reduce) { .running { animation: none; } }
</style>
