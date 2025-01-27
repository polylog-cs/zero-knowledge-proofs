import { Node } from '@motion-canvas/2d';
import { all, createRef, Reference, ThreadGenerator } from '@motion-canvas/core';

import { Graph } from './utilities_graph';
import { Lock } from './utilities_lock';

export class LockableGraph extends Graph {
  public locks = new Map<string, Reference<Lock>>();

  override addVertex(label: string, position: [number, number]) {
    super.addVertex(label, position);
    const lockRef = createRef<Lock>();
    this.locks.set(label, lockRef);
  }

  protected override createVertexNode(label: string) {
    const vertexData = this.vertexMap.get(label);
    const lock = this.locks.get(label);

    return (
      <Node key={`Node-${label}`}>
        {super.createVertexNode(label)}
        <Lock ref={lock} object={vertexData.ref()} />
      </Node>
    );
  }

  *lockVertices(vertices: string[] = [], duration: number = 1.5) {
    const animations: ThreadGenerator[] = [];
    if (vertices.length === 0) {
      vertices = [...this.vertexMap.keys()];
    }
    for (const v of vertices) {
      const lock = this.locks.get(v)();
      if (lock) {
        animations.push(lock.lock(duration));
      }
    }
    yield* all(...animations);
  }

  *unlockVertices(vertices: string[] = [], duration: number = 1.5) {
    const animations: ThreadGenerator[] = [];
    if (vertices.length === 0) {
      vertices = [...this.vertexMap.keys()];
    }
    for (const v of vertices) {
      const lock = this.locks.get(v)();
      if (lock) {
        animations.push(lock.unlock(duration));
      }
    }
    yield* all(...animations);
  }

  *setSeeThrough(seethrough: boolean) {
    yield* all(
      ...[...this.locks.entries()].map(([_, lock]) => {
        return (function* () {
          if (seethrough) yield* lock().seethrough();
          else yield* lock().unseethrough();
        })();
      }),
    );
  }
}
