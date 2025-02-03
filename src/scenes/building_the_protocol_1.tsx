import { makeScene2D } from '@motion-canvas/2d';
import {
  all,
  chain,
  Color,
  sequence,
  useLogger,
  useRandom,
  waitFor,
} from '@motion-canvas/core';

import { Solarized } from '../utilities';
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

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().applyColors();

  let revealedEdge = ['E', 'F'];
  let nonRevealedVertices = exampleGraphData.labels.filter(
    (label) => !revealedEdge.includes(label),
  );

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  scene.verifierRef().expression('thinking');

  yield* all(
    scene.graphRef().pointAtVertex(revealedEdge[0], 1, true),
    scene.graphRef().pointAtVertex(revealedEdge[1], 1, true),
  );

  yield* scene.addText('verifier', 'Different colors');

  let i = 0;
  yield* all(scene.graphRef().unlockVertices(undefined, 1), scene.sendGraph('center'));
  yield* all(
    chain(
      ...Array.from({ length: 7 }, () => {
        i++;
        function shift(c: Color) {
          return c
            .set('hsl.h', (c.get('hsl.h') + i * 160) % 360)
            .set('hsl.s', 0.7)
            .set('hsl.l', 0.4);
        }
        return all(
          ...exampleGraphData.labels.map((v) =>
            scene
              .graphRef()
              .changeVertexColor(
                v,
                shift(scene.graphRef().getVertex(v).fill() as Color).css(),
                0.15,
              ),
          ),
          waitFor(0.5),
        );
      }),
    ),
  );
  yield* scene.graphRef().applyColors(0.15, 0);

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

  scene.verifierRef().expression('looking');
  scene.proverRef().expression('alarmed');

  yield* all(
    scene.graphRef().pointAtVertex('C', 1, true),
    scene.graphRef().pointAtVertex('F', 1, true),
  );

  yield* waitFor(1);
  yield* all(scene.graphRef().containerRef().opacity(0, 1), scene.removeText('both'));
});
