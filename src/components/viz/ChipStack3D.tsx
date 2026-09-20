import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, RoundedBox, Instance, Instances } from '@react-three/drei';

type LayerId = 'soc' | 'hbm' | 'microbump' | 'interposer' | 'tsv' | 'c4' | 'substrate';

interface LayerInfo {
  id: LayerId;
  name: string;
  en: string;
  desc: string;
  color: string;
}

const LAYERS: LayerInfo[] = [
  { id: 'soc', name: 'SoC 裸片', en: 'Logic Die', desc: '主计算芯片，通过 micro-bump 直接键合在硅中介层上', color: '#274060' },
  { id: 'hbm', name: 'HBM 堆栈', en: 'HBM Stack', desc: '高带宽内存，DRAM 裸片经 TSV 堆叠后与 SoC 同基互连', color: '#3d5a80' },
  { id: 'microbump', name: 'Micro-bump', en: 'Micro-bump', desc: '裸片与中介层间的微凸点，间距 40 μm 量级', color: '#d4a24e' },
  { id: 'interposer', name: '硅中介层', en: 'Silicon Interposer', desc: '带 RDL 布线的硅片，承载 die 间高密度互连，线宽亚微米到 1–2 μm 量级', color: '#a8b3c8' },
  { id: 'tsv', name: 'TSV 硅通孔', en: 'Through-Silicon Via', desc: '穿透中介层的垂直铜互连，典型直径 5–10 μm、深 50–100 μm', color: '#c9a227' },
  { id: 'c4', name: 'C4 凸点', en: 'Flip-Chip Bumps', desc: '中介层与封装基板间的倒装焊凸点，间距约 150 μm 量级', color: '#d4a24e' },
  { id: 'substrate', name: '封装基板', en: 'Package Substrate', desc: '有机基板，完成扇出布线并经 BGA 焊球连接 PCB', color: '#101826' },
];

// 几何尺寸（任意单位，比例示意）
const SUB = { w: 10, h: 0.5, d: 7 };
const INTP = { w: 9, h: 0.35, d: 6 };
const DIE_SOC = { w: 3.6, h: 0.4, d: 3.4 };
const DIE_HBM = { w: 1.8, h: 0.4, d: 3.4 };

// 凸点网格：覆盖 SoC 与两颗 HBM 的投影区域
const BUMP_ROWS_Z = [-1.4, -0.7, 0, 0.7, 1.4];
const BUMP_XS: number[] = (() => {
  const xs: number[] = [];
  for (let x = -1.5; x <= 1.5; x += 0.5) xs.push(x);
  for (let x = -3.6; x <= -2.4; x += 0.4) xs.push(x);
  for (let x = 2.4; x <= 3.6; x += 0.4) xs.push(x);
  return xs;
})();
const BUMP_POSITIONS = BUMP_ROWS_Z.flatMap((z) => BUMP_XS.map((x) => [x, 0, z] as const));

// TSV：位于中介层前缘剖面处的一排通孔
const TSV_XS: number[] = (() => {
  const xs: number[] = [];
  for (let x = -3.8; x <= 3.8; x += 0.4) xs.push(x);
  return xs;
})();

function Explodable({
  baseY,
  explodeY,
  exploded,
  children,
}: {
  baseY: number;
  explodeY: number;
  exploded: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const k = useRef(0);
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.damp(k.current, exploded ? 1 : 0, 4, dt);
    ref.current.position.y = baseY + k.current * explodeY;
  });
  return (
    <group ref={ref} position={[0, baseY, 0]}>
      {children}
    </group>
  );
}

interface PickProps {
  id: LayerId;
  active: LayerId | null;
  onSelect: (id: LayerId | null) => void;
}

function pickProps({ id, active, onSelect }: PickProps) {
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(active === id ? null : id);
    },
    onPointerOver: () => {
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      document.body.style.cursor = 'auto';
    },
  };
}

