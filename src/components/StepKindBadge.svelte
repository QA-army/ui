<script lang="ts">
  import { stepKind, stepKinds } from "./step-kind.ts";

  let { type, reveal = "full" }: { type: string; reveal?: "full" | "icon" } = $props();
  let kind = $derived(stepKind(type));
  let definition = $derived(kind ? stepKinds[kind] : null);
  let mark = $derived(definition?.mark);
  let label = $derived(definition?.label ?? type);
</script>

<span class="step-kind-badge" class:is-quiet={reveal !== "full"} data-kind={kind ?? "UNKNOWN"} title={definition?.description ?? "Test step"}>
  <svg aria-hidden="true" viewBox="0 0 18 18">
    <g transform={mark ? `translate(${mark.fit.x} ${mark.fit.y}) scale(${mark.fit.s})` : undefined}>
      {#each mark?.fills ?? [] as fill (fill.d)}
        <path d={fill.d} fill="currentColor" fill-rule={fill.rule ?? "nonzero"} />
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
  <span class="label" class:hidden-label={reveal !== "full"}>{label}</span>
</span>

<style>
  .step-kind-badge {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    gap: 2px;
    padding: 3px 8px 3px 5px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: var(--type-paper, var(--paper-soft));
    color: var(--type-ink, var(--text));
    font: 600 10px / 1.35 var(--font-mono, ui-monospace, monospace);
    text-transform: uppercase;
    vertical-align: middle;
  }
  .step-kind-badge.is-quiet { padding-inline: 3px; }
  .step-kind-badge svg { width: 16px; height: 16px; flex: 0 0 16px; display: block; }
  .hidden-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .is-quiet:hover .hidden-label,
  .is-quiet:focus-within .hidden-label {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
  }
  .step-kind-badge[data-kind="ACT"] { --type-ink: #5145a6; --type-paper: #eeebff; }
  .step-kind-badge[data-kind="ASSERT"] { --type-ink: #126078; --type-paper: #e3f2f7; }
  .step-kind-badge[data-kind="LOGIN"] { --type-ink: #512e5f; --type-paper: #f5eef8; }
  .step-kind-badge[data-kind="FILES"] { --type-ink: #7d6608; --type-paper: #fef9e7; }
  .step-kind-badge[data-kind="SCREENSHOT"] { --type-ink: #87480f; --type-paper: #fff0d9; }
  .step-kind-badge[data-kind="JAVASCRIPT"] { --type-ink: #935116; --type-paper: #fef5e7; }
  .step-kind-badge[data-kind="MICROPHONE"] { --type-ink: #4a5568; --type-paper: #f4f6f7; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="ACT"] { --type-ink: #b9afff; --type-paper: #28213f; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="ASSERT"] { --type-ink: #7ec8dc; --type-paper: #123038; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="LOGIN"] { --type-ink: #d4a5ff; --type-paper: #2c1b3b; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="FILES"] { --type-ink: #ffe082; --type-paper: #2d281a; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="SCREENSHOT"] { --type-ink: #f2c166; --type-paper: #372918; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="JAVASCRIPT"] { --type-ink: #ffb74d; --type-paper: #302216; }
  :global(:root[data-theme="dark"]) .step-kind-badge[data-kind="MICROPHONE"] { --type-ink: #90a4ae; --type-paper: #1f232b; }
</style>
