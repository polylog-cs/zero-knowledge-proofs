import { Circle, Layout, Shape, Spline, Txt } from '@motion-canvas/2d';
import {
  all,
  createRef,
  Reference,
  sequence,
  useLogger,
  useRandom,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { shuffleArray, Solarized } from './utilities';
import { Finger } from './utilities_finger';

const random = useRandom(42, true);

const logger = useLogger();

export interface GraphData {
  labels: string[];
  edges: [string, string][];
  positions: [number, number][];
  colors?: number[];
  vertexDirs?: [number, number][];
}

export const exampleGraphData: GraphData = {
  labels: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    ['B', 'A'],
    ['C', 'B'],
    ['A', 'C'],
    ['D', 'C'],
    ['C', 'E'],
    ['F', 'D'],
    ['E', 'F'],
  ],
  // Positions get scaled based on vertexRadius later
  positions: [
    [-1, -1.5],
    [1, -1.5],
    [0, -0.5],
    [-1, 0.5],
    [1, 0.5],
    [0, 1.5],
  ],
  colors: [0, 1, 2, 1, 0, 2],
  vertexDirs: [
    [-1, -2],
    [1, -2],
    [-1, 0],
    [-1, 0],
    [1, 1],
    [1, 2],
  ],
};

export class Graph {
  protected vertexMap = new Map<
    string,
    { ref: Reference<Circle>; position: [number, number] }
  >();
  protected edges: Array<{
    from: string;
    to: string;
    ref: Reference<Spline>;
    deviation: number;
  }> = [];
  public containerRef = createRef<Layout>();
  protected debugNodes = false;

  // colors
  private palette = [Solarized.blue, Solarized.red, Solarized.green];
  private currentColors = new Map<string, number>();

  // Instead of a single arrowRef, we store multiple arrows
  private arrows: Reference<Finger>[] = [];

  public challengeEdge: [string, string] = ['', ''];

  private vertexDirections = new Map<string, Vector2>();

  constructor(public vertexRadius: number) {}

  initialize(data: GraphData) {
    // can't have this in constructor because of in lockable graph addVertex uses locks which is not initialized yet
    for (let i = 0; i < data.labels.length; i++) {
      this.currentColors.set(data.labels[i], data.colors[i]);
    }

    if (data.vertexDirs) {
      for (let i = 0; i < data.labels.length; i++) {
        const dirArr = data.vertexDirs[i];
        this.vertexDirections.set(data.labels[i], new Vector2(dirArr));
      }
    }

    const positionCoef = 2 * this.vertexRadius;
    for (let i = 0; i < data.labels.length; i++) {
      this.addVertex(data.labels[i], [
        data.positions[i][0] * positionCoef,
        data.positions[i][1] * positionCoef,
      ]);
    }
    for (const [from, to] of data.edges) {
      this.addEdge(from, to);
    }
  }

  addVertex(label: string, position: [number, number]) {
    const ref = createRef<Circle>();
    this.vertexMap.set(label, { ref, position });
  }

  public getVertex(label: string): Circle | null {
    const entry = this.vertexMap.get(label);
    return entry ? entry.ref() : null;
  }

  addEdge(fromLabel: string, toLabel: string, deviation: number = 0) {
    const ref = createRef<Spline>();
    const [from, to] = [fromLabel, toLabel];
    this.edges.push({ from, to, ref, deviation });
  }

  protected createVertexNode(label: string) {
    const vertexData = this.vertexMap.get(label);
    return (
      <Circle
        //key={label}
        ref={vertexData.ref}
        size={this.vertexRadius}
        fill={Solarized.gray}
        opacity={0}
        position={vertexData.position}
      >
        {this.debugNodes && <Txt text={label} fontSize={24} fill="black" />}
      </Circle>
    );
  }

  getGraphLayout() {
    const layout = (
      <Layout ref={this.containerRef} layout={false}>
        {this.edges.map((edge, i) => {
          const fromVertex = this.vertexMap.get(edge.from);
          const toVertex = this.vertexMap.get(edge.to);
          return (
            <Spline
              //key={`edge-${i}`}
              ref={edge.ref}
              stroke={Solarized.gray}
              lineWidth={this.vertexRadius * 0.25}
              opacity={0}
              zIndex={-10}
              smoothness={0.6}
              points={generateArcPoints(
                new Vector2(fromVertex.position),
                new Vector2(toVertex.position),
                edge.deviation,
              )}
            />
          );
        })}
        {[...this.vertexMap.entries()].map(([label, _]) =>
          this.createVertexNode(label),
        )}
      </Layout>
    ) as Layout;
    return layout;
  }

  *moveVertex(label: string, newPosition: [number, number], duration: number) {
    const vertex = this.vertexMap.get(label);
    if (vertex) {
      yield* vertex.ref().position(newPosition, duration);
      vertex.position = newPosition;
    }
  }

  *changeVertexColor(label: string, color: string, duration: number = 0.5) {
    const vertex = this.vertexMap.get(label);
    if (vertex) {
      yield* vertex.ref().fill(color, duration);
    }
  }

  *changeVertexSize(label: string, newSize: number, duration: number) {
    const vertex = this.vertexMap.get(label);
    if (vertex) {
      yield* vertex.ref().size(newSize, duration);
    }
  }

