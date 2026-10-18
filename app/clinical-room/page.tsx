import ClinicalRoom from "@/components/clinical-room/ClinicalRoom";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sala interactiva ginecológica", description: "Simulación interactiva de urgencias ginecológicas y obstétricas con decisiones, monitor y evaluación." };
export default function ClinicalRoomPage() { return <ClinicalRoom />; }
