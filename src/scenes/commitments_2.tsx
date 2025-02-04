import { makeScene2D, Rect, Txt } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInOutQuad,
  Reference,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

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
  const collisionSalt = '00100000';
  const hash = '0x72ab83de';
  const otherHashes = ['0x0deadbeef', '0x2cf79693a', '0x00dfd9b2b'];

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
      texts: [`“My box is ${hash}.”`],
    },
    {
      participant: 'verifier',
      texts: ['“Ok, could you open it?”'],
    },
    {
      participant: 'prover',
      texts: [`“It's ${color}. You can check using ${salt}.”`],
    },
    {
      participant: 'verifier',
      texts: [
        `hash(${color}${salt}) = ${hash}`, // first state: the hash is shown…
        ' ', // then (optionally) erase it (an empty string or whitespace)
        '“Looks good.”', // and finally, show the final message at the same position.
      ],
    },
    // {
    //   participant: 'verifier',
    //   texts: [`hash(${color}${salt}) = ${hash}`],
    // },
    // {
    //   participant: 'verifier',
    //   texts: ['“Looks good.”'],
    // },

    //   {
    //     participant: 'verifier',
    //     texts: ['“This matches the value you committed to.”', '“.”', '“Looks ok.”'],
    //   },
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
          y={-150 + index * 100 + 50}
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

  view.width(view.width() * 2);
  view.height(view.height() * 2);

  const shiftY = -300;
  yield* all(
    prover().position.add([0, shiftY], 1),
    verifier().position.add([0, shiftY], 1),
    view.scale(view.scale().mul(0.9), 1),
    view.position(view.position().add(new Vector2(0, 20)), 1),
  );

  const changeText = function* (textRef: Reference<Txt>, changeTo: string) {
    const lengthDelta = Math.abs(changeTo.length - textRef().text().length);
    const time = clamp(lengthDelta * 0.05, 0.5, 1.8);

    yield* textRef().text(changeTo, time, easeInOutQuad, textLerpWithDiff);
  };

  const highlights = [createRef<Rect>(), createRef<Rect>()];

  function* showWhySalt() {
    // Show why we need the salt
    yield* all(
      changeText(textRefs[0], `hash(${color}) = ${otherHashes[0]}`),
      changeText(textRefs[1], `“My box is ${otherHashes[0]}.”`),
    );
    verifier().expression('evil');
    yield* waitFor(1);
    const allColorHashesText =
      `hash(${otherColors[1]}) = ${otherHashes[2]}\n` +
      `hash(${color}) = ${otherHashes[0]}\n` +
      `hash(${otherColors[0]}) = ${otherHashes[1]}\n`;
    yield* changeText(textRefs[2], allColorHashesText);
    yield* waitFor(1);

    const width = 768;
    // textRefs[0]().add(
    view.add(
      <>
        <Rect
          fill={Solarized.base3}
          ref={highlights[0]}
          width={0}
          height={80}
          opacity={1}
          zIndex={-1}
          position={textRefs[0]().left()}
        ></Rect>
        ,
        <Rect
          fill={Solarized.base3}
          ref={highlights[1]}
          width={0}
          height={80}
          opacity={1}
          zIndex={-1}
          position={textRefs[2]().right().addX(-width)}
        ></Rect>
      </>,
    );

    yield* all(
      highlights[0]().position(
        highlights[0]()
          .position()
          .addX(width / 2),
        1,
      ),
      highlights[1]().position(
        highlights[1]()
          .position()
          .addX(width / 2),
        1,
      ),
      highlights[0]().width(width + 30, 1),
      highlights[1]().width(width + 30, 1),
    );

    yield* waitFor(1);
    // Reset to previous state
    yield* all(
      highlights[0]().width(0, 1),
      highlights[1]().width(0, 1),
      highlights[0]().position(highlights[0]().left(), 1),
      highlights[1]().position(highlights[1]().left(), 1),
    );
    yield* waitFor(1);
    yield* all(
      textRefs[2]().opacity(0, 1),
      changeText(textRefs[0], textsConfig[0].texts[textsConfig[0].texts.length - 1]),
      changeText(textRefs[1], textsConfig[1].texts[textsConfig[1].texts.length - 1]),
      delay(0.5, verifier().expression('neutral', 0)),
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
      if (i != textsConfig.length - 1 || j != 1) yield* waitFor(1);
    }
  }

  yield* all(...textRefs.map((r) => changeText(r, ' ')));
  yield* waitFor(1);

  yield* all(
    changeText(textRefs[0], `hash(${color}${salt}) = ${hash}`),
    changeText(textRefs[1], `hash(${otherColors[0]}${collisionSalt}) = ${hash}`),
  );
  yield* waitFor(1);

  const hashHighlightWidth = 375;
  highlights[0]().position(textRefs[0]().position().addX(100));
  highlights[1]().position(textRefs[1]().position().addX(165));
  yield* all(
    highlights[0]().width(hashHighlightWidth, 1),
    highlights[1]().width(hashHighlightWidth, 1),
  );
  yield* waitFor(1);

  const hardText = createRef<MyTxt>();
  view.add(
    <MyTxt
      ref={hardText}
      opacity={1}
      fill={Solarized.red}
      fontSize={150}
      y={200}
    ></MyTxt>,
  );
  yield* changeText(hardText, 'Hard!');
  yield* waitFor(5);
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
