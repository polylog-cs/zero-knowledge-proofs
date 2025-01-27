import { Img, Rect, RectProps } from '@motion-canvas/2d';

import super_mario_bros_logo_alpha from '../assets/images/super_mario_bros_logo.svg';
import { Solarized } from '../utilities';
import { MyTxt } from '../utilities_text';

export class MarioAlgorithm extends Rect {
  public constructor(props?: RectProps) {
    super({
      width: 550,
      height: 550,
      fill: Solarized.orange,
      layout: true,
      direction: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 25,
      ...props,
    });

    this.add(
      <>
        <Img src={super_mario_bros_logo_alpha} width={500} smoothing={true}></Img>
        <MyTxt fontSize={75} fill={Solarized.base2} textAlign={'center'}>
          World Record{'\n'}
          Checker
        </MyTxt>
      </>,
    );
  }
}
