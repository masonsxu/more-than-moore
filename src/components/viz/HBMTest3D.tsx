import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, Instance, Instances, OrbitControls, RoundedBox } from '@react-three/drei';

/* ───────────────────────── 类型与数据 ───────────────────────── */

type Mode = 'probe' | 'comm' | 'signal';

type PartId =
  | 'probecard'
  | 'dftpads'
  | 'pswtpads'
  | 'dabumps'
  | 'bumps'
  | 'basedie'
  | 'dram'
  | 'tsv'
  | 'interposer'
  | 'gpu'
  | 'ate';

const MODES: { id: Mode; label: string }[] = [
  { id: 'probe', label: '探针扎针区域' },
  { id: 'comm', label: 'GPU 通讯区域' },
  { id: 'signal', label: 'ATE 信号链路' },
];

// 每种模式下变暗的部件（其余保持高亮）
const MODE_DIM: Record<Mode, PartId[]> = {
  probe: ['gpu', 'interposer', 'bumps'],
  comm: ['probecard', 'dftpads', 'pswtpads', 'dabumps', 'ate', 'dram', 'tsv'],
  signal: ['gpu', 'interposer'],
};

const PART_INFO: Record<PartId, { name: string; desc: string }> = {
  probecard: {
    name: '探针卡（Probe Card）',
    desc: 'ATE 与晶圆之间的电接触界面：HBM 量产 CP 用悬臂/垂直 MEMS 针；速度按 DDRx/HBM 规格走（SWTest 2022/2025，FormFactor）。HBM4 时代要求 >10 Gbps、单堆栈供电向 100 W 量级走（semiengineering，2026）。',
  },
  dftpads: {
    name: 'DFT / 牺牲测试焊盘',
    desc: 'JEDEC 在 HBM micro-bump 版图中预留了牺牲测试焊盘空间（semiengineering，2026）：量产 CP 在焊盘上扎针，焊盘属"一次性"资源；开发/特性分析阶段才直接扎 micro-bump（FormFactor，2026）。焊盘拉开间距后探针卡成本可省约 80%（Aehr Test，via semiengineering）。',
  },
  pswtpads: {
    name: 'PSWT 铝测试焊盘（base die 背面）',
    desc: '堆叠后晶圆测试（Post-Stack Wafer Test）的扎针位置：在 base die 背面 micro-bump 版图的预留空间里布铝焊盘（Teradyne，via semiengineering，2026），测试时堆叠晶圆翻转、探针从 base die 背面下针（SWTest 2017，SK hynix/FormFactor/Advantest）。',
  },
  dabumps: {
    name: 'JEDEC 直接访问凸点（Direct Access）',
    desc: 'HBM 版图中专供测试的凸点：HBM2 每堆栈 3990 个 TSV micro-bump 中有 176 个直接访问凸点，ATE 借此对堆栈做 at-speed 原生模式测试（SWTest 2017）。base die 的 DFT（IEEE 1500 / JEDEC direct access、MBiST）经它们接入（semiengineering，2026）。',
  },
  bumps: {
    name: 'GPU 通讯 micro-bump 场',
    desc: '堆栈与 interposer 之间的凸点场：HBM2 为 1728 个 IO + 1056 个电源 + 1030 个地（SWTest 2017）。HBM3E 为 1024-bit 接口，HBM4 翻倍到 2048-bit——TSV 数量显著增加、bump pitch 收紧（Synopsys，via semiengineering，2026）。',
  },
  basedie: {
    name: 'Base Die：堆栈唯一的测试通路',
    desc: '堆叠后每层 DRAM 只能经 base die 访问：其 DFT 电路（IEEE 1500 / JEDEC direct access、可编程 MBiST、TSV 连通性检测、PHY）在 base die 晶圆测试阶段就先行验证——base die 坏一颗，上面 8–16 层全部报废（semiengineering，2026）。',
  },
  dram: {
    name: 'DRAM 核心裸片 ×12',
    desc: '每层在堆叠前单独过晶圆 CP：约 100 MHz 弱位筛选 + 冗余修复，64–128 site 并行（Neumonda，via semiengineering）；高温/低温与烧灼筛掉早期失效，每次插入都可做 TSV 修复。',
  },
  tsv: {
    name: '贯穿堆栈的 TSV 链',
    desc: '信号/供电经 TSV 纵向穿过 12 层。TSV 缺陷是 HBM 最常见的 column fail 来源（Synopsys）；每次测试插入都会做 TSV 连通性检测与修复（lane repair / TSV repair）。',
  },
  interposer: {
    name: '硅中介层',
    desc: '承载 GPU 与 HBM 堆栈间的高密度走线；HBM 的 2048-bit 接口走线密度超出 PCB 能力，只能走 interposer（CoWoS 类）或 bridge（EMIB 类）。',
  },
  gpu: {
    name: 'GPU（通讯对端）',
    desc: '典型 AI 封装中 1 颗 GPU 配 8 颗 HBM 堆栈，坏一颗堆栈在最终测试才暴露代价极高（Teradyne）；数据中心统计显示 HBM 是 GPU 失效的第一大来源（Synopsys，via semiengineering，2026）。',
  },
  ate: {
    name: 'ATE（自动测试设备）',
    desc: '存储 ATE 配算法图形发生器（APG）+ 失效捕获存储，在跑测试的同时在线做修复分析（Advantest Oda，via semiengineering）；并行度 64–128 site 以摊薄测试成本。',
  },
};

