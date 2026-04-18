import { useEffect, useRef } from "react";
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

const MODEL_URL = staticFile("RobotExpressive.glb");
useGLTF.preload(MODEL_URL);

const ANIMATION_SEQUENCE: { name: string; duration: number }[] = [
  { name: "Wave", duration: 90 },
  { name: "Dance", duration: 150 },
  { name: "Jump", duration: 60 },
  { name: "ThumbsUp", duration: 60 },
];

const Robot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);

  // Ensure all meshes cast/receive shadows
  useEffect(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Pick which animation is active based on frame
  const { activeName, localFrame } = (() => {
    let acc = 0;
    for (const seg of ANIMATION_SEQUENCE) {
      if (frame < acc + seg.duration) {
        return { activeName: seg.name, localFrame: frame - acc };
      }
      acc += seg.duration;
    }
    const last = ANIMATION_SEQUENCE[ANIMATION_SEQUENCE.length - 1];
    return { activeName: last.name, localFrame: durationInFrames };
  })();

  // Start all actions paused and advance the active one's time manually
  useEffect(() => {
    Object.values(actions).forEach((a) => {
      if (!a) return;
      a.reset().play();
      a.paused = true;
      a.weight = 0;
    });
  }, [actions]);

  useEffect(() => {
    Object.entries(actions).forEach(([name, action]) => {
      if (!action) return;
      const isActive = name === activeName;
      action.weight = isActive ? 1 : 0;
      if (isActive) {
        const clipDuration = action.getClip().duration;
        action.time = (localFrame / fps) % clipDuration;
      }
    });
    // Force mixer to apply current state
    mixer.update(0);
  }, [activeName, localFrame, fps, actions, mixer]);

  // Gentle camera-facing rotation & bob
  const rotY = MathUtils.degToRad(
    interpolate(frame, [0, durationInFrames], [-15, 15])
  );
  const bob = Math.sin(frame / 12) * 0.05;

  return (
    <group ref={group} position={[0, -1.2 + bob, 0]} rotation={[0, rotY, 0]}>
      <primitive object={scene} />
    </group>
  );
};

const Ground: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
    <circleGeometry args={[8, 64]} />
    <meshStandardMaterial color="#2a2f4a" roughness={0.9} metalness={0.1} />
  </mesh>
);

const Lights: React.FC = () => {
  const frame = useCurrentFrame();
  const spinX = Math.cos(frame / 40) * 4;
  const spinZ = Math.sin(frame / 40) * 4;
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffdd99", "#2a1a4a", 0.6]} />
      <directionalLight
        position={[spinX, 6, spinZ]}
        intensity={1.8}
        color="#fff0cc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      <pointLight position={[-4, 3, -3]} intensity={1.2} color="#ff3a7a" />
      <pointLight position={[4, 2, -3]} intensity={1.2} color="#3a8bff" />
    </>
  );
};

const Skybox: React.FC = () => {
  const frame = useCurrentFrame();
  const hue = interpolate(frame, [0, 360], [0, 40]);
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial color={`hsl(${250 + hue}, 60%, 18%)`} side={2} />
    </mesh>
  );
};

export const Robot3DScene: React.FC = () => {
  const { width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const camX = Math.sin(frame / 60) * 1.2;
  const camY = 0.6 + Math.sin(frame / 90) * 0.2;
  const camZ = 5.2 + Math.cos(frame / 60) * 0.8;

  const titleOpacity = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #2b1b4d 0%, #120826 70%, #05020c 100%)",
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
        camera={{ position: [camX, camY, camZ], fov: 35 }}
      >
        <Skybox />
        <Lights />
        <Ground />
        <Robot />
      </ThreeCanvas>

      {/* Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          opacity: titleOpacity,
          fontFamily: "'Arial Black', sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            color: "#ffffff",
            textShadow:
              "0 0 18px rgba(255,80,200,0.8), 0 8px 0 #6a1a8c, 0 14px 30px rgba(0,0,0,0.5)",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          3D Hero
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-block",
            padding: "8px 22px",
            background: "linear-gradient(180deg,#ffd166,#f7b400)",
            borderRadius: 12,
            border: "4px solid #6a1a8c",
            color: "#3a0a50",
            fontSize: 34,
            fontWeight: 800,
            boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          }}
        >
          rigged • animated • ready to ship
        </div>
      </div>
    </AbsoluteFill>
  );
};
