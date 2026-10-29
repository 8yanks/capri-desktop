// Window geometry only; no screen capture or game process injection.
export function protectsGame(data, view, previous = false) {
  const front = data.wins.find(w => w.id === data.fg);
  if (front?.kind === 'capri') return previous;
  if (!front) return false;
  const fullscreen = front.x <= 3 && front.y <= 3
    && front.x + front.w >= view.w - 3 && front.y + front.h >= view.h - 3;
  return front.kind === 'game' || fullscreen;
}

export function edgePosition(at, view, scale) {
  const inset = Math.min(view.w * .18, 150 * scale + 30);
  return { x: at.x < view.w / 2 ? inset : view.w - inset,
    y: Math.max(Math.min(440 * scale, view.h - 6), Math.min(view.h - 6, at.y)) };
}
