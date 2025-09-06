import { type Points, type Path } from "./types";
import { euclidean } from "./tsp";

/** Greedy nearest-neighbor starting at index 0 (or randomStart) */
export function greedyPath(points: Points, startIndex = 0): Path {
  const n = points.length;
  if (n === 0) return [];
  const unvisited = new Set<number>();
  for (let i = 0; i < n; i++) unvisited.add(i);
  const path: Path = [];
  let current = startIndex;
  path.push(current);
  unvisited.delete(current);

  while (unvisited.size > 0) {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const idx of unvisited) {
      const d = euclidean(points[current], points[idx]);
      if (d < bestDist) {
        bestDist = d;
        best = idx;
      }
    }
    if (best === null) break;
    path.push(best);
    unvisited.delete(best);
    current = best;
  }
  return path;
}