function dimMaterial(dimmed: boolean, activeId: boolean) {
  return {
    transparent: dimmed,
    opacity: dimmed ? 0.1 : 1,
    emissive: activeId ? '#06b6d4' : '#000000',
    emissiveIntensity: activeId ? 0.4 : 0,
  };
}

function LayerLabel({ show, position, layer }: { show: boolean; position: [number, number, number]; layer: LayerInfo }) {
  if (!show) return null;
  return (
    <Html position={position} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs shadow-sm">
        <span className="font-semibold text-slate-800">{layer.name}</span>
        <span className="ml-1.5 text-slate-500">{layer.en}</span>
      </div>
    </Html>
  );
}

interface SceneProps {
  exploded: boolean;
  active: LayerId | null;
  onSelect: (id: LayerId | null) => void;
}

function Scene({ exploded, active, onSelect }: SceneProps) {
  const dim = (id: LayerId) => active !== null && active !== id;
  const info = (id: LayerId) => LAYERS.find((l) => l.id === id)!;

  // SoC / HBM 布局
  const hbmOffset = DIE_SOC.w / 2 + 0.3 + DIE_HBM.w / 2; // 3.0
  const dieY = 1.39;

  return (
    <group onClick={() => onSelect(null)}>
      {/* 裸片层：SoC + HBM ×2 */}
      <Explodable baseY={dieY} explodeY={4.4} exploded={exploded}>
        <RoundedBox
          args={[DIE_SOC.w, DIE_SOC.h, DIE_SOC.d]}
          radius={0.04}
          smoothness={3}
          {...pickProps({ id: 'soc', active, onSelect })}
        >
          <meshStandardMaterial
            color="#274060"
            metalness={0.45}
            roughness={0.35}
            {...dimMaterial(dim('soc'), active === 'soc')}
          />
        </RoundedBox>
        {[-hbmOffset, hbmOffset].map((x) => (
          <RoundedBox
            key={x}
            args={[DIE_HBM.w, DIE_HBM.h, DIE_HBM.d]}
            radius={0.04}
            smoothness={3}
            position={[x, 0, 0]}
            {...pickProps({ id: 'hbm', active, onSelect })}
          >
            <meshStandardMaterial
              color="#3d5a80"
              metalness={0.45}
              roughness={0.35}
              {...dimMaterial(dim('hbm'), active === 'hbm')}
            />
          </RoundedBox>
        ))}
        <LayerLabel show={active === 'soc'} position={[0, DIE_SOC.h + 0.45, DIE_SOC.d / 2]} layer={info('soc')} />
        <LayerLabel show={active === 'hbm'} position={[hbmOffset, DIE_HBM.h + 0.45, DIE_HBM.d / 2]} layer={info('hbm')} />
      </Explodable>

      {/* Micro-bump 层 */}
      <Explodable baseY={1.13} explodeY={3.3} exploded={exploded}>
        <Instances limit={128} castShadow {...pickProps({ id: 'microbump', active, onSelect })}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 10]} />
          <meshStandardMaterial
            color="#d4a24e"
            metalness={0.9}
            roughness={0.25}
            {...dimMaterial(dim('microbump'), active === 'microbump')}
          />
          {BUMP_POSITIONS.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
        <LayerLabel show={active === 'microbump'} position={[-4.6, 0.4, 1.7]} layer={info('microbump')} />
      </Explodable>

      {/* 硅中介层 + TSV */}
      <Explodable baseY={0.895} explodeY={2.2} exploded={exploded}>
        <RoundedBox
          args={[INTP.w, INTP.h, INTP.d]}
          radius={0.04}
          smoothness={3}
          {...pickProps({ id: 'interposer', active, onSelect })}
        >
          <meshStandardMaterial
            color="#a8b3c8"
            metalness={0.3}
            roughness={0.45}
            {...dimMaterial(dim('interposer'), active === 'interposer')}
          />
        </RoundedBox>
        <group>
          {TSV_XS.map((x) => (
            <mesh key={x} position={[x, 0, INTP.d / 2]} {...pickProps({ id: 'tsv', active, onSelect })}>
              <cylinderGeometry args={[0.045, 0.045, INTP.h * 1.02, 8]} />
              <meshStandardMaterial
                color="#c9a227"
                metalness={0.85}
                roughness={0.3}
                {...dimMaterial(dim('tsv'), active === 'tsv')}
              />
            </mesh>
          ))}
        </group>
        <LayerLabel show={active === 'interposer' || active === 'tsv'} position={[-5.2, 0.4, 3]} layer={info(active === 'tsv' ? 'tsv' : 'interposer')} />
      </Explodable>

      {/* C4 凸点层 */}
      <Explodable baseY={0.61} explodeY={1.1} exploded={exploded}>
        <Instances limit={128} castShadow {...pickProps({ id: 'c4', active, onSelect })}>
          <cylinderGeometry args={[0.12, 0.12, 0.22, 10]} />
          <meshStandardMaterial
            color="#d4a24e"
            metalness={0.9}
            roughness={0.25}
            {...dimMaterial(dim('c4'), active === 'c4')}
          />
          {BUMP_POSITIONS.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
        <LayerLabel show={active === 'c4'} position={[-4.6, 0.35, 1.7]} layer={info('c4')} />
      </Explodable>

      {/* 封装基板 + BGA 焊球 */}
      <Explodable baseY={0.25} explodeY={0} exploded={exploded}>
        <RoundedBox
          args={[SUB.w, SUB.h, SUB.d]}
          radius={0.05}
          smoothness={3}
          {...pickProps({ id: 'substrate', active, onSelect })}
        >
          <meshStandardMaterial
            color="#101826"
            metalness={0.1}
            roughness={0.6}
            {...dimMaterial(dim('substrate'), active === 'substrate')}
          />
        </RoundedBox>
        {[-3.6, -1.2, 1.2, 3.6].map((x) =>
          [-2.2, 2.2].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -SUB.h / 2 - 0.12, z]} {...pickProps({ id: 'substrate', active, onSelect })}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial
                color="#b8bec9"
                metalness={0.85}
                roughness={0.3}
                {...dimMaterial(dim('substrate'), active === 'substrate')}
              />
            </mesh>
          )),
        )}
        <LayerLabel show={active === 'substrate'} position={[-5.6, 0, 3.5]} layer={info('substrate')} />
      </Explodable>
    </group>
  );
}

