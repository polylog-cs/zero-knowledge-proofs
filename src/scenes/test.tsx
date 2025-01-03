import { makeScene2D, Rect, Spline } from '@motion-canvas/2d';
import { createRef, useLogger, Vector2, waitFor } from '@motion-canvas/core';

import { logPosition, Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { LockableGraph } from '../utilities_lockable_graph';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  yield* waitFor(1);

  const scene = new ProtocolScene(view);

  // Add participants
  yield* scene.addProver();
  yield* scene.addVerifier();

  // Create a graph in the center
  yield* scene.createGraph();

  yield* scene.basicProtocol(1);
  yield* waitFor(5);
});
