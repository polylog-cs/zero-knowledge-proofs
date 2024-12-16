import {Layout, Line, Circle, Txt, Spline} from "@motion-canvas/2d";
import {createRef, all, sequence, Vector2, useLogger } from "@motion-canvas/core";
import { Solarized, logValue } from "./utilities";

const logger = useLogger();

export class Graph {
    private vertexMap = new Map<string, { ref: ReturnType<typeof createRef<Circle>>; position: [number, number]; }>();
    private edges: Array<{ from: string; to: string; ref: ReturnType<typeof createRef<Spline>>, deviation: number}> = [];
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
    
    addEdge(fromLabel: string, toLabel: string, deviation: number = 0) {
        const ref = createRef<Spline>();
        this.edges.push({ from: fromLabel, to: toLabel, ref, deviation });
    }

    getGraphLayout() {
        const layout = (<Layout ref={this.containerRef} layout={false}>
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
                            points={generateArcPoints(new Vector2(fromVertex.position), new Vector2(toVertex.position), edge.deviation)}
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
                // If no matching edge found, just skip or handle error as needed
            }
        } else {
            // Fade in all edges and arcs if no pairs are specified, in their internal order
            nodesToFade = [
                ...this.edges.map(e => e.ref()),
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
  ): Vector2[] {
	const mid = start.add(end).scale(.5);
	const perp = end.sub(start).normalized.perpendicular;
	const third = mid.add(perp.scale(deviation));
	return [start, third, end];
}
