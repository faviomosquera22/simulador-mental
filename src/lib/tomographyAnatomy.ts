export type AnatomyGroup = 'bones' | 'organs' | 'vessels' | 'muscles' | 'other';
export type AnatomyPoint = [number, number, number];
/** id, global voxel X/Y/Z, number of labelled pixels on this plane. */
export type AnatomyAnchor = [number, number, number, number, number];
export type AnatomyObject = { id: number; name: string; original: string; group: AnatomyGroup; source: 'sio' | 'morphology'; priority: number; count: number; point: AnatomyPoint; bounds: [AnatomyPoint, AnatomyPoint]; codes: number[] };
export type AnatomyAtlas = { version: number; dimensions: AnatomyPoint; origin: AnatomyPoint; spacing: AnatomyPoint; catalog: AnatomyObject[]; planes: AnatomyAnchor[][][]; source: { url: string; license: string; authors: string; coverageZ: [number, number] }; labelVolumeSha256: string; registration: { slice: number; accepted: boolean; correlation?: number }[] };
export const ANATOMY_GROUPS: { id: AnatomyGroup; name: string; color: string }[] = [
  { id: 'bones', name: 'Huesos', color: '#efcb7b' },
  { id: 'organs', name: 'Órganos', color: '#73ddd0' },
  { id: 'vessels', name: 'Vasos', color: '#f494ac' },
  { id: 'muscles', name: 'Músculos', color: '#b4a4f4' },
];
export function anatomyWorldPoint(data: Pick<AnatomyAtlas, 'origin' | 'spacing'>, voxel: readonly number[]): AnatomyPoint {
  return [0, 1, 2].map(a => data.origin[a] + voxel[a] * data.spacing[a]) as AnatomyPoint;
}
export function anatomyVoxel(data: Pick<AnatomyAtlas, 'origin' | 'spacing' | 'dimensions'>, point: readonly number[]): AnatomyPoint | null {
  const q = [0, 1, 2].map(a => Math.round((point[a] - data.origin[a]) / data.spacing[a])) as AnatomyPoint;
  return q.every((v, a) => Number.isFinite(v) && v >= 0 && v < data.dimensions[a]) ? q : null;
}
export function anatomyPlane(data: AnatomyAtlas, axis: 0 | 1 | 2, position: number): AnatomyAnchor[] {
  const index = Math.round((position - data.origin[axis]) / data.spacing[axis]);
  return Number.isFinite(index) ? data.planes[axis]?.[index] ?? [] : [];
}
export function chooseAnatomyLabels(objects: AnatomyObject[], maximum: number, groups: AnatomyGroup[], selected?: number | null): AnatomyObject[] {
  const candidates = objects.filter(o => groups.includes(o.group));
  const sorted = [...candidates].sort((a, b) => Number(b.id === selected) - Number(a.id === selected) || a.priority - b.priority || b.count - a.count || a.id - b.id);
  // Share limited screen space between active categories instead of filling it with ribs.
  const result: AnatomyObject[] = [];
  const selectedObject = sorted.find(o => o.id === selected);
  if (selectedObject) result.push(selectedObject);
  while (result.length < maximum) {
    const available = groups.filter(group => sorted.some(o => o.group === group && !result.some(r => r.id === o.id)));
    available.sort((a, b) => result.filter(o => o.group === a).length - result.filter(o => o.group === b).length);
    const group = available[0];
    if (!group) break;
    const next = sorted.find(o => o.group === group && !result.some(r => r.id === o.id));
    if (next) result.push(next); else break;
  }
  return result;
}
export function anatomyLabelAt(data: Pick<AnatomyAtlas, 'origin' | 'spacing' | 'dimensions'>, labels: ArrayLike<number>, point: readonly number[]): number {
  const voxel = anatomyVoxel(data, point);
  return voxel ? labels[voxel[0] + data.dimensions[0] * (voxel[1] + data.dimensions[1] * voxel[2])] ?? 0 : 0;
}
