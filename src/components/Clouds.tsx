import { AbsoluteFill, useCurrentFrame } from "remotion";

type Cloud = {
  y: number;
  scale: number;
  speed: number;
  offset: number;
  opacity: number;
};

const CLOUDS: Cloud[] = [
  { y: 120, scale: 1.2, speed: 0.8, offset: 0, opacity: 0.95 },
  { y: 260, scale: 0.8, speed: 1.4, offset: 600, opacity: 0.85 },
  { y: 80, scale: 0.6, speed: 2.0, offset: 1200, opacity: 0.7 },
  { y: 340, scale: 1.0, speed: 1.1, offset: 300, opacity: 0.9 },
  { y: 200, scale: 0.9, speed: 1.6, offset: 900, opacity: 0.8 },
  { y: 420, scale: 0.7, speed: 1.8, offset: 1500, opacity: 0.75 },
];

const CloudShape: React.FC = () => (
  <svg width="300" height="120" viewBox="0 0 300 120">
    <defs>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e6ecff" />
      </linearGradient>
    </defs>
    <ellipse cx="70" cy="80" rx="55" ry="35" fill="url(#cloudGrad)" />
    <ellipse cx="130" cy="60" rx="70" ry="45" fill="url(#cloudGrad)" />
    <ellipse cx="200" cy="70" rx="60" ry="40" fill="url(#cloudGrad)" />
    <ellipse cx="240" cy="85" rx="45" ry="28" fill="url(#cloudGrad)" />
  </svg>
);

export const Clouds: React.FC = () => {
  const frame = useCurrentFrame();
  const totalWidth = 1920 + 600;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CLOUDS.map((cloud, i) => {
        const x =
          ((cloud.offset - frame * cloud.speed * 3) % totalWidth + totalWidth) %
            totalWidth -
          300;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: cloud.y,
              transform: `scale(${cloud.scale})`,
              opacity: cloud.opacity,
              filter: "drop-shadow(0 8px 16px rgba(100,130,200,0.25))",
            }}
          >
            <CloudShape />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
