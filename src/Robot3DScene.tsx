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
import { useThree } from "@react-three/fiber";
import { Group, PCFSoftShadowMap, MathUtils } from "three";

/* ---------------------------------------------------------------------------
   Pre-rigged humanoid (three.js Soldier / Mixamo rig) - Idle / Walk / Run
   animations baked in. Variety over 60s comes from:

     * physics-driven locomotion (constant-velocity walk/run, parabolic jumps)
     * cinematic camera cuts per segment (wide, tracking, orbit, low-angle)
     * lighting treatments per segment (sunset, neon, spotlight)

   Character pose is always a baked clip (Idle/Walk/Run). Jump uses Run as the
   flight pose with a y(t) = 4*h*t*(1-t) projectile arc driving world Y.
--------------------------------------------------------------------------- */

const MODEL_URL = staticFile("Soldier.glb");
useGLTF.preload(MODEL_URL);

type Pose = "Idle" | "Walk" | "Run";

type Motion =
  | { kind: "still" }
  | { kind: "walk"; from: [number, number]; to: [number, number] }
  | { kind: "run"; from: [number, number]; to: [number, number] }
  | { kind: "jump"; from: [number, number]; to: [number, number]; height: number }
  | { kind: "turn"; pos: [number, number]; fromDeg: number; toDeg: number }
  | {
      kind: "zigzag";
      from: [number, number];
      to: [number, number];
      amplitude: number;
      cycles: number;
    }
  | { kind: "circle"; center: [number, number]; radius: number; revolutions: number }
  | { kind: "burst"; center: [number, number]; count: number; height: number };

type Shot = {
  preset: "wide" | "side" | "tracking" | "lowFront" | "orbit" | "closeUp" | "topDown";
  pan?: number; // extra X offset for lookAt
};

type Light = {
  preset: "day" | "sunset" | "neonPink" | "neonBlue" | "spotlight" | "moonlit";
};

type Segment = {
  start: number;
  end: number;
  pose: Pose;
  label: string;
  motion: Motion;
  shot: Shot;
  light: Light;
  faceDeg?: number;
};

const TIMELINE: Segment[] = [
  // Act 1: Intro
  { start: 0, end: 4, pose: "Idle", label: "Standing by", motion: { kind: "still" }, shot: { preset: "wide" }, light: { preset: "day" }, faceDeg: 0 },

  // Act 2: Walking
  { start: 4, end: 12, pose: "Walk", label: "Walking", motion: { kind: "walk", from: [-6, 0], to: [6, 0] }, shot: { preset: "side" }, light: { preset: "sunset" } },
  { start: 12, end: 13.5, pose: "Idle", label: "Turn around", motion: { kind: "turn", pos: [6, 0], fromDeg: 90, toDeg: -90 }, shot: { preset: "closeUp" }, light: { preset: "sunset" } },

  // Act 3: Running + tracking
  { start: 13.5, end: 19, pose: "Run", label: "Running", motion: { kind: "run", from: [6, 0], to: [-6, 0] }, shot: { preset: "tracking" }, light: { preset: "sunset" } },

  // Act 4: Zigzag
  { start: 19, end: 20.5, pose: "Idle", label: "Ready", motion: { kind: "turn", pos: [-6, 0], fromDeg: -90, toDeg: 90 }, shot: { preset: "lowFront" }, light: { preset: "neonBlue" } },
  { start: 20.5, end: 26.5, pose: "Run", label: "Evasive zig-zag", motion: { kind: "zigzag", from: [-6, 0], to: [6, 0], amplitude: 2.2, cycles: 3 }, shot: { preset: "side" }, light: { preset: "neonBlue" } },

  // Act 5: Jumps
  { start: 26.5, end: 28, pose: "Idle", label: "Prepare", motion: { kind: "turn", pos: [6, 0], fromDeg: 90, toDeg: -90 }, shot: { preset: "lowFront" }, light: { preset: "neonPink" } },
  { start: 28, end: 31, pose: "Run", label: "Jump!", motion: { kind: "jump", from: [6, 0], to: [3, 0], height: 1.8 }, shot: { preset: "side" }, light: { preset: "neonPink" } },
  { start: 31, end: 33.5, pose: "Run", label: "Higher jump", motion: { kind: "jump", from: [3, 0], to: [-1, 0], height: 2.6 }, shot: { preset: "side" }, light: { preset: "neonPink" } },
  { start: 33.5, end: 36.5, pose: "Run", label: "Finale leap", motion: { kind: "jump", from: [-1, 0], to: [-5, 0], height: 3.4 }, shot: { preset: "tracking" }, light: { preset: "neonPink" } },

  // Act 6: Circle
  { start: 36.5, end: 38, pose: "Idle", label: "Pivot", motion: { kind: "turn", pos: [-5, 0], fromDeg: -90, toDeg: 0 }, shot: { preset: "closeUp" }, light: { preset: "spotlight" } },
  { start: 38, end: 45, pose: "Run", label: "Orbit run", motion: { kind: "circle", center: [0, 0], radius: 5, revolutions: 1 }, shot: { preset: "orbit" }, light: { preset: "spotlight" } },

  // Act 7: Dramatic walk back
  { start: 45, end: 47, pose: "Idle", label: "Stop", motion: { kind: "turn", pos: [5, 0], fromDeg: 0, toDeg: 180 }, shot: { preset: "lowFront" }, light: { preset: "moonlit" } },
  { start: 47, end: 54, pose: "Walk", label: "Walk home", motion: { kind: "walk", from: [5, 0], to: [-2, 0] }, shot: { preset: "topDown" }, light: { preset: "moonlit" } },

  // Act 8: Rapid jumps
  { start: 54, end: 57, pose: "Run", label: "Rapid bounce", motion: { kind: "burst", center: [-1, 0], count: 3, height: 1.4 }, shot: { preset: "side" }, light: { preset: "neonPink" } },

  // Act 9: Outro
  { start: 57, end: 58.5, pose: "Idle", label: "Return", motion: { kind: "turn", pos: [-1, 0], fromDeg: 180, toDeg: 0 }, shot: { preset: "closeUp" }, light: { preset: "day" } },
  { start: 58.5, end: 60, pose: "Idle", label: "End scene", motion: { kind: "still" }, shot: { preset: "wide" }, light: { preset: "day" }, faceDeg: 0 },
];

