import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const LINES = Array.from({ length: 24 }, (_, i) => ({
  y: 40 + i * 45 + (i % 3) * 15,
  length: 120 + ((i * 37) % 180),
  speed: 1 + (i % 5) * 0.4,
  opacity: 0.15 + ((i * 13) % 30) / 100,
}));

export const SpeedLines: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: appear }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {LINES.map((line, i) => {
          const travel = 2200;
          const x =
            ((1920 + line.length - ((frame * line.speed * 30) % travel)) %
              travel) -
            line.length;
          return (
            <rect
              key={i}
              x={x}
              y={line.y}
              width={line.length}
              height={3}
              fill="#ffffff"
              opacity={line.opacity}
              rx={1.5}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
