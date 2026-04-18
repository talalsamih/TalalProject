/* 2D rigged character - SVG skeleton with forward-kinematic joints.
   All joint angles are in degrees. Character faces +X when facing=1. */

export type Pose = {
  // world placement (applied by scene, not by poses)
  facing: 1 | -1;
  rootYOffset: number; // extra vertical lift (jumps)
  rootRotation: number; // body spin (backflip)
  // torso/head
  bodyLean: number;
  bodyBounce: number;
  headTilt: number;
  // arms
  leftShoulder: number;
  leftElbow: number;
  rightShoulder: number;
  rightElbow: number;
  // legs
  leftHip: number;
  leftKnee: number;
  rightHip: number;
  rightKnee: number;
  // face
  expression: "smile" | "happy" | "surprise" | "serious" | "determined";
  blink: number; // 0-1, 1 = open
  // props
  showCape: boolean;
};

export const DEFAULT_POSE: Pose = {
  facing: 1,
  rootYOffset: 0,
  rootRotation: 0,
  bodyLean: 0,
  bodyBounce: 0,
  headTilt: 0,
  leftShoulder: -5,
  leftElbow: 15,
  rightShoulder: 5,
  rightElbow: -15,
  leftHip: 0,
  leftKnee: 0,
  rightHip: 0,
  rightKnee: 0,
  expression: "smile",
  blink: 1,
  showCape: false,
};

const TAU = Math.PI * 2;
const sin = (phase: number) => Math.sin(phase * TAU);
const cos = (phase: number) => Math.cos(phase * TAU);

/* Idle: subtle breathing bob + occasional head tilt */
export function idlePose(t: number): Pose {
  const phase = t * 0.5;
  return {
    ...DEFAULT_POSE,
    bodyBounce: Math.abs(sin(phase)) * -2,
    headTilt: sin(phase * 0.5) * 3,
    leftShoulder: -5 + sin(phase) * 2,
    rightShoulder: 5 + sin(phase) * 2,
    blink: (t % 3) > 2.85 ? 0.1 : 1,
  };
}

/* Classic walk cycle - opposing arm/leg swing, 1s per full cycle */
export function walkPose(t: number): Pose {
  const phase = t * 1.0;
  const s = sin(phase);
  const s2 = sin(phase * 2);
  return {
    ...DEFAULT_POSE,
    bodyLean: 4,
    bodyBounce: Math.abs(s2) * -3 - 1,
    headTilt: sin(phase * 0.5) * 2,
    leftShoulder: -10 + s * 25,
    leftElbow: 20 + Math.max(0, s) * 15,
    rightShoulder: 10 - s * 25,
    rightElbow: -20 - Math.max(0, -s) * 15,
    leftHip: -s * 28,
    leftKnee: Math.max(0, s) * 50,
    rightHip: s * 28,
    rightKnee: Math.max(0, -s) * 50,
  };
}

/* Run cycle - amplified, more lean, knees high */
export function runPose(t: number): Pose {
  const phase = t * 1.6;
  const s = sin(phase);
  const s2 = sin(phase * 2);
  return {
    ...DEFAULT_POSE,
    bodyLean: 16,
    bodyBounce: Math.abs(s2) * -5 - 2,
    headTilt: sin(phase * 0.5) * 2,
    leftShoulder: -15 + s * 55,
    leftElbow: 75 + Math.max(0, s) * 10,
    rightShoulder: 15 - s * 55,
    rightElbow: -75 - Math.max(0, -s) * 10,
    leftHip: -s * 50,
    leftKnee: Math.max(0, s) * 95 + 10,
    rightHip: s * 50,
    rightKnee: Math.max(0, -s) * 95 + 10,
    expression: "determined",
  };
}

