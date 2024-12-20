import { makeScene2D, Spline, Rect } from "@motion-canvas/2d";
import { useLogger, waitFor, createRef, Vector2, all, sequence } from "@motion-canvas/core";
import {LockableGraph} from "../utilities_lockable_graph";
import {Graph, exampleGraphData} from "../utilities_graph";
import { Solarized,  logPosition } from "../utilities";
import { ProtocolScene } from "../utilities_protocol";

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  yield* waitFor(1);

  const scene = new ProtocolScene(view);

  yield* all(
    scene.addParticipant('prover'),
    scene.addParticipant('verifier')
  )


  // Create a graph in the center + trash talks
  yield* scene.createGraph(exampleGraphData, 'center');

  yield* scene.addText('prover', 'I can color this');
  yield* scene.addText('verifier', 'Oh yeah?');
  yield* scene.removeText('both');

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().applyColors();

  let revealedEdge = ['E', 'F'];
  let nonRevealedVertices = exampleGraphData.labels.filter(label => !revealedEdge.includes(label));

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  yield* scene.addText('verifier', 'Hm...🧐');

  yield* all(
    scene.graphRef().pointAtVertex(revealedEdge[0], 1, true),
    scene.graphRef().pointAtVertex(revealedEdge[1], 1, true),
  );

  yield* scene.addText('verifier', 'Different colors');

  yield* all(
    scene.graphRef().removeArrows(),
    scene.removeText('verifier'),
  );
  

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().unlockVertices();

  yield* all( // TODO fix
    scene.graphRef().lockVertices(nonRevealedVertices, 5),
    sequence(
      0.1,
      ...Array.from({length: 7}, () => scene.graphRef().shuffleColors())
    )
  )
  yield* scene.graphRef().unlockVertices();

  revealedEdge = ['C', 'F'];
  nonRevealedVertices = exampleGraphData.labels.filter(label => !revealedEdge.includes(label));

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  yield* scene.addText('verifier', '👀');

  yield* all(
    scene.graphRef().containerRef().opacity(0, 1),
    scene.removeText('both'),
  );

  yield* waitFor(5);

  // predel, ted zacneme vysvetlovat protokol

  yield* all(
    scene.graphRef().unlockVertices(),
    scene.sendGraph('prover'),
  );
  yield* scene.graphRef().containerRef().opacity(1, 1);


  yield* all(
    scene.addText('prover', '1. Lock the colors'),
    scene.graphRef().lockVertices(),
  );

  yield* scene.sendGraph('verifier');

  const challengeEdge: [string, string] = ['A', 'B'];
  yield* all(
    scene.addText('verifier', '2. Challenge an edge'),
    scene.graphRef().pointAtEdge(challengeEdge, true, 1, false),
  );
  
  yield* all(
    scene.addText('prover', '3. Reveal the colors'),
    scene.graphRef().unlockVertices(challengeEdge),
    scene.graphRef().removeArrows(),
  );

  yield* all(
    scene.addText('verifier', '4. Check the colors'),
  )

  yield* waitFor(5);

});
