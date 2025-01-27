import { Img, makeScene2D, Rect, Txt } from '@motion-canvas/2d';
import { all, createRef, linear, useLogger, waitFor } from '@motion-canvas/core';

import { MarioAlgorithm } from '../components/mario_algorithm';
import { Solarized } from '../utilities';
import { MyTxt } from '../utilities_text';

const inputs = [
  '→→A→→→←A→→→→→→B→→A→→→←A→→→→←→→B→→→→→A→→→←AA→→→→→→B',
  'B→→→→→→AA←→→→A→→→→→B→→←→→→→A←→→→A→→B→→→→→→A←→→→A→→',
];

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  let inputsText = createRef<MyTxt>();
  let outputTextRect = createRef<Rect>();
  let outputText1 = createRef<MyTxt>();
  let outputText2 = createRef<MyTxt>();

  view.add(
    <>
      <MarioAlgorithm zIndex={10} />
      <MyTxt fontSize={100} ref={inputsText}></MyTxt>
      {/* A rectangle to cover the text in the right half */}
      <Rect
        width={2000}
        x={1000}
        height={2000}
        fill={Solarized.base2}
        zIndex={5}
      ></Rect>
      <Rect
        layout
        ref={outputTextRect}
        direction={'column'}
        width={500}
        opacity={0}
        zIndex={7}
      >
        <MyTxt
          fontSize={130}
          fill={Solarized.red}
          textAlign={'center'}
          ref={outputText1}
        >
          No
        </MyTxt>
        <MyTxt
          fontSize={60}
          fill={Solarized.red}
          textAlign={'center'}
          ref={outputText2}
        >
          World record{'\n'}
          not broken
        </MyTxt>
      </Rect>
    </>,
  );

  const logger = useLogger();

  // "No" for the first input, "Yes" for the second input.
  for (let it = 0; it < 2; it++) {
    inputsText().text(inputs[it]);
    outputTextRect().x(100);

    outputText1().text(['No', 'Yes'][it]);
    outputText2().text(['World record\nnot broken', 'World record\nbroken'][it]);
    outputText1().fill([Solarized.red, Solarized.green][it]);
    outputText2().fill([Solarized.red, Solarized.green][it]);

    inputsText().x(-inputsText().width());

    yield* inputsText().x(inputsText().width() / 2, 4, linear);

    yield* all(
      outputTextRect().opacity(1, 1),
      outputTextRect().position.add([450, 0], 1),
    );

    yield* waitFor(1);
    yield* outputTextRect().opacity(0, 1);
  }

  yield* waitFor(2);
});
