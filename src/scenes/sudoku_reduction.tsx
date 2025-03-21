import { Layout, makeScene2D, Rect, Shape, Spline, Txt } from '@motion-canvas/2d';
import { Color, createRef, easeInOutBack, linear, Vector2 } from '@motion-canvas/core';
import { all, chain, sequence, waitFor } from '@motion-canvas/core/lib/flow';

import { indicate, Solarized, solarizedPalette } from '../utilities';
import { generateArcPoints } from '../utilities_graph';
import { nextTo } from '../utilities_moving';
import { clues, solution, Sudoku, SudokuGraph } from '../utilities_sudoku';
import { MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  // 1) Create and show the sample Sudoku.
  const sudoku = new Sudoku(9, 55, solution, clues);
  const sudokuLayout = sudoku.getLayout();
  view.add(sudokuLayout);

  // Position the sudoku on the left side eventually, but start it centered
  sudoku.layoutRef().position.x(0);
  sudokuLayout.scale(1.2);

  // Wait a moment to show the Sudoku
  yield* waitFor(2);

  // 2) Slide Sudoku to the left.
  // Adjust the x value so it moves nicely to the left half of the screen.
  yield* sudoku.layoutRef().position.x(-400, 1);

  const graph = new SudokuGraph();

  view.add(graph.getGraphLayout());
  yield;
  graph.containerRef().position([150, -280]);

  yield* graph.fadeVerticesSequential(0.01, 0.7, graph.gridVertices);

  // 4) On top of the nodes, show a swatch of nine colors.

  const swatchRef = createRef<Layout>();
  view.add(
    <Layout ref={swatchRef} layout direction={'row'} gap={10} position={[430, -350]}>
      {solarizedPalette.map((c, i) => (
        <Rect key={`color-${i}`} width={30} height={30} fill={c} opacity={0} />
      ))}
    </Layout>,
  );
  const squares = Array.from(swatchRef().children()) as Rect[];

  yield* waitFor(1);
  // Fade in the swatch
  yield* sequence(0.2, ...squares.map((square) => square.opacity(1, 0.5)));
  yield* waitFor(1);

  // 5) On top of sudoku, show a list of 9 digits.
  const digitsRef = createRef<Layout>();
  view.add(
    <Layout
      ref={digitsRef}
      layout
      direction={'row'}
      gap={10}
      alignItems="center"
      justifyContent="center"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <MyTxt
          key={`digit-${i}`}
          text={(i + 1).toString()}
          fontSize={40}
          opacity={0}
          fill={solarizedPalette[i]}
        />
      ))}
    </Layout>,
  );
  nextTo(digitsRef(), sudoku.layoutRef(), 'up', 20);

  const digits = Array.from(digitsRef().children()) as Txt[];
  yield* sequence(0.1, ...digits.map((digit) => digit.opacity(1, 0.3)));
  yield* waitFor(1);

  yield* all(sudoku.color(0, 1));

  yield* waitFor(2);

  // 6) Fade out the swatch and the digits
  yield* all(
    swatchRef().opacity(0, 1),
    digitsRef().opacity(0, 1),
    sudoku.color(0, 1, true),
  );

  yield* waitFor(3);

  yield* sudokuLayout.children()[0].zIndex(10, 0);
  yield* all(
    indicate(graph.getVertex('(0,0)')),
    indicate(sudokuLayout.children()[0].children()[0]),
  );

  yield* waitFor(3);

  for (let e of [
    ...graph.boxArcs,
    ...graph.rowArcs,
    ...graph.crossArcs,
    ...graph.cliqueArcs,
    ...graph.columnArcs,
  ]) {
    graph.getEdge(e).ref().stroke(Solarized.base1);
  }

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
      i == 0 ? 0.3 : 0.1,
      1,
      arr[i].map(([r, c]) => ['(0,0)', `(${r},${c})`]),
    );
    yield* waitFor(2);
  }

  yield* graph.fadeEdgesSequential(
    0.02,
    1,
    arr.flat().map(([r, c]) => ['(0,0)', `(${r},${c})`]),
    0,
  );

  yield* waitFor(1);

  const exampleCell = [0, 4];

  yield* sudokuLayout.children()[exampleCell[0]].zIndex(10, 0);
  const rect = sudokuLayout.children()[exampleCell[0]].children()[
    exampleCell[1]
  ] as Rect;

  yield* all(
    indicate(rect),
    indicate(graph.getVertex(`(${exampleCell[0]},${exampleCell[1]})`)),
  );
  yield* waitFor(1);

  yield* sequence(
    0.5,
    graph.containerRef().position.y(-150, 1),
    graph.fadeVerticesSequential(0.05, 1, graph.cliqueVertices),
  );

  yield* graph.fadeEdgesSequential(0.02, 1, graph.cliqueArcs, 0.5);
  yield* waitFor(1);

  yield* graph.colorPalette(0.1, 0.5);
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
      stroke={Solarized.base01}
      lineDash={[6]}
      lineWidth={7}
      opacity={0}
      zIndex={-10}
      smoothness={0.6}
      points={generateArcPoints(
        new Vector2(fromVertex.position()),
        new Vector2(toVertex.position()),
        20,
      )}
    />
  );
  graph.containerRef().add(nonExistingEdge);

  yield* nonExistingEdge.opacity(1, 0.5);
  yield* waitFor(1);
  yield* fromVertex.fill(toVertex.fill(), 0.5);
  yield* waitFor(1);
  yield* all(
    nonExistingEdge.opacity(0, 0.5),
    fromVertex.fill(Solarized.gray, 0.5),
    graph.colorPalette(0, 1, true),
  );

  const edgeGroups = [graph.rowArcs, graph.columnArcs, graph.boxArcs];

  yield* graph.fadeEdgesSequential(0.01, 1, graph.crossArcs, 0.7);
  yield* graph.fadeEdgesSequential(
    0.001,
    0.5,
    [...graph.crossArcs, ...graph.cliqueArcs],
    0.15,
  );
  yield* waitFor(1);

  for (let i = 0; i < edgeGroups.length; i++) {
    let factor = i < 2 ? 1 / (9 * 4 * 9) : 1 / (9 * 2 * 9);
    yield* sequence(
      1.5,
      //graph.fadeEdgesSequential(0.3 * factor, 1, edgeGroups[i], 0.7),
      graph.fadeEdgesSequential(0.3 * factor, 0.5, edgeGroups[i], i == 2 ? 0.5 : 0.15),
    );
  }

  /*yield* indicate(graph.containerRef(), 1.1);
  yield* waitFor(1);*/
  yield* all(graph.colorPalette(0, 1), graph.colorSolution(solution, undefined, 0, 1));
  yield* waitFor(3);
  yield* all(
    ...[...Array(9).keys()].flatMap((i) =>
      [...Array(9).keys()].map((j) =>
        (function* () {
          let v = graph.getVertex('(' + i + ',' + j + ')');
          let w = v.clone();
          view.add(w);
          w.absolutePosition(v.absolutePosition());
          let cell = sudoku.cells[i][j].textRef();
          let sol = sudoku.solution[i][j];
          yield* chain(
            all(v.absolutePosition(cell.absolutePosition(), 2), v.scale(1.3, 1)),
            waitFor(3),
            all(
              cell.text('' + sol, 0),
              cell.fill(solarizedPalette[sol - 1], 0),
              cell.opacity(1, 0),
              v.opacity(0.2, 1),
            ),
          );
        })(),
      ),
    ),
  );
  yield* waitFor(3);
  return;

  yield* indicate(sudokuLayout, 1.1);
  yield* waitFor(1);
  yield* sudoku.fillInSolutionFancy();
  yield* waitFor(1);

  const eachDelay = 0.5,
    eachDuration = 0.3;
  yield* all(
    graph.colorPalette(eachDelay, eachDuration),
    sudoku.color(eachDelay, eachDuration),
  );

  yield* graph.colorSolution(solution);
  yield* waitFor(1);
  const colorOrNot = function* (node: Shape, c: Color) {
    if (node.origFill === undefined) {
      node.save();
      node.origFill = node.fill();
    }
    const keep = (node.origFill as Color).css() == c.css();
    yield* all(
      node.fill(keep ? c : Solarized.gray, 1),
      node.opacity(keep ? 1 : 0.3, 1),
    );
  };

  const colorOneColor = (c: Color) =>
    all(
      ...graph.gridVertices
        .concat(graph.cliqueVertices)
        .map((v) => colorOrNot(graph.getVertex(v), c)),
      ...sudoku.cells
        .flat()
        .flat()
        .map((v) => colorOrNot(v.textRef(), c)),
    );

  for (let i = 0; i < 5; i++) {
    yield* colorOneColor(
      sudoku.cells[0][i].textRef().origFill ??
        (sudoku.cells[0][i].textRef().fill() as Color),
    );
    yield* waitFor(i == 0 ? 2 : 1);
  }

  yield* all(
    ...graph.gridVertices
      .concat(graph.cliqueVertices)
      .map((v) => graph.getVertex(v).restore(1)),
    ...sudoku.cells
      .flat()
      .flat()
      .map((v) => v.textRef().restore(1)),
  );

  yield* waitFor(5);
});
