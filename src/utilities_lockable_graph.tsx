import { Node, Layout, Circle, Line, Spline, Txt } from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitFor,
  useLogger,
  ThreadGenerator,
  Reference,
} from '@motion-canvas/core';
import { Lock } from './utilities_lock';
import { Graph, GraphData } from './utilities_graph';
import { Finger } from './utilities_finger';
import { Solarized, shuffleArray, logPosition } from './utilities';
import { Vector2 } from '@motion-canvas/core';

export class LockableGraph extends Graph {
  public locks = new Map<string, Reference<Lock>>();

  // colors
  private palette = [Solarized.blue, Solarized.red, Solarized.green];
  private currentColors = new Map<string, number>();

  // sides array for edges
  private edgeSides: boolean[] = [];

  // Instead of a single arrowRef, we store multiple arrows
  private arrows: Reference<Finger>[] = [];

  public challengeEdge: [string, string] = ['', ''];

  private vertexDirections = new Map<string, Vector2>();

  override initialize(data: GraphData) {
    super.initialize({
      labels: data.labels,
      edges: data.edges,
      positions: data.positions,
    });

    for (let i = 0; i < data.labels.length; i++) {
      this.currentColors.set(data.labels[i], data.colors[i]);
    }

    this.edgeSides = data.sides;

    if (data.vertexDirs) {
      for (let i = 0; i < data.labels.length; i++) {
        const dirArr = data.vertexDirs[i];
        this.vertexDirections.set(data.labels[i], new Vector2(dirArr));
      }
    }
  }

  override addVertex(label: string, position: [number, number]) {
    super.addVertex(label, position);
    const lockRef = createRef<Lock>();
    this.locks.set(label, lockRef);
  }

  protected override createVertexNode(label: string) {
    const vertexData = this.vertexMap.get(label);
    const lock = this.locks.get(label);

    return (
      <Node key={`Node-${label}`}>
        <Circle
          key={label}
          ref={vertexData.ref}
          size={this.vertexRadius}
          fill={Solarized.gray}
          opacity={0}
          position={vertexData.position}
        />
        <Lock ref={lock} object={vertexData.ref()} />
      </Node>
    );
  }

  *lockVertices(vertices: string[] = [], duration: number = 1.5) {
    const animations: ThreadGenerator[] = [];
    if (vertices.length === 0) {
      vertices = [...this.vertexMap.keys()];
    }
    for (const v of vertices) {
      const lock = this.locks.get(v)();
      if (lock) {
        animations.push(lock.lock(duration));
      }
    }
    yield* all(...animations);
  }

  *unlockVertices(vertices: string[] = [], duration: number = 1.5) {
    const animations: ThreadGenerator[] = [];
    if (vertices.length === 0) {
      vertices = [...this.vertexMap.keys()];
    }
    for (const v of vertices) {
      const lock = this.locks.get(v)();
      if (lock) {
        animations.push(lock.unlock(duration));
      }
    }
    yield* all(...animations);
  }

  /**
   * Animate showing an arrow pointing at an edge midpoint.
   */
  *pointAtEdge(
    edgePair: [string, string],
    fromLeft: boolean = true,
    duration: number = 1,
    keep: boolean = false,
    arrowLength: number = 50,
  ) {
    const edge = this.getEdge(edgePair);

    const fromVertex = this.vertexMap.get(edge.from);
    const toVertex = this.vertexMap.get(edge.to);

    const startPos = new Vector2(fromVertex.position);
    const endPos = new Vector2(toVertex.position);
    const mid = startPos.add(endPos).scale(0.5);
    let degrees = endPos.sub(startPos).degrees + (fromLeft ? 90 : 270);

    const arrowRef = createRef<Finger>();
    const arrowNode = (
      <Finger
        position={mid}
        rotation={degrees}
        padding={0.2}
        scale={arrowLength}
        ref={arrowRef}
      />
    );

    this.arrows.push(arrowRef);
    this.containerRef().add(arrowRef());
    yield* arrowRef().opacity(1, duration / 10);
    yield* waitFor((8 * duration) / 10);

    if (!keep) {
      yield* this.removeArrows(duration / 10, [arrowRef]);
    }
  }

  getEdge(edgePair: [string, string]) {
    const edge = this.edges.find(
      (e) =>
        (e.from === edgePair[0] && e.to === edgePair[1]) ||
        (e.from === edgePair[1] && e.to === edgePair[0]),
    );
    if (!edge) {
      throw new Error(`Edge ${edgePair} not found. Available edges: ${this.edges}`);
    }
    return edge;
  }

