import { useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, Instance, Instances, OrbitControls, RoundedBox } from '@react-three/drei';

/* ═════════════════════════ GPU 通讯区域 · 四级下钻 ═════════════════════════
 * L0 装配姿态：堆栈与 GPU 经中介层互连的全貌
 * L1 通道版图：bump 场怎么按通道切分（HBM3E 16ch × 64-bit）
 * L2 PHY 电路：base die 每通道的驱动/接收/DLL，TSV 落点与堆栈内数据通路
 * L3 信号与测试边界：眼图、8 通道同步代价、lane 修复，以及测试为何要借道 DA
 * ═════════════════════════════════════════════════════════════════════════ */

type Level = 0 | 1 | 2 | 3;

type PartId =
  | 'bumps'
  | 'interposer'
  | 'gpu'
  | 'gpuPhy'
  | 'basedie'
  | 'dram'
  | 'tsv'
  | 'channel'
  | 'ckdqs'
  | 'powersea'
  | 'phyDrv'
  | 'phyDll'
  | 'tsvLand'
  | 'daPort'
  | 'eye'
  | 'laneRepair';

const LEVELS: { id: Level; label: string; question: string }[] = [
  { id: 0, label: 'L0 装配姿态', question: '通讯电路在封装里怎么连？' },
  { id: 1, label: 'L1 通道版图', question: 'bump 场怎么按通道切分？' },
  { id: 2, label: 'L2 PHY 电路', question: '每根通道背后的电路是什么？' },
  { id: 3, label: 'L3 信号与测试边界', question: '信号完整性约束怎么反过来设计测试？' },
];

const PART_INFO: Record<PartId, { name: string; desc: string }> = {
  bumps: {
    name: 'GPU 通讯 micro-bump 场',
    desc: 'HBM2 普查：IO 1728 + 电源 1056 + 地 1030 = 3990（SWTest 2017，SK hynix/FormFactor/Advantest）。55 μm pitch、27.5×48 μm 交错、阵列 6022×2832 μm。',
  },
  interposer: {
    name: '硅中介层（宿主环境）',
    desc: 'HBM 的 2048-bit 接口走线密度远超 PCB/有机基板能力，只能走硅 interposer（CoWoS 类）或 bridge（EMIB 类）；这是堆栈出厂后的集成环境，不是 HBM 3D 封装本体。',
  },
  gpu: {
    name: 'GPU（通讯对端）',
    desc: '典型 1 GPU + 8 堆栈；数据中心统计 HBM 是 GPU 失效第一来源（Synopsys，via semiengineering 2026）——通讯链路的良率压力由此而来。',
  },
  gpuPhy: {
    name: 'GPU 侧 PHY（朝 HBM 一侧）',
    desc: 'GPU 边缘的收发宏：与 base die PHY 隔着 interposer 走线对通。链路两端都要按 JEDEC 电气规格设计（驱动强度、终端、时序预算）。',
  },
  basedie: {
    name: 'Base Die：通讯与测试共用的必经之路',
    desc: '堆栈唯一对外通路：读写在 base die 的 PHY/控制器终结，测试借同一 PHY + DA 端口做 at-speed（semiengineering 2026：base die 是唯一访问通路）。',
  },
  dram: {
    name: 'DRAM 核心裸片 ×12',
    desc: '每层经 TSV 共享堆栈 I/O；某层的坏列可被 lane/column 修复重映射（JEDEC lane repair）。',
  },
  tsv: {
    name: 'TSV 链（每通道落点成列）',
    desc: 'HBM4 世代单堆栈 TSV 已超 2 万个（SK 海力士 Hot Chips 2026：>20K TSV、16148 个 base micro-bump）。TSV 缺陷 → column fail（Synopsys）。',
  },
  channel: {
    name: '通道条带（HBM3E：16ch × 64-bit）',
    desc: 'HBM3E 接口 1024-bit = 16 独立通道 × 64-bit（32 伪通道）；HBM4 翻倍到 2048-bit / 32 通道（JEDEC JESD270-4；Siemens 汇总口径）。版图上每通道一条条带。',
  },
  ckdqs: {
    name: 'CK / DQS 差分对',
    desc: '时钟与数据选通的差分引脚：eye 收缩时第一嫌疑就是它们。SWTest 2017 实测：8 通道同时跑数据时输出眼图明显收缩——同时激励改变了回流与串扰环境。',
  },
  powersea: {
    name: '电源 / 地海',
    desc: '电源 1056 + 地 1030（HBM2 普查）：为每个 switch 的电流瞬时提供就近回流路径。HBM4 引入 all-around power TSV、供电 TSV 数增至约 6 倍（Siemens 汇总）。',
  },
  phyDrv: {
    name: '每通道 PHY（驱动 / 接收）',
    desc: 'base die 上按通道复制的 IO 电路：驱动器强度/终端匹配按 JEDEC 电气 spec 设计；at-speed 测试经 DA 端口复用同一 PHY（SWTest 2017 原生模式测试）。',
  },
  phyDll: {
    name: 'DLL / 时序对准',
    desc: '每通道的时序对准电路：数据眼在中线采样靠它。时序 margin 是 bin7（Margin）测试的对象——margin 不足在功能全对的情况下依然判 fail（Edusemi bin 体系）。',
  },
  tsvLand: {
    name: 'TSV 落点阵列',
    desc: 'PHY 之下每通道一组 TSV 落点，穿透各层 DRAM；TSV 连通性是每次测试插入的必测项，可修（TSV repair）。',
  },
  daPort: {
    name: 'DA 端口（测试借道口）',
    desc: '通讯版图边缘的 176 个直接访问凸点（HBM2 普查）：功能测试走 IO 场，at-speed 测试走 DA——「通讯区域」与「测试区域」在版图上物理分区的连接点。',
  },
  eye: {
    name: '眼图（信号完整性的成绩单）',
    desc: 'SWTest 2017 实测：单通道 vs 8 通道同时激励，输出眼图明显收缩——所以 at-speed 筛选必须在全通道激活下做，否则漏掉系统性串扰失效。',
  },
  laneRepair: {
    name: 'Lane 修复（坏通道重映射）',
    desc: 'JEDEC 标准含 lane repair：坏 lane 由修复电路重映射到冗余通道；修复信息在晶圆级激光写入、封装级 e-fuse 补写。',
  },
};