const FACTS: Record<Mode, [string, string][]> = {
  probe: [
    ['HBM2 凸点普查', '共 3990：IO 1728 · 电源 1056 · 地 1030 · 直接访问 176'],
    ['凸点间距', '55 μm（27.5×48 μm 交错），阵列 6022×2832 μm'],
    ['扎针选择', '量产：牺牲 test pad；特性分析：直接扎 μbump'],
    ['探针卡成本', 'test pad 拉开间距 → 省约 80%（免 50 万美元级探针卡）'],
    ['CP 并行度', '64–128 site；探针卡约 2 万针、单针 2.5 g、整片约 50 kg'],
    ['PSWT 下针面', 'base die 背面铝焊盘（bump 场中预留），翻转扎针'],
    ['扎痕数据', '105 °C 下 scrub 深度 1.66–3.86 μm（25 μm μbump）'],
  ],
  comm: [
    ['接口宽度', 'HBM3E 1024-bit → HBM4/4E 2048-bit（32 通道/64 伪通道）'],
    ['凸点分布', 'HBM2：IO 1728 + 电源 1056 + 地 1030 + 直接访问 176'],
    ['TSV 压力', 'HBM4 TSV 数量大增、bump pitch 收紧（Synopsys）'],
    ['现场失效', '数据中心 GPU 失效首因是 HBM；TSV 缺陷→column fail 最常见'],
    [' Lane 修复', 'JEDEC 标准含 lane repair，DFT 支持坏通道重映射'],
    ['8 通道同步', '8 通道同时跑数据时输出眼图明显收缩（SWTest 2017 实测）'],
    ['系统风险', '典型 1 GPU + 8 堆栈，最终测试才暴露坏堆栈代价最高'],
  ],
  signal: [
    ['两速插入', 'CP 约 100 MHz 弱位筛选+修复 → KGD at-speed 低并行'],
    ['内存 ATE', 'APG 图形发生器 + 失效捕获存储，修复分析在线完成'],
    ['插入次数', '12 层堆栈全流程 3–12 次测试插入（视封装厂质量档位）'],
    ['访问协议', 'IEEE 1500 / JEDEC direct access + 可编程 MBiST'],
    ['修复', '晶圆级激光修复；封装级 e-fuse；JEDEC PPR 每 bank 一行'],
    ['诊断粒度', 'MBiST 报告到 bank / 行 / 列，支撑物理失效分析'],
    ['产线全流程', 'ET+WBI → Pre-Laser Hot/Cold → Laser 修复 → 减薄 → Inking'],
  ],
};

