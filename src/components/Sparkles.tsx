import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const SPARKLES = Array.from({ length: 30 }, (_, i) => ({
  seed: i,
  baseX: (i * 137) % 1920,
  baseY: (i * 73) % 700 + 50,
  size: 8 + ((i * 11) % 18),
  delay: (i * 7) % 90,
  duration: 40 + ((i * 13) % 40),
}));

const Star: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20">
    <defs>
      <radialGradient id={`starGrad-${size}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#FFF3B0" />
        <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path
      d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z"
      fill={`url(#starGrad-${size})`}
    />
  </svg>
);

export const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {SPARKLES.map((s) => {
        const localFrame = (frame - s.delay) % (s.duration + 30);
        const t = localFrame / s.duration;
        const opacity =
          localFrame < 0
            ? 0
            : interpolate(t, [0, 0.3, 0.7, 1], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        const scale = interpolate(t, [0, 0.5, 1], [0.4, 1.2, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const rotate = t * 180;
        const drift = Math.sin(frame / 20 + s.seed) * 10;

        return (
          <div
            key={s.seed}
            style={{
              position: "absolute",
              left: s.baseX + drift,
              top: s.baseY,
              opacity,
              transform: `scale(${scale}) rotate(${rotate}deg)`,
              filter: "drop-shadow(0 0 8px rgba(255,230,130,0.8))",
            }}
          >
            <Star size={s.size} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
