/**
 * 按菜单名（或 page id）导出为独立 HTML，便于导入 Figma。
 *
 * 用法：
 *   node scripts/export-figma-page.mjs 经营总览
 *   node scripts/export-figma-page.mjs 经营总览 平台收益
 *   node scripts/export-figma-page.mjs --id overview
 *   node scripts/export-figma-page.mjs 用户获取 -o 导出Figma最新
 *   node scripts/export-figma-page.mjs 经营总览 --keep-folder
 *   node scripts/export-figma-page.mjs --list
 */
import path from "path";
import {
  ROOT,
  loadMenuPages,
  resolvePages,
  exportPages,
} from "./figma-export-core.mjs";

const DEFAULT_OUT = "导出Figma最新";

function printHelp() {
  console.log(`按菜单名导出独立 HTML

用法:
  node scripts/export-figma-page.mjs <菜单名|id> [更多...] [选项]

选项:
  -o, --out <目录>     输出目录（默认：${DEFAULT_OUT}）
  --keep-folder        按菜单层级建子目录（如 01-经营总览/经营总览.html）
  --id <id>            按 page id 导出（可多次）
  -l, --list           列出全部可导出菜单
  -h, --help           显示帮助

示例:
  node scripts/export-figma-page.mjs 经营总览
  node scripts/export-figma-page.mjs 经营总览 分时数据对比
  node scripts/export-figma-page.mjs --id life-acquisition -o 导出Figma最新
`);
}

function printList(menuPages) {
  console.log("可导出菜单（名称 → id → 目录）:\n");
  for (const p of menuPages) {
    console.log(`  ${p.file.padEnd(14)}  ${p.id.padEnd(28)}  ${p.folder}`);
  }
  console.log(`\n共 ${menuPages.length} 个`);
}

function parseArgs(argv) {
  const names = [];
  const ids = [];
  let out = DEFAULT_OUT;
  let keepFolder = false;
  let list = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      help = true;
    } else if (a === "-l" || a === "--list") {
      list = true;
    } else if (a === "--keep-folder") {
      keepFolder = true;
    } else if (a === "-o" || a === "--out") {
      out = argv[++i];
      if (!out) throw new Error(`${a} 需要目录参数`);
    } else if (a === "--id") {
      const id = argv[++i];
      if (!id) throw new Error("--id 需要 page id");
      ids.push(id);
    } else if (a.startsWith("-")) {
      throw new Error(`未知选项：${a}`);
    } else {
      names.push(a);
    }
  }

  return { names, ids, out, keepFolder, list, help };
}

function main() {
  const menuPages = loadMenuPages();
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || (!opts.list && !opts.names.length && !opts.ids.length)) {
    printHelp();
    if (!opts.help) process.exitCode = 1;
    return;
  }

  if (opts.list) {
    printList(menuPages);
    return;
  }

  const queries = [...opts.names, ...opts.ids];
  const pages = resolvePages(queries, menuPages);
  const outDir = path.isAbsolute(opts.out)
    ? opts.out
    : path.join(ROOT, opts.out);

  const written = exportPages(pages, {
    outDir,
    keepFolder: opts.keepFolder,
  });

  for (const p of written) {
    console.log("✓", path.relative(ROOT, p));
  }
  console.log(
    `\n完成：导出 ${written.length} 个页面 → ${path.relative(ROOT, outDir) || "."}`,
  );
}

try {
  main();
} catch (err) {
  console.error("错误:", err.message || err);
  process.exitCode = 1;
}
