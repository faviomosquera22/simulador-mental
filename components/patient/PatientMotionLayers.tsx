"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import "./patient-motion.css";

type Props={source:string;expression:string;active:boolean;breathingRate:number;filter?:string;expressive?:boolean};
export function PatientMotionLayers({source,expression,active,breathingRate,filter,expressive=true}:Props){
 const style={"--motion-breath-duration":`${60/Math.max(6,breathingRate)}s`,filter} as CSSProperties;
 return <>
  <div className="patient-motion-layer patient-motion-chest" data-active={active} aria-hidden="true" style={style}><Image src={source} alt="" fill sizes="(max-width:760px) 100vw, 600px"/></div>
  {expressive&&<><div className="patient-motion-layer patient-motion-eyes" data-active={active} aria-hidden="true" style={{filter}}><Image src={expression} alt="" fill sizes="(max-width:760px) 100vw, 600px"/></div><div className="patient-motion-layer patient-motion-mouth" data-active={active} aria-hidden="true" style={{filter}}><Image src={expression} alt="" fill sizes="(max-width:760px) 100vw, 600px"/></div></>}
 </>;
}
