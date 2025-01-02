import { Layout, Line, Circle, Txt, Spline } from '@motion-canvas/2d';
import { createRef, all, sequence, Vector2, useLogger } from '@motion-canvas/core';
import { Solarized, logValue } from './utilities';

const logger = useLogger();

export interface GraphData {
  labels: string[];
  edges: [string, string][];
  positions: [number, number][];
  sides?: boolean[];
  colors?: number[];
}

// example graph
const l = 100;
export const exampleGraphData: {
  labels: string[];
  edges: [string, string][];
  positions: [number, number][];
  sides: boolean[];
  colors: number[];
  vertexDirs: [number, number][];
} = {
  labels: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'A'],
    ['D', 'C'],
    ['E', 'C'],
    ['F', 'D'],
    ['F', 'E'],
  ],
  positions: [
    [-l, -l],
    [l, -l],
    [0, 0],
    [-l, l],
    [l, l],
    [0, 2 * l],
  ],
  sides: [true, true, true, true, false, true, false],
  colors: [0, 1, 2, 1, 0, 2],
  vertexDirs: [
    [-1, -2],
    [1, -2],
    [-1, 0],
    [-1, 0],
    [1, 0],
    [-1, 2],
  ],
};

export class Graph {
  protected vertexMap = new Map<
    string,
    { ref: ReturnType<typeof createRef<Circle>>; position: [number, number] }
  >();
  protected edges: Array<{
    from: string;
    to: string;
    ref: ReturnType<typeof createRef<Spline>>;
    deviation: number;
  }> = [];
  public containerRef = createRef<Layout>();
  protected debugNodes = false;

  constructor(public vertexRadius: number = 15) {}

  initialize(
    // can't have this in constructor because of in lockable graph addVertex uses locks which is not initialized yet
    data: {
      labels: string[];
      edges: [string, string][];
      positions: [number, number][];
    },
  ) {
    for (let i = 0; i < data.labels.length; i++) {
      this.addVertex(data.labels[i], data.positions[i]);
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
    const [from, to] =
      fromLabel < toLabel ? [fromLabel, toLabel] : [toLabel, fromLabel];
    this.edges.push({ from, to, ref, deviation });
  }

  protected createVertexNode(label: string) {
    const vertexData = this.vertexMap.get(label);
    return (
      <Circle
        key={label}
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
              key={`edge-${i}`}
              ref={edge.ref}
              stroke={Solarized.gray}
              lineWidth={4}
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

  *changeVertexColor(label: string, color: string, duration: number) {
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
    let nodesToFade: Array<ReturnType<typeof createRef>> = [];

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
