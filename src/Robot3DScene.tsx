import { useEffect, useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, PCFSoftShadowMap, MathUtils } from "three";

/* ---------------------------------------------------------------------------
   60-second choreographed timeline.
   The robot's own baked clips drive the pose; world position/rotation is
   driven by simple rigid-body physics so walks/runs don't look teleported and
   jumps follow a real parabolic arc. All timings in seconds.
--------------------------------------------------------------------------- */

type Motion =
  | { kind: "still" }
  | { kind: "walk"; from: [number, number]; to: [number, number] }
  | { kind: "run"; from: [number, number]; to: [number, number] }
  | { kind: "jump"; from: [number, number]; to: [number, number]; height: number }
  | { kind: "turn"; pos: [number, number]; fromDeg: number; toDeg: number };

type Segment = {
  start: number; // seconds
  end: number; // seconds
  clip: string;
  label: string;
  motion: Motion;
  faceDeg?: number; // override facing when stationary
};

const TIMELINE: Segment[] = [
  { start: 0, end: 2, clip: "Idle", label: "Idle", motion: { kind: "still" }, faceDeg: 0 },
  { start: 2, end: 5, clip: "Wave", label: "Wave hello", motion: { kind: "still" }, faceDeg: 0 },
  { start: 5, end: 13, clip: "Walking", label: "Walking", motion: { kind: "walk", from: [-4, 0], to: [4, 0] } },
  { start: 13, end: 14.5, clip: "Idle", label: "Turn around", motion: { kind: "turn", pos: [4, 0], fromDeg: 90, toDeg: -90 } },
  { start: 14.5, end: 20.5, clip: "Running", label: "Running", motion: { kind: "run", from: [4, 0], to: [-4, 0] } },
  { start: 20.5, end: 22, clip: "Idle", label: "Ready...", motion: { kind: "turn", pos: [-4, 0], fromDeg: -90, toDeg: 90 } },
  { start: 22, end: 25.5, clip: "Jump", label: "Jump!", motion: { kind: "jump", from: [-4, 0], to: [0, 0], height: 2.2 } },
  { start: 25.5, end: 29, clip: "Jump", label: "Double jump!", motion: { kind: "jump", from: [0, 0], to: [4, 0], height: 2.6 } },
  { start: 29, end: 30.5, clip: "Idle", label: "Land", motion: { kind: "turn", pos: [4, 0], fromDeg: 90, toDeg: 0 } },
  { start: 30.5, end: 31.5, clip: "Walking", label: "Walk to center", motion: { kind: "walk", from: [4, 0], to: [2, 0] } },
  { start: 31.5, end: 37, clip: "Dance", label: "Dance", motion: { kind: "still" }, faceDeg: 0 },
  { start: 37, end: 40, clip: "Punch", label: "Punch!", motion: { kind: "still" }, faceDeg: 0 },
  { start: 40, end: 43, clip: "ThumbsUp", label: "Thumbs up", motion: { kind: "still" }, faceDeg: 0 },
  { start: 43, end: 45.5, clip: "Yes", label: "Yes!", motion: { kind: "still" }, faceDeg: 0 },
  { start: 45.5, end: 48, clip: "No", label: "No way", motion: { kind: "still" }, faceDeg: 0 },
  { start: 48, end: 49, clip: "Idle", label: "Ready", motion: { kind: "turn", pos: [2, 0], fromDeg: 0, toDeg: -90 } },
  { start: 49, end: 52, clip: "Running", label: "Sprint!", motion: { kind: "run", from: [2, 0], to: [-4, 0] } },
  { start: 52, end: 54.5, clip: "Jump", label: "Finale leap", motion: { kind: "jump", from: [-4, 0], to: [0, 0], height: 3.0 } },
  { start: 54.5, end: 55.5, clip: "Idle", label: "Stick landing", motion: { kind: "turn", pos: [0, 0], fromDeg: 90, toDeg: 0 } },
  { start: 55.5, end: 60, clip: "Wave", label: "Take a bow", motion: { kind: "still" }, faceDeg: 0 },
];

const TOTAL_SECONDS = 60;
const CROSSFADE = 0.25; // seconds
const MODEL_URL = staticFile("RobotExpressive.glb");
useGLTF.preload(MODEL_URL);

