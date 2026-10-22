import type { PapMotion } from "@/src/lib/psychologicalFirstAid";

export function papBehavior(motion: PapMotion, time: number, sinceTurn: number, engaged: boolean, seated: boolean) {
  const cycle = time % 24;
  // Brief straight crossings with long pauses. Anger is expressed through gestures,
  // rather than making the patient orbit the room faster.
  const walking = !engaged && !seated && sinceTurn > 1.2 && motion === "pacing" && (cycle > 2 && cycle < 6 || cycle > 14 && cycle < 18);
  const glance = engaged ? 0 : motion === "withdrawing" ? -.22 : cycle > 10 && cycle < 13 ? -.25 : Math.sin(time * .65) * .035;
  const hands = motion === "agitated" ? .72 + Math.sin(time * 2.2) * .15 : motion === "tearful" ? .7 + Math.sin(time * .7) * .2 : 0;
  return { walking, glance, hands };
}

type Point = [number, number, number];
type Gesture = { name: string; left: Point; right: Point; weight: number };

/** Authored, bounded acting beats in actor-local metres; no clinical inference. */
export function papGesture(motion: PapMotion, age: number, time: number, engaged: boolean, seated: boolean): Gesture {
  const breath = Math.sin(time * 1.6) * .006;
  const rest: Gesture = { name: "escucha", left: [.17, seated ? .94 : .96, seated ? .33 : .14], right: [.17, seated ? .94 : .96, seated ? .33 : .14], weight: seated ? 1 : 0 };
  if (motion === "agitated") {
    if (age < 1.8) return { name: "marca-un-limite", left: [.25, 1.25, .37], right: [.16, 1.01, .19], weight: 1 };
    if (age < 4.2) return { name: "protesta", left: [.2, 1.03, .2], right: [.36, 1.17, .38], weight: 1 };
    if (age < 6.5) return { name: "retira-las-manos", left: [.14, .98, .16], right: [.14, .99, .16], weight: 1 };
    return { ...rest, name: "tension", left: [.17, .99, .17], right: [.18, .99, .18], weight: 1 };
  }
  if (motion === "withdrawing") return { name: "se-protege", left: [.12, 1.12, .24], right: [.13, 1.21, .23], weight: 1 };
  if (motion === "tearful") {
    if (age < 5) return { name: "se-limpia-el-rostro", left: [.13, 1.02, .2], right: [.1, 1.43, .12], weight: 1 };
    return { name: "llanto-con-pausas", left: [.12, 1.06 + breath, .23], right: [.11, 1.09 + breath, .24], weight: 1 };
  }
  if (motion === "guarded") return { name: "reserva", left: [.12, 1.04, .2], right: [.13, 1.06, .22], weight: .9 };
  if (motion === "recovering") return { ...rest, name: age < 3 ? "baja-la-tension" : "escucha-con-cautela" };
  if (motion === "pacing" && !engaged) return { name: "manos-inquietas", left: [.075, 1.01 + breath, .22], right: [.08, .99 - breath, .23], weight: .85 };
  return rest;
}

/** Local joint-space offsets blended over licensed idle/walk clips; not motion capture. */
export function papBodyPose(motion: PapMotion, time: number, age: number) {
  const settle = Math.min(1, age / .6);
  const zero = { armL: 0, armR: 0, elbowL: 0, elbowR: 0, armForward: 0, headDown: 0, headTurn: 0, spine: 0, sway: 0, walkSpeed: .65, ikWeight: 0 };
  if (motion === "agitated") return { ...zero, armL: -.2 * settle, armR: .22 * settle, elbowL: -.65, elbowR: -.75, armForward: -.3, headDown: .025, headTurn: age < 3 ? Math.sin(age * 5) * .085 : -.08, spine: -.025, sway: Math.sin(time * 1.7) * .004, walkSpeed: .65, ikWeight: 1 };
  if (motion === "withdrawing") return { ...zero, armL: -.18, armR: .22, elbowL: -.65, elbowR: -.7, headDown: .18, headTurn: -.28, spine: .09, walkSpeed: .45, ikWeight: 1 };
  if (motion === "tearful") return { ...zero, armL: -.12, armR: .3, elbowL: -.4, elbowR: -1.8, armForward: -.62, headDown: .28, spine: .11, sway: Math.sin(time * 3.2) * .008, ikWeight: 1 };
  if (motion === "recovering") return { ...zero, elbowL: -.25, elbowR: -.3, headDown: .04, headTurn: Math.sin(time) * .045, spine: .025 };
  if (motion === "guarded") return { ...zero, armL: -.1, armR: .1, elbowL: -.4, elbowR: -.45, headTurn: -.12, spine: .03 };
  return zero;
}