/* ───────────────────────── 几何常量（示意比例） ───────────────────────── */

const STACK_X = -2.7; // 堆栈中心
const GPU_X = 2.9; // GPU 中心
const BASE_Y = 0.95; // base die 中心 y（半厚 0.13 → 顶面 1.08）
const DIE_H = 0.16;
const PITCH = 0.23;
const N_DIE = 12;
const FIRST_DIE_Y = BASE_Y + 0.13 + DIE_H / 2; // 1.21
const STACK_TOP = FIRST_DIE_Y + (N_DIE - 1) * PITCH + DIE_H / 2; // ≈3.90
const EXPLODE_STEP = 0.32;
const FLIP_LIFT = 5.9;

// base die 背面（朝 interposer）凸点场：GPU 通讯 bump
const FIELD: [number, number][] = (() => {
  const g: [number, number][] = [];
  for (let x = -4.2; x <= -1.21; x += 0.3) {
    for (let z = -1.44; z <= 1.45; z += 0.36) g.push([x, z]);
  }
  return g;
})();

// JEDEC 直接访问凸点（红色，z 对称以便翻转后位置自映射）
const DA: [number, number][] = [
  [-1.05, -1.05], [-1.05, -0.35], [-1.05, 0.35], [-1.05, 1.05],
  [-4.35, -1.05], [-4.35, -0.35], [-4.35, 0.35], [-4.35, 1.05],
];

// PSWT 铝焊盘（base die 背面四角，z 对称）
const PSWT: [number, number][] = [
  [-1.35, -1.5], [-1.35, 1.5], [-4.05, -1.5], [-4.05, 1.5],
];

// 探针针位 = DA 凸点位（翻转前后 xz 自映射）
const NEEDLES: [number, number][] = DA;

// 贯穿堆栈的 TSV 列位置（示意 4 列）
const TSV_COL: [number, number][] = [
  [-3.6, 0.9], [-1.8, 0.9], [-3.6, -0.9], [-1.8, -0.9],
];

// 顶层 DFT 焊盘环（外圈一圈 + 8 个与针位重合的内点）
const PAD_RING: [number, number][] = (() => {
  const pts: [number, number][] = [...NEEDLES];
  const xs = [-4.5, -0.9];
  for (let z = -1.8; z <= 1.81; z += 0.45) {
    pts.push([xs[0] + 0.16, z]);
    pts.push([xs[1] - 0.16, z]);
  }
  for (let x = -4.3; x <= -1.11; x += 0.45) {
    pts.push([x, -1.8 + 0.16]);
    pts.push([x, 1.8 - 0.16]);
  }
  return pts;
})();

