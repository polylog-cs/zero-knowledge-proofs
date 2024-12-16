import {Layout, Line, Circle, Txt, Spline} from "@motion-canvas/2d";
import {createRef, all, sequence, Vector2} from "@motion-canvas/core";
import { Solarized } from "./utilities";

export class Graph {
    private vertexMap = new Map<string, { ref: ReturnType<typeof createRef<Circle>>; position: [number, number]; }>();
    private edges: Array<{ from: string; to: string; ref: ReturnType<typeof createRef<Line>> }> = [];
    
    // circular arcs are stored separately from edges because I like that edges are snapped to vertices but don't know how to do that for arcs
    private arcs: Array<{ from: string; to: string; ref: ReturnType<typeof createRef<Spline>>, deviation: number}> = [];
    public containerRef = createRef<Layout>();

    constructor(public vertexRadius: number = 15) {}

    addVertex(label: string, position: [number, number]) {
        const ref = createRef<Circle>();
        this.vertexMap.set(label, { ref, position });
    }

    public getVertex(label: string): Circle | null {
        const entry = this.vertexMap.get(label);
        return entry ? entry.ref() : null;
    }
    
    addEdge(fromLabel: string, toLabel: string) {
        const ref = createRef<Line>();
        this.edges.push({ from: fromLabel, to: toLabel, ref });
    }

    addArc(fromLabel: string, toLabel: string, deviation: number) {
        const ref = createRef<Spline>();
        this.arcs.push({ from: fromLabel, to: toLabel, ref, deviation});
    }

    getGraphLayout() {
        const layout = (<Layout ref={this.containerRef} layout={false}>
                {this.edges.map((edge, i) => {
                    const fromVertex = this.vertexMap.get(edge.from);
                    const toVertex = this.vertexMap.get(edge.to);
                    return (
                        <Line
                            key={`edge-${i}`}
                            ref={edge.ref}
                            stroke="gray"
                            lineWidth={2}
                            opacity={0}
                            points={[
                                () => fromVertex?.ref()?.position() || [0, 0],
                                () => toVertex?.ref()?.position() || [0, 0]
                            ]}
                        />
                    );
                })}
                {[...this.vertexMap.entries()].map(([label, vertex]) => (
                    <Circle
                        key={label}
                        ref={vertex.ref}
                        size={this.vertexRadius}
                        fill={Solarized.gray}
                        opacity={0}
                        position={vertex.position}
                    >
                    </Circle>
                ))} 
            </Layout>) as Layout; //<Txt text={label} fontSize={24} fill="black" />

            // add arcs
            for (const arc of this.arcs) {
                const arcNode = createArc(
                    layout, 
                    this.getVertex(arc.from).position(),
                    this.getVertex(arc.to).position(), 
                    arc.deviation,
                    Solarized.gray,
                    10
                );
                arc.ref(arcNode);
            }
        return layout;
    }

    *fadeIn(duration: number) {
        const vertexAnimations = [...this.vertexMap.values()].map(v => v.ref().opacity(1, duration));
        const edgeAnimations = this.edges.map(e => e.ref().opacity(1, duration));
        yield* all(...vertexAnimations, ...edgeAnimations);
    }

