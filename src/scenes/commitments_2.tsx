import { Latex, makeScene2D, Txt } from '@motion-canvas/2d';
import { all, createRef, easeInOutQuad, useLogger } from '@motion-canvas/core';
import { diffChars } from 'diff';

import { Solarized } from '../utilities';
import { MyTxt, customTextLerp as textLerpWithDiff } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const text = createRef<Txt>();

  view.add(
    <>
      <MyTxt ref={text} x={0} fontSize={100}></MyTxt>
    </>,
  );

  const color = 'red';
  const salt = '10101111';
  const hash = '00111000';

  const changeTo = function* (s: string) {
    yield* all(text().text(s, 1, easeInOutQuad, textLerpWithDiff));
  };

  yield* changeTo(`${color}`);
  yield* changeTo(`${color}${salt}`);
  yield* changeTo(`hash(${color}${salt})`);
  yield* changeTo(`hash(${color}${salt}) = ${hash}`);
  yield* changeTo(`"The hash is ${hash}."`);
});
