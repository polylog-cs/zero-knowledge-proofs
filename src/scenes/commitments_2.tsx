import { Latex, makeScene2D, Txt } from '@motion-canvas/2d';
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
  const salt = '10101111';
  const hash = '00111000';

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

  for (let i = 0; i < textsConfig.length; i++) {
    const textConfig = textsConfig[i];
    const textRef = textRefs[i];

    for (let j = 0; j < textConfig.texts.length; j++) {
      const text = textConfig.texts[j];

      const lengthDelta = text.length - (textConfig.texts[j - 1] || '').length;
      const time = clamp(lengthDelta * 0.05, 0.5, 3);

      yield* textRef().text(text, time, easeInOutQuad, textLerpWithDiff);
      yield* waitFor(1);
    }
  }
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
