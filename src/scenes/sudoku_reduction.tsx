import { makeScene2D, Path, Spline } from '@motion-canvas/2d';
import { Layout, Txt, Rect, Circle } from '@motion-canvas/2d';
import { createRef, createSignal, useLogger, Vector2 } from '@motion-canvas/core';
import { all, sequence, waitFor } from '@motion-canvas/core/lib/flow';
import {
  Solarized,
  indicate,
  logPair,
  logValue,
  logPosition,
  solarizedPalette,
} from '../utilities';
import { generateArcPoints } from '../utilities_graph';
import { Sudoku, SudokuGraph, solution, clues } from '../utilities_sudoku';

export default makeScene2D(function* (view) {
  const logger = useLogger();
  logger.info('Sudoku Reduction');
  logger.info(`scene: ${JSON.stringify(view.width())}`);
  logger.info(`scene: ${JSON.stringify(view.height())}`);
  view.fill(Solarized.base2);

  // 1) Create and show the sample Sudoku.
  const sudoku = new Sudoku(9, 50, solution, clues);
  const sudokuLayout = sudoku.getLayout();
  view.add(sudokuLayout);

  // Position the sudoku on the left side eventually, but start it centered
  sudoku.layoutRef().position.x(0);

  // Wait a moment to show the Sudoku
  yield* waitFor(0.5);

  // 2) Slide Sudoku to the left.
  // Adjust the x value so it moves nicely to the left half of the screen.
  yield* sudoku.layoutRef().position.x(-400, 1);

  const graph = new SudokuGraph();

  view.add(graph.getGraphLayout());
  yield;
  graph.containerRef().position([200, -250]);

  yield* graph.fadeVerticesSequential(0.02, 1, graph.gridVertices);

  // 4) On top of the nodes, show a swatch of nine colors.

  const swatchRef = createRef<Layout>();
  const swatchLayout = (
    <Layout
      ref={swatchRef}
      layout
      direction={'row'}
      gap={10}
      y={-250} // Position above the nodes
      x={400}
    >
      {solarizedPalette.map((c, i) => (
        <Rect key={`color-${i}`} width={30} height={30} fill={c} opacity={0} />
      ))}
    </Layout>
  );
  const squares = Array.from(swatchRef().children()) as Rect[];
  view.add(swatchLayout);

  // Fade in the swatch
  yield* sequence(0.1, ...squares.map((square) => square.opacity(1, 0.2)));
  yield* waitFor(1);

  // 5) On top of sudoku, show a list of 9 digits.
  const digitsRef = createRef<Layout>();
  const digitsLayout = (
    <Layout
      ref={digitsRef}
      layout
      direction={'row'}
      gap={10}
      alignItems="center"
      justifyContent="center"
      y={-250} // Position above sudoku
      x={-400}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <Txt
          key={`digit-${i}`}
          text={(i + 1).toString()}
          fontSize={40}
          fill="black"
          opacity={0}
        />
      ))}
    </Layout>
  );
  view.add(digitsLayout);

  const digits = Array.from(digitsRef().children()) as Txt[];
  yield* sequence(0.1, ...digits.map((digit) => digit.opacity(1, 0.2)));
  yield* waitFor(1);

  // 6) Fade out the swatch and the digits
  yield* all(swatchRef().opacity(0, 0.5), digitsRef().opacity(0, 0.5));

  const base_vertex = graph.getVertex('(0,0)');
  const first_row = graph.getRowVertices(0);
  const first_column = graph.getColumnVertices(0);

  const arr = [
    Array.from({ length: 8 }, (_, i) => [0, i + 1]),
    Array.from({ length: 8 }, (_, i) => [i + 1, 0]),
    [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
  ];

  for (let i = 0; i < arr.length; i++) {
    yield* graph.fadeEdgesSequential(
      0.1,
      1,
      arr[i].map(([r, c]) => ['(0,0)', `(${r},${c})`]),
    );
    yield* waitFor(1);
  }

  yield* graph.fadeEdgesSequential(
    0.1,
    1,
    arr.flat().map(([r, c]) => ['(0,0)', `(${r},${c})`]),
    0,
  );

  yield* waitFor(1);

  const exampleCell = [0, 4];

  const rect = sudokuLayout.children()[exampleCell[0]].children()[
    exampleCell[1]
  ] as Rect;

  yield* indicate(rect);
  yield* waitFor(1);

  yield* indicate(graph.getVertex(`(${exampleCell[0]},${exampleCell[1]})`));
  yield* waitFor(1);

  yield* graph.containerRef().position.y(-100, 1);
  yield* waitFor(1);

  yield* graph.fadeVerticesSequential(0.05, 1, graph.cliqueVertices);
  yield* waitFor(1);

  yield* graph.fadeEdgesSequential(0.05, 1, graph.cliqueArcs);
  yield* waitFor(1);

  // show edges to one nodes
  const exampleEdges = graph.crossArcs.filter(
    ([u, v]) => u === `(${exampleCell[0]},${exampleCell[1]})`,
  );
  yield* graph.fadeEdgesSequential(0.1, 1, exampleEdges);
  yield* waitFor(1);

  const fromVertex = graph.getVertex(`(${exampleCell[0]},${exampleCell[1]})`);
  const toVertex = graph.getVertex(
    `clique-${solution[exampleCell[0]][exampleCell[1]] - 1}`,
  );
  const nonExistingEdge = (
    <Spline
      stroke={Solarized.red}
      lineWidth={4}
      opacity={0}
      zIndex={-10}
      smoothness={0.6}
      points={generateArcPoints(
        new Vector2(fromVertex.position()),
        new Vector2(toVertex.position()),
        0,
      )}
    />
  );
  graph.containerRef().add(nonExistingEdge);

  yield* nonExistingEdge.opacity(1, 0.5);
  yield* waitFor(1);
  yield* nonExistingEdge.opacity(0, 0.5);
  yield* waitFor(1);

  const edgeList = [graph.crossArcs, graph.rowArcs, graph.columnArcs, graph.boxArcs];

  for (let i = 0; i < edgeList.length; i++) {
    yield* graph.fadeEdgesSequential(0.02, 1, edgeList[i]);
    yield* waitFor(1);

    const edges = edgeList[i];
    if (i == 0) {
      edges.push(...graph.cliqueArcs);
    }
    yield* graph.fadeEdgesSequential(0.005, 1, edges, 0.1);
    yield* waitFor(1);
  }

  yield* indicate(graph.containerRef(), 1.1);
  yield* waitFor(1);

  yield* indicate(sudokuLayout, 1.1);
  yield* waitFor(1);
  yield* sudoku.fillInSolutionFancy();
  yield* waitFor(1);

  yield* graph.colorSolution(solution);
  yield* waitFor(1);

  yield* waitFor(5);
});
