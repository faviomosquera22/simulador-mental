import type { Metadata } from "next";
import BasicCareSimulator from "@/components/basic-care/BasicCareSimulator";

export const metadata: Metadata = { title: "Cuidados básicos interactivos", description: "Laboratorio virtual con pacientes de apariencia real, selección de calibre, inventario de material usado, arrastre, cuidados de CVC y 16 escenarios de enfermería." };
export default function BasicCarePage() { return <BasicCareSimulator/>; }
