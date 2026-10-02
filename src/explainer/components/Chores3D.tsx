import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useCurrentFrame } from "remotion";
import { clamp01, ease } from "../lib/anim";

/**
 * Three studio-lit 3D props for the chores (faucet, flat-pack wardrobe, paint roller + bucket).
 * Every prop shares one grade: glossy porcelain white, emerald accents, the same key / rim lights
 * and reflections, so they read as one product family. Each one whips in from the left spinning,
 * settles and floats while its line is spoken, then spins out to the right.
 */

const WHITE = { color: "#dfe7e2", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 };
const GREEN = { color: "#00b862", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 };
const DEEP = { color: "#0b6b3d", roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.2 };

const White: React.FC = () => <meshPhysicalMaterial {...WHITE} />;
const Green: React.FC = () => <meshPhysicalMaterial {...GREEN} />;

const Studio: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#bfeed3", 0.9]} />
      <directionalLight position={[-4, 6, 6]} intensity={2.8} />
      <directionalLight position={[5, 1, 4]} intensity={0.6} color="#e6fff1" />
      <pointLight position={[4, 2, -3]} intensity={30} color="#3dff9a" distance={14} />
      <pointLight position={[-5, -2, 2]} intensity={8} color="#d8fff0" distance={14} />
    </>
  );
};

// ------------------------------------------------------------------ props

const Faucet: React.FC<{ frame: number }> = ({ frame }) => {
  const spout = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0.95, 1.0, 0), new THREE.Vector3(0.95, 0.35, 0)),
        48,
        0.13,
        24
      ),
    []
  );
  const drops = Array.from({ length: 5 }, (_, i) => {
    const t = ((frame + i * 7) % 35) / 35;
    return { y: 0.25 - t * t * 2.4, s: 0.07 + 0.03 * Math.sin(i * 2.1), o: t < 0.92 ? 1 : 0 };
  });
  return (
    <group position={[-0.35, -0.2, 0]}>
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.16, 48]} />
        <White />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 1.15, 40]} />
        <White />
      </mesh>
      <mesh geometry={spout}>
        <White />
      </mesh>
      <mesh position={[0.95, 0.33, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 32]} />
        <Green />
      </mesh>
      {/* lever: a green cap with a handle sweeping back */}
      <group position={[0, 0.12, 0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.22, 0.2, 32]} />
          <Green />
        </mesh>
        <mesh position={[-0.32, 0.2, 0]} rotation={[0, 0, 1.0]}>
          <capsuleGeometry args={[0.06, 0.55, 8, 16]} />
          <Green />
        </mesh>
      </group>
      {drops.map((d, i) => (
        <mesh key={i} position={[0.95, d.y, 0]} scale={[d.s, d.s * 1.35, d.s]} visible={d.o > 0}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshPhysicalMaterial color="#5cf0a8" roughness={0.05} clearcoat={1} transparent opacity={0.85} emissive="#00c46a" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
};

const Wardrobe: React.FC<{ open: number }> = ({ open }) => (
  <group position={[0, -0.1, 0]} scale={0.86}>
    <mesh>
      <boxGeometry args={[1.7, 2.1, 0.8]} />
      <White />
    </mesh>
    {/* interior */}
    <mesh position={[0, 0, 0.36]}>
      <boxGeometry args={[1.56, 1.96, 0.1]} />
      <meshPhysicalMaterial {...DEEP} />
    </mesh>
    <mesh position={[0, 0.25, 0.3]}>
      <boxGeometry args={[1.5, 0.05, 0.4]} />
      <White />
    </mesh>
    {/* crown + plinth */}
    <mesh position={[0, 1.08, 0.02]}>
      <boxGeometry args={[1.8, 0.08, 0.86]} />
      <Green />
    </mesh>
    <mesh position={[0, -0.86, 0.43]}>
      <boxGeometry args={[1.62, 0.32, 0.06]} />
      <White />
    </mesh>
    <mesh position={[0, -0.86, 0.48]}>
      <boxGeometry args={[0.4, 0.04, 0.04]} />
      <Green />
    </mesh>
    {/* left door (closed) */}
    <mesh position={[-0.42, 0.14, 0.43]}>
      <boxGeometry args={[0.8, 1.72, 0.06]} />
      <White />
    </mesh>
    <mesh position={[-0.42, 0.14, 0.47]}>
      <boxGeometry args={[0.58, 1.46, 0.03]} />
      <White />
    </mesh>
    <mesh position={[-0.1, 0.14, 0.5]}>
      <cylinderGeometry args={[0.035, 0.035, 0.42, 16]} />
      <Green />
    </mesh>
    {/* right door swings open on its hinge */}
    <group position={[0.84, 0, 0.43]} rotation={[0, open * 1.9, 0]}>
      <mesh position={[-0.42, 0.14, 0]}>
        <boxGeometry args={[0.8, 1.72, 0.06]} />
        <White />
      </mesh>
      <mesh position={[-0.42, 0.14, 0.04]}>
        <boxGeometry args={[0.58, 1.46, 0.03]} />
        <White />
      </mesh>
      <mesh position={[-0.74, 0.14, 0.07]}>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 16]} />
        <Green />
      </mesh>
    </group>
    {[-0.7, 0.7].map((x) =>
      [-0.3, 0.3].map((z) => (
        <mesh key={`${x}${z}`} position={[x, -1.13, z]}>
          <cylinderGeometry args={[0.06, 0.05, 0.16, 16]} />
          <Green />
        </mesh>
      ))
    )}
  </group>
);

