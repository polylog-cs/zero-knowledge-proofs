import { makeScene2D, Spline, Rect } from "@motion-canvas/2d";
import { useLogger, waitFor, createRef, Vector2, all } from "@motion-canvas/core";
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
  yield* scene.graphRef().lockVertices(['A', 'B', 'C', 'D']);
  yield* scene.sendGraph('verifier');

  yield* scene.addText('verifier', 'Hm...');


  yield* waitFor(5);


});
