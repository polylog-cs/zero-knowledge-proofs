import { Circle, Layout, Line, makeScene2D, Node } from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  sequence,
  useLogger,
  Vector2,
  waitFor,
} from '@motion-canvas/core';
import { MyTxt } from '../utilities_text';

import {
  cellSize,
  clues,
  fontSize,
  Graph,
  gridSize,
  Solarized,
  solution,
  Sudoku,
} from '../utilities';
import { exampleEdges, exampleLabels } from '../utilities_graph';

export default makeScene2D(function* (view) {
  const logger = useLogger();
  const graph = new Graph();

  view.fill(Solarized.base2);

  // fadein sudoku and shift it
  const sudoku = new Sudoku(gridSize, cellSize, solution, clues);
  const sudokuTitleRef = createRef<MyTxt>();
  const sudokuLayoutRef = createRef<Layout>();
  view.add(
    <Layout
      ref={sudokuLayoutRef}
      direction="column"
      alignItems="center"
      gap={100}
      layout
    >
      <MyTxt ref={sudokuTitleRef} text="Sudoku" fontSize={fontSize} />
      {sudoku.getLayout()}
    </Layout>,
  );

  yield* sudokuLayoutRef().position.x(-view.size().x / 6, 1);

  for (const label of exampleLabels) {
    graph.addVertex(label);
  }

  exampleEdges.forEach(([from, to]) => graph.addEdge(from, to));

  // Add graph node to the view with the specified positions
  const graphTitleRef = createRef<MyTxt>();
  const graphLayoutRef = createRef<Layout>();

  view.add(
    <Node ref={graphLayoutRef} position={[view.size().x / 6, 0]}>
      <MyTxt ref={graphTitleRef} text="Graph Coloring" fontSize={fontSize} />
      {graph.getNode(examplePositions)}
    </Node>,
  );
  graphTitleRef().position.y(sudokuTitleRef().position.y());
  yield* graph.fadeIn(1);

  // first coloring
  const coloring = [0, 1, 2, 0, 1, 2];
  yield* sequence(
    0.3,
    ...graph.vertices.map((vertex, i) =>
      vertex.ref().fill(graph.palette[coloring[i]], 0.5),
    ),
  );

  // highlight one vertex, change its color
  yield* all(
    graph.vertices[0].ref().scale(2, 1),
    graph.vertices[0].ref().position(
      graph.vertices[0]
        .ref()
        .position()
        .add(new Vector2(-l / 2, -l / 2)),
      1,
    ),
  );
  yield* graph.vertices[0].ref().fill(graph.palette[coloring[1]], 1);
  yield* waitFor(1);

  const sc = 4;
  yield* graph.edges[0].ref().lineWidth(graph.edges[0].ref().lineWidth() * sc, 1);
  yield* waitFor(1);
  yield* all(
    graph.edges[0].ref().lineWidth(graph.edges[0].ref().lineWidth() / sc, 1),
    graph.vertices[0].ref().scale(1, 1),
    graph.vertices[0].ref().position(
      graph.vertices[0]
        .ref()
        .position()
        .add(new Vector2(l / 2, l / 2)),
      1,
    ),
    graph.vertices[0].ref().fill(graph.palette[coloring[0]], 1),
  );
  yield* waitFor(1);

  // // highlight two vertices, then two cells of the sudoku

  // const vertexIndices = [0, 1];
  // const sudokuIndices = [[0, 0], [0, 4]];

  // yield* all(
  //     ...vertexIndices.map(i =>
  //         all(
  //             graph.vertices[vertexIndices[i]].ref().scale(2, 1),
  //             graph.vertices[vertexIndices[i]].ref().position(
  //                 graph.vertices[vertexIndices[i]].ref().position().add(new Vector2(0, -l / 2)),
  //                 1
  //             )
  //         )
  //     )
  // );
  // yield* waitFor(1);

  // yield* all(
  //     ...sudokuIndices.map(([row, col]) =>
  //         all(
  //             sudoku.cells[row][col].ref().position(
  //                 sudoku.cells[row][col].ref().position().add(new Vector2(0, -l / 2)),
  //                 1
  //             )
  //         )
  //     )
  // );

  // Wait to observe the colors and movements before ending the scene
  yield* waitFor(3);
});
