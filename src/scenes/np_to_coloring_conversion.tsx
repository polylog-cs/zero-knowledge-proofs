import { CubicBezier, makeScene2D, Rect } from '@motion-canvas/2d';
import { all, createRef, Reference, Vector2, waitFor } from '@motion-canvas/core';

import { MarioAlgorithm } from '../components/mario_algorithm';
import { Solarized } from '../utilities';

const makeWobbly = (bezier: Reference<CubicBezier>) => {
  const lineDirection = () => bezier().p3().sub(bezier().p0());
  bezier().p1(() => bezier().p0().add(lineDirection().mul(0.4).rotate(30)));
  bezier().p2(() => bezier().p3().add(lineDirection().mul(-0.4).rotate(30)));
};

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  let algorithmStep = createRef<MarioAlgorithm>();
  let circuitStep = createRef<Rect>();
  let satStep = createRef<Rect>();
  let coloringStep = createRef<Rect>();

  view.add(<MarioAlgorithm zIndex={10} ref={algorithmStep} />);

  const squareSize = algorithmStep().width();

  const xGap = 400;
  const yGap = 250;
  const arrowColor = Solarized.gray;

  yield* all(algorithmStep().scale(0.75, 1), algorithmStep().position([-xGap, 0], 1));

  const line1 = createRef<CubicBezier>();

  view.add(
    <>
      <Rect
        fill={Solarized.cyan}
        width={squareSize}
        height={squareSize}
        scale={0.75}
        x={xGap}
        opacity={0}
        ref={circuitStep}
      ></Rect>
      <CubicBezier
        ref={line1}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={algorithmStep().right}
        p3={circuitStep().left}
        end={0}
        endArrow
      />
    </>,
  );

  makeWobbly(line1);

  yield* circuitStep().opacity(1, 1);

  yield* line1().end(1, 1);
  yield* waitFor(1);
  yield* all(
    algorithmStep().scale(0.5, 1),
    algorithmStep().position([-xGap, -yGap], 1),
    circuitStep().scale(0.5, 1),
    circuitStep().position([xGap, -yGap], 1),
  );

  // Step 2: Circuit to SAT

  const line2 = createRef<CubicBezier>();
  view.add(
    <>
      <Rect
        fill={Solarized.blue}
        width={squareSize}
        height={squareSize}
        scale={0.5}
        x={xGap}
        y={yGap}
        opacity={0}
        ref={satStep}
      ></Rect>
      <CubicBezier
        ref={line2}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={circuitStep().bottom}
        p3={satStep().top}
        end={0}
        endArrow
      />
    </>,
  );
  makeWobbly(line2);

  yield* satStep().opacity(1, 1);
  yield* line2().end(1, 1);
  yield* waitFor(1);

  // Step 3: SAT to coloring

  const line3 = createRef<CubicBezier>();

  view.add(
    <>
      <Rect
        fill={Solarized.magenta}
        width={squareSize}
        height={squareSize}
        scale={0.5}
        x={-xGap}
        y={yGap}
        opacity={0}
        ref={coloringStep}
      ></Rect>
      <CubicBezier
        ref={line3}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={satStep().left}
        p3={coloringStep().right}
        end={0}
        endArrow
      />
    </>,
  );
  makeWobbly(line3);

  yield* coloringStep().opacity(1, 1);
  yield* line3().end(1, 1);

  yield* waitFor(10);
});
