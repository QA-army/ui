<script lang="ts">
  let { label, value = "" }: { label: string; value?: string } = $props();
</script>

<label>
  <span>{label}</span>
  <input {value} />
</label>

<style>
  label { display: grid; gap: 6px; }
  span {
    color: var(--muted);
    font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  input {
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid var(--line-soft);
    border-radius: 0;
    box-shadow: none;
    background: var(--surface-raised);
    color: var(--ink);
    font: 14px / 1.4 var(--font-body, Inter, sans-serif);
  }
</style>
