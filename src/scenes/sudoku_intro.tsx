import { Circle, Node, Rect, Txt, Layout, makeScene2D, blur } from '@motion-canvas/2d';
import {
  Solarized,
  Sudoku,
  gridSize,
  cellSize,
  solution,
  clues,
  fontSize,
} from '../utilities';
import { all, createRef, createSignal, sequence, waitFor } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  // Create Sudoku instance
  const sudoku = new Sudoku(gridSize, cellSize, solution, clues);

  // Add Sudoku layout to the view
  view.add(sudoku.getLayout());

  // Fill in non-clue cells with initial blur effect
  yield* sudoku.fillInNonClues(8);

  yield* waitFor(1);

  yield* sudoku.blur_nonClues(0);

  yield* waitFor(1);

  yield* sudoku.blur_nonClues(8);

  yield* waitFor(3);
});
