import { Circle, Img, Layout, makeScene2D, Txt } from '@motion-canvas/2d';
import { all, chain, createRef, waitFor } from '@motion-canvas/core';

import keyImage from '../assets/images/key.png';
import {
  Participant,
  PROVER_POSITION,
  VERIFIER_POSITION,
} from '../components/participant';
import { FONT_FAMILY, Solarized } from '../utilities';
import { Lock } from '../utilities_lock';
import { nextTo } from '../utilities_moving';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const prover = createRef<Participant>();
  const verifier = createRef<Participant>();
  const lock = createRef<Lock>();
  const circle = createRef<Circle>();
  const commitText = createRef<Txt>();
  const revealText = createRef<Txt>();
  const key = createRef<Img>();

  view.add(
    <>
      <Participant
        kind={'prover'}
        ref={prover}
        position={PROVER_POSITION}
      ></Participant>
      ,
      <Participant
        kind={'verifier'}
        ref={verifier}
        position={VERIFIER_POSITION}
      ></Participant>
      <Circle
        ref={circle}
        size={200}
        fill={Solarized.red}
        zIndex={0}
        position={PROVER_POSITION.addX(350)}
      />
      <Lock ref={lock} object={circle()} />
      <Txt
        ref={commitText}
        text={'Commit'}
        fontSize={70}
        fontFamily={FONT_FAMILY}
        fill={Solarized.text}
        opacity={0}
      />
      <Txt
        ref={revealText}
        text={'Reveal'}
        fontSize={70}
        fontFamily={FONT_FAMILY}
        fill={Solarized.text}
        opacity={0}
      />
      <Img ref={key} scale={[1, -1]} src={keyImage} opacity={0} />
    </>,
  );

  nextTo(commitText(), circle(), 'down', 100);

  yield* waitFor(1);
  yield* all(lock().lock(), commitText().opacity(1, 1));
  yield* circle().position(VERIFIER_POSITION.addX(-350), 1);

  nextTo(revealText(), circle(), 'down', 100);

  nextTo(key(), prover(), 'right', 20);
  yield* key().opacity(1, 0.5);
  yield* all(
    key().rotation(180, 1),
    key().position.x(verifier().position().x - 150, 1),
    key().position.y(-150, 0.5).to(0, 0.5),
  );
  yield* all(
    revealText().opacity(1, 1),
    key().position.add([-50, 0], 1),
    key().opacity(0, 1),
    lock().unlock(),
  );
  yield* waitFor(3);
});
