import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { Clouds } from "./components/Clouds";
import { Anpanman } from "./components/Anpanman";
import { Sparkles } from "./components/Sparkles";
import { Title } from "./components/Title";
import { SpeedLines } from "./components/SpeedLines";

export const AnpanmanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: "sans-serif" }}>
      <Background />
      <Clouds />
      <SpeedLines />
      <Sparkles />
      <Anpanman />
      <Title frame={frame} totalFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