// GPU 通讯高亮：base die 顶面通道走线（RDL 示意）与 GPU PHY 边缘
const RDL_XS = [-4.0, -3.4, -2.8, -2.2, -1.6, -1.2];

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
  tone?: 'slate' | 'red' | 'cyan';
}) {
  if (!show) return null;
  const border =
    tone === 'red' ? 'border-red-200 text-red-700' : tone === 'cyan' ? 'border-cyan-200 text-cyan-700' : 'border-slate-200 text-slate-800';
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap rounded-md border bg-white/95 px-2 py-1 text-xs shadow-sm ${border}`}>{text}</div>
    </Html>
  );
}

/** 阻尼插值 0→1 */
function useDamp(target: boolean, speed = 4) {
  const k = useRef(0);
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.damp(k.current, target ? 1 : 0, speed, dt);
  });
  return k;
}

/* ───────────────────────── 堆栈（含翻转） ───────────────────────── */

function StackFlip({
  flipped,
  active,
  onSelect,
  children,
}: {
  flipped: boolean;
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
  children: React.ReactNode;
}) {
  const k = useDamp(flipped, 3.2);
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI * k.current;
    ref.current.position.y = FLIP_LIFT * k.current;
  });
  return (
    <group ref={ref} onClick={() => onSelect(null)}>
      {children}
    </group>
  );
}

interface DieProps {
  index: number;
  center: number;
  exploded: boolean;
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
}

function DieLayer({ index, center, exploded, active, onSelect }: DieProps) {
  const ref = useRef<THREE.Group>(null!);
  const k = useDamp(exploded, 4);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = center + k.current * index * EXPLODE_STEP;
  });
  return (
    <group ref={ref} position={[0, center, 0]}>
      <RoundedBox args={[3.6, DIE_H, 3.6]} radius={0.02} smoothness={2} position={[STACK_X, 0, 0]} {...pickProps({ id: 'dram', active, onSelect })}>
        <meshStandardMaterial color="#2f4a6e" metalness={0.35} roughness={0.4} {...dimMaterial(active !== null && active !== 'dram', active === 'dram')} />
      </RoundedBox>
      {/* 该层堆叠前 CP 用的正面焊盘环（层间贴合后被遮住——"牺牲"含义） */}
      <Instances limit={64} position={[STACK_X, DIE_H / 2 + 0.012, 0]} {...pickProps({ id: 'dftpads', active, onSelect })}>
        <cylinderGeometry args={[0.05, 0.05, 0.024, 10]} />
        <meshStandardMaterial color="#d9e2ec" metalness={0.7} roughness={0.3} {...dimMaterial(active !== null && active !== 'dftpads', active === 'dftpads')} />
        {PAD_RING.map(([x, z], i) => (
          <Instance key={i} position={[x - STACK_X, 0, z]} />
        ))}
      </Instances>
    </group>
  );
}

/* ───────────────────────── 信号脉冲 ───────────────────────── */

const SIGNAL_PTS: [number, number, number][] = [
  [-7.0, 4.6, 0.4], // ATE
  [-4.9, 5.7, 0.2], // 线缆
  [-2.7, 5.62, 0.0], // 探针卡内
  [-1.05, 5.32, 0.35], // 针身
  [-1.05, 4.18, 0.35], // 针尖
  [-1.05, 3.94, 0.35], // 顶层 DFT 焊盘
  [-1.8, 3.6, 0.9], // TSV 列顶
  [-1.8, 2.6, 0.9],
  [-1.8, 1.6, 0.9],
  [-1.8, 1.14, 0.9], // 到 base die 顶
  [-2.2, 1.0, 0.4], // base die MBiST / DFT
  [-1.05, 0.86, 0.35],
  [-1.05, 0.72, 0.35], // JEDEC 直接访问凸点
];

function SignalPath({ visible }: { visible: boolean }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(SIGNAL_PTS.map((p) => new THREE.Vector3(...p))), []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.018, 6, false), [curve]);
  const pulse = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const u = clock.getElapsedTime() * 0.14;
    const t = 1 - Math.abs(1 - 2 * (u % 1)); // 三角波：往返
    pulse.current.position.copy(curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1)));
  });
  if (!visible) return null;
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
    </group>
  );
}

/* ───────────────────────── 场景 ───────────────────────── */

function Scene({
  mode,
  exploded,
  active,
  onSelect,
}: {
  mode: Mode;
  exploded: boolean;
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
}) {
  const flipped = mode === 'probe';
  const dim = (id: PartId) => MODE_DIM[mode].includes(id);
  const probeK = useDamp(flipped, 3.2);

  return (
    <group>
      {/* 封装基板 */}
      <RoundedBox args={[12, 0.4, 8]} radius={0.05} smoothness={3} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#1a2233" metalness={0.1} roughness={0.6} transparent opacity={0.95} />
      </RoundedBox>

      {/* 硅中介层 */}
      <RoundedBox
        args={[10.4, 0.3, 6.4]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.55, 0]}
        {...pickProps({ id: 'interposer', active, onSelect })}
      >
        <meshStandardMaterial color="#a8b3c8" metalness={0.45} roughness={0.35} {...dimMaterial(dim('interposer') && active !== 'interposer', active === 'interposer')} />
      </RoundedBox>

      {/* GPU */}
      <RoundedBox
        args={[4.2, 0.5, 3.6]}
        radius={0.04}
        smoothness={3}
        position={[GPU_X, 0.95, 0]}
        {...pickProps({ id: 'gpu', active, onSelect })}
      >
        <meshStandardMaterial color="#274060" metalness={0.4} roughness={0.35} {...dimMaterial(dim('gpu') && active !== 'gpu', active === 'gpu')} />
      </RoundedBox>
      {/* GPU PHY 边缘（朝 HBM 一侧） */}
      <mesh position={[GPU_X - 2.14, 0.95, 0]}>
        <boxGeometry args={[0.05, 0.14, 2.8]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} transparent opacity={dim('gpu') && active !== 'gpu' ? 0.07 : 0.95} />
      </mesh>

      {/* 堆栈（探针模式整体翻转，露出 base die 背面扎针面） */}
      <StackFlip flipped={flipped} active={active} onSelect={onSelect}>
        {/* GPU 通讯 micro-bump 场（base die ↔ interposer） */}
        <Instances limit={128} position={[0, 0.755, 0]} {...pickProps({ id: 'bumps', active, onSelect })}>
          <cylinderGeometry args={[0.055, 0.055, 0.1, 8]} />
          <meshStandardMaterial color="#e3b34c" metalness={0.85} roughness={0.25} {...dimMaterial(dim('bumps') && active !== 'bumps', active === 'bumps')} />
          {FIELD.map(([x, z], i) => (
            <Instance key={i} position={[x, 0, z]} />
          ))}
        </Instances>

        {/* JEDEC 直接访问凸点 */}
        <Instances limit={16} position={[0, 0.74, 0]} {...pickProps({ id: 'dabumps', active, onSelect })}>
          <cylinderGeometry args={[0.085, 0.085, 0.12, 10]} />
          <meshStandardMaterial color="#e05656" metalness={0.6} roughness={0.3} {...dimMaterial(dim('dabumps') && active !== 'dabumps', active === 'dabumps')} />
          {DA.map(([x, z], i) => (
            <Instance key={i} position={[x, 0, z]} />
          ))}
        </Instances>

        {/* PSWT 铝焊盘（base die 背面） */}
        <Instances limit={8} position={[0, 0.745, 0]} {...pickProps({ id: 'pswtpads', active, onSelect })}>
          <boxGeometry args={[0.16, 0.03, 0.16]} />
          <meshStandardMaterial color="#c3cad4" metalness={0.75} roughness={0.3} {...dimMaterial(dim('pswtpads') && active !== 'pswtpads', active === 'pswtpads')} />
          {PSWT.map(([x, z], i) => (
            <Instance key={i} position={[x, 0, z]} />
          ))}
        </Instances>

        {/* Base Die */}
        <RoundedBox
          args={[3.6, 0.26, 3.6]}
          radius={0.03}
          smoothness={3}
          position={[STACK_X, BASE_Y, 0]}
          {...pickProps({ id: 'basedie', active, onSelect })}
        >
          <meshStandardMaterial color="#0f766e" metalness={0.4} roughness={0.35} {...dimMaterial(active !== null && active !== 'basedie' && active !== 'dram' && active !== 'tsv', active === 'basedie')} />
        </RoundedBox>

        {/* base die 顶面通道走线（GPU 通讯电路，示意 RDL） */}
        {RDL_XS.map((x, i) => (
          <mesh key={i} position={[x, BASE_Y + 0.14, 0]}>
            <boxGeometry args={[0.07, 0.02, 2.9]} />
            <meshStandardMaterial color="#e3b34c" metalness={0.8} roughness={0.3} transparent opacity={dim('basedie') && active !== 'basedie' ? 0.05 : 0.9} />
          </mesh>
        ))}

        {/* 贯穿堆栈的 TSV 列 */}
        <Instances limit={8} position={[0, (1.08 + STACK_TOP) / 2, 0]} {...pickProps({ id: 'tsv', active, onSelect })}>
          <cylinderGeometry args={[0.032, 0.032, STACK_TOP - 1.08, 8]} />
          <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.3} {...dimMaterial((dim('tsv') || active === 'dram') && active !== 'tsv', active === 'tsv')} />
          {TSV_COL.map(([x, z], i) => (
            <Instance key={i} position={[x, 0, z]} />
          ))}
        </Instances>

        {/* 12 层 DRAM */}
        {Array.from({ length: N_DIE }, (_, i) => (
          <DieLayer key={i} index={i} center={FIRST_DIE_Y + i * PITCH} exploded={exploded && !flipped} active={active} onSelect={onSelect} />
        ))}
      </StackFlip>

      {/* ATE */}
      <group {...pickProps({ id: 'ate', active, onSelect })}>
        <RoundedBox args={[1.9, 1.3, 1.5]} radius={0.06} smoothness={3} position={[-7.0, 4.6, 0]}>
          <meshStandardMaterial color="#1c2534" metalness={0.3} roughness={0.5} {...dimMaterial(dim('ate') && active !== 'ate', active === 'ate')} />
        </RoundedBox>
        <mesh position={[-6.62, 4.85, 0]}>
          <boxGeometry args={[0.9, 0.5, 0.02]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={dim('ate') && active !== 'ate' ? 0.05 : 0.85} />
        </mesh>
      </group>

      {/* 探针卡 + 针（信号/探针模式显示） */}
      <group visible={mode !== 'comm'}>
        <group>
          <RoundedBox
            args={[4.0, 0.35, 4.0]}
            radius={0.05}
            smoothness={3}
            position={[STACK_X, 5.62, 0]}
            {...pickProps({ id: 'probecard', active, onSelect })}
          >
            <meshStandardMaterial color="#2a3344" metalness={0.35} roughness={0.45} {...dimMaterial(active !== null && active !== 'probecard' && active !== 'ate', active === 'probecard')} />
          </RoundedBox>
          {/* 针位随翻转姿态微调（贴住暴露面） */}
          <Needles active={active} onSelect={onSelect} probeK={probeK} />
        </group>
      </group>

      {/* ATE → 探针卡线缆 */}
      <mesh position={[-4.95, 5.66, 0.1]} visible={mode !== 'comm'}>
        <boxGeometry args={[3.0, 0.08, 0.08]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
      </mesh>

      {/* 信号链路动画 */}
      <SignalPath visible={mode === 'signal' && !flipped} />

      {/* 标注 */}
      <InfoLabel show={mode === 'probe'} position={[STACK_X, 6.75, 0]} text="PSWT：堆叠晶圆翻转，探针从 base die 背面扎针" tone="red" />
      <InfoLabel show={mode === 'comm'} position={[STACK_X, 0.15, 2.4]} text="GPU 通讯凸点场：IO + 电源 / 地（JEDEC 版图）" tone="cyan" />
      <InfoLabel show={mode === 'signal'} position={[-7.0, 5.6, 0]} text="ATE：APG + 失效捕获存储" tone="cyan" />
      <InfoLabel show={mode === 'signal'} position={[STACK_X, 6.2, 0]} text="探针卡（CP：悬臂 / 垂直 MEMS 针）" />
      <InfoLabel show={mode === 'signal'} position={[STACK_X, 4.3, 0]} text="DFT 焊盘 → TSV 链 → 逐层 MBiST" tone="cyan" />
      <InfoLabel show={mode === 'comm'} position={[GPU_X, 1.7, 0]} text="GPU：8 通道 IO 经 interposer 接入" tone="cyan" />
    </group>
  );
}

function Needles({
  active,
  onSelect,
  probeK,
}: {
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
  probeK: { current: number };
}) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!g.current) return;
    const k = probeK.current;
    g.current.position.y = 5.45 - 1.22 * (1 - k); // 翻转时暴露面抬高，针随之下移
  });
  return (
    <group ref={g} {...pickProps({ id: 'probecard', active, onSelect })}>
      <Instances limit={16}>
        <coneGeometry args={[0.045, 1.15, 8]} />
        <meshStandardMaterial color="#9aa7b8" metalness={0.85} roughness={0.25} />
        {NEEDLES.map(([x, z], i) => (
          <Instance key={i} position={[x, -0.62, z]} rotation={[Math.PI, 0, 0]} />
        ))}
      </Instances>
    </group>
  );
}

/* ───────────────────────── 页面组件 ───────────────────────── */

const LEGEND: { color: string; label: string }[] = [
  { color: '#e3b34c', label: 'GPU 通讯 IO 凸点' },
  { color: '#e05656', label: 'JEDEC 直接访问凸点（测试专用）' },
  { color: '#c3cad4', label: 'PSWT 铝焊盘（base die 背面）' },
  { color: '#d9e2ec', label: 'DFT / 牺牲测试焊盘' },
  { color: '#c9a227', label: 'TSV 链' },
];

export default function HBMTest3D() {
  const [mode, setMode] = useState<Mode>('probe');
  const [exploded, setExploded] = useState(false);
  const [active, setActive] = useState<PartId | null>(null);
  const info = active ? PART_INFO[active] : null;

  return (
    <figure className="not-prose my-8">
      <div className="h-[520px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <Canvas camera={{ position: [10, 7.5, 14], fov: 35 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 10, 6]} intensity={1.5} />
          <directionalLight position={[-6, 4, -6]} intensity={0.4} />
          <Scene mode={mode} exploded={exploded} active={active} onSelect={setActive} />
          <ContactShadows position={[0, -0.02, 0]} opacity={0.3} scale={18} blur={2.4} far={6} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={6}
            maxDistance={30}
            maxPolarAngle={1.85}
            target={[0, 3.0, 0]}
          />
        </Canvas>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setActive(null);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              mode === m.id
                ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {m.label}
          </button>
        ))}
        <span className="text-xs text-slate-400">12 层堆栈 · CoWoS 型封装语境</span>
        {mode !== 'probe' && (
          <button
            onClick={() => setExploded(!exploded)}
            className="ml-auto rounded-full bg-slate-900 px-3.5 py-1 text-xs text-white transition-colors hover:bg-slate-700"
          >
            {exploded ? '合拢视图' : '爆炸视图'}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">点击部件查看说明</p>
          {info ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">{info.name}</span>
              <span className="mx-2 text-slate-300">|</span>
              {info.desc}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              「探针扎针区域」自动翻转堆栈，展示 base die 背面的 PSWT 扎针面（测试电路）；「GPU 通讯区域」回到装配姿态，
              高亮通道 IO 凸点场与 base die 通道走线（通讯电路）；「ATE 信号链路」播放 ATE → 探针卡 → 焊盘 → TSV → MBiST 的信号路径。
              拖拽旋转、滚轮缩放，可把视角压低查看堆栈底面。
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <table className="w-full text-xs">
            <tbody>
              {FACTS[mode].map(([k, v]) => (
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
        结构为示意比例（层厚、焊盘与针距已放大以供观察）；翻转姿态仅示意 PSWT 时的下针面，实际由探针台完成。数据口径见笔记正文来源清单
        （SWTest 2017/2025、semiengineering 2026、FormFactor 2026）。
      </figcaption>
    </figure>
  );
}
