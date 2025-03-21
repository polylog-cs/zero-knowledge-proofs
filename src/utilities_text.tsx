import { Latex, LatexProps, Shape, Txt, TxtProps } from '@motion-canvas/2d';
import { Color, tween } from '@motion-canvas/core';
import chroma from 'chroma-js';
import { diffChars } from 'diff';

import timedGradientShader from './shaders/timedgradient.glsl';
import { FONT_FAMILY, Solarized } from './utilities';

const TEXT_SIZE: number = 30;

export class MyTxt extends Txt {
  constructor(props: TxtProps) {
    super({
      fontFamily: FONT_FAMILY,
      fill: Solarized.text,
      fontSize: TEXT_SIZE,
      ...props,
    });
  }
}

export class MyLatex extends Latex {
  constructor(props: LatexProps) {
    super({
      fontFamily: FONT_FAMILY,
      fill: Solarized.text,
      fontSize: TEXT_SIZE,
      ...props,
    });
  }
}

/**
 * A smarter interpolation function for strings that takes into account the diff
 * and keeps the changes in the same order.
 *
 * Currently it looks a bit less smooth when inserting characters at the beginning
 * because that leads to the whole string being shifted by the centering.
 */
export function customTextLerp(fromString: string, toString: string, value: number) {
  const changes = diffChars(fromString, toString);

  const totalChanges = changes
    .map((change) => (change.added || change.removed ? change.count : 0))
    .reduce((acc, change) => acc + change);

  let text = '';
  let changesToDo = value * totalChanges; // Note that this is a float

  for (const change of changes) {
    if (change.removed) {
      for (let i = 0; i < change.count; i++) {
        if (changesToDo > 0) {
          changesToDo--;
        } else {
          text += change.value[i];
        }
      }
    }

    if (change.added) {
      for (let i = 0; i < change.count; i++) {
        if (changesToDo > 0) {
          text += change.value[i];
          changesToDo--;
        }
      }
    }

    if (!change.added && !change.removed) {
      text += change.value;
    }
  }

  return text;
}

export function* Write(
  object: Shape,
  duration: number = 1,
  gradientWidth: number = 0.1,
  strokeWidth: number = 1,
) {
  object.shaders({
    fragment: timedGradientShader,
    uniforms: {
      gradientWidth: gradientWidth,
      strokeWidth: strokeWidth * object.view().absoluteScale().magnitude,
    },
  });
  yield* tween(duration, (t) => {
    object.shaders()[0].uniforms['t'] = t;
  });
}
