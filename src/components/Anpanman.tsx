import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const Anpanman: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring - fly in from the left
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 80 },
  });

  // Fly in diagonal trajectory, then settle center
  const startX = -600;
  const endX = 560;
  const x = interpolate(entrance, [0, 1], [startX, endX]);

  // Arc path - dip in middle
  const arcFrame = Math.max(0, frame - 30);
  const arcY =
    Math.sin((arcFrame / 30) * Math.PI * 0.5) * -40 +
    Math.sin(arcFrame / 12) * 12;
  const baseY = interpolate(entrance, [0, 1], [640, 360]);
  const y = baseY + arcY;

  // Rotate more while flying in, less when settled
  const flightRotation = interpolate(entrance, [0, 0.7, 1], [-15, -8, 4]);
  const bodyBob = Math.sin(frame / 10) * 2;
  const rotation = flightRotation + bodyBob;

  // Heroic pose after settling
  const heroPose = spring({
    frame: frame - 150,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 120 },
  });
  const scale = interpolate(heroPose, [0, 1], [1, 1.08]);

  // Final burst pose
  const burst = spring({
    frame: frame - 220,
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const finalScale = interpolate(burst, [0, 1], [1, 1.15]);

  // Blinking eyes every ~2 seconds
  const blinkCycle = frame % 60;
  const blink = blinkCycle > 54 && blinkCycle < 58 ? 0.15 : 1;

  // Cape wave animation
  const capeWave1 = Math.sin(frame / 6) * 8;
  const capeWave2 = Math.sin(frame / 6 + 0.8) * 12;
  const capeWave3 = Math.sin(frame / 6 + 1.6) * 10;

  // Arm punch variance
  const punchIntensity = interpolate(heroPose, [0, 1], [0, 1]);
  const fistExtend = interpolate(
    Math.sin(frame / 8),
    [-1, 1],
    [0, 8 + punchIntensity * 12]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `rotate(${rotation}deg) scale(${scale * finalScale})`,
          transformOrigin: "center center",
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.3))",
        }}
      >
        <svg width="800" height="700" viewBox="-400 -350 800 700">
          <defs>
            {/* Head gradient - golden-brown bread */}
            <radialGradient id="headGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#FFDDAE" />
              <stop offset="40%" stopColor="#F4B066" />
              <stop offset="80%" stopColor="#D87F3A" />
              <stop offset="100%" stopColor="#A4541C" />
            </radialGradient>
            {/* Cheek blush */}
            <radialGradient id="cheekGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FF8FA8" />
              <stop offset="60%" stopColor="#E63A5F" />
              <stop offset="100%" stopColor="#A41E3A" />
            </radialGradient>
            {/* Nose */}
            <radialGradient id="noseGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FF9CB0" />
              <stop offset="70%" stopColor="#DC1F3F" />
              <stop offset="100%" stopColor="#801024" />
            </radialGradient>
            {/* Cape outer (brown) */}
            <linearGradient id="capeOuter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B4513" />
              <stop offset="100%" stopColor="#5C2E0B" />
            </linearGradient>
            {/* Cape inner (yellow) */}
            <linearGradient id="capeInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE55C" />
              <stop offset="100%" stopColor="#F7B400" />
            </linearGradient>
            {/* Tunic red */}
            <linearGradient id="tunic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E63A3A" />
              <stop offset="100%" stopColor="#9B1B1B" />
            </linearGradient>
            {/* Glove */}
            <radialGradient id="glove" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFBE1" />
              <stop offset="100%" stopColor="#E0D18A" />
            </radialGradient>
            {/* Boot */}
            <linearGradient id="boot" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B4513" />
              <stop offset="100%" stopColor="#4A2509" />
            </linearGradient>
            {/* Highlight */}
            <radialGradient id="highlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ===== CAPE (behind body) ===== */}
          <g transform="translate(-30, -30)">
            <path
              d={`M -80,-100
                  Q ${-140 + capeWave1},${-60 + capeWave1} ${-200 + capeWave2},${20 + capeWave2}
                  Q ${-240 + capeWave3},${90 + capeWave3} ${-220 + capeWave2},${180 + capeWave1}
                  Q ${-160 + capeWave1},${150 + capeWave3} ${-100 + capeWave2},${130}
                  Q ${-60},${80} ${-40},${30}
                  Z`}
              fill="url(#capeOuter)"
              stroke="#3A1C06"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Cape inner yellow fold */}
            <path
              d={`M -70,-90
                  Q ${-120 + capeWave1 * 0.6},${-50 + capeWave1 * 0.6} ${-170 + capeWave2 * 0.7},${30 + capeWave2 * 0.6}
                  Q ${-200 + capeWave3 * 0.6},${80 + capeWave3 * 0.7} ${-180 + capeWave2 * 0.5},${160 + capeWave1 * 0.7}
                  Q ${-140 + capeWave1 * 0.4},${130 + capeWave3 * 0.5} ${-90 + capeWave2 * 0.3},${110}
                  Q ${-55},${70} ${-40},${30}
                  Z`}
              fill="url(#capeInner)"
              opacity="0.9"
            />
          </g>

          {/* ===== BODY / TUNIC (small, under head) ===== */}
          <g transform="translate(0, 180)">
            <ellipse cx="0" cy="0" rx="110" ry="75" fill="url(#tunic)" stroke="#6B1010" strokeWidth="4" />
            {/* belt */}
            <rect x="-115" y="-8" width="230" height="28" fill="#8B4513" stroke="#3A1C06" strokeWidth="3" rx="4" />
            {/* belt buckle with A */}
            <rect x="-25" y="-14" width="50" height="40" fill="#FFD166" stroke="#8B4513" strokeWidth="3" rx="4" />
            <text
              x="0"
              y="14"
              textAnchor="middle"
              fontFamily="'Arial Black', sans-serif"
              fontSize="32"
              fontWeight="900"
              fill="#8B4513"
            >
              A
            </text>
          </g>

          {/* ===== LEGS / BOOTS ===== */}
          <g transform="translate(0, 240)">
            {/* Left leg */}
            <g transform={`translate(-50, 20) rotate(${-15 + bodyBob * 2})`}>
              <rect x="-18" y="0" width="36" height="60" fill="url(#tunic)" stroke="#6B1010" strokeWidth="3" rx="6" />
              <ellipse cx="0" cy="70" rx="30" ry="22" fill="url(#boot)" stroke="#3A1C06" strokeWidth="3" />
            </g>
            {/* Right leg */}
            <g transform={`translate(50, 20) rotate(${15 - bodyBob * 2})`}>
              <rect x="-18" y="0" width="36" height="60" fill="url(#tunic)" stroke="#6B1010" strokeWidth="3" rx="6" />
              <ellipse cx="0" cy="70" rx="30" ry="22" fill="url(#boot)" stroke="#3A1C06" strokeWidth="3" />
            </g>
          </g>

          {/* ===== LEFT ARM (back arm, behind body) ===== */}
          <g transform={`translate(-100, 160) rotate(${40 + bodyBob * 3})`}>
            <rect x="-18" y="0" width="36" height="70" fill="url(#tunic)" stroke="#6B1010" strokeWidth="3" rx="8" />
            <circle cx="0" cy="85" r="28" fill="url(#glove)" stroke="#8B7833" strokeWidth="3" />
          </g>

          {/* ===== RIGHT ARM - PUNCH FORWARD ===== */}
          <g transform={`translate(${80 + fistExtend}, 150) rotate(${-25 - bodyBob * 2})`}>
            <rect x="-22" y="-20" width="44" height="90" fill="url(#tunic)" stroke="#6B1010" strokeWidth="3" rx="10" />
            {/* Fist glove */}
            <g transform="translate(0, 85)">
              <circle cx="0" cy="0" r="38" fill="url(#glove)" stroke="#8B7833" strokeWidth="3" />
              {/* Knuckles */}
              <circle cx="-14" cy="-6" r="7" fill="#E0D18A" opacity="0.6" />
              <circle cx="0" cy="-10" r="7" fill="#E0D18A" opacity="0.6" />
              <circle cx="14" cy="-6" r="7" fill="#E0D18A" opacity="0.6" />
              {/* Punch highlight */}
              <ellipse cx="-8" cy="-12" rx="10" ry="6" fill="#ffffff" opacity="0.5" />
            </g>
          </g>

          {/* ===== HEAD ===== */}
          <g>
            {/* Head circle */}
            <circle cx="0" cy="0" r="170" fill="url(#headGrad)" stroke="#6B3712" strokeWidth="5" />

            {/* Bread highlight */}
            <ellipse cx="-50" cy="-70" rx="55" ry="35" fill="url(#highlight)" opacity="0.6" />

            {/* Cheeks */}
            <circle cx="-95" cy="28" r="38" fill="url(#cheekGrad)" />
            <circle cx="95" cy="28" r="38" fill="url(#cheekGrad)" />
            {/* Cheek shine */}
            <ellipse cx="-105" cy="18" rx="10" ry="6" fill="#ffffff" opacity="0.55" />
            <ellipse cx="85" cy="18" rx="10" ry="6" fill="#ffffff" opacity="0.55" />

            {/* Nose */}
            <circle cx="0" cy="5" r="32" fill="url(#noseGrad)" stroke="#5A0C1C" strokeWidth="2" />
            <ellipse cx="-8" cy="-6" rx="10" ry="6" fill="#ffffff" opacity="0.7" />

            {/* Eyebrows - thick, expressive, heroic */}
            <path
              d="M -80,-70 Q -55,-92 -30,-72"
              stroke="#2A1507"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 30,-72 Q 55,-92 80,-70"
              stroke="#2A1507"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />

            {/* Eyes (oval with blink) */}
            <g transform={`translate(-50, -45) scale(1, ${blink})`}>
              <ellipse cx="0" cy="0" rx="10" ry="18" fill="#2A1507" />
              <circle cx="3" cy="-6" r="4" fill="#ffffff" />
            </g>
            <g transform={`translate(50, -45) scale(1, ${blink})`}>
              <ellipse cx="0" cy="0" rx="10" ry="18" fill="#2A1507" />
              <circle cx="3" cy="-6" r="4" fill="#ffffff" />
            </g>

            {/* Mouth - confident open smile */}
            <path
              d="M -45,55 Q 0,95 45,55 Q 30,70 0,72 Q -30,70 -45,55 Z"
              fill="#5A0C1C"
              stroke="#2A0710"
              strokeWidth="2"
            />
            {/* Tongue highlight */}
            <path
              d="M -25,65 Q 0,80 25,65 Q 15,72 0,73 Q -15,72 -25,65 Z"
              fill="#E63A5F"
            />
            {/* Teeth */}
            <path
              d="M -20,56 Q 0,60 20,56 L 18,62 L 2,64 L -18,62 Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
