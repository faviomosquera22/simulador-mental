import { useId, type CSSProperties } from "react";

/** External loss only. A retained stain must not imply that bleeding is still active. */
export function BleedingOverlay({ loss, rate, active, animated = false }: { loss: number; rate: number; active: boolean; animated?: boolean }) {
  const id = useId().replaceAll(":", "");
  if (loss <= 0 && rate <= 0) return null;
  const size = Math.min(1, Math.max(.16, loss / 1500));
  return <svg className="bleeding-overlay" viewBox="0 0 1024 1536" role="img" aria-label={rate > 0 ? "Sangrado externo activo sobre el paño de la camilla" : "Mancha de sangrado previo; sin sangrado activo"} data-flowing={active && rate > 0} style={{ "--bleed-duration": `${Math.max(.65, 5 - rate / 20)}s` } as CSSProperties}>
    <defs><radialGradient id={`blood-${id}`}><stop stopColor="#9d2634"/><stop offset=".6" stopColor="#761624"/><stop offset="1" stopColor="#4e1020" stopOpacity=".85"/></radialGradient></defs>
    <g transform={animated ? "translate(0 80)" : undefined}>
      <path d="M465 887Q512 860 559 887L568 1010Q510 1050 447 1010Z" fill="#f8eee4" opacity=".88"/>
      <g transform={`translate(512 940) scale(${size})`}><path d="M-80-27Q-110-70-42-74Q-9-110 30-75Q109-87 102-27Q151 12 93 48Q100 102 36 85Q-15 124-57 78Q-127 94-112 41Q-153 3-80-27Z" fill={`url(#blood-${id})`} opacity=".88"/><ellipse cx="0" cy="0" rx="65" ry="47" fill="#a33442" opacity=".32"/></g>
      {rate > 0 && <g className="blood-flow" fill="#a8192f"><path d="M505 875Q497 895 508 910Q518 919 522 908Q525 897 513 875Z"/><path d="M530 902Q517 925 529 935Q543 947 546 932Q548 921 537 902Z"/></g>}
    </g>
  </svg>;
}
