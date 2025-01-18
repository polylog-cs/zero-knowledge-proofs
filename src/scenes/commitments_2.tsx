import { Latex, makeScene2D, Rect, Txt } from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutQuad,
  Reference,
  useLogger,
  waitFor,
} from '@motion-canvas/core';
import { diffChars } from 'diff';

import {
  Participant,
  PROVER_POSITION,
  VERIFIER_POSITION,
} from '../components/participant';
import { Solarized } from '../utilities';
import { MyTxt, customTextLerp as textLerpWithDiff } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const prover = createRef<Participant>();
  const verifier = createRef<Participant>();

  const color = 'red';
  const otherColors = ['green', 'blue'];
  const salt = '10101111';
  const hash = '00111000';
  const otherHashes = [
    '11110100',
    '11001111',
    '01010000',
    '10110001',
    '01101000',
    '11101101',
    '00100000',
    '10111011',
  ];

  const textsConfig = [
    {
      participant: 'prover',
      texts: [
        `${color}`,
        `${color}${salt}`,
        `hash(${color}${salt})`,
        `hash(${color}${salt}) = ${hash}`,
      ],
    },
    {
      participant: 'prover',
      texts: [`"My box is ${hash}."`],
    },
    {
      participant: 'verifier',
      texts: ['"Ok, could you open it?"'],
    },
    {
      participant: 'prover',
      texts: [`"It's ${color}. You can check using ${salt}."`],
    },
    {
      participant: 'verifier',
      texts: [`hash(${color}${salt}) = ${hash}`],
    },
    {
      participant: 'verifier',
      texts: ['"This matches the value you committed to."', '"Looks ok."'],
    },
  ];

  view.add(
    <>
      <Participant
        kind={'prover'}
        ref={prover}
        position={PROVER_POSITION}
      ></Participant>
      <Participant
        kind={'verifier'}
        ref={verifier}
        position={VERIFIER_POSITION}
      ></Participant>
    </>,
  );

  const textRefs: Reference<Txt>[] = textsConfig.map(
    ({ participant, texts }, index) => {
      const ref = createRef<Txt>();

      view.add(
        <MyTxt
          x={participant === 'prover' ? -100 : 100}
          y={-100 + index * 100}
          fontSize={70}
          fill={
            participant === 'prover' ? Solarized.proverText : Solarized.verifierText
          }
          textAlign={participant === 'prover' ? 'left' : 'right'}
          width={1500}
          ref={ref}
        ></MyTxt>,
      );

      return ref;
    },
  );

  const shiftY = -300;
  yield* all(
    prover().position.add([0, shiftY], 1),
    verifier().position.add([0, shiftY], 1),
  );

  const changeText = function* (textRef: Reference<Txt>, changeTo: string) {
    const lengthDelta = Math.abs(changeTo.length - textRef().text().length);
    const time = clamp(lengthDelta * 0.05, 0.5, 1.8);

    yield* textRef().text(changeTo, time, easeInOutQuad, textLerpWithDiff);
  };

  function* showWhySalt() {
    // Show why we need the salt
    yield* all(
      changeText(textRefs[0], `hash(${color}) = ${otherHashes[0]}`),
      changeText(textRefs[1], `"My box is ${otherHashes[0]}."`),
    );
    yield* waitFor(1);
    const allColorHashesText =
      `hash(${otherColors[1]}) = ${otherHashes[2]}\n` +
      `hash(${color}) = ${otherHashes[0]}\n` +
      `hash(${otherColors[0]}) = ${otherHashes[1]}\n`;
    yield* changeText(textRefs[2], allColorHashesText);
    yield* waitFor(1);

    const highlights = [createRef<Rect>(), createRef<Rect>()];
    // textRefs[0]().add(
    view.add(
      <>
        <Rect
          fill={Solarized.base02}
          ref={highlights[0]}
          width={0}
          height={80}
          opacity={1}
          zIndex={-1}
          position={textRefs[0]().position().addX(-400)}
        ></Rect>
        ,
        <Rect
          fill={Solarized.base02}
          ref={highlights[1]}
          width={0}
          height={80}
          opacity={1}
          zIndex={-1}
          position={textRefs[2]().right().addX(-320)}
        ></Rect>
      </>,
    );

    const expandedWidth = 740;
    yield* all(
      highlights[0]().width(expandedWidth, 1),
      highlights[1]().width(expandedWidth, 1),
    );

    yield* waitFor(1);
    // Reset to previous state
    yield* all(
      highlights[0]().width(0, 1),
      highlights[1]().width(0, 1),
      changeText(textRefs[0], textsConfig[0].texts[textsConfig[0].texts.length - 1]),
      changeText(textRefs[1], textsConfig[1].texts[textsConfig[1].texts.length - 1]),
      textRefs[2]().opacity(0, 1),
    );
    yield* waitFor(1);

    textRefs[2]().opacity(1);
    textRefs[2]().text('');
  }

  for (let i = 0; i < textsConfig.length; i++) {
    const textConfig = textsConfig[i];
    const textRef = textRefs[i];

    if (i === 2) {
      yield* showWhySalt();
    }

    for (let j = 0; j < textConfig.texts.length; j++) {
      const text = textConfig.texts[j];
      yield* changeText(textRef, text);
      yield* waitFor(1);
    }
  }
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
