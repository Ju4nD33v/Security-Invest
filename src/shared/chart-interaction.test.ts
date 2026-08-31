import { describe, expect, it } from "vitest";
import { adjacentChartPointIndex, nearestChartPointIndex, ringSegmentIndex } from "@/src/shared/chart-interaction";

describe("chart interaction helpers", () => {
  it("selects the nearest line point and clamps the pointer to the chart", () => {
    expect(nearestChartPointIndex(150, 100, 200, 5)).toBe(1);
    expect(nearestChartPointIndex(20, 100, 200, 5)).toBe(0);
    expect(nearestChartPointIndex(400, 100, 200, 5)).toBe(4);
  });

  it("moves keyboard selection without leaving the series", () => {
    expect(adjacentChartPointIndex(null, 4, 1)).toBe(0);
    expect(adjacentChartPointIndex(3, 4, 1)).toBe(3);
    expect(adjacentChartPointIndex(0, 4, -1)).toBe(0);
  });

  it("maps positions around a ring to their allocation segment", () => {
    const segments = [48, 32, 20];
    expect(ringSegmentIndex(50, 0, 0, 0, 100, 100, segments)).toBe(0);
    expect(ringSegmentIndex(100, 50, 0, 0, 100, 100, segments)).toBe(0);
    expect(ringSegmentIndex(50, 100, 0, 0, 100, 100, segments)).toBe(1);
    expect(ringSegmentIndex(0, 0, 0, 0, 100, 100, segments)).toBe(2);
  });
});
