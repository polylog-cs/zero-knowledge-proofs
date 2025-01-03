import { makeScene2D } from '@motion-canvas/2d';
import { createRef, waitFor } from '@motion-canvas/core';

import { Participant } from '../components/participant';
import { Solarized } from '../utilities';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const prover = createRef<Participant>();

  view.add(<Participant ref={prover} position={[0, 0]}></Participant>);

  yield* waitFor(2);
  prover().expression('embarrassed');

  yield* waitFor(10);
});
