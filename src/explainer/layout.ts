import { useVideoConfig } from "remotion";

/** Frame geometry for the current composition (16:9 explainer or 9:16 reel). */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return { W: width, H: height, cx: width / 2, cy: height / 2, vertical };
};

export type Layout = ReturnType<typeof useLayout>;
