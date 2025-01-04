import { Img, Layout, makeScene2D, Node, Rect, Txt, View2D } from '@motion-canvas/2d';
import {
  all,
  createRef,
  Reference,
  ThreadGenerator,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import proverImage from './assets/images/prover.png';
import verifierImage from './assets/images/verifier.png';
import {
  ParticipantKind,
  PROVER_POSITION,
  VERIFIER_POSITION,
} from './components/participant';
import { FONT_FAMILY, logPosition, Solarized } from './utilities';
import { exampleGraphData, GraphData } from './utilities_graph';
import { LockableGraph } from './utilities_lockable_graph';
import { alignTo, moveTo, nextTo, shift } from './utilities_moving';

const CENTER_POSITION = new Vector2(0, 0);
const GRAPH_BUFFER = 50;

export type GraphPosition = ParticipantKind | 'center';

export class ProtocolScene {
  public proverRef = createRef<Img>();
  public verifierRef = createRef<Img>();
  public graphRef = createRef<LockableGraph>();
  public containerRef = createRef<Layout>();

  // Arrays to store multiple text lines for prover and verifier
  private proverTexts: Reference<Txt>[] = [];
  private verifierTexts: Reference<Txt>[] = [];

  constructor(private view: View2D) {
    view.add(<Layout ref={this.containerRef} layout={false} />);
  }

  public *setup(graphPosition: GraphPosition = 'center', locked: boolean = false) {
    yield* all(this.addParticipant('prover'), this.addParticipant('verifier'));
    yield* this.createGraph(graphPosition, 0);
    yield* this.graphRef().applyColors(0, 0);
    if (locked) {
      yield* this.graphRef().lockVertices();
    }
    yield* this.fadeInGraph(1);
  }

  /**
   * Add a participant image (prover or verifier).
   */
  private *addParticipant(which: ParticipantKind, path?: string) {
    const ref = which === 'prover' ? this.proverRef : this.verifierRef;
    const defaultPath = which === 'prover' ? proverImage : verifierImage;
    const position = which === 'prover' ? PROVER_POSITION : VERIFIER_POSITION;

    this.containerRef().add(
      <Img ref={ref} src={path ?? defaultPath} position={position} opacity={0} />,
    );
    yield* ref().opacity(1, 1);
  }

  /**
   * Add a line of text above a participant.
   * Each new call shifts existing lines up and places the new line below them.
   * For prover: align left.
   * For verifier: align right.
   */
  public *addText(
    which: ParticipantKind,
    text: string,
    removeCurrent: boolean = false,
  ) {
    const lineHeight = 50;
    const isProver = which === 'prover';
    const targetRef = isProver ? this.proverRef : this.verifierRef;
    const textsArray = isProver ? this.proverTexts : this.verifierTexts;

    if (removeCurrent && textsArray.length > 0) {
      this.removeText(which);
    }

    yield* all(...textsArray.map((t, _) => shift(t(), new Vector2(0, -100), 0.5)));

    const newTextRef = createRef<Txt>();
    this.containerRef().add(
      <Txt
        ref={newTextRef}
        text={text}
        fontSize={40}
        fontFamily={FONT_FAMILY}
        fill={Solarized.text}
        opacity={0}
      />,
    );
    const pos = isProver ? 'left' : 'right';
    alignTo(newTextRef(), targetRef(), pos, 0);
    nextTo(newTextRef(), targetRef(), 'up', 10);

    // Fade in new line
    yield* newTextRef().opacity(1, 0.5);
    yield* waitFor(0.5);

    // Add new line to array
    textsArray.push(newTextRef);
  }

  /**
   * Remove all text from a participant or both.
   * Fades out and removes all lines.
   */
  public *removeText(which: ParticipantKind | 'both'): ThreadGenerator {
    if (which == 'both') {
      yield* all(this.removeText('prover'), this.removeText('verifier'));
    } else {
      const textsArray = which === 'prover' ? this.proverTexts : this.verifierTexts;
      if (textsArray.length === 0) return;

      yield* all(...textsArray.map((tr) => tr().opacity(0, 0.5)));
      textsArray.forEach((tr) => tr().remove());
      textsArray.length = 0;
    }
  }

  /**
   * Create a LockableGraph from data and fade it in at the center (or near prover/verifier).
   */
  public *createGraph(
    initialPosition: GraphPosition = 'center',
    opacity: number = 1,
    data: GraphData = exampleGraphData,
  ) {
    const g = new LockableGraph(50);
    g.initialize(data);
    const graphLayout = g.getGraphLayout();
    this.containerRef().add(graphLayout);

    // Position depending on initialPosition
    switch (initialPosition) {
      case 'center':
        g.containerRef().position(CENTER_POSITION);
        break;
      case 'prover':
        nextTo(g.containerRef(), this.proverRef(), 'right', 50);
        break;
      case 'verifier':
        nextTo(g.containerRef(), this.verifierRef(), 'left', 50);
    }

    this.graphRef = () => g;
    g.containerRef().opacity(opacity);
    yield* g.fadeIn(0);
  }

  //fade out the graph and reset it; if we want to use it next time, we use fadeInGraph()
  public *fadeOutGraph(duration: number = 1) {
    yield* all(
      this.graphRef().removeArrows(),
      this.graphRef().containerRef().opacity(0, 1),
    );
    yield* this.graphRef().unlockVertices([], 0);
    yield* this.sendGraph('center', 0);
  }

  public *fadeInGraph(duration: number = 1) {
    yield* this.graphRef().containerRef().opacity(1, 1);
  }

  /**
   * Sends the graph to a target location: 'center', 'prover', or 'verifier'.
   */
  public *sendGraph(target: 'center' | ParticipantKind, duration: number = 1) {
    const g = this.graphRef();
    if (!g) return;
    let finalPos = CENTER_POSITION;

    switch (target) {
      case 'center':
        yield* moveTo(g.containerRef(), finalPos, duration);
        return;
      case 'prover':
        yield* nextTo(
          g.containerRef(),
          this.proverRef(),
          'right',
          GRAPH_BUFFER,
          duration,
        );
        return;
      case 'verifier':
        yield* nextTo(
          g.containerRef(),
          this.verifierRef(),
          'left',
          GRAPH_BUFFER,
          duration,
        );
        return;
    }
  }

  public *shufflingColors(unlock: boolean = true) {
    if (unlock) {
      yield* this.graphRef().unlockVertices();
    }
    for (let i = 0; i < 5; i++) {
      yield* this.graphRef().shuffleColors();
    }
    yield* waitFor(0.5);
    yield* this.graphRef().lockVertices();
    yield* waitFor(0.5);
  }

  public *challenge(noText: boolean = false, numChallenges: number = 20) {
    yield* this.graphRef().pointAtRandomEdges(undefined, numChallenges);
    yield* waitFor(0.5);

    yield* this.graphRef().unlockVertices(this.graphRef().challengeEdge);
    yield* waitFor(0.5);

    if(!noText) {
      yield* this.addText('verifier', '✅', true);
      yield* waitFor(1);
      yield* this.removeText('verifier');
      }
    yield* this.graphRef().removeArrows();
  }

  public *oneRound(firstRound: boolean = false) {
    yield* this.shufflingColors(!firstRound);

    yield* this.sendGraph('verifier', 1);
    yield* waitFor(0.5);

    yield* this.challenge();
    yield* waitFor(0.5);

    yield* this.sendGraph('prover', 1);
    yield* waitFor(0.5);

    yield* this.graphRef().unlockVertices();
    yield* waitFor(0.5);
  }

  // assumes that the graph exists
  public *basicProtocol(numRounds: number = 3) {
    if (this.graphRef() === undefined) {
      return;
    }
    yield* this.sendGraph('prover', 1);
    yield* this.graphRef().applyColors(0.5, 0.3);
    yield* waitFor(0.5);

    for (let i = 0; i < numRounds; i++) {
      yield* this.oneRound(i === 0);
    }
  }
}
