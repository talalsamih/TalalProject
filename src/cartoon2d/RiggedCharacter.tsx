import React from "react";
import { Pose } from "./poses";

/* 2D SVG rigged character. Hierarchical bone transforms:
     root > body > (head | leftArm > leftForearm | rightArm > rightForearm
                          | leftLeg > leftShin | rightLeg > rightShin)

   Coordinate system: SVG, +Y is down. All joint angles in degrees, rotating
   clockwise. Positive leftShoulder/rightShoulder raises the arm forward.
*/

type Props = {
  pose: Pose;
  worldX: number;
  worldY: number;
  size?: number; // scale multiplier
};

const Eye: React.FC<{ cx: number; blink: number; flipped?: boolean }> = ({
  cx,
  blink,
  flipped,
}) => {
  const ry = 10 * blink;
  return (
    <g>
      <ellipse cx={cx} cy={0} rx="8" ry={Math.max(0.5, ry)} fill="#2a1507" />
      <circle cx={cx + (flipped ? -2 : 2)} cy={-3} r="3" fill="#fff" opacity={blink > 0.5 ? 1 : 0} />
    </g>
  );
};

const Face: React.FC<{ expr: Pose["expression"]; blink: number }> = ({
  expr,
  blink,
}) => {
  const mouths: Record<Pose["expression"], React.ReactNode> = {
    smile: (
      <path d="M -12,18 Q 0,26 12,18" stroke="#2a1507" strokeWidth="3" fill="none" strokeLinecap="round" />
    ),
    happy: (
      <g>
        <path
          d="M -15,14 Q 0,32 15,14 Q 10,24 0,25 Q -10,24 -15,14 Z"
          fill="#7a1a2c"
          stroke="#2a1507"
          strokeWidth="2"
        />
        <path d="M -8,18 Q 0,22 8,18" stroke="#fff" strokeWidth="2.5" fill="none" />
      </g>
    ),
    surprise: (
      <ellipse cx="0" cy="20" rx="7" ry="10" fill="#2a1507" />
    ),
    serious: (
      <rect x="-11" y="18" width="22" height="4" rx="2" fill="#2a1507" />
    ),
    determined: (
      <path d="M -13,22 L 13,18" stroke="#2a1507" strokeWidth="4" fill="none" strokeLinecap="round" />
    ),
  };
  const eyebrow = (xOffset: number, flipped?: boolean) => {
    if (expr === "determined" || expr === "serious") {
      return (
        <path
          d={`M ${xOffset - 10},${-23} L ${xOffset + 10},${flipped ? -15 : -15}`}
          stroke="#2a1507"
          strokeWidth="5"
          strokeLinecap="round"
        />
      );
    }
    if (expr === "surprise") {
      return (
        <path
          d={`M ${xOffset - 9},${-22} Q ${xOffset},${-30} ${xOffset + 9},${-22}`}
          stroke="#2a1507"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <path
        d={`M ${xOffset - 9},${-20} Q ${xOffset},${-25} ${xOffset + 9},${-20}`}
        stroke="#2a1507"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    );
  };
  return (
    <g>
      {eyebrow(-18)}
      {eyebrow(18, true)}
      <Eye cx={-18} blink={blink} />
      <Eye cx={18} blink={blink} flipped />
      {/* cheeks */}
      <circle cx={-28} cy={10} r="6" fill="#ff9caa" opacity="0.85" />
      <circle cx={28} cy={10} r="6" fill="#ff9caa" opacity="0.85" />
      {/* nose */}
      <circle cx={0} cy={4} r="3" fill="#c77" />
      {mouths[expr]}
    </g>
  );
};

const Arm: React.FC<{
  shoulder: number;
  elbow: number;
  side: "left" | "right";
}> = ({ shoulder, elbow, side }) => {
  // Character's own left is on viewer's right when facing forward. We render
  // both in local space assuming character faces +X. The parent group mirrors
  // if facing = -1.
  const baseX = side === "left" ? -16 : 16;
  const upperLen = 40;
  const forearmLen = 38;
  const handR = 11;
  // shoulder=0 means arm hangs down. Positive = forward swing.
  const upperRot = shoulder;
  const forearmRot = elbow;

  return (
    <g transform={`translate(${baseX}, 10) rotate(${upperRot})`}>
      {/* Upper arm (shoulder to elbow) */}
      <rect
        x={-10}
        y={0}
        width={20}
        height={upperLen + 4}
        rx={10}
        fill="#ffd166"
        stroke="#8b5a18"
        strokeWidth="3"
      />
      <g transform={`translate(0, ${upperLen}) rotate(${forearmRot})`}>
        {/* Forearm */}
        <rect
          x={-9}
          y={0}
          width={18}
          height={forearmLen + 4}
          rx={9}
          fill="#ffe3a8"
          stroke="#8b5a18"
          strokeWidth="3"
        />
        {/* Hand (fist) */}
        <circle
          cx={0}
          cy={forearmLen + handR}
          r={handR}
          fill="#ffffff"
          stroke="#5c3a0f"
          strokeWidth="3"
        />
      </g>
    </g>
  );
};

const Leg: React.FC<{ hip: number; knee: number; side: "left" | "right" }> = ({
  hip,
  knee,
  side,
}) => {
  const baseX = side === "left" ? -15 : 15;
  const thighLen = 44;
  const shinLen = 42;
  return (
    <g transform={`translate(${baseX}, 95) rotate(${hip})`}>
      {/* Thigh */}
      <rect
        x={-11}
        y={0}
        width={22}
        height={thighLen + 4}
        rx={10}
        fill="#3a6fb8"
        stroke="#1e3d6e"
        strokeWidth="3"
      />
      <g transform={`translate(0, ${thighLen}) rotate(${knee})`}>
        {/* Shin */}
        <rect
          x={-10}
          y={0}
          width={20}
          height={shinLen + 4}
          rx={9}
          fill="#e8552e"
          stroke="#7c2410"
          strokeWidth="3"
        />
        {/* Foot (boot) */}
        <path
          d={`M -14,${shinLen + 2} L 20,${shinLen + 2} L 22,${shinLen + 16} L -14,${shinLen + 16} Z`}
          fill="#3a220f"
          stroke="#1b0f07"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

export const RiggedCharacter: React.FC<Props> = ({
  pose,
  worldX,
  worldY,
  size = 1,
}) => {
  const mirror = pose.facing === -1 ? -1 : 1;
  // Mirroring swaps left/right joints visually. We apply by flipping X scale
  // and negating shoulder/hip angles so the character still looks natural.
  const p = mirror === -1
    ? {
        ...pose,
        leftShoulder: -pose.leftShoulder,
        rightShoulder: -pose.rightShoulder,
        leftHip: -pose.leftHip,
        rightHip: -pose.rightHip,
        headTilt: -pose.headTilt,
        bodyLean: -pose.bodyLean,
      }
    : pose;

  return (
    <g
      transform={`translate(${worldX}, ${worldY + pose.rootYOffset}) rotate(${pose.rootRotation}) scale(${mirror * size}, ${size})`}
    >
      {/* Cape (behind body) */}
      {p.showCape && (
        <g transform="translate(0, 10)">
          <path
            d="M -35,-30 Q -75,10 -60,90 Q -30,70 0,60 Q 30,70 60,90 Q 75,10 35,-30 Z"
            fill="#b71c1c"
            stroke="#6b1010"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Body */}
      <g transform={`rotate(${p.bodyLean}) translate(0, ${p.bodyBounce})`}>
        {/* Torso */}
        <rect
          x={-28}
          y={10}
          width={56}
          height={85}
          rx={14}
          fill="#ff5252"
          stroke="#8b1414"
          strokeWidth="4"
        />
        {/* Belt */}
        <rect x={-30} y={85} width={60} height={14} rx={4} fill="#3a220f" stroke="#1b0f07" strokeWidth="3" />
        <rect x={-8} y={80} width={16} height={24} rx={3} fill="#ffd166" stroke="#8b5a18" strokeWidth="2" />

        {/* Legs (rendered under arms so arms appear in front) */}
        <Leg hip={p.leftHip} knee={p.leftKnee} side="left" />
        <Leg hip={p.rightHip} knee={p.rightKnee} side="right" />

        {/* Arms */}
        <Arm shoulder={p.leftShoulder} elbow={p.leftElbow} side="left" />
        <Arm shoulder={p.rightShoulder} elbow={p.rightElbow} side="right" />

        {/* Head */}
        <g transform={`translate(0, -40) rotate(${p.headTilt})`}>
          {/* Hair back */}
          <path
            d="M -54,-10 Q -60,-50 -10,-60 Q 20,-70 50,-55 Q 60,-20 54,-10 Z"
            fill="#3a1f0a"
            stroke="#1a0c04"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Face */}
          <ellipse cx={0} cy={0} rx={46} ry={50} fill="#ffdcb0" stroke="#8b5a18" strokeWidth="4" />
          {/* Hair front */}
          <path
            d="M -44,-22 Q -20,-55 10,-50 Q 40,-45 46,-20 Q 25,-38 -5,-35 Q -30,-30 -44,-22 Z"
            fill="#3a1f0a"
            stroke="#1a0c04"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Ears */}
          <ellipse cx={-46} cy={4} rx={5} ry={9} fill="#f5c28f" stroke="#8b5a18" strokeWidth="2" />
          <ellipse cx={46} cy={4} rx={5} ry={9} fill="#f5c28f" stroke="#8b5a18" strokeWidth="2" />
          <Face expr={p.expression} blink={p.blink} />
        </g>
      </g>
    </g>
  );
};