const TOTAL_SECONDS = 60;
const CROSSFADE = 0.3;

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const jumpY = (t: number, h: number) => 4 * h * Math.max(0, t) * (1 - Math.max(0, t));

function getSegment(time: number): { seg: Segment; idx: number; local: number } {
  for (let i = 0; i < TIMELINE.length; i++) {
    const s = TIMELINE[i];
    if (time >= s.start && time < s.end) {
      const local = (time - s.start) / (s.end - s.start);
      return { seg: s, idx: i, local };
    }
  }
  const s = TIMELINE[TIMELINE.length - 1];
  return { seg: s, idx: TIMELINE.length - 1, local: 1 };
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
      const x = x0 + (x1 - x0) * local;
      const z = z0 + (z1 - z0) * local;
      const rotY = Math.atan2(x1 - x0, z1 - z0);
      return { x, y: 0, z, rotY };
    }
    case "jump": {
      const [x0, z0] = motion.from;
      const [x1, z1] = motion.to;
      const x = x0 + (x1 - x0) * local;
      const z = z0 + (z1 - z0) * local;
      const y = jumpY(local, motion.height);
      const rotY = Math.atan2(x1 - x0, z1 - z0);
      return { x, y, z, rotY };
    }
    case "turn": {
      const [x, z] = motion.pos;
      const rotY = MathUtils.degToRad(
        motion.fromDeg + (motion.toDeg - motion.fromDeg) * eased
      );
      return { x, y: 0, z, rotY };
    }
    case "zigzag": {
      const [x0, z0] = motion.from;
      const [x1, z1] = motion.to;
      const x = x0 + (x1 - x0) * local;
      const zBase = z0 + (z1 - z0) * local;
      const wiggle = Math.sin(local * motion.cycles * Math.PI * 2) * motion.amplitude;
      const z = zBase + wiggle;
      // facing = tangent of path
      const dxdt = x1 - x0;
      const dzdt = (z1 - z0) + motion.amplitude * motion.cycles * Math.PI * 2 * Math.cos(local * motion.cycles * Math.PI * 2);
      const rotY = Math.atan2(dxdt, dzdt);
      return { x, y: 0, z, rotY };
    }
    case "circle": {
      const [cx, cz] = motion.center;
      const ang = local * motion.revolutions * Math.PI * 2;
      const x = cx + Math.cos(ang) * motion.radius;
      const z = cz + Math.sin(ang) * motion.radius;
      // facing tangent
      const rotY = Math.atan2(-Math.sin(ang), Math.cos(ang));
      return { x, y: 0, z, rotY };
    }
    case "burst": {
      const [cx, cz] = motion.center;
      const phase = local * motion.count;
      const jumpIdx = Math.floor(phase);
      const jumpT = phase - jumpIdx;
      const y = jumpY(jumpT, motion.height);
      // small horizontal hop
      const dir = jumpIdx % 2 === 0 ? 1 : -1;
      const x = cx + dir * jumpT * 0.4 * (1 - jumpT) * 6;
      return { x, y, z: cz, rotY: MathUtils.degToRad(-90) };
    }
  }
}