// Easing for smooth accel/decel across a single segment
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Jump vertical profile using physics:
   v0 chosen so that peak height = h; time in flight = 1 second of "segment
   airtime" normalized to [0,1]. We use y(t) = 4*h*t*(1-t) which is the same
   parabola as projectile motion with launch and landing at ground.
*/
const jumpY = (t: number, h: number) => 4 * h * t * (1 - t);

function getSegment(time: number): { seg: Segment; idx: number; local: number } {
  for (let i = 0; i < TIMELINE.length; i++) {
    const seg = TIMELINE[i];
    if (time >= seg.start && time < seg.end) {
      const local = (time - seg.start) / (seg.end - seg.start);
      return { seg, idx: i, local };
    }
  }
  const seg = TIMELINE[TIMELINE.length - 1];
  return { seg, idx: TIMELINE.length - 1, local: 1 };
}

function motionPose(motion: Motion, local: number, faceDeg = 0) {
  const eased = easeInOut(local);
  switch (motion.kind) {
    case "still":
      return { x: 0, y: 0, z: 0, rotY: MathUtils.degToRad(faceDeg) };
    case "walk":
    case "run": {
      const [x0, z0] = motion.from;
      const [x1, z1] = motion.to;
      // walk/run uses linear travel for constant velocity (physically right)
      const x = x0 + (x1 - x0) * local;
      const z = z0 + (z1 - z0) * local;
      const dx = x1 - x0;
      const dz = z1 - z0;
      const rotY = Math.atan2(dx, dz);
      return { x, y: 0, z, rotY };
    }
    case "jump": {
      const [x0, z0] = motion.from;
      const [x1, z1] = motion.to;
      const x = x0 + (x1 - x0) * local;
      const z = z0 + (z1 - z0) * local;
      const y = jumpY(local, motion.height);
      const dx = x1 - x0;
      const dz = z1 - z0;
      const rotY = dx === 0 && dz === 0 ? MathUtils.degToRad(faceDeg) : Math.atan2(dx, dz);
      return { x, y, z, rotY };
    }
    case "turn": {
      const [x, z] = motion.pos;
      const rotY = MathUtils.degToRad(
        motion.fromDeg + (motion.toDeg - motion.fromDeg) * eased
      );
      return { x, y: 0, z, rotY };
    }
  }
}

const Robot: React.FC<{ time: number }> = ({ time }) => {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Start all actions paused so we can drive time + weight manually per frame
  useEffect(() => {
    Object.values(actions).forEach((a) => {
      if (!a) return;
      a.reset().play();
      a.paused = true;
      a.weight = 0;
    });
  }, [actions]);

  const { seg, idx, local } = getSegment(time);
  const segDuration = seg.end - seg.start;
  const absoluteLocalTime = time - seg.start;

  // Determine crossfade with neighbours
  const nextSeg = TIMELINE[idx + 1];
  let currentWeight = 1;
  let nextWeight = 0;
  if (nextSeg && segDuration - absoluteLocalTime < CROSSFADE) {
    const t = (CROSSFADE - (segDuration - absoluteLocalTime)) / CROSSFADE;
    currentWeight = 1 - t;
    nextWeight = t;
  }
  const prevSeg = TIMELINE[idx - 1];
  let prevWeight = 0;
  if (prevSeg && absoluteLocalTime < CROSSFADE) {
    const t = absoluteLocalTime / CROSSFADE;
    prevWeight = 1 - t;
    currentWeight = t;
  }

  useEffect(() => {
    Object.entries(actions).forEach(([name, action]) => {
      if (!action) return;
      let weight = 0;
      let localTime = 0;
      if (name === seg.clip) {
        weight = Math.max(weight, currentWeight);
        localTime = absoluteLocalTime;
      }
      if (nextSeg && name === nextSeg.clip && nextWeight > 0) {
        weight = Math.max(weight, nextWeight);
        localTime = 0;
      }
      if (prevSeg && name === prevSeg.clip && prevWeight > 0) {
        weight = Math.max(weight, prevWeight);
        localTime = prevSeg.end - prevSeg.start;
      }
      action.weight = weight;
      if (weight > 0) {
        const clipDur = action.getClip().duration;
        action.time = localTime % clipDur;
      }
    });
    mixer.update(0);
  }, [time, seg, nextSeg, prevSeg, currentWeight, nextWeight, prevWeight, absoluteLocalTime, actions, mixer]);

  const pose = motionPose(seg.motion, local, seg.faceDeg ?? 0);

  return (
    <group
      ref={group}
      position={[pose.x, pose.y, pose.z]}
      rotation={[0, pose.rotY, 0]}
    >
      <primitive object={scene} />
    </group>
  );
};

