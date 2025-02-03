import { Line, LineSegment, Node, NodeProps } from '@motion-canvas/2d';

import { Solarized } from '../utilities';

export class Tick extends Node {
  public constructor(props?: NodeProps) {
    super({ ...props });

    this.add(
      <>
        <Line
          points={[
            [-10, -10],
            [0, 0],
            [20, -20],
          ]}
          stroke={Solarized.green}
          lineWidth={6}
        />
      </>,
    );
  }
}