const Soldier: React.FC<{ time: number }> = ({ time }) => {
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

  useEffect(() => {
    Object.values(actions).forEach((a) => {
      if (!a) return;
      a.reset().play();
      a.paused = true;
      a.weight = 0;
    });
  }, [actions]);

  const { seg, idx, local } = getSegment(time);
  const absLocal = time - seg.start;
  const segDur = seg.end - seg.start;
  const nextSeg = TIMELINE[idx + 1];
  const prevSeg = TIMELINE[idx - 1];

  let currentW = 1;
  let nextW = 0;
  let prevW = 0;
  if (nextSeg && segDur - absLocal < CROSSFADE) {
    const t = (CROSSFADE - (segDur - absLocal)) / CROSSFADE;
    currentW = 1 - t;
    nextW = t;
  }
  if (prevSeg && absLocal < CROSSFADE) {
    const t = absLocal / CROSSFADE;
    prevW = 1 - t;
    currentW = t;
  }

  useEffect(() => {
    Object.entries(actions).forEach(([name, action]) => {
      if (!action) return;
      let w = 0;
      let localTime = 0;
      if (name === seg.pose) {
        w = Math.max(w, currentW);
        localTime = absLocal;
      }
      if (nextSeg && name === nextSeg.pose && nextW > 0) {
        w = Math.max(w, nextW);
        localTime = 0;
      }
      if (prevSeg && name === prevSeg.pose && prevW > 0) {
        w = Math.max(w, prevW);
        localTime = prevSeg.end - prevSeg.start;
      }
      action.weight = w;
      if (w > 0) {
        const d = action.getClip().duration;
        action.time = localTime % d;
      }
    });
    mixer.update(0);
  }, [time, seg, nextSeg, prevSeg, absLocal, currentW, nextW, prevW, actions, mixer]);

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

const Ground: React.FC<{ tint: string }> = ({ tint }) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={tint} roughness={0.9} metalness={0.05} />
    </mesh>
    <gridHelper args={[60, 60, "#556", "#334"]} position={[0, 0.002, 0]} />
  </>
);

const LIGHT_PRESETS: Record<
  Light["preset"],
  {
    bg: string;
    ground: string;
    ambient: number;
    hemi: [string, string, number];
    key: { pos: [number, number, number]; color: string; intensity: number };
    fill?: { pos: [number, number, number]; color: string; intensity: number };
    rim?: { pos: [number, number, number]; color: string; intensity: number };
    fog: [string, number, number];
  }
