import {
  Circle,
  Img,
  Layout,
  Line,
  makeScene2D,
  Node,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  createRefMap,
  delay,
  easeOutElastic,
  Random,
  sequence,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import minePath from '../assets/images/minesweeper.png';
import tuxPath from '../assets/images/tux_hacked.png';
import { MarioAlgorithm } from '../components/mario_algorithm';
import { fontSize, Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { clues, solution, Sudoku } from '../utilities_sudoku';
import { MyLatex } from '../utilities_text';
import discussion_3 from './discussion_3';

/**
 * The original easeInOutCubic function
 * @param t - Input value between 0 and 1
 * @returns Eased value between 0 and 1
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Inverse function of easeInOutCubic
 * @param y - Eased value between 0 and 1
 * @returns Original input value between 0 and 1
 */
function inverseEaseInOutCubic(y: number): number {
  // Ensure input is in valid range
  if (y < 0 || y > 1) {
    throw new Error('Input must be between 0 and 1');
  }

  // For the first half (y < 0.5), we need to solve: y = 4 * t * t * t
  if (y < 0.5) {
    // Solving cubic equation: 4t³ = y
    // t = ∛(y/4)
    return Math.cbrt(y / 4);
  }
  // For the second half (y >= 0.5), we need to solve: y = 1 - Math.pow(-2 * t + 2, 3) / 2
  else {
    // Rearranging: 1 - y = Math.pow(-2 * t + 2, 3) / 2
    // 2(1 - y) = Math.pow(-2 * t + 2, 3)
    // ∛(2(1 - y)) = -2 * t + 2
    // -∛(2(1 - y)) + 2 = 2 * t
    // (-∛(2(1 - y)) + 2) / 2 = t
    return (-Math.cbrt(2 * (1 - y)) + 2) / 2;
  }
}

/**
 * Inverse of easeInOutQuad
 * @param y - Eased value between 0 and 1
 * @returns Original input value between 0 and 1
 */
function inverseEaseInOutQuad(y: number): number {
  // Ensure input is in valid range
  if (y < 0 || y > 1) {
    throw new Error('Input must be between 0 and 1');
  }

  // For the first half (y < 0.5), we need to solve: y = 2 * t * t
  if (y < 0.5) {
    // Solving: y = 2t²
    // t = √(y/2)
    return Math.sqrt(y / 2);
  }
  // For the second half (y >= 0.5), we need to solve: y = 1 - Math.pow(-2 * t + 2, 2) / 2
  else {
    // Rearranging: 1 - y = Math.pow(-2 * t + 2, 2) / 2
    // 2(1 - y) = Math.pow(-2 * t + 2, 2)
    // √(2(1 - y)) = -2 * t + 2
    // -√(2(1 - y)) + 2 = 2 * t
    // (-√(2(1 - y)) + 2) / 2 = t
    return (-Math.sqrt(2 * (1 - y)) + 2) / 2;
  }
}

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  // Create Sudoku instance
  const sudoku = new Sudoku(9, 95, solution, clues);
  const sudokuNode = sudoku.getLayout();
  sudokuNode.position([0, -400]);

  // Add Sudoku layout to the view
  view.add(sudokuNode);

  // Fill in non-clue cells with initial blur effect
  yield* sudoku.fillInNonClues(8);

  yield* waitFor(1);

  yield* sudoku.setBlur(0);

  const textMapping = ['⭐️', '❤️', '🍊', '🧠', '🙆‍♀️', '🧤', '🎩', '🦋', '🫖'];
  for (let c = 1; c <= 9; c++) {
    for (let i = 0; i < sudoku.cells.length; i++) {
      for (let j = 0; j < sudoku.cells[i].length; j++) {
        if (solution[i][j] === c) {
          sudoku.cells[i][j].textRef().text(textMapping[c - 1]);
        }
      }
    }
    yield* waitFor(1 / c);
  }

  yield* waitFor(1);

  const rectRefs = createRefMap<Rect>();

  const sudokuToAbsolute = (pos: [number, number]) => {
    return sudoku
      .layoutRef()
      .topLeft()
      .add([sudoku.cellSize * pos[0], sudoku.cellSize * pos[1]]);
  };

  view.add(
    <>
      <Rect
        ref={rectRefs.a}
        size={[sudoku.cellSize, sudoku.cellSize]}
        topLeft={sudokuToAbsolute([0, 0])}
        stroke={Solarized.red}
        lineWidth={0}
      />
    </>,
  );

  const hidingRectRefs = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => createRef<Rect>()),
  );

  const rng = new Random(1451);

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const center = sudokuToAbsolute([i, j]).add([
        sudoku.cellSize / 2,
        sudoku.cellSize / 2,
      ]);
      view.add(
        <Rect
          ref={hidingRectRefs[i][j]}
          size={[sudoku.cellSize * 0.9, sudoku.cellSize * 0.8]}
          position={center}
          fill={Solarized.yellow}
          stroke={Solarized.yellow}
          lineWidth={0}
          rotation={rng.nextFloat(-10, 10)}
          scale={0}
        >
          <Txt
            fontSize={0.5 * sudoku.cellSize}
            fill={Solarized.base00}
            text={'?'}
            fontFamily={'Helvetica Neue'}
          />
        </Rect>,
      );
    }
  }

  const progress = (i: number, j: number) => {
    const rawProgress = (i: number, j: number)  => i * 0.7 + j;
    const maxProgress = rawProgress(8, 8);
    return inverseEaseInOutQuad(0.05 + (rawProgress(i, j) / maxProgress) * 0.9);
  };

  yield* all(
    ...hidingRectRefs
      .map((row, i) =>
        row.map((ref, j) =>
          delay(progress(i, j) * 2, ref().scale(1, 0.6, easeOutElastic)),
        ),
      )
      .flat(),
  );

  yield* rectRefs.a().lineWidth(3, 1);

  yield* waitFor(3);
});
