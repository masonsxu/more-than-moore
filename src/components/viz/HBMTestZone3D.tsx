import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, Instance, Instances, OrbitControls, RoundedBox } from '@react-three/drei';

/* ═════════════════════════ 目的：把「数据是被设计出来的」画出来 ═════════════════════════
 * 四级下钻：L0 扎针姿态 → L1 版图分区 → L2 电路模块 → L3 测量与判定（电路设计 × 测试程序）
 * 每一级回答一个问题：
 *   L0 测试电路在堆栈的哪个物理位置？
 *   L1 测试资源在版图上怎么分区、占多少？
 *   L2 这些分区背后是哪些电路模块？
 *   L3 电路怎么施电压/电流、程序怎么用阈值判 bin——数据从哪一列寄存器里出来的？
 * ═════════════════════════════════════════════════════════════════════════════════ */

type Level = 0 | 1 | 2 | 3;

type PartId =
  | 'probecard'
  | 'needle'
  | 'ate'
  | 'dftpads'
  | 'pswtpads'
  | 'dabumps'
  | 'bumps'
  | 'basedie'
  | 'dram'
  | 'tsv'
  | 'zIO'
  | 'zP'
  | 'zG'
  | 'zDA'
  | 'cDA'
  | 'cWrap'
  | 'cMBiST'
  | 'cFuse'
  | 'cTSVsense'
  | 'cPHY'
  | 'cESD'
  | 'cRail'
  | 'mPMU'
  | 'mPad'
  | 'mDiode'
  | 'mArray';

const LEVELS: { id: Level; label: string; question: string }[] = [
  { id: 0, label: 'L0 扎针姿态', question: '测试电路在堆栈的哪个物理位置？' },
  { id: 1, label: 'L1 版图分区', question: '测试资源在 base die 版图上怎么分区？' },
  { id: 2, label: 'L2 电路模块', question: '分区背后是哪些电路模块？' },
  { id: 3, label: 'L3 测量与判定', question: '电压/电流怎么变成一个 bin？' },
];

const PART_INFO: Record<PartId, { name: string; desc: string }> = {
  probecard: {
    name: '探针卡（Probe Card）',
    desc: 'ATE 与晶圆的电接触界面：量产 CP 用悬臂/垂直 MEMS 针；牺牲焊盘拉开间距后探针卡可省约 80% 成本（Aehr Test，via semiengineering 2026）。',
  },
  needle: {
    name: '探针针尖',
    desc: '单针压力约 2.5 g、整片约 50 kg、约 2 万针（Neumonda，via semiengineering）；105 °C 下 scrub 深度 1.66–3.86 μm（SWTest 2017 扎痕数据）。',
  },
  ate: {
    name: 'ATE（自动测试设备）',
    desc: '每引脚一个 PMU（参数测量单元）负责加电压/电流并回测；数字通道配算法图形发生器（APG）+ 失效捕获存储（Advantest，via semiengineering 2026）。',
  },
  dftpads: {
    name: 'DFT / 牺牲测试焊盘',
    desc: 'JEDEC 在 micro-bump 版图中预留牺牲测试焊盘（semiengineering 2026）；量产 CP 在焊盘上扎针——焊盘是一次性资源，扎过就报废，这正是「牺牲」的含义。',
  },
  pswtpads: {
    name: 'PSWT 铝焊盘（base die 背面）',
    desc: '堆叠后晶圆测试的下针面：铝焊盘布在 base die 背面 bump 版图预留空间，测试时堆叠晶圆翻转、从背面下针（Teradyne/semiengineering 2026；SWTest 2017）。',
  },
  dabumps: {
    name: 'JEDEC 直接访问凸点',
    desc: 'HBM2 每堆栈 3990 bump 中 176 个为测试专用：ATE 经它们对堆栈做 at-speed 原生模式测试（SWTest 2017，SK hynix/FormFactor/Advantest）。',
  },
  bumps: {
    name: 'GPU 通讯 bump 场（本级退居背景）',
    desc: 'IO 1728 + 电源 1056 + 地 1030（HBM2 普查口径，SWTest 2017）。通讯电路属另一部件：《GPU 通讯区域》模型专门下钻。',
  },
  basedie: {
    name: 'Base Die：堆栈唯一测试通路',
    desc: '堆叠后每层 DRAM 只能经 base die 访问：DFT（direct access、IEEE 1500、MBiST、TSV 检测）在 base die 晶圆测试就先验证——base die 坏一颗，上面 8–16 层全报废（semiengineering 2026）。',
  },
  dram: {
    name: 'DRAM 核心裸片 ×12',
    desc: '堆叠前每层单独过 CP（约 100 MHz 弱位筛选 + 冗余修复）；堆叠后经 PSWT/直接访问凸点整链复测（SWTest 2025）。',
  },
  tsv: {
    name: '贯穿堆栈的 TSV 链',
    desc: 'TSV 缺陷是 HBM 最常见的 column fail 来源（Synopsys）；每次测试插入都做 TSV 连通性检测与修复。',
  },
  zIO: {
    name: 'IO 凸点场：1728',
    desc: 'GPU 通讯数据/控制引脚（HBM2：1024 data + CA/CK/DQS 等）。属通讯区域——本级只标注它「不是」测试资源。',
  },
  zP: {
    name: '电源凸点场：1056',
    desc: '供电网络凸点（HBM2 普查）。PowerShort 测试的对象就是电源网络对地的阻抗状态。',
  },
  zG: {
    name: '地凸点场：1030',
    desc: '回流与参考地（HBM2 普查）。接触测试的「对地保护二极管」就以这里为参考端。',
  },
  zDA: {
    name: '直接访问凸点：176（测试专用）',
    desc: '占比 176/3990 ≈ 4.4%，但堆栈 at-speed 测试的全部入口。版图上独立成列——这就是「测试区域」在版图上的物理实体。',
  },
  cDA: {
    name: 'DA 端口与电平位移',
    desc: '176 个直接访问凸点汇成 DA 总线，经电平位移进入 base die 内部 DFT 逻辑；at-speed 测试数据走这条入口（SWTest 2017；semiengineering 2026）。',
  },
  cWrap: {
    name: 'IEEE 1500 包装（指令译码）',
    desc: '测试指令经 DA 总线写入 wrapper 指令寄存器，选择「测哪颗 die、跑哪段 MBiST、走哪条链」（semiengineering 2026：IEEE 1500 / JEDEC direct access）。',
  },
  cMBiST: {
    name: 'MBiST 引擎（图形 + 比较 + 捕获）',
    desc: '可编程存储内建自测：图形发生器写入、读出比较、失效位记入失效捕获存储——修复分析在线完成（Advantest）；诊断到 bank/行/列粒度（Synopsys）。',
  },
  cFuse: {
    name: '修复 Steering（fuse box）',
    desc: '冗余重映射的执行机构：晶圆级激光修复、封装级 e-fuse、JEDEC PPR 每 bank 一行；MBiST 报告坏地址 → fuse box 换行/列/lane。',
  },
  cTSVsense: {
    name: 'TSV 感测电路',
    desc: 'TSV 链的连通性/延迟检测；TSV 缺陷是最常见的 column fail 来源（Synopsys），每次插入都可修（TSV repair）。',
  },
  cPHY: {
    name: 'PHY（与通讯区共享）',
    desc: 'at-speed 测试复用通讯 PHY 把速率拉到原生模式（>2.4 Gbps，SWTest 2017 实测口径）；PHY 在 base die 晶圆测试先单独验证。',
  },
  cESD: {
    name: '焊盘 ESD 保护二极管对',
    desc: '每个焊盘到 VDD/VSS 各接一只保护二极管。接触测试就是有意利用它：对二极管加流测压降（US5365180A；Marvin Test KB Q200207）。',
  },
  cRail: {
    name: '片上电源网络（VDD/VSS 轨）',
    desc: 'PowerShort 测量的两端。健康时 VDD–VSS 呈 μA–mA 级漏电；短路时 R = V/I 塌到 Ω 量级（Power Short 属 DC 参数测试三件套：PowerShort/Contact/Leakage）。',
  },
  mPMU: {
    name: 'PMU（参数测量单元）',
    desc: 'ATE 每引脚的测量电路：FVMI（加压测流）/ FIMV（加流测压）两种基本模式，DAC 强制、ADC 回测，钳位限幅 + 窗口比较器出 pass/fail（ADI MAX9979 设计笔记、AD5520 手册）。',
  },
  mPad: {
    name: '被测焊盘节点',
    desc: '探针接触点。接触测试在这里分辨三种状态：良好（二极管压降 ≈0.6–0.7 V 量级）、开路（电压顶到钳位）、对地短路（≈0 V）。',
  },
  mDiode: {
    name: '保护二极管（接触测试的「靶子」）',
    desc: '「对 pin 与地（或电源）间典型的二极管强制电流，测压降；接触不良则压降增大」（US5365180A 摘要）。',
  },
  mArray: {
    name: 'DRAM 阵列列（功能测试对象）',
    desc: 'DC 全过之后才轮到 MBiST 功能图形：写 0 读 1 / 写 1 读 0，失效位图按行/列/TSV/lane 归因，可修走修复、不可修判 bin4。',
  },
};

