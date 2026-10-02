import { Easing, interpolate } from "remotion";

// Premium ease-in-out curve (expo-ish, the "SaaS explainer" feel)
const MAIN_CURVE = Easing.bezier(0.33, 1, 0.68, 1);

interface PremiumMoveConfig {
  from: number;
  to: number;
  startFrame: number;
  endFrame: number;
  /** extra frames after endFrame where the element keeps drifting, barely visible */
  settleFrames?: number;
  /** fraction of the total travel distance used for the invisible continued drift */
  settleAmount?: number;
}

/**
 * Interpolates from `from` to `to` between startFrame/endFrame with a premium
 * ease-in-out curve. After landing, adds a second, much smaller keyframe move
 * (the AE "extra keyframe eased slowly toward a third point" trick) so the
 * element never fully stops moving, even though the drift is too small to see.
 */
export function premiumMove(frame: number, config: PremiumMoveConfig): number {
  const { from, to, startFrame, endFrame, settleFrames = 24, settleAmount = 0.012 } = config;

  const main = interpolate(frame, [startFrame, endFrame], [from, to], {
    easing: MAIN_CURVE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame <= endFrame) {
    return main;
  }

  const settleT = interpolate(frame, [endFrame, endFrame + settleFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drift = (to - from) * settleAmount;
  // bumps slightly past `to` then eases back — motion never fully rests
  const bump = drift * Math.sin(Math.PI * settleT);
  return to + bump;
}

/** 0 -> 1 progress helper using the same premium curve, clamped. */
export function premiumProgress(frame: number, startFrame: number, endFrame: number): number {
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: MAIN_CURVE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Continuous slow idle drift for background elements, so nothing ever sits fully still. */
export function idleDrift(frame: number, amplitude: number, periodFrames: number, phase = 0): number {
  return Math.sin((frame / periodFrames) * Math.PI * 2 + phase) * amplitude;
}
