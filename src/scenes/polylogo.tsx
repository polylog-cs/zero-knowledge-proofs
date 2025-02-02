import { makeScene2D } from '@motion-canvas/2d';
import { createRef, tween, waitFor } from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { MyTxt, Write } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const polylog = createRef<MyTxt>();
  view.add(
    <MyTxt ref={polylog} fontSize={200}>
      polylog
    </MyTxt>,
  );
  yield* Write(polylog(), 1.5, undefined, 2);
  yield* waitFor(3);
});
