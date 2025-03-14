import { makeScene2D, Rect } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeOutBounce,
  linear,
  loop,
  useLogger,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { MarioAlgorithm } from '../components/mario_algorithm';
import { Solarized } from '../utilities';
import { nextTo, shift, toEdge } from '../utilities_moving';
import { PressedKey } from '../utilities_pressed_key';
import { MyTxt } from '../utilities_text';

const inputs = [
  '🠦🠥A🠦🠦🠦🠥A🠦🠦🠦🠦🠦🠦B🠦🠦🠥🠦🠦🠦', //←A→→→→←', //↑→↑→B→→→→→A→→→↑A→↑→→↑→→→B',
  'AB🠦🠤🠦🠤🠧🠧🠥🠥', // easter egg: Konami cheat sheet
];

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const marioAlgo = createRef<MarioAlgorithm>();
  const inputsMask = createRef<Rect>();

  // 2. Container for our keys
  const inputsContainer = createRef<Rect>();

  // Output UI references
  const outputTextRect = createRef<Rect>();
  const outputText1 = createRef<MyTxt>();
  const outputText2 = createRef<MyTxt>();

  view.add(
    <>
      <MarioAlgorithm zIndex={10} ref={marioAlgo} />

      <Rect
        ref={inputsMask}
        x={0}
        y={0}
        width={1000}
        height={1080}
        clip
        zIndex={2}
        layout={false}
        fill={Solarized.background}
        stroke={Solarized.background}
      />

      <Rect
        layout
        direction="row"
        gap={20}
        ref={inputsContainer}
        zIndex={1}
        x={0}
        y={0}
        alignItems="start"
        justifyContent="start"
      />

      {/* "No"/"Yes" text container */}
      <Rect
        layout
        ref={outputTextRect}
        direction="column"
        width={500}
        opacity={0}
        zIndex={7}
      >
        <MyTxt fontSize={130} fill={Solarized.red} textAlign="center" ref={outputText1}>
          No
        </MyTxt>
        <MyTxt fontSize={60} fill={Solarized.red} textAlign="center" ref={outputText2}>
          World record{'\n'}
          not broken
        </MyTxt>
      </Rect>
    </>,
  );

  nextTo(inputsMask(), marioAlgo(), 'right', 0);

  const logger = useLogger();

  // Loop twice (No/Yes)
  for (let it = 0; it < 2; it++) {
    // Clear old keys from previous pass
    inputsContainer().children([]);

    // Build a PressedKey for each character
    const chars = Array.from(inputs[it]);
    for (const c of chars) {
      inputsContainer().add(
        new PressedKey({
          text: c,
          fill: Solarized.base3,
          textColor: Solarized.base03,
          stroke: Solarized.base03,
          fontSize: 70,
          radius: 25,
        }),
      );
    }

    // Let layout recalc so inputsContainer().width() is correct
    yield;

    // Start fully off-screen to the left: negative X
    nextTo(inputsContainer(), view, 'left', 100);
    //inputsContainer().x(-inputsContainer().width());

    yield* waitFor(5);
    yield* inputsContainer().x(
      inputsContainer().width() / 2 + 100,
      it == 0 ? 4 : 3,
      linear,
    );

    // Update "No/Yes" text
    outputTextRect().x(100);
    outputText1().text(['No', 'Yes'][it]);
    outputText2().text(['World record\nnot broken', 'World record\nbroken'][it]);
    outputText1().fill([Solarized.red, Solarized.green][it]);
    outputText2().fill([Solarized.red, Solarized.green][it]);

    yield* all(
      outputTextRect().opacity(1, 1),
      outputTextRect().position.add([450, 0], 1),
    );

    yield* waitFor(1);
    yield* outputTextRect().opacity(0, 1);
  }

  yield* waitFor(2);
});
