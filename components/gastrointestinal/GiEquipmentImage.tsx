import MaterialImage from "@/components/basic-care/MaterialImage";
import type { GiTool } from "@/src/lib/gastrointestinalSimulation";

const TILES: Partial<Record<GiTool, number>> = { thermometer: 0, cuff: 1, stethoscope: 2, ors: 3, jug: 4, sample: 5, medication: 6, call: 7, education: 8 };
export default function GiEquipmentImage({ tool }: { tool: GiTool }) {
  if (tool === "identity" || tool === "soap" || tool === "gloves") return <MaterialImage tool={tool}/>;
  if (tool === "hydration") return <MaterialImage tool="assess"/>;
  if (tool === "iv") return <MaterialImage tool="catheter" gauge={20}/>;
  const tile = TILES[tool] ?? 0;
  return <span aria-hidden="true" data-gi-image={tool} style={{ display: "block", width: "100%", height: "100%", backgroundImage: "url('/gastrointestinal/equipment-v1.webp')", backgroundSize: "300% 300%", backgroundPosition: `${tile % 3 * 50}% ${Math.floor(tile / 3) * 50}%`, backgroundRepeat: "no-repeat", borderRadius: "inherit" }}/>;
}
