<script lang="ts">
  let { text }: { text: string } = $props();

  function typeOn(node: HTMLElement) {
    const value = text;
    const host = node as HTMLElement & { __typeGen?: number };
    const generation = (host.__typeGen ?? 0) + 1;
    host.__typeGen = generation;
    let handle = 0;
    node.replaceChildren();
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const stop = () => cancelAnimationFrame(handle);
    if (media?.matches) {
      node.textContent = value;
      return stop;
    }
    const origin = performance.now();
    const caret = document.createElement('span');
    caret.style.cssText = 'display:inline-block;width:1px;height:0.9em;margin-left:1px;background:currentColor;vertical-align:-0.1em';
    let glyphs = 0;
    const current = () => host.__typeGen === generation;
    const tick = (now: number) => {
      if (!current()) return;
      const count = Math.min(value.length, Math.floor((now - origin) / 18) + 1);
      while (glyphs < count) {
        const glyph = document.createElement('span');
        glyph.textContent = value[glyphs] ?? '';
        glyph.style.animation = 'run-type-in 90ms ease-out';
        node.insertBefore(glyph, caret.isConnected ? caret : null);
        glyphs += 1;
      }
      if (current() && !caret.isConnected) node.appendChild(caret);
      if (count >= value.length) { caret.remove(); return; }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return stop;
  }
</script>

<span class="typewriter" aria-hidden="true" {@attach typeOn}></span>

<style>
  .typewriter { white-space: inherit; overflow-wrap: inherit; }
</style>
