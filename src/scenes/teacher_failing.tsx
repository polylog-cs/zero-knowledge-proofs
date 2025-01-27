import { makeScene2D } from '@motion-canvas/2d';

import { terriblehack } from './teacher';

export default makeScene2D(function* (view) {
  yield* terriblehack(view, true);
});
