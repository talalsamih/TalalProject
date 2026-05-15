import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  Pose,
  DEFAULT_POSE,
  idlePose,
  walkPose,
  runPose,
  jumpPose,
  dancePose,
  dance2Pose,
  wavePose,
  doubleWavePose,
  kickPose,
  backflipPose,
  sneakPose,
  victoryPose,
  bowPose,
  lerpPose,
} from "./cartoon2d/poses";
import { Backdrop, BackdropName } from "./cartoon2d/Backdrops";
import { RiggedCharacter } from "./cartoon2d/RiggedCharacter";

type PoseKind =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "dance"
  | "dance2"
  | "wave"
  | "doubleWave"
  | "kick"
  | "backflip"
  | "sneak"
  | "victory"
  | "bow";

type Motion =
  | { kind: "still" }
  | { kind: "walk"; direction: 1 | -1 }
  | { kind: "run"; direction: 1 | -1 }
  | { kind: "jump"; height: number; distance: number; direction: 1 | -1 }
  | { kind: "backflip"; height: number; direction: 1 | -1 }
  | { kind: "sneak"; direction: 1 | -1 };

type Segment = {
  start: number;
  end: number;
  pose: PoseKind;
  motion: Motion;
  backdrop: BackdropName;
  label: string;
};

const TIMELINE: Segment[] = [
  { start: 0, end: 3, pose: "idle", motion: { kind: "still" }, backdrop: "sunnyPark", label: "Hello there!" },
  { start: 3, end: 6, pose: "wave", motion: { kind: "still" }, backdrop: "sunnyPark", label: "Wave" },
  { start: 6, end: 12, pose: "walk", motion: { kind: "walk", direction: 1 }, backdrop: "sunnyPark", label: "Walking" },
  { start: 12, end: 13.5, pose: "idle", motion: { kind: "still" }, backdrop: "sunnyPark", label: "Turn around" },
  { start: 13.5, end: 18.5, pose: "run", motion: { kind: "run", direction: -1 }, backdrop: "sunnyPark", label: "Running" },
  { start: 18.5, end: 20.5, pose: "jump", motion: { kind: "jump", height: 180, distance: 160, direction: -1 }, backdrop: "sunnyPark", label: "Jump!" },
  { start: 20.5, end: 22.5, pose: "jump", motion: { kind: "jump", height: 240, distance: 200, direction: -1 }, backdrop: "sunnyPark", label: "Higher jump" },
  { start: 22.5, end: 27, pose: "dance", motion: { kind: "still" }, backdrop: "neonCity", label: "Disco dance" },
  { start: 27, end: 30, pose: "dance2", motion: { kind: "still" }, backdrop: "neonCity", label: "Groove" },
  { start: 30, end: 32, pose: "kick", motion: { kind: "still" }, backdrop: "dojo", label: "Snap kick!" },
  { start: 32, end: 34, pose: "kick", motion: { kind: "still" }, backdrop: "dojo", label: "Hi-yah!" },
  { start: 34, end: 37, pose: "sneak", motion: { kind: "sneak", direction: 1 }, backdrop: "alley", label: "Sneaking" },
  { start: 37, end: 42, pose: "run", motion: { kind: "run", direction: 1 }, backdrop: "forest", label: "Forest sprint" },
  { start: 42, end: 44.5, pose: "backflip", motion: { kind: "backflip", height: 260, direction: 1 }, backdrop: "beach", label: "Backflip!" },
  { start: 44.5, end: 47.5, pose: "doubleWave", motion: { kind: "still" }, backdrop: "beach", label: "Yay!" },
  { start: 47.5, end: 51, pose: "victory", motion: { kind: "still" }, backdrop: "sunset", label: "Hero!" },
  { start: 51, end: 56, pose: "run", motion: { kind: "run", direction: 1 }, backdrop: "rainbow", label: "Victory lap" },
  { start: 56, end: 58, pose: "jump", motion: { kind: "jump", height: 220, distance: 100, direction: 1 }, backdrop: "rainbow", label: "Finale!" },
  { start: 58, end: 60, pose: "bow", motion: { kind: "still" }, backdrop: "stage", label: "Thank you!" },
];

const TOTAL_SECONDS = 60;
const CROSSFADE = 0.4;

