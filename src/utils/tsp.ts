import { type Point, type Points, type Path } from "./types";

export function euclidean(a: Point, b: Point): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export function pathLength(points: Points, path: Path): number {
  if (path.length <= 1) return 0;
  let total = 0;
  console.assert(path.length === points.length);
  for (let i = 0; i < path.length - 1; i++) {
    total += euclidean(points[path[i]], points[path[i + 1]]);
  }
  return total;
}

export function twoOptSwapInPlace(path: Path, i: number, j: number): void {
  // reverse path[i+1 .. j]
  let a = i + 1,
    b = j;
  while (a < b) {
    const tmp = path[a];
    path[a] = path[b];
    path[b] = tmp;
    a++;
    b--;
  }
}