> = {
  day: {
    bg: "radial-gradient(circle at 50% 30%,#7fbfff 0%,#3a6fb8 70%,#12254e 100%)",
    ground: "#334d66",
    ambient: 0.5,
    hemi: ["#ffffff", "#334d66", 0.7],
    key: { pos: [6, 12, 8], color: "#ffffff", intensity: 2 },
    fill: { pos: [-8, 4, 6], color: "#7fbfff", intensity: 0.6 },
    fog: ["#3a6fb8", 22, 60],
  },
  sunset: {
    bg: "linear-gradient(180deg,#ff9454 0%,#ffba6f 40%,#b05c8e 80%,#3a1a4a 100%)",
    ground: "#3b2040",
    ambient: 0.35,
    hemi: ["#ffc483", "#3a1a4a", 0.7],
    key: { pos: [10, 4, 6], color: "#ffb061", intensity: 2.2 },
    fill: { pos: [-8, 5, 4], color: "#ff4d8a", intensity: 0.8 },
    rim: { pos: [0, 6, -8], color: "#b065ff", intensity: 1.2 },
    fog: ["#3a1a4a", 20, 55],
  },
  neonPink: {
    bg: "radial-gradient(circle at 50% 30%,#6a1b66 0%,#22083a 70%,#070316 100%)",
    ground: "#1a0730",
    ambient: 0.2,
    hemi: ["#ff6bd6", "#120620", 0.4],
    key: { pos: [6, 10, 6], color: "#ff44aa", intensity: 2.4 },
    fill: { pos: [-7, 4, 2], color: "#ff99cc", intensity: 0.8 },
    rim: { pos: [0, 6, -8], color: "#7fe4ff", intensity: 1.6 },
    fog: ["#22083a", 18, 55],
  },
  neonBlue: {
    bg: "radial-gradient(circle at 50% 30%,#173a8a 0%,#0a1740 70%,#03061a 100%)",
    ground: "#0d1c3d",
    ambient: 0.2,
    hemi: ["#6eb9ff", "#0a1740", 0.5],
    key: { pos: [6, 10, 6], color: "#5aa8ff", intensity: 2.4 },
    fill: { pos: [-7, 4, 2], color: "#a8e0ff", intensity: 0.9 },
    rim: { pos: [0, 6, -8], color: "#ff66d8", intensity: 1.4 },
    fog: ["#0a1740", 18, 55],
  },
  spotlight: {
    bg: "radial-gradient(circle at 50% 45%,#2a2a2a 0%,#0a0a0a 70%,#000 100%)",
    ground: "#111",
    ambient: 0.12,
    hemi: ["#ffffff", "#000000", 0.15],
    key: { pos: [0, 14, 4], color: "#ffffff", intensity: 3.2 },
    fill: { pos: [-6, 3, 6], color: "#ffd7a3", intensity: 0.6 },
    rim: { pos: [6, 3, -6], color: "#aac8ff", intensity: 0.8 },
    fog: ["#000000", 14, 45],
  },
  moonlit: {
    bg: "radial-gradient(circle at 50% 30%,#1b2547 0%,#0b0f24 70%,#030410 100%)",
    ground: "#172540",
    ambient: 0.3,
    hemi: ["#b8c8ff", "#0b0f24", 0.55],
    key: { pos: [4, 12, 6], color: "#dce5ff", intensity: 1.6 },
    fill: { pos: [-6, 4, 4], color: "#7b8cff", intensity: 0.6 },
    fog: ["#0b0f24", 20, 55],
  },
};

