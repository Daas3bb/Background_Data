# Split index.html into per-menu HTML files for Figma import.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/export-figma-pages.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Src = Join-Path $Root "index.html"
$OutName = [string]([char]0x5BFC) + [string]([char]0x51FA) + "figma"  # 导出figma
$Out = Join-Path $Root $OutName
$JsonPath = Join-Path $PSScriptRoot "figma-pages.json"

if (-not (Test-Path -LiteralPath $Src)) { throw "index.html not found: $Src" }
if (-not (Test-Path -LiteralPath $JsonPath)) { throw "figma-pages.json not found: $JsonPath" }

$utf8 = New-Object System.Text.UTF8Encoding $false
$html = [System.IO.File]::ReadAllText($Src, $utf8)
if ($html.Length -gt 0 -and [int][char]$html[0] -eq 0xFEFF) { $html = $html.Substring(1) }

$MenuPages = Get-Content -LiteralPath $JsonPath -Encoding UTF8 | ConvertFrom-Json

$styleMatch = [regex]::Match($html, "<style>([\s\S]*?)</style>", "IgnoreCase")
$bodyMatch = [regex]::Match($html, "<body>([\s\S]*?)</body>", "IgnoreCase")
if (-not $styleMatch.Success -or -not $bodyMatch.Success) { throw "Cannot parse style/body" }

$css = $styleMatch.Groups[1].Value
$bodyHtml = $bodyMatch.Groups[1].Value
$scriptMatches = [regex]::Matches($bodyHtml, "<script([^>]*)>([\s\S]*?)</script>", "IgnoreCase")
$echartsTag = '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>'
$js = $null
foreach ($m in $scriptMatches) {
  $attrs = $m.Groups[1].Value
  $content = $m.Groups[2].Value
  if ($attrs -match "echarts") { $echartsTag = $m.Value.Trim() }
  if ($attrs -notmatch "\bsrc\s*=" -and $content -match "renderPage") { $js = $content }
}
if (-not $js) { throw "Inline script with renderPage not found" }

$shell = [regex]::Replace($bodyHtml, "<script[\s\S]*?</script>", "", "IgnoreCase").Trim()
if ($js -notmatch 'initMenu\(\);\s*renderPage\("overview"\);') {
  throw 'Boot code initMenu(); renderPage("overview"); not found'
}

function Get-BootJs([string]$pageId, $expand) {
  $expandArr = @($expand)
  $expandJson = (($expandArr | ForEach-Object { '"' + $_ + '"' }) -join ", ")
  return @"
      // ===== Figma single-page boot =====
      window.__FIGMA_PAGE_ID__ = "$pageId";
      window.__FIGMA_EXPAND__ = [$expandJson];

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
            var label = key === "value" ? "\u7528\u6237\u4EF7\u503C" : "\u7528\u6237\u7559\u5B58";
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
"@
}

if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Recurse -Force }
New-Item -ItemType Directory -Path $Out | Out-Null
$shared = Join-Path $Out "_shared"
New-Item -ItemType Directory -Path $shared | Out-Null
[System.IO.File]::WriteAllText((Join-Path $shared "styles.css"), $css, $utf8)
[System.IO.File]::WriteAllText((Join-Path $shared "app.js"), $js, $utf8)

$count = 0
foreach ($page in $MenuPages) {
  $folderRel = [string]$page.folder -replace "/", [IO.Path]::DirectorySeparatorChar
  $dir = Join-Path $Out $folderRel
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $boot = Get-BootJs -pageId ([string]$page.id) -expand $page.expand
  $patchedJs = [regex]::Replace($js, 'initMenu\(\);\s*renderPage\("overview"\);', $boot.Trim())
  $title = [string]$page.file
  $nl = [Environment]::NewLine
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("<!doctype html>")
  [void]$sb.AppendLine('<html lang="zh-CN">')
  [void]$sb.AppendLine("  <head>")
  [void]$sb.AppendLine('    <meta charset="UTF-8" />')
  [void]$sb.AppendLine('    <meta name="viewport" content="width=device-width, initial-scale=1.0" />')
  [void]$sb.AppendLine("    <title>$title · 数据后台</title>")
  [void]$sb.AppendLine("    <style>")
  [void]$sb.AppendLine($css)
  [void]$sb.AppendLine("      body.figma-export .sidebar { flex-shrink: 0; }")
  [void]$sb.AppendLine("    </style>")
  [void]$sb.AppendLine("  </head>")
  [void]$sb.AppendLine('  <body class="figma-export">')
  [void]$sb.AppendLine($shell)
  [void]$sb.AppendLine("    $echartsTag")
  [void]$sb.AppendLine("    <script>")
  [void]$sb.AppendLine($patchedJs)
  [void]$sb.AppendLine("    </script>")
  [void]$sb.AppendLine("  </body>")
  [void]$sb.AppendLine("</html>")
  $outPath = Join-Path $dir ($title + ".html")
  [System.IO.File]::WriteAllText($outPath, $sb.ToString(), $utf8)
  $count++
  Write-Host ("OK " + $folderRel + "\" + $title + ".html")
}

$readme = New-Object System.Text.StringBuilder
[void]$readme.AppendLine("# 导出figma")
[void]$readme.AppendLine("")
[void]$readme.AppendLine("Generated from index.html by scripts/export-figma-pages.ps1")
[void]$readme.AppendLine("")
[void]$readme.AppendLine("## Regenerate")
[void]$readme.AppendLine("")
[void]$readme.AppendLine('```powershell')
[void]$readme.AppendLine("powershell -ExecutionPolicy Bypass -File scripts/export-figma-pages.ps1")
[void]$readme.AppendLine('```')
[void]$readme.AppendLine("")
[void]$readme.AppendLine("## Pages")
[void]$readme.AppendLine("")
foreach ($page in $MenuPages) {
  $line = "- " + $page.folder + "/" + $page.file + ".html  =>  " + $page.id
  [void]$readme.AppendLine($line)
}
[void]$readme.AppendLine("")
[void]$readme.AppendLine("Each HTML is self-contained. Open in browser (wait for charts) then import to Figma.")
[System.IO.File]::WriteAllText((Join-Path $Out "README.md"), $readme.ToString(), $utf8)

Write-Host ""
Write-Host ("Done: exported $count pages -> $OutName")