const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#1d2340" roughness={0.9} metalness={0.05} />
    </mesh>
    {/* subtle grid */}
    <gridHelper args={[40, 40, "#445", "#334"]} position={[0, 0.001, 0]} />
    {/* soft ground ring under character area */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
      <ringGeometry args={[0, 7, 64]} />
      <meshStandardMaterial color="#2a3560" roughness={0.85} transparent opacity={0.7} />
    </mesh>
  </>
);

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.35} />
    <hemisphereLight args={["#ffddbb", "#1a1040", 0.55]} />
    <directionalLight
      position={[5, 10, 6]}
      intensity={1.9}
      color="#fff2d6"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-camera-near={0.5}
      shadow-camera-far={40}
    />
    <pointLight position={[-7, 3, -2]} intensity={1.0} color="#ff5a9e" />
    <pointLight position={[7, 3, -2]} intensity={1.0} color="#4aa8ff" />
  </>
);

/* Smooth camera: follow robot's X with low-pass filter, fixed Y/Z. */
const useSmoothedFollow = (time: number) => {
  return useMemo(() => {
    const stepSec = 1 / 30;
    let smoothedX = 0;
    let samples: { t: number; x: number }[] = [];
    // precompute x at each 1/30 step using same getSegment → motionPose
    for (let t = 0; t <= TOTAL_SECONDS; t += stepSec) {
      const { seg, local } = getSegment(t);
      const pose = motionPose(seg.motion, local, seg.faceDeg ?? 0);
      samples.push({ t, x: pose.x });
    }
    // low-pass
    const alpha = 0.05;
    const smoothed = samples.map((s) => {
      smoothedX = smoothedX + alpha * (s.x - smoothedX);
      return smoothedX;
    });
    return (t: number) => {
      const i = Math.min(smoothed.length - 1, Math.max(0, Math.floor(t / stepSec)));
      return smoothed[i] * 0.35; // only follow partially — keeps framing stable
    };
  }, []);
};

export const Robot3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const time = frame / fps;

  const follow = useSmoothedFollow(time);
  const camX = follow(time);
  const camY = 2.6;
  const camZ = 11;

  const { seg } = getSegment(time);

  // Label fade in/out per segment
  const segLocalSec = time - seg.start;
  const segDur = seg.end - seg.start;
  const labelOpacity = interpolate(
    segLocalSec,
    [0, 0.3, Math.max(0.3, segDur - 0.4), segDur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const progressPct = (time / TOTAL_SECONDS) * 100;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 30%, #2c1f5c 0%, #140a2e 70%, #05020e 100%)",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = PCFSoftShadowMap;
        }}
        camera={{ position: [camX, camY, camZ], fov: 28 }}
      >
        <fog attach="fog" args={["#140a2e", 18, 40]} />
        <Lights />
        <Ground />
        <Robot time={time} />
      </ThreeCanvas>

      {/* Top-left title */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 70,
          fontFamily: "'Arial Black', sans-serif",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 70,
            fontWeight: 900,
            textShadow: "0 0 16px rgba(120,80,255,0.8), 0 6px 0 #3a1b66",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Rigged Hero · 60s Reel
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 24,
            fontWeight: 700,
            color: "#cbbdff",
            letterSpacing: "2px",
          }}
        >
          physics-driven walks · real jump arcs · crossfaded clips
        </div>
      </div>

      {/* Active-segment label */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
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

      {/* Timeline progress bar */}
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
            background:
              "linear-gradient(90deg,#4aa8ff 0%,#a259ff 50%,#ff5a9e 100%)",
            boxShadow: "0 0 12px rgba(162,89,255,0.8)",
          }}
        />
      </div>

      {/* Frame counter (subtle) */}
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 70,
          fontFamily: "monospace",
          color: "#cbbdff",
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        {String(frame).padStart(4, "0")} / {durationInFrames}
      </div>
    </AbsoluteFill>
  );
};
