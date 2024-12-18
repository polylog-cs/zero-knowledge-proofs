import {Node, Layout, Circle, Line} from "@motion-canvas/2d";
import {createRef, all, Vector2, waitFor} from "@motion-canvas/core";
import {Lock} from "./utilities_lock"; // import your Lock class
import {Graph} from "./utilities_graph"; // adjust the path as needed
import {Solarized} from "./utilities"; // adjust the path as needed

export class LockableGraph extends Graph {
    public locks = new Map<string, ReturnType<typeof createRef<Lock>>> ();

    override addVertex(label: string, position: [number, number]) {
        super.addVertex(label, position);

        const lockRef = createRef<Lock>();
        this.locks.set(label, lockRef);
    }

    protected override createVertexNode(label: string) {
        const vertexData = this.vertexMap.get(label);
        const lock = this.locks.get(label);
        const circle = vertexData.ref();

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
                    ref = {this.locks.get(label)}
                    object={vertexData.ref()} 
                />
            </Node>
        );
    }

    *lockVertices(vertices: string[], duration: number = 1.5) {
        const animations: Generator[] = [];
        for (const v of vertices) {
            const lock = this.locks.get(v)();
            if (lock) {
                animations.push(lock.lock(duration));
            }
        }
        yield* all(...animations);
    }

    *unlockVertices(vertices: string[], duration: number = 1.5) {
        const animations: Generator[] = [];
        for (const v of vertices) {
            const lock = this.locks.get(v)();
            if (lock) {
                animations.push(lock.unlock(duration));
            }
        }
        yield* all(...animations);
    }


    /**
     * Animate showing an arrow pointing at the midpoint of a given edge.
     * @param edgePair A tuple [fromLabel, toLabel] specifying the edge.
     * @param fromLeft If true, arrow is drawn from the "left" side of the edge direction; if false, from the "right".
     * @param duration Duration of the animation in seconds.
     * @param arrowLength The length of the arrow line.
     */
    *pointAtEdge(
        edgePair: [string, string], 
        fromLeft: boolean = true, 
        duration: number = 1, 
        arrowLength: number = 50
    ) {
        const [fromLabel, toLabel] = edgePair;
        const edge = this.edges.find(e =>
            (e.from === fromLabel && e.to === toLabel) ||
            (e.from === toLabel && e.to === fromLabel)
        );

        const fromVertex = this.vertexMap.get(edge.from);
        const toVertex = this.vertexMap.get(edge.to);

        // Compute midpoint and direction
        const startPos = new Vector2(fromVertex.position);
        const endPos = new Vector2(toVertex.position);
        const mid = startPos.add(endPos).scale(0.5);
        const dir = endPos.sub(startPos);
        let perp = dir.perpendicular;
        if (!fromLeft) {
            perp = perp.scale(-1);
        }
        perp = perp.normalized.scale(arrowLength);

        // Arrow start at midpoint + perp, end at midpoint
        const arrowStart = mid.add(perp);
        const arrowEnd = mid;

        // Create a line node for the arrow
        const arrowRef = createRef<Line>();
        // Optional: a small circle at the arrow tip to mimic an arrowhead
        const arrowHeadRef = createRef<Circle>();

        const arrowNode = (
            <Line
                ref={arrowRef}
                points={[arrowStart, arrowEnd]} // Start collapsed
                stroke={Solarized.blue}
                lineWidth={4}
                opacity={0}
                arrowSize = {10}
                endArrow
            />
        );

        this.containerRef().add(arrowNode);
        yield* all(
            arrowRef().opacity(1, duration/3),
        );
        yield* waitFor(duration/3);
        yield* all(
            arrowRef().opacity(0, duration/3),
        );
        arrowNode.remove(); 
    }

    *pointAtRandomEdges(
        k: number,
        data?: {
            labels: string[];
            edges: [string, string][];
            positions: [number, number][];
            sides: boolean[];
        },
        duration: number = 1,
        arrowLength: number = 50
    ) {
        if (this.edges.length === 0 || this.edges.length === 1) {
            return;
        }
    
        let lastEdge = null;    
        for (let i = 0; i < k; i++) {
            const availableEdges = this.edges.filter(e => e !== lastEdge);
            const chosenEdge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
    
            let actualFromLeft = true; 
            if (data && data.edges && data.sides) {
                const index = data.edges.findIndex(([f, t]) =>
                    (f === chosenEdge.from && t === chosenEdge.to) ||
                    (f === chosenEdge.to && t === chosenEdge.from)
                );    
                if (index >= 0 && index < data.sides.length) {
                    actualFromLeft = data.sides[index]; 
                }
            }
    
            yield* this.pointAtEdge([chosenEdge.from, chosenEdge.to], actualFromLeft, duration, arrowLength);
    
            lastEdge = chosenEdge;
        }
    }
    
}
