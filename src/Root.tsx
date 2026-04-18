import { Composition } from "remotion";
import { AnpanmanScene } from "./AnpanmanScene";
import { Robot3DScene } from "./Robot3DScene";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Anpanman"
        component={AnpanmanScene}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Robot3D"
        component={Robot3DScene}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
