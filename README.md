# more-than-moore

先进封装学习笔记。以 Markdown 记录 HBM、2.5D/3D 集成、Chiplet、TSV、混合键合的学习过程；重点主题用交互式可视化与精排 HTML 报告展开。

## 内容结构

- `src/content/notes/` — Markdown 学习笔记（内容真源）
- `public/reports/` — 精排 HTML 报告（独立排版页面）
- `public/sources/` — 笔记引用的厂商新闻稿 / 行业媒体原文摘录归档

## 技术栈

Astro 7 + Tailwind CSS 4 + React Three Fiber（3D 封装剖面模型）+ KaTeX（公式）+ Mermaid（流程图）+ Pagefind（静态站内搜索）。

## 本地运行

```bash
bun install
bun run dev        # 开发服务器
bun run build      # 构建到 dist/ 并生成 Pagefind 索引
bun run preview    # 预览构建产物（搜索在此模式下可用）
```

## 部署

Cloudflare Pages：构建命令 `bun run build`，输出目录 `dist`。
