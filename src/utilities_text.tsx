import {Txt, TxtProps} from '@motion-canvas/2d';
import {FONT_FAMILY} from "./utilities";

export class MyTxt extends Txt {
    constructor(props: TxtProps) {
        super({fontFamily: FONT_FAMILY, ...props});
    }
}
