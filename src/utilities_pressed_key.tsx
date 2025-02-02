import { FONT_FAMILY, Solarized } from './utilities';
import { Rect, Txt } from '@motion-canvas/2d';
import { PossibleColor, PossibleVector2 } from '@motion-canvas/core/lib/types';
interface PressedKeyProps {
  text: string;
  fill?: PossibleColor;
  textColor?: PossibleColor;
  fontSize?: number;
  radius?: number;
  stroke?: PossibleColor;
}
export class PressedKey extends Rect {
  public constructor(props: PressedKeyProps) {
    super({
      width: 90,             // fixed square size
      height: 90,
      stroke: props.stroke ?? '#000',
      lineWidth: 3,
      fill: props.fill ?? '#ccc',
      radius: props.radius,
      layout: true,          // layout = true, so that children are centered
      alignItems: 'center',  // center child horizontally
      justifyContent: 'center', // center child vertically
      children: [
        new Txt({
          text: props.text,
          fontSize: props.fontSize ?? 48,
          fill: props.textColor ?? '#000',
        }),
      ],
    });
  }
}
