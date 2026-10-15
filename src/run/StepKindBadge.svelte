<script lang="ts">
  import { stepKind, stepKinds } from './step-kind';
  import TypewriterText from './TypewriterText.svelte';
  import './run-design-tokens.css';
  let { type, reveal = 'full' }: { type: string; reveal?: 'full' | 'type' | 'icon' } = $props();
  let kind = $derived(stepKind(type));
  let definition = $derived(kind ? stepKinds[kind] : null);
  let mark = $derived(definition?.mark);
  let label = $derived(definition?.label ?? type);
</script>

<span class="step-kind-badge" class:is-quiet={reveal !== 'full'} data-kind={kind ?? 'UNKNOWN'} title={definition?.description ?? 'Test step'}>
  <svg aria-hidden="true" viewBox="0 0 18 18">
    <g transform={mark ? `translate(${mark.fit.x} ${mark.fit.y}) scale(${mark.fit.s})` : undefined}>
      {#each mark?.fills ?? [] as fill (fill.d)}
        <path d={fill.d} fill="currentColor" fill-rule={fill.rule ?? 'nonzero'} />
      {/each}
      {#if mark?.strokes}
        <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
          {#each mark.strokes as stroke (stroke)}
            <path d={stroke} />
          {/each}
        </g>
      {/if}
    </g>
  </svg>
  {#if reveal === 'full'}
    <span>{label}</span>
  {:else}
    <span class="visually-hidden">{label}</span>
    {#if reveal === 'type'}<TypewriterText text={label} />{/if}
  {/if}
</span>

<style>
  .step-kind-badge { display: inline-flex; max-width: 100%; align-items: center; gap: 2px; padding: 3px 5px; border: 0; border-radius: 0; box-shadow: none; background: var(--type-paper, var(--paper-soft)); color: var(--type-ink, var(--text)); font: 600 10px / 1.35 var(--font-mono); text-transform: uppercase; overflow-wrap: anywhere; vertical-align: middle; }
  .step-kind-badge.is-quiet { padding-inline: 3px; }
  .step-kind-badge svg { width: 16px; height: 16px; flex: 0 0 16px; display: block; }
</style>
