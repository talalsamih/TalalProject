import { Composition } from "remotion";
import { AnpanmanScene } from "./AnpanmanScene";

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
    </>
  );
};
