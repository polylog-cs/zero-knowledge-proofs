import {Node, Layout, Img, makeScene2D} from '@motion-canvas/2d';
import {createRef, Vector2, waitFor, all} from '@motion-canvas/core';
import {LockableGraph} from './utilities_lockable_graph'; 
import {nextTo, moveTo} from './utilities_moving';
import {exampleGraphData, GraphData} from './utilities_graph'; 


import proverImage from './assets/images/prover.png';
import verifierImage from './assets/images/verifier.png';


export class ProtocolScene {
    // References to main nodes
    public proverRef = createRef<Img>();
    public verifierRef = createRef<Img>();
    public graphRef = createRef<LockableGraph>();
    public containerRef = createRef<Layout>();

    // Positions or layout decisions
    private proverPosition = new Vector2(-600, 0);
    private verifierPosition = new Vector2(600, 0);
    private centerPosition = new Vector2(0,0);

    private graphBuffer = 50;

    constructor(private view: Layout) {
        view.add(
          <Layout ref={this.containerRef} layout={false} />
        );
    }

    /**
     * Add the prover image on the left side of the scene.
     * @param path The image file path
     */
    public *addProver(path: string = proverImage) {
        this.containerRef().add(
                <Img
                  ref={this.proverRef}
                  src={path}
                  position={this.proverPosition}
                  opacity={0}
                />
            );
            yield* this.proverRef().opacity(1, 1);
        }

    /**
     * Add the verifier image on the right side of the scene.
     * @param path The image file path
     */
    public *addVerifier(path: string = verifierImage) {
        this.containerRef().add(
            <Img
              ref={this.verifierRef}
              src={path}
              position={this.verifierPosition}
              opacity={0}
            />
        );
        yield* this.verifierRef().opacity(1, 1);
    }

    /**
     * Create a LockableGraph from data and fade it in at the center (or near prover/verifier).
     * @param data Graph data (labels, edges, positions, etc.)
     */
    public *createGraph(data: GraphData, initialPosition: 'center' | 'prover' | 'verifier' = 'center') {
        const g = new LockableGraph(50);
        g.initialize(data); 
        const graphLayout = g.getGraphLayout();
        this.containerRef().add(graphLayout);

        // Position depending on initialPosition
        switch(initialPosition) {
            case 'center':
                g.containerRef().position(this.centerPosition);
                break;
            case 'prover':
                g.containerRef().position(this.proverPosition.add(new Vector2(100,0))); 
                break;
            case 'verifier':
                g.containerRef().position(this.verifierPosition.add(new Vector2(-100,0)));
                break;
        }

        this.graphRef = createRef<LockableGraph>();
        this.graphRef = () => g;

        // Fade in
        yield* g.fadeIn(1);
    }

    /**
     * Sends the graph to a target location: 'center', 'prover', or 'verifier'.
     * Uses next_to or move_to from our helpers.
     */
    public *sendGraph(target: 'center' | 'prover' | 'verifier', duration: number = 1) {
        const g = this.graphRef();
        if (!g) return;
        let finalPos = this.centerPosition;

        switch(target) {
            case 'center':
                break;
            case 'prover':
                yield* nextTo(g.containerRef(), this.proverRef(), 'left', this.graphBuffer, duration);
                return;
            case 'verifier':
                yield* nextTo(g.containerRef(), this.verifierRef(), 'right', this.graphBuffer, duration);
                return;
        }

        yield* moveTo(g.containerRef(), finalPos, duration);
    }


    public *shufflingColors(unlock: boolean = true){
        if (unlock) {
            yield* this.graphRef().unlockVertices();
        }
        for(let i = 0; i < 5; i++){
            yield* this.graphRef().shuffleColors();
        }
        yield* waitFor(0.5); 
        yield* this.graphRef().lockVertices();
        yield* waitFor(0.5); 
    }

    public *challenge(){
        yield* this.graphRef().pointAtRandomEdges(5, 0.5);
        yield* waitFor(0.5);

        yield* this.graphRef().unlockVertices(this.graphRef().challengeEdge);
        yield* waitFor(0.5);

        yield* this.graphRef().removeArrow();
    }

    public *oneRound(firstRound: boolean = false){
        
        yield* this.shufflingColors(!firstRound);

        yield* this.sendGraph('verifier', 1);
        yield* waitFor(0.5); 

        yield* this.challenge();
        yield* waitFor(0.5);

        yield* this.sendGraph('prover', 1);
        yield* waitFor(0.5);
        
        yield* this.graphRef().unlockVertices();
        yield* waitFor(0.5);
    };

    // assumes that the graph exists
    public *basicProtocol(numRounds: number = 3){
        if (this.graphRef() === undefined) {
            return;
        }
        yield* this.sendGraph('prover', 1);
        yield* this.graphRef().applyColors(0.5, 0.3);
        yield* waitFor(0.5);

        for(let i = 0; i < numRounds; i++){
            yield* this.oneRound(i === 0);
        }
    }

}