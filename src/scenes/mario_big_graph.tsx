import { Circle, Line, makeScene2D, Node } from '@motion-canvas/2d';
import {
  all,
  clamp,
  createRef,
  getImageData,
  sequence,
  useRandom,
  waitFor,
} from '@motion-canvas/core';

import mario_ascii from '../assets/images/mario_ascii.png';
import { Solarized } from '../utilities';
import { MyTxt, Write } from '../utilities_text';

const mario = [
  [3, 3, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3],
  [3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3],
  [3, 3, 0, 0, 0, 1, 1, 0, 1, 3, 3, 3],
  [3, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 3],
  [3, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1],
  [3, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 3],
  [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3, 3],
  [3, 3, 0, 0, 2, 0, 0, 0, 3, 3, 3, 3],
  [3, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 3],
  [0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0],
  [1, 1, 0, 2, 0, 2, 2, 0, 2, 0, 1, 1],
  [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 3, 3],
  [3, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 3],
  [0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0],
];
const R = 16,
  S = 12,
  n = 100,
  m = 100;
// To kill your computer:
//  n = 5000,
//  m = 5000;

function gammaFunction(c: number) {
  return [0, 2, 5, 10][c];
}

function colorAt(r: number, s: number) {
  return gammaFunction(3 - mario[Math.floor(r)][Math.floor(s)]);
}

const minC = gammaFunction(0);
const maxC = gammaFunction(3);

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const random = useRandom();

  const cam = <Node />;
  const G = <Node scale={50} x={-300} y={-400} />;
  view.add(cam);
  cam.add(G);
  const V = <Node />;
  G.add(V);
  while (V.children().length < n) {
    const r = random.nextFloat(0, R);
    const s = random.nextFloat(0, S);
    const c = colorAt(r, s);
    if (random.nextFloat(minC, maxC) > c) continue;
    V.add(<Circle fill={Solarized.gray} x={s} y={r} size={0.06 + (0.03 * c) / maxC} />);
  }

  const its_subsampling = 50;
  const its_avg = 20;

  const E = <Node />;
  G.add(E);
  while (E.children().length < m) {
    const i = random.nextInt(0, n);
    const u = V.children()[i].position();
    //if (random.nextFloat(minC, maxC) > colorAt(u.y, u.x)) continue;
    let minJ: number = undefined;
    let minDist = 10000;
    for (let _ = 0; _ < its_subsampling; _++) {
      const j = random.nextInt(0, n);
      if (i == j) continue;
      const v = V.children()[j].position();
      const dist = u.sub(v).magnitude;
      if (dist < minDist) {
        minDist = dist;
        minJ = j;
      }
    }

    const j = minJ;
    const v = V.children()[j].position();
    let minColor = maxC;
    let avgColor = 0;
    for (let i = 0; i < its_avg; i++) {
      const p = u.add(v.sub(u).mul(i / (its_avg - 1)));
      const c = colorAt(p.y, p.x);
      minColor = Math.min(c, minColor);
      avgColor += c;
    }
    avgColor /= its_avg;
    //if (random.nextFloat(minC, maxC) > minColor) continue;
    E.add(
      <Line
        points={[u, v]}
        lineWidth={0.02 * (minColor / maxC) ** 0.2}
        opacity={0.4 * (minColor / maxC) ** 0.2}
        stroke={Solarized.gray}
      />,
    );
  }

  cam.scale(10);
  yield* all(
    cam.scale(1, 5),
    /*    sequence(
      8 / n,
      ...V.children().map((v) => {
        v.save();
        v.opacity(0);
        return v.restore(0.5);
      }),
    ),
    sequence(
      8 / m,
      ...E.children().map((e: Line) => {
        e.save();
        e.end(0);
        return e.restore(0.5);
      }),
    ),*/
  );
  yield* waitFor(3);
});