  /**
   * Point an arrow at the given vertex.
   */
  *pointAtVertex(
    vertexLabel: string,
    duration: number = 1,
    keep: boolean = false,
    arrowLength: number = 80,
    buff: number = 0.5,
  ) {
    const vertexData = this.vertexMap.get(vertexLabel);
    if (!vertexData) return;

    const position = new Vector2(vertexData.position);
    let direction = this.vertexDirections.get(vertexLabel)?.degrees ?? 0;

    const arrowRef = createRef<Finger>();
    const arrowNode = (
      <Finger
        position={position}
        rotation={direction}
        padding={buff}
        scale={arrowLength}
        ref={arrowRef}
      />
    );

    this.arrows.push(arrowRef);
    this.containerRef().add(arrowRef());

    yield* arrowRef().opacity(1, duration / 10);
    yield* waitFor((8 * duration) / 10);

    if (!keep) {
      yield* this.removeArrows(duration / 10, [arrowRef]);
    }
  }

  /**
   * Remove specified arrows or all if none specified.
   * Fade them out and remove from scene and array.
   */
  *removeArrows(duration: number = 0.5, specificArrows?: Reference<Finger>[]) {
    const toRemove = specificArrows ?? this.arrows;

    const fadeOuts = toRemove.map((ref) => ref().opacity(0, duration));
    yield* all(...fadeOuts);

    for (const ref of toRemove) {
      ref().remove();
    }

    if (!specificArrows) {
      this.arrows = [];
    } else {
      // Remove only those specified from the arrows array
      this.arrows = this.arrows.filter((ar) => !toRemove.includes(ar));
    }
  }

  *pointAtRandomEdges(
    finalEdge?: [string, string],
    k: number = 20,
    totalDuration: number = 3,
    arrowLength: number = 50,
  ) {
    if (this.edges.length <= 1) {
      throw new Error('Graph must have at least 2 edges to point at random edges.');
    }

    const timingExponent = 2; // 1 = linear, >1 = quicker at the beginning
    const getTimeFractionAt = (i: number) => (0.5 + i / k) ** timingExponent;
    const totalNormalizedTime = getTimeFractionAt(k) - getTimeFractionAt(0);

    let lastEdge: (typeof this.edges)[0] | null = null;
    for (let i = 0; i < k; i++) {
      let availableEdges = this.edges.filter((e) => e !== lastEdge);
      if (finalEdge != undefined && i == k - 1) {
        availableEdges = [this.getEdge(finalEdge)];
      }
      const chosenEdge =
        availableEdges[Math.floor(Math.random() * availableEdges.length)];
      const index = this.edges.indexOf(chosenEdge);

      const side =
        index >= 0 && index < this.edgeSides.length ? this.edgeSides[index] : true;

      const normalizedDuration = getTimeFractionAt(i + 1) - getTimeFractionAt(i);
      const duration = (normalizedDuration * totalDuration) / totalNormalizedTime;

      yield* this.pointAtEdge(
        [chosenEdge.from, chosenEdge.to],
        side,
        duration,
        i === k - 1,
        arrowLength,
      );
      lastEdge = chosenEdge;
    }

    this.challengeEdge = [lastEdge.from, lastEdge.to];
  }

  *applyColors(
    durationPerVertex: number = 0.5,
    stepDelay: number = 0.1,
    newColors?: Map<string, number>,
  ) {
    if (newColors) {
      this.currentColors = newColors;
    }

    const anims: ThreadGenerator[] = [];
    for (const [label, cIndex] of this.currentColors.entries()) {
      const vertexData = this.vertexMap.get(label);
      if (!vertexData) continue;
      const targetColor = this.palette[cIndex % this.palette.length];
      anims.push(
        (function* () {
          yield* vertexData.ref().fill(targetColor, durationPerVertex);
        })(),
      );
    }
    yield* sequence(stepDelay, ...anims);
  }

  *shuffleColors(durationPerVertex: number = 0.5, stepDelay: number = 0.0) {
    if (this.currentColors.size === 0) {
      return;
    }

    const oldPalette = [...this.palette];
    do {
      shuffleArray(this.palette);
    } while (arraysEqual(this.palette, oldPalette));

    yield* this.applyColors(durationPerVertex, stepDelay);
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
