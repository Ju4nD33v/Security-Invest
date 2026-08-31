export function nearestChartPointIndex(pointerX: number, chartLeft: number, chartWidth: number, pointCount: number) {
  if (!Number.isFinite(pointerX) || !Number.isFinite(chartLeft) || !Number.isFinite(chartWidth) || pointCount < 1) return null;
  if (pointCount === 1 || chartWidth <= 0) return 0;
  const progress = Math.min(1, Math.max(0, (pointerX - chartLeft) / chartWidth));
  return Math.round(progress * (pointCount - 1));
}

export function adjacentChartPointIndex(currentIndex: number | null, pointCount: number, direction: -1 | 1) {
  if (pointCount < 1) return null;
  if (currentIndex === null) return direction > 0 ? 0 : pointCount - 1;
  return Math.min(pointCount - 1, Math.max(0, currentIndex + direction));
}

export function ringSegmentIndex(pointerX: number, pointerY: number, left: number, top: number, width: number, height: number, percentages: number[]) {
  if (!percentages.length || width <= 0 || height <= 0) return null;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const angle = (Math.atan2(pointerX - centerX, centerY - pointerY) * 180 / Math.PI + 360) % 360;
  const percentage = angle / 3.6;
  let accumulated = 0;
  for (let index = 0; index < percentages.length; index += 1) {
    accumulated += percentages[index];
    if (percentage <= accumulated) return index;
  }
  return percentages.length - 1;
}
