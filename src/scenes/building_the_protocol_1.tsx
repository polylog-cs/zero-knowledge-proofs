import { makeScene2D } from '@motion-canvas/2d';
import {
  all,
  chain,
  Color,
  sequence,
  useLogger,
  useRandom,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { Solarized, solarizedPalette } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);
  yield* scene.setup('center', false, false);

  yield* scene.addText('prover', 'I can color this');
  yield* scene.addText('verifier', 'Oh yeah?');
  yield* scene.removeText('both');
  yield* waitFor(1);

  yield* scene.sendGraph('prover');
  yield* waitFor(1);
  yield* scene.graphRef().applyColors();

  yield* waitFor(3);

  let revealedEdge = ['E', 'F'];
  let nonRevealedVertices = exampleGraphData.labels.filter(
    (label) => !revealedEdge.includes(label),
  );

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* waitFor(1);

  yield* all(
    scene.graphRef().pointAtVertex(revealedEdge[0], 1.5),
    scene.graphRef().pointAtVertex(revealedEdge[1], 1.5),
  );

  yield* scene.sendGraph('verifier');
  yield* waitFor(1);

  scene.verifierRef().expression('thinking');

  yield* waitFor(2);

  yield* all(
    scene.graphRef().pointAtVertex(revealedEdge[0], 1, true),
    scene.graphRef().pointAtVertex(revealedEdge[1], 1, true),
  );
  yield* scene.addText('verifier', 'Different\ncolors');
  yield* waitFor(3);

  yield* all(
    scene.graphRef().unlockVertices(undefined, 1),
    scene.removeText('verifier'),
    scene.sendGraph('center'),
    scene.verifierRef().expression('neutral', 0),
  );

  let i = 0;
  const customPalette = solarizedPalette.filter(
    (c) =>
      [Solarized.red, Solarized.blue, Solarized.green].find((x) => x == c) ===
      undefined,
  );
  yield* all(
    chain(
      ...Array.from({ length: 7 }, () => {
        i++;
        return all(
          ...exampleGraphData.labels.map((v) =>
            scene
              .graphRef()
              .changeVertexColor(
                v,
                customPalette[
                  (i +
                    2 * exampleGraphData.colors[exampleGraphData.labels.indexOf(v)]) %
                    customPalette.length
                ],
                0.1,
              ),
          ),
          waitFor(0.8),
        );
      }),
    ),
  );
  yield* scene.graphRef().applyColors(0.1, 0);

  yield* all(scene.graphRef().removeArrows(), scene.removeText('verifier'));
  scene.verifierRef().expression('neutral');

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().unlockVertices();

  revealedEdge = ['D', 'E'];
  nonRevealedVertices = exampleGraphData.labels.filter(
    (label) => !revealedEdge.includes(label),
  );

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  yield* waitFor(2);
  yield* all(
    scene.graphRef().pointAtVertex('C', 1, true),
    scene.graphRef().pointAtVertex('F', 1, true),
  );

  scene.verifierRef().expression('looking');
  scene.proverRef().expression('alarmed');
  yield* waitFor(5);

  yield* waitFor(10);
});
