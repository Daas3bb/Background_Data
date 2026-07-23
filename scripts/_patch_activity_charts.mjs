import fs from "fs";

const htmlPath = new URL("../index.html", import.meta.url);
const fragPath = new URL("./_activity_charts_fragment.js", import.meta.url);
const text = fs.readFileSync(htmlPath, "utf8");
const frag = fs.readFileSync(fragPath, "utf8");
const start = text.indexOf("      function renderGameActivityDauTrend() {");
const end = text.indexOf("      function renderGameParticipationDauBetChart() {");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}
fs.writeFileSync(htmlPath, text.slice(0, start) + frag + text.slice(end), "utf8");
console.log("ok", start, end);
