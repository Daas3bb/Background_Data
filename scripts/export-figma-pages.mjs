/**
 * 将 index.html 按侧边栏菜单拆成独立 HTML（按文件夹分组），便于导入 Figma。
 * 用法：node scripts/export-figma-pages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "index.html");
const OUT = path.join(ROOT, "导出figma");

/** 与侧边栏一致的叶子菜单 */
const MENU_PAGES = [
  {
    folder: "01-经营总览",
    file: "经营总览",
    id: "overview",
    group: null,
    expand: [],
  },
  {
    folder: "02-分时数据对比",
    file: "分时数据对比",
    id: "realtime-compare",
    group: null,
    expand: [],
  },
  {
    folder: "03-用户生命周期",
    file: "用户获取",
    id: "life-acquisition",
    group: "lifecycle",
    expand: ["lifecycle"],
  },
  {
    folder: "03-用户生命周期",
    file: "用户激活",
    id: "life-activation",
    group: "lifecycle",
    expand: ["lifecycle"],
  },
  {
    folder: "03-用户生命周期",
    file: "用户转化",
    id: "life-conversion",
    group: "lifecycle",
    expand: ["lifecycle"],
  },
  {
    folder: "03-用户生命周期/用户价值",
    file: "整体价值",
    id: "life-value-overall",
    group: "lifecycle",
    expand: ["lifecycle", "value"],
  },
  {
    folder: "03-用户生命周期/用户价值",
    file: "新用户价值",
    id: "life-value-new",
    group: "lifecycle",
    expand: ["lifecycle", "value"],
  },
  {
    folder: "03-用户生命周期/用户价值",
    file: "新用户LTV",
    id: "life-value-new-ltv",
    group: "lifecycle",
    expand: ["lifecycle", "value"],
  },
  {
    folder: "03-用户生命周期/用户价值",
    file: "老用户价值",
    id: "life-value-old",
    group: "lifecycle",
    expand: ["lifecycle", "value"],
  },
  {
    folder: "03-用户生命周期/用户价值",
    file: "老用户LTV",
    id: "life-value-old-ltv",
    group: "lifecycle",
    expand: ["lifecycle", "value"],
  },
  {
    folder: "03-用户生命周期/用户留存",
    file: "用户活跃",
    id: "life-retention-active",
    group: "lifecycle",
    expand: ["lifecycle", "retention"],
  },
  {
    folder: "03-用户生命周期/用户留存",
    file: "用户留存",
    id: "life-retention-user",
    group: "lifecycle",
    expand: ["lifecycle", "retention"],
  },
  {
    folder: "03-用户生命周期/用户留存",
    file: "充值留存",
    id: "life-retention-recharge",
    group: "lifecycle",
    expand: ["lifecycle", "retention"],
  },
  {
    folder: "03-用户生命周期",
    file: "用户生命周期趋势",
    id: "life-trend",
    group: "lifecycle",
    expand: ["lifecycle"],
  },
  {
    folder: "04-应用分析",
    file: "页面访问路径",
    id: "app-page-path",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "功能参与度",
    id: "app-feature-engagement",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "应用页面体验",
    id: "app-page-experience",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "应用使用时长",
    id: "app-usage-duration",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "应用使用频率",
    id: "app-usage-frequency",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "流失页面分析",
    id: "app-churn-page",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "04-应用分析",
    file: "用户具体行为分析",
    id: "app-user-path",
    group: "app-analysis",
    expand: ["app-analysis"],
  },
  {
    folder: "05-游戏运营",
    file: "游戏运营",
    id: "game-operation",
    group: null,
    expand: [],
  },
  {
    folder: "06-游戏分析",
    file: "投注玩家活跃分析",
    id: "game-activity",
    group: "game-analysis",
    expand: ["game-analysis"],
  },
  {
    folder: "06-游戏分析",
    file: "投注参与度",
    id: "game-participation",
    group: "game-analysis",
    expand: ["game-analysis"],
  },
  {
    folder: "06-游戏分析",
    file: "投注用户停留分析",
    id: "game-stay",
    group: "game-analysis",
    expand: ["game-analysis"],
  },
  {
    folder: "06-游戏分析",
    file: "投注报表",
    id: "bet-report",
    group: "game-analysis",
    expand: ["game-analysis"],
  },
  {
    folder: "06-游戏分析",
    file: "游戏价值",
    id: "game-value",
    group: "game-analysis",
    expand: ["game-analysis"],
  },
  {
    folder: "07-盈利分析",
    file: "平台收益",
    id: "profit-platform",
    group: "profit",
    expand: ["profit"],
  },
  {
    folder: "07-盈利分析",
    file: "用户盈利贡献",
    id: "profit-user",
    group: "profit",
    expand: ["profit"],
  },
  {
    folder: "07-盈利分析",
    file: "游戏盈利效率",
    id: "profit-game",
    group: "profit",
    expand: ["profit"],
  },
  {
    folder: "08-资金安全",
    file: "资金规模监控",
    id: "fund-scale",
    group: "fund",
    expand: ["fund"],
  },
  {
    folder: "08-资金安全",
    file: "资金流动监控",
    id: "fund-flow",
    group: "fund",
    expand: ["fund"],
  },
  {
    folder: "08-资金安全",
    file: "提现风险监控",
    id: "fund-risk",
    group: "fund",
    expand: ["fund"],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function extractParts(html) {
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
  if (!styleMatch || !bodyMatch) {
    throw new Error("无法从 index.html 解析 style / body");
  }

  const bodyHtml = bodyMatch[1];
  const scriptTags = [...bodyHtml.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (!scriptTags.length) {
    throw new Error("无法从 index.html 解析 script");
  }

  const echartsTag =
    scriptTags.find((m) => /echarts/i.test(m[0]))?.[0]?.trim() ||
    `<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>`;

  const inline = [...scriptTags].reverse().find((m) => {
    const attrs = m[1] || "";
    return !/\bsrc\s*=/.test(attrs) && (m[2] || "").includes("renderPage");
  });
  if (!inline) {
    throw new Error("无法找到包含 renderPage 的内联 script");
  }

  const shell = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

  return {
    css: styleMatch[1],
    shell,
    echartsTag,
    js: inline[2],
  };
}

function patchJsForPage(js, page) {
  const boot = `
      // ===== Figma 单页导出引导 =====
      window.__FIGMA_PAGE_ID__ = ${JSON.stringify(page.id)};
      window.__FIGMA_EXPAND__ = ${JSON.stringify(page.expand)};

      function applyFigmaPageActiveState(pageId) {
        document.querySelectorAll(".menu-top, .menu-child, .menu-grandchild").forEach(function (el) {
          el.classList.remove("active");
        });
        document.querySelectorAll(".menu-group, .menu-sub-group").forEach(function (el) {
          el.classList.remove("expanded");
        });

        (window.__FIGMA_EXPAND__ || []).forEach(function (key) {
          if (key === "lifecycle" || key === "app-analysis" || key === "game-analysis" || key === "profit" || key === "fund") {
            var g = document.querySelector('.menu-group[data-group="' + key + '"]');
            if (g) g.classList.add("expanded");
          } else if (key === "value" || key === "retention") {
            var label = key === "value" ? "用户价值" : "用户留存";
            document.querySelectorAll('.menu-group[data-group="lifecycle"] .menu-sub-group').forEach(function (sg) {
              if ((sg.textContent || "").indexOf(label) !== -1) sg.classList.add("expanded");
            });
          }
        });

        var target =
          document.querySelector('.menu-grandchild[data-page="' + pageId + '"]') ||
          document.querySelector('.menu-child[data-page="' + pageId + '"]') ||
          document.querySelector('.menu-top[data-page="' + pageId + '"]');
        if (!target) return;
        target.classList.add("active");
        var group = target.closest(".menu-group");
        if (group) group.classList.add("expanded");
        var sub = target.closest(".menu-sub-group");
        if (sub) sub.classList.add("expanded");
        var top = group && group.querySelector(".menu-top");
        if (top && !top.dataset.page) top.classList.add("active");
      }

      // 初始化（单页模式）
      initMenu();
      applyFigmaPageActiveState(window.__FIGMA_PAGE_ID__);
      renderPage(window.__FIGMA_PAGE_ID__);
`;

  if (!/initMenu\(\);\s*renderPage\("overview"\);/.test(js)) {
    throw new Error('未找到 initMenu(); renderPage("overview"); 启动代码');
  }
  return js.replace(
    /initMenu\(\);\s*renderPage\("overview"\);/,
    boot.trim(),
  );
}

function buildHtml({ title, css, shell, echartsTag, js }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} · 数据后台</title>
    <style>
${css}
      /* Figma 导出：固定侧栏展开态可读性 */
      body.figma-export .sidebar { flex-shrink: 0; }
    </style>
  </head>
  <body class="figma-export">
${shell}
    ${echartsTag}
    <script>
${js}
    </script>
  </body>
</html>
`;
}

function writeReadme() {
  const lines = [
    "# 导出figma — 按菜单拆分的独立 HTML",
    "",
    "由 `scripts/export-figma-pages.mjs` 从根目录 `index.html` 自动生成。",
    "",
    "## 用途",
    "- 每个叶子菜单对应一个独立 HTML，按一级/二级菜单文件夹归类",
    "- 便于用 html.to.design / Anima / 浏览器打开后导入 Figma",
    "",
    "## 重新生成",
    "```bash",
    "node scripts/export-figma-pages.mjs",
    "```",
    "",
    "## 菜单对照",
    ...MENU_PAGES.map(
      (p) => `- \`${p.folder}/${p.file}.html\` ← \`${p.id}\``,
    ),
    "",
    "## 说明",
    "- 每个 HTML 为自包含文件（内联 CSS/JS），打开即可渲染该菜单页",
    "- 图表依赖 ECharts CDN，导入 Figma 前请先在浏览器打开并等待渲染完成",
    "- 请勿手改本目录；改完 `index.html` 后重新跑导出脚本",
    "",
  ];
  fs.writeFileSync(path.join(OUT, "README.md"), lines.join("\n"), "utf8");
}

function main() {
  const html = stripBom(fs.readFileSync(SRC, "utf8"));
  const parts = extractParts(html);

  if (fs.existsSync(OUT)) {
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  ensureDir(OUT);

  // 可选：抽出共享资源，便于对照源码（页面仍自包含）
  const sharedDir = path.join(OUT, "_shared");
  ensureDir(sharedDir);
  fs.writeFileSync(path.join(sharedDir, "styles.css"), parts.css, "utf8");
  fs.writeFileSync(path.join(sharedDir, "app.js"), parts.js, "utf8");

  let count = 0;
  for (const page of MENU_PAGES) {
    const dir = path.join(OUT, page.folder);
    ensureDir(dir);
    const patchedJs = patchJsForPage(parts.js, page);
    const outHtml = buildHtml({
      title: page.file,
      css: parts.css,
      shell: parts.shell,
      echartsTag: parts.echartsTag,
      js: patchedJs,
    });
    const outPath = path.join(dir, `${page.file}.html`);
    fs.writeFileSync(outPath, outHtml, "utf8");
    count += 1;
    console.log("✓", path.relative(ROOT, outPath));
  }

  writeReadme();
  console.log(`\n完成：共导出 ${count} 个页面 → ${path.relative(ROOT, OUT)}`);
}

main();
