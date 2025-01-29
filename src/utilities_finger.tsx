import { Img, Node, NodeProps, Txt } from '@motion-canvas/2d';

import pointingHandLeft from './assets/images/pointing-hand-left.png';
import { Solarized } from './utilities';

export interface FingerProps extends NodeProps {
  padding?: number;
}

export class Finger extends Node {
  size: number;
  public constructor(props?: FingerProps) {
    super({ ...props });
    // this.add(
    //   <Txt
    //     text={'👈'}
    //     fontSize={1 / 1.05}
    //     fontWeight={400}
    //     fontFamily="Noto Color Emoji"
    //     stroke={Solarized.blue}
    //     position={[0.488 + (props.padding ?? 0), 0.129]}
    //   />,
    // );
    // vv: Not sure about this solution either, but I don't like the emoji
    this.add(
      <Img
        src={pointingHandLeft}
        scale={0.003}
        position={[0.488 + (props.padding ?? 0), 0.129]}
      />,
    );
  }
}

// Commands to create the images:
// convert pointing-hand-raw.png -resize 360x -fuzz 80% -fill "#657b83" -opaque black pointing-hand.png
// convert pointing-hand-2.png -flop pointing-hand-2-left.png
