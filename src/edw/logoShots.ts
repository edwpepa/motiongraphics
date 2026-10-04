import { Shot } from "./logo3d";
import { FPS, w } from "./kit";

/** when the 3D logo is on screen, and how the camera moves over it (it lies flat on a black floor, y is up) */
export const R = w("edw", 0) - 0.02; // the BRAAM
export const MID_FROM = 29.4;
export const MID_END = w("roof", 0) + 0.45;
export const FIN = w("yours", 0) - 0.05;
export const REVEAL = FIN + 1.83;
export const END_TO = 70;

export const MID: Shot[] = [
  { from: MID_FROM, to: 30.25, cam: [[-9.5, 1.1, 2.6], [-4.0, 1.25, 2.2]], look: [[0.0, 0.3, -0.8], [4.5, 0.3, -1.0]], env: [0, 0.6], fov: 32, exposure: 1.35, dof: 1 },
  { from: 30.25, to: 31.05, cam: [[8.4, 2.2, -6.6], [5.6, 1.9, -5.8]], look: [[3.2, 0.3, -1.2], [2.8, 0.3, -1.0]], env: [1.2, 1.9], fov: 32, exposure: 1.35, dof: 1 },
  { from: 31.05, to: R, cam: [[-11.5, 1.0, 1.8], [-8.8, 1.1, 1.0]], look: [[-5, 0.3, -0.4], [-4.5, 0.3, -0.5]], env: [2.5, 3.1], fov: 32, exposure: 1.35, dof: 1 },
  { from: R, to: MID_END + 0.5, cam: [[0, 7, 15.5], [0, 23, 3.5]], look: [[0, 0, 0.3], [0, 0, 0]], env: [3.6, 4.4], fov: 32, exposure: 1.1, dof: 0 },
];
export const END: Shot[] = [
  { from: FIN, to: FIN + 0.63, cam: [[3.4, 1.1, 3.6], [2.0, 1.2, 3.1]], look: [[-0.4, 0.3, 0.2], [-0.8, 0.3, 0.0]], env: [0.3, 0.8], fov: 32, exposure: 1.35, dof: 1 },
  { from: FIN + 0.63, to: FIN + 1.23, cam: [[-9.6, 1.6, -6.0], [-8.4, 1.6, -5.2]], look: [[-5.0, 0.3, -2.6], [-4.6, 0.3, -2.4]], env: [1.5, 2.0], fov: 32, exposure: 1.35, dof: 1 },
  { from: FIN + 1.23, to: REVEAL, cam: [[-6, 0.9, 6.0], [3.5, 0.9, 6.0]], look: [[-3.5, 0.1, 2.9], [6, 0.1, 2.9]], env: [3.6, 4.3], fov: 32, exposure: 1.8, dof: 1 },
  { from: REVEAL, to: END_TO + 0.5, cam: [[0, 5.5, 15], [0, 25, 1.2]], look: [[0, 0, 0.5], [0, 0, 0]], env: [3.4, 4.6], fov: 32, exposure: 1.1, dof: 0 },
];

/** the frame ranges that are pre-rendered to video (inclusive) */
export const MID_FRAMES: [number, number] = [Math.floor(MID_FROM * FPS), Math.ceil(MID_END * FPS)];
export const END_FRAMES: [number, number] = [Math.floor(FIN * FPS), END_TO * FPS - 1];
