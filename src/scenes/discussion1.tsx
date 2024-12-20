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
  yield* scene.createGraph(exampleGraphData, 'verifier', 0);
  yield* scene.graphRef().applyColors();
  yield* scene.graphRef().lockVertices();
  yield* scene.graphRef().containerRef().opacity(1, 1);

  yield* scene.graphRef().pointAtRandomEdges(10, 1, 50, ['A', 'B']);
  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);

  yield* all(
    scene.graphRef().removeArrows(),
    scene.graphRef().unlockVertices(),
    scene.graphRef().containerRef().opacity(0, 1),
  )
  // improper coloring example

  const improperColoring: Map<string, number> = new Map([['A', 0], ['B', 1], ['C', 0], ['D', 2], ['E', 0], ['F', 1]]);
  yield* scene.graphRef().applyColors(1, 0.2, improperColoring);
  
  
  yield* waitFor(5);

});
