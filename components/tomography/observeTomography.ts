import type { Niivue } from '@niivue/niivue';
/** Subscribe to all imperative camera/zoom/scroll redraws, including pointer drags.
 * NiiVue has no post-draw event. Restore the original method when detached.
 */
export function observeTomography(nv: Niivue, refresh: () => void) {
  let frame = 0, disposed = false;
  const original = nv.drawScene;
  const drawOriginal = () => original.call(nv);
  const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(() => { frame = 0; if (!disposed) refresh(); }); };
  const wrapped: Niivue['drawScene'] = () => { const result = drawOriginal(); schedule(); return result; };
  nv.drawScene = wrapped;
  const observer = new ResizeObserver(schedule); observer.observe(nv.canvas!);
  schedule();
  return { drawOriginal, dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); if (nv.drawScene === wrapped) nv.drawScene = original; } };
}
