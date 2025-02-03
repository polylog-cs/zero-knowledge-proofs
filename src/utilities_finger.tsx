import { Img, Node, NodeProps, Rect, Shape, ShapeProps, Txt } from '@motion-canvas/2d';
import { createRef, Vector2 } from '@motion-canvas/core';

import pointingHand from './assets/images/pointing-hand-raw.png';
import { Solarized } from './utilities';

export interface FingerProps extends ShapeProps {
  padding?: number;
}

export class Finger extends Shape {
  public constructor(props?: FingerProps) {
    props.cache = true;
    super({ ...props });
    const img = createRef<Img>();
    this.add(
      <Img
        src={pointingHand}
        scale={new Vector2(-1, 1).mul(0.001)}
        position={[0.488 + (props.padding ?? 0), 0.129]}
        ref={img}
      >
        <Rect
          fill={this.fill() ?? Solarized.base01}
          width={() => img()?.width()}
          height={() => img()?.height()}
          compositeOperation={'source-in'}
        />
      </Img>,
    );
  }
}
