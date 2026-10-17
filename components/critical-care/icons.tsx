import type { SVGProps } from "react";
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const paths: Record<string, React.ReactNode> = {
  Activity: <path d="M2 12h4l3-8 6 16 3-8h4"/>,
  ArrowRight: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  Check: <path d="m5 12 4 4L19 6"/>,
  CheckCircle2: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  ClipboardList: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 12h6M9 16h6"/></>,
  FlaskConical: <path d="M9 3h6m-5 0v7L5 19q-1 2 2 2h10q3 0 2-2l-5-9V3M8 15h8"/>,
  HeartPulse: <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 0 9 8 15 8-6 12-11 8-15ZM3 12h5l2-4 4 8 2-4h5"/>,
  Pause: <><path d="M7 4h3v16H7zM14 4h3v16h-3z"/></>,
  Play: <path d="m7 3 15 9-15 9Z"/>,
  RotateCcw: <path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>,
  ShieldCheck: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/></>,
  Stethoscope: <><path d="M5 3v5a5 5 0 0 0 10 0V3M4 3h3m6 0h3M10 13v4a4 4 0 0 0 8 0v-3"/><circle cx="18" cy="11" r="3"/></>,
  Wind: <path d="M3 7h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 17h5a3 3 0 1 1-3 3"/>,
};
function Icon({ name, size = 20, ...props }: IconProps & { name: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
export const Activity = (p: IconProps) => <Icon name="Activity" {...p}/>;
export const ArrowRight = (p: IconProps) => <Icon name="ArrowRight" {...p}/>;
export const Check = (p: IconProps) => <Icon name="Check" {...p}/>;
export const CheckCircle2 = (p: IconProps) => <Icon name="CheckCircle2" {...p}/>;
export const ClipboardList = (p: IconProps) => <Icon name="ClipboardList" {...p}/>;
export const FlaskConical = (p: IconProps) => <Icon name="FlaskConical" {...p}/>;
export const HeartPulse = (p: IconProps) => <Icon name="HeartPulse" {...p}/>;
export const Pause = (p: IconProps) => <Icon name="Pause" {...p}/>;
export const Play = (p: IconProps) => <Icon name="Play" {...p}/>;
export const RotateCcw = (p: IconProps) => <Icon name="RotateCcw" {...p}/>;
export const ShieldCheck = (p: IconProps) => <Icon name="ShieldCheck" {...p}/>;
export const Stethoscope = (p: IconProps) => <Icon name="Stethoscope" {...p}/>;
export const Wind = (p: IconProps) => <Icon name="Wind" {...p}/>;