    *fadeOut(duration: number) {
        const vertexAnimations = [...this.vertexMap.values()].map(v => v.ref().opacity(0, duration));
        const edgeAnimations = this.edges.map(e => e.ref().opacity(0, duration));
        yield* all(...vertexAnimations, ...edgeAnimations);
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

    /**
     * Sequentially fade in vertices (all or a subset) one by one.
     */
    *fadeInSequential(initialDelay: number, duration: number, vertexKeys?: string[]) {
        let vertices;
    
        if (vertexKeys && vertexKeys.length > 0) {
            vertices = vertexKeys
                .map(key => this.vertexMap.get(key))
                .filter(v => v !== undefined)
                .map(v => v!.ref());
        } else {
            vertices = [...this.vertexMap.values()].map(v => v.ref());
        }
    
        const edges = (vertexKeys && vertexKeys.length > 0) 
            ? [] 
            : this.edges.map(e => e.ref());
    
        const allNodes = [...vertices, ...edges];
    
        yield* sequence(
            initialDelay,
            ...allNodes.map(node => node.opacity(1, duration))
        );
    }

    /**
     * Sequentially fade in edges one by one. If edgePairs is provided, only fade in those edges.
     * edgePairs should be an array of [fromLabel, toLabel] pairs.
     */
    *fadeInEdgesSequential(
        initialDelay: number,
        duration: number,
        edgePairs?: [string, string][],
        newOpacity: number = 1
    ) {
        let nodesToFade: Array<ReturnType<typeof createRef>> = [];
    
        if (edgePairs && edgePairs.length > 0) {
            // Process edgePairs in given order
            for (const [u, v] of edgePairs) {
                // Find an edge or arc matching this pair
                const edge = this.edges.find(e =>
                    (e.from === u && e.to === v) || (e.from === v && e.to === u)
                );
                if (edge) {
                    nodesToFade.push(edge.ref());
                    continue;
                }
    
                const arc = this.arcs.find(a =>
                    (a.from === u && a.to === v) || (a.from === v && a.to === u)
                );
                if (arc) {
                    nodesToFade.push(arc.ref());
                }
                // If no matching edge/arc found, just skip or handle error as needed
            }
        } else {
            // Fade in all edges and arcs if no pairs are specified, in their internal order
            nodesToFade = [
                ...this.edges.map(e => e.ref()),
                ...this.arcs.map(a => a.ref())
            ];
        }
    
        yield* sequence(
            initialDelay,
            ...nodesToFade.map(node => node.opacity(newOpacity, duration))
        );
    }
    
}



function generateArcPoints(
    start: Vector2,
    end: Vector2,
    deviation: number,
    numsamples: number
  ): [number, number][] {
    deviation = deviation + 0.001; // Avoid division by zero
    const [x1, y1] = [start.x, start.y];
    const [x2, y2] = [end.x, end.y];
  
    // Chord vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l = Math.sqrt(dx * dx + dy * dy); // chord length
    const s = deviation; // sagitta (deviation)
  
    // Radius of the circle that creates the arc
    // Formula: R = (s/2) + (l²/(8s))
    const R = (s / 2) + (l * l) / (8 * s);
  
    // Midpoint of chord
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
  
    // Unit vector along the chord
    const vx = dx / l;
    const vy = dy / l;
  
    // Perpendicular vector to chord (to create a counterclockwise arc,
    // choose p = (-vy, vx), which rotates the chord direction by +90°)
    const px = -vy;
    const py = vx;
  
    // Center of the circle:
    // Move from midpoint M along p by (R - s)
    const Cx = mx + px * (R - s);
    const Cy = my + py * (R - s);
  
    // Compute start and end angles relative to the center
    let angleS = Math.atan2(y1 - Cy, x1 - Cx);
    let angleE = Math.atan2(y2 - Cy, x2 - Cx);
  
    // Ensure the arc goes counterclockwise
    if (angleE < angleS) {
      angleE += 2 * Math.PI;
    }
  
    // Sample points along the arc
    const points: [number, number][] = [];
    for (let i = 0; i < numsamples; i++) {
      const t = i / (numsamples - 1);
      const θ = angleS + t * (angleE - angleS);
      const X = Cx + R * Math.cos(θ);
      const Y = Cy + R * Math.sin(θ);
      points.push([X, Y]);
    }
  
    return points;
  }
  
// creates a Spline node representing an arc between two points.
// container: The Layout to which we add this arc.
// startPos, endPos: Absolute positions.
// deviation, numsamples: Arc parameters.
export function createArc(
    container: Layout,
    startPos: Vector2,
    endPos: Vector2,
    deviation: number = 50,
    stroke = Solarized.gray,
    numsamples: number = 10
  ): Spline {
    const arcRef = createRef<Spline>();
    const points = generateArcPoints(startPos, endPos, deviation, numsamples);

    const arcElement = (
      <Spline
        ref={arcRef}
        points={points}
        smoothness={0.6}
        stroke={stroke}
        lineWidth={4}
        opacity={0}
        zIndex={-10}
      />
    );
  
    container.add(arcElement);
    return arcRef();
  }

