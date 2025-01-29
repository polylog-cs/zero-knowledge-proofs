import { Line, LineSegment, Node, NodeProps } from '@motion-canvas/2d';

import { Solarized } from '../utilities';

export class Cross extends Node {
  public constructor(props?: NodeProps) {
    super({ ...props });

    this.add(
      <>
        <Line
          points={[
            [-10, -10],
            [10, 10],
          ]}
          fill={Solarized.red}
          stroke={Solarized.red}
          lineWidth={6}
        />
        <Line
          points={[
            [10, -10],
            [-10, 10],
          ]}
          fill={Solarized.red}
          stroke={Solarized.red}
          lineWidth={6}
        />
      </>,
    );
  }
}
