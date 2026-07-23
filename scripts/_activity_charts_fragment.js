      function renderGameActivityBetPlayerTrend() {
        const dayCount = 30;
        const labels = buildRecentTrendLabels(dayCount);
        const newDau = genTrendSeries(dayCount, 2680, 3260, 180);
        const oldDau = genTrendSeries(dayCount, 8520, 9320, 260);
        newDau[dayCount - 1] = 3260;
        oldDau[dayCount - 1] = 9320;
        const totalDau = newDau.map((v, i) => v + oldDau[i]);
        return renderMultiLineTrendChart({
          labels,
          series: [
            { name: "投注玩家DAU", data: totalDau, color: "#165DFF" },
            { name: "新投注玩家DAU", data: newDau, color: "#14C9C9" },
            { name: "老投注玩家DAU", data: oldDau, color: "#FF7D00" },
          ],
          maxVal: 15000,
          yStep: 3000,
          xLabelStep: 5,
        });
      }

      function renderGameActivityStructureArea() {
        const dayCount = 30;
        const labels = buildRecentTrendLabels(dayCount);
        const newPlayers = genTrendSeries(dayCount, 2680, 3260, 180);
        const oldPlayers = genTrendSeries(dayCount, 8520, 9320, 260);
        newPlayers[dayCount - 1] = 3260;
        oldPlayers[dayCount - 1] = 9320;
        const total = newPlayers.map((v, i) => v + oldPlayers[i]);

        const W = 620,
          H = 260,
          padL = 52,
          padR = 16,
          padT = 20,
          padB = 32;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;
        const maxVal = 15000;
        const n = labels.length;
        const xPos = (i) =>
          padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
        const yPos = (v) => padT + plotH * (1 - v / maxVal);
        const zeroLine = new Array(n).fill(0);

        let grid = "",
          yLabels = "",
          xLabels = "";
        for (let i = 0; i <= 5; i++) {
          const val = (maxVal / 5) * i;
          const y = yPos(val);
          grid += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"></line>`;
          yLabels += `<text class="axis-label" x="${padL - 8}" y="${y + 3}" text-anchor="end">${Math.round(val).toLocaleString("zh-CN")}</text>`;
        }
        labels.forEach((lab, i) => {
          if (i % 5 === 0 || i === n - 1) {
            xLabels += `<text class="axis-label" x="${xPos(i)}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
          }
        });

        const oldArea = buildStackedAreaPath(oldPlayers, zeroLine, xPos, yPos);
        const newArea = buildStackedAreaPath(total, oldPlayers, xPos, yPos);
        const tipPoints = labels.map((_, i) => [
          {
            name: "新增投注玩家",
            color: "#14C9C9",
            x: xPos(i),
            y: yPos(total[i]),
            text: formatChartTipNumber(newPlayers[i]),
          },
          {
            name: "老投注玩家",
            color: "#165DFF",
            x: xPos(i),
            y: yPos(oldPlayers[i] / 2),
            text: formatChartTipNumber(oldPlayers[i]),
          },
        ]);

        return `
        ${renderComboChartWithTip(
          `${grid}
            <path d="${oldArea}" fill="#165DFF" fill-opacity="0.55"></path>
            <path d="${newArea}" fill="#14C9C9" fill-opacity="0.55"></path>
            ${yLabels}${xLabels}`,
          {
            labels,
            points: tipPoints,
            layout: { W, H, padL, padR, padT, padB, xMode: "spread" },
          },
        )}
        <div class="line-legend">
          <span><i style="background:#14C9C9"></i>新增投注玩家</span>
          <span><i style="background:#165DFF"></i>老投注玩家</span>
        </div>`;
      }

      function renderGameActivityCharts() {
        return `
        <div class="game-metric-charts" id="gameActivityCharts">
          ${renderGameMetricChartCard(
            "bet-trend",
            "投注玩家趋势",
            "投注玩家DAU，新投注玩家DAU，老投注玩家DAU",
            "近30日投注玩家DAU / 新投注玩家DAU / 老投注玩家DAU 变化",
            renderGameActivityBetPlayerTrend(),
          )}
          ${renderGameMetricChartCard(
            "bet-structure",
            "投注用户结构",
            "新增投注玩家，老投注玩家",
            "堆叠面积图：新增投注玩家与老投注玩家构成",
            renderGameActivityStructureArea(),
          )}
        </div>`;
      }
