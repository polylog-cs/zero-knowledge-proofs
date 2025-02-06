import { Img, Layout, Line, makeScene2D } from '@motion-canvas/2d';
import { all, createRef, Vector2, waitFor } from '@motion-canvas/core';

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
  const initialRadius = 1500;
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
  function setUniformHeight(node: Layout | Img | MyLatex, targetHeight: number) {
    node.cacheBBox();
    const size = node.size();
    if (size.y <= 0) return;
    const factor = targetHeight / size.y;
    node.scale(factor);
  }

  // Parametric combination: (1 - alpha)*Y + alpha*X
  function paramPoint(X: Vector2, Y: Vector2, alpha: number) {
    return new Vector2(
      (1 - alpha) * X.x + alpha * Y.x,
      (1 - alpha) * X.y + alpha * Y.y,
    );
  }

  // Create and reveal an arrow from paramPoint(...alpha) to paramPoint(...beta)
  function createArrow(
    itemRef: Layout | Img | MyLatex,
    finalPos: Vector2,
    index: number,
  ) {
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

  // ------------------------------
  //  1) Sudoku
  // ------------------------------
  const sudoku = new Sudoku(9, 55, solution, clues);
  const sudokuLayout = sudoku.getLayout();
  view.add(sudokuLayout);
  setUniformHeight(sudoku.layoutRef(), desiredHeight);

  const sudokuAngle = getAngleDeg(0);
  const sudokuFinalPos = getCirclePos(finalRadius, sudokuAngle);
  const sudokuInitialPos = getCirclePos(initialRadius, sudokuAngle);

  sudoku.layoutRef().position.x(sudokuInitialPos.x);
  sudoku.layoutRef().position.y(sudokuInitialPos.y);

  yield* all(
    sudoku.layoutRef().position.x(sudokuFinalPos.x - 55, 1),
    sudoku.layoutRef().position.y(sudokuFinalPos.y - 15, 1),
  );

  // Arrow from param combos
  const sudokuArrowRef = createArrow(sudoku.layoutRef(), sudokuFinalPos, 0);
  yield* sudokuArrowRef().opacity(1, 0.7);

  // ------------------------------
  //  2) MarioAlgorithm
  // ------------------------------
  const algorithmRef = createRef<MarioAlgorithm>();
  view.add(<MarioAlgorithm ref={algorithmRef} />);
  setUniformHeight(algorithmRef(), desiredHeight);

  const algAngle = getAngleDeg(1);
  const algFinalPos = getCirclePos(finalRadius, algAngle);
  const algInitialPos = getCirclePos(initialRadius, algAngle);

  algorithmRef().position.x(algInitialPos.x);
  algorithmRef().position.y(algInitialPos.y);

  yield* all(
    algorithmRef().position.x(algFinalPos.x + 60, 1),
    algorithmRef().position.y(algFinalPos.y - 30, 1),
  );

  const algArrowRef = createArrow(algorithmRef(), algFinalPos, 1);
  yield* algArrowRef().opacity(1, 0.7);

  // ------------------------------
  //  3) Tux
  // ------------------------------
  const tuxRef = createRef<Img>();
  view.add(<Img ref={tuxRef} src={tuxPath} smoothing={true} />);
  setUniformHeight(tuxRef(), desiredHeight);

  const tuxAngle = getAngleDeg(2);
  const tuxFinalPos = getCirclePos(finalRadius, tuxAngle);
  const tuxInitialPos = getCirclePos(initialRadius, tuxAngle);

  tuxRef().position.x(tuxInitialPos.x);
  tuxRef().position.y(tuxInitialPos.y);

  yield* all(
    tuxRef().position.x(tuxFinalPos.x, 1),
    tuxRef().position.y(tuxFinalPos.y, 1),
  );

  const tuxArrowRef = createArrow(tuxRef(), tuxFinalPos, 2);
  yield* tuxArrowRef().opacity(1, 0.7);

  // ------------------------------
  //  4) Zeta Equation (SWAPPED)
  // ------------------------------
  const equationRef = createRef<MyLatex>();
  view.add(
    <MyLatex
      ref={equationRef}
      tex={'\\zeta(s)=\\sum_{n=1}^{\\infty}\\frac{1}{n^s}'}
      fontSize={fontSize}
    />,
  );
  setUniformHeight(equationRef(), desiredHeight * 0.7);

  const eqAngle = getAngleDeg(3);
  const eqFinalPos = getCirclePos(finalRadius, eqAngle);
  const eqInitialPos = getCirclePos(initialRadius, eqAngle);

  equationRef().position.x(eqInitialPos.x);
  equationRef().position.y(eqInitialPos.y);

  yield* all(
    equationRef().position.x(eqFinalPos.x, 1),
    equationRef().position.y(eqFinalPos.y, 1),
  );

  const eqArrowRef = createArrow(equationRef(), eqFinalPos, 3);
  yield* eqArrowRef().opacity(1, 0.7);

  // ------------------------------
  //  5) Minesweeper (SWAPPED last)
  // ------------------------------
  const minesweeperRef = createRef<Img>();
  view.add(<Img ref={minesweeperRef} src={minePath} smoothing={true} />);
  setUniformHeight(minesweeperRef(), desiredHeight);

  const mineAngle = getAngleDeg(4);
  const mineFinalPos = getCirclePos(finalRadius, mineAngle);
  const mineInitialPos = getCirclePos(initialRadius, mineAngle);

  minesweeperRef().position.x(mineInitialPos.x);
  minesweeperRef().position.y(mineInitialPos.y);

  yield* all(
    minesweeperRef().position.x(mineFinalPos.x - 80, 1),
    minesweeperRef().position.y(mineFinalPos.y, 1),
  );

  const mineArrowRef = createArrow(minesweeperRef(), mineFinalPos, 4);
  yield* mineArrowRef().opacity(1, 0.7);

  // Wait a bit at the end
  yield* waitFor(3);
});
