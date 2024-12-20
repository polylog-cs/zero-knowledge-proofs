import {Node, Layout, Circle, Line, Spline} from "@motion-canvas/2d";
import {createRef, all, sequence, waitFor, useLogger} from "@motion-canvas/core";
import {Lock} from "./utilities_lock"; 
import {Graph} from "./utilities_graph"; 
import {Solarized, shuffleArray, logPosition} from "./utilities"; 
import {Vector2} from "@motion-canvas/core";

export class LockableGraph extends Graph {
    public locks = new Map<string, ReturnType<typeof createRef<Lock>>>();

    // colors
    private palette = [Solarized.blue, Solarized.red, Solarized.green];
    private currentColors = new Map<string, number>();

    // sides array for edges
    private edgeSides: boolean[] = [];

    // Instead of a single arrowRef, we store multiple arrows
    private arrows: ReturnType<typeof createRef<Line>>[] = [];

    public challengeEdge: [string, string] = ["", ""];
    
    private vertexDirections = new Map<string, Vector2>();

    override initialize(data: {
        labels: string[],
        edges: [string, string][],
        positions: [number, number][],
        sides: boolean[],
        colors: number[],
        vertexDirs?: [number, number][],
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
    *pointAtEdge(edgePair: [string, string], fromLeft: boolean = true, duration: number = 1, keep: boolean = false, arrowLength: number = 50) {
        const [fromLabel, toLabel] = edgePair;
        const edge = this.edges.find(e =>
            (e.from === fromLabel && e.to === toLabel) ||
            (e.from === toLabel && e.to === fromLabel)
        );
        if (!edge) return;

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

        const arrowRef = createRef<Line>();
        const arrowNode = (
            <Line
                ref={arrowRef}
                points={[arrowStart, arrowEnd]}
                stroke={Solarized.blue}
                lineWidth={4}
                opacity={0}
                arrowSize={10}
                endArrow
            />
        );

        this.arrows.push(arrowRef);
        this.containerRef().add(arrowRef());
        yield* arrowRef().opacity(1, duration/10);
        yield* waitFor((8*duration)/10);

        if (!keep) {
            yield* this.removeArrows(duration/10, [arrowRef]);
        }
    }

    /**
     * Point an arrow at the given vertex.
     */
    *pointAtVertex(vertexLabel: string, duration: number = 1, keep: boolean = false, arrowLength: number = 80, buff: number = 50) {
        const vertexData = this.vertexMap.get(vertexLabel);
        if (!vertexData) return;

        const position = new Vector2(vertexData.position);
        let direction = this.vertexDirections.get(vertexLabel);
        if (!direction) {
            direction = new Vector2([arrowLength, 0]);
        }

        const arrowStart = position.add(direction.normalized.scale(arrowLength + buff));
        const arrowEnd = position.add(direction.normalized.scale(buff));

        const arrowRef = createRef<Line>();
        const arrowNode = (
            <Line
                ref={arrowRef}
                points={[arrowStart, arrowEnd]}
                stroke={Solarized.blue}
                lineWidth={4}
                opacity={0}
                arrowSize={10}
                endArrow
            />
        );

        this.arrows.push(arrowRef);
        this.containerRef().add(arrowRef());

        yield* arrowRef().opacity(1, duration/10);
        yield* waitFor((8*duration)/10);


        if (!keep) {
            yield* this.removeArrows(duration/10, [arrowRef]);
        }
    }

    /**
     * Remove specified arrows or all if none specified.
     * Fade them out and remove from scene and array.
     */
    *removeArrows(duration: number = 0.5, specificArrows?: ReturnType<typeof createRef<Line>>[]) {
        const toRemove = specificArrows ?? this.arrows;

        const fadeOuts = toRemove.map(ref => ref().opacity(0, duration));
        yield* all(...fadeOuts);

        for (const ref of toRemove) {
            ref().remove();
        }

        if (!specificArrows) {
            this.arrows = [];
        } else {
            // Remove only those specified from the arrows array
            this.arrows = this.arrows.filter(ar => !toRemove.includes(ar));
        }
    }

    *pointAtRandomEdges(k: number, duration: number = 1, arrowLength: number = 50, finalEdge?: [string, string]) {
        if (this.edges.length <= 1) {
            return;
        }

        let [finFrom, finTo] = ["", ""];
        if(finalEdge != undefined){
            [finFrom, finTo] = finalEdge[0] < finalEdge[1] ? finalEdge : [finalEdge[1], finalEdge[0]];
        }
        
        let lastEdge: (typeof this.edges)[0] | null = null;
        for (let i = 0; i < k; i++) {
            const availableEdges = this.edges.filter(e => e !== lastEdge);
            if(finalEdge != undefined && i == k-1){
                const availableEdges = this.edges.filter(e => e.from === finFrom && e.to === finTo);
            }
            const chosenEdge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
            const index = this.edges.indexOf(chosenEdge);

            const side = (index >= 0 && index < this.edgeSides.length) ? this.edgeSides[index] : true;

            yield* this.pointAtEdge([chosenEdge.from, chosenEdge.to], side, duration, i === k - 1, arrowLength);
            lastEdge = chosenEdge;
        }

        this.challengeEdge = [lastEdge.from, lastEdge.to];
    }

    *applyColors(
        durationPerVertex: number = 0.5,
        stepDelay: number = 0.1,
        newColors?: Map<string, number>
    ) {
        if (newColors) {
            this.currentColors = newColors;
        }
    
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
