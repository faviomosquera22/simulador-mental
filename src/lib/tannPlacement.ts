/** Educational grouping of TANN placement, following MSP 2025, annex 8. */
export const TANN_SEGMENTS = [
 {number:1,id:"tann-1",label:"Tobillos",instruction:"Ajustar los componentes distales de ambas piernas; adaptar el extremo distal a la estatura."},
 {number:2,id:"tann-2",label:"Pantorrillas",instruction:"Continuar de forma ascendente por ambas pantorrillas y revisar el ajuste."},
 {number:3,id:"tann-3",label:"Muslos",instruction:"Cerrar los componentes de ambos muslos, manteniendo la secuencia ascendente."},
 {number:4,id:"tann-4",label:"Pelvis",instruction:"Ajustar el componente pélvico, preservando el acceso necesario para la atención."},
 {number:5,id:"tann-5",label:"Abdomen y esfera",instruction:"Ubicar el componente abdominal y la esfera de compresión sobre el útero según el dispositivo."},
 {number:6,id:"tann-6",label:"Fijación y velcros",instruction:"Fijar el componente abdominal con el segmento de tensión y comprobar los cierres."},
] as const;
export function tannPlacement(decisions:{id:string}[]){
 let count=0;
 for(const segment of TANN_SEGMENTS){if(!decisions.some(d=>d.id===segment.id))break;count++;}
 return {count,prepared:decisions.some(d=>d.id==="tann-prepare"),verified:count===6&&decisions.some(d=>d.id==="tann"),removed:decisions.some(d=>d.id==="tann-remove")};
}
