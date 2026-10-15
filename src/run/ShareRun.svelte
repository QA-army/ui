<script lang="ts">
  let { url, resourceLabel = "Run", shareTitle }: { url: string | null; resourceLabel?: string; shareTitle?: string } = $props();
  let dialog: HTMLDialogElement;
  let feedback = $state("");
  let copying = $state(false);
  const id = $props.id();

  function open() {
    feedback = "";
    dialog.showModal();
  }
  async function share() {
    if (copying || !url) return;
    if (typeof navigator.share !== "function") { await copy(); return; }
    copying = true; feedback = "";
    try { await navigator.share({ title: shareTitle ?? resourceLabel, url }); }
    catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) feedback = "Sharing is unavailable. Select and copy the link below.";
    } finally { copying = false; }
  }
  async function copy() {
    if (copying || !url) return;
    copying = true;
    try {
      await navigator.clipboard.writeText(url);
      feedback = "Link copied.";
    } catch {
      feedback = "Copy is unavailable. Select and copy the link below.";
    } finally { copying = false; }
  }
</script>

<button class="collaboration-trigger compact" type="button" onclick={open} aria-label="Share" title="Share {resourceLabel} link" aria-haspopup="dialog">
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
</button>
<dialog bind:this={dialog} aria-labelledby="{id}-title" aria-describedby="{id}-description" class="collaboration-dialog">
  <div class="collaboration-heading">
    <span class="collaboration-eyebrow">SHARE</span>
    <button class="collaboration-close" type="button" onclick={() => dialog.close()} aria-label="Close share dialog">×</button>
  </div>
  <h2 id="{id}-title">Share this {resourceLabel}</h2>
  <p id="{id}-description">Anyone with this link can open it where the host allows.</p>
  {#if url}
    <label for="{id}-link">Link</label>
    <input id="{id}-link" readonly value={url} onclick={(event) => event.currentTarget.select()} />
    <div class="collaboration-actions">
      <button type="button" class="collaboration-secondary" onclick={() => dialog.close()}>Done</button>
      <button type="button" class="collaboration-secondary" disabled={copying} onclick={share}>Share {resourceLabel}</button>
      <button type="button" class="collaboration-primary" disabled={copying} onclick={copy}>{copying ? "Copying…" : "Copy link"}</button>
    </div>
  {:else}
    <p role="alert">This Run does not have a shareable link yet.</p>
  {/if}
  <p class="collaboration-feedback" role="status">{feedback}</p>
</dialog>

<style>
  .collaboration-trigger, .collaboration-primary, .collaboration-secondary, .collaboration-close {
    font: inherit; font-weight: 600; cursor: pointer; min-height: 44px; border-radius: 0;
  }
  .collaboration-trigger.compact { display: inline-grid; place-items: center; width: 28px; min-height: 32px; padding: 4px; border: 0; background: transparent; color: var(--muted); }
  .collaboration-trigger.compact:hover { color: var(--text); background: var(--paper-soft); }
  .collaboration-secondary { padding: 9px 16px; border: 1px solid var(--line-soft, #d8d4cb); background: var(--surface, #fffefa); color: var(--ink, #0b0b0e); }
  .collaboration-primary { padding: 10px 18px; border: 1px solid var(--accent-strong, #6d71ed); background: var(--accent, #8a8dff); color: #0b0b0e; }
  .collaboration-dialog { box-sizing: border-box; width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 28px; border: 1px solid var(--line-soft, #d8d4cb); border-radius: 0; background: var(--surface, #fffefa); color: var(--text, #303036); }
  .collaboration-dialog::backdrop { background: #11182788; }
  .collaboration-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .collaboration-eyebrow { color: var(--muted, #66666e); font-size: 11px; font-weight: 700; letter-spacing: .1em; }
  .collaboration-close { flex: 0 0 44px; border: 0; background: transparent; color: var(--ink, #0b0b0e); }
  .collaboration-dialog h2 { margin: 8px 0 12px; color: var(--ink, #0b0b0e); font-size: clamp(22px, 4vw, 28px); line-height: 1.2; }
  .collaboration-dialog p { line-height: 1.6; }
  .collaboration-dialog label { display: block; font-size: 14px; font-weight: 600; margin: 24px 0 8px; }
  .collaboration-dialog input { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--line-soft, #d8d4cb); border-radius: 0; padding: 12px; font: inherit; background: var(--paper-soft, #fbfaf7); color: var(--ink, #0b0b0e); }
  .collaboration-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; margin-top: 24px; }
  .collaboration-feedback { font-size: 13px; margin: 14px 0 0; }
  .collaboration-dialog button:disabled { cursor: wait; opacity: .6; }
  @media (max-width: 900px) { .collaboration-trigger.compact { width: 40px; min-height: 44px; } }
</style>
