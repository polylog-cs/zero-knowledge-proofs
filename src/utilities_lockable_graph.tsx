import {Node, Layout, Circle, Line, Spline, remove} from "@motion-canvas/2d";
import {createRef, all, sequence, waitFor, useLogger} from "@motion-canvas/core";
import {Lock} from "./utilities_lock"; 
import {Graph} from "./utilities_graph"; 
import {Solarized, shuffleArray} from "./utilities"; 
import {Vector2} from "@motion-canvas/core";

export class LockableGraph extends Graph {
    public locks = new Map<string, ReturnType<typeof createRef<Lock>>>();

    // colors
    private palette = [Solarized.blue, Solarized.red, Solarized.green];
    private currentColors = new Map<string, number>();

    // sides array indicating fromLeft or not for each edge
    private edgeSides: boolean[] = [];
    private arrowRef = createRef<Line>(); // last arrow removed by removeArrow
    public challengeEdge: [string, string] = ["", ""];
    
    override initialize(data: {
        labels: string[],
        edges: [string, string][],
        positions: [number, number][],
        sides: boolean[],
        colors: number[]
    }) {
        super.initialize({
            labels: data.labels,
            edges: data.edges,
            positions: data.positions,
        });

        for (let i = 0; i < data.labels.length; i++) {
            this.currentColors.set(data.labels[i], data.colors[i]);
        }

        this.edgeSides = data.sides;
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
                <Lock 
                    ref={lock}
                    object={vertexData.ref()} 
                />
            </Node>
        );
    }

    *lockVertices(vertices: string[] = [], duration: number = 1.5) {
        const animations: Generator[] = [];
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
        const animations: Generator[] = [];
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
    *pointAtEdge(edgePair: [string, string], fromLeft: boolean = true, duration: number = 1, arrowLength: number = 50, keep: boolean = false) {
        const [fromLabel, toLabel] = edgePair;
        const edge = this.edges.find(e =>
            (e.from === fromLabel && e.to === toLabel) ||
            (e.from === toLabel && e.to === fromLabel)
        );
        const fromVertex = this.vertexMap.get(edge.from);
        const toVertex = this.vertexMap.get(edge.to);

        const startPos = new Vector2(fromVertex.position);
        const endPos = new Vector2(toVertex.position);
        const mid = startPos.add(endPos).scale(0.5);
        const dir = endPos.sub(startPos);
        let perp = dir.perpendicular;
        if (!fromLeft) {
            perp = perp.scale(-1);
        }
        perp = perp.normalized.scale(arrowLength);

        const arrowStart = mid.add(perp);
        const arrowEnd = mid;

        const arrowNode = (
            <Line
                ref={this.arrowRef}
                points={[arrowStart, arrowEnd]}
                stroke={Solarized.blue}
                lineWidth={4}
                opacity={0}
                arrowSize={10}
                endArrow
            />
        );

        this.containerRef().add(this.arrowRef());
        yield* this.arrowRef().opacity(1, duration/10);
        yield* waitFor(8*duration/10);

        if (!keep) {
            yield* this.removeArrow(duration/10);
        }
    }

    *removeArrow(duration: number = 0.33) {
        yield* this.arrowRef().opacity(0, duration);
        this.arrowRef().remove();
    }

    /**
     * Point at random edges k times, using stored edgeSides to determine direction.
     * the last arrow is not removed. 
     */
    *pointAtRandomEdges(k: number, duration: number = 1, arrowLength: number = 50) {
        if (this.edges.length <= 1) {
            return;
        }
    
        let lastEdge: (typeof this.edges)[0] | null = null;
        for (let i = 0; i < k; i++) {
            const availableEdges = this.edges.filter(e => e !== lastEdge);
            const chosenEdge = availableEdges[Math.floor(Math.random() * availableEdges.length)];

            // Find index of chosenEdge in this.edges to get side
            const index = this.edges.indexOf(chosenEdge);
            const actualFromLeft = (index >= 0 && index < this.edgeSides.length) ? this.edgeSides[index] : true;

            yield* this.pointAtEdge([chosenEdge.from, chosenEdge.to], actualFromLeft, duration, arrowLength, i === k - 1);
            lastEdge = chosenEdge;
        }

        this.challengeEdge = [lastEdge.from, lastEdge.to];
    }

    /**
     * Apply colors to the vertices using currentColors.
     * Animates sequentially (one after another).
     */
    *applyColors(durationPerVertex: number = 0.5, stepDelay: number = 0.1) {
        const anims: Generator[] = [];
        for (const [label, cIndex] of this.currentColors.entries()) {
            const vertexData = this.vertexMap.get(label);
            if (!vertexData) continue;
            const targetColor = this.palette[cIndex % this.palette.length];
            anims.push((function*() {
                yield* vertexData.ref().fill(targetColor, durationPerVertex);
            })());
        }
        yield* sequence(stepDelay, ...anims);
    }

    /**
     * Shuffle the palette randomly and re-apply the current colors to the vertices.
     * Ensure the new palette ordering is different from the old one.
     */
    *shuffleColors(durationPerVertex: number = 0.5, stepDelay: number = 0.0) {
        if (this.currentColors.size === 0) {
            return;
        }

        const oldPalette = [...this.palette];
        do {
            shuffleArray(this.palette);
        } while (this.arraysEqual(this.palette, oldPalette));

        yield* this.applyColors(durationPerVertex, stepDelay);
    }

    private arraysEqual(a: string[], b: string[]): boolean {
        return a.length === b.length && a.every((value, index) => value === b[index]);
    }
}
