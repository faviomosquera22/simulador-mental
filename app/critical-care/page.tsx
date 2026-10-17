import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { ClinicalSimulation } from "@/components/critical-care/ClinicalSimulation";
export const metadata: Metadata = { title: "Cuidados críticos", description: "Seis casos clínicos con paciente realista, ventilación, pruebas, medicación, fisiología dinámica y complicaciones." };
export default function CriticalCarePage() {
  return <div className="flex min-h-screen gap-5"><Sidebar/><main className="min-w-0 flex-1 pt-12 md:pt-4"><ClinicalSimulation mode="critical"/></main></div>;
}