export default function ChipStack3D() {
  const [exploded, setExploded] = useState(false);
  const [active, setActive] = useState<LayerId | null>(null);
  const activeInfo = active ? LAYERS.find((l) => l.id === active)! : null;

  return (
    <figure className="not-prose my-8">
      <div className="h-[440px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <Canvas camera={{ position: [9.5, 7, 11.5], fov: 38 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 10, 6]} intensity={1.5} />
          <directionalLight position={[-6, 4, -6]} intensity={0.4} />
          <Scene exploded={exploded} active={active} onSelect={setActive} />
          <ContactShadows position={[0, -0.4, 0]} opacity={0.35} scale={24} blur={2.4} far={6} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={6}
            maxDistance={28}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1, 0]}
          />
        </Canvas>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(active === l.id ? null : l.id)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active === l.id
                ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: l.color }} />
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setExploded(!exploded)}
          className="ml-auto rounded-full bg-slate-900 px-3 py-1 text-xs text-white transition-colors hover:bg-slate-700"
        >
          {exploded ? '合拢视图' : '爆炸视图'}
        </button>
      </div>
      {activeInfo && (
        <figcaption className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{activeInfo.name}</span>
          <span className="ml-1.5 text-slate-400">{activeInfo.en}</span>
          <span className="mx-2 text-slate-300">|</span>
          {activeInfo.desc}
        </figcaption>
      )}
    </figure>
  );
}
