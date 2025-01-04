import {Txt, TxtProps, Latex, LatexProps} from '@motion-canvas/2d';
import {FONT_FAMILY} from "./utilities";
import {Solarized} from "./utilities";

const TEXT_SIZE: number = 30;

export class MyTxt extends Txt {
    constructor(props: TxtProps) {
        super({
            fontFamily: FONT_FAMILY, 
            fill: Solarized.text,
            fontSize: TEXT_SIZE,
            ...props});
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
