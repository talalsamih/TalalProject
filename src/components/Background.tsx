import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const sunY = interpolate(frame, [0, 300], [180, 140]);
  const hueShift = interpolate(frame, [0, 300], [0, 15]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(
          180deg,
          hsl(${210 - hueShift}, 80%, 65%) 0%,
          hsl(${30 + hueShift}, 90%, 75%) 60%,
          hsl(${20 + hueShift}, 95%, 82%) 100%
        )`,
      }}
    >
      {/* Sun with glow */}
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3B0" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFD166" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF8A5B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFAE1" />
            <stop offset="100%" stopColor="#FFD166" />
          </radialGradient>
        </defs>
        <circle cx="1500" cy={sunY} r="320" fill="url(#sunGlow)" />
        <circle cx="1500" cy={sunY} r="130" fill="url(#sunCore)" />

        {/* Rolling hills */}
        <path
          d="M0,820 C320,740 520,880 820,790 C1120,710 1380,880 1680,800 C1820,770 1920,820 1920,820 L1920,1080 L0,1080 Z"
          fill="#6BCB77"
          opacity="0.85"
        />
        <path
          d="M0,900 C240,860 500,940 780,890 C1060,840 1340,950 1640,900 C1800,875 1920,900 1920,900 L1920,1080 L0,1080 Z"
          fill="#4CAF50"
        />
        <path
          d="M0,980 C300,960 600,1000 900,980 C1200,960 1500,1000 1920,980 L1920,1080 L0,1080 Z"
          fill="#2E8B57"
        />
      </svg>
    </AbsoluteFill>
  );
};
