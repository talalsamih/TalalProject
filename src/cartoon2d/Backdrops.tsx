import React from "react";

export type BackdropName =
  | "sunnyPark"
  | "neonCity"
  | "dojo"
  | "beach"
  | "sunset"
  | "rainbow"
  | "stage"
  | "forest"
  | "space"
  | "alley";

type Props = {
  name: BackdropName;
  scrollX: number; // world pixels scrolled to the left
  time: number;
};

const ParallaxClouds: React.FC<{ scrollX: number; tint?: string }> = ({
  scrollX,
  tint = "#ffffff",
}) => {
  const clouds = [
    { x: 200, y: 160, s: 1.0 },
    { x: 700, y: 90, s: 0.7 },
    { x: 1100, y: 220, s: 1.2 },
    { x: 1550, y: 130, s: 0.9 },
  ];
  const width = 1920;
  return (
    <g>
      {clouds.map((c, i) => {
        const x = ((c.x - scrollX * 0.25) % width + width) % width;
        return (
          <g key={i} transform={`translate(${x}, ${c.y}) scale(${c.s})`}>
            <ellipse cx={40} cy={40} rx={40} ry={25} fill={tint} opacity={0.9} />
            <ellipse cx={90} cy={30} rx={55} ry={32} fill={tint} opacity={0.95} />
            <ellipse cx={150} cy={45} rx={45} ry={28} fill={tint} opacity={0.92} />
          </g>
        );
      })}
    </g>
  );
};

