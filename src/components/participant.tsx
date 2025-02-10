import { Img, initial, Node, NodeProps, signal } from '@motion-canvas/2d';
import { SignalValue, SimpleSignal, Vector2 } from '@motion-canvas/core';

import verifierImageAlarmed from '../assets/images/vr/with_border/alarmed.png';
import verifierImageEmbarrassed from '../assets/images/vr/with_border/embarrassed.png';
import verifierImageEvil from '../assets/images/vr/with_border/evil.png';
import verifierImageHappy from '../assets/images/vr/with_border/happy.png';
import verifierImageLooking from '../assets/images/vr/with_border/looking.png';
import verifierImageNeutral from '../assets/images/vr/with_border/neutral.png';
import verifierImageThinking from '../assets/images/vr/with_border/thinking.png';
import proverImageAlarmed from '../assets/images/vv/with_border/alarmed.png';
import proverImageEmbarrassed from '../assets/images/vv/with_border/embarrassed.png';
import proverImageEvil from '../assets/images/vv/with_border/evil.png';
import proverImageHappy from '../assets/images/vv/with_border/happy.png';
import proverImageLooking from '../assets/images/vv/with_border/looking.png';
import proverImageNeutral from '../assets/images/vv/with_border/neutral2.png';
import proverImageThinking from '../assets/images/vv/with_border/thinking.png';

export type ParticipantKind = 'prover' | 'verifier';
export type Expression =
  | 'neutral'
  | 'thinking'
  | 'looking'
  | 'embarrassed'
  | 'alarmed'
  | 'evil'
  | 'happy';

export const PROVER_POSITION = new Vector2(-600, 0);
export const VERIFIER_POSITION = new Vector2(600, 0);

const EXPRESSION_TO_IMAGE: Record<ParticipantKind, Record<Expression, string>> = {
  prover: {
    neutral: proverImageNeutral,
    thinking: proverImageThinking,
    looking: proverImageLooking,
    embarrassed: proverImageEmbarrassed,
    alarmed: proverImageAlarmed,
    evil: proverImageEvil,
    happy: proverImageHappy,
  },
  verifier: {
    neutral: verifierImageNeutral,
    thinking: verifierImageThinking,
    looking: verifierImageLooking,
    embarrassed: verifierImageEmbarrassed,
    alarmed: verifierImageAlarmed,
    evil: verifierImageEvil,
    happy: verifierImageHappy,
  },
};

export interface ParticipantProps extends NodeProps {
  kind: ParticipantKind;
  expression?: SignalValue<Expression>;
}

export class Participant extends Node {
  @signal()
  declare public readonly kind: SimpleSignal<ParticipantKind, this>;

  @initial('neutral')
  @signal()
  declare public readonly expression: SimpleSignal<Expression, this>;

  public constructor(props?: ParticipantProps) {
    super({ ...props });
    this.add(
      <Img
        src={() => EXPRESSION_TO_IMAGE[this.kind()][this.expression()]}
        width={450}
      ></Img>,
    );
  }
}
