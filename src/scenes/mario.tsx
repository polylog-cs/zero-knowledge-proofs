import { Circle, Node, Rect, Img, Layout, makeScene2D } from '@motion-canvas/2d';
import { Solarized } from '../utilities';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInExpo,
  easeInOutExpo,
  easeOutQuad,
  linear,
  loop,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import mario_run_1 from '../assets/SMB/run1.png';
import mario_run_2 from '../assets/SMB/run2.png';
import mario_run_3 from '../assets/SMB/run3.png';
import mario_run_4 from '../assets/SMB/run4.png';
import mario_jump from '../assets/SMB/jump.png';
import block from '../assets/SMB/block.png';
import cloud_big from '../assets/SMB/cloud_big.png';
import cloud_small from '../assets/SMB/cloud_small.png';

import chroma from 'chroma-js';

import gradientShader from '../shaders/gradient2.glsl';

export default makeScene2D(function* (view) {
  let image = createRef<Img>();
  let imageCircle = createRef<Circle>();
  let clouds = createRef<Node>();
  let layout = createRef<Layout>();

  let mixSignal = createSignal<number>(0.0);
  let distFactor = createSignal<number>(1);

  view.add(
    <>
      <Rect
        width={1920}
        height={1080}
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
        lineWidth={10}
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
      ),
    ),
  );

  image().src(mario_run_1);

  yield* waitFor(0.5);
});
