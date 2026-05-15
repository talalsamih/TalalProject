import { interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  frame: number;
  totalFrames: number;
};

export const Title: React.FC<Props> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Title bounces in after a short delay
  const enter = spring({
    frame: frame - 60,
    fps,
    config: { damping: 8, mass: 0.6, stiffness: 100 },
  });

  const scale = interpolate(enter, [0, 1], [0, 1]);
  const rotate = interpolate(enter, [0, 1], [-25, -6]);
  const opacity = interpolate(enter, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle appears after
  const subEnter = spring({
    frame: frame - 110,
    fps,
    config: { damping: 12, stiffness: 110 },
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);
  const subY = interpolate(subEnter, [0, 1], [20, 0]);

  // Impact burst on heroic pose
  const burst = spring({
    frame: frame - 220,
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const burstScale = interpolate(burst, [0, 1], [0, 1]);
  const burstOpacity = interpolate(burst, [0, 0.5, 1], [0, 1, 0.9]);

  return (
    <>
      {/* Main title */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 90,
          opacity,
          transform: `rotate(${rotate}deg) scale(${scale})`,
          transformOrigin: "left center",
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: "#FFFFFF",
            WebkitTextStroke: "8px #8B1414",
            textShadow:
              "0 10px 0 #8B1414, 0 16px 24px rgba(139,20,20,0.5)",
            letterSpacing: "-2px",
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            lineHeight: 0.95,
          }}
        >
          Anpanman!
        </div>
      </div>

      {/* Subtitle ribbon */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 120,
          opacity: subOpacity,
          transform: `translateY(${subY}px) rotate(-3deg)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "linear-gradient(180deg, #FFD166 0%, #F7B400 100%)",
            padding: "10px 30px",
            borderRadius: 16,
            border: "5px solid #8B4513",
            fontSize: 44,
            fontWeight: 800,
            color: "#8B1414",
            fontFamily: "'Arial Black', sans-serif",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            letterSpacing: "1px",
          }}
        >
          To the rescue!
        </div>
      </div>

      {/* Impact burst behind final pose */}
      <div
        style={{
          position: "absolute",
          top: 520,
          right: 340,
          opacity: burstOpacity,
          transform: `scale(${burstScale})`,
          transformOrigin: "center center",
          zIndex: -1,
        }}
      >
        <svg width="900" height="900" viewBox="-450 -450 900 900">
          <defs>
            <radialGradient id="burstGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFE55C" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FF8A3D" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF3A3A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="0" r="220" fill="url(#burstGrad)" />
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const inner = 120;
            const outer = 360;
            const wInner = 32;
            const wOuter = 0;
            const x1 = Math.cos(angle) * inner;
            const y1 = Math.sin(angle) * inner;
            const x2 = Math.cos(angle) * outer;
            const y2 = Math.sin(angle) * outer;
            const px = -Math.sin(angle);
            const py = Math.cos(angle);
            return (
              <polygon
                key={i}
                points={`${x1 + px * wInner},${y1 + py * wInner} ${x1 - px * wInner},${y1 - py * wInner} ${x2 - px * wOuter},${y2 - py * wOuter} ${x2 + px * wOuter},${y2 + py * wOuter}`}
                fill="#FFE55C"
                opacity="0.85"
              />
            );
          })}
        </svg>
      </div>

      {/* "Anpanch!" shout on impact */}
      <div
        style={{
          position: "absolute",
          top: 600,
          right: 200,
          opacity: burstOpacity,
          transform: `scale(${burstScale}) rotate(8deg)`,
          fontSize: 110,
          fontWeight: 900,
          color: "#FFFFFF",
          WebkitTextStroke: "6px #8B1414",
          textShadow: "0 8px 0 #8B1414",
          fontFamily: "'Arial Black', sans-serif",
        }}
      >
        Anpanch!
      </div>
    </>
  );
};
