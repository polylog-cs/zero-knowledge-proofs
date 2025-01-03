import { Img, initial, Node, NodeProps, signal } from '@motion-canvas/2d';
import { SignalValue, SimpleSignal } from '@motion-canvas/core';

import proverImageEmbarrassed from '../assets/images/prover_embarrassed.png';
import proverImageLooking from '../assets/images/prover_looking.png';
import proverImageThinking from '../assets/images/prover_thinking.png';
import proverImageNeutral from '../assets/images/prover.png';
import verifierImageEmbarrassed from '../assets/images/verifier_embarrassed.png';
import verifierImageLooking from '../assets/images/verifier_looking.png';
import verifierImageThinking from '../assets/images/verifier_thinking.png';
import verifierImageNeutral from '../assets/images/verifier.png';

export type Expression = 'neutral' | 'thinking' | 'looking' | 'embarrassed';

export interface ParticipantProps extends NodeProps {
  expression?: SignalValue<Expression>;
}

export type ParticipantKind = 'prover' | 'verifier';

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

export class Participant extends Node {
  @initial('neutral')
  @signal()
  declare public readonly expression: SimpleSignal<Expression, this>;

  public constructor(props?: ParticipantProps) {
    super({ ...props });
    props.expression;
    this.add(<Img src={() => EXPRESSION_TO_IMAGE['prover'][this.expression()]}></Img>);
  }
}
