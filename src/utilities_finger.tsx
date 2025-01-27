import { Node, NodeProps, Txt } from '@motion-canvas/2d';

import { Solarized } from './utilities';

export interface FingerProps extends NodeProps {
  padding?: number;
}

export class Finger extends Node {
  size: number;
  public constructor(props?: FingerProps) {
    super({ ...props });
    this.add(
      <Txt
        text={'👈'}
        fontSize={1 / 1.05}
        fontWeight={400}
        fontFamily="Noto Color Emoji"
        stroke={Solarized.blue}
        position={[0.488 + (props.padding ?? 0), 0.129]}
      />,
    );
  }
}
