import { Img, initial, Node, NodeProps, signal } from '@motion-canvas/2d';
import { SignalValue, SimpleSignal, Vector2 } from '@motion-canvas/core';

import proverImageEmbarrassed from '../assets/images/prover_embarrassed.png';
import proverImageLooking from '../assets/images/prover_looking.png';
import proverImageThinking from '../assets/images/prover_thinking.png';
import proverImageNeutral from '../assets/images/prover.png';
import verifierImageEmbarrassed from '../assets/images/verifier_embarrassed.png';
import verifierImageLooking from '../assets/images/verifier_looking.png';
import verifierImageThinking from '../assets/images/verifier_thinking.png';
import verifierImageNeutral from '../assets/images/verifier.png';

export type ParticipantKind = 'prover' | 'verifier';
export type Expression = 'neutral' | 'thinking' | 'looking' | 'embarrassed';

export const PROVER_POSITION = new Vector2(-600, 0);
export const VERIFIER_POSITION = new Vector2(600, 0);

const EXPRESSION_TO_IMAGE: Record<ParticipantKind, Record<Expression, string>> = {
  prover: {
    neutral: proverImageNeutral,
    thinking: proverImageThinking,
    looking: proverImageLooking,
    embarrassed: proverImageEmbarrassed,
  },
  verifier: {
    neutral: verifierImageNeutral,
    thinking: verifierImageThinking,
    looking: verifierImageLooking,
    embarrassed: verifierImageEmbarrassed,
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
