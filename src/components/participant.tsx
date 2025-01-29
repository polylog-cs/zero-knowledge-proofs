import { Img, initial, Node, NodeProps, signal } from '@motion-canvas/2d';
import { SignalValue, SimpleSignal, Vector2 } from '@motion-canvas/core';

import proverImageAlarmed from '../assets/images/prover_alarmed.png';
import proverImageEmbarrassed from '../assets/images/prover_embarrassed.png';
import proverImageEvil from '../assets/images/prover_evil.png';
import proverImageHappy from '../assets/images/prover_happy.png';
import proverImageLooking from '../assets/images/prover_looking.png';
import proverImageThinking from '../assets/images/prover_thinking.png';
import proverImageNeutral from '../assets/images/prover.png';
import verifierImageAlarmed from '../assets/images/verifier_alarmed.png';
import verifierImageEmbarrassed from '../assets/images/verifier_embarrassed.png';
import verifierImageEvil from '../assets/images/verifier_evil.png';
import verifierImageHappy from '../assets/images/verifier_happy.png';
import verifierImageLooking from '../assets/images/verifier_looking.png';
import verifierImageThinking from '../assets/images/verifier_thinking.png';
import verifierImageNeutral from '../assets/images/verifier.png';

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
    props.expression;
    this.add(
      <Img src={() => EXPRESSION_TO_IMAGE[this.kind()][this.expression()]}></Img>,
    );
  }
}
