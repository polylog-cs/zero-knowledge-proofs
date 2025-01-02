import { makeScene2D, Spline, Rect } from '@motion-canvas/2d';
import { useLogger, waitFor, createRef, Vector2 } from '@motion-canvas/core';
import { LockableGraph } from '../utilities_lockable_graph';
import { Graph, exampleGraphData } from '../utilities_graph';
import { Solarized, logPosition } from '../utilities';
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
  yield* scene.createGraph(exampleGraphData, 'center');

  yield* scene.basicProtocol(1);
  yield* waitFor(5);
});