/* Sneak - crouched slow walk */
export function sneakPose(t: number): Pose {
  const phase = t * 0.6;
  const s = sin(phase);
  return {
    ...DEFAULT_POSE,
    bodyLean: 28,
    bodyBounce: -14 + Math.abs(sin(phase * 2)) * -2,
    headTilt: -8,
    leftShoulder: -35 + s * 15,
    leftElbow: 60,
    rightShoulder: -35 - s * 15,
    rightElbow: -60,
    leftHip: -s * 20 - 10,
    leftKnee: 40 + Math.max(0, s) * 25,
    rightHip: s * 20 - 10,
    rightKnee: 40 + Math.max(0, -s) * 25,
    expression: "serious",
  };
}

/* Jump phases: crouch -> launch -> tuck -> extend -> land.
   Returns pose AND suggested vertical offset for the root (scene may override).
*/
export function jumpPose(phase: number): Pose {
  // phase in [0,1]
  const clampedPhase = Math.max(0, Math.min(1, phase));
  if (clampedPhase < 0.15) {
    // crouch
    const t = clampedPhase / 0.15;
    return {
      ...DEFAULT_POSE,
      bodyLean: 15,
      bodyBounce: 16 * t,
      leftShoulder: -40 - 20 * t,
      rightShoulder: 40 + 20 * t,
      leftElbow: 30,
      rightElbow: -30,
      leftHip: -20 * t,
      leftKnee: 70 * t,
      rightHip: -20 * t,
      rightKnee: 70 * t,
      expression: "determined",
    };
  }
  if (clampedPhase < 0.3) {
    // launch
    const t = (clampedPhase - 0.15) / 0.15;
    return {
      ...DEFAULT_POSE,
      bodyLean: 15 - 20 * t,
      bodyBounce: 16 - 20 * t,
      leftShoulder: -60 + 140 * t,
      rightShoulder: 60 - 140 * t,
      leftElbow: 30 - 20 * t,
      rightElbow: -30 + 20 * t,
      leftHip: -20 + 20 * t,
      leftKnee: 70 - 50 * t,
      rightHip: -20 + 20 * t,
      rightKnee: 70 - 50 * t,
      expression: "surprise",
    };
  }
  if (clampedPhase < 0.7) {
    // tuck
    const t = (clampedPhase - 0.3) / 0.4;
    const tuck = Math.sin(t * Math.PI);
    return {
      ...DEFAULT_POSE,
      bodyLean: -5,
      bodyBounce: -10,
      leftShoulder: 80 + tuck * 20,
      rightShoulder: -80 - tuck * 20,
      leftElbow: 10,
      rightElbow: -10,
      leftHip: -30 - tuck * 40,
      leftKnee: 20 + tuck * 60,
      rightHip: -30 - tuck * 40,
      rightKnee: 20 + tuck * 60,
      expression: "happy",
    };
  }
  if (clampedPhase < 0.85) {
    // extend for landing
    const t = (clampedPhase - 0.7) / 0.15;
    return {
      ...DEFAULT_POSE,
      bodyLean: 5 * t,
      bodyBounce: -4,
      leftShoulder: 100 - 80 * t,
      rightShoulder: -100 + 80 * t,
      leftElbow: 10,
      rightElbow: -10,
      leftHip: -60 + 60 * t,
      leftKnee: 60 - 60 * t,
      rightHip: -60 + 60 * t,
      rightKnee: 60 - 60 * t,
      expression: "determined",
    };
  }
  // land
  const t = (clampedPhase - 0.85) / 0.15;
  const squash = Math.sin(t * Math.PI);
  return {
    ...DEFAULT_POSE,
    bodyLean: 10 + squash * 10,
    bodyBounce: 12 * squash,
    leftShoulder: 20,
    rightShoulder: -20,
    leftElbow: 30,
    rightElbow: -30,
    leftHip: -8,
    leftKnee: 50 * squash,
    rightHip: 8,
    rightKnee: 50 * squash,
    expression: "happy",
  };
}

