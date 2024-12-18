import { makeScene2D, Spline } from "@motion-canvas/2d";
import { useLogger, waitFor } from "@motion-canvas/core";
import {LockableGraph} from "../utilities_lockable_graph";
import {Graph, exampleGraphData} from "../utilities_graph";
import { Solarized,  logPosition } from "../utilities";

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();
  
  yield* waitFor(1);

  const g = new LockableGraph(50);
  g.initialize(exampleGraphData);

  view.add(g.getGraphLayout());
  yield; // Wait a frame for layout
  
  // Fade in vertices
  yield* g.fadeIn(1);
  
  // Lock both vertices A and B
  yield* g.lockVertices(["A","B"], 1.5);
  yield* waitFor(1);
  
  // Unlock vertex B only
  yield* g.unlockVertices(["B"], 1.5);

  yield* g.pointAtEdge(["A", "B"], true, 3, 50);
  yield* waitFor(1);

  yield* g.pointAtRandomEdges(20, exampleGraphData);
  yield* waitFor(1);
});
