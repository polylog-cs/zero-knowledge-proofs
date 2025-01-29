import { CubicBezier, Layout, Line, Rect } from '@motion-canvas/2d';
import { createRef, Vector2 } from '@motion-canvas/core';
import { all, delay, sequence, waitFor } from '@motion-canvas/core/lib/flow';

import { Solarized } from '../utilities';
import { makeScene2D } from '../utilities_fix_view_scaling';
import { exampleGraphData, Graph } from '../utilities_graph';
import { absoluteToViewSpace, alignTo, nextTo, shift } from '../utilities_moving';
import { clues, solution, Sudoku } from '../utilities_sudoku';
import { MyTxt } from '../utilities_text';
import { makeWobbly } from './np_to_coloring_conversion';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const g = new Graph(50);
  g.initialize(exampleGraphData);
  const graph = g.getGraphLayout();
  graph.position([0, -100]);
  graph.scale(1.5);
  view.add(graph);
  yield* g.fadeIn(1);

  const swatchRef = createRef<Layout>();
  view.add(
    <Layout ref={swatchRef} layout direction={'row'} gap={16}>
      {[Solarized.red, Solarized.green, Solarized.blue].map((c, i) => (
        <Rect key={`color-${i}`} width={100} height={100} fill={c} opacity={0} />
      ))}
    </Layout>,
  );
  alignTo(swatchRef(), view, 'left', 220, 0);
  const squares = Array.from(swatchRef().children()) as Rect[];

  // Fade in the swatch
  yield* sequence(0.1, ...squares.map((square) => square.opacity(1, 0.3)));
  yield* waitFor(1);

  yield* all(swatchRef().opacity(0, 1), g.applyColors());
  yield* waitFor(2);
  yield* sequence(
    0.5,
    g.pointAtVertex('B', 1.5),
    g.applyColors(undefined, undefined, new Map([['B', 2]])),
  );
  yield* g.pointAtEdge(['B', 'C']);
  yield* waitFor(1);

  // 1) Create and show the sample Sudoku.
  const sudoku = new Sudoku(9, 55, solution, clues);
  const sudokuLayout = sudoku.getLayout();
  yield* sudokuLayout.opacity(0, 0);
  view.add(sudokuLayout);
  sudokuLayout.scale(1.2);

  yield* sudoku.layoutRef().position.x(-500, 0);
  yield* all(
    g.applyColors(undefined, undefined, new Map([['B', 1]])),
    shift(graph, new Vector2(500, 0), 1),
    delay(0.5, sudokuLayout.opacity(1, 1)),
  );

  const nosame_sudoku = createRef<MyTxt>(),
    nosame_graph = createRef<MyTxt>();

  view.add(
    <>
      <MyTxt text="Can't be the same" ref={nosame_sudoku} fontSize={50} opacity={0} />
      <MyTxt text="Can't be the same" ref={nosame_graph} fontSize={50} opacity={0} />
    </>,
  );
  nextTo(nosame_sudoku(), sudoku.layoutRef().children()[0].children()[6], 'up', 130);
  nextTo(nosame_graph(), g.getEdge(['B', 'C']).ref(), 'up', 0);
  nosame_graph().position.y(nosame_sudoku().position.y());

  const mkline = (a: Vector2, b: Vector2, c: number) => {
    const ref = createRef<Line>();
    view.add(
      <Line
        points={() => {
          return [a, b.add(a.sub(b).normalized.scale(c * view.scale().magnitude))];
        }}
        lineWidth={5}
        stroke={Solarized.gray}
        endArrow
        ref={ref}
        arrowSize={20}
        opacity={0}
      />,
    );
    return ref;
  };

  const ar1 = mkline(
    nosame_sudoku().bottom().add([-50, 20]),
    absoluteToViewSpace(
      view,
      sudoku.layoutRef().children()[0].children()[4].absolutePosition(),
    ).addY(-30),
    25,
  );

  const ar2 = mkline(
    nosame_sudoku().bottom().add([50, 20]),
    absoluteToViewSpace(
      view,
      sudoku.layoutRef().children()[0].children()[8].absolutePosition(),
    ).addY(-30),
    25,
  );

  const ar3 = mkline(
    nosame_graph().bottom().add([-50, 20]),
    absoluteToViewSpace(view, g.getVertex('A').absolutePosition()),
    50,
  );

  const ar4 = mkline(
    nosame_graph().bottom().add([50, 20]),
    absoluteToViewSpace(view, g.getVertex('B').absolutePosition()),
    50,
  );

  yield* all(...[nosame_graph, ar3, ar4].map((x) => x().opacity(1, 1)));
  yield* all(...[nosame_sudoku, ar1, ar2].map((x) => x().opacity(1, 1)));

  yield* waitFor(1);
  const line = createRef<CubicBezier>();
  view.add(
    <CubicBezier
      ref={line}
      lineWidth={30}
      arrowSize={60}
      stroke={Solarized.base00}
      p0={[-150, 0]}
      p3={[270, 0]}
      end={0}
      endArrow
      zIndex={1}
      lineCap={'round'}
    />,
  );
  line().scale(new Vector2(1, -1));
  makeWobbly(line);
  yield* line().end(1, 1);
  yield* waitFor(1);
});