/* Dance: rhythmic bounce + arm waves */
export function dancePose(t: number): Pose {
  const beat = t * 2; // 2 beats per second
  const s = sin(beat);
  const s2 = sin(beat * 0.5);
  const up = Math.abs(s);
  return {
    ...DEFAULT_POSE,
    bodyLean: s2 * 8,
    bodyBounce: -up * 6,
    headTilt: s2 * 10,
    leftShoulder: -120 + s * 30,
    rightShoulder: 120 - s * 30,
    leftElbow: -20 + s * 30,
    rightElbow: 20 - s * 30,
    leftHip: s2 * 15,
    leftKnee: up * 20,
    rightHip: -s2 * 15,
    rightKnee: (1 - up) * 20,
    expression: "happy",
  };
}

/* Dance 2: groovy side-step with arms out */
export function dance2Pose(t: number): Pose {
  const beat = t * 2;
  const s = sin(beat);
  return {
    ...DEFAULT_POSE,
    bodyLean: s * 10,
    bodyBounce: Math.abs(sin(beat * 2)) * -5,
    headTilt: s * 12,
    leftShoulder: -70 + s * 40,
    rightShoulder: 70 - s * 40,
    leftElbow: 30 - s * 20,
    rightElbow: -30 + s * 20,
    leftHip: s * 25,
    leftKnee: Math.max(0, s) * 25,
    rightHip: -s * 25,
    rightKnee: Math.max(0, -s) * 25,
    expression: "happy",
  };
}

/* Wave: right hand up, wave at elbow */
export function wavePose(t: number): Pose {
  const phase = t * 3;
  return {
    ...DEFAULT_POSE,
    bodyBounce: Math.abs(sin(phase * 0.2)) * -2,
    headTilt: 4,
    leftShoulder: -10,
    leftElbow: 20,
    rightShoulder: 150,
    rightElbow: -30 + sin(phase) * 25,
    expression: "happy",
  };
}

/* Double wave: both hands up */
export function doubleWavePose(t: number): Pose {
  const phase = t * 3;
  const s = sin(phase);
  return {
    ...DEFAULT_POSE,
    bodyBounce: Math.abs(sin(phase * 0.2)) * -3,
    headTilt: sin(phase * 0.5) * 6,
    leftShoulder: -150,
    leftElbow: 30 - s * 20,
    rightShoulder: 150,
    rightElbow: -30 + s * 20,
    expression: "happy",
  };
}

/* Kick: right leg front snap kick */
export function kickPose(phase: number): Pose {
  const clampedPhase = Math.max(0, Math.min(1, phase));
  if (clampedPhase < 0.3) {
    // wind up
    const t = clampedPhase / 0.3;
    return {
      ...DEFAULT_POSE,
      bodyLean: -10 * t,
      leftShoulder: -30 - 20 * t,
      rightShoulder: 80 * t,
      leftElbow: 50,
      rightElbow: -90 * t,
      leftHip: 0,
      rightHip: 40 * t,
      rightKnee: 80 * t,
      expression: "determined",
    };
  }
  if (clampedPhase < 0.55) {
    // snap
    const t = (clampedPhase - 0.3) / 0.25;
    return {
      ...DEFAULT_POSE,
      bodyLean: -10 - 15 * t,
      leftShoulder: -60 - 40 * t,
      rightShoulder: 80 + 60 * t,
      leftElbow: 50,
      rightElbow: -90,
      leftHip: -10 * t,
      leftKnee: 10 * t,
      rightHip: 40 + 50 * t,
      rightKnee: 80 - 60 * t,
      expression: "serious",
    };
  }
  if (clampedPhase < 0.8) {
    // hold then retract
    const t = (clampedPhase - 0.55) / 0.25;
    return {
      ...DEFAULT_POSE,
      bodyLean: -25 + 25 * t,
      leftShoulder: -100 + 95 * t,
      rightShoulder: 140 - 135 * t,
      leftElbow: 50,
      rightElbow: -90 + 75 * t,
      leftHip: -10 + 10 * t,
      leftKnee: 10,
      rightHip: 90 - 90 * t,
      rightKnee: 20 + 20 * t,
      expression: "serious",
    };
  }
  // recover
  const t = (clampedPhase - 0.8) / 0.2;
  return {
    ...DEFAULT_POSE,
    bodyLean: 0,
    leftShoulder: -5,
    rightShoulder: 5,
    leftElbow: 15,
    rightElbow: -15,
    leftHip: 0,
    leftKnee: 0,
    rightHip: 0,
    rightKnee: 20 - 20 * t,
    expression: "happy",
  };
}

