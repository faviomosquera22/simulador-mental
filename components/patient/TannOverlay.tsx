import { useId } from "react";
export function TannOverlay({count,verified,active}:{count:number;verified:boolean;active:boolean}){
 const id=useId().replaceAll(":","");
 if(count===0)return null;
 const pair=(top:number,bottom:number,n:number)=><g data-tann-segment={n} className="tann-visual-part"><path d={`M302 ${top} Q394 ${top-13} 483 ${top} L483 ${bottom} Q392 ${bottom+15} 302 ${bottom}Z M541 ${top}Q630 ${top-13} 720 ${top} L720 ${bottom}Q631 ${bottom+15} 541 ${bottom}Z`}/><path d={`M310 ${top+25}H475M549 ${top+25}H712M310 ${bottom-24}H475M549 ${bottom-24}H712`} className="tann-velcro"/><text x="390" y={(top+bottom)/2+10}>{n}</text><text x="630" y={(top+bottom)/2+10}>{n}</text></g>;
 return <svg className="tann-segment-overlay" viewBox="0 0 1024 1536" role="img" aria-label={`Traje antichoque: ${count} de 6 segmentos visibles${verified?", colocación verificada":", pendiente de completar o verificar"}`} data-active={active} data-verified={verified}>
 <defs><linearGradient id={id} x2="1" y2=".5"><stop stopColor="#243b57"/><stop offset=".5" stopColor="#46627a"/><stop offset="1" stopColor="#1b314b"/></linearGradient></defs>
 <g fill={`url(#${id})`} stroke="#acc5ce" strokeWidth="3">
 {count>=1&&pair(1270,1400,1)}{count>=2&&pair(1095,1265,2)}{count>=3&&pair(915,1090,3)}
 {count>=4&&<g data-tann-segment="4" className="tann-visual-part"><path d="M292 765Q512 730 732 765L721 910Q512 940 303 910Z"/><path d="M310 792H714M310 878H714" className="tann-velcro"/><text x="512" y="850">4 · PELVIS</text></g>}
 {count>=5&&<g data-tann-segment="5" className="tann-visual-part"><path d="M325 605Q512 575 699 605L727 759Q512 795 297 759Z"/><ellipse cx="512" cy="690" rx="53" ry="46" fill="#71869a" stroke="#c0d2db" strokeWidth="5"/><text x="512" y="698">5</text></g>}
 {count>=6&&<g data-tann-segment="6" className="tann-visual-part"><path d="M310 640Q512 627 714 640L714 674Q512 659 310 674Z" fill="#152d44"/><rect x="520" y="635" width="125" height="45" rx="7" fill="#9fb0b6"/><rect x="535" y="643" width="94" height="28" rx="4" fill="#30475c"/><text x="580" y="665" fontSize="23">6</text></g>}
 </g></svg>;
}
