import {
  Circle,
  Img,
  Layout,
  makeScene2D,
  Node,
  Rect,
  Spline,
} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInExpo,
  easeInOutExpo,
  easeOutBounce,
  easeOutQuad,
  linear,
  loop,
  Reference,
  useLogger,
  useRandom,
  Vector2,
  waitFor,
} from '@motion-canvas/core';
import { clamp } from '@motion-canvas/ui';
import chroma from 'chroma-js';

import super_mario_bros_logo_alpha from '../assets/images/super_mario_bros_logo.svg';
import block from '../assets/SMB/block.png';
import cloud_big from '../assets/SMB/cloud_big.png';
import cloud_small from '../assets/SMB/cloud_small.png';
import mario_jump from '../assets/SMB/jump.png';
import mario_run_1 from '../assets/SMB/run1.png';
import mario_run_2 from '../assets/SMB/run2.png';
import mario_run_3 from '../assets/SMB/run3.png';
import mario_run_4 from '../assets/SMB/run4.png';
import gradientShader from '../shaders/gradient2.glsl';
import { Solarized } from '../utilities';
import { MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  const image = createRef<Img>();
  const imageCircle = createRef<Circle>();
  const clouds = createRef<Node>();
  const layout = createRef<Layout>();

  const mixSignal = createSignal<number>(0.0);
  const distFactor = createSignal<number>(1);

  const bgRect = createRef<Rect>();

  view.fill(Solarized.base2);

  view.add(
    <>
      <Rect
        ref={bgRect}
        width={view.width}
        height={view.height}
        fill={Solarized.blue}
        shaders={{
          fragment: gradientShader,
          uniforms: {
            mixColor: chroma(Solarized.base2)
              .rgba()
              .map((i) => i / 256),
            // mixColor: [0.5, 0, 0, 0],
            mixStrength: mixSignal,
            distFactor: distFactor,
            position: () => image().position(),
          },
        }}
      />
      <Node ref={clouds}>
        <Img src={cloud_big} height={200} x={400} y={-200} smoothing={false} />
        <Img src={cloud_small} height={200} x={-400} y={-300} smoothing={false} />
      </Node>
      <Img
        x={-1100}
        ref={image}
        size={160}
        src={mario_run_1}
        smoothing={false}
        shadowColor={'black'}
        shadowBlur={5}
      />
      <Layout
        ref={layout}
        layout
        top={() => new Vector2(0, 160 / 2)}
        width={160 * 13}
        wrap={'wrap'}
      >
        {Array.from({ length: 13 * 3 }).map(() => (
          <Img src={block} smoothing={false} size={160} />
        ))}
      </Layout>
      <Circle
        ref={imageCircle}
        fill={Solarized.red}
        size={160}
        // lineWidth={10}
        stroke={Solarized.base02}
        position={image().position}
        opacity={() => 1 - image().opacity()}
      />
    </>,
  );

  yield* all(
    loop(3, () =>
      image()
        .src(mario_run_2, 0.15)
        .to(mario_run_3, 0.15)
        .to(mario_run_4, 0.15)
        .to(mario_run_3, 0.15),
    ),
    image().position(new Vector2(0, 0), 2, linear),
  );

  image().src(mario_run_1);

  yield* waitFor(0.5);

  imageCircle().filters.blur(10);

  const colors = [Solarized.red, Solarized.green, Solarized.blue];
  const vertices = [];

  let n = 800;
  let m = 800;

  let random = useRandom(0xbadc0ffee);
  let logger = useLogger();

  let zoomOutFactor = 10;
  let duration = 3;

  let vertexAppearAnimations = [];
  let vertexRefs: Reference<Circle>[] = [imageCircle];

  for (let i = 0; i < n - 1; i++) {
    let bestPosition = null;
    let bestMinDistance = -Infinity;

    for (let j = 0; j < 3; j++) {
      // Sample k=5 positions
      const x =
        random.nextFloat(-1, 1) * (view.width() - view.width() / 2) * zoomOutFactor;
      const y =
        random.nextFloat(-1, 1) * (view.height() - view.height() / 2) * zoomOutFactor;
      const candidatePosition = new Vector2(x, y);

      // Compute minimum distance to existing vertices
      let minDistance = Infinity;
      for (const ref of vertexRefs) {
        const existingPos = ref().position();
        const dist = candidatePosition.sub(existingPos).magnitude;
        minDistance = Math.min(minDistance, dist);
      }

      // Keep the best position with the maximum minimum distance
      if (minDistance > bestMinDistance) {
        bestMinDistance = minDistance;
        bestPosition = candidatePosition;
      }
    }

    const color = colors[Math.floor(random.nextFloat(0, 1) * colors.length)];

    let ref = createRef<Circle>();

    view.add(
      <Circle
        ref={ref}
        fill={color}
        size={160 * random.nextFloat(0.8, 1.2)}
        // lineWidth={10}
        stroke={Solarized.base02}
        position={bestPosition}
        scale={0}
      />,
    );

    vertexRefs.push(ref);
    vertexAppearAnimations.push(
      delay((i / n) * duration, ref().scale(1, 1, easeOutBounce)),
    );
  }

  // for (let i = 0; i < n; i++) {
  //   const x =
  //     random.nextFloat(-1, 1) * (view.width() - view.width() / 2) * zoomOutFactor;
  //   const y =
  //     random.nextFloat(-1, 1) * (view.height() - view.height() / 2) * zoomOutFactor;

  //   const color = colors[Math.floor(random.nextFloat(0, 1) * colors.length)];

  //   let ref = createRef<Circle>();

  //   view.add(
  //     <Circle
  //       ref={ref}
  //       fill={color}
  //       size={160 * random.nextFloat(0.8, 1.2)}
  //       lineWidth={10}
  //       stroke={Solarized.base02}
  //       position={new Vector2(x, y)}
  //       scale={0}
  //     />,
  //   );

  //   vertexRefs.push(ref);
  //   vertexAppearAnimations.push(
  //     delay((i / n) * duration, ref().scale(1, 1, easeOutBounce)),
  //   );
  // }

  let edgeAppearAnimations = [];

  const edges: Set<string> = new Set();

  for (let i = 0; i < m; i++) {
    let from: number, to: number, edgeKey: string;
    let min_dist = Infinity;

    from = i;

    if (from >= n) {
      from = random.nextInt(0, clamp(0, vertexRefs.length, i + 2));
    }

    for (let j = 0; j < 1000; j++) {
      let t: number;
      let f = from;

      do {
        t = random.nextInt(0, clamp(0, vertexRefs.length, i + 2));

        edgeKey = f < t ? `${f}-${t}` : `${t}-${f}`; // Ensure uniqueness
      } while (f === t || edges.has(edgeKey));

      let dist = vertexRefs[f]().position().sub(vertexRefs[t]().position()).magnitude;

      if (min_dist > dist) {
        min_dist = dist;
        from = f;
        to = t;
      }
    }

    if (min_dist > 1000) {
      continue;
    }

    let ref = createRef<Spline>();

    view.add(
      <Spline
        ref={ref}
        lineWidth={20}
        stroke={Solarized.base01}
        // opacity={0.25}
        points={[
          vertexRefs[from]().position(),
          vertexRefs[from]().position(),
          vertexRefs[to]().position(),
          vertexRefs[to]().position(),
        ]}
        zIndex={-1}
        start={1}
      />,
    );

    edgeAppearAnimations.push(delay((i / m) * duration, ref().start(0, 1)));
  }

  let smbge = createRef<Rect>();

  view.add(
    <Rect
      ref={smbge}
      width={600}
      height={400}
      fill={Solarized.orange}
      layout={true}
      direction={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      gap={35}
      opacity={0}
      scale={zoomOutFactor * 1.5}
    >
      <Img src={super_mario_bros_logo_alpha} width={500} smoothing={true}></Img>
      <MyTxt fontSize={75} fill={Solarized.base2} textAlign={'center'}>
        Graph Edition
      </MyTxt>
    </Rect>,
  );

  yield* all(
    image().src(mario_jump, 0.1),
    image().position(new Vector2(0, -300), 0.5, easeOutQuad),
    delay(
      0.0,
      all(
        image().rotation(-360, 1, easeInOutExpo),
        image().opacity(0, 1, easeInOutExpo),
        image().filters.blur(10, 1, easeInOutExpo),
        imageCircle().filters.blur(0, 1, easeInOutExpo),
      ),
    ),
    delay(0.5, all(image().position(new Vector2(0, 0), 0.5, easeInExpo))),
    delay(
      0.85,
      all(
        mixSignal(1.0, 0.25),
        distFactor(10.0, 0.75),
        layout().opacity(0, 0.3),
        clouds().opacity(0, 0.3),
        layout().position(new Vector2(0, 1000), 0.25),
        clouds().position(new Vector2(0, -500), 0.25),
        bgRect().opacity(0, 0.75),
      ),
    ),
    delay(
      1,
      all(
        ...vertexAppearAnimations,
        ...edgeAppearAnimations,
        view.scale(view.scale().div(zoomOutFactor), duration),
        view.width(view.width() * zoomOutFactor, duration),
        view.height(view.height() * zoomOutFactor, duration),
      ),
    ),
    delay(1 + duration - 1, smbge().opacity(1, 1)),
  );

  yield* waitFor(10);
});
