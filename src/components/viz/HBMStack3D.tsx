import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, Instance, Instances, OrbitControls, RoundedBox } from '@react-three/drei';

type Gen = 'hbm3e' | 'hbm4' | 'hbm4e';
type LayerId = 'dram' | 'bonding' | 'base' | 'bumps' | 'substrate' | 'tsv';

interface GenSpec {
  id: Gen;
  name: string;
  era: string;
  dramColor: string;
  dramNode: string;
  baseColor: string;
  baseLabel: string;
  bonding: 'mrmuf' | 'hb';
  bondingColor: string;
  specs: [string, string][];
  layerDesc: Record<LayerId, { name: string; desc: string }>;
}

const SPECS: Record<Gen, GenSpec> = {
  hbm3e: {
    id: 'hbm3e',
    name: 'HBM3E',
    era: '第 5 代 · 2024 起量产',
    dramColor: '#2f4a6e',
    dramNode: '1b（第 5 代 10nm 级）· 24Gb',
    baseColor: '#6b7280',
    baseLabel: 'Base Die · 存储工艺',
    bonding: 'mrmuf',
    bondingColor: '#8fa3b8',
    specs: [
      ['JEDEC', 'JESD238 系列（速率上限 9.6 Gbps）'],
      ['接口', '1024-bit · 16 通道 / 32 伪通道'],
      ['引脚速率', '量产 9.2–9.8 Gbps'],
      ['单堆栈带宽', '>1.2 TB/s（9.6 Gbps 时 1.23）'],
      ['容量', '24GB（8 层）– 36GB（12 层）'],
      ['DRAM 裸片', '1b · 24Gb'],
      ['Base Die', '存储工艺（与 DRAM 同代）'],
      ['堆叠键合', '先进 MR-MUF（SK）/ advanced TC-NCF（三星）'],
      ['Micro-bump', '40–55 μm（HBM3E 世代）'],
    ],
    layerDesc: {
      dram: { name: 'DRAM 裸片 ×12', desc: '1b 节点、24Gb；SK 海力士将单颗裸片做薄 40%，12 层总厚度与 8 层产品持平，容量 36GB' },
      bonding: { name: '先进 MR-MUF', desc: '批量回流 + 模塑底填，12 层散热较上代 +10%；三星同代路线为 advanced TC-NCF（热阻改善 11%，产品页口径）' },
      base: { name: 'Base Die（存储工艺）', desc: '与 DRAM 同代节点制造，承担各层读写控制与纠错——这是它与 HBM4 之后最本质的差别' },
      bumps: { name: 'Micro-bump', desc: '间距 40–55 μm（HBM3E 世代口径），连接 base die 与封装基板' },
      substrate: { name: '封装基板', desc: '有机基板承载与扇出，经 BGA 焊球接入 PCB；HBM 堆栈本身不含硅 interposer，2.5D 由 CoWoS 类平台在封装层面解决' },
      tsv: { name: 'TSV 硅通孔', desc: 'HBM3E 引入 all-around power TSV：供电 TSV 数量增至约 6 倍，IR drop 降低最高 75%（Siemens 汇总口径）——模型中呈现为裸片四周的通孔环' },
    },
  },
  hbm4: {
    id: 'hbm4',
    name: 'HBM4',
    era: '第 6 代 · 2025 标准发布',
    dramColor: '#35618c',
    dramNode: '1b（SK）/ 1c（三星）· 24Gb',
    baseColor: '#0f766e',
    baseLabel: 'Base Die · 逻辑工艺',
    bonding: 'mrmuf',
    bondingColor: '#8fa3b8',
    specs: [
      ['JEDEC', 'JESD270-4（2025-04 发布，12 月追加 4A）'],
      ['接口', '2048-bit · 32 通道 / 64 伪通道'],
      ['引脚速率', '6.4–12.8 Gbps（JEDEC 基准 8）'],
      ['单堆栈带宽', '>2.0 TB/s（三星进阶配置 3.3）'],
      ['容量', '36GB（12 层）；16 层 64GB'],
      ['DRAM 裸片', '1b（SK 海力士）/ 1c（三星）· 24Gb'],
      ['Base Die', '逻辑工艺：TSMC 12FFC+/N5 · 三星自研 4nm'],
      ['堆叠键合', '先进 MR-MUF / TC-NCF 延续'],
      ['Micro-bump', '约 30 μm（Hot Chips 2026 口径）'],
    ],
    layerDesc: {
      dram: { name: 'DRAM 裸片 ×12', desc: '接口翻倍到 2048-bit，但 I/O 数不靠层数堆——容量 36GB（12 层），标准支持 16 层 64GB' },
      bonding: { name: 'MR-MUF / TC-NCF', desc: '键合方式延续 HBM3E 路线；凸点从 40–55 μm 收紧到约 30 μm，键合对准容差随之收紧' },
      base: { name: 'Base Die（逻辑工艺）', desc: '结构性变化：HBM4 起 base die 改用逻辑工艺制造（TSMC 12FFC+/N5、三星 4nm）——节点越先进，控制器越快、越凉，模型中以青色区分' },
      bumps: { name: 'Micro-bump', desc: '约 30 μm 间距（Hot Chips 2026 口径），密度较上代提升近一倍' },
      substrate: { name: '封装基板', desc: '与 HBM3E 相同；2048-bit 接口使走线密度压力进一步向封装侧转移' },
      tsv: { name: 'TSV 硅通孔', desc: '堆叠架构延续；晶圆减薄与高深宽比刻蚀精度随层数叠加' },
    },
  },
  hbm4e: {
    id: 'hbm4e',
    name: 'HBM4E',
    era: '第 7 代 · 2026 送样 / 2027 量产',
    dramColor: '#3d6f9e',
    dramNode: '1c（第 6 代 10nm 级）· 32Gb',
    baseColor: '#0d5c55',
    baseLabel: 'Base Die · 可定制逻辑工艺',
    bonding: 'mrmuf',
    bondingColor: '#7fa0b5',
    specs: [
      ['JEDEC', '基于 JESD270-4 扩展，规范演进中'],
      ['接口', '2048-bit（与 HBM4 相同）'],
      ['引脚速率', '14 Gbps 稳定 / 最高 16 Gbps'],
      ['单堆栈带宽', '3.6 TB/s（三星）/ 约 4.0 TB/s（GTC 2026 演示）'],
      ['容量', '48GB（12 层，32Gb 裸片）'],
      ['DRAM 裸片', '1c · 32Gb（单裸片 +33%）'],
      ['Base Die', 'TSMC 3nm 级（C-HBM4E）/ 三星 4nm，支持定制'],
      ['堆叠键合', '先进 MR-MUF（热阻 −17%）；Hybrid Bonding 为 16 层+ 候选'],
      ['Micro-bump', '约 30 μm'],
    ],
    layerDesc: {
      dram: { name: 'DRAM 裸片 ×12', desc: '1c 节点、单裸片 24Gb→32Gb（+33%），单堆栈 36GB→48GB（+33%）；切换 16 层模式查看混合键合形态' },
      bonding: { name: '先进 MR-MUF（改良）', desc: '工艺优化使热阻较 HBM4 改善约 17%（官方口径）；16 层堆叠高度逼近 775 μm 上限，混合键合（无凸点 Cu-Cu）是 16 层+ 的候选方案' },
      base: { name: 'Base Die（可定制）', desc: 'HBM4E 起支持可定制 base die：挂自定义接口/缓存等附加功能；定制版称 C-HBM4E，3nm 级，目标 2027 年 12.8 GT/s' },
      bumps: { name: 'Micro-bump', desc: '约 30 μm 延续 HBM4；混合键合模式下凸点消失，裸片直接 Cu-Cu 键合（16 层模式演示）' },
      substrate: { name: '封装基板', desc: '配合 3.6–4.0 TB/s 带宽，封装与板级走线压力继续上升' },
      tsv: { name: 'TSV 硅通孔', desc: '供电与 I/O 通孔架构延续；引脚速率到 16 Gbps 后信号完整性预算更紧' },
    },
  },
};

