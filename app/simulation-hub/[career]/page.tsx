import CareerCatalog from "@/components/catalog/CareerCatalog";
import { SIMULATION_CAREERS, isSimulationCareer } from "@/src/lib/simulationCatalog";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() { return SIMULATION_CAREERS.map(career => ({ career: career.id })); }
export async function generateMetadata({ params }: { params: Promise<{ career: string }> }): Promise<Metadata> {
  const { career } = await params;
  return { title: `Simuladores de ${SIMULATION_CAREERS.find(item => item.id === career)?.label ?? "Psyke"}` };
}
export default async function CareerPage({ params }: { params: Promise<{ career: string }> }) {
  const { career } = await params;
  if (!isSimulationCareer(career)) notFound();
  return <CareerCatalog key={career} career={career}/>;
}
