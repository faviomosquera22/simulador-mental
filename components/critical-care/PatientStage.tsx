"use client";
import { TannOverlay } from "@/components/patient/TannOverlay";
import { BleedingOverlay } from "@/components/patient/BleedingOverlay";
import { OxygenOverlay } from "@/components/patient/OxygenOverlay";
import type { OxygenTherapy } from "@/src/lib/oxygenTherapy";
import { PatientView as Photograph } from "./PatientView";
import { scenarios, type ScenarioId, type Vitals } from "@/src/lib/criticalCareSimulation";
import { patientProfiles } from "@/src/lib/criticalCareObservation";

type Props = { scenario: ScenarioId; garment: number; selectedZone: number | null; assessed: number[]; running: boolean; oxygen: boolean; onAssess: (zone: number) => void; breathingRate: number; vitals?: Vitals; iv?: boolean; fluids?: boolean; view?: "animated" | "photo"; showPoints?: boolean; zoom?: boolean; monitoring?: boolean; oxygenTherapy?: OxygenTherapy | null; bleedingRate?: number };
export function PatientStage(props: Props) {
  if (props.view === "photo") return <Photograph {...props}/>;
  const { scenario, running, vitals, onAssess, selectedZone, assessed, oxygen, iv, fluids, showPoints=true, zoom=false, monitoring } = props;
  const profile = patientProfiles[scenario];
  const skin = vitals && vitals.sbp < 90 ? "#d5bcb0" : "#dbaf94";
  const hair = profile.age > 60 ? "#babbb5" : "#4d4946";
  const points = [{x:68,y:23},{x:50,y:40},{x:40,y:54},{x:57,y:73}];
  return <div className={`animated-patient-stage ${zoom ? "patient-closeup" : ""}`} data-running={running} style={{"--breath-duration": `${60/Math.max(6,props.breathingRate)}s` } as React.CSSProperties}>
    <svg viewBox="0 0 600 900" className="animated-patient" role="img" aria-label={`Paciente ficticio ${scenarios[scenario].patient}, ilustración animada en una camilla`}>
      <defs>
        <linearGradient id="bed-sheet" x2="1" y2="1"><stop stopColor="#f4f8f7"/><stop offset=".5" stopColor="#d9e7e7"/><stop offset="1" stopColor="#afc9cc"/></linearGradient>
        <linearGradient id="patient-blanket" x2="1" y2=".4"><stop stopColor="#5c8e9c"/><stop offset=".45" stopColor="#a4c9d2"/><stop offset="1" stopColor="#5b8796"/></linearGradient>
        <radialGradient id="patient-skin"><stop stopColor={skin}/><stop offset=".8" stopColor={skin}/><stop offset="1" stopColor="#b18a78"/></radialGradient>
        <linearGradient id="patient-gown" x2="1" y2="1"><stop stopColor="#c2d6d4"/><stop offset=".55" stopColor="#e3eeea"/><stop offset="1" stopColor="#94b1af"/></linearGradient>
        <filter id="bed-shadow"><feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#0b292c" floodOpacity=".3"/></filter>
      </defs>
      <ellipse cx="300" cy="800" rx="220" ry="42" fill="#0b242d" opacity=".13"/>
      <g filter="url(#bed-shadow)"><rect x="89" y="75" width="422" height="767" rx="50" fill="#8aa6ab"/><rect x="103" y="87" width="394" height="738" rx="43" fill="url(#bed-sheet)"/>
        <path d="M92 260V650M508 260V650" stroke="#d7e3e4" strokeWidth="14" strokeLinecap="round"/><path d="M84 297V625M516 297V625" stroke="#78949b" strokeWidth="5" strokeLinecap="round"/>
        <rect x="150" y="114" width="300" height="169" rx="37" fill="#f4f8f7" transform="rotate(-3 300 200)"/><path d="M169 142Q300 127 429 143M170 246Q300 267 429 243" stroke="#cbdad9" strokeWidth="3" fill="none"/>
      </g>
      <g className="patient-body">
        <path d="M275 245V287Q300 313 325 287V245" fill="url(#patient-skin)"/>
        <g className="patient-head"><ellipse cx="300" cy="208" rx="61" ry="78" fill="url(#patient-skin)"/>
          <ellipse cx="240" cy="215" rx="10" ry="19" fill={skin}/><ellipse cx="360" cy="215" rx="10" ry="19" fill={skin}/>
          <path d="M242 202Q223 139 264 129Q310 105 348 139Q370 162 357 199L345 164Q308 155 276 164L253 182Z" fill={hair}/>
          <path d="M253 168Q275 126 329 146" fill="none" stroke="#ffffff" strokeWidth="7" opacity=".15"/>
          <path d="M260 194Q274 186 287 195M314 195Q329 187 341 197" stroke="#6c5b52" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <g className={vitals && vitals.gcs < 10 ? "patient-eyes drowsy" : "patient-eyes"}><ellipse cx="275" cy="208" rx="12" ry="6" fill="#eeeae0"/><ellipse cx="327" cy="208" rx="12" ry="6" fill="#eeeae0"/><circle cx="275" cy="208" r="4" fill="#5b655d"/><circle cx="327" cy="208" r="4" fill="#5b655d"/><circle cx="276" cy="207" r="1" fill="white"/><circle cx="328" cy="207" r="1" fill="white"/></g>
          <path d="M299 207L294 231Q300 236 308 231" fill="none" stroke="#aa7e6b" strokeWidth="2" strokeLinecap="round"/>
          <path d="M282 252Q300 246 319 252Q303 264 286 255" fill="#9d6f63"/><path d="M286 252L315 252" stroke="#d5b4a2" strokeWidth="2"/>
          {profile.age>60 && <path d="M255 223l13 4m63 0 13-4m-87-41q18-5 31 0m25 0q16-5 28 1" stroke="#b68b77" fill="none" strokeWidth="1.5"/>}
        </g>
        <g className="patient-chest"><path d="M273 276Q232 272 212 300L190 416L227 435L244 367L238 530Q300 552 362 530L356 367L374 435L410 416L388 300Q369 272 327 276Q304 300 273 276Z" fill="url(#patient-gown)" stroke="#96afad" strokeWidth="2"/>
          <path d="M273 278Q300 310 328 278M301 310V501M250 334Q260 418 249 483M350 334Q340 419 351 481" fill="none" stroke="#9fb9b6" strokeWidth="2" opacity=".7"/>
          {Array.from({length:7},(_,i)=><g key={i} fill="#8ca8a4" opacity=".45">{Array.from({length:6},(_,j)=><circle key={j} cx={252+j*19} cy={330+i*24} r="1.4"/>)}</g>)}
        </g>
        <path d="M192 411Q177 468 177 515Q178 543 193 557L211 551Q210 520 216 501L229 429" fill="url(#patient-skin)"/>
        <g className="patient-hand"><path d="M177 526Q174 542 179 564L187 589Q191 594 194 587L189 562L200 594Q205 599 207 591L199 559L210 585Q215 589 216 582L208 553L219 568Q224 572 226 566L207 537L211 519" fill="url(#patient-skin)" stroke="#b5907c" strokeWidth="1.2"/></g>
        <path d="M409 411Q423 465 423 510Q423 538 409 553L389 548Q390 516 384 498L373 430" fill="url(#patient-skin)"/>
        <path d="M422 525Q427 547 420 566L411 590Q407 595 404 587L410 561L398 593Q393 598 391 591L400 558L389 585Q383 590 382 582L390 552L379 566Q374 571 373 565L392 536L389 519" fill="url(#patient-skin)" stroke="#b5907c" strokeWidth="1.2"/>
        <path d="M229 501Q300 518 372 500L430 780Q368 810 300 807Q224 812 170 780Z" fill="url(#patient-blanket)" stroke="#799da7" strokeWidth="2"/>
        <path d="M231 517Q300 541 372 515M232 575Q260 590 274 673L270 790M366 568Q340 618 337 787M208 706Q216 752 228 780M385 710Q377 755 373 784M297 534L300 792" stroke="#d5e5e7" opacity=".3" strokeWidth="4" fill="none"/>
      </g>
      {monitoring && <g stroke="#476b63" fill="#e9eeea" strokeWidth="2"><circle cx="266" cy="350" r="7"/><circle cx="338" cy="352" r="7"/><circle cx="324" cy="418" r="7"/><path d="M266 350Q165 330 78 390M338 352Q174 356 78 400M324 418Q158 401 78 409" fill="none" strokeWidth="2"/></g>}

      {scenario==="ventilation" && <g><path d="M299 250L258 263L200 325H63" stroke="#85cbd3" strokeWidth="14" fill="none"/><path d="M299 250L258 263L200 325H63" stroke="#ddf2ed" strokeWidth="5" strokeDasharray="3 5" fill="none"/><rect x="284" y="246" width="35" height="9" rx="3" fill="#edeee0"/></g>}
      {iv && <g><rect x="173" y="505" width="43" height="24" rx="5" fill="#f6f9ed" opacity=".85"/><path d="M192 514L180 494" stroke="#80bec4" strokeWidth="5"/>{fluids && <><path d="M539 163V680" stroke="#b9cbcd" strokeWidth="6"/><rect x="514" y="176" width="52" height="99" rx="8" fill="#e8f5ed" opacity=".9"/><path d="M540 275V438Q535 595 201 518" stroke="#b7e8ea" strokeWidth="3" fill="none"/><rect x="526" y="195" width="27" height="38" rx="3" fill="#c1dbd3"/></>}</g>}
    </svg>
    {oxygen && props.oxygenTherapy && <OxygenOverlay therapy={props.oxygenTherapy} animated/>}
    {scenario === "obstetric" && <TannOverlay count={Math.min(6,Math.max(0,props.garment-1))} verified={props.garment>=8} active={running} illustrated/>}
    <BleedingOverlay loss={vitals?.bloodLoss ?? 0} rate={props.bleedingRate ?? 0} active={running} animated/>
    {showPoints && points.map((point,i)=><button key={i} type="button" className={`stage-hotspot ${selectedZone===i?"selected":""} ${assessed.includes(i)?"assessed":""}`} style={{left:`${point.x}%`,top:`${point.y}%`}} disabled={!running} onClick={()=>onAssess(i)} aria-label={`Explorar zona ${i+1}: ${scenarios[scenario].zones[i].label}`} aria-pressed={selectedZone===i}>{assessed.includes(i)?"✓":String(i+1).padStart(2,"0")}</button>)}
  </div>;
}
