# more-than-moore

HBM 先进封装-3D 封装学习笔记。以 Markdown 记录 HBM 3D 堆叠（TSV、micro-bump、MR-MUF/TC-NCF/混合键合、KGD/KGSD）的学习过程；2.5D/bridge 作为堆栈的宿主环境保留最小语境；重点主题用交互式可视化与精排 HTML 报告展开。

## 内容结构

- `src/content/notes/` — Markdown 学习笔记（内容真源）
- `public/reports/` — 精排 HTML 报告（独立排版页面）
- `public/sources/` — 笔记引用的厂商新闻稿 / 行业媒体原文摘录归档（`hbm-3d/` 为 2026-09-25 聚焦调整后的新增收集）
- 材料总目录：《材料地图》（`src/content/notes/hbm/materials-map-3d.md`），全部来源带真实链接与抓取日期

## 技术栈

Astro 7 + Tailwind CSS 4 + React Three Fiber（HBM 堆叠 3D 剖面模型）+ KaTeX（公式）+ Mermaid（流程图）+ Pagefind（静态站内搜索）。

## 本地运行

```bash
bun install
bun run dev        # 开发服务器
bun run build      # 构建到 dist/ 并生成 Pagefind 索引
bun run preview    # 预览构建产物（搜索在此模式下可用）
```

## 部署

Cloudflare Pages：构建命令 `bun run build`，输出目录 `dist`。
