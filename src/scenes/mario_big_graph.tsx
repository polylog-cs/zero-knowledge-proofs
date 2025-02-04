import { Circle, Line, makeScene2D, Node } from '@motion-canvas/2d';
import {
  all,
  clamp,
  Color,
  createRef,
  delay,
  easeInCubic,
  easeInQuad,
  easeOutBounce,
  easeOutElastic,
  getImageData,
  PlaybackState,
  sequence,
  useRandom,
  waitFor,
} from '@motion-canvas/core';

import mario_ascii from '../assets/images/mario_ascii.png';
import { Solarized } from '../utilities';
import { MyTxt, Write } from '../utilities_text';

function invertIncreasing(fn, x) {
  let l = 0,
    r = 1;
  for (let i = 0; i < 20; i++) {
    let m = (l + r) / 2;
    if (fn(m) < x) l = m;
    else r = m;
  }
  return (l + r) / 2;
}

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
const colors = ['white', Solarized.red, Solarized.yellow, Solarized.base03];
const R = 16,
  S = 12;

function gammaFunction(c: number) {
  return [0, 2, 5, 10][c];
}

function colorAt(r: number, s: number, gamma: boolean = true) {
  const raw = 3 - mario[Math.floor(r)][Math.floor(s)];
  return gamma ? gammaFunction(raw) : raw;
}

const minC = gammaFunction(0);
const maxC = gammaFunction(3);

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const random = useRandom();
  let n = 1000,
    m = 300;
  // To kill your computer:
  //  n = 5000,
  //  m = 5000;
  if (view.playbackState() == PlaybackState.Rendering) {
    n = 5000;
    m = 10000;
  }

  const cam = <Node />;
  const G = <Node scale={50} x={-300} y={-400} />;
  view.add(cam);
  cam.add(G);
  const V = <Node />;
  G.add(V);
  while (V.children().length < n) {
    let r = random.nextFloat(0, R);
    let s = random.nextFloat(0, S);
    if (V.children().length == 0) {
      r = R / 2;
      s = S / 2;
    }
    const c = colorAt(r, s);
    let raw = colorAt(r, s, false);
    if (random.nextFloat(minC, maxC) > c) continue;
    V.add(<Circle fill={Solarized.gray} x={s} y={r} size={0.06 + (0.03 * c) / maxC} />);
    if (random.nextFloat(0, 1) < 0.7) raw = random.nextInt(1, 4);
    V.children()[V.children().length - 1].color = colors[raw];
  }

  const its_subsampling = 50;
  const its_avg = 20;

  const E = <Node />;
  G.add(E);
  while (E.children().length < m) {
    const i = random.nextInt(0, n - 1);
    const u = V.children()[i].position();
    //if (random.nextFloat(minC, maxC) > colorAt(u.y, u.x)) continue;
    let minJ: number = undefined;
    let minDist = 10000;
    for (let _ = 0; _ < its_subsampling; _++) {
      const j = random.nextInt(i, n);
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
    E.children()[E.children().length - 1].color = new Color(V.children()[i].color).mix(
      V.children()[j].color,
      0.5,
    );
    E.children()[E.children().length - 1].i = i;
    E.children()[E.children().length - 1].j = j;
  }

  const ithDelay = (i: number) => invertIncreasing(easeInCubic, i / n) * 6;
  cam.scale(30);
  yield* all(
    cam.scale(1.2, 8),
    all(
      ...V.children().map((v, i) => {
        let old = v.scale();
        return delay(ithDelay(i), v.scale(0).scale(old, 1, easeOutElastic));
      }),
    ),
    all(
      ...E.children().map((e: Line, i) => {
        let old = e.opacity();
        e.end(0).opacity(0);
        return delay(
          Math.max(ithDelay(e.i) + 0.5, ithDelay(e.j) - 0.5),
          all(e.opacity(old, 1), e.end(1, 1.5)),
        );
      }),
    ),
  );
  yield* all(
    sequence(1 / n, ...V.children().map((v: Circle) => v.fill(v.color, 0.5))),
    sequence(1 / m, ...E.children().map((e: Line) => e.stroke(e.color, 0.5))),
  );
  yield* waitFor(2);
});
