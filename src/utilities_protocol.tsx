import {Node, Layout, Img, Txt, makeScene2D, Rect} from '@motion-canvas/2d';
import {createRef, Vector2, waitFor, all} from '@motion-canvas/core';
import {LockableGraph} from './utilities_lockable_graph'; 
import {nextTo, moveTo} from './utilities_moving';
import {exampleGraphData, GraphData} from './utilities_graph'; 
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
    private centerPosition = new Vector2(0,0);
    private graphBuffer = 50;

    // Text references for prover and verifier
    private proverTextRef = createRef<Txt>();
    private verifierTextRef = createRef<Txt>();

    constructor(private view: Layout) {
        view.add(
          <Layout ref={this.containerRef} layout={false} />
        );
    }

    /**
     * Add a participant image (prover or verifier).
     * @param which 'prover' or 'verifier'
     * @param path optional custom image path
     */
    public *addParticipant(which: 'prover'|'verifier', path?: string) {
        const ref = (which === 'prover') ? this.proverRef : this.verifierRef;
        const defaultPath = (which === 'prover') ? proverImage : verifierImage;
        const position = (which === 'prover') ? this.proverPosition : this.verifierPosition;

        this.containerRef().add(
            <Img
              ref={ref}
              src={path ?? defaultPath}
              position={position}
              opacity={0}
            />
        );
        yield* ref().opacity(1, 1);
    }

    /**
     * Add text next to either prover or verifier.
     * The text will appear next to their image.
     */
    public *addText(which: 'prover'|'verifier', text: string) {
        const targetRef = (which === 'prover') ? this.proverRef : this.verifierRef;
        const textRef = (which === 'prover') ? this.proverTextRef : this.verifierTextRef;

        this.containerRef().add(
            <Txt
              ref={textRef}
              text={text}
              opacity={0}
              fontSize={40}
              fill={Solarized.text}
            />
        );

        nextTo(textRef(), targetRef(), 'up', 50, 0);

        yield* textRef().opacity(1, 0.5);
        yield* waitFor(0.5);
    }

    /**
     * Remove the previously added text from either prover or verifier.
     */
    public *removeText(which: 'prover'|'verifier'|'both') {
        if(which == 'both'){
            yield* all(
                this.removeText('prover'),
                this.removeText('verifier')
            )
        }
        else{
            const textRef = (which === 'prover') ? this.proverTextRef : this.verifierTextRef;
            if (textRef() === undefined) {
                return;
            }
            yield* textRef().opacity(0, 1);
            textRef().remove();    
        }
    }

    /**
     * Create a LockableGraph from data and fade it in at the center (or near prover/verifier).
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

        this.graphRef = () => g;

        // Fade in
        yield* g.fadeIn(1);
    }

    /**
     * Sends the graph to a target location: 'center', 'prover', or 'verifier'.
     */
    public *sendGraph(target: 'center' | 'prover' | 'verifier', duration: number = 1) {
        const g = this.graphRef();
        if (!g) return;
        let finalPos = this.centerPosition;

        switch(target) {
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
