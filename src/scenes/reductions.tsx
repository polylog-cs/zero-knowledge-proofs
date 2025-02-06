import { Img, Layout, Line, makeScene2D, Node } from '@motion-canvas/2d';
import { all, chain, createRef, Vector2, waitFor } from '@motion-canvas/core';

import minePath from '../assets/images/minesweeper.png';
import tuxPath from '../assets/images/tux.png';
import { MarioAlgorithm } from '../components/mario_algorithm';
import { fontSize, Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { clues, solution, Sudoku } from '../utilities_sudoku';
import { MyLatex } from '../utilities_text';

export default makeScene2D(function* (view) {
  // ------------------------------
  // 1) Background + Central Graph
  // ------------------------------
  view.fill(Solarized.base2);

  const g = new Graph(75);
  g.initialize(exampleGraphData);
  const graph = g.getGraphLayout();
  graph.scale(1.25);
  view.add(graph);

  // Animate the graph into the scene
  yield* g.fadeIn(1);
  yield* g.applyColors();
  yield* graph.scale(0.5, 1);

  // We'll consider the center to be at (0,0)
  // so item final positions are around it in a circle
  const center = new Vector2(0, 0);

  // ------------------------------
  // 2) Circle Layout Parameters
  // ------------------------------
  const totalItems = 5;
  // Items slide from a large radius inward
  const initialRadius = 800;
  // to a smaller final radius
  const finalRadius = 400;
  // Starting angle offset
  const alphaAngle = -125;
  // Uniform height for all objects
  const desiredHeight = 230;

  const arrowParams = [
    { alpha: 0.3, beta: 0.6 }, // Sudoku
    { alpha: 0.25, beta: 0.6 }, // Mario
    { alpha: 0.3, beta: 0.7 }, // Tux
    { alpha: 0.3, beta: 0.6 }, // Zeta
    { alpha: 0.3, beta: 0.7 }, // Minesweeper
  ];

  const offsets = [
    [-55, -15],
    [60, -30],
    [0, 0],
    [0, 0],
    [-80, 0],
  ].map((i) => new Vector2(i[0], i[1]));

  // Utility: angle for item i
  function getAngleDeg(i: number): number {
    return alphaAngle + (i * 360) / totalItems;
  }

  // Utility: get position on a circle of radius r at angleDeg
  function getCirclePos(radius: number, angleDeg: number): Vector2 {
    const rad = (Math.PI / 180) * angleDeg;
    return new Vector2(radius * Math.cos(rad), radius * Math.sin(rad));
  }

  // Utility: scale the node so that it has a certain "height"
  function setUniformHeight(node: Layout, targetHeight: number) {
    node.cacheBBox();
    const size = node.size();
    if (size.y <= 0) return;
    const factor = targetHeight / size.y;
    node.scale(factor);
    return node;
  }

  // Parametric combination: (1 - alpha)*Y + alpha*X
  function paramPoint(X: Vector2, Y: Vector2, alpha: number) {
    return new Vector2(
      (1 - alpha) * X.x + alpha * Y.x,
      (1 - alpha) * X.y + alpha * Y.y,
    );
  }

  // Create and reveal an arrow from paramPoint(...alpha) to paramPoint(...beta)
  function createArrow(finalPos: Vector2, index: number) {
    // Extract alpha_i, beta_i for this item
    const { alpha, beta } = arrowParams[index];

    const start = paramPoint(finalPos, center, alpha);
    const end = paramPoint(finalPos, center, beta);

    const arrowLineRef = createRef<Line>();
    view.add(
      <Line
        ref={arrowLineRef}
        lineWidth={8}
        stroke={Solarized.base01}
        endArrow // arrowhead on the "end" point
        arrowSize={20}
        points={[start, end]}
        opacity={0}
      />,
    );
    return arrowLineRef;
  }

  const objects: Node[] = [];
  const sudoku = new Sudoku(9, 55, solution, clues);
  objects.push(setUniformHeight(sudoku.getLayout() as Layout, desiredHeight));

  objects.push(setUniformHeight(new MarioAlgorithm(), desiredHeight));

  objects.push(setUniformHeight((<Img src={tuxPath} />) as Layout, desiredHeight));

  objects.push(
    setUniformHeight(
      (
        <MyLatex
          tex={'\\zeta(s)=\\sum_{n=1}^{\\infty}\\frac{1}{n^s}'}
          fontSize={fontSize}
        />
      ) as Layout,
      desiredHeight * 0.7,
    ),
  );

  objects.push(setUniformHeight((<Img src={minePath} />) as Layout, desiredHeight));

  const anims = [];
  for (let i = 0; i < 5; i++) {
    objects[i].opacity(0);
    view.add(objects[i]);
    const angle = getAngleDeg(i);
    const initialPos = getCirclePos(initialRadius, angle);
    const finalPos = getCirclePos(finalRadius, angle);
    objects[i].position(initialPos);
    const arrow = createArrow(finalPos, i);
    view.add(arrow);
    anims.push(
      all(objects[i].position(finalPos.add(offsets[i]), 1), objects[i].opacity(1, 1)),
    );
    anims.push(arrow().opacity(0.7, 1));
  }

  yield* chain(...anims);

  // Wait a bit at the end
  yield* waitFor(3);
});
