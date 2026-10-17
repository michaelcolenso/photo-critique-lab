<script lang="ts">
  import { clampRect } from '$lib/image/crop';
  import type { Rect } from '$lib/critique/schema';
  let {
    rect,
    onchange,
    aspect = null,
    imageAspect
  }: {
    rect: Rect;
    onchange: (rect: Rect, commit?: boolean) => void;
    aspect?: number | null;
    imageAspect: number;
  } = $props();
  let surface: HTMLDivElement;
  let drag: { pointer: number; x: number; y: number; rect: Rect; handle: string } | null = null;
  function start(e: PointerEvent, handle: string) {
    e.preventDefault();
    e.stopPropagation();
    surface.setPointerCapture(e.pointerId);
    drag = { pointer: e.pointerId, x: e.clientX, y: e.clientY, rect: { ...rect }, handle };
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const box = surface.getBoundingClientRect();
    const dx = (e.clientX - drag.x) / box.width,
      dy = (e.clientY - drag.y) / box.height;
    const r = { ...drag.rect };
    if (drag.handle === 'move') {
      r.x += dx;
      r.y += dy;
    } else {
      const west = drag.handle.includes('w'),
        north = drag.handle.includes('n');
      const right = r.x + r.width,
        bottom = r.y + r.height;
      let width = Math.max(0.2, Math.min(west ? right : 1 - r.x, r.width + (west ? -dx : dx)));
      let height = Math.max(0.2, Math.min(north ? bottom : 1 - r.y, r.height + (north ? -dy : dy)));
      if (aspect) {
        const ratio = aspect / imageAspect;
        height = width / ratio;
        const maxHeight = north ? bottom : 1 - r.y;
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }
        if (height < 0.2 || width < 0.2) return;
      }
      r.width = width;
      r.height = height;
      if (west) r.x = right - width;
      if (north) r.y = bottom - height;
    }
    onchange(clampRect(r));
  }
  function end(e: PointerEvent) {
    if (drag?.pointer === e.pointerId) {
      drag = null;
      onchange(rect, true);
    }
  }
</script>

<div
  bind:this={surface!}
  class="crop-interaction"
  role="group"
  aria-label="Crop drag controls; numeric alternatives below"
  onpointermove={move}
  onpointerup={end}
  onpointercancel={end}
>
  <div
    class="crop-selection"
    style:left={`${rect.x * 100}%`}
    style:top={`${rect.y * 100}%`}
    style:width={`${rect.width * 100}%`}
    style:height={`${rect.height * 100}%`}
  >
    <button
      class="crop-move"
      aria-label="Move crop using pointer; use position fields for keyboard"
      tabindex="-1"
      onpointerdown={(e) => start(e, 'move')}><span class="thirds"></span></button
    >
    {#each ['nw', 'ne', 'sw', 'se'] as corner}<button
        class="crop-handle {corner}"
        aria-label={`Resize ${corner} crop corner; use size fields for keyboard`}
        tabindex="-1"
        onpointerdown={(e) => start(e, corner)}
      ></button>{/each}
  </div>
</div>
