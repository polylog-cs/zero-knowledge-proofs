import { Node, View2D } from '@motion-canvas/2d';
import { all, useLogger, Vector2 } from '@motion-canvas/core';

// all functions use absolute positions

// Assuming a known frame size. Replace these with actual values or computations.
const frameWidth = 1920;
const frameHeight = 1080;

const frameLeft = -frameWidth / 2;
const frameRight = frameWidth / 2;
const frameTop = -frameHeight / 2;
const frameBottom = frameHeight / 2;

type Direction = 'left' | 'right' | 'up' | 'down';
type Corner = 'UL' | 'UR' | 'DL' | 'DR';

// Helper to get node edges from the cached bounding box
function getNodeEdges(node: Node) {
  // cacheBBox returns {x, y, width, height}
  let bbox = node.cacheBBox();
  let p = node.localToWorld().transformPoint(bbox.topLeft);
  let q = node.localToWorld().transformPoint(bbox.bottomRight);
  const left = p.x;
  const right = q.x;
  const top = p.y;
  const bottom = q.y;

  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  return {
    left,
    right,
    top,
    bottom,
    centerX,
    centerY,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Move the node to a given position or another node's position.
 * If duration > 0, animate; otherwise, apply immediately.
 */
export function moveTo(node: Node, newPos: Vector2 | Node, duration: number = 0) {
  const finalPos = newPos instanceof Node ? newPos.absolutePosition() : newPos;

  if (duration <= 0) {
    node.absolutePosition(finalPos);
    return (function* () {})();
  } else {
    return (function* () {
      yield* node.absolutePosition(finalPos, duration);
    })();
  }
}

/**
 * Shift the node by an offset.
 * If duration > 0, animate; otherwise, immediate.
 */
export function shift(node: Node, offset: Vector2, duration: number = 0) {
  offset.x *= node.view().absoluteScale().x;
  offset.y *= node.view().absoluteScale().y;
  const currentPos = node.absolutePosition();
  const finalPos = currentPos.add(offset);

  if (duration <= 0) {
    node.absolutePosition(finalPos);
    return (function* () {})();
  } else {
    return (function* () {
      yield* node.absolutePosition(finalPos, duration);
    })();
  }
}

/**
 * Place node next to another node along a given direction with a buffer.
 * If duration > 0, animate; otherwise, immediate.
 */
export function alignTo(
  node: Node,
  other: Node,
  direction: Direction,
  buff: number = 0,
  duration: number = 0,
) {
  buff *=
    direction == 'up' || direction == 'down'
      ? node.view().absoluteScale().y
      : node.view().absoluteScale().x;
  const n = getNodeEdges(node);
  const o = getNodeEdges(other);

  let finalPos = node.absolutePosition();

  switch (direction) {
    case 'left':
      finalPos = new Vector2(o.left + buff + n.width / 2, finalPos.y);
      break;
    case 'right':
      finalPos = new Vector2(o.right - buff - n.width / 2, finalPos.y);
      break;
    case 'up':
      finalPos = new Vector2(finalPos.x, o.top + buff + n.height / 2);
      break;
    case 'down':
      finalPos = new Vector2(finalPos.x, o.bottom - buff - n.height / 2);
      break;
  }

  if (duration <= 0) {
    node.absolutePosition(finalPos);
    return (function* () {})();
  } else {
    return (function* () {
      yield* node.absolutePosition(finalPos, duration);
    })();
  }
}

export function nextTo(
  node: Node,
  other: Node,
  direction: Direction,
  buff: number = 0,
  duration: number = 0,
) {
  buff *=
    direction == 'up' || direction == 'down'
      ? node.view().absoluteScale().y
      : node.view().absoluteScale().x;
  const n = getNodeEdges(node);
  const o = getNodeEdges(other);

  let finalPos = node.absolutePosition();
  const otherPos = other.absolutePosition();

  switch (direction) {
    case 'left':
      finalPos = new Vector2(o.left - buff - n.width / 2, otherPos.y);
      break;
    case 'right':
      finalPos = new Vector2(o.right + buff + n.width / 2, otherPos.y);
      break;
    case 'up':
      finalPos = new Vector2(otherPos.x, o.top - buff - n.height / 2);
      break;
    case 'down':
      finalPos = new Vector2(otherPos.x, o.bottom + buff + n.height / 2);
      break;
  }

  if (duration <= 0) {
    node.absolutePosition(finalPos);
    return (function* () {})();
  } else {
    return (function* () {
      yield* node.absolutePosition(finalPos, duration);
    })();
  }
}

/**
 * Move the node to the given edge of the frame.
 * direction: 'left'|'right'|'up'|'down'
 * buff: optional padding from the edge
 * duration: if >0, animate
 */
export function toEdge(
  node: Node,
  direction: 'left' | 'right' | 'up' | 'down',
  buff: number = 0,
  duration: number = 0,
) {
  buff *=
    direction == 'up' || direction == 'down'
      ? node.view().absoluteScale().y
      : node.view().absoluteScale().x;
  const n = getNodeEdges(node);
  let finalPos = node.absolutePosition();

  switch (direction) {
    case 'left':
      finalPos = new Vector2(frameLeft + n.width / 2 + buff, finalPos.y);
      break;
    case 'right':
      finalPos = new Vector2(frameRight - n.width / 2 - buff, finalPos.y);
      break;
    case 'up':
      finalPos = new Vector2(finalPos.x, frameTop + n.height / 2 + buff);
      break;
    case 'down':
      finalPos = new Vector2(finalPos.x, frameBottom - n.height / 2 - buff);
      break;
  }

  if (duration <= 0) {
    node.absolutePosition(finalPos);
    return (function* () {})();
  } else {
    return (function* () {
      yield* node.absolutePosition(finalPos, duration);
    })();
  }
}

/**
 * Move the node to a given corner of the frame.
 * corner: 'top_left'|'top_right'|'bottom_left'|'bottom_right'
 * buffX, buffY: optional padding from the edges in X and Y directions
 * duration: if >0, animate
 *
 * Implemented by using toEdge() twice.
 */
export function toCorner(
  node: Node,
  corner: Corner,
  buffX: number = 0,
  buffY: number = 0,
  duration: number = 0,
) {
  buffX *= node.view().absoluteScale().x;
  buffY *= node.view().absoluteScale().y;
  let horizontalDirection: 'left' | 'right';
  let verticalDirection: 'up' | 'down';

  switch (corner) {
    case 'UL':
      horizontalDirection = 'left';
      verticalDirection = 'up';
      break;
    case 'UR':
      horizontalDirection = 'right';
      verticalDirection = 'up';
      break;
    case 'DL':
      horizontalDirection = 'left';
      verticalDirection = 'down';
      break;
    case 'DR':
      horizontalDirection = 'right';
      verticalDirection = 'down';
      break;
  }

  if (duration <= 0) {
    toEdge(node, horizontalDirection, buffX, 0);
    toEdge(node, verticalDirection, buffY, 0);
    return (function* () {})();
  } else {
    return (function* () {
      yield* all(
        toEdge(node, horizontalDirection, buffX, duration),
        toEdge(node, verticalDirection, buffY, duration),
      );
    })();
  }
}

export function absoluteToViewSpace(view: View2D, p: Vector2) {
  const a = view.worldToLocal().transformPoint(p);
  return new Vector2(a.x, a.y);
}
