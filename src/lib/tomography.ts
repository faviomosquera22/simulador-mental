export type TomographyView = 'multiplanar' | 'axial' | 'coronal' | 'sagittal' | 'render';
export const TOMOGRAPHY_VIEWS: { id: TomographyView; label: string; type: number }[] = [
  { id: 'multiplanar', label: 'Tres cortes + 3D', type: 3 },
  { id: 'axial', label: 'Axial / transversal', type: 0 },
  { id: 'coronal', label: 'Coronal', type: 1 },
  { id: 'sagittal', label: 'Sagital', type: 2 },
  { id: 'render', label: 'Volumen 3D', type: 4 },
];
export const CT_WINDOWS = [
  { id: 'soft', label: 'Tejidos blandos', center: 40, width: 400 },
  { id: 'lung', label: 'Pulmón', center: -600, width: 1500 },
  { id: 'bone', label: 'Hueso', center: 400, width: 1800 },
  { id: 'brain', label: 'Cerebro', center: 40, width: 80 },
  { id: 'wide', label: 'Rango amplio', center: 400, width: 2800 },
] as const;
export const CT_RENDER_PRESETS = [
  { id: 'ct_bones', label: 'Esqueleto', min: 180, max: 600 },
  { id: 'ct_soft', label: 'Tejidos', min: -923, max: 679 },
  { id: 'ct_surface', label: 'Superficie', min: -600, max: 100 },
  { id: 'gray', label: 'Escala de grises', min: 150, max: 1500 },
] as const;
export type CTStudy = { id: string; label: string; subtitle: string; url: string; description: string; structures: string[]; window: string; };
export const CT_STUDIES: CTStudy[] = [
  { id: 'whole-body', label: 'Cuerpo completo', subtitle: 'Cabeza a pies', url: '/tomography/whole-body.nii.gz', description: 'Tomografía de un espécimen masculino congelado del proyecto Visible Human. Incluye cabeza, cuello, tronco, pelvis y extremidades. Los cambios entre adquisiciones y los huecos de la fuente se conservan o se indican; no representa un estudio de una persona viva.', structures: ['Cráneo y columna', 'Caja torácica', 'Cintura pélvica', 'Extremidades superiores e inferiores'], window: 'wide' },
  { id: 'head', label: 'Cabeza', subtitle: 'Cráneo y encéfalo', url: '/tomography/region-head.nii.gz', description: 'Explora cráneo, cavidades y tejido intracraneal. La resolución de esta versión educativa limita el detalle fino.', structures: ['Calota craneal', 'Órbitas', 'Senos paranasales', 'Parénquima cerebral'], window: 'brain' },
  { id: 'neck', label: 'Cuello', subtitle: 'Región cervical', url: '/tomography/region-neck.nii.gz', description: 'Recorrido por la región cervical y su transición al tórax.', structures: ['Columna cervical', 'Vía aérea', 'Tejidos del cuello', 'Cintura escapular'], window: 'soft' },
  { id: 'thorax', label: 'Tórax', subtitle: 'Pulmones y mediastino', url: '/tomography/region-thorax.nii.gz', description: 'Compara la ventana pulmonar con tejidos blandos y hueso. El aspecto post mortem puede diferir del de un paciente vivo.', structures: ['Pulmones', 'Mediastino', 'Costillas y esternón', 'Columna torácica'], window: 'lung' },
  { id: 'abdomen', label: 'Abdomen', subtitle: 'Órganos y retroperitoneo', url: '/tomography/region-abdomen.nii.gz', description: 'Explora los compartimentos abdominales en tres planos. Los nombres activables proceden de un atlas segmentado registrado con fines educativos.', structures: ['Hígado', 'Bazo y riñones', 'Asas intestinales', 'Columna lumbar'], window: 'soft' },
  { id: 'pelvis', label: 'Pelvis', subtitle: 'Cadera y anillo pélvico', url: '/tomography/region-pelvis.nii.gz', description: 'Recorrido del anillo pélvico, sacro, articulaciones y tejidos intrapélvicos.', structures: ['Sacro', 'Huesos coxales', 'Cabezas femorales', 'Tejidos pélvicos'], window: 'bone' },
  { id: 'upper-limbs', label: 'Ext. superiores', subtitle: 'Junto al tronco', url: '/tomography/region-upper-limbs.nii.gz', description: 'Los brazos están junto al cuerpo: este encuadre incluye el tronco. No es una adquisición dedicada de mano o muñeca; la posición y el campo de visión limitan algunas estructuras.', structures: ['Hombros', 'Húmeros', 'Codos', 'Radio y cúbito, según cobertura'], window: 'bone' },
  { id: 'lower-limbs', label: 'Ext. inferiores', subtitle: 'Muslos, rodillas y pies', url: '/tomography/region-lower-limbs.nii.gz', description: 'Explora ambas extremidades inferiores desde el fémur hasta los pies, con las discontinuidades de la adquisición original.', structures: ['Fémures', 'Rodillas y rótulas', 'Tibias y peronés', 'Tobillos y pies'], window: 'bone' },
];
export const CT_SOURCE = { title: 'NLM · Visible Human Project', url: 'https://www.nlm.nih.gov/research/visible/visible_human.html', terms: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html', repository: 'https://github.com/niivue/niivue' };
export function clampFraction(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : .5; }
// NiiVue fractions are voxel-center coordinates: (index + 0.5) / dimension.
export function sliceFraction(index: number, count: number): number { return (Math.max(0, Math.min(Math.max(1, count) - 1, Math.round(index))) + .5) / Math.max(1, count); }
export function fractionSlice(fraction: number, count: number): number { return Math.max(0, Math.min(Math.max(1, count) - 1, Math.floor(clampFraction(fraction) * Math.max(1, count)))); }
export function axisForView(view: TomographyView): 0 | 1 | 2 { return view === 'sagittal' ? 0 : view === 'coronal' ? 1 : 2; }
export function windowBounds(center: number, width: number): [number, number] { const safeWidth = Math.max(1, width); return [center - safeWidth / 2, center + safeWidth / 2]; }
