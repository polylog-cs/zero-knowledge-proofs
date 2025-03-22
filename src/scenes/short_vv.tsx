import { Camera, Layout, makeScene2D, Rect, Txt } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInElastic,
  easeOutElastic,
  Random,
  waitFor,
} from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { clues, solution, Sudoku } from '../utilities_sudoku';

/**
 * Inverse of easeInOutQuad
 * @param y - Eased value between 0 and 1
 * @returns Original input value between 0 and 1
 */
function inverseEaseInOutQuad(y: number): number {
  if (y < 0 || y > 1) {
    throw new Error('Input must be between 0 and 1');
  }

  if (y < 0.5) {
    return Math.sqrt(y / 2);
  } else {
    return (-Math.sqrt(2 * (1 - y)) + 2) / 2;
  }
}

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  // Create Sudoku instance
  const sudoku = new Sudoku(9, 95, solution, clues);
  const sudokuNode = sudoku.getLayout();
  sudokuNode.position([0, -400]);

  const camera = createRef<Camera>();
  // Not sure why, but elements added later to the camera view
  // don't appear unless I use this extra layout and add them here.
  const outer = createRef<Layout>();

  // Add Sudoku layout to the view
  view.add(
    <Camera ref={camera}>
      <Layout ref={outer}>{sudokuNode}</Layout>
    </Camera>,
  );

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

  const sudokuToAbsolute = (pos: [number, number]) => {
    return sudoku
      .layoutRef()
      .topLeft()
      .add([sudoku.cellSize * pos[0], sudoku.cellSize * pos[1]]);
  };

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
      outer().add(
        <Rect
          ref={hidingRectRefs[i][j]}
          size={[sudoku.cellSize * 0.9, sudoku.cellSize * 0.8]}
          position={center}
          fill={Solarized.yellow}
          stroke={Solarized.yellow}
          lineWidth={0}
          rotation={rng.nextFloat(-5, 5)}
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
    const rawProgress = (i: number, j: number) => i * 0.7 + j;
    const maxProgress = rawProgress(8, 8);
    return inverseEaseInOutQuad(0.05 + (rawProgress(i, j) / maxProgress) * 0.9);
  };

  const revealRect = (
    i1: number,
    j1: number,
    i2: number,
    j2: number,
    totalDelay: number,
  ) => {
    return all(
      ...hidingRectRefs
        .map((row, i) =>
          row.map((ref, j) => {
            const isOut = i < i1 || i > i2 || j < j1 || j > j2;
            return delay(
              progress(i, j) * totalDelay,
              ref().scale(isOut ? 1 : 0, 0.5, isOut ? easeOutElastic : easeInElastic),
            );
          }),
        )
        .flat(),
    );
  };

  const hideAll = (totalDelay: number) => {
    return revealRect(-1, -1, -1, -1, totalDelay);
  };

  yield* hideAll(2);
  yield* waitFor(1);

  // Row
  yield* revealRect(0, 2, 8, 2, 1);
  yield* waitFor(1);
  // Column
  yield* revealRect(5, 0, 5, 8, 1);
  yield* waitFor(0.5);
  // Box
  yield* revealRect(3, 0, 5, 2, 1);
  yield* waitFor(0.5);

  yield* all(camera().centerOn(sudokuToAbsolute([4.5, 3]), 1.5), camera().zoom(3, 1.5));

  sudoku.cells[7][0].textRef().text(textMapping[0]);

  const timeRezoom = 2.5;
  yield* all(
    camera().centerOn(sudokuToAbsolute([1.5, 7 + 2]), timeRezoom),
    revealRect(0, 6, 2, 8, timeRezoom),
    camera()
      .zoom(2, timeRezoom / 2)
      .to(3, timeRezoom / 2),
  );

  yield* waitFor(3);
  yield* revealRect(0, 0, 8, 8, 5);
});