/* Backflip - pose is airborne tuck; scene handles rotation */
export function backflipPose(phase: number): Pose {
  const clampedPhase = Math.max(0, Math.min(1, phase));
  if (clampedPhase < 0.15) {
    // crouch
    const t = clampedPhase / 0.15;
    return {
      ...DEFAULT_POSE,
      bodyLean: 15,
      bodyBounce: 14 * t,
      leftHip: -10,
      leftKnee: 60 * t,
      rightHip: -10,
      rightKnee: 60 * t,
      leftShoulder: -60,
      rightShoulder: 60,
      expression: "determined",
    };
  }
  if (clampedPhase < 0.9) {
    // tucked flight
    return {
      ...DEFAULT_POSE,
      bodyLean: 0,
      bodyBounce: -10,
      leftShoulder: 60,
      rightShoulder: -60,
      leftElbow: 40,
      rightElbow: -40,
      leftHip: -60,
      leftKnee: 100,
      rightHip: -60,
      rightKnee: 100,
      expression: "surprise",
    };
  }
  // land
  const t = (clampedPhase - 0.9) / 0.1;
  return {
    ...DEFAULT_POSE,
    bodyLean: 10 - 10 * t,
    bodyBounce: 8 * Math.sin(t * Math.PI),
    leftShoulder: 30 - 35 * t,
    rightShoulder: -30 + 35 * t,
    leftElbow: 20,
    rightElbow: -20,
    leftKnee: 40 * (1 - t),
    rightKnee: 40 * (1 - t),
    expression: "happy",
  };
}

/* Heroic victory - fist in air */
export function victoryPose(t: number): Pose {
  const s = sin(t * 1);
  return {
    ...DEFAULT_POSE,
    bodyBounce: Math.abs(s) * -4 - 2,
    headTilt: 0,
    leftShoulder: -10,
    leftElbow: 30,
    rightShoulder: 170,
    rightElbow: -10,
    leftHip: -5,
    rightHip: 5,
    expression: "happy",
    showCape: true,
  };
}

/* Bow - lean forward deeply */
export function bowPose(phase: number): Pose {
  const clampedPhase = Math.max(0, Math.min(1, phase));
  const lean = clampedPhase < 0.5
    ? (clampedPhase / 0.5) * 55
    : 55 - ((clampedPhase - 0.5) / 0.5) * 55;
  return {
    ...DEFAULT_POSE,
    bodyLean: lean,
    leftShoulder: -30,
    rightShoulder: 30,
    leftElbow: 15,
    rightElbow: -15,
    expression: "smile",
  };
}

/* Linear interpolate two poses for crossfading */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    facing: t < 0.5 ? a.facing : b.facing,
    rootYOffset: lerp(a.rootYOffset, b.rootYOffset),
    rootRotation: lerp(a.rootRotation, b.rootRotation),
    bodyLean: lerp(a.bodyLean, b.bodyLean),
    bodyBounce: lerp(a.bodyBounce, b.bodyBounce),
    headTilt: lerp(a.headTilt, b.headTilt),
    leftShoulder: lerp(a.leftShoulder, b.leftShoulder),
    leftElbow: lerp(a.leftElbow, b.leftElbow),
    rightShoulder: lerp(a.rightShoulder, b.rightShoulder),
    rightElbow: lerp(a.rightElbow, b.rightElbow),
    leftHip: lerp(a.leftHip, b.leftHip),
    leftKnee: lerp(a.leftKnee, b.leftKnee),
    rightHip: lerp(a.rightHip, b.rightHip),
    rightKnee: lerp(a.rightKnee, b.rightKnee),
    expression: t < 0.5 ? a.expression : b.expression,
    blink: lerp(a.blink, b.blink),
    showCape: t < 0.5 ? a.showCape : b.showCape,
  };
}
