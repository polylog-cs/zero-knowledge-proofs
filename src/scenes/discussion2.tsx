import { makeScene2D } from '@motion-canvas/2d';
import { waitFor } from '@motion-canvas/core';

import { Solarized } from '../utilities';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  yield* waitFor(3);
});
