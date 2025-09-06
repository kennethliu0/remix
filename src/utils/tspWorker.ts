import type { Points, Path } from "./types";
import { greedyPath } from "./greedy";
import { twoOpt } from "./twoopt";
import { getFeatures } from "./audioFeatures";
import { pathLength } from "./tsp";

self.onmessage = async (ev: MessageEvent<string[]>) => {
  const songs: string[] = ev.data;
  const points: Points = await getFeatures(songs);
  // convert to Float32Array points
  console.log(
    `Initial average distance: ${
      pathLength(
        points,
        // [0, 1, 2, 3, ... points.length - 1]
        Array.from({ length: points.length }, (_, i) => i)
      ) /
      (points.length - 1)
    }`
  ); // distances);
  let path: Path = greedyPath(points);
  path = twoOpt(points, path);
  // send back indices (path)
  console.log(
    `Final average distance: ${pathLength(points, path) / (points.length - 1)}`
  );
  (self as any).postMessage(path.map((i) => songs[i]));
};
