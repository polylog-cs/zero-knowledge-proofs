import { Img, Layout, View2D } from '@motion-canvas/2d';
import {
  all,
  chain,
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
import { Tick } from './components/tick';
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

  public globalText = createRef<MyTxt>();

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

    yield* all(...textsArray.map((t, _) => shift(t(), new Vector2(0, -80), 0.5)));

    const newTextRef = createRef<MyTxt>();
    this.containerRef().add(
      <MyTxt
        ref={newTextRef}
        text={text}
        fontSize={72}
        fill={isProver ? Solarized.proverText : Solarized.verifierText}
        opacity={0}
        textAlign={'center'}
        lineHeight={'90%'}
      />,
    );
    const pos = isProver ? 'left' : 'right';
    alignTo(newTextRef(), targetRef(), pos, 0);
    nextTo(newTextRef(), targetRef(), 'up', 30);

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

    this.graphRef = () => g;
    g.containerRef().opacity(opacity);
    yield* this.sendGraph(initialPosition, 0);
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

  public *verifierHappy(fadeDuration: number = 1, waitDuration: number = 1) {
    const check = <Tick position={[0, -300]} scale={4} zIndex={-1} />;
    this.verifierRef().add(check);
    check.save();

    yield* check.opacity(0).scale(0).position(0).restore(fadeDuration);
    yield* waitFor(waitDuration);
    yield* all(
      check.opacity(0, fadeDuration),
      check.scale(check.scale().mul(2), fadeDuration),
    );
  }

  public *shufflingColors(unlock: boolean = true, fast: boolean = false) {
    this.proverRef().expression('thinking');
    if (unlock) {
      yield* this.graphRef().unlockVertices(undefined, fast ? 0.7 : 1);
    }
    for (let i = 0; i < (fast ? 5 : 8); i++) {
      yield* this.graphRef().shuffleColors(fast ? 0.05 : 0.2);
      yield* waitFor(fast ? 0.1 : 0.3);
    }
    if (!fast) yield* waitFor(0.5);
    yield* this.graphRef().lockVertices(undefined, fast ? 0.7 : 1);
    if (!fast) yield* waitFor(0.5);
    this.proverRef().expression('neutral');
  }

  public *challenge(noText: boolean = false, shortened: boolean = false) {
    const numChallenges = shortened ? 3 : 15;
    const pointingDuration = shortened ? 0.5 : 2.5;
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
      yield* this.verifierHappy();
      this.verifierRef().expression('neutral');
    }
    yield* this.graphRef().removeArrows();
  }

  public *oneRound(firstRound: boolean = false, fast: boolean = false) {
    yield* all(
      this.shufflingColors(!firstRound, fast),
      this.setGlobalText('Shuffle \& Lock', 'prover'),
    );

    yield* all(
      this.sendGraph('verifier', fast ? 0.7 : 1),
      this.setGlobalText('Challenge', 'verifier'),
    );

    const numChallenges = fast ? 1 : 10;
    const pointingDuration = fast ? 0.5 : 2;
    yield* all(
      this.graphRef().pointAtRandomEdges(undefined, numChallenges, pointingDuration),
    );

    yield* all(
      chain(
        waitFor(fast ? 0 : 0.5),
        sequence(
          fast ? 0.5 : 1,
          this.setGlobalText('Reveal', 'prover'),
          this.graphRef().unlockVertices(this.graphRef().challengeEdge, 1),
        ),
      ),
      delay(
        fast ? 1.5 : 3,
        chain(
          sequence(
            fast ? 0 : 1,
            this.setGlobalText('Check', 'verifier'),
            fast ? waitFor(0) : this.verifierRef().expression('thinking', 0),
          ),
          waitFor(fast ? 0.5 : 2),
          all(
            this.verifierRef().expression('happy', 0),
            this.verifierHappy(1, fast ? 0 : 1),
          ),
        ),
      ),
    );
    if (!fast) yield* waitFor(0.5);
    yield* all(this.removeText('verifier'), this.graphRef().removeArrows());
    this.verifierRef().expression('neutral');

    yield* this.sendGraph('prover', fast ? 0.5 : 1);
  }

  public *setGlobalText(txt: string, who: ParticipantKind) {
    const anims = [];
    // RH: revertnul jsem tuhle animaci. Náš záměr byl naznačit, že se ty kroky opakují pořád dokola, jako na pásce, což mi přijde, že tahle verze dělá líp.
    const up = new Vector2(0, -100);
    if (this.globalText() !== undefined) {
      anims.push(
        all(shift(this.globalText(), up.mul(-1), 1), this.globalText().opacity(0, 1)),
      );
    }

    this.containerRef().add(
      <MyTxt
        ref={this.globalText}
        position={new Vector2(0, -425)}
        fontSize={128}
        fill={who == 'prover' ? Solarized.proverText : Solarized.verifierText}
      >
        {txt}
      </MyTxt>,
    );
    this.globalText().save();
    shift(this.globalText(), up);
    this.globalText().opacity(0);
    yield* all(...anims, this.globalText().restore(1));
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
