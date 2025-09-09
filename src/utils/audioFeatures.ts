import type { Point, Points } from "./types";

export async function getFeatures(data: string[]) {
  const headers = new Headers();
  headers.append("Accept", "application/json");

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow" as RequestRedirect,
  };

  const batchSize = 40;
  const allFeatures = [];

  // Split data into batches and fetch
  const promises = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    promises.push(
      fetch(
        `https://api.reccobeats.com/v1/audio-features?ids=${batch.join(",")}`,
        requestOptions
      ).then((response) => response.json())
    );
  }
  const results = await Promise.all(promises);
  for (const result of results) {
    allFeatures.push(...result.content);
  }

  const urlPrefix = "https://open.spotify.com/track/";
  const map = new Map(data.map((d, i) => [d, i]));
  const points: Points = new Array(data.length);

  for (const f of allFeatures) {
    const index = map.get(f.href.slice(urlPrefix.length));
    if (index === undefined) continue;
    points[index] = new Float32Array([
      f.acousticness ?? 0.5,
      f.danceability ?? 0.5,
      f.energy ?? 0.5,
      f.instrumentalness ?? 0.5,
      f.liveliness ?? 0.5,
      f.speechiness ?? 0.5,
      f.valence ?? 0.5,
      f.energy ?? 0.5,
    ]);
  }
  const avg = averagePoint(points);
  // fill in missing points with average
  for (let i = 0; i < points.length; i++) {
    if (!points[i]) {
      points[i] = new Float32Array(avg);
    }
  }

  return points;
}

function averagePoint(points: Points): Point {
  let sums: Point = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  let totalCounted = 0;
  for (const p of points) {
    if (!p) continue;
    for (let i = 0; i < p.length; i++) {
      sums[i] += p[i];
    }
    totalCounted++;
  }
  const avg = new Float32Array(sums.map((s) => s / totalCounted));
  return avg;
}
