import { Circle, Img, makeScene2D } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  easeInQuad,
  easeOutQuad,
  sequence,
  waitFor,
} from '@motion-canvas/core';

import keyImage from '../assets/images/key.svg';
import {
  Participant,
  PROVER_POSITION,
  VERIFIER_POSITION,
} from '../components/participant';
import { FONT_FAMILY, Solarized } from '../utilities';
import { Lock } from '../utilities_lock';
import { nextTo } from '../utilities_moving';
import { MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const prover = createRef<Participant>();
  const verifier = createRef<Participant>();
  const lock = createRef<Lock>();
  const circle = createRef<Circle>();
  const commitText = createRef<MyTxt>();
  const revealText = createRef<MyTxt>();
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
        key="circleToHide"
        size={200}
        fill={Solarized.red}
        zIndex={-1}
        position={PROVER_POSITION.addX(350)}
      />
      <Lock ref={lock} object={circle()} />
      <MyTxt
        ref={commitText}
        text={'Commit'}
        fontSize={70}
        fontFamily={FONT_FAMILY}
        fill={Solarized.text}
        opacity={0}
      />
      <MyTxt
        ref={revealText}
        text={'Reveal'}
        fontSize={70}
        fontFamily={FONT_FAMILY}
        fill={Solarized.text}
        opacity={0}
      />
      <Img ref={key} scale={[1, -1]} src={keyImage} opacity={0} width={150} />
    </>,
  );

  nextTo(commitText(), circle(), 'down', 100);

  //// Lock
  yield* waitFor(1);
  yield* all(lock().lock(2), commitText().opacity(1, 1));
  yield* circle().position(VERIFIER_POSITION.addX(-350), 1);

  yield* waitFor(2);
  //// Unlock
  nextTo(revealText(), circle(), 'down', 100);

  const passKey = function* () {
    nextTo(key(), prover(), 'right', 20);
    key().rotation(0);
    yield* all(
      key().opacity(1, 0.5),
      key().rotation(180, 1),
      key().position.x(verifier().position().x - 150, 1),
      key().position.y(-200, 0.5, easeInQuad).to(0, 0.5, easeOutQuad),
    );
  };

  const unlockUsingKey = function* () {
    yield* all(key().position.add([-50, 0], 1), key().opacity(0, 1), lock().unlock());
  };

  yield* all(revealText().opacity(1, 1), delay(0.5, passKey()));
  yield* unlockUsingKey();
  prover().expression('happy');
  verifier().expression('happy');
  yield* waitFor(2);
  prover().expression('neutral');
  verifier().expression('neutral');

  //// Peeking is not allowed
  yield* all(
    circle().position([0, 0], 1),
    lock().lock(),
    commitText().opacity(0, 1),
    revealText().opacity(0, 1),
  );
  yield* waitFor(2);

  yield* all(lock().seethrough(1, 0.5));
  verifier().expression('looking');
  prover().expression('alarmed');
  yield* waitFor(1);
  verifier().expression('neutral');
  prover().expression('neutral');
  yield* all(lock().unseethrough());

  //// The color cannot be changed
  yield* all(lock().unlock(1), circle().position(PROVER_POSITION.addX(350), 1));
  lock().opacity(1);
  yield* waitFor(1);

  // Pass to verifier
  prover().expression('evil');
  yield* lock().lock();
  circle().fill(Solarized.green);
  yield* sequence(0.5, circle().position(VERIFIER_POSITION.addX(-350), 1), passKey());

  // Open with a different color
  yield* unlockUsingKey();
  verifier().expression('happy');

  // prover().expression('embarrassed');
  // verifier().expression('alarmed');
  yield* waitFor(1);
});
