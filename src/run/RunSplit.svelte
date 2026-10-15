<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  let { first, second, label, direction = 'vertical', initial = 50, minimum = 20, maximum = 80 }: {
    first: Snippet; second: Snippet; label: string; direction?: 'vertical' | 'horizontal';
    initial?: number; minimum?: number; maximum?: number;
  } = $props();
  let size = $state(untrack(() => initial));
  let container: HTMLDivElement;
  let drag = $state<{ pointerId: number; start: number; size: number; extent: number } | null>(null);
  const clamp = (value: number) => Math.min(maximum, Math.max(minimum, value));
  function start(event: PointerEvent) {
    if (event.button !== 0 || drag) return;
    const bounds = container.getBoundingClientRect();
    const extent = (direction === 'vertical' ? bounds.width : bounds.height) - 1;
    if (extent <= 0) return;
    event.preventDefault();
    event.currentTarget instanceof HTMLElement && event.currentTarget.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId, start: direction === 'vertical' ? event.clientX : event.clientY, size, extent };
  }
  function move(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    size = clamp(drag.size + ((direction === 'vertical' ? event.clientX : event.clientY) - drag.start) / drag.extent * 100);
  }
  function finish(event: PointerEvent) { if (drag?.pointerId === event.pointerId) drag = null; }
  function keyboard(event: KeyboardEvent) {
    const backward = direction === 'vertical' ? 'ArrowLeft' : 'ArrowUp';
    const forward = direction === 'vertical' ? 'ArrowRight' : 'ArrowDown';
    if (![backward, forward, 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    size = event.key === 'Home' ? minimum : event.key === 'End' ? maximum : clamp(size + (event.key === backward ? -1 : 1) * (event.shiftKey ? 10 : 2));
  }
</script>

<div class="run-split run-split--{direction}" class:is-dragging={Boolean(drag)} bind:this={container} style:--split-size="{size}%">
  <div class="run-split__pane">{@render first()}</div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div class="run-split__divider" role="separator" tabindex="0" aria-label={label} aria-orientation={direction} aria-valuemin={minimum} aria-valuemax={maximum} aria-valuenow={Math.round(size)} aria-valuetext="{Math.round(size)} percent" title="Drag to resize. Use arrow keys, Home or End; Shift for larger changes." onpointerdown={start} onpointermove={move} onpointerup={finish} onpointercancel={finish} onlostpointercapture={finish} onkeydown={keyboard}></div>
  <div class="run-split__pane">{@render second()}</div>
</div>

<style>
  .run-split { display: grid; height: 100%; min-width: 0; min-height: 0; overflow: hidden; }
  .run-split--vertical { grid-template-columns: minmax(0, calc(var(--split-size) - .5px)) 1px minmax(0, 1fr); }
  /* The recording is a hero banner, so its row is as tall as the picture. Diagnostics take the rest. */
  .run-split--horizontal { grid-template-rows: auto 1px minmax(0, 1fr); }
  .run-split__pane { min-width: 0; min-height: 0; overflow: auto; }
  .run-split__divider { position: relative; z-index: 1; background: var(--line-soft); touch-action: none; outline-offset: 1px; }
  .run-split--vertical > .run-split__divider { cursor: col-resize; }
  .run-split--horizontal > .run-split__divider { cursor: row-resize; }
  /* Keep a generous invisible hit area around the single visible line. */
  .run-split__divider::before { content: ''; position: absolute; }
  .run-split--vertical > .run-split__divider::before { inset: 0 -4px; }
  .run-split--horizontal > .run-split__divider::before { inset: -4px 0; }
  .run-split__divider::after { content: ''; position: absolute; inset: 0; background: transparent; pointer-events: none; }
  .run-split__divider:hover::after, .run-split__divider:focus-visible::after, .is-dragging > .run-split__divider::after { background: var(--accent-strong); }
  .run-split--vertical > .run-split__divider:hover::after, .run-split--vertical > .run-split__divider:focus-visible::after, .run-split--vertical.is-dragging > .run-split__divider::after { inset-inline: -1px; }
  .run-split--horizontal > .run-split__divider:hover::after, .run-split--horizontal > .run-split__divider:focus-visible::after, .run-split--horizontal.is-dragging > .run-split__divider::after { inset-block: -1px; }
  .run-split__divider:focus-visible { outline: 2px solid var(--accent-strong); }
  .is-dragging { user-select: none; }
  .is-dragging :global(iframe) { pointer-events: none; }
  @media (max-width: 900px) {
    .run-split { display: flex; flex-direction: column; height: auto; overflow: visible; }
    .run-split__pane { overflow: visible; }
    .run-split__divider { display: none; }
  }
</style>
