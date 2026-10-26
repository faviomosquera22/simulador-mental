import type { Metadata } from "next";
import GastrointestinalSimulator from "@/components/gastrointestinal/GastrointestinalSimulator";

export const metadata: Metadata = { title: "Infecciones gastrointestinales · Simulación clínica", description: "Atiende a un adulto con gastroenteritis: valoración, materiales interactivos, rehidratación oral, balance, reevaluación y respuesta al deterioro." };
export default function GastrointestinalPage() { return <GastrointestinalSimulator/>; }