  *fadeVerticesSequential(
    initialDelay: number,
    duration: number,
    vertexKeys?: string[],
    newOpacity: number = 1,
  ) {
    let vertices;

    if (vertexKeys && vertexKeys.length > 0) {
      vertices = vertexKeys
        .map((key) => this.vertexMap.get(key))
        .filter((v) => v !== undefined)
        .map((v) => v!.ref());
    } else {
      vertices = [...this.vertexMap.values()].map((v) => v.ref());
    }

    yield* sequence(
      initialDelay,
      ...vertices.map((node) => node.opacity(newOpacity, duration)),
    );
  }

  *fadeEdgesSequential(
    initialDelay: number,
    duration: number,
    edgePairs?: [string, string][],
    newOpacity: number = 1,
  ) {
    let nodesToFade: Array<Shape> = [];

    if (edgePairs && edgePairs.length > 0) {
      // Process edgePairs in given order
      for (const [u, v] of edgePairs) {
        // Find an edge or arc matching this pair
        const edge = this.edges.find(
          (e) => (e.from === u && e.to === v) || (e.from === v && e.to === u),
        );
        if (edge) {
          nodesToFade.push(edge.ref());
          continue;
        }
        // If no matching edge found, just skip or handle error as needed
      }
    } else {
      // Fade in all edges and arcs if no pairs are specified, in their internal order
      nodesToFade = [...this.edges.map((e) => e.ref())];
    }

    yield* sequence(
      initialDelay,
      ...nodesToFade.map((node) => node.opacity(newOpacity, duration)),
    );
  }

  *fadeIn(duration: number) {
    yield* all(
      this.fadeVerticesSequential(0, duration, [], 1),
      this.fadeEdgesSequential(0, duration, [], 1),
    );
  }

  *fadeOut(duration: number) {
    yield* all(
      this.fadeVerticesSequential(0, duration, [], 0),
      this.fadeEdgesSequential(0, duration, [], 0),
    );
  }

  /**
   * Animate showing an arrow pointing at an edge midpoint.
   */
  *pointAtEdge(
    edgePair: [string, string],
    fromLeft: boolean = true,
    duration: number = 1,
    keep: boolean = false,
  ) {
    const edge = this.getEdge(edgePair);

    const fromVertex = this.vertexMap.get(edge.from);
    const toVertex = this.vertexMap.get(edge.to);
    console.log(edge.from + edge.to);

    const startPos = new Vector2(fromVertex.position);
    const endPos = new Vector2(toVertex.position);
    const mid = startPos.add(endPos).scale(0.5);
    const degrees = endPos.sub(startPos).degrees + (fromLeft ? 90 : 270);

    const arrowRef = createRef<Finger>();
    const arrowNode = (
      <Finger
        position={mid}
        rotation={degrees}
        padding={0.25}
        scale={90}
        ref={arrowRef}
        opacity={0}
      />
    );

    yield* this.flashArrow(arrowRef, duration, keep);
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
  *pointAtVertex(vertexLabel: string, duration: number = 1, keep: boolean = false) {
    const vertexData = this.vertexMap.get(vertexLabel);
    if (!vertexData) return;

    const position = new Vector2(vertexData.position);
    const direction = this.vertexDirections.get(vertexLabel)?.degrees ?? 0;

    const arrowRef = createRef<Finger>();
    const arrowNode = (
      <Finger
        position={position}
        rotation={direction}
        padding={0.6}
        scale={120}
        ref={arrowRef}
        opacity={0}
      />
    );

    yield* this.flashArrow(arrowRef, duration, keep);
  }

  private *flashArrow(arrowRef: Reference<Finger>, duration: number, keep: boolean) {
    this.arrows.push(arrowRef);
    this.containerRef().add(arrowRef());
    let fadeDuration = Math.min(duration / 4, Math.max(duration / 10, 1));
    if (duration < 0.3) fadeDuration = 0;
    yield* arrowRef().opacity(1, keep ? fadeDuration : 2 * fadeDuration);
    yield* waitFor(duration - 2 * fadeDuration);

    if (!keep) yield* this.removeArrows(fadeDuration, [arrowRef]);
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
      const chosenEdge = availableEdges[random.nextInt(0, availableEdges.length)];
      const index = this.edges.indexOf(chosenEdge);

      const normalizedDuration = getTimeFractionAt(i + 1) - getTimeFractionAt(i);
      const duration = (normalizedDuration * totalDuration) / totalNormalizedTime;

      yield* this.pointAtEdge(
        [chosenEdge.from, chosenEdge.to],
        true,
        duration,
        i === k - 1,
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
      anims.push(vertexData.ref().fill(targetColor, durationPerVertex));
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

  *uncolor(durationPerVertex: number = 0.5, stepDelay: number = 0.1) {
    yield* sequence(
      stepDelay,
      ...[...this.vertexMap.entries()].map(([_, v]) =>
        v.ref().fill(Solarized.gray, durationPerVertex),
      ),
    );
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function generateArcPoints(
  start: Vector2,
  end: Vector2,
  deviation: number,
): Vector2[] {
  const mid = start.add(end).scale(0.5);
  const perp = end.sub(start).normalized.perpendicular;
  const third = mid.add(perp.scale(deviation));
  return [start, third, end];
}