const Lights: React.FC<{ preset: Light["preset"] }> = ({ preset }) => {
  const L = LIGHT_PRESETS[preset];
  return (
    <>
      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={[L.hemi[0], L.hemi[1], L.hemi[2]]} />
      <directionalLight
        position={L.key.pos}
        intensity={L.key.intensity}
        color={L.key.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      {L.fill && (
        <pointLight position={L.fill.pos} color={L.fill.color} intensity={L.fill.intensity} />
      )}
      {L.rim && (
        <pointLight position={L.rim.pos} color={L.rim.color} intensity={L.rim.intensity} />
      )}
    </>
  );
};

/* Camera presets expressed relative to the character's current world position.
   Soldier model height ≈ 1.8. We use lookAt target = char position + (0,1.2,0)
   so the head stays in the upper-center third of frame with headroom.
*/
type CamResult = {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
};

function cameraForShot(
  shot: Shot,
  charX: number,
  charY: number,
  charZ: number,
  local: number
): CamResult {
  const tx = charX;
  const ty = charY + 1.2;
  const tz = charZ;
  switch (shot.preset) {
    case "wide":
      return { pos: [0, 2.4, 14], target: [tx, ty, tz], fov: 28 };
    case "side":
      return { pos: [0, 2.2, 13], target: [tx, ty, tz], fov: 34 };
    case "tracking": {
      const px = MathUtils.clamp(charX * 0.7, -3, 3);
      return { pos: [px, 2.4, 12], target: [tx, ty, tz], fov: 34 };
    }
    case "lowFront":
      return { pos: [charX * 0.4, 1.0, 9], target: [tx, ty + 0.3, tz], fov: 38 };
    case "orbit": {
      const ang = local * Math.PI * 2 + Math.PI / 2;
      const r = 9;
      return {
        pos: [Math.cos(ang) * r, 3.2, Math.sin(ang) * r],
        target: [0, 1.2, 0],
        fov: 34,
      };
    }
    case "closeUp":
      return { pos: [charX + 1.2, 2.0, 5.5], target: [tx, ty + 0.2, tz], fov: 38 };
    case "topDown":
      return { pos: [charX, 10, 5], target: [tx, 0.5, tz], fov: 38 };
  }
}

// Smooth camera pose by averaging over a small window so cuts feel deliberate
// but within-segment camera motion is buttery.
function useCameraTimeline() {
  return useMemo(() => {
    const stepSec = 1 / 30;
    const frames: CamResult[] = [];
    for (let t = 0; t <= TOTAL_SECONDS + 0.1; t += stepSec) {
      const { seg, local } = getSegment(t);
      const pose = motionPose(seg.motion, local, seg.faceDeg ?? 0);
      frames.push(cameraForShot(seg.shot, pose.x, pose.y, pose.z, local));
    }
    // Low-pass only within same segment preset type to avoid smearing cuts
    const smoothed = frames.map((f, i) => {
      // Simple EMA over a 3-frame window (100ms) — keeps cuts sharp
      const window = 3;
      let sx = 0,
        sy = 0,
        sz = 0,
        tx = 0,
        ty = 0,
        tz = 0,
        fov = 0,
        n = 0;
      for (let j = Math.max(0, i - window); j <= i; j++) {
        sx += frames[j].pos[0];
        sy += frames[j].pos[1];
        sz += frames[j].pos[2];
        tx += frames[j].target[0];
        ty += frames[j].target[1];
        tz += frames[j].target[2];
        fov += frames[j].fov;
        n++;
      }
      return {
        pos: [sx / n, sy / n, sz / n] as [number, number, number],
        target: [tx / n, ty / n, tz / n] as [number, number, number],
        fov: fov / n,
      };
    });
    return (t: number) => smoothed[Math.min(smoothed.length - 1, Math.max(0, Math.round(t / stepSec)))];
  }, []);
}

const CameraController: React.FC<{
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}> = ({ pos, target, fov }) => {
  const { camera } = useThree();
  camera.position.set(pos[0], pos[1], pos[2]);
  (camera as any).fov = fov;
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateProjectionMatrix();
  return null;
};

/* ------------------------------------------------------------------------- */
/* Scene                                                                     */
/* ------------------------------------------------------------------------- */

export const Robot3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const time = frame / fps;

  const camTl = useCameraTimeline();
  const cam = camTl(time);
  const { seg } = getSegment(time);
  const L = LIGHT_PRESETS[seg.light.preset];

  const absLocal = time - seg.start;
  const segDur = seg.end - seg.start;
  const labelOpacity = interpolate(
    absLocal,
    [0, 0.3, Math.max(0.3, segDur - 0.4), segDur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const progressPct = (time / TOTAL_SECONDS) * 100;

  return (
    <AbsoluteFill style={{ background: L.bg }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{ antialias: true }}
        onCreated={({ gl, camera }) => {
          gl.shadowMap.type = PCFSoftShadowMap;
          camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
          (camera as any).fov = cam.fov;
          camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
          camera.updateProjectionMatrix();
        }}
        camera={{ position: cam.pos, fov: cam.fov, near: 0.1, far: 100 }}
      >
        <CameraController
          pos={cam.pos}
          target={cam.target}
          fov={cam.fov}
        />
        <fog attach="fog" args={L.fog} />
        <Lights preset={seg.light.preset} />
        <Ground tint={L.ground} />
        <Soldier time={time} />
      </ThreeCanvas>

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

      {/* Top-left title */}
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
            fontSize: 56,
            fontWeight: 900,
            textShadow: "0 0 14px rgba(120,80,255,0.8), 0 5px 0 rgba(0,0,0,0.5)",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Soldier Rig · 60s Reel
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
          pre-rigged humanoid · physics locomotion · cinematic cuts
        </div>
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

