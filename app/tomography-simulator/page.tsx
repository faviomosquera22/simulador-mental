import type { Metadata } from 'next';
import TomographySimulator from '@/components/tomography/TomographySimulator';
export const metadata: Metadata = { title: 'Atlas de tomografía 3D', description: 'Exploración educativa de tomografía de cuerpo completo con cortes axial, coronal y sagital y volumen 3D.' };
export default function TomographyPage() { return <TomographySimulator />; }
