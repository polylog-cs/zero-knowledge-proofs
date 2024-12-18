import { makeScene2D, Spline, Rect } from "@motion-canvas/2d";
import { useLogger, waitFor, createRef, Vector2 } from "@motion-canvas/core";
import {LockableGraph} from "../utilities_lockable_graph";
import {Graph, exampleGraphData} from "../utilities_graph";
import { Solarized,  logPosition } from "../utilities";
import {next_to} from "../utilities_moving";

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();
  
  yield* waitFor(1);

  const g = new LockableGraph(50);
  g.initialize(exampleGraphData);
  view.add(g.getGraphLayout());
  yield* g.fadeIn(1);

  const rect = createRef<Rect>();
  view.add(
    <Rect
      ref={rect}
      width={100}
      height={100}
      fill={Solarized.base3}
      position={[0, 0]}
    />
  );

  yield* next_to(rect(), g.containerRef(), 'right', 50, 1);
  yield* waitFor(3);

});
