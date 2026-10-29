'use strict';

function desktopLayout(displays, selected, gameMode) {
  const active = gameMode ? [selected] : displays;
  const x = Math.min(...active.map(d => d.workArea.x));
  const y = Math.min(...active.map(d => d.workArea.y));
  const right = Math.max(...active.map(d => d.workArea.x + d.workArea.width));
  const bottom = Math.max(...active.map(d => d.workArea.y + d.workArea.height));
  return { bounds: { x, y, width: right - x, height: bottom - y },
    areas: active.map(d => ({ id: d.id, x: d.workArea.x - x, y: d.workArea.y - y,
      w: d.workArea.width, h: d.workArea.height })) };
}

module.exports = { desktopLayout };
