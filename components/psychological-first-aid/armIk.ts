import { Object3D, Quaternion, Vector3 } from "three";

/** Two-bone aim in world space; avoids assuming an imported rig's local elbow axis. */
export function aimPapArm(upper: Object3D, lower: Object3D, hand: Object3D, target: Vector3, pole: Vector3, weight: number) {
  if (weight < .001) return;
  upper.updateWorldMatrix(true, true);
  const shoulder = upper.getWorldPosition(new Vector3());
  const elbow = lower.getWorldPosition(new Vector3());
  const wrist = hand.getWorldPosition(new Vector3());
  const lengthA = shoulder.distanceTo(elbow); const lengthB = elbow.distanceTo(wrist);
  if (lengthA < .001 || lengthB < .001) return;
  const direction = target.clone().sub(shoulder);
  const distance = Math.max(Math.abs(lengthA - lengthB) + .001, Math.min(direction.length(), lengthA + lengthB - .001));
  direction.normalize();
  const bend = pole.clone().sub(direction.clone().multiplyScalar(pole.dot(direction))).normalize();
  const along = (lengthA * lengthA - lengthB * lengthB + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, lengthA * lengthA - along * along));
  const desiredElbow = shoulder.clone().addScaledVector(direction, along).addScaledVector(bend, height);
  const desiredWrist = shoulder.clone().addScaledVector(direction, distance);
  function aim(bone: Object3D, end: Object3D, point: Vector3) {
    bone.updateWorldMatrix(true, true);
    const origin = bone.getWorldPosition(new Vector3());
    const from = end.getWorldPosition(new Vector3()).sub(origin).normalize();
    const to = point.clone().sub(origin).normalize();
    const delta = new Quaternion().setFromUnitVectors(from, to);
    const world = delta.multiply(bone.getWorldQuaternion(new Quaternion()));
    const local = bone.parent ? bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world) : world;
    bone.quaternion.slerp(local, Math.min(1, Math.max(0, weight)));
    bone.updateWorldMatrix(false, true);
  }
  aim(upper, lower, desiredElbow); aim(lower, hand, desiredWrist);
}