function getSegment(time: number) {
  for (let i = 0; i < TIMELINE.length; i++) {
    const s = TIMELINE[i];
    if (time >= s.start && time < s.end) {
      return { seg: s, idx: i, local: (time - s.start) / (s.end - s.start) };
    }
  }
  const s = TIMELINE[TIMELINE.length - 1];
  return { seg: s, idx: TIMELINE.length - 1, local: 1 };
}

function computePose(kind: PoseKind, time: number, localPhase: number): Pose {
  switch (kind) {
    case "idle":
      return idlePose(time);
    case "walk":
      return walkPose(time);
    case "run":
      return runPose(time);
    case "jump":
      return jumpPose(localPhase);
    case "dance":
      return dancePose(time);
    case "dance2":
      return dance2Pose(time);
    case "wave":
      return wavePose(time);
    case "doubleWave":
      return doubleWavePose(time);
    case "kick":
      return kickPose(localPhase);
    case "backflip":
      return backflipPose(localPhase);
    case "sneak":
      return sneakPose(time);
    case "victory":
      return victoryPose(time);
    case "bow":
      return bowPose(localPhase);
  }
}

function motionTransform(motion: Motion, local: number): {
  rootYOffset: number;
  rootRotation: number;
  facing: 1 | -1;
  scrollDelta: number; // contribution to scene scroll for this segment
  sceneSpeed: number; // current scroll velocity in pixels/sec
} {
  switch (motion.kind) {
    case "still":
      return { rootYOffset: 0, rootRotation: 0, facing: 1, scrollDelta: 0, sceneSpeed: 0 };
    case "walk":
      return {
        rootYOffset: 0,
        rootRotation: 0,
        facing: motion.direction,
        scrollDelta: 0,
        sceneSpeed: 140 * motion.direction,
      };
    case "run":
      return {
        rootYOffset: 0,
        rootRotation: 0,
        facing: motion.direction,
        scrollDelta: 0,
        sceneSpeed: 420 * motion.direction,
      };
    case "jump": {
      // parabolic y + horizontal translate via scroll
      const y = -4 * motion.height * local * (1 - local);
      return {
        rootYOffset: y,
        rootRotation: 0,
        facing: motion.direction,
        scrollDelta: 0,
        sceneSpeed: motion.direction * motion.distance,
      };
    }
    case "backflip": {
      const y = -4 * motion.height * local * (1 - local);
      return {
        rootYOffset: y,
        rootRotation: 360 * motion.direction * local,
        facing: motion.direction,
        scrollDelta: 0,
        sceneSpeed: motion.direction * 80,
      };
    }
    case "sneak":
      return {
        rootYOffset: 0,
        rootRotation: 0,
        facing: motion.direction,
        scrollDelta: 0,
        sceneSpeed: 70 * motion.direction,
      };
  }
}

/* Precompute cumulative scene scroll across segments so transitions don't
   cause visual jumps. For each segment we add (duration * speed). Used only
   to keep backdrop parallax continuous per-backdrop. */
function useSceneScroll() {
  return useMemo(() => {
    const step = 1 / 30;
    let scroll = 0;
    let lastBackdrop: BackdropName | null = null;
    const samples: number[] = [];
    for (let t = 0; t <= TOTAL_SECONDS + 0.01; t += step) {
      const { seg, local } = getSegment(t);
      if (lastBackdrop !== seg.backdrop) {
        // reset scroll per backdrop so crossfades don't tear
        scroll = 0;
        lastBackdrop = seg.backdrop;
      }
      const m = motionTransform(seg.motion, local);
      scroll += (m.sceneSpeed * step);
      samples.push(scroll);
    }
    return (t: number) => samples[Math.min(samples.length - 1, Math.max(0, Math.round(t / step)))];
  }, []);
}

const FRAME_W = 1920;
const FRAME_H = 1080;
const CHAR_CENTER_X = 960;
const CHAR_CENTER_Y = 820; // feet roughly here

