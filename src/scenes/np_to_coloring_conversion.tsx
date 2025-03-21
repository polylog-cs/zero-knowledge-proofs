import { CubicBezier, Img, makeScene2D, Rect } from '@motion-canvas/2d';
import { all, createRef, Reference, Vector2, waitFor } from '@motion-canvas/core';

import circuit_screenshot_simple from '../assets/images/circuit_screenshot_simple.png';
import sat_screenshot from '../assets/images/sat_screenshot.png';
import { MarioAlgorithm } from '../components/mario_algorithm';
import { Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { shift } from '../utilities_moving';

export const makeWobbly = (bezier: Reference<CubicBezier>) => {
  const lineDirection = () => bezier().p3().sub(bezier().p0());
  bezier().p1(() => bezier().p0().add(lineDirection().mul(0.4).rotate(30)));
  bezier().p2(() => bezier().p3().add(lineDirection().mul(-0.4).rotate(30)));
};

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const algorithmStep = createRef<MarioAlgorithm>();
  const circuitStep = createRef<Rect>();
  const satStep = createRef<Rect>();
  const coloringStep = createRef<Rect>();

  view.add(<MarioAlgorithm zIndex={10} ref={algorithmStep} />);

  const squareSize = algorithmStep().width();

  const xGap = 400;
  const yGap = 250;
  const arrowColor = Solarized.gray;
  const scale1 = 0.9;
  const scale2 = 0.6;

  yield* all(algorithmStep().scale(scale1, 1), algorithmStep().position([-xGap, 0], 1));

  const line1 = createRef<CubicBezier>();

  view.add(
    <>
      <Rect
        // fill={Solarized.cyan}
        width={squareSize}
        height={squareSize}
        scale={scale1}
        x={xGap}
        opacity={0}
        ref={circuitStep}
      >
        <Img src={circuit_screenshot_simple} width={squareSize}></Img>
      </Rect>
      <CubicBezier
        ref={line1}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={() => algorithmStep().right().add(new Vector2(50, 0))}
        p3={circuitStep().left}
        end={0}
        endArrow
        zIndex={1}
        lineCap={'round'}
      />
    </>,
  );

  makeWobbly(line1);

  line1().opacity(0);
  yield* waitFor(2);
  yield* all(circuitStep().opacity(1, 1), line1().end(1, 1), line1().opacity(1, 0.5));
  yield* waitFor(2);
  yield* all(
    algorithmStep().scale(scale2, 1),
    algorithmStep().position([-xGap, -yGap], 1),
    circuitStep().scale(scale2, 1),
    circuitStep().position([xGap, -yGap], 1),
  );

  // Step 2: Circuit to SAT

  const line2 = createRef<CubicBezier>();
  view.add(
    <>
      <Rect
        // fill={Solarized.blue}
        width={squareSize}
        height={squareSize}
        scale={scale2}
        x={xGap}
        y={yGap}
        opacity={0}
        ref={satStep}
      >
        <Img src={sat_screenshot} width={squareSize}></Img>
      </Rect>
      <CubicBezier
        ref={line2}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={() => circuitStep().bottom().add(new Vector2(0, 40))}
        p3={() => satStep().top().add(new Vector2(0, 30))}
        end={0}
        endArrow
        lineCap={'round'}
      />
    </>,
  );
  makeWobbly(line2);

  line2().opacity(0);
  yield* all(satStep().opacity(1, 1), line2().end(1, 1), line2().opacity(1, 0.5));
  yield* waitFor(1);

  // Step 3: SAT to coloring

  const line3 = createRef<CubicBezier>();

  const g = new Graph(50);
  g.initialize(exampleGraphData);
  const graphLayout = g.getGraphLayout();
  graphLayout.scale(1.2);
  shift(graphLayout, new Vector2(0, 0)); // why is this here? makes it not centered...
  yield* g.applyColors();
  yield* g.fadeIn(0);

  view.add(
    <>
      <Rect
        // fill={Solarized.magenta}
        width={squareSize}
        height={squareSize}
        scale={scale2}
        x={-xGap}
        y={yGap}
        opacity={0}
        ref={coloringStep}
      >
        {/* Hacky to use a screenshot here, but we don't manipulate the graph at all so it's ok. */}
        {graphLayout}
      </Rect>
      <CubicBezier
        ref={line3}
        lineWidth={15}
        arrowSize={30}
        stroke={arrowColor}
        p0={() => satStep().left().addX(-50)}
        p3={coloringStep().right}
        end={0}
        endArrow
        lineCap={'round'}
      />
    </>,
  );
  makeWobbly(line3);

  yield* all(coloringStep().opacity(1, 1), line3().end(1, 1));

  yield* waitFor(2);

  const t = 2;
  yield* all(
    line1().p3(() => coloringStep().left().add(new Vector2(40, 0)), t),
    algorithmStep().scale(scale1, t),
    algorithmStep().position([-xGap, 0], t),
    coloringStep().scale(scale1, t),
    coloringStep().position([xGap, 0], t),
    line1().lineWidth(25, t),
    line1().arrowSize(50, t),
    // fade out
    line2().opacity(0, t * 0.5),
    line2().end(0, t * 0.5),
    line3().opacity(0, t * 0.5),
    line3().end(0, t * 0.5),
    circuitStep().opacity(0, t * 0.5),
    circuitStep().scale(0, t * 0.5),
    satStep().opacity(0, t * 0.5),
    satStep().scale(0, t * 0.5),
  );
  yield* waitFor(5);
});
