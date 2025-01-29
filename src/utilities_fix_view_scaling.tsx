import { makeScene2D as makeScene2DOld, Scene2D, View2D } from '@motion-canvas/2d';
import {
  DescriptionOf,
  PlaybackState,
  ThreadGeneratorFactory,
  Vector2,
} from '@motion-canvas/core';

import { alignTo } from './utilities_moving';

function fixRenderScaling(_view: View2D) {
  const view = _view.clone();
  view.scale(1);
  _view.add(view);
  view.position(Vector2.zero);
  return view;
}

export function makeScene2D(
  runner: ThreadGeneratorFactory<View2D>,
): DescriptionOf<Scene2D> {
  return makeScene2DOld(function* (_view) {
    const view = fixRenderScaling(_view);
    yield* runner(view);
  });
}
