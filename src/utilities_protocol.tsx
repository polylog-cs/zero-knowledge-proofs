import { Node, Layout, Img, Txt, makeScene2D, Rect } from '@motion-canvas/2d';
import { createRef, Vector2, waitFor, all } from '@motion-canvas/core';
import { LockableGraph } from './utilities_lockable_graph';
import { nextTo, moveTo, alignTo, shift } from './utilities_moving';
import { exampleGraphData, GraphData } from './utilities_graph';
import { Solarized, logPosition } from './utilities';
import proverImage from './assets/images/prover.png';
import verifierImage from './assets/images/verifier.png';

export class ProtocolScene {
  public proverRef = createRef<Img>();
  public verifierRef = createRef<Img>();
  public graphRef = createRef<LockableGraph>();
  public containerRef = createRef<Layout>();

  private proverPosition = new Vector2(-600, 0);
  private verifierPosition = new Vector2(600, 0);
  private centerPosition = new Vector2(0, 0);
  private graphBuffer = 50;

  // Arrays to store multiple text lines for prover and verifier
  private proverTexts: ReturnType<typeof createRef<Txt>>[] = [];
  private verifierTexts: ReturnType<typeof createRef<Txt>>[] = [];

  constructor(private view: Layout) {
    view.add(<Layout ref={this.containerRef} layout={false} />);
  }

  /**
   * Add a participant image (prover or verifier).
   */
  public *addParticipant(which: 'prover' | 'verifier', path?: string) {
    const ref = which === 'prover' ? this.proverRef : this.verifierRef;
    const defaultPath = which === 'prover' ? proverImage : verifierImage;
    const position = which === 'prover' ? this.proverPosition : this.verifierPosition;

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
  public *addText(which: 'prover' | 'verifier', text: string, removeCurrent: boolean = false) {
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
        fontFamily="Fira Sans, Noto Color Emoji"
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
  public *removeText(which: 'prover' | 'verifier' | 'both') {
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
    data: GraphData,
    initialPosition: 'center' | 'prover' | 'verifier' = 'center',
    opacity: number = 1,
  ) {
    const g = new LockableGraph(50);
    g.initialize(data);
    const graphLayout = g.getGraphLayout();
    this.containerRef().add(graphLayout);

    // Position depending on initialPosition
    switch (initialPosition) {
      case 'center':
        g.containerRef().position(this.centerPosition);
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
      this.graphRef().unlockVertices(),
      this.graphRef().containerRef().opacity(0, 1),
    );
    yield* this.sendGraph('center', 0);
  }

  public *fadeInGraph(duration: number = 1) {
    yield* this.graphRef().containerRef().opacity(1, 1);
  }

  /**
   * Sends the graph to a target location: 'center', 'prover', or 'verifier'.
   */
  public *sendGraph(target: 'center' | 'prover' | 'verifier', duration: number = 1) {
    const g = this.graphRef();
    if (!g) return;
    let finalPos = this.centerPosition;

    switch (target) {
      case 'center':
        yield* moveTo(g.containerRef(), finalPos, duration);
        return;
      case 'prover':
        yield* nextTo(g.containerRef(), this.proverRef(), 'right', this.graphBuffer, duration);
        return;
      case 'verifier':
        yield* nextTo(g.containerRef(), this.verifierRef(), 'left', this.graphBuffer, duration);
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

  public *challenge() {
    yield* this.graphRef().pointAtRandomEdges(5, 0.5);
    yield* waitFor(0.5);

    yield* this.graphRef().unlockVertices(this.graphRef().challengeEdge);
    yield* waitFor(0.5);

    yield* this.addText('verifier', '✅', true);
    yield* waitFor(1);
    yield* this.removeText('verifier');

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
