import type { CSSProperties } from "react";
import type { CareTool } from "@/src/lib/basicCareSimulation";
import { CATHETER_GAUGES, type CatheterGauge } from "@/src/lib/careEquipment";

const EQUIPMENT_TILES: Record<CareTool, number> = {
  catheter: 3, sharps: 6, soap: 7, kit: 8, gloves: 9, tourniquet: 10, antiseptic: 11, saline: 12, dressing: 13,
  identity: 14, position: 15, measure: 16, lubricant: 17, tube: 18, verifyTube: 26, record: 20,
  remove: 21, assess: 22, gauze: 23, cvc: 24, ultrasound: 25, verifyLine: 26, connector: 27,
};
/** Synthetic product photography is packaged locally as a 7 × 4 sprite sheet. */
export default function MaterialImage({ tool, className, gauge }: { tool: CareTool; className?: string; gauge?: CatheterGauge }) {
  const gaugeIndex = CATHETER_GAUGES.findIndex(item => item.gauge === gauge);
  const tile = tool === "catheter" && gaugeIndex >= 0 ? gaugeIndex : EQUIPMENT_TILES[tool];
  return <span className={className} aria-hidden="true" data-material-image={tool} data-gauge={gauge} style={{
    display: "block", width: "100%", height: "100%", minHeight: 24, backgroundImage: "url('/basic-care/realistic/equipment-v1.webp')",
    backgroundSize: "700% 400%", backgroundPosition: `${tile % 7 / 6 * 100}% ${Math.floor(tile / 7) / 3 * 100}%`, backgroundRepeat: "no-repeat", borderRadius: "inherit",
  } as CSSProperties}/>;
}