const Hills: React.FC<{ scrollX: number }> = ({ scrollX }) => {
  const width = 1920;
  const sx = ((scrollX * 0.5) % width + width) % width;
  return (
    <g transform={`translate(${-sx}, 0)`}>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i * width}, 0)`}>
          <path
            d={`M 0,720 Q 320,640 640,700 Q 960,760 1280,680 Q 1600,620 1920,700 L 1920,1080 L 0,1080 Z`}
            fill="#4a8f4a"
          />
          <path
            d={`M 0,800 Q 300,760 600,800 Q 900,840 1200,800 Q 1500,760 1920,810 L 1920,1080 L 0,1080 Z`}
            fill="#367a37"
          />
        </g>
      ))}
    </g>
  );
};

const Ground: React.FC<{ scrollX: number; color: string; stripe?: string }> = ({
  scrollX,
  color,
  stripe,
}) => {
  const sx = ((scrollX) % 200 + 200) % 200;
  return (
    <g>
      <rect x={0} y={900} width={1920} height={180} fill={color} />
      {stripe && (
        <g transform={`translate(${-sx}, 0)`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={i * 200}
              y={960}
              width={100}
              height={8}
              fill={stripe}
              opacity={0.8}
              rx={4}
            />
          ))}
        </g>
      )}
    </g>
  );
};

const SunnyPark: React.FC<Props> = ({ scrollX }) => (
  <g>
    <defs>
      <linearGradient id="parkSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6ec9ff" />
        <stop offset="100%" stopColor="#c8edff" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#parkSky)" />
    <circle cx={1550} cy={180} r={70} fill="#fff3a8" />
    <circle cx={1550} cy={180} r={130} fill="#fff3a8" opacity="0.35" />
    <ParallaxClouds scrollX={scrollX} />
    <Hills scrollX={scrollX} />
    <Ground scrollX={scrollX} color="#5aad5a" stripe="#87d187" />
  </g>
);

const NeonCity: React.FC<Props> = ({ scrollX, time }) => {
  const width = 1920;
  const sx = ((scrollX * 0.6) % width + width) % width;
  const buildings = Array.from({ length: 20 }, (_, i) => ({
    x: i * 120 + (i % 3) * 20,
    h: 250 + (i * 73) % 380,
    hue: 280 + ((i * 47) % 120),
  }));
  return (
    <g>
      <defs>
        <linearGradient id="neonSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0633" />
          <stop offset="60%" stopColor="#5e1a7a" />
          <stop offset="100%" stopColor="#ff3a7a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#neonSky)" />
      {/* Stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <circle
          key={i}
          cx={(i * 97) % 1920}
          cy={(i * 53) % 500}
          r={1 + (i % 3) * 0.6}
          fill="#fff"
          opacity={0.6 + Math.sin(time * 2 + i) * 0.3}
        />
      ))}
      {/* Moon */}
      <circle cx={300} cy={180} r={60} fill="#f8e1ff" />
      <circle cx={280} cy={170} r={8} fill="#d8b8e5" />
      <circle cx={330} cy={200} r={6} fill="#d8b8e5" />
      {/* Skyline */}
      <g transform={`translate(${-sx}, 0)`}>
        {[0, 1].map((loop) => (
          <g key={loop} transform={`translate(${loop * width}, 0)`}>
            {buildings.map((b, i) => (
              <g key={i}>
                <rect
                  x={b.x}
                  y={1080 - b.h - 180}
                  width={90}
                  height={b.h}
                  fill={`hsl(${b.hue}, 60%, 18%)`}
                  stroke={`hsl(${b.hue}, 80%, 50%)`}
                  strokeWidth="2"
                />
                {/* windows */}
                {Array.from({ length: Math.floor(b.h / 30) }).map((_, r) =>
                  Array.from({ length: 3 }).map((__, c) => (
                    <rect
                      key={`${r}-${c}`}
                      x={b.x + 10 + c * 25}
                      y={1080 - b.h - 170 + r * 30}
                      width={15}
                      height={10}
                      fill={((i + r + c) % 3 === 0) ? `hsl(${b.hue + 40}, 100%, 70%)` : "#222"}
                    />
                  ))
                )}
              </g>
            ))}
          </g>
        ))}
      </g>
      <Ground scrollX={scrollX} color="#120625" stripe="#ff44aa" />
    </g>
  );
};

const Dojo: React.FC<Props> = ({ scrollX }) => (
  <g>
    <defs>
      <linearGradient id="dojoWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c69a5a" />
        <stop offset="100%" stopColor="#8b5a1f" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={900} fill="url(#dojoWall)" />
    {/* Shoji door panels */}
    {Array.from({ length: 6 }).map((_, i) => (
      <g key={i}>
        <rect x={i * 320 + 20} y={260} width={280} height={620} fill="#f6eccc" stroke="#3a220f" strokeWidth="6" />
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 3 }).map((__, c) => (
            <rect
              key={`${r}-${c}`}
              x={i * 320 + 20 + 12 + c * 86}
              y={260 + 12 + r * 150}
              width={80}
              height={140}
              fill="none"
              stroke="#3a220f"
              strokeWidth="3"
            />
          ))
        )}
      </g>
    ))}
    {/* Banner */}
    <rect x={720} y={40} width={480} height={180} fill="#9b1b1b" stroke="#2a0000" strokeWidth="6" />
    <text x={960} y={160} textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontSize="100" fill="#ffd166" fontWeight="900">
      DOJO
    </text>
    <Ground scrollX={scrollX} color="#5a3a18" stripe="#8b5a28" />
  </g>
);

const Beach: React.FC<Props> = ({ scrollX }) => (
  <g>
    <defs>
      <linearGradient id="beachSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#73d2ff" />
        <stop offset="100%" stopColor="#ffddb0" />
      </linearGradient>
      <linearGradient id="beachSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a8bb8" />
        <stop offset="100%" stopColor="#4fc0e0" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={750} fill="url(#beachSky)" />
    <circle cx={1400} cy={220} r={80} fill="#fffae0" />
    <ParallaxClouds scrollX={scrollX} />
    <rect x={0} y={700} width={1920} height={200} fill="url(#beachSea)" />
    <path
      d={`M 0,720 Q 480,700 960,730 T 1920,720 L 1920,750 L 0,750 Z`}
      fill="#ffffff"
      opacity="0.7"
    />
    <Ground scrollX={scrollX} color="#f4d68a" stripe="#e0b558" />
  </g>
);

const Sunset: React.FC<Props> = ({ scrollX }) => (
  <g>
    <defs>
      <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a1b66" />
        <stop offset="40%" stopColor="#ff6f61" />
        <stop offset="80%" stopColor="#ffb78a" />
        <stop offset="100%" stopColor="#ffd58f" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#sunsetSky)" />
    <circle cx={960} cy={540} r={180} fill="#fff3a8" />
    <circle cx={960} cy={540} r={260} fill="#ffc07a" opacity="0.5" />
    <ParallaxClouds scrollX={scrollX} tint="#ffe5a8" />
    <Hills scrollX={scrollX} />
    <Ground scrollX={scrollX} color="#3a1b44" stripe="#7a3a6a" />
  </g>
);

const Rainbow: React.FC<Props> = ({ scrollX, time }) => {
  const bands = ["#ff3a3a", "#ff8b1f", "#ffd166", "#66dd66", "#3a8cff", "#8a3affcc"];
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0a1b3a" />
      {bands.map((c, i) => (
        <rect
          key={i}
          x={0}
          y={i * 120}
          width={1920}
          height={120}
          fill={c}
          opacity={0.85}
        />
      ))}
      {/* Stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle
          key={i}
          cx={(i * 137) % 1920}
          cy={(i * 73) % 700 + 20}
          r={3 + (i % 3)}
          fill="#fff"
          opacity={0.5 + Math.sin(time * 4 + i) * 0.4}
        />
      ))}
      <Ground scrollX={scrollX} color="#2a0c55" stripe="#ff7fbf" />
    </g>
  );
};

const Stage: React.FC<Props> = ({ scrollX }) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#1a0808" />
    {/* Curtain */}
    {Array.from({ length: 20 }).map((_, i) => (
      <path
        key={i}
        d={`M ${i * 110},0 Q ${i * 110 + 55},60 ${i * 110},120 L ${i * 110 + 110},120 L ${i * 110 + 110},0 Z`}
        fill={i % 2 === 0 ? "#8b1414" : "#6b0808"}
      />
    ))}
    <rect x={0} y={120} width={1920} height={20} fill="#ffd166" />
    {/* Spotlights */}
    <path
      d={`M 400,140 L 200,900 L 600,900 Z`}
      fill="#fff6a8"
      opacity="0.22"
    />
    <path
      d={`M 1520,140 L 1320,900 L 1720,900 Z`}
      fill="#fff6a8"
      opacity="0.22"
    />
    <Ground scrollX={scrollX} color="#3a220f" stripe="#ffd166" />
  </g>
);

const Forest: React.FC<Props> = ({ scrollX }) => {
  const width = 1920;
  const sx = ((scrollX * 0.7) % width + width) % width;
  return (
    <g>
      <defs>
        <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#82c8ff" />
          <stop offset="100%" stopColor="#d6f3d0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#forestSky)" />
      <ParallaxClouds scrollX={scrollX} />
      <g transform={`translate(${-sx}, 0)`}>
        {[0, 1].map((loop) => (
          <g key={loop} transform={`translate(${loop * width}, 0)`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i} transform={`translate(${i * 200 + (i % 2) * 60}, 500)`}>
                {/* Tree trunk */}
                <rect x={-14} y={200} width={28} height={220} fill="#5a3a18" />
                {/* Foliage */}
                <circle cx={0} cy={160} r={90} fill="#2a6a2a" />
                <circle cx={-40} cy={200} r={80} fill="#3a8a3a" />
                <circle cx={40} cy={200} r={80} fill="#3a8a3a" />
                <circle cx={0} cy={220} r={90} fill="#4a9a4a" />
              </g>
            ))}
          </g>
        ))}
      </g>
      <Ground scrollX={scrollX} color="#6aa060" stripe="#90c080" />
    </g>
  );
};

const Space: React.FC<Props> = ({ time }) => (
  <g>
    <defs>
      <radialGradient id="spaceBg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#2e0a5a" />
        <stop offset="100%" stopColor="#030318" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#spaceBg)" />
    {/* Stars */}
    {Array.from({ length: 120 }).map((_, i) => (
      <circle
        key={i}
        cx={(i * 163) % 1920}
        cy={(i * 97) % 1080}
        r={1 + (i % 4) * 0.5}
        fill="#fff"
        opacity={0.5 + Math.sin(time * 3 + i) * 0.4}
      />
    ))}
    {/* Planets */}
    <circle cx={300} cy={260} r={90} fill="#ff8a40" />
    <circle cx={280} cy={240} r={20} fill="#ffae6d" />
    <circle cx={1600} cy={200} r={110} fill="#6bd0a8" />
    <ellipse cx={1600} cy={200} rx={170} ry={22} fill="none" stroke="#9be0c2" strokeWidth="5" />
    <circle cx={960} cy={980} r={600} fill="#4a8aff" opacity={0.3} />
  </g>
);

const Alley: React.FC<Props> = ({ scrollX }) => {
  const width = 1920;
  const sx = ((scrollX * 0.5) % width + width) % width;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0a0815" />
      {/* Distant glow */}
      <rect x={0} y={600} width={1920} height={300} fill="#2a103a" />
      {/* Walls */}
      <g transform={`translate(${-sx}, 0)`}>
        {[0, 1].map((loop) => (
          <g key={loop} transform={`translate(${loop * width}, 0)`}>
            <rect x={0} y={100} width={1920} height={780} fill="#1a1020" />
            {/* Neon signs */}
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={i} transform={`translate(${i * 320 + 40}, ${200 + (i % 2) * 180})`}>
                <rect x={0} y={0} width={180} height={60} fill="#1a0520" stroke={`hsl(${300 + i * 30}, 100%, 60%)`} strokeWidth="3" />
                <text x={90} y={42} textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="34" fill={`hsl(${300 + i * 30}, 100%, 70%)`}>
                  NEON
                </text>
              </g>
            ))}
          </g>
        ))}
      </g>
      <Ground scrollX={scrollX} color="#0a0515" stripe="#ff44aa" />
    </g>
  );
};

export const Backdrop: React.FC<Props> = (props) => {
  switch (props.name) {
    case "sunnyPark":
      return <SunnyPark {...props} />;
    case "neonCity":
      return <NeonCity {...props} />;
    case "dojo":
      return <Dojo {...props} />;
    case "beach":
      return <Beach {...props} />;
    case "sunset":
      return <Sunset {...props} />;
    case "rainbow":
      return <Rainbow {...props} />;
    case "stage":
      return <Stage {...props} />;
    case "forest":
      return <Forest {...props} />;
    case "space":
      return <Space {...props} />;
    case "alley":
      return <Alley {...props} />;
  }
};
