import { Img, Layout, View2D } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  Reference,
  sequence,
  ThreadGenerator,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import {
  Participant,
  ParticipantKind,
  PROVER_POSITION,
  VERIFIER_POSITION,
} from './components/participant';
import { Solarized } from './utilities';
import { exampleGraphData, GraphData } from './utilities_graph';
import { LockableGraph } from './utilities_lockable_graph';
import { alignTo, moveTo, nextTo, shift } from './utilities_moving';
import { MyTxt } from './utilities_text';

const CENTER_POSITION = new Vector2(0, 0);
const GRAPH_BUFFER = 0;

export type GraphPosition = ParticipantKind | 'center';

export class ProtocolScene {
  public proverRef = createRef<Participant>();
  public verifierRef = createRef<Participant>();
  public graphRef = createRef<LockableGraph>();
  public containerRef = createRef<Layout>();

  // Arrays to store multiple text lines for prover and verifier
  public proverTexts: Reference<MyTxt>[] = [];
  public verifierTexts: Reference<MyTxt>[] = [];

  constructor(private view: View2D) {
    view.add(<Layout ref={this.containerRef} layout={false} />);
  }

  public *setup(
    graphPosition: GraphPosition = 'center',
    locked: boolean = false,
    colored: boolean = true,
  ) {
    yield* all(this.addParticipant('prover'), this.addParticipant('verifier'));
    yield* this.createGraph(graphPosition, 0);
    if (colored) yield* this.graphRef().applyColors(0, 0);
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
    const position = which === 'prover' ? PROVER_POSITION : VERIFIER_POSITION;

    this.containerRef().add(
      <Participant ref={ref} kind={which} position={position} opacity={0} />,
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
    fast: boolean = false,
  ) {
    const isProver = which === 'prover';
    const targetRef = isProver ? this.proverRef : this.verifierRef;
    const textsArray = isProver ? this.proverTexts : this.verifierTexts;

    if (removeCurrent && textsArray.length > 0) {
      this.removeText(which);
    }

    yield* all(...textsArray.map((t, _) => shift(t(), new Vector2(0, -100), 0.5)));

    const newTextRef = createRef<MyTxt>();
    this.containerRef().add(
      <MyTxt
        ref={newTextRef}
        text={text}
        fontSize={56}
        fill={isProver ? Solarized.proverText : Solarized.verifierText}
        opacity={0}
      />,
    );
    const pos = isProver ? 'left' : 'right';
    alignTo(newTextRef(), targetRef(), pos, 0);
    nextTo(newTextRef(), targetRef(), 'up', 10);

    // Fade in new line
    yield* newTextRef().opacity(1, 0.5);
    if (!fast) yield* waitFor(0.5);

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
    const g = new LockableGraph(75);
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

    switch (target) {
      case 'center':
        yield* g.containerRef().position(CENTER_POSITION, duration);
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

  public *shufflingColors(unlock: boolean = true, fast: boolean = false) {
    this.proverRef().expression('thinking');
    if (unlock) {
      yield* this.graphRef().unlockVertices(undefined, fast ? 0.5 : 1);
    }
    for (let i = 0; i < 5; i++) {
      yield* this.graphRef().shuffleColors(fast ? 0.05 : 0.2);
      yield* waitFor(fast ? 0.05 : 0.3);
    }
    if (!fast) yield* waitFor(0.5);
    yield* this.graphRef().lockVertices(undefined, fast ? 0.5 : 1);
    if (!fast) yield* waitFor(0.5);
    this.proverRef().expression('neutral');
  }

  public *challenge(noText: boolean = false, shortened: boolean = false) {
    const numChallenges = shortened ? 3 : 20;
    const pointingDuration = shortened ? 0.5 : 3;
    yield* this.graphRef().pointAtRandomEdges(
      undefined,
      numChallenges,
      pointingDuration,
    );

    if (shortened) {
      yield* all(
        this.graphRef().unlockVertices(this.graphRef().challengeEdge, 0.5),
        this.graphRef().removeArrows(0.5),
      );
      return;
    }

    yield* waitFor(0.5);
    yield* this.graphRef().unlockVertices(this.graphRef().challengeEdge);
    yield* waitFor(0.5);

    if (!noText) {
      this.verifierRef().expression('happy');
      yield* this.addText('verifier', '✅', true);
      yield* waitFor(1);
      yield* this.removeText('verifier');
      this.verifierRef().expression('neutral');
    }
    yield* this.graphRef().removeArrows();
  }

  public *oneRound(firstRound: boolean = false, fast: boolean = false) {
    yield* this.shufflingColors(!firstRound, fast);

    yield* this.sendGraph('verifier', fast ? 0.5 : 1);

    const numChallenges = fast ? 4 : 7;
    const pointingDuration = fast ? 0.5 : 1;
    yield* this.graphRef().pointAtRandomEdges(
      undefined,
      numChallenges,
      pointingDuration,
    );

    yield* all(
      this.graphRef().unlockVertices(this.graphRef().challengeEdge, fast ? 0.5 : 1),
      delay(
        fast ? 0.2 : 1,
        all(
          this.addText('verifier', '✅', true, fast),
          this.verifierRef().expression('happy', 0),
        ),
      ),
    );
    this.verifierRef().expression('neutral');

    if (!fast) yield* waitFor(0.5);
    yield* all(this.removeText('verifier'), this.graphRef().removeArrows());

    yield* this.sendGraph('prover', fast ? 0.5 : 1);
  }

  // assumes that the graph exists
  public *basicProtocol(numRounds: number = 5) {
    if (this.graphRef() === undefined) {
      return;
    }
    yield* this.sendGraph('prover', 1);
    yield* this.graphRef().applyColors(0.5, 0.1);
    yield* waitFor(0.5);

    for (let i = 0; i < numRounds; i++) {
      yield* this.oneRound(i == 0, i >= 2);
    }
  }
}
