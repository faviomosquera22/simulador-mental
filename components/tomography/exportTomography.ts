import type { Niivue } from '@niivue/niivue';
/** Compose DOM labels with the WebGL image so exported PNGs retain the annotations. */
export async function exportTomography(nv: Niivue, overlay: SVGSVGElement | null) {
  if (!overlay || getComputedStyle(overlay).display === 'none' || !overlay.querySelector('[data-ct-label]')) { await nv.saveScene('psyke-tomografia.png'); return; }
  nv.drawScene();
  const canvas = document.createElement('canvas'); canvas.width = nv.canvas!.width; canvas.height = nv.canvas!.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('No se pudo preparar la captura.');
  context.drawImage(nv.canvas!, 0, 0);
  const svg = overlay.cloneNode(true) as SVGSVGElement;
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', String(canvas.width)); svg.setAttribute('height', String(canvas.height));
  const source = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('No se pudieron exportar las etiquetas.')); image.src = source; });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo guardar la captura.')), 'image/png'));
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'psyke-tomografia-anatomia.png'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally { URL.revokeObjectURL(source); }
}