export const Cartoon2DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps;

  const { seg, idx, local } = getSegment(time);
  const nextSeg = TIMELINE[idx + 1];
  const prevSeg = TIMELINE[idx - 1];

  const absLocal = time - seg.start;
  const segDur = seg.end - seg.start;

  // Current pose
  const currentPose = computePose(seg.pose, time, local);
  const currentMotion = motionTransform(seg.motion, local);

  let pose = { ...currentPose, ...currentMotion };
  // End-of-segment crossfade to next pose (visual smoothing of pose only)
  if (nextSeg && segDur - absLocal < CROSSFADE) {
    const t = (CROSSFADE - (segDur - absLocal)) / CROSSFADE;
    const nextLocal = 0;
    const nextPose = computePose(nextSeg.pose, time, nextLocal);
    const nextMotion = motionTransform(nextSeg.motion, 0);
    pose = lerpPose(pose, { ...nextPose, ...nextMotion } as Pose, t);
  }
  // Start-of-segment crossfade from previous
  if (prevSeg && absLocal < CROSSFADE) {
    const t = absLocal / CROSSFADE;
    const prevLocalEnd = 1;
    const prevPose = computePose(prevSeg.pose, time, prevLocalEnd);
    const prevMotion = motionTransform(prevSeg.motion, 1);
    pose = lerpPose({ ...prevPose, ...prevMotion } as Pose, pose, t);
  }

  const sceneScroll = useSceneScroll();
  const scrollX = sceneScroll(time);

  // Backdrop crossfade
  let fadeOpacity = 1;
  let fadeToNext = 0;
  if (nextSeg && nextSeg.backdrop !== seg.backdrop && segDur - absLocal < CROSSFADE) {
    const t = (CROSSFADE - (segDur - absLocal)) / CROSSFADE;
    fadeOpacity = 1 - t;
    fadeToNext = t;
  }

  const labelOpacity = interpolate(
    absLocal,
    [0, 0.3, Math.max(0.3, segDur - 0.4), segDur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const progressPct = (time / TOTAL_SECONDS) * 100;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {/* Backdrop A */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", inset: 0, opacity: fadeOpacity }}
      >
        <Backdrop name={seg.backdrop} scrollX={scrollX} time={time} />
      </svg>
      {/* Backdrop B (next segment during crossfade) */}
      {fadeToNext > 0 && nextSeg && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
          style={{ position: "absolute", inset: 0, opacity: fadeToNext }}
        >
          <Backdrop name={nextSeg.backdrop} scrollX={0} time={time} />
        </svg>
      )}

      {/* Character */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Shadow */}
        <ellipse
          cx={CHAR_CENTER_X}
          cy={CHAR_CENTER_Y + 90}
          rx={70 * Math.max(0.4, 1 - Math.abs(pose.rootYOffset) / 400)}
          ry={12 * Math.max(0.4, 1 - Math.abs(pose.rootYOffset) / 400)}
          fill="#000"
          opacity={0.35 * Math.max(0.4, 1 - Math.abs(pose.rootYOffset) / 400)}
        />
        <RiggedCharacter
          pose={pose}
          worldX={CHAR_CENTER_X}
          worldY={CHAR_CENTER_Y}
          size={1.6}
        />
      </svg>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 64,
          fontFamily: "'Arial Black', sans-serif",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            textShadow:
              "0 0 18px rgba(255,100,200,0.9), 0 6px 0 #4a1b66, 0 14px 26px rgba(0,0,0,0.5)",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          2D Cartoon Hero
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 22,
            fontWeight: 700,
            color: "#cbbdff",
            letterSpacing: "2px",
          }}
        >
          rigged SVG skeleton · procedural gait · 60s reel
        </div>
      </div>

      {/* Segment label */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: labelOpacity,
          fontFamily: "'Arial Black', sans-serif",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "14px 36px",
            background: "linear-gradient(180deg,#ffd166,#f7b400)",
            borderRadius: 14,
            border: "5px solid #3a1b66",
            color: "#3a1b66",
            fontSize: 52,
            fontWeight: 900,
            boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
            letterSpacing: 1,
          }}
        >
          {seg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80,
          right: 80,
          height: 10,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#4aa8ff 0%,#a259ff 50%,#ff5a9e 100%)",
            boxShadow: "0 0 12px rgba(162,89,255,0.8)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 50,
          right: 64,
          fontFamily: "monospace",
          color: "#cbbdff",
          fontSize: 20,
          letterSpacing: 1,
        }}
      >
        {String(frame).padStart(4, "0")} / {durationInFrames}
      </div>
    </AbsoluteFill>
  );
};
