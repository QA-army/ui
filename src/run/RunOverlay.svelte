<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  let { children, title, onClose }: { children: Snippet; title: string; onClose: () => void } = $props();
  let dialog: HTMLDialogElement;
  let closeButton: HTMLButtonElement;

  onMount(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  });
</script>

<dialog bind:this={dialog} class="run-overlay" aria-label={title} oncancel={event => { if (event.target === dialog) { event.preventDefault(); onClose(); } }}>
  <button bind:this={closeButton} class="run-overlay__close" type="button" aria-label="Close Run" onclick={onClose}>×</button>
  <div class="run-overlay__content">{@render children()}</div>
</dialog>

<style>
  .run-overlay {
    position: fixed;
    inset: 0;
    width: calc(100vw - 64px);
    max-width: 1920px;
    height: calc(100dvh - 64px);
    max-height: none;
    margin: auto;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--line-soft);
    border-radius: 0;
    background: var(--surface);
    color: var(--text);
    box-shadow: none;
  }
  .run-overlay::backdrop { background: color-mix(in srgb, var(--ink) 24%, transparent); backdrop-filter: blur(6px); }
  .run-overlay__content { height: 100%; min-height: 0; }
  .run-overlay__close { position: absolute; z-index: 2; right: 14px; top: 17px; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; box-shadow: none; border-radius: 0; background: transparent; color: var(--muted); font: 22px / 1 var(--font-body); cursor: pointer; }
  .run-overlay__close:hover { border-color: var(--line-soft); color: var(--text); }
  .run-overlay__close:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
  .run-overlay :global(.run-shell) { height: 100%; min-height: 0; display: flex; flex-direction: column; }
  .run-overlay :global(.run-header) { flex-shrink: 0; padding-right: 63px; }
  .run-overlay :global(.run-workbench) { flex: 1; height: auto; min-height: 0; }
  .run-overlay :global(.run-connection-warning), .run-overlay :global(.run-cancel-error) { flex-shrink: 0; }
  .run-overlay :global(.callback-page) { height: 100%; min-height: 0; overflow: auto; padding-top: 64px; }
  @media (max-width: 900px) {
    .run-overlay { width: 100vw; max-width: none; height: 100dvh; border: 0; box-shadow: none; overflow: auto; }
    .run-overlay__content { height: auto; min-height: 100%; }
    .run-overlay__close { top: 14px; right: 10px; width: 44px; height: 44px; }
    .run-overlay :global(.run-header) { padding-right: 62px; }
    .run-overlay :global(.run-shell) { height: auto; min-height: 100dvh; }
    .run-overlay :global(.run-workbench) { flex: none; }
    .run-overlay :global(.callback-page) { min-height: 100dvh; }
  }
</style>