/* ───────────────────────── 通用小组件 ───────────────────────── */

interface PickProps {
  id: PartId;
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
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
    opacity: dimmed ? 0.07 : 1,
    emissive: activeId ? '#06b6d4' : '#000000',
    emissiveIntensity: activeId ? 0.45 : 0,
  };
}

function InfoLabel({
  show,
  position,
  text,
  tone = 'slate',
}: {
  show: boolean;
  position: [number, number, number];
  text: string;
  tone?: 'slate' | 'red' | 'cyan' | 'amber';
}) {
  if (!show) return null;
  const border =
    tone === 'red'
      ? 'border-red-200 text-red-700'
      : tone === 'cyan'
        ? 'border-cyan-200 text-cyan-700'
        : tone === 'amber'
          ? 'border-amber-200 text-amber-700'
          : 'border-slate-200 text-slate-800';
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap rounded-md border bg-white/95 px-2 py-1 text-xs shadow-sm ${border}`}>{text}</div>
    </Html>
  );
}

function CameraRig({ level }: { level: Level }) {
  const POSE: Record<Level, { pos: [number, number, number]; target: [number, number, number] }> = {
    0: { pos: [9.5, 6, 13], target: [0, 1.2, 0] },
    1: { pos: [0, 11, 5.5], target: [0, 0, 0] },
    2: { pos: [4, 6, 8], target: [0, 0.3, 0] },
    3: { pos: [6.5, 4.5, 9], target: [0, 0.8, 0] },
  };
  const kPos = useRef(new THREE.Vector3(...POSE[0].pos));
  const kTgt = useRef(new THREE.Vector3(...POSE[0].target));
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  useFrame((_, dt) => {
    const d = 1 - Math.exp(-3.2 * dt);
    kPos.current.lerp(new THREE.Vector3(...POSE[level].pos), d);
    kTgt.current.lerp(new THREE.Vector3(...POSE[level].target), d);
    camera.position.copy(kPos.current);
    if (controls) {
      controls.target.copy(kTgt.current);
      controls.update();
    }
  });
  return null;
}

/* ═════════════════════════ 共享几何常量 ═════════════════════════ */

const STACK_X = -2.8;
const GPU_X = 3.1;
const BASE_Y = 0.95;
const DIE_H = 0.16;
const PITCH = 0.23;
const N_DIE = 12;
const FIRST_DIE_Y = BASE_Y + 0.13 + DIE_H / 2;
const STACK_TOP = FIRST_DIE_Y + (N_DIE - 1) * PITCH + DIE_H / 2;
const EXPLODE_STEP = 0.3;

const FIELD: [number, number][] = (() => {
  const g: [number, number][] = [];
  for (let x = -1.5; x <= 1.51; x += 0.32) {
    for (let z = -1.5; z <= 1.51; z += 0.36) g.push([x, z]);
  }
  return g;
})();

const TSV_COL: [number, number][] = [
  [-0.9, 0.8], [0.9, 0.8], [-0.9, -0.8], [0.9, -0.8],
];

/* ═════════════════════════ L0 装配姿态 ═════════════════════════ */

function DieStack({ exploded, active, onSelect, showRdl }: { exploded: boolean; active: PartId | null; onSelect: (id: PartId | null) => void; showRdl: boolean }) {
  return (
    <group>
      <Instances limit={128} position={[STACK_X, 0.755, 0]} {...pickProps({ id: 'bumps', active, onSelect })}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.85} roughness={0.25} {...dimMaterial(active !== null && active !== 'bumps', active === 'bumps')} />
        {FIELD.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      <RoundedBox args={[3.6, 0.26, 3.6]} radius={0.03} smoothness={3} position={[STACK_X, BASE_Y, 0]} {...pickProps({ id: 'basedie', active, onSelect })}>
        <meshStandardMaterial color="#0f766e" metalness={0.4} roughness={0.35} {...dimMaterial(active !== null && active !== 'basedie' && active !== 'dram' && active !== 'tsv', active === 'basedie')} />
      </RoundedBox>
      {showRdl &&
        [-1.2, -0.6, 0, 0.6, 1.2].map((z, i) => (
          <mesh key={i} position={[STACK_X + 2.6, BASE_Y + 0.14, z]}>
            <boxGeometry args={[1.9, 0.02, 0.07]} />
            <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} transparent opacity={active === null || active === 'interposer' ? 0.9 : 0.15} />
          </mesh>
        ))}
      <Instances limit={8} position={[STACK_X, (1.08 + STACK_TOP) / 2, 0]} {...pickProps({ id: 'tsv', active, onSelect })}>
        <cylinderGeometry args={[0.032, 0.032, STACK_TOP - 1.08, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.3} {...dimMaterial(active !== null && active !== 'tsv' && active !== 'dram', active === 'tsv')} />
        {TSV_COL.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      {Array.from({ length: N_DIE }, (_, i) => (
        <group key={i} position={[0, FIRST_DIE_Y + i * PITCH + (exploded ? i * EXPLODE_STEP : 0), 0]}>
          <RoundedBox args={[3.6, DIE_H, 3.6]} radius={0.02} smoothness={2} position={[STACK_X, 0, 0]} {...pickProps({ id: 'dram', active, onSelect })}>
            <meshStandardMaterial color="#2f4a6e" metalness={0.35} roughness={0.4} {...dimMaterial(active !== null && active !== 'dram' && active !== 'tsv', active === 'dram')} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function Level0({ exploded, active, onSelect }: { exploded: boolean; active: PartId | null; onSelect: (id: PartId | null) => void }) {
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[12, 0.4, 8]} radius={0.05} smoothness={3} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#1a2233" metalness={0.1} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[10.4, 0.3, 6.4]} radius={0.04} smoothness={3} position={[0, 0.55, 0]} {...pickProps({ id: 'interposer', active, onSelect })}>
        <meshStandardMaterial color="#a8b3c8" metalness={0.45} roughness={0.35} {...dimMaterial(active !== null && active !== 'interposer', active === 'interposer')} />
      </RoundedBox>
      <RoundedBox args={[4.2, 0.5, 3.6]} radius={0.04} smoothness={3} position={[GPU_X, 0.95, 0]} {...pickProps({ id: 'gpu', active, onSelect })}>
        <meshStandardMaterial color="#274060" metalness={0.4} roughness={0.35} {...dimMaterial(active !== null && active !== 'gpu' && active !== 'gpuPhy', active === 'gpu')} />
      </RoundedBox>
      <mesh position={[GPU_X - 2.14, 0.95, 0]} {...pickProps({ id: 'gpuPhy', active, onSelect })}>
        <boxGeometry args={[0.05, 0.14, 2.8]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} {...dimMaterial(active !== null && active !== 'gpuPhy', active === 'gpuPhy')} />
      </mesh>
      <DieStack exploded={exploded} active={active} onSelect={onSelect} showRdl />
      <InfoLabel show position={[STACK_X, 0.15, 2.6]} text="GPU 通讯凸点场：IO + 电源 / 地（JEDEC 版图）" tone="cyan" />
      <InfoLabel show position={[GPU_X, 1.8, 0]} text="GPU PHY 边缘（金色）经 interposer 走线接入" tone="amber" />
    </group>
  );
}

/* ═════════════════════════ L1 通道版图 ═════════════════════════ */

// HBM3E：16 通道 × 64-bit；每条带：数据段 + CK/DQS 对 + 电源海
const CH_COUNT = 16;
const CH_STRIPS = (() => {
  const strips: { x: number; kind: 'data' | 'pwr' }[] = [];
  for (let i = 0; i < CH_COUNT + 3; i++) strips.push({ x: -3.6 + i * 0.52, kind: i % 4 === 3 ? 'pwr' : 'data' });
  return strips;
})();

function Level1({ active, onSelect }: { active: PartId | null; onSelect: (id: PartId | null) => void }) {
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[9.4, 0.24, 5.4]} radius={0.03} smoothness={3} position={[0, -0.18, 0]}>
        <meshStandardMaterial color="#13202f" metalness={0.3} roughness={0.5} />
      </RoundedBox>
      {/* 数据通道条带（金色）与 CK/DQS 对（青色小条） */}
      {CH_STRIPS.map((s, i) =>
        s.kind === 'data' ? (
          <group key={i}>
            <mesh position={[s.x, -0.02, 0]} {...pickProps({ id: 'channel', active, onSelect })}>
              <boxGeometry args={[0.34, 0.06, 4.4]} />
              <meshStandardMaterial color="#e3b34c" metalness={0.5} roughness={0.35} transparent opacity={active === null || active === 'channel' ? 0.85 : 0.15} />
            </mesh>
            <mesh position={[s.x, 0.05, -1.85]} {...pickProps({ id: 'ckdqs', active, onSelect })}>
              <boxGeometry args={[0.16, 0.05, 0.5]} />
              <meshStandardMaterial color="#22d3ee" metalness={0.4} roughness={0.4} {...dimMaterial(active !== null && active !== 'ckdqs', active === 'ckdqs')} />
            </mesh>
            <mesh position={[s.x, 0.05, 1.85]} {...pickProps({ id: 'ckdqs', active, onSelect })}>
              <boxGeometry args={[0.16, 0.05, 0.5]} />
              <meshStandardMaterial color="#22d3ee" metalness={0.4} roughness={0.4} {...dimMaterial(active !== null && active !== 'ckdqs', active === 'ckdqs')} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={[s.x, -0.02, 0]} {...pickProps({ id: 'powersea', active, onSelect })}>
            <boxGeometry args={[0.34, 0.06, 4.4]} />
            <meshStandardMaterial color={i % 2 === 1 ? '#e07b39' : '#3c4658'} metalness={0.4} roughness={0.4} transparent opacity={active === null || active === 'powersea' ? 0.85 : 0.15} />
          </mesh>
        ),
      )}
      {/* DA 端口列（红，边缘） */}
      <mesh position={[4.35, 0, 0]} {...pickProps({ id: 'daPort', active, onSelect })}>
        <boxGeometry args={[0.4, 0.1, 4.4]} />
        <meshStandardMaterial color="#e05656" metalness={0.5} roughness={0.35} {...dimMaterial(active !== null && active !== 'daPort', active === 'daPort')} />
      </mesh>
      {/* bump 网格点（密度感） */}
      <Instances limit={220} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.05, 6]} />
        <meshStandardMaterial color="#f0d9a0" metalness={0.8} roughness={0.3} transparent opacity={0.5} />
        {(() => {
          const pts: ReactNode[] = [];
          for (let x = -3.7; x <= 4.5; x += 0.26) {
            for (let z = -2.1; z <= 2.11; z += 0.3) pts.push(<Instance key={`${x}-${z}`} position={[x, 0, z]} />);
          }
          return pts;
        })()}
      </Instances>
      <InfoLabel show position={[0, 1.2, -3.3]} text="HBM3E：16 通道 × 64-bit（金色条带）；青色 = CK/DQS 差分对" tone="cyan" />
      <InfoLabel show position={[-1.8, 1.2, 2.8]} text="橙/灰 = 电源 / 地海（P 1056 · G 1030，HBM2 普查）" tone="amber" />
      <InfoLabel show position={[4.35, 1.2, -2.9]} text="红色 = DA 端口（测试借道口，属测试区域）" tone="red" />
    </group>
  );
}

/* ═════════════════════════ L2 PHY 电路 ═════════════════════════ */

const PHY_CH = 8; // 示意 8 组（16ch 版图对半透视）
const PHY_COLS = (() => {
  const cols: { x: number; z: number }[] = [];
  for (let i = 0; i < PHY_CH; i++) cols.push({ x: -2.9 + i * 0.85, z: 0.9 });
  return cols;
})();

function Level2({ active, onSelect }: { active: PartId | null; onSelect: (id: PartId | null) => void }) {
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[8.6, 0.26, 4.6]} radius={0.03} smoothness={3} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#0f1724" metalness={0.35} roughness={0.5} />
      </RoundedBox>
      {/* 每通道 PHY 驱动/接收 */}
      {PHY_COLS.map((c, i) => (
        <group key={i}>
          <RoundedBox args={[0.6, 0.42, 1.4]} radius={0.03} smoothness={3} position={[c.x, 0.05, c.z]} {...pickProps({ id: 'phyDrv', active, onSelect })}>
            <meshStandardMaterial color="#3d5a80" metalness={0.45} roughness={0.35} {...dimMaterial(active !== null && active !== 'phyDrv', active === 'phyDrv')} />
          </RoundedBox>
          <RoundedBox args={[0.6, 0.3, 0.9]} radius={0.03} smoothness={3} position={[c.x, 0.0, -0.9]} {...pickProps({ id: 'phyDll', active, onSelect })}>
            <meshStandardMaterial color="#0e7490" metalness={0.45} roughness={0.35} {...dimMaterial(active !== null && active !== 'phyDll', active === 'phyDll')} />
          </RoundedBox>
          <Instances limit={6} position={[c.x, 0.28, 2.0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.16, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.3} {...dimMaterial(active !== null && active !== 'tsvLand', active === 'tsvLand')} />
            {[-0.24, 0, 0.24].map((dz, j) => (
              <Instance key={j} position={[0, 0, dz]} />
            ))}
          </Instances>
        </group>
      ))}
      <mesh position={[0, 0.3, 2.0]} {...pickProps({ id: 'tsvLand', active, onSelect })}>
        <boxGeometry args={[7.2, 0.05, 0.85]} />
        <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.35} transparent opacity={active === null || active === 'tsvLand' ? 0.25 : 0.06} />
      </mesh>
      {/* DA 端口（测试边界） */}
      <mesh position={[3.9, 0.05, 0]} {...pickProps({ id: 'daPort', active, onSelect })}>
        <boxGeometry args={[0.42, 0.5, 4.0]} />
        <meshStandardMaterial color="#e05656" metalness={0.5} roughness={0.35} {...dimMaterial(active !== null && active !== 'daPort', active === 'daPort')} />
      </mesh>
      {/* GPU 侧 PHY（隔着走线对通） */}
      <mesh position={[-4.55, 0.05, 0.9]} {...pickProps({ id: 'gpuPhy', active, onSelect })}>
        <boxGeometry args={[0.24, 0.3, 3.4]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} {...dimMaterial(active !== null && active !== 'gpuPhy', active === 'gpuPhy')} />
      </mesh>
      {/* interposer 走线（PHY → GPU PHY） */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((z, i) => (
        <mesh key={i} position={[-3.75, -0.05, z]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.4, 0.02, 0.06]} />
          <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} transparent opacity={0.75} />
        </mesh>
      ))}
      <InfoLabel show position={[0, 1.35, -2.6]} text="蓝 = 每通道 PHY（驱动/接收）· 青 = DLL/时序 · 金柱 = TSV 落点" tone="cyan" />
      <InfoLabel show position={[-4.55, 1.0, 0]} text="GPU 侧 PHY（经中介层走线对通）" tone="amber" />
      <InfoLabel show position={[3.4, 1.35, 0]} text="DA 端口：at-speed 测试借道同一 PHY" tone="red" />
    </group>
  );
}

/* ═════════════════════════ L3 信号与测试边界 ═════════════════════════ */

const EYE_PTS: [number, number, number][] = [
  [GPU_X - 2.2, 1.02, 0],
  [0.2, 0.72, 0],
  [STACK_X + 1.5, 0.9, 0],
  [STACK_X + 0.4, 1.05, 0],
];

function EyePath({ allCh, brokenLane }: { allCh: boolean; brokenLane: boolean }) {
  const curve = useMemoSafe(EYE_PTS);
  const dots = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!dots.current) return;
    const t = clock.getElapsedTime();
    dots.current.children.forEach((c, i) => {
      const m = c as THREE.Mesh;
      const speed = allCh ? 0.32 : 0.2;
      const u = (t * speed + i * 0.14) % 1;
      m.position.copy(curve.getPointAt(u));
      m.position.y += Math.sin(u * Math.PI * 6) * (brokenLane ? 0.16 : 0.04) * (allCh ? 1.6 : 1);
    });
  });
  const tube = useMemoSafeTube(EYE_PTS);
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>
      <group ref={dots}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshBasicMaterial color={brokenLane && i === 3 ? '#ef4444' : '#67e8f9'} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function useMemoSafe(pts: [number, number, number][]) {
  return useMemo(() => {
    const arr = pts.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(arr);
  }, [pts]);
}
function useMemoSafeTube(pts: [number, number, number][]) {
  return useMemo(() => {
    const arr = pts.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(arr);
    return new THREE.TubeGeometry(curve, 100, 0.016, 6, false);
  }, [pts]);
}

function Level3({ active, onSelect, allCh, brokenLane }: { active: PartId | null; onSelect: (id: PartId | null) => void; allCh: boolean; brokenLane: boolean }) {
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[12, 0.4, 8]} radius={0.05} smoothness={3} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#1a2233" metalness={0.1} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[10.4, 0.3, 6.4]} radius={0.04} smoothness={3} position={[0, 0.55, 0]} {...pickProps({ id: 'interposer', active, onSelect })}>
        <meshStandardMaterial color="#a8b3c8" metalness={0.45} roughness={0.35} transparent opacity={0.65} />
      </RoundedBox>
      <RoundedBox args={[4.2, 0.5, 3.6]} radius={0.04} smoothness={3} position={[GPU_X, 0.95, 0]} {...pickProps({ id: 'gpu', active, onSelect })}>
        <meshStandardMaterial color="#274060" metalness={0.4} roughness={0.35} {...dimMaterial(active !== null && active !== 'gpu' && active !== 'gpuPhy', active === 'gpu')} />
      </RoundedBox>
      <mesh position={[GPU_X - 2.14, 0.95, 0]} {...pickProps({ id: 'gpuPhy', active, onSelect })}>
        <boxGeometry args={[0.05, 0.14, 2.8]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} {...dimMaterial(active !== null && active !== 'gpuPhy', active === 'gpuPhy')} />
      </mesh>
      <DieStack exploded={false} active={active} onSelect={onSelect} showRdl={false} />
      <EyePath allCh={allCh} brokenLane={brokenLane} />
      {/* lane 修复重映射标示 */}
      {brokenLane && (
        <group>
          <mesh position={[STACK_X + 1.95, BASE_Y + 0.5, 0]} {...pickProps({ id: 'laneRepair', active, onSelect })}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[STACK_X + 2.3, BASE_Y + 0.5, 0.3]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshBasicMaterial color="#4ade80" />
          </mesh>
          <InfoLabel show position={[STACK_X + 2.1, BASE_Y + 1.15, 0]} text="坏 lane（红）→ 冗余重映射（绿）· JEDEC lane repair" tone="red" />
        </group>
      )}
      <InfoLabel show position={[GPU_X, 1.85, 0]} text={allCh ? '8 通道同时激励：眼图收缩（SWTest 2017 实测口径）' : '单通道激励：眼图张开'} tone={allCh ? 'red' : 'cyan'} />
      <InfoLabel show position={[-2.0, 0.1, 3.3]} text="测试借道 DA 端口复用同一 PHY —— 功能与测试共用电路设计" tone="amber" />
    </group>
  );
}

/* ═════════════════════════ 页面组件 ═════════════════════════ */

const LEGEND: { color: string; label: string }[] = [
  { color: '#e3b34c', label: 'IO 凸点 / 通道条带 / 走线' },
  { color: '#22d3ee', label: 'CK/DQS 差分对' },
  { color: '#e07b39', label: '电源海' },
  { color: '#e05656', label: 'DA 端口（测试边界）' },
  { color: '#3d5a80', label: 'PHY 驱动/接收' },
];

export default function HBMCommZone3D() {
  const [level, setLevel] = useState<Level>(0);
  const [active, setActive] = useState<PartId | null>(null);
  const [exploded, setExploded] = useState(false);
  const [allCh, setAllCh] = useState(false);
  const [brokenLane, setBrokenLane] = useState(false);
  const info = active ? PART_INFO[active] : null;

  return (
    <figure className="not-prose my-8">
      <div className="h-[520px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <Canvas camera={{ position: [9.5, 6, 13], fov: 35 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 10, 6]} intensity={1.5} />
          <directionalLight position={[-6, 4, -6]} intensity={0.4} />
          <CameraRig level={level} />
          <OrbitControls makeDefault enablePan={false} minDistance={3.5} maxDistance={26} maxPolarAngle={1.85} target={[0, 1.2, 0]} />
          <ContactShadows position={[0, -0.02, 0]} opacity={0.28} scale={18} blur={2.4} far={6} />
          {level === 0 && <Level0 exploded={exploded} active={active} onSelect={setActive} />}
          {level === 1 && <Level1 active={active} onSelect={setActive} />}
          {level === 2 && <Level2 active={active} onSelect={setActive} />}
          {level === 3 && <Level3 active={active} onSelect={setActive} allCh={allCh} brokenLane={brokenLane} />}
        </Canvas>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              setLevel(l.id);
              setActive(null);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              level === l.id ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {l.label}
          </button>
        ))}
        {level === 0 && (
          <button onClick={() => setExploded(!exploded)} className="ml-auto rounded-full bg-slate-900 px-3.5 py-1 text-xs text-white transition-colors hover:bg-slate-700">
            {exploded ? '合拢视图' : '爆炸视图'}
          </button>
        )}
        {level === 3 && (
          <>
            <button
              onClick={() => setAllCh(!allCh)}
              className={`ml-auto rounded-full px-3.5 py-1 text-xs text-white transition-colors ${allCh ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-700'}`}
            >
              {allCh ? '关闭 8 通道同时激励' : '开启 8 通道同时激励'}
            </button>
            <button
              onClick={() => setBrokenLane(!brokenLane)}
              className={`rounded-full px-3.5 py-1 text-xs text-white transition-colors ${brokenLane ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-700'}`}
            >
              {brokenLane ? '修复 lane' : '注入坏 lane'}
            </button>
          </>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        本级问题：<span className="font-medium text-slate-700">{LEVELS[level].question}</span>
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">点击部件查看说明</p>
        {info ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{info.name}</span>
            <span className="mx-2 text-slate-300">|</span>
            {info.desc}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            四级下钻：L0 装配全貌 → L1 bump 场按 16 通道切分 → L2 每通道 PHY/DLL/TSV 落点电路 → L3 眼图与 8 通道同步代价、
            lane 修复、以及测试为什么必须借道 DA 端口（功能电路与测试电路共用设计）。拖拽旋转、滚轮缩放。
          </p>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-slate-400">
        通道数与 bump 普查口径出自 JEDEC / SWTest 2017 / Siemens 汇总（详见笔记来源清单）；版图条带与电路块为示意比例。眼图动画为概念示意，非实测波形。
      </figcaption>
    </figure>
  );
}