/* ───────────────────────── 通用小组件（与站内其他 viz 一致） ───────────────────────── */

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

function useDamp(target: number, speed = 4) {
  const k = useRef(target);
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.damp(k.current, target, speed, dt);
  });
  return k;
}

/** 相机随级别推近 */
function CameraRig({ level }: { level: Level }) {
  const POSE: Record<Level, { pos: [number, number, number]; target: [number, number, number] }> = {
    0: { pos: [9, 7.5, 14], target: [0, 2.8, 0] },
    1: { pos: [0, 10.5, 6.5], target: [0, 0, 0] },
    2: { pos: [3.5, 5.5, 7], target: [0, 0.4, 0] },
    3: { pos: [3.2, 4.4, 8], target: [0, 0.5, 0] },
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

/* ═════════════════════════ L0 扎针姿态 ═════════════════════════ */

const STACK_X = 0;
const BASE_Y = 0.95;
const DIE_H = 0.16;
const PITCH = 0.23;
const N_DIE = 12;
const FIRST_DIE_Y = BASE_Y + 0.13 + DIE_H / 2;
const STACK_TOP = FIRST_DIE_Y + (N_DIE - 1) * PITCH + DIE_H / 2;
// 爆炸几何：翻转姿态下层片向地面展开，抬升量与层间距必须联立求解才不穿模——
// lift(e) = FIRST_DIE_Y + (N-1)·(PITCH+e·EXPLODE_STEP) + DIE_H/2 + 底部安全距离
const EXPLODE_STEP = 0.2;
const LIFT_BASE = 5.2;
const LIFT_EXPLODED = FIRST_DIE_Y + (N_DIE - 1) * (PITCH + EXPLODE_STEP) + DIE_H / 2 + 0.62;

const FIELD: [number, number][] = (() => {
  const g: [number, number][] = [];
  for (let x = -1.5; x <= 1.5; x += 0.32) {
    for (let z = -1.5; z <= 1.51; z += 0.36) g.push([x, z]);
  }
  return g;
})();

const DA: [number, number][] = [
  [-1.75, -1.1], [-1.75, -0.37], [-1.75, 0.37], [-1.75, 1.1],
  [1.75, -1.1], [1.75, -0.37], [1.75, 0.37], [1.75, 1.1],
];

const PSWT: [number, number][] = [
  [-1.5, -1.62], [-1.5, 1.62], [1.5, -1.62], [1.5, 1.62],
];

const PAD_RING: [number, number][] = (() => {
  const pts: [number, number][] = [...DA];
  for (let z = -1.8; z <= 1.81; z += 0.45) {
    pts.push([-1.66, z]);
    pts.push([1.66, z]);
  }
  for (let x = -1.55; x <= 1.56; x += 0.44) {
    pts.push([x, -1.8]);
    pts.push([x, 1.8]);
  }
  return pts;
})();

const TSV_COL: [number, number][] = [
  [-0.9, 0.8], [0.9, 0.8], [-0.9, -0.8], [0.9, -0.8],
];

/** 爆炸系数阻尼驱动（0→1），由各级共享，保证抬升/层距/探针卡同步运动 */
function ExplodeDriver({ exploded, explodeRef }: { exploded: boolean; explodeRef: { current: number } }) {
  useFrame((_, dt) => {
    explodeRef.current = THREE.MathUtils.damp(explodeRef.current, exploded ? 1 : 0, 3.2, dt);
  });
  return null;
}

function StackFlipL0({
  active,
  onSelect,
  explodeRef,
}: {
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
  explodeRef: { current: number };
}) {
  const grp = useRef<THREE.Group>(null!);
  const dieRefs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    if (!grp.current) return;
    const e = explodeRef.current;
    grp.current.rotation.x = Math.PI; // 探针姿态恒定翻转，露 base die 背面
    grp.current.position.y = LIFT_BASE + (LIFT_EXPLODED - LIFT_BASE) * e;
    for (let i = 0; i < N_DIE; i++) {
      const g = dieRefs.current[i];
      if (g) g.position.y = FIRST_DIE_Y + i * (PITCH + EXPLODE_STEP * e);
    }
  });
  return (
    <group ref={grp} onClick={() => onSelect(null)}>
      <Instances limit={128} position={[0, 0.755, 0]} {...pickProps({ id: 'bumps', active, onSelect })}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#e3b34c" metalness={0.85} roughness={0.25} {...dimMaterial(active !== null && active !== 'bumps', active === 'bumps')} />
        {FIELD.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      <Instances limit={16} position={[0, 0.74, 0]} {...pickProps({ id: 'dabumps', active, onSelect })}>
        <cylinderGeometry args={[0.085, 0.085, 0.12, 10]} />
        <meshStandardMaterial color="#e05656" metalness={0.6} roughness={0.3} {...dimMaterial(active !== null && active !== 'dabumps', active === 'dabumps')} />
        {DA.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      <Instances limit={8} position={[0, 0.745, 0]} {...pickProps({ id: 'pswtpads', active, onSelect })}>
        <boxGeometry args={[0.16, 0.03, 0.16]} />
        <meshStandardMaterial color="#c3cad4" metalness={0.75} roughness={0.3} {...dimMaterial(active !== null && active !== 'pswtpads', active === 'pswtpads')} />
        {PSWT.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      <RoundedBox args={[3.6, 0.26, 3.6]} radius={0.03} smoothness={3} position={[STACK_X, BASE_Y, 0]} {...pickProps({ id: 'basedie', active, onSelect })}>
        <meshStandardMaterial color="#0f766e" metalness={0.4} roughness={0.35} {...dimMaterial(active !== null && active !== 'basedie' && active !== 'dram' && active !== 'tsv', active === 'basedie')} />
      </RoundedBox>
      <Instances limit={8} position={[0, (1.08 + STACK_TOP) / 2, 0]} {...pickProps({ id: 'tsv', active, onSelect })}>
        <cylinderGeometry args={[0.032, 0.032, STACK_TOP - 1.08, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.3} {...dimMaterial(active !== null && active !== 'tsv' && active !== 'dram', active === 'tsv')} />
        {TSV_COL.map(([x, z], i) => (
          <Instance key={i} position={[x, 0, z]} />
        ))}
      </Instances>
      {Array.from({ length: N_DIE }, (_, i) => {
        const isTop = i === N_DIE - 1;
        return (
          <group
            key={i}
            ref={(el) => {
              dieRefs.current[i] = el;
            }}
            position={[0, FIRST_DIE_Y + i * PITCH, 0]}
          >
            <RoundedBox args={[3.6, DIE_H, 3.6]} radius={0.02} smoothness={2} position={[STACK_X, 0, 0]} {...pickProps({ id: 'dram', active, onSelect })}>
              <meshStandardMaterial color="#2f4a6e" metalness={0.35} roughness={0.4} {...dimMaterial(active !== null && active !== 'dram' && active !== 'tsv', active === 'dram')} />
            </RoundedBox>
            {isTop && (
              <Instances limit={48} position={[STACK_X, DIE_H / 2 + 0.012, 0]} {...pickProps({ id: 'dftpads', active, onSelect })}>
                <cylinderGeometry args={[0.05, 0.05, 0.024, 10]} />
                <meshStandardMaterial color="#d9e2ec" metalness={0.7} roughness={0.3} {...dimMaterial(active !== null && active !== 'dftpads', active === 'dftpads')} />
                {PAD_RING.map(([x, z], j) => (
                  <Instance key={j} position={[x - STACK_X, 0, z]} />
                ))}
              </Instances>
            )}
          </group>
        );
      })}
    </group>
  );
}

function ProbeRigL0({ active, onSelect, explodeRef }: { active: PartId | null; onSelect: (id: PartId | null) => void; explodeRef: { current: number } }) {
  const rig = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (rig.current) rig.current.position.y = explodeRef.current * (LIFT_EXPLODED - LIFT_BASE); // 探针卡/针/线缆/ATE 同步抬升
  });
  return (
    <group ref={rig}>
      <RoundedBox args={[4.0, 0.35, 4.0]} radius={0.05} smoothness={3} position={[STACK_X, 6.05, 0]} {...pickProps({ id: 'probecard', active, onSelect })}>
        <meshStandardMaterial color="#2a3344" metalness={0.35} roughness={0.45} {...dimMaterial(active !== null && active !== 'probecard' && active !== 'needle', active === 'probecard')} />
      </RoundedBox>
      {/* 针组：局部 y 固定，随 rig 抬升后针尖始终贴住暴露面（face = lift - 0.755） */}
      <group position={[0, 5.55, 0]} {...pickProps({ id: 'needle', active, onSelect })}>
        <Instances limit={16}>
          <coneGeometry args={[0.045, 1.05, 8]} />
          <meshStandardMaterial color="#9aa7b8" metalness={0.85} roughness={0.25} {...dimMaterial(active !== null && active !== 'needle', active === 'needle')} />
          {DA.map(([x, z], i) => (
            <Instance key={i} position={[x, -0.58, z]} rotation={[Math.PI, 0, 0]} />
          ))}
        </Instances>
      </group>
      <mesh position={[-3.6, 5.9, 0.1]}>
        <boxGeometry args={[3.3, 0.08, 0.08]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
      </mesh>
      <group {...pickProps({ id: 'ate', active, onSelect })}>
        <RoundedBox args={[1.9, 1.3, 1.5]} radius={0.06} smoothness={3} position={[-6.4, 5.85, 0]}>
          <meshStandardMaterial color="#1c2534" metalness={0.3} roughness={0.5} {...dimMaterial(active !== null && active !== 'ate', active === 'ate')} />
        </RoundedBox>
        <mesh position={[-6.4, 5.85, 0.76]}>
          <boxGeometry args={[0.85, 0.45, 0.02]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={active === 'ate' ? 1 : 0.8} />
        </mesh>
      </group>
    </group>
  );
}

function Level0({ active, onSelect, explodeRef }: { active: PartId | null; onSelect: (id: PartId | null) => void; explodeRef: { current: number } }) {
  return (
    <group>
      <RoundedBox args={[11, 0.4, 7.5]} radius={0.05} smoothness={3} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#1a2233" metalness={0.1} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[9.4, 0.3, 6]} radius={0.04} smoothness={3} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#a8b3c8" metalness={0.45} roughness={0.35} transparent opacity={0.5} />
      </RoundedBox>
      <StackFlipL0 active={active} onSelect={onSelect} explodeRef={explodeRef} />
      <ProbeRigL0 active={active} onSelect={onSelect} explodeRef={explodeRef} />
      <InfoLabel show position={[4.9, 4.9, 0]} text="翻转姿态：探针从 base die 背面（PSWT 铝焊盘）下针" tone="red" />
      <InfoLabel show position={[STACK_X, 3.4, 2.6]} text="红色 = JEDEC 直接访问凸点（测试专用入口）" tone="cyan" />
    </group>
  );
}

/* ═════════════════════════ L1 版图分区 ═════════════════════════ */

// 分区矩形：[x中心, z中心, 宽, 深]（示意比例，参照 HBM2 版图普查的长宽比）
const ZONES: { id: PartId; color: string; x: number; z: number; w: number; d: number; count: number; label: string }[] = [
  { id: 'zP', color: '#e07b39', x: -3.3, z: 0, w: 1.5, d: 4.6, count: 1056, label: '电源 1056' },
  { id: 'zG', color: '#3c4658', x: 3.3, z: 0, w: 1.5, d: 4.6, count: 1030, label: '地 1030' },
  { id: 'zIO', color: '#e3b34c', x: 0, z: 0, w: 4.6, d: 4.6, count: 1728, label: 'IO 1728' },
  { id: 'zDA', color: '#e05656', x: 5.05, z: 0, w: 0.7, d: 4.6, count: 176, label: '直接访问 176' },
];

function Level1({ active, onSelect }: { active: PartId | null; onSelect: (id: PartId | null) => void }) {
  const dots = useMemo(() => {
    const g: Record<string, [number, number][]> = { zIO: [], zP: [], zG: [], zDA: [] };
    const stride = 0.24;
    for (let x = -5.6; x <= 5.61; x += stride) {
      for (let z = -2.3; z <= 2.31; z += stride) {
        for (const zn of ZONES) {
          if (Math.abs(x - zn.x) <= zn.w / 2 - 0.05 && Math.abs(z - zn.z) <= zn.d / 2 - 0.05) {
            g[zn.id].push([x, z]);
            break;
          }
        }
      }
    }
    return g;
  }, []);
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[12.4, 0.24, 5.6]} radius={0.03} smoothness={3} position={[0, -0.18, 0]}>
        <meshStandardMaterial color="#13202f" metalness={0.3} roughness={0.5} />
      </RoundedBox>
      {ZONES.map((zn) => (
        <group key={zn.id}>
          <mesh position={[zn.x, -0.02, zn.z]} {...pickProps({ id: zn.id, active, onSelect })}>
            <boxGeometry args={[zn.w, 0.06, zn.d]} />
            <meshStandardMaterial color={zn.color} metalness={0.4} roughness={0.35} transparent opacity={active === null || active === zn.id ? 0.92 : 0.18} />
          </mesh>
          <Instances limit={400} position={[zn.x, 0.06, zn.z]} {...pickProps({ id: zn.id, active, onSelect })}>
            <cylinderGeometry args={[0.035, 0.035, 0.07, 6]} />
            <meshStandardMaterial color={zn.color} metalness={0.75} roughness={0.3} transparent opacity={active === null || active === zn.id ? 0.95 : 0.12} />
            {dots[zn.id].map(([x, z], i) => (
              <Instance key={i} position={[x - zn.x, 0, z - zn.z]} />
            ))}
          </Instances>
          <InfoLabel show position={[zn.x, 0.5, zn.d / 2 + 0.35]} text={`${zn.label} · 占 ${Math.round((zn.count / 3990) * 100)}%`} tone={zn.id === 'zDA' ? 'red' : 'slate'} />
        </group>
      ))}
      {/* 三个下针点投影到版图 */}
      {PSWT.map(([x, z], i) => (
        <mesh key={i} position={[x * 1.55, 0.12, z * 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.16, 20]} />
          <meshBasicMaterial color="#c3cad4" side={THREE.DoubleSide} />
        </mesh>
      ))}
      <InfoLabel show position={[0, 1.4, -3.4]} text="base die 版图俯视（示意比例）：HBM2 普查 6022×2832 μm · bump pitch 55 μm" tone="amber" />
      <InfoLabel show position={[5.05, 1.4, -2.9]} text="灰色圆环 = PSWT 铝焊盘位置（背面，翻转后可达）" tone="cyan" />
    </group>
  );
}

/* ═════════════════════════ L2 电路模块 ═════════════════════════ */

const BLOCKS: { id: PartId; color: string; x: number; z: number; w: number; d: number; h: number; label: string }[] = [
  { id: 'cDA', color: '#e05656', x: -3.4, z: 0, w: 0.9, d: 3.6, h: 0.35, label: 'DA 端口' },
  { id: 'cWrap', color: '#0e7490', x: -2.1, z: 0, w: 1.2, d: 3.6, h: 0.45, label: 'IEEE 1500' },
  { id: 'cMBiST', color: '#0891b2', x: -0.5, z: 0, w: 1.7, d: 3.6, h: 0.6, label: 'MBiST' },
  { id: 'cFuse', color: '#7c5cd6', x: 1.2, z: 0.95, w: 1.3, d: 1.5, h: 0.4, label: '修复' },
  { id: 'cTSVsense', color: '#c9a227', x: 1.2, z: -0.95, w: 1.3, d: 1.5, h: 0.4, label: 'TSV 感测' },
  { id: 'cPHY', color: '#3d5a80', x: 3.0, z: 0, w: 1.1, d: 3.6, h: 0.5, label: 'PHY' },
];

function Level2({ active, onSelect }: { active: PartId | null; onSelect: (id: PartId | null) => void }) {
  return (
    <group onClick={() => onSelect(null)}>
      <RoundedBox args={[9.2, 0.3, 4.8]} radius={0.03} smoothness={3} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#0f1724" metalness={0.35} roughness={0.5} />
      </RoundedBox>
      {BLOCKS.map((b) => (
        <group key={b.id}>
          <RoundedBox args={[b.w, b.h, b.d]} radius={0.03} smoothness={3} position={[b.x, -0.05 + b.h / 2, b.z]} {...pickProps({ id: b.id, active, onSelect })}>
            <meshStandardMaterial color={b.color} metalness={0.45} roughness={0.35} {...dimMaterial(active !== null && active !== b.id, active === b.id)} />
          </RoundedBox>
          <InfoLabel show position={[b.x, b.h + 0.35, b.z]} text={b.label} tone={b.id === 'cMBiST' ? 'cyan' : 'slate'} />
        </group>
      ))}
      {/* 电源轨 + 焊盘 ESD（版图边缘） */}
      <mesh position={[0, 0.02, 2.55]} {...pickProps({ id: 'cRail', active, onSelect })}>
        <boxGeometry args={[8.4, 0.1, 0.22]} />
        <meshStandardMaterial color="#e07b39" metalness={0.5} roughness={0.4} {...dimMaterial(active !== null && active !== 'cRail', active === 'cRail')} />
      </mesh>
      <mesh position={[0, 0.02, -2.55]} {...pickProps({ id: 'cRail', active, onSelect })}>
        <boxGeometry args={[8.4, 0.1, 0.22]} />
        <meshStandardMaterial color="#e07b39" metalness={0.5} roughness={0.4} transparent opacity={active === null || active === 'cRail' ? 0.9 : 0.12} />
      </mesh>
      <Instances limit={24} position={[-4.25, 0.12, 0]} {...pickProps({ id: 'cESD', active, onSelect })}>
        <coneGeometry args={[0.09, 0.18, 4]} />
        <meshStandardMaterial color="#4ade80" metalness={0.3} roughness={0.4} {...dimMaterial(active !== null && active !== 'cESD', active === 'cESD')} />
        {Array.from({ length: 8 }, (_, i) => (
          <Instance key={i} position={[0, 0, -1.55 + i * 0.45]} />
        ))}
      </Instances>
      <InfoLabel show position={[-4.25, 0.75, 0]} text="焊盘 ESD 二极管排（绿色，朝 DA 端口一侧）" tone="amber" />
      <InfoLabel show position={[0, 1.9, -2.8]} text="base die 内部 DFT 电路布局（示意）：测试数据的「设计位置」" tone="cyan" />
    </group>
  );
}

/* ═════════════════════════ L3 测量与判定 ═════════════════════════ */

type DefectId = 'open' | 'padshort' | 'powershort' | 'leak' | 'func' | 'tsv';

interface DefectSpec {
  id: DefectId;
  label: string;
  step: number; // 在 fail-stop 流程中的拦截步（0 起）
  mode: string; // PMU 模式
  force: string;
  good: string;
  bad: string;
  bin: string;
  action: string;
  circuit: string;
  // 表头读数（示意量级，非特定器件 spec）
  forced: string;
  reading: string;
  limit: string;
  verdict: 'FAIL' | 'FAIL→REPAIR';
}

const DEFECTS: DefectSpec[] = [
  {
    id: 'open',
    label: '焊盘 / 接触开路',
    step: 0,
    mode: 'FIMV（加流测压）',
    force: '对 pin–GND 保护二极管加约 100 μA 量级电流',
    good: 'V ≈ 二极管导通压降（硅 PN 结约 0.6–0.7 V 量级）',
    bad: '焊盘开路 → 电流无路可走，V 顶到电压钳位（FI 模式的钳位即判别上界）',
    bin: 'Bin1 · Open/Short（DC 致命类）',
    action: 'fail-stop：立即终止，不进修复，直接淘汰',
    circuit: '针尖–焊盘接触电阻或焊盘本身开路',
    forced: 'I = +100 μA',
    reading: 'V = 1.50 V（顶到钳位）',
    limit: 'V ∈ 0.45 – 0.75 V',
    verdict: 'FAIL',
  },
  {
    id: 'padshort',
    label: '焊盘对地短路',
    step: 0,
    mode: 'FIMV（加流测压）',
    force: '同一接触测试（Contact Test）',
    good: 'V ≈ 二极管导通压降',
    bad: '焊盘对 GND 短路 → V ≈ 0 V（二极管被旁路）',
    bin: 'Bin1 · Open/Short',
    action: 'fail-stop：立即终止',
    circuit: '刻蚀残留 / 金属桥连把焊盘短到地',
    forced: 'I = +100 μA',
    reading: 'V = 0.02 V（被短路拉平）',
    limit: 'V ∈ 0.45 – 0.75 V',
    verdict: 'FAIL',
  },
  {
    id: 'powershort',
    label: 'PowerShort（VDD–VSS 短路）',
    step: 1,
    mode: 'FVMI（加压测流）',
    force: '电源轨加安全电平电压（低于额定 VDD）',
    good: 'I 呈 μA–mA 量级漏电（依器件 spec）',
    bad: 'I 大幅超限 → R = V/I 塌到 Ω 量级（金属/粒子/键合材料挤压桥连 VDD–VSS）',
    bin: 'Bin1/2 · DC 致命类（Power Short）',
    action: 'fail-stop：立即终止，不进修复',
    circuit: '电源网络–地之间被缺陷短接（PowerShort 的物理根因）',
    forced: 'V = 0.5 V（安全电平）',
    reading: 'I = 180 mA（远超限）',
    limit: 'I ≤ 10 mA',
    verdict: 'FAIL',
  },
  {
    id: 'leak',
    label: '输入漏电超标（IIL/IIH）',
    step: 2,
    mode: 'FVMI（加压测流）',
    force: '输入焊盘加 spec 高/低电平',
    good: 'I < 1 μA 量级（漏电 spec 内）',
    bad: '漏电流超 spec → PMU 用 μA 级灵敏量程回测抓出（Marvin Test：漏电常在 μA 级，须用灵敏量程）',
    bin: 'Bin1/2 · Leakage（DC 三件套之三）',
    action: 'fail-stop 或计入 DC 失效类',
    circuit: '栅氧缺陷 / 阱漏电 / 焊盘沾污',
    forced: 'V = VIH（spec 高电平）',
    reading: 'I = 12 μA（灵敏量程抓出）',
    limit: 'I ≤ 1 μA',
    verdict: 'FAIL',
  },
  {
    id: 'func',
    label: '功能位失效（MBiST 图形）',
    step: 3,
    mode: '数字通道（APG 图形 + 失效捕获存储）',
    force: '写 0 读 1 / 写 1 读 0（March 类图形）',
    good: '读出与期望一致',
    bad: 'DC 全过但位图出现坏位 → 按 bank/行/列归因（Synopsys 诊断粒度）',
    bin: 'Bin4 · Function',
    action: '可修 → 冗余替换（激光/e-fuse/PPR）+ 复验；不可修 → 淘汰',
    circuit: '单元电容弱位 / 读出放大失配 / 字线桥连',
    forced: '图形：写 0 → 读 0',
    reading: '读出 1（位图坏位）',
    limit: '读出 = 期望',
    verdict: 'FAIL→REPAIR',
  },
  {
    id: 'tsv',
    label: 'TSV 开路 / lane 失效',
    step: 3,
    mode: 'MBiST + TSV 感测（经 DA 链）',
    force: 'TSV 链连通性/延迟检测 + 图形复测',
    good: '链路延迟与连通在限内',
    bad: 'TSV 开路 → 整列失效（column fail，HBM 最常见失效来源之一，Synopsys）',
    bin: 'Bin4 · Function（lane/TSV 类）',
    action: 'lane repair / TSV repair：JEDEC 标准含坏通道重映射',
    circuit: 'TSV 铜填充空洞 / 减薄露头损伤',
    forced: '链脉冲 + 图形复测',
    reading: '列无响应（整列开路）',
    limit: '连通 + 延迟在限内',
    verdict: 'FAIL→REPAIR',
  },
];

const STEPS = ['① Contact（开路/短路）', '② PowerShort', '③ Leakage / Idd', '④ MBiST 功能 + 修复', '⑤ Margin'];

/** 缺陷形态 + 电流粒子动画 + 表头读数：①施加 → ②路径 → ③读数 → ④判定 */
function CircuitStage({
  defect,
  spec,
  active,
  onSelect,
}: {
  defect: DefectId | null;
  spec: DefectSpec | null;
  active: PartId | null;
  onSelect: (id: PartId | null) => void;
}) {
  const flowing = defect !== null;
  const dots = useRef<THREE.Group>(null!);
  const kShow = useDamp(defect ? 1 : 0, 5);
  useFrame(({ clock }) => {
    if (!dots.current) return;
    dots.current.visible = kShow.current > 0.05;
    const t = clock.getElapsedTime();
    dots.current.children.forEach((c, i) => {
      const m = c as THREE.Mesh;
      const u = (t * 0.5 + i * 0.2) % 1;
      m.position.set(-2.4 + u * 2.4, 0.62 + Math.sin(u * Math.PI) * 0.12, 0.35);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = kShow.current * Math.sin(u * Math.PI);
    });
  });
  return (
    <group>
      {/* PMU 仪表块 */}
      <group position={[-3.3, 0.55, 0]} {...pickProps({ id: 'mPMU', active, onSelect })}>
        <RoundedBox args={[1.7, 1.15, 1.1]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color="#1c2534" metalness={0.4} roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.18, 0.57]}>
          <boxGeometry args={[1.3, 0.4, 0.02]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} />
        </mesh>
        {['VIN DAC', 'ADC', 'CLAMP'].map((t, i) => (
          <Html key={t} position={[-0.45 + i * 0.45, -0.32, 0.6]} center style={{ pointerEvents: 'none' }}>
            <span className="rounded bg-slate-800/90 px-1 py-0.5 font-mono text-[9px] text-cyan-300">{t}</span>
          </Html>
        ))}
      </group>
      {/* ① 施加：PMU 数字表头（读数 + 判定，随选中失效更新） */}
      <Html position={[-3.3, 2.05, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="w-52 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 font-mono text-[10px] leading-relaxed text-slate-100 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-cyan-300">③ 表头 · PMU</span>
            <span className="text-[9px] text-slate-400">示意量级</span>
          </div>
          {spec ? (
            <>
              <div>模式: <span className="text-cyan-300">{spec.mode}</span></div>
              <div>① 强制: <span className="text-amber-300">{spec.forced}</span></div>
              <div>③ 读数: <span className="text-red-300">{spec.reading}</span></div>
              <div>　 限值: <span className="text-emerald-300">{spec.limit}</span></div>
              <div className="mt-1 border-t border-slate-700 pt-1">
                ④ 判定: <span className="font-bold text-red-400">✗ {spec.verdict === 'FAIL' ? 'FAIL' : 'FAIL → 进修复'}</span>
              </div>
              <div className="text-slate-400">{spec.bin}</div>
            </>
          ) : (
            <div className="text-slate-400">在下方选择一种失效类型</div>
          )}
        </div>
      </Html>
      <group position={[-3.3, 0.55, 0]}>
        <Html position={[0, 0.78, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300">① 施加：DAC 设定电压/电流</span>
        </Html>
      </group>

      {/* 针 → 焊盘 */}
      <mesh position={[-1.55, 0.62, 0.35]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.05, 0.9, 8]} />
        <meshStandardMaterial color="#9aa7b8" metalness={0.85} roughness={0.25} />
      </mesh>
      <group {...pickProps({ id: 'mPad', active, onSelect })}>
        <mesh position={[-1.1, 0.42, 0.35]}>
          <cylinderGeometry args={[0.14, 0.14, 0.06, 16]} />
          <meshStandardMaterial color="#d9e2ec" metalness={0.8} roughness={0.25} {...dimMaterial(active !== null && active !== 'mPad', active === 'mPad')} />
        </mesh>
      </group>
      <Html position={[-1.1, -0.42, 0.35]} center style={{ pointerEvents: 'none' }}>
        <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300">② 被测路径：针→焊盘→二极管→轨</span>
      </Html>

      {/* ESD 二极管对：焊盘 → VDD（上轨）/ VSS（下轨） */}
      {[
        { y: 0.78, rot: -Math.PI / 2, id: 'mDiode' as PartId, to: 'VDD' },
        { y: 0.14, rot: Math.PI / 2, id: 'mDiode' as PartId, to: 'VSS' },
      ].map((d, i) => (
        <group key={i} position={[-0.7, d.y, 0.35]} {...pickProps({ id: d.id, active, onSelect })}>
          <mesh rotation={[0, 0, d.rot]}>
            <coneGeometry args={[0.11, 0.26, 4]} />
            <meshStandardMaterial color="#4ade80" metalness={0.25} roughness={0.4} {...dimMaterial(active !== null && active !== 'mDiode', active === 'mDiode')} />
          </mesh>
          <Html position={[0.3, 0, 0]} center style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-emerald-50 px-1 font-mono text-[9px] text-emerald-700 ring-1 ring-emerald-200">{d.to}</span>
          </Html>
        </group>
      ))}
      {/* 上下轨 */}
      <mesh position={[1.2, 0.98, 0.35]} {...pickProps({ id: 'cRail', active, onSelect })}>
        <boxGeometry args={[3.8, 0.07, 0.14]} />
        <meshStandardMaterial color="#e07b39" metalness={0.5} roughness={0.4} {...dimMaterial(active !== null && active !== 'cRail', active === 'cRail')} />
      </mesh>
      <mesh position={[1.2, -0.02, 0.35]} {...pickProps({ id: 'cRail', active, onSelect })}>
        <boxGeometry args={[3.8, 0.07, 0.14]} />
        <meshStandardMaterial color="#3c4658" metalness={0.5} roughness={0.4} {...dimMaterial(active !== null && active !== 'cRail', active === 'cRail')} />
      </mesh>

      {/* DRAM 阵列列 */}
      <group position={[2.5, 0.4, 0.35]} {...pickProps({ id: 'mArray', active, onSelect })}>
        <RoundedBox args={[1.3, 0.9, 1.1]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#2f4a6e" metalness={0.4} roughness={0.4} {...dimMaterial(active !== null && active !== 'mArray', active === 'mArray')} />
        </RoundedBox>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 0.2, -0.35 + i * 0.18]}>
            <boxGeometry args={[1.1, 0.03, 0.05]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      <InfoLabel show position={[2.5, 1.25, 0.35]} text="功能测试对象：DRAM 阵列列（MBiST）" />
      {spec && (
        <Html position={[2.5, -0.45, 0.35]} center style={{ pointerEvents: 'none' }}>
          <span
            className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold text-white shadow ${
              spec.verdict === 'FAIL' ? 'bg-red-600' : 'bg-purple-600'
            }`}
          >
            {spec.verdict === 'FAIL' ? '④ fail-stop 淘汰' : '④ 冗余替换 → 复验'}
          </span>
        </Html>
      )}

      {/* 电流粒子（探针 → 焊盘 → 二极管路径） */}
      <group ref={dots}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshBasicMaterial color="#fbbf24" transparent />
          </mesh>
        ))}
      </group>

      {/* 缺陷标记 */}
      {defect === 'open' && (
        <group position={[-1.28, 0.56, 0.35]}>
          <mesh rotation={[0, 0, 0.8]}>
            <boxGeometry args={[0.34, 0.05, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh rotation={[0, 0, -0.8]}>
            <boxGeometry args={[0.34, 0.05, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <InfoLabel show position={[0, 0.5, 0]} text="接触断开：I ≈ 0，V 顶到钳位" tone="red" />
        </group>
      )}
      {defect === 'padshort' && (
        <mesh position={[-1.1, 0.12, 0.35]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
      )}
      {defect === 'padshort' && <InfoLabel show position={[-1.1, -0.35, 0.35]} text="焊盘–地金属桥：V ≈ 0" tone="red" />}
      {defect === 'powershort' && (
        <group>
          <mesh position={[0.6, 0.48, 0.35]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} emissive="#ef4444" emissiveIntensity={0.45} />
          </mesh>
          <InfoLabel show position={[0.6, -0.4, 0.35]} text="VDD–VSS 间缺陷桥：I 超限，R 塌到 Ω 级" tone="red" />
        </group>
      )}
      {defect === 'leak' && <InfoLabel show position={[-0.7, 1.15, 0.35]} text="漏电路径：μA 级电流被灵敏量程回测抓出" tone="amber" />}
      {defect === 'func' && (
        <group>
          <mesh position={[2.2, 0.62, 0.05]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <InfoLabel show position={[2.5, -0.35, 0.35]} text="位图坏位：行/列归因 → 修复或淘汰" tone="red" />
        </group>
      )}
      {defect === 'tsv' && (
        <group>
          <mesh position={[1.9, 0.62, 0.7]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <InfoLabel show position={[1.9, 1.3, 0.7]} text="TSV 开路 → 整列 column fail" tone="red" />
        </group>
      )}
      {flowing && <InfoLabel show position={[-1.9, 1.35, 0.35]} text="激励以 PMU 为源，沿②路径流动" tone="amber" />}
    </group>
  );
}

function Level3({ defect, spec, active, onSelect }: { defect: DefectId | null; spec: DefectSpec | null; active: PartId | null; onSelect: (id: PartId | null) => void }) {
  return <CircuitStage defect={defect} spec={spec} active={active} onSelect={onSelect} />;
}

/* ═════════════════════════ 页面组件 ═════════════════════════ */

const LEGEND: { color: string; label: string }[] = [
  { color: '#e05656', label: '直接访问（测试专用）' },
  { color: '#c3cad4', label: 'PSWT 铝焊盘' },
  { color: '#d9e2ec', label: 'DFT/牺牲焊盘' },
  { color: '#4ade80', label: 'ESD 保护二极管' },
  { color: '#e3b34c', label: '通讯 IO（背景）' },
];

export default function HBMTestZone3D() {
  const [level, setLevel] = useState<Level>(0);
  const [active, setActive] = useState<PartId | null>(null);
  const [defect, setDefect] = useState<DefectId | null>('open');
  const [exploded, setExploded] = useState(false);
  const explodeRef = useRef(0);
  const info = active ? PART_INFO[active] : null;
  const spec = DEFECTS.find((d) => d.id === defect) ?? null;

  return (
    <figure className="not-prose my-8">
      <div className="h-[520px] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <Canvas camera={{ position: [9, 7.5, 14], fov: 35 }} dpr={[1, 2]}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 10, 6]} intensity={1.5} />
          <directionalLight position={[-6, 4, -6]} intensity={0.4} />
          <ExplodeDriver exploded={exploded} explodeRef={explodeRef} />
          <CameraRig level={level} />
          <OrbitControls makeDefault enablePan={false} minDistance={3.5} maxDistance={26} maxPolarAngle={1.85} target={[0, 2.8, 0]} />
          <ContactShadows position={[0, -0.32, 0]} opacity={0.28} scale={18} blur={2.4} far={6} />
          {level === 0 && <Level0 active={active} onSelect={setActive} explodeRef={explodeRef} />}
          {level === 1 && <Level1 active={active} onSelect={setActive} />}
          {level === 2 && <Level2 active={active} onSelect={setActive} />}
          {level === 3 && <Level3 defect={defect} spec={spec} active={active} onSelect={setActive} />}
        </Canvas>
      </div>

      {/* 级别切换 + 问题栏 */}
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
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        本级问题：<span className="font-medium text-slate-700">{LEVELS[level].question}</span>
      </p>

      {/* L3 失效选择器 + 判定链 */}
      {level === 3 && (
        <div className="mt-3 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">选择失效类型</span>
            {DEFECTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDefect(d.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  defect === d.id ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {spec && (
            <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">① 测量电路怎么加、怎么测</p>
                <p className="mt-1 text-slate-600">
                  模式：<span className="font-mono text-cyan-700">{spec.mode}</span>
                  <br />
                  强制：{spec.force}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">② 读数：好 vs 坏</p>
                <p className="mt-1 text-slate-600">
                  健康：<span className="text-emerald-700">{spec.good}</span>
                  <br />
                  异常：<span className="text-red-700">{spec.bad}</span>
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">③ 程序怎么判、怎么处置</p>
                <p className="mt-1 text-slate-600">
                  判定：{spec.bin}
                  <br />
                  处置：{spec.action}
                </p>
              </div>
            </div>
          )}
          {/* fail-stop 测试程序流 */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium uppercase tracking-widest text-slate-400">fail-stop 流程（先致命后边角）</span>
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  spec && spec.step === i ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s}
              </span>
            ))}
            {spec && <span className="ml-1 text-[11px] text-slate-500">← {spec.label} 在此步被拦截</span>}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            判定链 = 电路设计（焊盘/ESD 二极管/电源轨/MBiST 的物理存在）× 测量电路（PMU 的 FVMI/FIMV + 钳位 + 窗口比较器）× 测试程序（fail-stop 顺序、限值、bin 赋值、修复决策）。
            读数中的「量级」为示意（约 0.6–0.7 V 为硅 PN 结教科书量级）；具体限值随器件 spec 与测试机量程档变化（±2 μA–±50 mA 档位见 ADI MAX9979 / Marvin Test KB）。
          </p>
        </div>
      )}

      {/* 部件说明 */}
      {level !== 3 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {LEGEND.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}

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
            四级下钻：L0 看测试电路在堆栈的物理位置（翻转露出 base die 背面扎针面）→ L1 看版图分区与资源占比 → L2 打开 base die 看 DFT 电路模块 →
            L3 选一种失效，看电压/电流如何被施加、读数如何变成 bin。拖拽旋转、滚轮缩放。
          </p>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-slate-400">
        结构与电路布局均为示意比例；PMU 量程/钳位机制出自 ADI MAX9979 设计笔记与 AD5520 手册、接触测试方法出自 US5365180A、bin 顺序出自 Edusemi-Plus——
        完整来源见笔记《HBM 测试的 3D 结构》来源清单。
      </figcaption>
    </figure>
  );
}
