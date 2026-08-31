/**
 * 从 index.html 拆出单页 HTML 的核心逻辑（供全量 / 指定菜单导出共用）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");
export const SRC = path.join(ROOT, "index.html");
export const PAGES_JSON = path.join(__dirname, "figma-pages.json");

export function loadMenuPages() {
  const raw = fs.readFileSync(PAGES_JSON, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw).map((p) => ({
    folder: p.folder,
    file: p.file,
    id: p.id,
    expand: Array.isArray(p.expand) ? p.expand : [],
  }));
}

export function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

export function extractParts(html) {
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
  if (!styleMatch || !bodyMatch) {
    throw new Error("无法从 index.html 解析 style / body");
  }

  const bodyHtml = bodyMatch[1];
  const scriptTags = [
    ...bodyHtml.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi),
  ];
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

export function patchJsForPage(js, page) {
  const boot = `
      // ===== Figma 单页导出引导 =====
      window.__FIGMA_PAGE_ID__ = ${JSON.stringify(page.id)};
      window.__FIGMA_EXPAND__ = ${JSON.stringify(page.expand || [])};

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

      initMenu();
      applyFigmaPageActiveState(window.__FIGMA_PAGE_ID__);
      renderPage(window.__FIGMA_PAGE_ID__);
`;

  // 兼容中间插入的其它 init 调用（如 initChartZoom），并在导出引导中保留
  const bootRe =
    /initMenu\(\);\s*((?:init\w+\(\);\s*)*)renderPage\("overview"\);/;
  const bootMatch = js.match(bootRe);
  if (!bootMatch) {
    throw new Error('未找到 initMenu(); … renderPage("overview"); 启动代码');
  }
  const extraInits = (bootMatch[1] || "").trim();
  const bootWithExtras = boot.replace(
    "initMenu();\n      applyFigmaPageActiveState(window.__FIGMA_PAGE_ID__);",
    `initMenu();\n      ${extraInits ? extraInits + "\n      " : ""}applyFigmaPageActiveState(window.__FIGMA_PAGE_ID__);`,
  );
  return js.replace(bootRe, bootWithExtras.trim());
}

export function buildHtml({ title, css, shell, echartsTag, js }) {
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

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** 按菜单中文名或 page id 查找；支持模糊包含匹配 */
export function resolvePages(queries, menuPages) {
  const results = [];
  const used = new Set();

  for (const raw of queries) {
    const q = String(raw || "").trim();
    if (!q) continue;

    const exact =
      menuPages.find((p) => p.file === q) ||
      menuPages.find((p) => p.id === q);

    let matched = exact ? [exact] : [];

    if (!matched.length) {
      const lower = q.toLowerCase();
      matched = menuPages.filter(
        (p) =>
          p.file.includes(q) ||
          p.id.toLowerCase().includes(lower) ||
          (p.folder && p.folder.includes(q)),
      );
    }

    if (!matched.length) {
      throw new Error(`未找到菜单：${q}`);
    }

    if (!exact && matched.length > 1) {
      const names = matched.map((p) => `${p.file} (${p.id})`).join("、");
      throw new Error(`「${q}」匹配到多个菜单，请写全名或用 id：${names}`);
    }

    for (const p of matched) {
      if (used.has(p.id)) continue;
      used.add(p.id);
      results.push(p);
    }
  }

  return results;
}

export function exportPages(pages, { outDir, keepFolder = false } = {}) {
  if (!pages.length) throw new Error("没有要导出的页面");

  const html = stripBom(fs.readFileSync(SRC, "utf8"));
  const parts = extractParts(html);
  ensureDir(outDir);

  const written = [];
  for (const page of pages) {
    const dir = keepFolder
      ? path.join(outDir, page.folder.replace(/\//g, path.sep))
      : outDir;
    ensureDir(dir);
    const outHtml = buildHtml({
      title: page.file,
      css: parts.css,
      shell: parts.shell,
      echartsTag: parts.echartsTag,
      js: patchJsForPage(parts.js, page),
    });
    const outPath = path.join(dir, `${page.file}.html`);
    fs.writeFileSync(outPath, outHtml, "utf8");
    written.push(outPath);
  }
  return written;
}