const Paint: React.FC = () => {
  const frameTube = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0.68, 0.75, 0), new THREE.Vector3(0.82, 0.75, 0), new THREE.Vector3(0.82, 0.35, 0), new THREE.Vector3(0.1, 0.1, 0), new THREE.Vector3(0.1, -0.35, 0)]),
        48,
        0.04,
        12
      ),
    []
  );
  const bail = useMemo(() => new THREE.TorusGeometry(0.66, 0.025, 12, 48, Math.PI), []);
  return (
    <group position={[-0.15, 0, 0]} scale={0.85}>
      {/* bucket */}
      <group position={[-0.55, -0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.66, 0.56, 1.0, 56]} />
          <White />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.05, 16, 56]} />
          <White />
        </mesh>
        <mesh position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.63, 0.63, 0.04, 56]} />
          <meshPhysicalMaterial color="#00c46a" roughness={0.12} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.0, 0.0]}>
          <cylinderGeometry args={[0.665, 0.62, 0.36, 56, 1, true]} />
          <Green />
        </mesh>
        <mesh geometry={bail} position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
          <meshPhysicalMaterial {...DEEP} />
        </mesh>
      </group>
      {/* roller, leaning on the bucket */}
      <group position={[0.35, 0.05, 0.25]} rotation={[0.1, -0.5, -0.5]}>
        <mesh position={[0.68, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.95, 40]} />
          <meshPhysicalMaterial color="#00b862" roughness={0.85} sheen={1} sheenColor="#9dffcb" sheenRoughness={0.5} />
        </mesh>
        <mesh position={[0.2, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 40]} />
          <White />
        </mesh>
        <mesh geometry={frameTube}>
          <White />
        </mesh>
        <mesh position={[0.1, -0.75, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.8, 24]} />
          <Green />
        </mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ choreography

export type PropTiming = { in: number; out: number };

const Prop: React.FC<{ t: PropTiming; frame: number; children: React.ReactNode; baseY: number; scale: number }> = ({ t, frame, children, baseY, scale }) => {
  if (frame < t.in - 2 || frame > t.out + 16) return null;
  const inT = ease.outExpo(clamp01((frame - t.in) / 22));
  const outT = ease.inCubic(clamp01((frame - t.out) / 14));
  const hold = frame - t.in;
  const x = -7.5 * (1 - inT) + 8 * outT;
  const y = baseY + Math.sin(hold / 16) * 0.06 + 0.4 * outT;
  const ry = -Math.PI * 2.2 * (1 - inT) + Math.PI * 2 * outT * 1.1 + Math.sin(hold / 22) * 0.3 + 0.55;
  const rz = 0.35 * (1 - inT) - 0.3 * outT;
  return (
    <group position={[x, y, 1.5 * outT]} rotation={[0.18, ry, rz]} scale={scale * (0.85 + 0.15 * inT)}>
      {children}
    </group>
  );
};

export const Chores3D: React.FC<{ width: number; height: number; timings: PropTiming[]; vertical: boolean }> = ({ width, height, timings, vertical }) => {
  const frame = useCurrentFrame();
  const baseY = vertical ? -0.42 : -0.5;
  const scale = vertical ? 1.25 : 1.15;
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 30, position: [0, 0.2, vertical ? 13 : 9] }} gl={{ antialias: true, alpha: true }} style={{ position: "absolute", inset: 0 }} onCreated={({ gl }) => { gl.toneMappingExposure = 0.85; }}>
      <Studio />
      <Prop t={timings[0]} frame={frame} baseY={baseY} scale={scale}>
        <Faucet frame={frame} />
      </Prop>
      <Prop t={timings[1]} frame={frame} baseY={baseY} scale={scale}>
        <Wardrobe open={ease.inOutCubic(clamp01((frame - timings[1].in - 16) / 18))} />
      </Prop>
      <Prop t={timings[2]} frame={frame} baseY={baseY} scale={scale}>
        <Paint />
      </Prop>
    </ThreeCanvas>
  );
};

/** where a prop sits on screen (0..1 of width) — used to slide its DOM contact shadow along */
export const propScreenX = (t: PropTiming, frame: number) => {
  const inT = ease.outExpo(clamp01((frame - t.in) / 22));
  const outT = ease.inCubic(clamp01((frame - t.out) / 14));
  return -7.5 * (1 - inT) + 8 * outT;
};
