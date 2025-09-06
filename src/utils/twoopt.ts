import { type Points, type Path } from "./types";
import { euclidean, twoOptSwapInPlace } from "./tsp";

/**
 * 2-opt local improvement.
 * Stops when no improving swap is found.
 */
export function twoOpt(points: Points, initialPath: Path): Path {
  const n = initialPath.length;
  if (n <= 3) return initialPath.slice();

  const path = initialPath.slice();
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < n - 2; i++) {
      const aIdx = path[i];
      const bIdx = path[i + 1];
      const a = points[aIdx];
      const b = points[bIdx];
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;

        const cIdx = path[j];
        const dIdx = j + 1 < n ? path[j + 1] : null;
        const c = points[cIdx];
        const d = dIdx !== null ? points[dIdx] : null;

        const before = euclidean(a, b) + (d ? euclidean(c, d) : 0);
        const after = euclidean(a, c) + (d ? euclidean(b, d) : 0);

        if (after + 1e-12 < before) {
          twoOptSwapInPlace(path, i, j);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return path;
}
