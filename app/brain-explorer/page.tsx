import type { Metadata } from 'next';
import BrainExplorer from '@/components/brain-explorer/BrainExplorer';
export const metadata: Metadata = { title: 'Cerebro 3D y redes emocionales | Psicología', description: 'Explorador educativo del cerebro humano con casos de depresión, ansiedad y claustrofobia, redes ilustrativas y sonido opcional.' };
export default function BrainExplorerPage() { return <BrainExplorer />; }
