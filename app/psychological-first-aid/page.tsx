import type { Metadata } from "next";
import PapSimulator from "@/components/psychological-first-aid/PapSimulator";

export const metadata: Metadata = {
  title: "Primeros auxilios psicológicos",
  description: "Prototipo educativo con paciente 3D animada, entrevista, decisiones y devolución sobre primeros auxilios psicológicos.",
};

export default function PsychologicalFirstAidPage() { return <PapSimulator/>; }
