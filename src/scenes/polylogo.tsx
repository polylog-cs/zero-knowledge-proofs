import {
  Circle,
  Gradient,
  Layout,
  Line,
  makeScene2D,
  Node,
  Rect,
} from '@motion-canvas/2d';
import {
  all,
  Color,
  createEaseInBounce,
  createEaseInElastic,
  createEaseOutElastic,
  createRef,
  delay,
  easeInBounce,
  easeInOutBack,
  easeInOutCirc,
  easeInOutQuad,
  easeInOutQuint,
  easeInOutSine,
  easeInQuad,
  easeOutBounce,
  easeOutElastic,
  easeOutQuad,
  sequence,
  Vector2,
  waitFor,
} from '@motion-canvas/core';
import { Colorize } from '@motion-canvas/ui';
import chroma from 'chroma-js';

import { Solarized } from '../utilities';
import { MyTxt } from '../utilities_text';

type CircleDefinition = [Vector2, number, string];
type EdgeDefinition = [number, number];

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  let small_circle_size = 8.1;
  let letter_circle_size = 10.5;
  let large_circle_size = 13.5;

  let inner_scale = 0.4;

  let background = Solarized.base3;
  let backgroundTransparent = new Color(Solarized.yellow).alpha(0).css();
  let font = Solarized.base02;

  // NOTE: positions are top-left corner since they are yoinked from Inkscape
  let circle_data: CircleDefinition[] = [
    [new Vector2(26.192, 45.6), letter_circle_size, font], // left O
    [new Vector2(64.611, 45.5), letter_circle_size, font], // right O
    [new Vector2(34.582, 59.877), small_circle_size, Solarized.yellow],
    [new Vector2(49.762, 61.619), large_circle_size, Solarized.yellow],
    [new Vector2(34.339, 23.247), large_circle_size, Solarized.yellow],
    [new Vector2(65.472, 72.545), small_circle_size, Solarized.yellow],
    [new Vector2(45.989, 78.4), small_circle_size, Solarized.yellow],
    [new Vector2(54.411, 28.131), small_circle_size, Solarized.yellow],
    [new Vector2(45.791, 12.338), small_circle_size, Solarized.yellow],
    [new Vector2(25.616, 14.474), small_circle_size, Solarized.yellow],
    [new Vector2(15.662, 26.801), small_circle_size, backgroundTransparent], // invisible -v
    [new Vector2(58.135, 11.856), small_circle_size, backgroundTransparent],
    [new Vector2(70.246, 25.196), small_circle_size, backgroundTransparent],
    [new Vector2(19.399, 65.177), small_circle_size, backgroundTransparent],
    [new Vector2(30.2, 78.378), small_circle_size, backgroundTransparent],
    [new Vector2(54.986, 84.441), small_circle_size, backgroundTransparent],
    [new Vector2(80.534, 78.244), small_circle_size, backgroundTransparent],
  ];

  let circle_refs = circle_data.map(() => createRef<Circle>());
  let circle_objects = circle_refs.map((ref, i) => {
    let [pos, size, color] = circle_data[i];

    return (
      <Circle
        key={`circle${i}`}
        ref={ref}
        fill={color}
        width={size}
        height={size}
        position={pos.add(size / 2).sub(100 / 2)}
        zIndex={-1}
        opacity={color == font ? 0 : 1}
      >
        <Circle
          ref={ref}
          fill={background}
          width={size * inner_scale}
          height={size * inner_scale}
        />
      </Circle>
    );
  });

  let edge_data: EdgeDefinition[] = [
    [0, 2], // left o
    [0, 4], // left o
    [1, 3], // right o
    [4, 7],
    [4, 8],
    [4, 9],
    [3, 2],
    [3, 5],
    [3, 6],
    [2, 13], //  invisible -v
    [6, 14],
    [5, 15],
    [5, 16],
    [7, 12],
    [7, 11],
    [9, 10],
  ];

  let text = createRef<MyTxt>();
  let edge_refs = edge_data.map(() => createRef<Line>());
  let edge_objects = edge_refs.map((ref, i) => {
    let [from, to] = edge_data[i];

    let [from_pos, from_size, from_color] = circle_data[from];
    let [to_pos, to_size, to_color] = circle_data[to];

    from_pos = from_pos.add(from_size / 2).sub(100 / 2);
    to_pos = to_pos.add(to_size / 2).sub(100 / 2);

    // offset by the circle radius
    from_pos = from_pos.add(to_pos.sub(from_pos).normalized.mul(from_size / 2));
    to_pos = to_pos.add(from_pos.sub(to_pos).normalized.mul(to_size / 2));

    // chroma.mix(from_color, background, circle_refs[from]().opacity())

    const gradient = new Gradient({
      from: from_pos,
      to: to_pos,
      stops: [
        { offset: 0, color: from_color },
        { offset: 1, color: to_color },
      ],
    });

    return (
      <Line
        ref={ref}
        stroke={gradient}
        lineWidth={2}
        points={() => {
          let [from_pos, from_size, from_color] = circle_data[from];
          let [to_pos, to_size, to_color] = circle_data[to];

          from_pos = from_pos
            .add(from_size / 2)
            .sub(100 / 2)
            .div(text().scale());
          to_pos = to_pos
            .add(to_size / 2)
            .sub(100 / 2)
            .div(text().scale());

          let from_ref = circle_refs[from]();

          // offset by the circle radius
          from_pos = from_pos.add(
            to_pos
              .sub(from_pos)
              .normalized.mul(from_size / 2)
              .mul(from_ref.scale().x),
          );
          to_pos = to_pos.add(from_pos.sub(to_pos).normalized.mul(to_size / 2));

          return [from_pos, to_pos];
        }}
        lineCap="round"
      />
    );
  });

  let backgroundCircle = createRef<Circle>();
  let textHidingRect = createRef<Rect>();

  view.add(
    <>
      <Circle
        ref={backgroundCircle}
        width={100}
        height={100}
        scale={10}
        fill={background}
      >
        {...circle_objects}
        {...edge_objects}
      </Circle>
      <Node cache>
        <Rect
          width={80}
          height={80}
          ref={textHidingRect}
          right={backgroundCircle()
            .left()
            .add(new Vector2(0, 250 + 40))}
          scale={10}
          fill={background}
          rotation={45}
        ></Rect>
        <MyTxt
          ref={text}
          text={'polylog'}
          fontSize={210}
          fontWeight={700}
          fill={font}
          compositeOperation={'source-in'}
        />
      </Node>
    </>,
  );

  text().left(backgroundCircle().right());
  text().opacity(0);

  circle_refs.forEach((ref) => ref().scale(ref().opacity() == 0 ? 1 : 0));
  edge_refs.forEach((ref) => ref().end(0).opacity(0));

  yield* all(
    text().position(new Vector2(0, 0), 2, easeInOutQuint),
    text().opacity(1, 2, easeInOutQuint),
    textHidingRect().position(new Vector2(0, 0), 2, easeInOutQuint),
  );

  textHidingRect().remove();
  text().compositeOperation('source-over');

  let bop = 0.85;

  yield* all(
    all(
      backgroundCircle().scale(backgroundCircle().scale().mul(bop), 0.2, easeOutQuad),

      text().scale(text().scale().mul(0.95), 0.2, easeOutQuad),
    ),
    delay(
      0.2,
      all(
        backgroundCircle().scale(
          backgroundCircle()
            .scale()
            .mul(1 / bop),
          1,
          createEaseOutElastic(1),
        ),
        text().scale(
          text()
            .scale()
            .mul(1 / 0.95),
          1,
          createEaseOutElastic(1),
        ),
      ),
    ),
    delay(
      0.1,
      all(
        sequence(
          0.05,
          ...circle_refs.map((ref) =>
            all(ref().scale(1, 1, createEaseOutElastic(1.5))),
          ),
        ),
        sequence(
          0.025,
          ...edge_refs.map((ref) => all(ref().end(1, 0.5), ref().opacity(1, 0.5))),
        ),
      ),
    ),
  );
});