const TSAROUND: [number, number][] = [
  [-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4],
  [0, -1.4], [0, 1.4], [-1.4, 0], [1.4, 0],
];
const TSCENTER: [number, number][] = [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]];

const BUMP_GRID: [number, number][] = (() => {
  const g: [number, number][] = [];
  for (let x = -1.6; x <= 1.61; x += 0.4) for (let z = -1.6; z <= 1.61; z += 0.4) g.push([x, z]);
  return g;
})();

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
    opacity: dimmed ? 0.08 : 1,
    emissive: activeId ? '#06b6d4' : '#000000',
    emissiveIntensity: activeId ? 0.4 : 0,
  };
}

function LayerLabel({ show, y, text }: { show: boolean; y: number; text: string }) {
  if (!show) return null;
  return (
    <Html position={[2.6, y, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs shadow-sm">
        <span className="font-semibold text-slate-800">{text}</span>
      </div>
    </Html>
  );
}

interface DieGroupProps {
  index: number;
  baseY: number;
  pitch: number;
  dieH: number;
  exploded: boolean;
  spec: GenSpec;
  active: LayerId | null;
  onSelect: (id: LayerId | null) => void;
}

function DieGroup({ index, baseY, pitch, dieH, exploded, spec, active, onSelect }: DieGroupProps) {
  const ref = useRef<THREE.Group>(null!);
  const k = useRef(0);
  const isTop = index === 0;
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.damp(k.current, exploded ? 1 : 0, 4, dt);
    ref.current.position.y = baseY + k.current * index * 0.5;
  });
  const tsvPos = spec.powerTsv === 'around' ? TSAROUND : TSCENTER;
  const interlayerY = -dieH / 2 - 0.035;
  return (
    <group ref={ref} position={[0, baseY, 0]}>
      {spec.bonding === 'mrmuf' && (
        <mesh position={[0, interlayerY, 0]} {...pickProps({ id: 'bonding', active, onSelect })}>
          <boxGeometry args={[3.66, 0.07, 3.66]} />
          <meshStandardMaterial
            color={spec.bondingColor}
            transparent
            opacity={0.32}
            roughness={0.6}
            {...(active === 'bonding' ? { emissive: '#06b6d4', emissiveIntensity: 0.5 } : {})}
          />
        </mesh>
      )}
      <RoundedBox
        args={[3.6, dieH, 3.6]}
        radius={0.025}
        smoothness={2}
        {...pickProps({ id: 'dram', active, onSelect })}
      >
        <meshStandardMaterial
          color={spec.dramColor}
          metalness={0.35}
          roughness={0.4}
          {...dimMaterial(active !== null && active !== 'dram', active === 'dram')}
        />
      </RoundedBox>
      <Instances limit={8}>
        <cylinderGeometry args={[0.045, 0.045, dieH * 1.25, 8]} />
        <meshStandardMaterial
          color="#c9a227"
          metalness={0.85}
          roughness={0.3}
          {...dimMaterial(active !== null && active !== 'tsv', active === 'tsv')}
        />
        {tsvPos.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      {isTop && <LayerLabel show={active === 'dram'} y={dieH / 2 + 0.35} text={spec.layerDesc.dram.name} />}
      {isTop && <LayerLabel show={active === 'tsv'} y={dieH / 2 + 0.7} text={spec.layerDesc.tsv.name} />}
      {isTop && spec.bonding === 'hb' && (
        <LayerLabel show={active === 'bonding'} y={-0.4} text="混合键合：无凸点 Cu-Cu" />
      )}
    </group>
  );
}

interface StackProps {
  spec: GenSpec;
  layers: number;
  exploded: boolean;
  active: LayerId | null;
  onSelect: (id: LayerId | null) => void;
}

function Stack({ spec, layers, exploded, active, onSelect }: StackProps) {
  const dieH = spec.bonding === 'hb' ? 0.13 : 0.16;
  const pitch = spec.bonding === 'hb' ? 0.14 : 0.23;
  const firstDieY = 0.78 + 0.16 + (spec.bonding === 'mrmuf' ? 0.035 : 0.005) + dieH / 2;
  const stackTop = firstDieY + (layers - 1) * pitch + dieH / 2;
  const dim = (id: LayerId) => active !== null && active !== id;

  return (
    <group onClick={() => onSelect(null)}>
      {/* 封装基板 */}
      <RoundedBox
        args={[6.4, 0.5, 6.4]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.25, 0]}
        {...pickProps({ id: 'substrate', active, onSelect })}
      >
        <meshStandardMaterial
          color="#1a2233"
          metalness={0.1}
          roughness={0.6}
          {...dimMaterial(dim('substrate'), active === 'substrate')}
        />
      </RoundedBox>
      {/* Micro-bump 阵列 */}
      <Instances limit={128} {...pickProps({ id: 'bumps', active, onSelect })}>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 10]} />
        <meshStandardMaterial
          color="#d4a24e"
          metalness={0.9}
          roughness={0.25}
          {...dimMaterial(dim('bumps'), active === 'bumps')}
        />
        {BUMP_GRID.map(([x, z], i) => (
          <Instance key={i} position={[x, 0.56, z]} />
        ))}
      </Instances>
      {/* Base Die */}
      <RoundedBox
        args={[3.6, 0.32, 3.6]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.78, 0]}
        {...pickProps({ id: 'base', active, onSelect })}
      >
        <meshStandardMaterial
          color={spec.baseColor}
          metalness={0.4}
          roughness={0.35}
          {...dimMaterial(dim('base'), active === 'base')}
        />
      </RoundedBox>
      <LayerLabel show={active === 'base'} y={1.25} text={spec.baseLabel} />
      <LayerLabel show={active === 'bumps'} y={0.9} text={spec.layerDesc.bumps.name} />
      <LayerLabel show={active === 'substrate'} y={0.25} text={spec.layerDesc.substrate.name} />
      {/* DRAM 层 */}
      {Array.from({ length: layers }, (_, i) => (
        <DieGroup
          key={i}
          index={i}
          baseY={firstDieY + i * pitch}
          pitch={pitch}
          dieH={dieH}
          exploded={exploded}
          spec={spec}
          active={active}
          onSelect={onSelect}
        />
      ))}
      {/* 16 层 775 μm 高度上限参考面 */}
      {layers === 16 && (
        <group>
          <mesh position={[0, stackTop + 0.22, 0]}>
            <boxGeometry args={[3.9, 0.02, 3.9]} />
            <meshBasicMaterial color="#dc2626" transparent opacity={0.35} />
          </mesh>
          <Html position={[0, stackTop + 0.42, 1.95]} center style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-md border border-red-200 bg-white/95 px-2 py-1 text-xs text-red-700 shadow-sm">
              775 μm 高度上限 · MR-MUF 16 层无法满足，转向混合键合（Hot Chips 2026）
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export default function HBMStack3D() {
  const [gen, setGen] = useState<Gen>('hbm3e');
  const [hi16, setHi16] = useState(false);
  const [exploded, setExploded] = useState(true);
  const [active, setActive] = useState<LayerId | null>(null);
  const spec = SPECS[gen];
  const layers = gen === 'hbm4e' && hi16 ? 16 : 12;
  const info = active ? spec.layerDesc[active] : null;

  return (
    <figure className="not-prose my-8">
      <div className="h-[480px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <Canvas camera={{ position: [7, 6, 9], fov: 38 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 10, 6]} intensity={1.5} />
          <directionalLight position={[-6, 4, -6]} intensity={0.4} />
          <Stack spec={spec} layers={layers} exploded={exploded} active={active} onSelect={setActive} />
          <ContactShadows position={[0, -0.05, 0]} opacity={0.35} scale={16} blur={2.2} far={5} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={5}
            maxDistance={24}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1.8, 0]}
          />
        </Canvas>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(Object.keys(SPECS) as Gen[]).map((g) => (
          <button
            key={g}
            onClick={() => {
              setGen(g);
              setActive(null);
              if (g !== 'hbm4e') setHi16(false);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              gen === g
                ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {SPECS[g].name}
          </button>
        ))}
        <span className="text-xs text-slate-400">{spec.era}</span>
        {gen === 'hbm4e' && (
          <button
            onClick={() => {
              setHi16(!hi16);
              setActive(null);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs transition-colors ${
              hi16 ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
          >
            16 层 · 混合键合模式
          </button>
        )}
        <button
          onClick={() => setExploded(!exploded)}
          className="ml-auto rounded-full bg-slate-900 px-3.5 py-1 text-xs text-white transition-colors hover:bg-slate-700"
        >
          {exploded ? '合拢视图' : '爆炸视图'}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">点击图层查看说明</p>
          {info ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">{info.name}</span>
              <span className="mx-2 text-slate-300">|</span>
              {info.desc}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              拖拽旋转、滚轮缩放；点击任一物理层（DRAM / 键合层 / Base Die / 凸点 / 基板 / TSV）查看该代的具体说明。
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <table className="w-full text-xs">
            <tbody>
              {spec.specs.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100 last:border-0">
                  <td className="py-1 pr-3 whitespace-nowrap font-medium text-slate-500">{k}</td>
                  <td className="py-1 text-slate-800">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-slate-400">
        结构为示意比例（层厚与间距已放大以供观察）；口径与《HBM3E 与 HBM4E 工艺调研》2026-09-19 核对版一致。
      </figcaption>
    </figure>
  );
}
