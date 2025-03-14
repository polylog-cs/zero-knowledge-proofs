import { makeScene2D } from '@motion-canvas/2d';
import { all, useLogger, Vector2, waitFor } from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { shift } from '../utilities_moving';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);
  shift(scene.containerRef(), new Vector2(0, 50));

  yield* scene.setup('prover', false);

  yield* scene.basicProtocol();
  yield* waitFor(3);
});
